import React from 'react';
import { Folder, Users, Clock, ChevronRight } from 'lucide-react';
import { Project } from '../../store/useMeetingStore';

interface ProjectListItemProps {
  project: Project;
  onSelect: (project: Project) => void;
}

export const ProjectListItem: React.FC<ProjectListItemProps> = ({ project, onSelect }) => {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            <Folder size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{project.name}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{project.description}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${
          project.userRole === 'Admin' ? 'bg-blue-50 text-blue-600 border-blue-100' :
          project.userRole === 'Editor' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          'bg-slate-50 text-slate-400 border-slate-200'
        }`}>
          {project.userRole}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-600">{project.memberCount} members</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock size={14} />
          <span className="text-xs font-medium">{project.lastAccessed}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button 
          onClick={() => onSelect(project)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-sm"
        >
          Open Workspace
        </button>
      </td>
    </tr>
  );
};
