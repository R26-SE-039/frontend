import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type DonutEntry = { name: string; value: number; color: string };

type TooltipPayload = { payload?: DonutEntry };

type DonutTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  total: number;
};

function DonutTooltip({ active, payload, total }: DonutTooltipProps) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const item = payload[0].payload;
  const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-black text-slate-900">{item.name}</p>
      <p className="mt-1 font-bold text-slate-600">Scenarios: {item.value}</p>
      <p className="font-bold text-slate-600">Percentage: {percentage}%</p>
    </div>
  );
}

type TestCaseRunDonutProps = {
  passed: number;
  failed: number;
};

export default function TestCaseRunDonut({ passed, failed }: TestCaseRunDonutProps) {
  const chartData = useMemo<DonutEntry[]>(
    () => [
      { name: 'Passed', value: Math.max(0, passed), color: '#22c55e' },
      { name: 'Failed', value: Math.max(0, failed), color: '#ef4444' },
    ],
    [passed, failed],
  );
  const visibleData = useMemo(() => chartData.filter((item) => item.value > 0), [chartData]);
  const total = passed + failed;
  const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="flex h-[260px] min-h-[260px] w-full flex-col overflow-visible">
      <div className="min-h-0 flex-1">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm font-medium text-[var(--muted)]">
            No scenario results in this run.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={visibleData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={88}
                innerRadius={56}
                paddingAngle={visibleData.length > 1 ? 3 : 0}
                label={false}
                labelLine={false}
                isAnimationActive={false}
              >
                {visibleData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="#ffffff" strokeWidth={3} />
                ))}
              </Pie>
              <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="fill-slate-900 text-xl font-black">
                {successRate}%
              </text>
              <text x="50%" y="58%" textAnchor="middle" dominantBaseline="central" className="fill-slate-500 text-xs font-bold">
                Success Rate
              </text>
              <Tooltip content={<DonutTooltip total={total} />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3">
        {chartData.map((item) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] font-black text-slate-700">{item.name}</span>
              </div>
              <p className="mt-1 text-xs font-extrabold text-slate-900">{item.value}</p>
              <p className="text-[10px] font-bold text-slate-400">{percentage}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
