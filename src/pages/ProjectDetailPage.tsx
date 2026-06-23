import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Settings, Users, Folder, Trash2, Plus, X 
} from 'lucide-react';
import { projectApi } from '../api/projectApi';
import { projectMemberApi } from '../api/projectMemberApi';
import { useMeetingStore } from '../store/useMeetingStore';

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
