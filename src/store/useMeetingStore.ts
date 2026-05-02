import { create } from 'zustand';

// Types for the store
export type ThemeType = 'default' | 'obsidian' | 'ocean' | 'light';

export interface Participant {
  id: string;
  name: string;
  isSpeaking: boolean;
  avatar?: string;
  muted?: boolean;
}

export interface TranscriptEntry {
  id: string;
  speakerName: string;
  text: string;
  timestamp: string;
  speakerId: string;
}

export interface User {
  name: string;
  email: string;
  meetingId: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

interface MeetingState {
  // Authentication/Identity
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;

  // Appearance
  theme: ThemeType;
  gridDensity: 'compact' | 'standard' | 'relaxed';
  setTheme: (theme: ThemeType) => void;
  setGridDensity: (density: 'compact' | 'standard' | 'relaxed') => void;
  
  // Audio Levels
  micVolume: number;
  speakerVolume: number;
  setMicVolume: (vol: number) => void;
  setSpeakerVolume: (vol: number) => void;
  
  // Layout
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  isRecording: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleRecording: () => void;
  
  // Media Status
  isMuted: boolean;
  isVideoOff: boolean;
  isSharingScreen: boolean;
  toggleMic: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  
  // Participants
  participants: Participant[];
  updateParticipantSpeaking: (id: string, isSpeaking: boolean) => void;
  setParticipants: (participants: Participant[]) => void;
  
  // Transcription
  transcript: TranscriptEntry[];
  addTranscriptEntry: (entry: Omit<TranscriptEntry, 'id' | 'timestamp'>) => void;
  clearTranscript: () => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  clearChat: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  // Defaults
  user: null,
  theme: 'light',
  gridDensity: 'standard',
  micVolume: 80,
  speakerVolume: 75,
  isLeftSidebarOpen: true,
  isRightSidebarOpen: true,
  isRecording: false,
  isMuted: true,
  isVideoOff: false,
  isSharingScreen: false,
  participants: [],
  transcript: [],
  chatMessages: [],

  // Actions
  setUser: (user) => set((state) => ({ 
    user,
    participants: state.participants.map(p => 
      p.id === 'me' ? { ...p, name: user.name } : p
    )
  })),
  logout: () => set({ user: null }),
  setTheme: (theme) => set({ theme }),
  setGridDensity: (gridDensity) => set({ gridDensity }),
  setMicVolume: (micVolume) => set({ micVolume }),
  setSpeakerVolume: (speakerVolume) => set({ speakerVolume }),
  
  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
  
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  
  toggleRecording: () => set((state) => ({ isRecording: !state.isRecording })),
  
  toggleMic: () => set((state) => ({ isMuted: !state.isMuted })),
  
  toggleVideo: () => set((state) => ({ isVideoOff: !state.isVideoOff })),
  
  toggleScreenShare: () => set((state) => ({ isSharingScreen: !state.isSharingScreen })),
  
  updateParticipantSpeaking: (id, isSpeaking) => set((state) => ({
    participants: state.participants.map(p => 
      p.id === id ? { ...p, isSpeaking } : p
    )
  })),
  setParticipants: (participants) => set((state) => ({ 
    participants: participants.map(p => ({
      ...p,
      // Mark as 'me' if the name matches the logged in user
      id: p.name === state.user?.name ? 'me' : p.id
    }))
  })),

  addTranscriptEntry: (entry) => set((state) => {
    // Simple de-duplication: ignore if same text as last entry from same speaker
    const lastEntry = state.transcript[state.transcript.length - 1];
    if (lastEntry && lastEntry.text === entry.text && lastEntry.speakerId === entry.speakerId) {
      return state;
    }

    return {
      transcript: [
        ...state.transcript,
        {
          ...entry,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })
        }
      ].slice(-100) // Keep last 100 entries
    };
  }),

  clearTranscript: () => set({ transcript: [] }),

  addChatMessage: (msg) => set((state) => ({
    chatMessages: [
      ...state.chatMessages,
      { ...msg, id: Math.random().toString(36).substring(7) }
    ].slice(-200) // Keep last 200 messages
  })),

  clearChat: () => set({ chatMessages: [] }),
}));
