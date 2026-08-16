import { RAG_API_URL } from './config';
import { useMeetingStore } from '../store/useMeetingStore';
import { authenticatedFetch } from './authenticatedFetch';

// authenticatedFetch automatically:
//   1. Injects the Bearer token from the store
//   2. Silently refreshes the access token on 401 and retries the request
//   3. Auto-logouts and redirects to /login if refresh also fails

export interface CreateMeetingResponse {
  status: string;
  meeting_id: string;
  passcode: string;
  invite_link: string;
}

export interface JoinMeetingResponse {
  status: string;
  meeting_id: string;
  passcode: string;
  name?: string;
  title?: string;
  message?: string;
}

export const meetingApi = {
  createMeeting: async (name: string, mode: 'instant' | 'scheduled', scheduledAt?: string): Promise<CreateMeetingResponse> => {
    const projectId = useMeetingStore.getState().currentProject?.id;
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        mode, 
        scheduled_at: scheduledAt,
        project_id: projectId 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create meeting');
    }

    return response.json();
  },

  joinMeeting: async (meetingId: string, passcode: string): Promise<JoinMeetingResponse> => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id: meetingId, passcode }),
    });

    if (!response.ok) {
      throw new Error('Failed to join meeting');
    }

    return response.json();
  },

  getChatHistory: async (meetingId: string) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/${meetingId}/chats`);
    if (!response.ok) throw new Error('Failed to fetch chat history');
    return response.json();
  },

  getTranscript: async (meetingId: string) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/${meetingId}/transcript`);
    if (!response.ok) throw new Error('Failed to fetch transcript');
    return response.json();
  },

  analyzeMeeting: async (meetingId: string, type: 'action_items' | 'summary' = 'action_items') => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/${meetingId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (!response.ok) throw new Error('Failed to analyze meeting');
    return response.json();
  },

  finalizeMeeting: async (meetingId: string) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/${meetingId}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to finalize meeting');
    return response.json();
  },

  generateUserStories: async (transcript: any, query: string = "Generate user stories based on this meeting transcript") => {
    const projectId = useMeetingStore.getState().currentProject?.id;
    const response = await authenticatedFetch(`${RAG_API_URL}/pipeline/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: { ...transcript, project_id: projectId },
        query,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || 'Failed to generate user stories from RAG service');
    }

    return response.json();
  },

  getRequirements: async (meetingId: string) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/${meetingId}/requirements`);
    if (!response.ok) throw new Error('Failed to fetch requirements');
    return response.json();
  },

  getThreads: async (meetingId: string) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/${meetingId}/threads`);
    if (!response.ok) throw new Error('Failed to fetch threads');
    return response.json();
  },

  getConflicts: async (meetingId: string) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/${meetingId}/conflicts`);
    if (!response.ok) throw new Error('Failed to fetch conflicts');
    return response.json();
  },

  finalizeRequirements: async (meetingId: string, resolutions: any[], editedRequirements: any[], editedThreads: any[] = []) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/${meetingId}/requirements/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resolutions,
        edited_requirements: editedRequirements,
        edited_threads: editedThreads
      }),
    });
    if (!response.ok) throw new Error('Failed to finalize requirements');
    return response.json();
  },

  generateStoriesFromRequirements: async (meetingId: string) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/pipeline/generate-from-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id: meetingId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || 'Failed to generate user stories from requirements');
    }
    return response.json();
  },

  resolveSingleConflict: async (
    meetingId: string,
    conflictId: string,
    payload: {
      resolution_type: string;
      edited_text_a?: string;
      edited_text_b?: string;
      merged_text?: string;
    }
  ) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/${meetingId}/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conflict_id: conflictId, ...payload }),
    });
    if (!response.ok) throw new Error('Failed to resolve conflict');
    return response.json();
  },

  getProjectConflicts: async (projectId: string, status: string = 'active') => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/project/${projectId}/conflicts?status=${status}`);
    if (!response.ok) throw new Error('Failed to fetch project conflicts');
    return response.json();
  },

  updateAndRevalidateStory: async (
    storyId: string,
    payload: {
      meeting_id: string;
      title: string;
      story: string;
      acceptance_criteria: string[];
      priority?: string;
    }
  ) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/pipeline/user-stories/${storyId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || 'Failed to update story and re-validate');
    }
    return response.json();
  },

  overrideStoryStatus: async (
    storyId: string,
    status: 'Approved' | 'Needs Review' | 'Rejected',
    meetingId: string,
    feedback?: string
  ) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/pipeline/user-stories/${storyId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meeting_id: meetingId,
        status,
        feedback,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || 'Failed to update story status');
    }
    return response.json();
  },

  getIterationHistory: async (projectId: string) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/project/${projectId}/iteration/history`);
    if (!response.ok) throw new Error('Failed to fetch iteration history');
    return response.json();
  },

  getMeetingsByIteration: async (iterationId: string) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/iteration/${iterationId}/meetings`);
    if (!response.ok) throw new Error('Failed to fetch iteration meetings');
    return response.json();
  },

  getMeetingStories: async (meetingId: string) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/speech/meeting/${meetingId}/stories`);
    if (!response.ok) throw new Error('Failed to fetch meeting stories');
    return response.json();
  },

  syncStoriesToJira: async (
    projectId: string,
    iterationName: string,
    stories: Array<{
      story_id: string;
      title: string;
      story: string;
      acceptance_criteria: string[];
      quality_score: number;
      status: string;
    }>
  ) => {
    const response = await authenticatedFetch(`${RAG_API_URL}/jira/sync-stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        iterationName,
        stories,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || 'Failed to sync stories to Jira');
    }
    return response.json();
  },
};

