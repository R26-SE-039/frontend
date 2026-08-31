type RtmPillProps = {
  label: string;
  type?: "priority" | "test" | "coverage" | "risk" | "source" | "quality" | "run";
};

export default function RtmPill({ label, type = "test" }: RtmPillProps) {
  const value = label.toLowerCase();
  let classes = "inline-flex rounded-full px-3 py-1 text-xs font-medium border capitalize whitespace-nowrap";

  if (type === "priority") {
    if (value === "must") classes += " bg-red-500/10 text-red-600 border-red-500/20";
    else if (value === "should") classes += " bg-amber-500/10 text-amber-600 border-amber-500/20";
    else if (value === "could") classes += " bg-green-500/10 text-green-600 border-green-500/20";
    else classes += " bg-gray-500/10 text-gray-600 border-gray-500/20";
  }

  if (type === "test") {
    if (value === "approved" || value === "passed") classes += " bg-green-500/10 text-green-600 border-green-500/20";
    else if (value === "rejected" || value === "failed") classes += " bg-red-500/10 text-red-600 border-red-500/20";
    else classes += " bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  }

  if (type === "coverage") {
    if (value === "fully covered") classes += " bg-green-500/10 text-green-600 border-green-500/20";
    else if (value === "partial") classes += " bg-amber-500/10 text-amber-600 border-amber-500/20";
    else classes += " bg-red-500/10 text-red-600 border-red-500/20";
  }

  if (type === "risk") {
    if (value === "critical") classes += " bg-red-500/10 text-red-600 border-red-500/20";
    else if (value === "high") classes += " bg-orange-500/10 text-orange-600 border-orange-500/20";
    else if (value === "medium") classes += " bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    else classes += " bg-green-500/10 text-green-600 border-green-500/20";
  }

  if (type === "source") {
    if (value === "c2") classes += " bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
    else classes += " bg-amber-500/10 text-amber-600 border-amber-500/20";
  }

  if (type === "quality") {
    if (value === "high") classes += " bg-green-500/10 text-green-600 border-green-500/20";
    else if (value === "medium") classes += " bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    else classes += " bg-red-500/10 text-red-600 border-red-500/20";
  }

  if (type === "run") {
    if (value === "passed" || value === "success") classes += " bg-green-500/10 text-green-600 border-green-500/20";
    else if (value === "failed" || value === "error") classes += " bg-red-500/10 text-red-600 border-red-500/20";
    else if (value === "running" || value === "queued") classes += " bg-blue-500/10 text-blue-600 border-blue-500/20";
    else classes += " bg-gray-500/10 text-gray-600 border-gray-500/20";
  }

  return <span className={classes}>{label.replace(/_/g, " ")}</span>;
}
