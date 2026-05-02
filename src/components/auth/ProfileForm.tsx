import React, { useState, useEffect } from 'react';
import { User, Briefcase, FileText, Globe, Phone, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { useMeetingStore } from '../../store/useMeetingStore';

export const ProfileForm: React.FC = () => {
  const { user } = useMeetingStore();
  const [profile, setProfile] = useState({
    display_name: '',
    job_title: '',
    bio: '',
    timezone: 'UTC',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.accessToken) return;
      setIsFetching(true);
      try {
        const data = await authApi.getProfile(user.accessToken);
        if (data) {
          setProfile({
            display_name: data.display_name || user.name || '',
            job_title: data.job_title || '',
            bio: data.bio || '',
            timezone: data.timezone || 'UTC',
            phone: data.phone || ''
          });
        } else {
          // If profile doesn't exist, use account name as default display name
          setProfile(prev => ({ ...prev, display_name: user.name || '' }));
        }
      } catch (err) {
        console.error('Failed to load profile');
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, [user?.accessToken, user?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.accessToken) return;
    
    setIsLoading(true);
    setError(null);
    setIsSaved(false);

    try {
      await authApi.updateProfile(user.accessToken, profile);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading your identity...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2.5">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {isSaved && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2.5">
          <CheckCircle size={14} /> Changes Saved Successfully
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Display Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input 
              type="text" 
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Your public name" 
              className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Job Title</label>
          <div className="relative">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input 
              type="text" 
              value={profile.job_title}
              onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
              placeholder="Product Manager / Lead Developer" 
              className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Biography</label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 text-gray-300" size={16} />
            <textarea 
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself..." 
              rows={3}
              className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-medium resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Timezone</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <select 
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-medium appearance-none"
              >
                <option value="UTC">UTC (GMT)</option>
                <option value="EST">EST (New York)</option>
                <option value="IST">IST (India)</option>
                <option value="BST">BST (London)</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input 
                type="tel" 
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+1..." 
                className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      <button 
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : <><Save size={18} /> Update Profile</>}
      </button>
    </form>
  );
};
