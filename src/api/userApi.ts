import { AUTH_API_URL } from './config';
import { useMeetingStore } from '../store/useMeetingStore';

const getAuthHeaders = () => {
  const token = useMeetingStore.getState().user?.accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const userApi = {
  getMe: async () => {
    const response = await fetch(`${AUTH_API_URL}/users/me`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch user data');
    return response.json();
  },

  updateProfile: async (data: { firstName?: string; lastName?: string; jobTitle?: string }) => {
    const response = await fetch(`${AUTH_API_URL}/users/me/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  listUsers: async () => {
    const response = await fetch(`${AUTH_API_URL}/users`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  updateUserRole: async (userId: string, role: string) => {
    const response = await fetch(`${AUTH_API_URL}/users/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });

    if (!response.ok) throw new Error('Failed to update user role');
    return response.json();
  }
};
