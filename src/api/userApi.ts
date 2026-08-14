import { AUTH_API_URL } from './config';
import { authenticatedFetch } from './authenticatedFetch';

export const userApi = {
  getMe: async () => {
    const response = await authenticatedFetch(`${AUTH_API_URL}/users/me`);
    if (!response.ok) throw new Error('Failed to fetch user data');
    return response.json();
  },

  updateProfile: async (data: { firstName?: string; lastName?: string; jobTitle?: string }) => {
    const response = await authenticatedFetch(`${AUTH_API_URL}/users/me/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  listUsers: async () => {
    const response = await authenticatedFetch(`${AUTH_API_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  updateUserRole: async (userId: string, role: string) => {
    const response = await authenticatedFetch(`${AUTH_API_URL}/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) throw new Error('Failed to update user role');
    return response.json();
  }
};
