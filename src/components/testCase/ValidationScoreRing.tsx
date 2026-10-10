import type { ValidationVerdict } from '../../types/testCase';

type Props = {
  score: number;
  verdict?: ValidationVerdict;
  size?: number;
  label?: string;
};

export const verdictTone = (verdict?: ValidationVerdict | null) => {
  if (verdict === 'ready') return { stroke: '#16a34a', text: 'text-green-600', bg: 'bg-green-500/10 border-green-500/20', label: 'Ready to run' };
  if (verdict === 'needs_review') return { stroke: '#d97706', text: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Needs review' };
  if (verdict === 'likely_failing') return { stroke: '#dc2626', text: 'text-red-600', bg: 'bg-red-500/10 border-red-500/20', label: 'Likely failing' };
  return { stroke: '#94a3b8', text: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20', label: 'Not validated' };
};

export default function ValidationScoreRing({ score, verdict, size = 96, label = 'predicted pass' }: Props) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const tone = verdictTone(verdict);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-black leading-none ${tone.text}`}>{clamped}%</span>
        <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
    </div>
  );
}
