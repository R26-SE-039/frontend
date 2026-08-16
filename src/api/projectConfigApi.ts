import { AUTH_API_URL } from './config';
import { useMeetingStore } from '../store/useMeetingStore';

export interface ProjectConfiguration {
  id: string;
  project_id: string;
  repo_url?: string;
  personal_access_token?: string;
  jira_url?: string | null;
  jira_email?: string | null;
  jira_api_token?: string | null;
  jira_project_key?: string | null;
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
    data: {
      repoUrl?: string;
      personalAccessToken?: string;
      jiraUrl?: string | null;
      jiraEmail?: string | null;
      jiraApiToken?: string | null;
      jiraProjectKey?: string | null;
    }
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

  testJiraConnection: async (
    projectId: string,
    data: { jiraUrl: string; jiraEmail: string; jiraApiToken: string }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${AUTH_API_URL}/projects/${projectId}/configuration/test-jira`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || 'Failed to test Jira connection');
    }

    return response.json();
  },
};
