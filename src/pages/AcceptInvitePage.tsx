import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useMeetingStore } from '../store/useMeetingStore';
import { authApi } from '../api/authApi';
import { acceptInviteSchema, validateForm } from '../utils/validation';

export const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user, setUser } = useMeetingStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/projects');
    }
  }, [user, navigate]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-500 text-sm">No invitation token was found in the URL. Please check your email link.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = validateForm(acceptInviteSchema, { firstName, lastName, password });

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.acceptInvite(token, firstName, lastName, password);

      setUser({
        id: data.user.id,
        name: data.user.firstName + ' ' + data.user.lastName,
        email: data.user.email,
        agileRole: data.user.role || 'Member',
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        organizationId: data.user.organizationId,
        role: data.user.role,
        meetingId: ''
      });

      navigate('/projects');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#F4F7FB] selection:bg-blue-100 font-sans">
      <div className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="max-w-[440px] w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-blue-900/5 border border-blue-50/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-[#0E71EB]">
            <ShieldCheck size={120} />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#0E71EB] mb-6">
              <ShieldCheck size={24} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Accept Invitation
              </h2>
              <p className="text-gray-500 text-sm">
                Complete your profile to join the workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John" 
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe" 
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Set Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-bold text-sm bg-[#0E71EB] text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-8"
              >
                {isLoading ? 'Joining Workspace...' : 'Join Workspace'} <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
