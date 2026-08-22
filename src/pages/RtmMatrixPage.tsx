import { BarChart3, Bug, CheckCircle2, Clock, FileText, ListChecks, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getComponent1RequirementsWithStories,
  getComponent2Projects,
  getComponent2Status,
  getComponent2TraceabilityTestCases,
  getGeneratedGapTestCases,
  getProjectSettings,
  updateProjectSettings,
} from '../api/rtmApi';
import type {
  C1RequirementWithStoryOut,
  C2GherkinTestCaseOut,
  C2ProjectOut,
  C2StatusOut,
  ProjectSettingsOut,
} from '../types/rtm';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: { border: string; bg: string; text: string };
}

function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border-l-4 bg-white p-5 shadow-sm ${accent.border}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${accent.bg}`}>
        <Icon size={18} className={accent.text} />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-bold text-[#1e1b4b]">{value}</p>
      </div>
    </div>
  );
}

function TestStatusBadge({ status }: { status: string }) {
  if (status === 'approved')
    return (
      <span className="inline-flex items-center gap-1 text-green-600">
        <CheckCircle2 size={16} /> Pass
      </span>
    );
  if (status === 'rejected')
    return (
      <span className="inline-flex items-center gap-1 text-red-600">
        <XCircle size={16} /> Fail
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <Clock size={16} /> Pending
    </span>
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  Must: 'bg-red-100 text-red-700',
  Should: 'bg-amber-100 text-amber-700',
  Could: 'bg-blue-100 text-blue-700',
  "Won't": 'bg-slate-100 text-slate-500',
};

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[priority] || 'bg-slate-100 text-slate-500'}`}>
      {priority || '—'}
    </span>
  );
}

function RequirementStatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-600">
      {status || '—'}
    </span>
  );
}

function ShortId({ id }: { id: string | null | undefined }) {
  if (!id) return <span className="text-slate-400">—</span>;
  return (
    <span title={id} className="font-mono text-xs text-slate-600">
      {id.length > 8 ? `${id.slice(0, 8)}…` : id}
    </span>
  );
}

interface C1Row {
  item: C1RequirementWithStoryOut;
  testCase: C2GherkinTestCaseOut | null;
}

