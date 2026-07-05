import { useState, useEffect, useRef, useCallback } from 'react';
import { createWorkletBlobUrl } from '../utils/audioWorkletProcessor';
import { useMeetingStore } from '../store/useMeetingStore';

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

    const { 
        user, addTranscriptEntry, isMuted, setParticipants, addChatMessage,
        clearTranscript, clearChat 
    } = useMeetingStore();

    // Refs to avoid stale closures in WS callbacks.
    // isMutedRef is initialized with live value (not hardcoded true) so it's
    // correct even if the store has a non-default value on first render.
    const isMutedRef = useRef<boolean>(isMuted);
    const startMicRef = useRef<() => Promise<void>>(async () => {});
    const stopMicRef = useRef<() => void>(() => {});
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
            
            // Auto-reconnect after 3 seconds
            if (!isMeetingEndedRef.current) {
                reconnectTimerRef.current = setTimeout(() => {
                    connectWebSocket();
                }, 3000);
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
                    case 'error':
                        console.error('[WS] Backend error:', data.message);
                        break;
                }
            } catch (err) {
                console.error('[WS] Failed to parse message:', err);
            }
        };

        wsRef.current = ws;
    }, [user?.meetingId, addTranscriptEntry, clearTranscript, clearChat, setParticipants, addChatMessage]);

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
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000,
                } 
            });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000
            });
            audioContextRef.current = audioContext;

            // Force resume if browser started it in suspended state
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            // Fix #4: Use AudioWorkletNode (modern replacement for deprecated ScriptProcessorNode).
            // AudioWorklet runs in the audio thread and survives tab backgrounding.
            const blobUrl = createWorkletBlobUrl();
            workletBlobUrlRef.current = blobUrl;
            await audioContext.audioWorklet.addModule(blobUrl);

            const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
            workletNodeRef.current = workletNode;

            // Receive PCM chunks from the audio thread and send over WebSocket
            workletNode.port.onmessage = (event: MessageEvent) => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(event.data as ArrayBuffer);
                }
            };

            // Fix #5: Do not connect worklet directly to destination, or browser echo 
            // cancellation will completely mute the mic to prevent feedback!
            // Instead, connect to a muted GainNode.
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0;
            
            source.connect(workletNode);
            workletNode.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            setIsMicActive(true);
            console.log('[Mic] 🎤 Unmuted — streaming audio (AudioWorklet)');
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
        toggleMic: async () => {},
        sendChat,
    };
};
