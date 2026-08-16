import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Folder, Clock, Lock, Globe, ChevronRight, MoreVertical, Settings, Target 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Project, Iteration } from '../../store/useMeetingStore';
import { iterationApi } from '../../api/iterationApi';
import { projectConfigApi, ProjectConfiguration } from '../../api/projectConfigApi';

interface ProjectCardProps {
  project: Project;
  idx: number;
  onSelect: (project: Project) => void;
  onInvite?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, idx, onSelect, onInvite }) => {
  const navigate = useNavigate();
  const [activeSprint, setActiveSprint] = useState<Iteration | null>(null);
  const [jiraConfig, setJiraConfig] = useState<ProjectConfiguration | null>(null);

  useEffect(() => {
    iterationApi.getActiveIteration(project.id)
      .then(iter => setActiveSprint(iter))
      .catch(() => {});

    projectConfigApi.getConfiguration(project.id)
      .then(config => setJiraConfig(config))
      .catch(() => {});
  }, [project.id]);
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
        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-3">
          {project.description}
        </p>

        {activeSprint ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold tracking-wider uppercase border border-emerald-100">
            <Target size={12} />
            {activeSprint.name}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-500 rounded text-[10px] font-bold tracking-wider uppercase border border-slate-200">
            <Target size={12} />
            No Active Sprint
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
            title="Project Settings (Members & Sprints)"
          >
            <Settings size={16} />
          </button>

          {jiraConfig?.jira_url && jiraConfig?.jira_project_key && (
            <a 
              href={`${jiraConfig.jira_url}/browse/${jiraConfig.jira_project_key}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1.5"
              title={`Open Jira Project (${jiraConfig.jira_project_key})`}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Jira_Logo.svg" alt="Jira" className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">{jiraConfig.jira_project_key}</span>
            </a>
          )}
        </div>

        <button 
          onClick={() => onSelect(project)}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:gap-2 transition-all"
        >
          Open Dashboard <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};
