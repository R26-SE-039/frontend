const GWT_STEP_RE = /^(Given|When|Then|And|But)\b/i;

/** Keeps only Given/When/Then/And/But step lines from a Gherkin
 * description, dropping the Feature/Scenario headers and any story
 * preamble ("As a... I want... So that..."). */
export function extractGwtSteps(description: string): string {
  return description
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => GWT_STEP_RE.test(l))
    .join('\n');
}
