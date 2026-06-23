import React, { useState, useEffect } from 'react';
import { Video, Globe, AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../store/useMeetingStore';
import { AuthPromo } from '../components/auth/AuthPromo';
import { authApi } from '../api/authApi';
import { loginSchema, registerSchema, validateForm } from '../utils/validation';

const PROMO_IMAGE_JOIN = "/images/meeting_promo_light_1775519945157.png";
const PROMO_IMAGE_CREATE = "/images/ai_transcription_promo_1775519960749.png";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user, setUser } = useMeetingStore();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, go to dashboard
    if (user) {
      navigate('/projects');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const validationData = authMode === 'login' 
      ? { email, password } 
      : { email, password, firstName, lastName, companyName };
    
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
        data = await authApi.register(email, password, firstName, lastName, companyName);
      }

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
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-white selection:bg-blue-100 font-sans overflow-x-hidden">
      <div className="flex-1 flex flex-col justify-center transition-all duration-700 bg-white">
        <div className="max-w-[500px] w-full mx-auto px-8 py-12 sm:px-12 sm:py-16 flex flex-col min-h-full">
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John" 
                      className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
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
                      className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                      required
                    />
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Company Name</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp" 
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

              {/* Agile Role removed for registration */}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-bold text-sm bg-[#0E71EB] text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 disabled:opacity-40 mt-4"
              >
                {isLoading ? 'Processing...' : (authMode === 'login' ? 'Access Account' : 'Create Account')}
              </button>
            </form>
          </div>

          <div className="mt-auto pt-10 flex items-center justify-between text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            <div className="flex gap-4">
              <span className="text-[#0E71EB] flex items-center gap-1.5"><Globe size={12} /> Global</span>
              <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            </div>
            <span className="opacity-40">v4.2 PRO</span>
          </div>
        </div>
      </div>

      <AuthPromo
        activeTab={authMode === 'login' ? 'join' : 'create'}
        joinImage={PROMO_IMAGE_JOIN}
        createImage={PROMO_IMAGE_CREATE}
      />
    </div>
  );
};

export default LoginPage;
