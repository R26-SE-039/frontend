import { AUTH_API_URL } from './config';
import { authenticatedFetch } from './authenticatedFetch';

export const organizationApi = {
  getOrganization: async () => {
    const response = await authenticatedFetch(`${AUTH_API_URL}/organizations`);
    if (!response.ok) throw new Error('Failed to fetch organization');
    return response.json();
  },

  updateOrganization: async (data: { companyName?: string; domain?: string }) => {
    const response = await authenticatedFetch(`${AUTH_API_URL}/organizations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update organization');
    return response.json();
  },

  sendInvite: async (email: string, role: string) => {
    const response = await authenticatedFetch(`${AUTH_API_URL}/organizations/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to send invite' }));
      throw new Error(error.message || 'Failed to send invite');
    }
    return response.json();
  },

  listInvites: async () => {
    const response = await authenticatedFetch(`${AUTH_API_URL}/organizations/invites`);
    if (!response.ok) throw new Error('Failed to fetch invites');
    return response.json();
  },

  revokeInvite: async (inviteId: string) => {
    const response = await authenticatedFetch(`${AUTH_API_URL}/organizations/invites/${inviteId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to revoke invite');
    return response.json();
  }
};
