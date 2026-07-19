type TestCasePillProps = {
  label: string;
  type?: 'priority' | 'status' | 'source' | 'approval' | 'run';
};

export default function TestCasePill({ label, type = 'status' }: TestCasePillProps) {
  const value = label.toLowerCase();
  let classes = 'inline-flex rounded-full px-3 py-1 text-xs font-medium border capitalize';

  if (type === 'priority') {
    if (value === 'high') classes += ' bg-red-500/10 text-red-600 border-red-500/20';
    else if (value === 'medium') classes += ' bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    else if (value === 'low') classes += ' bg-green-500/10 text-green-600 border-green-500/20';
    else classes += ' bg-gray-500/10 text-gray-600 border-gray-500/20';
  }

  if (type === 'status') {
    if (value === 'done') classes += ' bg-green-500/10 text-green-600 border-green-500/20';
    else if (value === 'processing') classes += ' bg-blue-500/10 text-blue-600 border-blue-500/20';
    else if (value === 'pending') classes += ' bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    else classes += ' bg-gray-500/10 text-gray-600 border-gray-500/20';
  }

  if (type === 'source') {
    if (value === 'c1') classes += ' bg-purple-500/10 text-purple-600 border-purple-500/20';
    else classes += ' bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
  }

  if (type === 'approval') {
    if (value === 'approved') classes += ' bg-green-500/10 text-green-600 border-green-500/20';
    else classes += ' bg-gray-500/10 text-gray-600 border-gray-500/20';
  }

  if (type === 'run') {
    if (value === 'passed' || value === 'success') classes += ' bg-green-500/10 text-green-600 border-green-500/20';
    else if (value === 'failed' || value === 'error') classes += ' bg-red-500/10 text-red-600 border-red-500/20';
    else if (value === 'running' || value === 'queued') classes += ' bg-blue-500/10 text-blue-600 border-blue-500/20';
    else classes += ' bg-gray-500/10 text-gray-600 border-gray-500/20';
  }

  return <span className={classes}>{label.replace(/_/g, ' ')}</span>;
}
