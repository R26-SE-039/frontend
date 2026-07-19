import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '../api/authApi';

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
  isFinal?: boolean;
}

export interface RequirementEntry {
  requirement_id: string;
  meeting_id?: string;
  requirement_text: string;
  requirement_type: string;
  status: string;
}

export interface ConflictEntry {
  conflict_id: string;
  requirement_a_id: string;
  requirement_b_id: string;
  conflict_type: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface ThreadEntry {
  id?: string; // mapping DB raw row field
  thread_id: string;
  meeting_id: string;
  thread_label?: string;
  summary_text?: string;
  summary_embedding?: number[];
  topic_label?: string;
  entities: string[];
  state: string; // 'candidate' | 'clarification_needed' | 'confirmed' | 'approved' | 'rejected'
  requirement_id?: string | null;
  last_activity_at?: string;
  created_at?: string;
  updated_at?: string;
  classification_confidence?: number;
  match_confidence?: number;
  created_by?: string;
  timestamp?: string;
  utterance_text?: string;
}


export interface User {
  id: string;
  name: string;
  email: string;
  meetingId: string;
  agileRole: string;
  accessToken: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  role?: string;
  refreshToken?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastAccessed: string;
  memberCount: number;
  userRole: 'Admin' | 'Editor' | 'Viewer';
  isPrivate: boolean;
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
  currentProject: Project | null;
  setUser: (user: User) => void;
  setCurrentProject: (project: Project | null) => void;
  logout: () => Promise<void>;

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

  // Requirements
  requirements: RequirementEntry[];
  addRequirements: (reqs: RequirementEntry[]) => void;
  clearRequirements: () => void;

  // Conflicts
  conflicts: ConflictEntry[];
  addConflicts: (conflicts: ConflictEntry[]) => void;
  clearConflicts: () => void;

  // Discussion Threads
  threads: ThreadEntry[];
  setThreads: (threads: ThreadEntry[]) => void;
  clearThreads: () => void;
}

export const useMeetingStore = create<MeetingState>()(
  persist(
    (set, get) => ({
      // Defaults
      user: null,
      currentProject: null,
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
      requirements: [],
      conflicts: [],
      threads: [],


      // Actions
      setUser: (user) => {
        set((state) => ({ 
          user,
          participants: state.participants.map(p => 
            p.id === 'me' ? { ...p, name: user.name } : p
          )
        }));
      },
      setCurrentProject: (currentProject) => set({ currentProject }),
      logout: async () => {
        const token = get().user?.accessToken;
        set({ user: null, currentProject: null });
        // Clear all state on logout
        localStorage.removeItem('meeting-storage');
        if (token) {
          try {
            await authApi.logout(token);
          } catch (e) {
            console.error('Logout API failed:', e);
          }
        }
      },
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
          id: p.name === state.user?.name ? 'me' : p.id
        }))
      })),

      addTranscriptEntry: (entry) => set((state) => {
        const lastEntry = state.transcript[state.transcript.length - 1];
        
        // If the last entry was a "partial" (interim) transcript from the SAME speaker,
        // we replace it with the new content rather than appending.
        if (lastEntry && !lastEntry.isFinal && lastEntry.speakerId === entry.speakerId) {
          const updatedTranscript = [...state.transcript];
          updatedTranscript[updatedTranscript.length - 1] = {
            ...lastEntry,
            text: entry.text,
            isFinal: entry.isFinal,
            timestamp: new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            })
          };
          return { transcript: updatedTranscript };
        }

        // Otherwise, add as a new entry
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
          ].slice(-100)
        };
      }),

      clearTranscript: () => set({ transcript: [] }),

      addChatMessage: (msg) => set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          { ...msg, id: Math.random().toString(36).substring(7) }
        ].slice(-200)
      })),

      clearChat: () => set({ chatMessages: [] }),

      addRequirements: (reqs) => set((state) => ({
        requirements: [
          ...state.requirements,
          ...reqs.filter(r => !state.requirements.find(existing => existing.requirement_id === r.requirement_id))
        ]
      })),

      clearRequirements: () => set({ requirements: [] }),

      addConflicts: (conflicts) => set((state) => ({
        conflicts: [
          ...state.conflicts,
          ...conflicts.filter(c => !state.conflicts.find(existing => existing.conflict_id === c.conflict_id))
        ]
      })),

      clearConflicts: () => set({ conflicts: [] }),

      setThreads: (threads) => set({ threads }),
      clearThreads: () => set({ threads: [] }),
    }),
    {
      name: 'meeting-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist specific keys to avoid bloat
      partialize: (state) => ({ 
        user: state.user,
        currentProject: state.currentProject,
        theme: state.theme,
        gridDensity: state.gridDensity,
        micVolume: state.micVolume,
        speakerVolume: state.speakerVolume
      }),
    }
  )
);
