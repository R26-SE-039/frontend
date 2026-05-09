import React from 'react';
import { motion } from 'framer-motion';
import { 
  Folder, Clock, UserPlus, Lock, Globe, ChevronRight, MoreVertical 
} from 'lucide-react';
import { Project } from '../../store/useMeetingStore';

interface ProjectCardProps {
  project: Project;
  idx: number;
  onSelect: (project: Project) => void;
  onInvite: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, idx, onSelect, onInvite }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div 
          onClick={() => onSelect(project)}
          className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors cursor-pointer"
        >
          <Folder size={20} />
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
            project.userRole === 'Admin' ? 'bg-blue-50 text-blue-600 border-blue-100' :
            project.userRole === 'Editor' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            'bg-slate-50 text-slate-400 border-slate-200'
          }`}>
            {project.userRole}
          </div>
          <button className="p-1 hover:bg-slate-50 rounded text-slate-300 hover:text-slate-600 transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <div className="flex-grow mb-6 cursor-pointer" onClick={() => onSelect(project)}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
          {project.isPrivate ? <Lock size={12} className="text-slate-300" /> : <Globe size={12} className="text-slate-300" />}
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
          {project.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1.5">
            {[...Array(Math.min(3, project.memberCount))].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400 uppercase">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            {project.memberCount > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[7px] font-bold text-slate-400">
                +{project.memberCount - 3}
              </div>
            )}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onInvite(project); }}
            className="p-1 hover:bg-blue-50 rounded text-blue-400 transition-colors"
            title="Invite Members"
          >
            <UserPlus size={14} />
          </button>
        </div>
        <button 
          onClick={() => onSelect(project)}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:gap-2 transition-all"
        >
          Open <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};
