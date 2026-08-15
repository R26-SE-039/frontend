import { useState, useEffect, useRef, useCallback } from 'react';
import { createWorkletBlobUrl } from '../utils/audioWorkletProcessor';
import { useMeetingStore } from '../store/useMeetingStore';
import { meetingApi } from '../api/meetingApi';

import { WS_BASE_URL } from '../api/config';

const BASE_WS_URL = `${WS_BASE_URL}/speech/ws`;

export interface TranscriptSegment {
    text: string;
    speaker_id: string;
    timestamp: string;
}

export interface AcousticFeatures {
    pitch: number;
    energy: number;
}

export interface UseSpeechSocketReturn {
    isMicActive: boolean;
    isConnected: boolean;
    acousticFeatures: AcousticFeatures;
    toggleMic: () => Promise<void>;
    sendChat: (text: string) => void;
}

/**
 * Hook to manage WebSocket connection and real-time audio streaming.
 * 
 * - WebSocket connects immediately on mount (always open).
 * - Mic starts MUTED. User unmutes to begin streaming audio.
 * - Audio is sent as raw 16-bit PCM over the WebSocket.
 * - Transcription results come back as JSON.
 */
export const useSpeechSocket = (isMeetingEnded: boolean = false): UseSpeechSocketReturn => {
    const [isMicActive, setIsMicActive] = useState<boolean>(false);
    const [acousticFeatures, setAcousticFeatures] = useState<AcousticFeatures>({ pitch: 0, energy: 0 });
    const [isConnected, setIsConnected] = useState<boolean>(false);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const workletBlobUrlRef = useRef<string | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastMeetingIdRef = useRef<string | null>(null);
    const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttemptsRef = useRef<number>(0);

    const {
        user, addTranscriptEntry, isMuted, setParticipants, addChatMessage,
        clearTranscript, clearChat, addRequirements, addConflicts
    } = useMeetingStore();

    // Refs to avoid stale closures in WS callbacks.
    // isMutedRef is initialized with live value (not hardcoded true) so it's
    // correct even if the store has a non-default value on first render.
    const isMutedRef = useRef<boolean>(isMuted);
    const startMicRef = useRef<() => Promise<void>>(async () => { });
    const stopMicRef = useRef<() => void>(() => { });
    const isMeetingEndedRef = useRef<boolean>(isMeetingEnded);

    // Keep isMutedRef in sync so ws.onopen can read current value without stale closure
    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    useEffect(() => {
        isMeetingEndedRef.current = isMeetingEnded;
        if (isMeetingEnded) {
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null; // Prevent reconnect
                wsRef.current.close();
                wsRef.current = null;
            }
            setIsConnected(false);
            stopMicRef.current(); // Stop the microphone and AudioWorklet
        }
    }, [isMeetingEnded]);

    // ─── WebSocket: Connect on mount, auto-reconnect ───────────────
    const connectWebSocket = useCallback(() => {
        if (!user?.meetingId || isMeetingEndedRef.current) return;

        // If meeting ID changed, force close old connection and CLEAR LOCAL STATE
        if (lastMeetingIdRef.current !== user.meetingId) {
            console.log('[WS] Meeting ID changed, clearing old state and reconnecting');

            // Clear the store so we don't see previous meeting's data
            clearTranscript();
            clearChat();

            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            lastMeetingIdRef.current = user.meetingId;
        }

        // Don't reconnect if already open or connecting
        if (wsRef.current?.readyState === WebSocket.OPEN ||
            wsRef.current?.readyState === WebSocket.CONNECTING) return;

        const wsUrl = `${BASE_WS_URL}/${user.meetingId}?name=${encodeURIComponent(user.name)}&role=${encodeURIComponent(user.agileRole || '')}`;
        console.log('[WS] Connecting to', wsUrl);
        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            console.log('[WS] ✅ Connected');
            setIsConnected(true);
            reconnectAttemptsRef.current = 0; // Reset backoff on successful connection

            // Start heartbeat to prevent connection timeout
            heartbeatTimerRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'ping' }));
                }
            }, 30000); // 30 seconds

            // Fix #3: Start mic only AFTER WS is confirmed open to prevent
            // audio bytes being silently dropped during WS handshake.
            if (!isMutedRef.current) {
                startMicRef.current();
            }
        };

        ws.onclose = () => {
            console.log('[WS] Disconnected — will retry in 3s');
            setIsConnected(false);
            if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);

            // Exponential backoff: 3s, 6s, 12s, up to 30s max
            if (!isMeetingEndedRef.current) {
                const delay = Math.min(3000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                reconnectAttemptsRef.current += 1;
                console.log(`[WS] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttemptsRef.current})`);
                reconnectTimerRef.current = setTimeout(() => {
                    connectWebSocket();
                }, delay);
            }
        };


        ws.onerror = (error) => {
            console.error('[WS] Error:', error);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                const { type, data } = message;

                switch (type) {
                    case 'participants':
                        setParticipants(data);
                        break;
                    case 'transcription':
                        addTranscriptEntry({
                            text: data.text,
                            speakerId: data.speaker_id,
                            speakerName: data.speaker_name,
                            isFinal: data.is_final,
                        });
                        break;
                    case 'acoustics':
                        setAcousticFeatures(data);
                        break;
                    case 'chat':
                        addChatMessage({
                            sender: data.sender,
                            text: data.text,
                            timestamp: data.timestamp,
                            isMe: data.sender === user?.name,
                        });
                        break;
                    case 'requirements':
                        addRequirements(data);
                        break;
                    case 'conflicts':
                        addConflicts(data);
                        break;
                    case 'THREAD_CREATED':
                    case 'THREAD_UPDATED':
                    case 'THREAD_STATE_CHANGED':
                        if (user?.meetingId) {
                            meetingApi.getThreads(user.meetingId)
                                .then(res => {
                                    if (res.status === 'success') {
                                        useMeetingStore.getState().setThreads(res.threads);
                                    }
                                })
                                .catch(err => console.error('Failed to refetch threads:', err));
                        }
                        break;
                    case 'error':
                        console.error('[WS] Backend error:', data.message);
                        break;
                }
            } catch (err) {
                console.error('[WS] Failed to parse message:', err);
            }
        };

        wsRef.current = ws;
    }, [user?.meetingId, addTranscriptEntry, clearTranscript, clearChat, setParticipants, addChatMessage, addRequirements, addConflicts]);

    // Connect WebSocket immediately on mount
    useEffect(() => {
        connectWebSocket();

        return () => {
            // Cleanup on unmount
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) wsRef.current.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.meetingId]);

    // ─── Mic: Start/Stop audio streaming ──────────────────────────
    const startMic = useCallback(async () => {
        try {
            // Disable browser-side audio processing — Azure Speech SDK performs its own
            // noise reduction and echo cancellation. Browser AEC/NoiseSuppression can
            // produce all-zero (silent) output that blocks speech recognition entirely.
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: { ideal: 48000 },
                    channelCount: { ideal: 1 },
                }
            });
            streamRef.current = stream;

            const audioTrack = stream.getAudioTracks()[0];
            console.log(`[Mic] Track: ${audioTrack?.label}, enabled=${audioTrack?.enabled}, muted=${audioTrack?.muted}, readyState=${audioTrack?.readyState}`);

            // ── OS/Hardware muted track detection ────────────────────────────
            // muted=true means the OS/hardware is blocking mic audio (not the app).
            // Common causes: Windows Privacy settings, hardware mute key (Fn+F4),
            // Intel SST mic disabled, or another app has exclusive mic access.
            if (audioTrack?.muted) {
                console.error(
                    '[Mic] ❌ Microphone track is muted at OS/hardware level!\n' +
                    '  → Check: Windows Settings > Privacy & security > Microphone\n' +
                    '  → Check: Taskbar speaker icon > Sound settings > Input volume\n' +
                    '  → Check: Keyboard mic mute key (Fn+F4 or similar)\n' +
                    '  → Waiting for hardware unmute event...'
                );
                // Wait for the OS/hardware to unmute the track (e.g. user presses mute key)
                await new Promise<void>((resolve) => {
                    const onUnmute = () => {
                        console.log('[Mic] ✅ Track unmuted by OS/hardware — starting audio...');
                        resolve();
                    };
                    audioTrack.addEventListener('unmute', onUnmute, { once: true });
                    // Also clean up if stopMic is called while waiting
                    audioTrack.addEventListener('ended', () => resolve(), { once: true });
                });
                // Re-check state after unmute
                if (audioTrack.readyState === 'ended') {
                    console.warn('[Mic] Track ended while waiting for unmute — aborting.');
                    return;
                }
            }

            // Let the AudioContext run at the hardware's native sample rate.
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;

            if (audioContext.state !== 'running') {
                console.warn(`[Mic] AudioContext state is "${audioContext.state}", attempting resume...`);
                await audioContext.resume();
            }

            if (audioContext.state !== 'running') {
                console.error('[Mic] AudioContext failed to start — audio will be silent!');
            }

            const nativeSampleRate = audioContext.sampleRate;
            console.log(`[Mic] AudioContext state=${audioContext.state}, sampleRate=${nativeSampleRate} Hz`);

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;

            const blobUrl = createWorkletBlobUrl();
            workletBlobUrlRef.current = blobUrl;
            await audioContext.audioWorklet.addModule(blobUrl);

            const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor', {
                processorOptions: { inputSampleRate: nativeSampleRate },
            });
            workletNodeRef.current = workletNode;

            let chunkCount = 0;
            workletNode.port.onmessage = (event: MessageEvent) => {
                chunkCount++;
                if (chunkCount % 25 === 0) {
                    const samples = new Int16Array(event.data as ArrayBuffer);
                    let sumSq = 0;
                    for (let i = 0; i < samples.length; i++) sumSq += samples[i] * samples[i];
                    const rms = Math.sqrt(sumSq / samples.length);
                    if (rms < 50) {
                        console.warn(`[Mic] ⚠️ Chunk #${chunkCount}: RMS=${rms.toFixed(1)} — silence (check OS mic)`);
                    } else {
                        console.log(`[Mic] ✅ Chunk #${chunkCount}: RMS=${rms.toFixed(1)} — audio active`);
                    }
                }
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(event.data as ArrayBuffer);
                }
            };

            // Listen for hardware mute/unmute events at runtime
            audioTrack.addEventListener('mute', () =>
                console.warn('[Mic] ⚠️ Track muted by OS/hardware mid-session — audio will be silent until unmuted')
            );
            audioTrack.addEventListener('unmute', () =>
                console.log('[Mic] ✅ Track unmuted by OS/hardware — audio resumed')
            );

            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0;
            source.connect(workletNode);
            workletNode.connect(gainNode);
            gainNode.connect(audioContext.destination);

            setIsMicActive(true);
            console.log('[Mic] ✅ Mic started — streaming at ' + nativeSampleRate + ' Hz');
        } catch (err) {
            console.error('[Mic] Error accessing microphone:', err);
        }
    }, []);

    const stopMic = useCallback(() => {
        if (workletNodeRef.current) {
            workletNodeRef.current.port.onmessage = null;
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }
        if (workletBlobUrlRef.current) {
            URL.revokeObjectURL(workletBlobUrlRef.current);
            workletBlobUrlRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setIsMicActive(false);
        console.log('[Mic] 🔇 Muted — audio stream stopped');
    }, []);

    // Update startMicRef synchronously during render (not in useEffect) so it is
    // always current before connectWebSocket's ws.onopen fires, even on fast LAN.
    // startMic has [] deps so it is a stable reference — this assignment is cheap.
    startMicRef.current = startMic;
    stopMicRef.current = stopMic;

    // Fix #2: Sync hardware mic with global isMuted state.
    // Only depends on `isMuted` — startMic/stopMic are stable ([] deps) so omitting
    // them from the dep array is safe and prevents re-fire loops.
    useEffect(() => {
        if (!isMuted) {
            // Only start mic if WebSocket is already open.
            // If WS is not yet open, ws.onopen will start the mic on connection.
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                startMic();
            }
        } else {
            stopMic();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMuted]);

    // Cleanup mic on unmount
    useEffect(() => {
        return () => {
            stopMic();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sendChat = useCallback((text: string) => {
        if (!text.trim()) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'chat',
                text: text.trim(),
                sender: user?.name
            }));
        } else {
            console.warn('[Chat] WebSocket not open, cannot send message');
        }
    }, [user?.name]);

    return {
        isMicActive,
        isConnected,
        acousticFeatures,
        // toggleMic is a no-op — mic is controlled by isMuted in the store.
        // Call useMeetingStore().toggleMic() from the UI to mute/unmute.
        toggleMic: async () => { },
        sendChat,
    };
};
