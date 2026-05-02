import { AUTH_API_URL } from './config';

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${AUTH_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      const message = Array.isArray(error.detail) 
        ? error.detail.map((e: any) => e.message).join(', ') 
        : (error.detail || 'Login failed');
      throw new Error(message);
    }

    return response.json();
  },

  register: async (email: string, password: string, fullName: string, agileRole: string) => {
    const response = await fetch(`${AUTH_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, agile_role: agileRole }),
    });

    if (!response.ok) {
      const error = await response.json();
      const message = Array.isArray(error.detail) 
        ? error.detail.map((e: any) => e.message).join(', ') 
        : (error.detail || 'Registration failed');
      throw new Error(message);
    }

    return response.json();
  },

  getMe: async (token: string) => {
    const response = await fetch(`${AUTH_API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    return response.json();
  },

  getRoles: async () => {
    const response = await fetch(`${AUTH_API_URL}/auth/roles`);
    if (!response.ok) throw new Error('Failed to fetch roles');
    return response.json();
  },

  getProfile: async (token: string) => {
    const response = await fetch(`${AUTH_API_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      if (response.status === 404) return null; // Profile might not exist yet
      throw new Error('Failed to fetch profile');
    }
    return response.json();
  },

  updateProfile: async (token: string, profile: any) => {
    const response = await fetch(`${AUTH_API_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update profile');
    }
    return response.json();
  }
};
