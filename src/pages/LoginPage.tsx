import React, { useState, useEffect } from 'react';
import { Video, Globe } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../store/useMeetingStore';

// Components
import { JoinForm } from '../components/auth/JoinForm';
import { HostForm } from '../components/auth/HostForm';
import { AuthPromo } from '../components/auth/AuthPromo';

// API
import { meetingApi } from '../api/meetingApi';

const PROMO_IMAGE_JOIN = "/images/meeting_promo_light_1775519945157.png";
const PROMO_IMAGE_CREATE = "/images/ai_transcription_promo_1775519960749.png";

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');

  const [isCreated, setIsCreated] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<{ id: string, code: string, link: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Host States
  const [mode, setMode] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useMeetingStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('meetingId');
    const code = searchParams.get('passcode');
    if (id) setMeetingId(id.toUpperCase());
    if (code) setPasscode(code);
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !meetingId || !passcode) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await meetingApi.joinMeeting(meetingId, passcode);

      if (data.status === 'success') {
        setUser({ name, email, meetingId: meetingId });
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
    if (!name || !email) return;

    setIsLoading(true);
    setError(null);

    try {
      const scheduledAt = mode === 'scheduled' ? `${scheduledDate}T${scheduledTime}` : undefined;
      const data = await meetingApi.createMeeting(name, mode, scheduledAt);

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

          {!isCreated && (
            <div className="flex bg-gray-100 p-1 rounded-xl mb-10 w-fit">
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
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
            />
          ) : (
            <HostForm 
                handleCreate={handleCreate}
                isLoading={isLoading}
                error={error}
                name={name}
                setName={setName}
                email={email}
                setEmail={setEmail}
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