export default function RtmMatrixPage() {
  const [settings, setSettings] = useState<ProjectSettingsOut | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [c2Status, setC2Status] = useState<C2StatusOut | null>(null);
  const [c2Projects, setC2Projects] = useState<C2ProjectOut[]>([]);
  const [c2TestCases, setC2TestCases] = useState<C2GherkinTestCaseOut[]>([]);
  const [generatedTestCases, setGeneratedTestCases] = useState<C2GherkinTestCaseOut[]>([]);

  const [c1Requirements, setC1Requirements] = useState<C1RequirementWithStoryOut[]>([]);
  const [c1Loading, setC1Loading] = useState(false);
  const [c1Error, setC1Error] = useState<string | null>(null);

  const fetchC1 = (iterationId: string | null | undefined) => {
    if (!iterationId) {
      setC1Requirements([]);
      setC1Error(null);
      return;
    }
    setC1Loading(true);
    getComponent1RequirementsWithStories(iterationId)
      .then((data) => {
        setC1Requirements(data);
        setC1Error(null);
      })
      .catch((e) => {
        setC1Requirements([]);
        setC1Error(
          e?.response?.data?.detail || "Component 1 is unreachable, or this iteration wasn't found."
        );
      })
      .finally(() => setC1Loading(false));
  };

  useEffect(() => {
    getProjectSettings()
      .then((s) => {
        setSettings(s);
        fetchC1(s.component1_iteration_id);
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
    getComponent2Status()
      .then(setC2Status)
      .catch(() => setC2Status({ connected: false, base_url: '' }));
    getGeneratedGapTestCases()
      .then((rows) =>
        setGeneratedTestCases(
          rows
            .filter((r) => r.test_case.added_to_rtm)
            .map((r) => ({
              story_id: r.prediction.story_id,
              id: r.prediction.test_case_id,
              title: r.prediction.title,
              description: r.prediction.description,
              status: r.prediction.status,
            }))
        )
      )
      .catch(() => setGeneratedTestCases([]));
  }, []);

  useEffect(() => {
    if (c2Status?.connected) {
      getComponent2Projects()
        .then(setC2Projects)
        .catch(() => setC2Projects([]));
    }
  }, [c2Status?.connected]);

  const linkedC2ProjectId = settings?.component2_project_id || '';
  const iterationId = settings?.component1_iteration_id || '';

  useEffect(() => {
    if (!c2Status?.connected || !linkedC2ProjectId) {
      setC2TestCases([]);
      return;
    }
    getComponent2TraceabilityTestCases(linkedC2ProjectId, iterationId || undefined)
      .then(setC2TestCases)
      .catch(() => setC2TestCases([]));
  }, [c2Status?.connected, linkedC2ProjectId, iterationId]);

  const saveSettings = (field: keyof ProjectSettingsOut) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({ ...(settings as ProjectSettingsOut), [field]: e.target.value });
  };

  const persistSettings = () => {
    if (settings) updateProjectSettings(settings).catch(() => {});
  };

  const handleLinkC2Project = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updated = { ...(settings as ProjectSettingsOut), component2_project_id: e.target.value || null };
    setSettings(updated);
    updateProjectSettings(updated).catch(() => {});
  };

  const handleRefresh = () => {
    fetchC1(settings?.component1_iteration_id);
    if (c2Status?.connected && linkedC2ProjectId) {
      getComponent2TraceabilityTestCases(linkedC2ProjectId, iterationId || undefined)
        .then(setC2TestCases)
        .catch(() => setC2TestCases([]));
    }
  };

  // Join key: Component 2 stamps each imported story's id from Component 1's
  // user_story_id (source: "C1"), so a C1 requirement item's user_story_id
  // matches a C2 test case's story_id directly — no fuzzy matching needed here.
  // Generated-and-added-to-RTM test cases (from the Coverage Gaps page) are
  // merged in the same way, giving them a real traceability row here too.
  const allTestCases = [...c2TestCases, ...generatedTestCases];
  const testCasesByStoryId = new Map<string, C2GherkinTestCaseOut[]>();
  for (const tc of allTestCases) {
    if (!testCasesByStoryId.has(tc.story_id)) testCasesByStoryId.set(tc.story_id, []);
    testCasesByStoryId.get(tc.story_id)!.push(tc);
  }
  const matchedStoryIds = new Set(c1Requirements.map((item) => item.user_story_id));
  const unlinkedC2TestCases = allTestCases.filter((tc) => !matchedStoryIds.has(tc.story_id));

  const c1Rows: C1Row[] = c1Requirements.flatMap((item): C1Row[] => {
    const testCases = testCasesByStoryId.get(item.user_story_id) || [];
    if (testCases.length === 0) return [{ item, testCase: null }];
    return testCases.map((testCase) => ({ item, testCase }));
  });

  const uniqueRequirementCount = new Set(c1Requirements.map((r) => r.requirement_id)).size;
  const totalTestCases = allTestCases.length;
  const passedCount = allTestCases.filter((tc) => tc.status === 'approved').length;
  const passRate = totalTestCases ? (passedCount / totalTestCases) * 100 : 0;
  const defects = allTestCases.filter((tc) => tc.status === 'rejected').length;

  const handleDownloadPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Requirements Traceability Matrix', 14, 16);
    doc.setFontSize(10);
    doc.text(settings?.project_name || '', 14, 23);

    const body = [
      ...c1Rows.map(({ item, testCase }) => [
        item.requirement_id,
        item.requirement_text,
        item.requirement_type,
        item.requirement_status,
        item.user_story_id,
        item.user_story_title,
        item.user_story_text,
        item.priority,
        (item.acceptance_criteria || []).join(' | '),
        testCase ? testCase.id : '—',
        testCase ? testCase.description : 'No test linked',
        testCase ? testCase.status : '—',
      ]),
      ...unlinkedC2TestCases.map((tc) => [
        'Component 2',
        'Test case not linked to any Component 1 requirement',
        '—',
        '—',
        tc.story_id,
        '—',
        '—',
        '—',
        '—',
        tc.id,
        tc.description,
        tc.status,
      ]),
    ];

    autoTable(doc, {
      startY: 28,
      head: [[
        'Req ID', 'Requirement Text', 'Req Type', 'Req Status',
        'Story ID', 'Story Title', 'Story Text', 'Priority', 'Acceptance Criteria',
        'Test Case ID', 'Test Description', 'Result',
      ]],
      body,
      styles: { fontSize: 6 },
      headStyles: { fillColor: [67, 56, 202] },
    });

    doc.save('RTM_Report.pdf');
  };

  if (!settingsLoaded) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full max-w-md rounded-xl border border-indigo-900/70 p-4 lg:w-[380px]">
          {(
            [
              ['project_name', 'Project Name:'],
              ['project_manager', 'Project Manager:'],
              ['project_description', 'Project Desc:'],
            ] as const
          ).map(([field, label]) => (
            <div key={field} className="mb-2 flex items-start gap-2 last:mb-0">
              <span className="w-32 shrink-0 pt-1 text-sm font-bold text-slate-700">{label}</span>
              {field === 'project_description' ? (
                <textarea
                  rows={2}
                  className="w-full resize-none border-b border-slate-400 bg-transparent pb-1 text-sm text-indigo-700 focus:border-indigo-600 focus:outline-none"
                  value={settings?.[field] || ''}
                  onChange={saveSettings(field)}
                  onBlur={persistSettings}
                />
              ) : (
                <input
                  className="w-full border-b border-slate-400 bg-transparent pb-1 text-sm text-indigo-700 focus:border-indigo-600 focus:outline-none"
                  value={settings?.[field] || ''}
                  onChange={saveSettings(field)}
                  onBlur={persistSettings}
                />
              )}
            </div>
          ))}

          <div className="mt-3 flex items-start gap-2 border-t border-slate-200 pt-3">
            <span className="w-32 shrink-0 pt-1 text-sm font-bold text-slate-700">
              C1 Iteration ID:
            </span>
            <input
              className="w-full border-b border-slate-400 bg-transparent pb-1 text-sm text-indigo-700 focus:border-indigo-600 focus:outline-none"
              placeholder="Paste Component 1 iteration UUID…"
              value={iterationId}
              onChange={saveSettings('component1_iteration_id')}
              onBlur={() => {
                persistSettings();
                fetchC1(settings?.component1_iteration_id);
              }}
            />
          </div>

          {c2Status?.connected && (
            <div className="mt-3 flex items-start gap-2 border-t border-slate-200 pt-3">
              <span className="w-32 shrink-0 pt-1 text-sm font-bold text-slate-700">
                Project:
              </span>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-indigo-700 focus:border-indigo-600 focus:outline-none"
                value={linkedC2ProjectId}
                onChange={handleLinkC2Project}
              >
                <option value="">Not linked</option>
                {c2Projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <h1 className="text-right text-3xl font-extrabold leading-tight text-[#1e1b4b]">
            Requirements
            <br />
            Traceability Matrix
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={15} /> REFRESH
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <FileText size={15} /> DOWNLOAD PDF REPORT
            </button>
          </div>
          <p className="max-w-xs text-right text-xs text-slate-400">
            Requirements &amp; user stories are auto-generated from Component 1's linked
            iteration; test cases from Component 2's linked project.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-5">
        <StatCard
          label="Requirements"
          value={uniqueRequirementCount}
          icon={ListChecks}
          accent={{ border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-500' }}
        />
        <StatCard
          label="Test Cases"
          value={totalTestCases}
          icon={CheckCircle2}
          accent={{ border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-500' }}
        />
        <StatCard
          label="Total Pass Rate"
          value={`${passRate.toFixed(1)}%`}
          icon={BarChart3}
          accent={{ border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-500' }}
        />
        <StatCard
          label="Defects Found"
          value={defects}
          icon={Bug}
          accent={{ border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-500' }}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[1600px] border-collapse text-sm">
          <thead>
            <tr>
              <th colSpan={9} className="border-b border-blue-100 bg-blue-50 px-4 py-2 text-left font-bold text-blue-800">
                Requirements &amp; User Stories (Component 1)
              </th>
              <th colSpan={3} className="border-b border-green-100 bg-green-50 px-4 py-2 text-left font-bold text-green-800">
                Testing
              </th>
            </tr>
            <tr className="text-xs uppercase text-slate-500">
              <th className="px-4 py-2 text-left">Req. ID</th>
              <th className="px-4 py-2 text-left">Requirement Text</th>
              <th className="px-4 py-2 text-left">Req. Type</th>
              <th className="px-4 py-2 text-left">Req. Status</th>
              <th className="px-4 py-2 text-left">User Story ID</th>
              <th className="px-4 py-2 text-left">User Story Title</th>
              <th className="px-4 py-2 text-left">User Story Text</th>
              <th className="px-4 py-2 text-left">Priority</th>
              <th className="px-4 py-2 text-left">Acceptance Criteria</th>
              <th className="px-4 py-2 text-left">Test Case ID</th>
              <th className="px-4 py-2 text-left">Test Description</th>
              <th className="px-4 py-2 text-left">TEST</th>
            </tr>
          </thead>
          <tbody>
            {c1Rows.map(({ item, testCase }, i) => (
              <tr key={`c1-${item.requirement_id}-${testCase?.id ?? 'none'}-${i}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2.5"><ShortId id={item.requirement_id} /></td>
                <td className="max-w-[220px] px-4 py-2.5 text-slate-600">{item.requirement_text}</td>
                <td className="px-4 py-2.5 text-slate-600">{item.requirement_type || '—'}</td>
                <td className="px-4 py-2.5"><RequirementStatusBadge status={item.requirement_status} /></td>
                <td className="px-4 py-2.5"><ShortId id={item.user_story_id} /></td>
                <td className="max-w-[180px] px-4 py-2.5 text-slate-600">{item.user_story_title}</td>
                <td className="max-w-[240px] px-4 py-2.5 text-slate-600">{item.user_story_text}</td>
                <td className="px-4 py-2.5"><PriorityBadge priority={item.priority} /></td>
                <td className="max-w-[240px] px-4 py-2.5 text-slate-600">
                  {item.acceptance_criteria?.length ? (
                    <ul className="max-h-24 list-disc space-y-1 overflow-y-auto pl-4">
                      {item.acceptance_criteria.map((ac, j) => (
                        <li key={j} className="text-xs">{ac}</li>
                      ))}
                    </ul>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-2.5"><ShortId id={testCase?.id} /></td>
                <td className="max-w-[240px] px-4 py-2.5 text-slate-600">
                  {testCase ? (
                    <pre className="max-h-24 overflow-y-auto whitespace-pre-wrap font-sans text-xs">
                      {testCase.description}
                    </pre>
                  ) : (
                    'No test linked'
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {testCase ? <TestStatusBadge status={testCase.status} /> : '—'}
                </td>
              </tr>
            ))}
            {unlinkedC2TestCases.map((tc, i) => (
              <tr key={`c2-${tc.id}-${i}`} className="border-b border-slate-100 bg-indigo-50/20 last:border-0 hover:bg-indigo-50/40">
                <td className="px-4 py-2.5 font-medium">
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    Component 2
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-500">Test case not linked to any Component 1 requirement</td>
                <td className="px-4 py-2.5 text-slate-500">—</td>
                <td className="px-4 py-2.5 text-slate-500">—</td>
                <td className="px-4 py-2.5"><ShortId id={tc.story_id} /></td>
                <td className="px-4 py-2.5 text-slate-500">—</td>
                <td className="px-4 py-2.5 text-slate-500">—</td>
                <td className="px-4 py-2.5 text-slate-500">—</td>
                <td className="px-4 py-2.5 text-slate-500">—</td>
                <td className="px-4 py-2.5"><ShortId id={tc.id} /></td>
                <td className="max-w-[240px] px-4 py-2.5 text-slate-600">
                  <pre className="max-h-24 overflow-y-auto whitespace-pre-wrap font-sans text-xs">
                    {tc.description}
                  </pre>
                </td>
                <td className="px-4 py-2.5">
                  <TestStatusBadge status={tc.status} />
                </td>
              </tr>
            ))}
            {c1Requirements.length === 0 && allTestCases.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                  {!iterationId
                    ? 'Enter a Component 1 iteration ID above to auto-generate this matrix.'
                    : c1Loading
                      ? 'Loading requirements from Component 1…'
                      : c1Error || 'No requirements found for this iteration.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {c1Error && c1Requirements.length === 0 && (
        <p className="mt-2 text-xs text-red-600">{c1Error}</p>
      )}
    </div>
  );
}
