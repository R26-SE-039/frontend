import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Folder, Clock, Users, ArrowRight, LogOut, Search, Grid, List, 
  MoreVertical, Shield, Lock, Globe, UserPlus, Settings, Layout, 
  ChevronRight, Calendar, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMeetingStore, Project } from '../store/useMeetingStore';
import { InviteModal } from '../components/project/InviteModal';
import { CreateProjectModal } from '../components/project/CreateProjectModal';
import { ProjectCard } from '../components/project/ProjectCard';
import { ProjectListItem } from '../components/project/ProjectListItem';
import { projectApi } from '../api/projectApi';

// Dummy projects removed - using backend API

export const ProjectDashboard: React.FC = () => {
  const { user, logout, setCurrentProject } = useMeetingStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreating, setIsCreating] = useState(false);
  const [invitingProject, setInvitingProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    navigate('/dashboard');
  };

  const handleCreateProject = async (name: string, description: string, invitedEmails: string[]) => {
    try {
      const project = await projectApi.createProject({ name, description });
      
      // Send invitations in background
      if (invitedEmails.length > 0) {
        Promise.all(invitedEmails.map(email => 
          projectApi.inviteMember(project.id, email, 'Editor')
        )).catch(err => console.error('Failed to send some invitations:', err));
      }

      handleSelectProject(project);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex font-sans selection:bg-slate-200">
      {/* Slim Professional Sidebar */}
      <aside className="w-20 bg-blue-600 flex flex-col items-center py-8 gap-8 hidden md:flex shrink-0">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Layout className="text-blue-600" size={24} />
        </div>
        <div className="flex flex-col gap-6 flex-grow">
          <button className="p-3 bg-blue-700 text-white rounded-xl shadow-sm"><Grid size={20} /></button>
          <button className="p-3 text-blue-200 hover:text-white transition-colors"><Users size={20} /></button>
          <button className="p-3 text-blue-200 hover:text-white transition-colors"><Settings size={20} /></button>
        </div>
        <button 
          onClick={logout}
          className="p-3 text-blue-200 hover:text-rose-200 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Enterprise Top Bar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-slate-900">Workspace Hub</h1>
            <div className="h-8 w-px bg-slate-200" />
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Find projects, members, or tasks..."
                className="w-full bg-slate-100 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-slate-200 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user?.agileRole}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
              {user?.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Action Bar */}
        <div className="bg-white/50 backdrop-blur-sm border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-200/60 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Grid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List size={16} />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {filteredProjects.length} Projects
            </p>
          </div>

          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-blue-200"
          >
            <Plus size={16} />
            Create Project
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Synchronizing Workspaces...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-6">
                  <Folder size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">No workspaces found</h3>
                <p className="text-slate-400 text-sm font-medium mb-8 max-w-xs text-center">Get started by creating your first agile project workspace.</p>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
                >
                  Create Your First Project
                </button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                  <motion.div 
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  >
                    {filteredProjects.map((project, idx) => (
                      <ProjectCard 
                        key={project.id}
                        project={project}
                        idx={idx}
                        onSelect={handleSelectProject}
                        onInvite={setInvitingProject}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                  >
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Name</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map((project) => (
                          <ProjectListItem 
                            key={project.id}
                            project={project}
                            onSelect={handleSelectProject}
                          />
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isCreating && (
          <CreateProjectModal 
            onClose={() => setIsCreating(false)} 
            onCreate={handleCreateProject} 
          />
        )}
      </AnimatePresence>

      {/* Invitation Modal */}
      <AnimatePresence>
        {invitingProject && (
          <InviteModal 
            projectName={invitingProject.name} 
            onClose={() => setInvitingProject(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
