import React, { useState, useEffect } from 'react';
import { Video, Globe, AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../store/useMeetingStore';

// Components
import { JoinForm } from '../components/auth/JoinForm';
import { HostForm } from '../components/auth/HostForm';
import { AuthPromo } from '../components/auth/AuthPromo';

// API
import { meetingApi } from '../api/meetingApi';
import { authApi } from '../api/authApi';
import { loginSchema, registerSchema, validateForm } from '../utils/validation';
import { ProfileForm } from '../components/auth/ProfileForm';

const PROMO_IMAGE_JOIN = "/images/meeting_promo_light_1775519945157.png";
const PROMO_IMAGE_CREATE = "/images/ai_transcription_promo_1775519960749.png";

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [email, setEmail] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isCreated, setIsCreated] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<{ id: string, code: string, link: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Host States
  const [mode, setMode] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agileRole, setAgileRole] = useState('Developer');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [roles, setRoles] = useState<string[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const { user, setUser } = useMeetingStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await authApi.getRoles();
        setRoles(data.roles);
      } catch (err) {
        console.error("Failed to fetch roles");
      }
    };
    fetchRoles();

    const id = searchParams.get('meetingId');
    const code = searchParams.get('passcode');
    if (id) setMeetingId(id.toUpperCase());
    if (code) setPasscode(code);
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Structured validation using middleware schemas
    const validationData = authMode === 'login' 
      ? { email, password } 
      : { email, password, fullName, agileRole };
    
    const schema = authMode === 'login' ? loginSchema : registerSchema;
    const result = validateForm(schema, validationData);

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    try {
      let data;
      if (authMode === 'login') {
        data = await authApi.login(email, password);
      } else {
        data = await authApi.register(email, password, fullName, agileRole);
      }

      // data contains access_token and user object
      setUser({
        id: data.user.id,
        name: data.user.full_name,
        email: data.user.email,
        agileRole: data.user.agile_role,
        accessToken: data.access_token,
        meetingId: '' // Will be set when joining/creating
      });

      // After successful auth, if we had a meeting ID in URL, we could auto-join
      // For now, let the user stay on the dashboard tabs
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = useMeetingStore.getState().user;
    if (!currentUser || !meetingId || !passcode) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await meetingApi.joinMeeting(meetingId, passcode);

      if (data.status === 'success') {
        setUser({ ...currentUser, meetingId });
        navigate('/');
      } else {
        setError(data.message || 'Access Denied');
      }
    } catch (err) {
      setError('Connection failed. Server offline.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const scheduledAt = mode === 'scheduled' ? `${scheduledDate}T${scheduledTime}` : undefined;
      const data = await meetingApi.createMeeting(user.name, mode, scheduledAt);

      if (data.status === 'success') {
        setInviteDetails({
          id: data.meeting_id,
          code: data.passcode,
          link: data.invite_link
        });
        setIsCreated(true);
        setMeetingId(data.meeting_id);
        setPasscode(data.passcode);
      } else {
        setError('Meeting creation failed.');
      }
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteDetails) {
      navigator.clipboard.writeText(inviteDetails.link);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-white selection:bg-blue-100 font-sans overflow-x-hidden">

      {/* Main Interactive Column */}
      <div className={`flex-1 flex flex-col justify-center transition-all duration-700 bg-white order-1 ${activeTab === 'create' ? 'md:order-2' : 'md:order-1'}`}>
        <div className="max-w-[500px] w-full mx-auto px-8 py-12 sm:px-12 sm:py-16 flex flex-col min-h-full">

          {/* Header Branding */}
          {/* <div className="flex items-center gap-3 mb-10">
            <div className="p-2.5 rounded-xl bg-[#0E71EB] text-white shadow-lg shadow-blue-500/20">
              <Video size={20} className="fill-current" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">AI Workspace<span className="text-blue-600">.</span></h1>
          </div> */}

          {/* Conditionally render Auth vs Dashboard */}
          {!user ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {authMode === 'login' ? 'Welcome Back.' : 'Join the Workspace.'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {authMode === 'login' 
                    ? 'Enter your credentials to access your secure meeting vault.' 
                    : 'Create your professional account to host and join meetings.'}
                </p>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                >
                  Login
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                {authMode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe" 
                      className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com" 
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                    required
                  />
                </div>

                {authMode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Agile Role</label>
                    <select 
                      value={agileRole}
                      onChange={(e) => setAgileRole(e.target.value)}
                      className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                    >
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl font-bold text-sm bg-[#0E71EB] text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 disabled:opacity-40 mt-4"
                >
                  {isLoading ? 'Processing...' : (authMode === 'login' ? 'Access Account' : 'Create Account')}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Dashboard</h2>
                  <p className="text-xs text-gray-400 mt-1">Logged in as <span className="text-[#0E71EB] font-bold">{user.name}</span> ({user.agileRole})</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-[10px] font-black text-gray-400 hover:text-blue-500 uppercase tracking-widest transition-colors"
                  >
                    {isEditingProfile ? 'Back to Room' : 'Edit Profile'}
                  </button>
                  <button 
                    onClick={() => useMeetingStore.getState().logout()}
                    className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {isEditingProfile ? (
                <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 animate-in slide-in-from-bottom-2 duration-500">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Professional Identity</h2>
                  <ProfileForm />
                </div>
              ) : (
                <>
                  {!isCreated && (
                    <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                      <button
                        onClick={() => { setActiveTab('join'); setError(null); }}
                        className={`px-8 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'join' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Join
                      </button>
                      <button
                        onClick={() => { setActiveTab('create'); setError(null); }}
                        className={`px-8 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Host
                      </button>
                    </div>
                  )}

                  {activeTab === 'join' ? (
                    <JoinForm
                      handleJoin={handleJoin}
                      isLoading={isLoading}
                      error={error}
                      meetingId={meetingId}
                      setMeetingId={setMeetingId}
                      passcode={passcode}
                      setPasscode={setPasscode}
                      name={user.name}
                      setName={() => {}} // Disabled as it comes from auth
                      email={user.email}
                      setEmail={() => {}} // Disabled as it comes from auth
                    />
                  ) : (
                    <HostForm 
                        handleCreate={handleCreate}
                        isLoading={isLoading}
                        error={error}
                        name={user.name}
                        setName={() => {}}
                        email={user.email}
                        setEmail={() => {}}
                        isCreated={isCreated}
                        inviteDetails={inviteDetails}
                        isCopied={isCopied}
                        copyToClipboard={copyToClipboard}
                        onReset={() => { setActiveTab('join'); setIsCreated(false); }}
                        mode={mode}
                        setMode={setMode}
                        scheduledDate={scheduledDate}
                        setScheduledDate={setScheduledDate}
                        scheduledTime={scheduledTime}
                        setScheduledTime={setScheduledTime}
                      />
                  )}
                </>
              )}
            </div>
          )}

          {/* Footer Credits */}
          <div className="mt-auto pt-10 flex items-center justify-between text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            <div className="flex gap-4">
              <span className="text-[#0E71EB] flex items-center gap-1.5"><Globe size={12} /> Global</span>
              <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            </div>
            <span className="opacity-40">v4.2 PRO</span>
          </div>
        </div>
      </div>

      {/* Visual Column */}
      <AuthPromo
        activeTab={activeTab}
        joinImage={PROMO_IMAGE_JOIN}
        createImage={PROMO_IMAGE_CREATE}
      />

    </div>
  );
};

export default LoginPage;
