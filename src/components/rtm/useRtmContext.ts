import { useCallback, useEffect, useState } from "react";
import { meetingApi } from "../../api/meetingApi";
import { testCaseApi } from "../../api/testCaseApi";
import { useMeetingStore } from "../../store/useMeetingStore";
import type { C1IterationStoriesResponse } from "../../types/testCase";

export interface RtmContext {
  projectId: string | null;
  iterationId: string | null;
  iterationName: string | null;
  projectName: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Resolves the RTM scope from the workspace's open project — the same way
 * Test Case Gen does it: ensureProject() get-or-creates the C2 project under
 * the auth-service project UUID, and Component 1's iteration-stories endpoint
 * names the project's active iteration. Every RTM page starts from this hook,
 * so the open project flows into the RTM with zero manual input.
 */
export function useRtmContext(): RtmContext {
  const currentProject = useMeetingStore((s) => s.currentProject);
  const [state, setState] = useState<Omit<RtmContext, "reload">>({
    projectId: null,
    iterationId: null,
    iterationName: null,
    projectName: null,
    loading: true,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        if (!currentProject) {
          throw new Error("Select a project before opening the RTM module.");
        }
        const projectId = await testCaseApi.ensureProject();
        const data: C1IterationStoriesResponse = await meetingApi.getIterationStories(projectId);
        const iterationId = data.iteration?.id ?? null;
        if (!iterationId) {
          throw new Error(
            "This project has no active iteration yet — create one in the Meeting module first.",
          );
        }
        if (cancelled) return;
        setState({
          projectId,
          iterationId,
          iterationName: (data.iteration?.name as string) ?? null,
          projectName: currentProject.name,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          projectId: null,
          iterationId: null,
          iterationName: null,
          projectName: currentProject?.name ?? null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to resolve the open project.",
        });
      }
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [currentProject, reloadKey]);

  return { ...state, reload };
}
