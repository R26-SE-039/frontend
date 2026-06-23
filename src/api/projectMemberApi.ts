import { AUTH_API_URL } from './config';
import { useMeetingStore } from '../store/useMeetingStore';

const getAuthHeaders = () => {
  const token = useMeetingStore.getState().user?.accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const projectMemberApi = {
  listMembers: async (projectId: string) => {
    const response = await fetch(`${AUTH_API_URL}/project-members/${projectId}/members`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch project members');
    return response.json();
  },

  addMember: async (projectId: string, userId: string, role: string) => {
    const response = await fetch(`${AUTH_API_URL}/project-members/${projectId}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, role }),
    });

    if (!response.ok) throw new Error('Failed to add member to project');
    return response.json();
  },

  removeMember: async (projectId: string, userId: string) => {
    const response = await fetch(`${AUTH_API_URL}/project-members/${projectId}/members/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Failed to remove member from project');
    return response.json();
  }
};
