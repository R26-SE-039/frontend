import { RAG_API_URL } from './config';
import { authenticatedFetch } from './authenticatedFetch';

export interface InvestValidation {
  Independent?: boolean;
  Negotiable?: boolean;
  Valuable?: boolean;
  Estimable?: boolean;
  Small?: boolean;
  Testable?: boolean;
}

export interface GeneratedStory {
  story_id: string;
  title: string;
  story: string;
  acceptance_criteria: string[];
  priority: string;
  confidence: number;
  status: string;
  clarification_questions: string[];
  evidence_refs: string[];
  invest_validation?: InvestValidation;
}

export interface StoryIssue {
  severity: 'high' | 'medium' | 'low';
  issue: string;
  recommendation?: string;
  context?: string;
  detail?: string;
  issue_type?: string;
}

export interface ValidationResult {
  story_id: string;
  rule_score: number;
  evidence_score: number;
  semantic_similarity: number;
  invest_score: number;
  hallucination_score: number;
  overall_quality_score: number;
  status: 'Approved' | 'Needs Review' | 'Rejected' | string;
  recommendation: string;
  invest_breakdown?: InvestValidation;
  issues?: StoryIssue[];
}

export interface PipelineRunResponse {
  transcript_id?: string;
  meeting_id?: string;
  indexed_chunks?: number;
  query?: string;
  stories: GeneratedStory[];
  issues?: StoryIssue[];
  evidence_chunk_ids?: string[];
  validation_results?: ValidationResult[];
}

export interface PipelineRunRequest {
  transcript: any;
  query?: string;
  top_k?: number;
}

// ── Story Update & Re-Validation ─────────────────────────────────────────────

export interface UpdateStoryPayload {
  meeting_id: string;
  title: string;
  story: string;
  acceptance_criteria: string[];
  priority: string;
}

export interface UpdateStoryResponse {
  status: string;
  meeting_id: string;
  story: GeneratedStory;
  validation_result: ValidationResult;
}

// ─────────────────────────────────────────────────────────────────────────────

export const ragApi = {
  uploadTranscript: async (file: File, query: string): Promise<PipelineRunResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('query', query);

    const response = await authenticatedFetch(`${RAG_API_URL}/pipeline/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload transcript');
    }

    return response.json();
  },

  runPipeline: async (request: any): Promise<PipelineRunResponse> => {
    const response = await authenticatedFetch(`${RAG_API_URL}/pipeline/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to run pipeline');
    }

    return response.json();
  },

  /**
   * Edit a user story and trigger mandatory backend 5-layer re-validation.
   * Quality scores and status are 100% system-calculated — not user-overridable.
   */
  updateStory: async (
    storyId: string,
    payload: UpdateStoryPayload,
  ): Promise<UpdateStoryResponse> => {
    const response = await authenticatedFetch(
      `${RAG_API_URL}/pipeline/user-stories/${storyId}/update`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const msg = await response.text().catch(() => 'Story update failed');
      throw new Error(msg);
    }

    return response.json();
  },
};


