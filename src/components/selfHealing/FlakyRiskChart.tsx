import { useEffect, useMemo, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type RiskEntry = { name: string; value: number; color: string };

type FlakyRiskChartProps = {
  data?: RiskEntry[];
};

type TooltipPayload = {
  payload?: RiskEntry;
  value?: number;
  name?: string;
};

type RiskTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
};

const RISK_LEVELS: RiskEntry[] = [
  { name: 'High', value: 0, color: '#ef4444' },
  { name: 'Medium', value: 0, color: '#f59e0b' },
  { name: 'Low', value: 0, color: '#22c55e' },
];

function formatTestCount(value: number) {
  return `${value} ${value === 1 ? 'Test' : 'Tests'}`;
}

function RiskTooltip({ active, payload, total }: RiskTooltipProps & { total: number }) {
  if (!active || !payload?.length || !payload[0].payload) return null;

  const item = payload[0].payload;
  const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-black text-slate-900">{item.name} Risk</p>
      <p className="mt-1 font-bold text-slate-600">Count: {formatTestCount(item.value)}</p>
      <p className="font-bold text-slate-600">Percentage: {percentage}%</p>
    </div>
  );
}

export default function FlakyRiskChart({ data }: FlakyRiskChartProps) {
  const [mounted, setMounted] = useState(false);

  const chartData = useMemo(() => {
    return RISK_LEVELS.map((level) => {
      const match = data?.find((item) => item.name.toLowerCase() === level.name.toLowerCase());
      return {
        ...level,
        value: Math.max(0, Number(match?.value || 0)),
      };
    });
  }, [data]);

  const visibleData = useMemo(() => chartData.filter((item) => item.value > 0), [chartData]);
  const total = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);
  const dominantRisk = useMemo(() => {
    if (total === 0) return null;
    return chartData.reduce((highest, item) => (item.value > highest.value ? item : highest), chartData[0]);
  }, [chartData, total]);
  const activeCategoryCount = visibleData.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[320px] w-full animate-pulse rounded-2xl border border-slate-100/50 bg-slate-50/50" />
    );
  }

  return (
    <div className="flex h-[320px] min-h-[320px] w-full flex-col overflow-visible">
      <div className="min-h-0 flex-1">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm font-medium text-[var(--muted)]">
            No flaky tests detected yet.
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
                outerRadius={112}
                innerRadius={68}
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
                {formatTestCount(total)}
              </text>
              <text x="50%" y="56%" textAnchor="middle" dominantBaseline="central" className="fill-slate-500 text-xs font-bold">
                {activeCategoryCount === 1 && dominantRisk ? `${dominantRisk.name} Risk` : `${activeCategoryCount} Risk Levels`}
              </text>
              <Tooltip content={<RiskTooltip total={total} />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3">
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
