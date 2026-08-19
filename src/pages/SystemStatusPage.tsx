import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, RefreshCw, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import { GATEWAY_BASE_URL } from '../api/config';

type ServiceHealth = {
  name: string;
  prefix: string;
  target: string;
  status: 'up' | 'degraded' | 'down';
  httpStatus: number | null;
  latencyMs: number;
};

type HealthResponse = {
  gateway: string;
  checkedAt: string;
  services: ServiceHealth[];
};

const POLL_INTERVAL_MS = 10_000;

const SERVICE_LABELS: Record<string, string> = {
  auth: 'Auth Service',
  story: 'User Story Gen (C1)',
  'test-case': 'Test Case Gen (C2)',
  failure: 'Failure Analysis (C3)',
  'repair-agent': 'Repair Agent (C3)',
  rtm: 'RTM Generator (C4)',
};

const STATUS_STYLES: Record<ServiceHealth['status'], { dot: string; pill: string; label: string }> = {
  up: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Operational' },
  degraded: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Degraded' },
  down: { dot: 'bg-rose-500', pill: 'bg-rose-50 text-rose-600 border-rose-100', label: 'Down' },
};

export default function SystemStatusPage() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [gatewayUp, setGatewayUp] = useState<boolean | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const probe = useCallback(async () => {
    try {
      const response = await fetch(`${GATEWAY_BASE_URL}/health/services`);
      if (!response.ok) throw new Error(`Gateway responded ${response.status}`);
      const data: HealthResponse = await response.json();
      setServices(data.services);
      setCheckedAt(data.checkedAt);
      setGatewayUp(true);
    } catch {
      setGatewayUp(false);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    probe();
    const timer = setInterval(probe, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [probe]);

  const upCount = services.filter((svc) => svc.status === 'up').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Microservice Status</h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Live health of every backend behind the API Gateway — probed server-side every {POLL_INTERVAL_MS / 1000}s.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            probe();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:text-blue-600"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh now
        </button>
      </div>

      {gatewayUp === false && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <AlertTriangle size={18} className="shrink-0" />
          API Gateway unreachable at {GATEWAY_BASE_URL}. Start it with <code className="font-mono font-bold">npm run dev</code> in{' '}
          <code className="font-mono font-bold">api-gateway/</code>.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Server size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Gateway</p>
              <p className="text-sm font-black text-slate-900">
                {gatewayUp === null ? 'Checking...' : gatewayUp ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Services Up</p>
              <p className="text-sm font-black text-slate-900">
                {gatewayUp ? `${upCount} / ${services.length}` : '--'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <RefreshCw size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Checked</p>
              <p className="text-sm font-black text-slate-900">
                {checkedAt ? new Date(checkedAt).toLocaleTimeString() : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading && gatewayUp === null ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((svc, index) => {
            const styles = STATUS_STYLES[svc.status] ?? STATUS_STYLES.down;
            return (
              <motion.div
                key={svc.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{SERVICE_LABELS[svc.name] ?? svc.name}</p>
                    <p className="mt-1 truncate font-mono text-[11px] font-bold text-slate-400">
                      {svc.prefix} → {svc.target}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${styles.pill}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${styles.dot} ${svc.status === 'up' ? 'animate-pulse' : ''}`} />
                    {styles.label}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-4 text-[11px] font-bold text-slate-500">
                  <span>Latency: {svc.status === 'down' ? '--' : `${svc.latencyMs} ms`}</span>
                  <span>HTTP: {svc.httpStatus ?? '--'}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
