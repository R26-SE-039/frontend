import { AUTH_API_URL } from './config';
import { useMeetingStore } from '../store/useMeetingStore';

const getAuthHeaders = () => {
  const token = useMeetingStore.getState().user?.accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const organizationApi = {
  getOrganization: async () => {
    const response = await fetch(`${AUTH_API_URL}/organizations`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch organization');
    return response.json();
  },

  updateOrganization: async (data: { companyName?: string; domain?: string }) => {
    const response = await fetch(`${AUTH_API_URL}/organizations`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update organization');
    return response.json();
  },

  sendInvite: async (email: string, role: string) => {
    const response = await fetch(`${AUTH_API_URL}/organizations/invites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to send invite' }));
        throw new Error(error.message || 'Failed to send invite');
    }
    return response.json();
  },

  listInvites: async () => {
    const response = await fetch(`${AUTH_API_URL}/organizations/invites`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch invites');
    return response.json();
  },

  revokeInvite: async (inviteId: string) => {
    const response = await fetch(`${AUTH_API_URL}/organizations/invites/${inviteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Failed to revoke invite');
    return response.json();
  }
};
