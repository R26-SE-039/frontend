import { useState, useEffect, useRef, useCallback } from 'react';
import { prepareAudioChunk } from '../utils/audioProcessor';
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
export const useSpeechSocket = (): UseSpeechSocketReturn => {
    const [isMicActive, setIsMicActive] = useState<boolean>(false);
    const [acousticFeatures, setAcousticFeatures] = useState<AcousticFeatures>({ pitch: 0, energy: 0 });
    const [isConnected, setIsConnected] = useState<boolean>(false);
    
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastMeetingIdRef = useRef<string | null>(null);
    const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { 
        user, addTranscriptEntry, isMuted, setParticipants, addChatMessage,
        clearTranscript, clearChat 
    } = useMeetingStore();

    // ─── WebSocket: Connect on mount, auto-reconnect ───────────────
    const connectWebSocket = useCallback(() => {
        if (!user?.meetingId) return;
        
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
        };

        ws.onclose = () => {
            console.log('[WS] Disconnected — will retry in 3s');
            setIsConnected(false);
            if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
            
            // Auto-reconnect after 3 seconds
            reconnectTimerRef.current = setTimeout(() => {
                connectWebSocket();
            }, 3000);
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
    }, [connectWebSocket]);

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

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (event: AudioProcessingEvent) => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    const inputData = event.inputBuffer.getChannelData(0);
                    const pcmChunk = prepareAudioChunk(inputData, audioContext.sampleRate);
                    wsRef.current.send(pcmChunk);
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
            
            setIsMicActive(true);
            console.log('[Mic] 🎙️ Unmuted — streaming audio');
        } catch (err) {
            console.error('[Mic] Error accessing microphone:', err);
        }
    }, []);

    const stopMic = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
            processorRef.current = null;
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

    // Toggle mic on/off
    const toggleMic = useCallback(async () => {
        if (isMicActive) {
            stopMic();
        } else {
            await startMic();
        }
    }, [isMicActive, startMic, stopMic]);

    // Sync hardware mic with global isMuted state
    useEffect(() => {
        if (!isMuted) {
            startMic();
        } else {
            stopMic();
        }
    }, [isMuted, startMic, stopMic]);

    // Cleanup mic on unmount
    useEffect(() => {
        return () => {
            stopMic();
        };
    }, [stopMic]);

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
        isMicActive: !isMuted,
        isConnected,
        acousticFeatures,
        toggleMic: async () => { /* Now handled by store toggle */ },
        sendChat,
    };
};
