import { AUTH_API_URL } from './config';
import { useMeetingStore } from '../store/useMeetingStore';
import { Project } from '../store/useMeetingStore';

const getAuthHeaders = () => {
  const token = useMeetingStore.getState().user?.accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const projectApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await fetch(`${AUTH_API_URL}/projects`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return response.json();
  },

  createProject: async (data: { name: string; description: string; is_private?: boolean }): Promise<Project> => {
    const response = await fetch(`${AUTH_API_URL}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    return response.json();
  },

  inviteMember: async (projectId: string, email: string, role: string): Promise<any> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${projectId}/invite`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
      throw new Error('Failed to send invitation');
    }

    return response.json();
  }
};
