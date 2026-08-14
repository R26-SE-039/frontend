type StatusBadgeProps = {
  label: string;
  type?: 'status' | 'healing' | 'risk' | 'rootCause';
};

export default function StatusBadge({ label, type = 'status' }: StatusBadgeProps) {
  const value = label.toLowerCase();
  let classes = 'inline-flex rounded-full px-3 py-1 text-xs font-medium border capitalize';

  if (type === 'status') {
    if (value === 'fail') classes += ' bg-red-500/10 text-red-600 border-red-500/20';
    else if (value === 'pass') classes += ' bg-green-500/10 text-green-600 border-green-500/20';
    else classes += ' bg-gray-500/10 text-gray-600 border-gray-500/20';
  }

  if (type === 'healing') {
    if (value === 'applied') classes += ' bg-green-500/10 text-green-600 border-green-500/20';
    else if (value === 'suggested') classes += ' bg-blue-500/10 text-blue-600 border-blue-500/20';
    else if (value === 'pending') classes += ' bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    else if (value === 'rejected') classes += ' bg-red-500/10 text-red-600 border-red-500/20';
    else classes += ' bg-gray-500/10 text-gray-600 border-gray-500/20';
  }

  if (type === 'risk') {
    if (value === 'high') classes += ' bg-red-500/10 text-red-600 border-red-500/20';
    else if (value === 'medium') classes += ' bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    else if (value === 'low') classes += ' bg-green-500/10 text-green-600 border-green-500/20';
    else classes += ' bg-gray-500/10 text-gray-600 border-gray-500/20';
  }

  if (type === 'rootCause') {
    if (value === 'application_defect') classes += ' bg-pink-500/10 text-pink-700 border-pink-500/20';
    else if (value === 'test_script_issue') classes += ' bg-blue-500/10 text-blue-700 border-blue-500/20';
    else if (value === 'network_issue') classes += ' bg-red-500/10 text-red-700 border-red-500/20';
    else if (value === 'dependency_issue') classes += ' bg-orange-500/10 text-orange-700 border-orange-500/20';
    else if (value === 'workflow_environment_issue') classes += ' bg-cyan-500/10 text-cyan-700 border-cyan-500/20';
    else if (value === 'infrastructure_resource_issue') classes += ' bg-slate-500/10 text-slate-700 border-slate-500/20';
    else if (value === 'deployment_issue') classes += ' bg-violet-500/10 text-violet-700 border-violet-500/20';
    else if (value === 'security_policy_issue') classes += ' bg-rose-500/10 text-rose-700 border-rose-500/20';
    else classes += ' bg-gray-500/10 text-gray-600 border-gray-500/20';
  }

  return <span className={classes}>{label.replace(/_/g, ' ')}</span>;
}
