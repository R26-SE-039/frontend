import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Settings, Users, Folder, Trash2, Plus, X, ListTodo, Calendar, AlertCircle, GitBranch
} from 'lucide-react';
import { projectConfigApi } from '../api/projectConfigApi';
import { projectApi } from '../api/projectApi';
import { projectMemberApi } from '../api/projectMemberApi';
import { iterationApi } from '../api/iterationApi';
import { useMeetingStore, Iteration, IterationStatus } from '../store/useMeetingStore';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useMeetingStore();

  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Add Member state
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('MEMBER');

  // Iteration state
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [isAddingIteration, setIsAddingIteration] = useState(false);
  const [newIteration, setNewIteration] = useState({ name: '', goal: '', start_date: '', end_date: '' });

  // Project Config state
  const [repoUrl, setRepoUrl] = useState('');
  const [pat, setPat] = useState('');
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  // Jira Config state
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraPat, setJiraPat] = useState('');
  const [jiraProjectKey, setJiraProjectKey] = useState('');
  const [isEditingJiraConfig, setIsEditingJiraConfig] = useState(false);
  const [hasJiraConfig, setHasJiraConfig] = useState(false);
  const [isTestingJira, setIsTestingJira] = useState(false);

  const isAdminOrOwner = user?.role === 'ORGANIZATION_OWNER' || user?.role === 'ORGANIZATION_ADMIN';
  const canEdit = isAdminOrOwner || members.find(m => m.userId === user?.id)?.role === 'PROJECT_OWNER';

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (projectId: string) => {
    try {
      setLoading(true);
      const proj = await projectApi.getProject(projectId);
      setProject(proj);
      setName(proj.name);
      setDescription(proj.description || '');

      const mems = await projectMemberApi.listMembers(projectId);
      setMembers(mems);

      const iters = await iterationApi.listIterations(projectId);
      setIterations(iters);

      try {
        const config = await projectConfigApi.getConfiguration(projectId);
        if (config) {
          setRepoUrl(config.repo_url || '');
          setPat(config.personal_access_token || '');
          setJiraUrl(config.jira_url || '');
          setJiraEmail(config.jira_email || '');
          setJiraPat(config.jira_api_token || '');
          setJiraProjectKey(config.jira_project_key || '');
          setHasConfig(!!config.repo_url);
          setHasJiraConfig(!!config.jira_url);
        } else {
          setRepoUrl('');
          setPat('');
          setJiraUrl('');
          setJiraEmail('');
          setJiraPat('');
          setJiraProjectKey('');
          setHasConfig(false);
          setHasJiraConfig(false);
        }
      } catch (err) {
        console.error('Failed to load project config', err);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canEdit) return;
    try {
      const updated = await projectApi.updateProject(id, { name, description });
      setProject(updated);
      setIsEditing(false);
    } catch (error) {
      alert('Failed to update project');
    }
  };

  const handleDelete = async () => {
    if (!id || !isAdminOrOwner) return;
    if (confirm('Are you sure you want to permanently delete this project?')) {
      try {
        await projectApi.deleteProject(id);
        navigate('/projects');
      } catch (error) {
        alert('Failed to delete project');
      }
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canEdit) return;
    try {
      await projectMemberApi.addMember(id, newMemberUserId, newMemberRole);
      setNewMemberUserId('');
      setIsAddingMember(false);
      const mems = await projectMemberApi.listMembers(id);
      setMembers(mems);
    } catch (error: any) {
      alert(error.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id || !canEdit) return;
    if (confirm('Remove member from project?')) {
      try {
        await projectMemberApi.removeMember(id, userId);
        setMembers(members.filter(m => m.userId !== userId));
      } catch (error) {
        alert('Failed to remove member');
      }
    }
  };

  const handleAddIteration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canEdit) return;
    try {
      await iterationApi.createIteration(id, newIteration);
      setIsAddingIteration(false);
      setNewIteration({ name: '', goal: '', start_date: '', end_date: '' });
      const iters = await iterationApi.listIterations(id);
      setIterations(iters);
    } catch (error: any) {
      alert(error.message || 'Failed to create sprint');
    }
  };

  const handleUpdateIterationStatus = async (iterationId: string, status: IterationStatus) => {
    if (!id || !canEdit) return;
    try {
      await iterationApi.updateIteration(id, iterationId, { status });
      const iters = await iterationApi.listIterations(id);
      setIterations(iters);
    } catch (error: any) {
      alert(error.message || 'Failed to update sprint status');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canEdit) return;
    try {
      const updated = await projectConfigApi.saveConfiguration(id, {
        repoUrl,
        personalAccessToken: pat
      });
      setRepoUrl(updated.repo_url || '');
      setPat(updated.personal_access_token || '');
      setHasConfig(true);
      setIsEditingConfig(false);
      alert('Project configuration saved successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to save project configuration');
    }
  };

  const handleSaveJiraConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canEdit) return;
    try {
      const updated = await projectConfigApi.saveConfiguration(id, {
        jiraUrl,
        jiraEmail,
        jiraApiToken: jiraPat,
        jiraProjectKey
      });
      setJiraUrl(updated.jira_url || '');
      setJiraEmail(updated.jira_email || '');
      setJiraPat(updated.jira_api_token || '');
      setJiraProjectKey(updated.jira_project_key || '');
      setHasJiraConfig(true);
      setIsEditingJiraConfig(false);
      alert('Jira configuration saved successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to save Jira configuration');
    }
  };

  const handleTestJiraConnection = async () => {
    if (!id) return;
    setIsTestingJira(true);
    try {
      const res = await projectConfigApi.testJiraConnection(id, {
        jiraUrl,
        jiraEmail,
        jiraApiToken: jiraPat
      });
      alert(res.message || 'Connection successful!');
    } catch (error: any) {
      alert(error.message || 'Connection failed. Please verify credentials.');
    } finally {
      setIsTestingJira(false);
    }
  };

  const handleDisconnectJira = async () => {
    if (!id || !canEdit) return;
    if (!window.confirm('Are you sure you want to disconnect Jira integration?')) return;
    try {
      await projectConfigApi.saveConfiguration(id, {
        jiraUrl: '',
        jiraEmail: '',
        jiraApiToken: '',
        jiraProjectKey: ''
      });
      setJiraUrl('');
      setJiraEmail('');
      setJiraPat('');
      setJiraProjectKey('');
      setHasJiraConfig(false);
      alert('Jira disconnected successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to disconnect Jira');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/projects')}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Folder size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{project?.name}</h1>
                <p className="text-sm font-medium text-slate-500">Project Workspace</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isAdminOrOwner && (
              <button 
                onClick={handleDelete}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
            <button 
              onClick={() => {
                useMeetingStore.getState().setCurrentProject(project);
                navigate('/dashboard');
              }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
            >
              Open Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Project Details</h2>
                {canEdit && !isEditing && (
                  <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                    <Settings size={20} />
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-lg">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-600">Save</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Name</span>
                    <p className="text-slate-900 font-medium mt-1">{project?.name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</span>
                    <p className="text-slate-600 mt-1 leading-relaxed">{project?.description || 'No description provided.'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Created</span>
                    <p className="text-slate-600 mt-1">{new Date(project?.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Git Configuration Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <GitBranch className="text-slate-400" size={20} />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Git Configuration</h2>
                    <p className="text-xs text-slate-400 font-medium">Connect your repository to map test cases and trigger automated validations.</p>
                  </div>
                </div>
                {canEdit && !isEditingConfig && (
                  <button onClick={() => setIsEditingConfig(true)} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
                    <Settings size={16} /> Edit
                  </button>
                )}
              </div>

              {isEditingConfig ? (
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Repository URL</label>
                    <input 
                      type="text" required value={repoUrl} onChange={e => setRepoUrl(e.target.value)} 
                      placeholder="e.g. https://github.com/username/project.git" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Personal Access Token</label>
                    <input 
                      type="password" required value={pat} onChange={e => setPat(e.target.value)} 
                      placeholder="Enter GitHub/GitLab Personal Access Token" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium" 
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setIsEditingConfig(false)} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-lg">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-700">Save Configuration</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {hasConfig ? (
                    <>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Repository URL</span>
                        <p className="text-slate-900 font-medium mt-1">{repoUrl}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personal Access Token</span>
                        <p className="text-slate-600 mt-1 font-mono text-sm">••••••••••••••••••••••••••••••••</p>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <AlertCircle className="mx-auto text-slate-300 mb-3" size={32} />
                      <p className="text-slate-500 font-medium">No Git repository connected yet.</p>
                      {canEdit && (
                        <button onClick={() => setIsEditingConfig(true)} className="mt-3 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:border-blue-600 hover:text-blue-600 transition-colors">
                          Configure Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Jira Configuration Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                    J
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Jira Integration</h2>
                    <p className="text-xs text-slate-400 font-medium">Connect Jira Cloud to export meeting stories directly into your sprint backlogs.</p>
                  </div>
                </div>
                {canEdit && !isEditingJiraConfig && (
                  <div className="flex gap-2">
                    {hasJiraConfig && (
                      <button 
                        type="button"
                        onClick={handleDisconnectJira} 
                        className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-lg shadow-sm transition-colors"
                      >
                        Disconnect
                      </button>
                    )}
                    <button onClick={() => setIsEditingJiraConfig(true)} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
                      <Settings size={16} /> Edit
                    </button>
                  </div>
                )}
              </div>

              {isEditingJiraConfig ? (
                <form onSubmit={handleSaveJiraConfig} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jira Domain URL</label>
                      <input 
                        type="url" required value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} 
                        placeholder="e.g. https://your-domain.atlassian.net" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jira Project Key</label>
                      <input 
                        type="text" required value={jiraProjectKey} onChange={e => setJiraProjectKey(e.target.value)} 
                        placeholder="e.g. PROJ" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Atlassian Email Address</label>
                      <input 
                        type="email" required value={jiraEmail} onChange={e => setJiraEmail(e.target.value)} 
                        placeholder="e.g. user@yourcompany.com" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jira API Token</label>
                      <input 
                        type="password" required value={jiraPat} onChange={e => setJiraPat(e.target.value)} 
                        placeholder="Enter Atlassian API Token" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button 
                      type="button" 
                      disabled={isTestingJira || !jiraUrl || !jiraEmail || !jiraPat}
                      onClick={handleTestJiraConnection}
                      className="px-4 py-2 border border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-600 rounded-lg font-bold text-xs transition-all disabled:opacity-50"
                    >
                      {isTestingJira ? 'Testing Connection...' : 'Test Jira Connection'}
                    </button>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setIsEditingJiraConfig(false)} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-lg">Cancel</button>
                      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-700">Save Configuration</button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {hasJiraConfig ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jira Domain</span>
                          <p className="text-slate-900 font-medium mt-1">{jiraUrl}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Key</span>
                          <p className="text-slate-900 font-medium mt-1">{jiraProjectKey}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atlassian Email</span>
                          <p className="text-slate-900 font-medium mt-1">{jiraEmail}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">API Token</span>
                          <p className="text-slate-600 mt-1 font-mono text-sm">••••••••••••••••••••••••••••••••</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <AlertCircle className="mx-auto text-slate-300 mb-3" size={32} />
                      <p className="text-slate-500 font-medium">No Jira connection configured yet.</p>
                      {canEdit && (
                        <button onClick={() => setIsEditingJiraConfig(true)} className="mt-3 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:border-blue-600 hover:text-blue-600 transition-colors">
                          Configure Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Iterations Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <ListTodo className="text-slate-400" size={20} />
                  <h2 className="text-lg font-bold text-slate-900">Sprints (Iterations)</h2>
                </div>
                {canEdit && (
                  <button onClick={() => setIsAddingIteration(!isAddingIteration)} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
                    {isAddingIteration ? <X size={16} /> : <Plus size={16} />} 
                    {isAddingIteration ? 'Cancel' : 'New Sprint'}
                  </button>
                )}
              </div>

              {isAddingIteration && canEdit && (
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                  <form onSubmit={handleAddIteration} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sprint Name</label>
                        <input type="text" required value={newIteration.name} onChange={e => setNewIteration({...newIteration, name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm" placeholder="e.g. Sprint 1" />
                      </div>
                      <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sprint Goal (Optional)</label>
                        <input type="text" value={newIteration.goal} onChange={e => setNewIteration({...newIteration, goal: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm" placeholder="Goal of this sprint" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start Date</label>
                        <input type="date" required value={newIteration.start_date} onChange={e => setNewIteration({...newIteration, start_date: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-700" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">End Date</label>
                        <input type="date" required value={newIteration.end_date} onChange={e => setNewIteration({...newIteration, end_date: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-700" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md">Create Sprint</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {iterations.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="mx-auto text-slate-300 mb-3" size={32} />
                    <p className="text-slate-500 font-medium">No sprints created yet.</p>
                  </div>
                ) : (
                  iterations.map(iter => (
                    <div key={iter.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-slate-900">{iter.name}</h3>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            iter.status === IterationStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' :
                            iter.status === IterationStatus.PLANNING ? 'bg-blue-100 text-blue-700' :
                            iter.status === IterationStatus.COMPLETED ? 'bg-slate-100 text-slate-600' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {iter.status}
                          </span>
                        </div>
                        {iter.goal && <p className="text-sm text-slate-600 mb-2">{iter.goal}</p>}
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                          <Calendar size={14} />
                          <span>{iter.start_date} to {iter.end_date}</span>
                        </div>
                      </div>
                      
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          {iter.status === IterationStatus.PLANNING && (
                            <button onClick={() => handleUpdateIterationStatus(iter.id, IterationStatus.ACTIVE)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors shadow-sm">Start Sprint</button>
                          )}
                          {iter.status === IterationStatus.ACTIVE && (
                            <button onClick={() => handleUpdateIterationStatus(iter.id, IterationStatus.COMPLETED)} className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors shadow-sm">Complete</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Members Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[600px]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <Users className="text-slate-400" size={20} />
                  <h2 className="text-lg font-bold text-slate-900">Members</h2>
                </div>
                {canEdit && (
                  <button onClick={() => setIsAddingMember(!isAddingMember)} className="p-1.5 bg-white text-slate-600 shadow-sm border border-slate-200 rounded-lg hover:text-blue-600">
                    {isAddingMember ? <X size={16} /> : <Plus size={16} />}
                  </button>
                )}
              </div>

              {isAddingMember && canEdit && (
                <div className="p-4 bg-blue-50/50 border-b border-blue-100">
                  <form onSubmit={handleAddMember} className="space-y-3">
                    <input 
                      type="text" placeholder="User ID" required value={newMemberUserId} onChange={e => setNewMemberUserId(e.target.value)}
                      className="w-full text-sm py-2 px-3 rounded-lg border border-slate-200"
                    />
                    <div className="flex gap-2">
                      <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} className="text-sm py-2 px-3 rounded-lg border border-slate-200 flex-1">
                        <option value="MEMBER">Member</option>
                        <option value="PROJECT_OWNER">Owner</option>
                      </select>
                      <button type="submit" className="bg-blue-600 text-white px-4 rounded-lg font-bold text-xs hover:bg-blue-700">Add</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-y-auto p-4 space-y-2 flex-1">
                {members.map(m => (
                  <div key={m.userId} className="p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between group">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{m.user?.firstName} {m.user?.lastName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.role}</p>
                    </div>
                    {canEdit && m.userId !== user?.id && (
                      <button onClick={() => handleRemoveMember(m.userId)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
