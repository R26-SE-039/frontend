import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export function RtmSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-100 border-t-amber-600" />
      <p className="text-xs font-semibold text-[var(--muted)]">{label}</p>
    </div>
  );
}

export function RtmErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function RtmEmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        {icon}
      </div>
      <p className="text-sm font-bold text-[var(--foreground)]">{title}</p>
      <p className="max-w-md text-xs text-[var(--muted)]">{subtitle}</p>
      {action}
    </div>
  );
}
