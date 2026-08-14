export type TestCaseMode = 'abstract' | 'dom';

export type TestCaseSetup = {
  mode: TestCaseMode;
  url: string;
  frameworks: string[];
};

export const TEST_CASE_FRAMEWORKS = ['selenium', 'playwright', 'cypress'] as const;

const storageKey = (projectId: string) => `test-case-gen-setup-${projectId}`;

const defaultSetup: TestCaseSetup = {
  mode: 'dom',
  url: 'https://www.saucedemo.com',
  frameworks: [...TEST_CASE_FRAMEWORKS],
};

export function loadTestCaseSetup(projectId: string): TestCaseSetup {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return { ...defaultSetup };
    const parsed = JSON.parse(raw);
    return {
      mode: parsed.mode === 'abstract' ? 'abstract' : 'dom',
      url: typeof parsed.url === 'string' ? parsed.url : defaultSetup.url,
      frameworks: Array.isArray(parsed.frameworks) && parsed.frameworks.length ? parsed.frameworks : [...TEST_CASE_FRAMEWORKS],
    };
  } catch {
    return { ...defaultSetup };
  }
}

export function saveTestCaseSetup(projectId: string, setup: TestCaseSetup): void {
  localStorage.setItem(storageKey(projectId), JSON.stringify(setup));
}
