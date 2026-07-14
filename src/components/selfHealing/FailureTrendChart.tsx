import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FAILURE_ANALYSIS_API_URL } from '../../api/config';

type TrendPoint = { name: string; failures: number };

type FailureTrendChartProps = {
  data?: TrendPoint[];
};

export default function FailureTrendChart({ data: providedData }: FailureTrendChartProps) {
  const [data, setData] = useState<TrendPoint[]>(providedData || []);
  const [loading, setLoading] = useState(!providedData);

  useEffect(() => {
    if (providedData) {
      setData(providedData);
      setLoading(false);
      return;
    }

    let isMounted = true;

    fetch(`${FAILURE_ANALYSIS_API_URL}/dashboard/trend`)
      .then((response) => (response.ok ? response.json() : []))
      .then((payload) => {
        if (isMounted && Array.isArray(payload)) setData(payload);
      })
      .catch(() => {
        if (isMounted) setData([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [providedData]);

  if (loading) {
    return <div className="h-[280px] w-full animate-pulse rounded-xl bg-[var(--card-2)]" />;
  }

  const hasData = data.some((item) => item.failures > 0);

  if (!hasData) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center text-sm text-[var(--muted)]">
        No failure trend data yet. Submit a failure to begin.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            formatter={(value) => [`${value} failures`, 'Failures']}
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
            labelStyle={{ color: 'var(--foreground)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
          <Line
            type="monotone"
            dataKey="failures"
            name="Failures"
            stroke="#60a5fa"
            strokeWidth={3}
            dot={{ r: 4, fill: '#60a5fa' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
