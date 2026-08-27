/**
 * jiraApi.ts
 * Pushes BA-approved user stories to Jira via the project Jira config backend endpoint.
 */
import { AUTH_API_URL } from './config';
import { useMeetingStore } from '../store/useMeetingStore';
import { GeneratedStory, ValidationResult } from './ragApi';

export interface JiraPushResult {
  story_id: string;
  jira_key: string;
  jira_url: string;
  success: boolean;
  error?: string;
}

const getAuthHeaders = () => {
  const token = useMeetingStore.getState().user?.accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const toJiraPriority = (moscow: string): string => {
  if (moscow === 'Must') return 'High';
  if (moscow === 'Should') return 'Medium';
  return 'Low';
};

const buildDescription = (story: GeneratedStory, vr?: ValidationResult): any => {
  const acNodes = story.acceptance_criteria.map((ac, i) => ({
    type: 'listItem',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: `${i + 1}. ${ac}` }] }],
  }));
  const scoreInfo = vr
    ? `Quality Score: ${vr.overall_quality_score.toFixed(1)}/100 | System Status: ${vr.status}`
    : '';
  return {
    type: 'doc',
    version: 1,
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: story.story }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Acceptance Criteria' }] },
      { type: 'bulletList', content: acNodes },
      ...(scoreInfo ? [{ type: 'paragraph', content: [{ type: 'text', text: scoreInfo, marks: [{ type: 'em' }] }] }] : []),
    ],
  };
};

export const jiraApi = {
  pushStory: async (
    projectId: string,
    story: GeneratedStory,
    vr?: ValidationResult,
  ): Promise<JiraPushResult> => {
    const payload = {
      summary: story.title,
      description: buildDescription(story, vr),
      issue_type: 'Story',
      priority: toJiraPriority(story.priority),
      labels: ['NextGenQA', 'transcript-generated'],
    };
    const res = await fetch(`${AUTH_API_URL}/projects/${projectId}/jira/create-issue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { story_id: story.story_id, jira_key: '', jira_url: '', success: false, error: body.detail || body.message || `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { story_id: story.story_id, jira_key: data.key ?? data.jira_key ?? '', jira_url: data.url ?? data.jira_url ?? '', success: true };
  },

  pushBatch: async (
    projectId: string,
    stories: GeneratedStory[],
    getVr: (id: string) => ValidationResult | undefined,
  ): Promise<JiraPushResult[]> => {
    const results: JiraPushResult[] = [];
    for (const story of stories) {
      const result = await jiraApi.pushStory(projectId, story, getVr(story.story_id));
      results.push(result);
    }
    return results;
  },
};
