import { RAG_API_URL } from './config';

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
}

export interface PipelineRunResponse {
  transcript_id: string;
  indexed_chunks: number;
  query: string;
  stories: GeneratedStory[];
  issues: any[];
  evidence_chunk_ids: string[];
}

export const ragApi = {
  uploadTranscript: async (file: File, query: string): Promise<PipelineRunResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('query', query);

    const response = await fetch(`${RAG_API_URL}/pipeline/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload transcript');
    }

    return response.json();
  },

  runPipeline: async (request: any): Promise<PipelineRunResponse> => {
    const response = await fetch(`${RAG_API_URL}/pipeline/run`, {
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
  }
};

