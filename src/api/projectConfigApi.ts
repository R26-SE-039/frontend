import { AUTH_API_URL } from './config';
import { useMeetingStore } from '../store/useMeetingStore';

export interface ProjectConfiguration {
  id: string;
  project_id: string;
  repo_url: string;
  personal_access_token: string;
  created_at: string;
  updated_at: string;
}

const getAuthHeaders = () => {
  const token = useMeetingStore.getState().user?.accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const projectConfigApi = {
  getConfiguration: async (projectId: string): Promise<ProjectConfiguration | null> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${projectId}/configuration`, {
      headers: getAuthHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch project configuration');
    }

    return response.json();
  },

  saveConfiguration: async (
    projectId: string,
    data: { repoUrl: string; personalAccessToken: string }
  ): Promise<ProjectConfiguration> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${projectId}/configuration`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save project configuration');
    }

    return response.json();
  },
};
