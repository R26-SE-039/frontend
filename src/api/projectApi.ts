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

  getProject: async (id: string): Promise<Project> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    return response.json();
  },

  createProject: async (data: { name: string; description: string }): Promise<Project> => {
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

  updateProject: async (id: string, data: { name?: string; description?: string; status?: string }): Promise<Project> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }

    return response.json();
  },

  deleteProject: async (id: string): Promise<void> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  }
};
