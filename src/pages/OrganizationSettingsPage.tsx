import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Globe, Users, Mail, Shield, Check, Plus, Trash2, ArrowLeft, X 
} from 'lucide-react';
import { useMeetingStore } from '../store/useMeetingStore';
import { organizationApi } from '../api/organizationApi';
import { userApi } from '../api/userApi';
import { AnimatePresence, motion } from 'framer-motion';

export const OrganizationSettingsPage: React.FC = () => {
  const { user } = useMeetingStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'invites'>('general');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [org, setOrg] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Invite state
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  const isOwner = user?.role === 'ORGANIZATION_OWNER';
  const isAdmin = user?.role === 'ORGANIZATION_ADMIN' || isOwner;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orgData, usersData] = await Promise.all([
        organizationApi.getOrganization(),
        isAdmin ? userApi.listUsers() : Promise.resolve([])
      ]);
      setOrg(orgData);
      setCompanyName(orgData.companyName || '');
      setDomain(orgData.domain || '');
      setUsers(usersData);
      
      if (isAdmin) {
        const invitesData = await organizationApi.listInvites();
        setInvites(invitesData);
      }
    } catch (error) {
      console.error('Failed to load org data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setIsSaving(true);
    try {
      await organizationApi.updateOrganization({ companyName, domain });
      await fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to update organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await organizationApi.sendInvite(inviteEmail, inviteRole);
      setInviteEmail('');
      setIsInviting(false);
      const invitesData = await organizationApi.listInvites();
      setInvites(invitesData);
    } catch (error: any) {
      alert(error.message || 'Failed to send invite');
    }
  };

  const handleRevokeInvite = async (id: string) => {
    if (!isAdmin || !confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      await organizationApi.revokeInvite(id);
      setInvites(invites.filter(inv => inv.id !== id));
    } catch (error) {
      alert('Failed to revoke invite');
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    if (!isAdmin) return;
    try {
      await userApi.updateUserRole(userId, role);
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
    } catch (error) {
      alert('Failed to update role');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans selection:bg-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/projects')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Manage your team and workspace preferences</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            General
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => setActiveTab('members')}
                className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Members
              </button>
              <button 
                onClick={() => setActiveTab('invites')}
                className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'invites' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Invitations
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Workspace Details</h2>
              <form onSubmit={handleUpdateOrg} className="space-y-6 max-w-lg">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Company Name</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      disabled={!isOwner}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-medium disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Custom Domain</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={domain}
                      onChange={e => setDomain(e.target.value)}
                      disabled={!isOwner}
                      placeholder="e.g. acme.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-medium disabled:opacity-60"
                    />
                  </div>
                </div>
                {isOwner && (
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && isAdmin && (
            <div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">Active Members</h2>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest">
                  {users.length} Users
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {users.map(u => (
                  <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                        <p className="text-sm text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <select 
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                        disabled={!isOwner && u.role === 'ORGANIZATION_OWNER'}
                        className="bg-slate-100 border-none rounded-lg text-sm font-bold text-slate-700 py-2 pl-3 pr-8 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="PROJECT_OWNER">Project Owner</option>
                        {isOwner && <option value="ORGANIZATION_ADMIN">Org Admin</option>}
                        <option value="ORGANIZATION_OWNER" disabled>Org Owner</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INVITES TAB */}
          {activeTab === 'invites' && isAdmin && (
            <div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">Pending Invitations</h2>
                <button 
                  onClick={() => setIsInviting(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} /> New Invite
                </button>
              </div>
              
              {invites.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No pending invitations</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {invites.map(inv => (
                    <div key={inv.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-900">{inv.email}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                          Role: {inv.role} • Sent {new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Revoke Invite"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal Overlay */}
      <AnimatePresence>
        {isInviting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsInviting(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Invite Teammate</h3>
                <button onClick={() => setIsInviting(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Role</label>
                  <select 
                    value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-medium"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="PROJECT_OWNER">Project Owner</option>
                    {isOwner && <option value="ORGANIZATION_ADMIN">Org Admin</option>}
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-2 shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all">
                  Send Invitation
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
