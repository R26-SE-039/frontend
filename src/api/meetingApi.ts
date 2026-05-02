import { AUTH_API_URL } from './config';
import { useMeetingStore } from '../store/useMeetingStore';

const getAuthHeaders = () => {
  const token = useMeetingStore.getState().user?.accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export interface CreateMeetingResponse {
  status: string;
  meeting_id: string;
  passcode: string;
  invite_link: string;
}

export interface JoinMeetingResponse {
  status: string;
  message?: string;
}

export const meetingApi = {
  createMeeting: async (name: string, mode: 'instant' | 'scheduled', scheduledAt?: string): Promise<CreateMeetingResponse> => {
    const response = await fetch(`${AUTH_API_URL}/meeting/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, mode, scheduled_at: scheduledAt }),
    });

    if (!response.ok) {
      throw new Error('Failed to create meeting');
    }

    return response.json();
  },

  joinMeeting: async (meetingId: string, passcode: string): Promise<JoinMeetingResponse> => {
    const response = await fetch(`${AUTH_API_URL}/meeting/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ meeting_id: meetingId, passcode }),
    });

    if (!response.ok) {
      throw new Error('Failed to join meeting');
    }

    return response.json();
  },

  getChatHistory: async (meetingId: string) => {
    const response = await fetch(`${AUTH_API_URL}/meeting/${meetingId}/chats`);
    if (!response.ok) throw new Error('Failed to fetch chat history');
    return response.json();
  },

  getTranscript: async (meetingId: string) => {
    const response = await fetch(`${AUTH_API_URL}/meeting/${meetingId}/transcript`);
    if (!response.ok) throw new Error('Failed to fetch transcript');
    return response.json();
  },

  analyzeMeeting: async (meetingId: string, type: 'action_items' | 'summary' = 'action_items') => {
    const response = await fetch(`${AUTH_API_URL}/meeting/${meetingId}/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type }),
    });
    if (!response.ok) throw new Error('Failed to analyze meeting');
    return response.json();
  },
};
