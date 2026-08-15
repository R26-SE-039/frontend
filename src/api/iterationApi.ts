import { AUTH_API_URL } from './config';
import { useMeetingStore, Iteration, IterationStatus } from '../store/useMeetingStore';

const getAuthHeaders = () => {
  const token = useMeetingStore.getState().user?.accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const iterationApi = {
  createIteration: async (
    projectId: string, 
    data: { name: string; goal?: string; start_date: string; end_date: string }
  ): Promise<Iteration> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${projectId}/iterations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || 'Failed to create iteration');
    }

    return response.json();
  },

  listIterations: async (projectId: string): Promise<Iteration[]> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${projectId}/iterations`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch iterations');
    }

    return response.json();
  },

  getActiveIteration: async (projectId: string): Promise<Iteration | null> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${projectId}/iterations/active`, {
      headers: getAuthHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch active iteration');
    }

    return response.json();
  },

  updateIteration: async (
    projectId: string, 
    iterationId: string, 
    data: { name?: string; goal?: string; start_date?: string; end_date?: string; status?: IterationStatus }
  ): Promise<Iteration> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${projectId}/iterations/${iterationId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || 'Failed to update iteration');
    }

    return response.json();
  },

  deleteIteration: async (projectId: string, iterationId: string): Promise<void> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${projectId}/iterations/${iterationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete iteration');
    }
  }
};
