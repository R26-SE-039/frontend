import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, FileText, Sparkles, Loader2, AlertCircle, Clipboard,
  Trash2, Info, Download, FileJson, Table, Printer, Pencil,
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  RotateCcw, X, Plus, Minus, ShieldCheck, BarChart2,
  ThumbsUp, Flag, Zap, ExternalLink, Send, ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ragApi, GeneratedStory, ValidationResult, UpdateStoryPayload } from '../../api/ragApi';
import { jiraApi, JiraPushResult } from '../../api/jiraApi';
import { projectConfigApi, ProjectConfiguration } from '../../api/projectConfigApi';
import { useMeetingStore } from '../../store/useMeetingStore';

type BADecision = 'Pending' | 'Ready' | 'Flagged';

function getSystemStatusConfig(status: string) {
  switch (status) {
    case 'Approved':
      return { label: 'AI Approved', icon: <CheckCircle2 size={11} />, pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    case 'Rejected':
      return { label: 'AI Rejected', icon: <XCircle size={11} />, pill: 'bg-red-50 text-red-700 border border-red-200' };
    default:
      return { label: 'Needs Review', icon: <Clock size={11} />, pill: 'bg-amber-50 text-amber-700 border border-amber-200' };
  }
}

function getBADecisionConfig(decision: BADecision) {
  switch (decision) {
    case 'Ready':
      return { label: 'BA: Ready', icon: <ThumbsUp size={11} />, pill: 'bg-indigo-600 text-white border border-indigo-700' };
    case 'Flagged':
      return { label: 'BA: Flagged', icon: <Flag size={11} />, pill: 'bg-rose-600 text-white border border-rose-700' };
    default:
      return { label: 'BA: Pending', icon: <Clock size={11} />, pill: 'bg-gray-100 text-gray-500 border border-gray-200' };
  }
}

function getPriorityStyle(p: string) {
  if (p === 'Must') return 'bg-red-50 text-red-600 border-red-200';
  if (p === 'Should') return 'bg-amber-50 text-amber-600 border-amber-200';
  return 'bg-blue-50 text-blue-600 border-blue-200';
}
function scoreColor(s: number) { return s >= 80 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-500'; }

const ScoreBar: React.FC<{ label: string; value: number; max?: number }> = ({ label, value, max = 100 }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold text-gray-500">{label}</span>
        <span className="text-[10px] font-black text-gray-700">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${scoreColor(pct)}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
      </div>
    </div>
  );
};

const QualityScorecard: React.FC<{ vr: ValidationResult; isExpanded: boolean; onToggle: () => void }> = ({ vr, isExpanded, onToggle }) => {
  const sysCfg = getSystemStatusConfig(vr.status);
  const issues = vr.issues ?? [];
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/70 hover:bg-gray-100/60 transition-colors">
        <div className="flex items-center gap-2"><BarChart2 size={13} className="text-indigo-500" /><span className="text-[10px] font-black uppercase tracking-widest text-gray-500">5-Layer Quality Score</span></div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-800">{vr.overall_quality_score.toFixed(1)}<span className="text-gray-400 font-medium">/100</span></span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${sysCfg.pill}`}>{sysCfg.icon}{sysCfg.label}</span>
          <ShieldCheck size={11} className="text-indigo-400" />
          {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="p-4 space-y-4">
              <div className="space-y-2.5">
                <ScoreBar label="Layer 1 - Rule Check" value={vr.rule_score} />
                <ScoreBar label="Layer 2 - Evidence Grounding" value={vr.evidence_score} />
                <ScoreBar label="Layer 3 - Hallucination Inversion" value={vr.hallucination_score * 100} />
                <ScoreBar label="Layer 4 - INVEST Score" value={vr.invest_score} />
                <ScoreBar label="Layer 5 - Semantic Similarity" value={vr.semantic_similarity * 100} />
              </div>
              {(vr.recommendation || issues.length > 0) && (
                <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3 space-y-2">
                  {vr.recommendation && <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">Recommendation: {vr.recommendation}</p>}
                  {issues.length > 0 && <ul className="space-y-1">{issues.map((issue, idx) => (<li key={idx} className={`text-[9px] font-semibold flex items-start gap-1.5 ${issue.severity === 'high' ? 'text-red-700' : issue.severity === 'medium' ? 'text-amber-700' : 'text-gray-500'}`}><AlertCircle size={9} className="shrink-0 mt-0.5" /><span>{issue.issue}{issue.recommendation && <span className="text-gray-400"> - {issue.recommendation}</span>}</span></li>))}</ul>}
                </div>
              )}
              <p className="text-[9px] text-gray-400 italic flex items-center gap-1"><ShieldCheck size={9} className="text-indigo-400" />Status and scores are 100% system-calculated.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface BADecisionPanelProps { storyId: string; decision: BADecision; flagNote: string; onApprove: () => void; onFlag: (note: string) => void; }
const BADecisionPanel: React.FC<BADecisionPanelProps> = ({ storyId, decision, flagNote, onApprove, onFlag }) => {
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [note, setNote] = useState(flagNote);
  const handleFlag = () => { onFlag(note); setShowFlagInput(false); };
  return (
    <div className={`rounded-xl border p-3 space-y-2.5 transition-all ${decision === 'Ready' ? 'bg-indigo-50/60 border-indigo-200' : decision === 'Flagged' ? 'bg-rose-50/60 border-rose-200' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">BA Decision</span>
        {decision !== 'Pending' && <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${getBADecisionConfig(decision).pill}`}>{getBADecisionConfig(decision).icon}{getBADecisionConfig(decision).label}</span>}
      </div>
      {decision !== 'Ready' && !showFlagInput && (
        <div className="flex gap-2">
          <button onClick={onApprove} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black transition-all active:scale-95 shadow-sm shadow-indigo-200"><ThumbsUp size={11} />Approve - Mark Ready</button>
          <button onClick={() => setShowFlagInput(true)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-600 text-[10px] font-black hover:bg-rose-50 transition-all"><Flag size={11} />Flag</button>
        </div>
      )}
      {decision === 'Ready' && !showFlagInput && (
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] font-black"><CheckCircle2 size={11} />Sprint-Ready - Can be pushed to Jira / Increment</div>
          <button onClick={() => setShowFlagInput(true)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] text-gray-400 hover:text-rose-500 hover:bg-rose-50 border border-gray-100 transition-colors font-black" title="Change to Flagged"><Flag size={10} /></button>
        </div>
      )}
      {decision === 'Flagged' && !showFlagInput && (
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-1.5 py-2 px-3 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-black"><XCircle size={11} />Flagged - Cannot go to sprint / increment</div>
          <button onClick={onApprove} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-100 transition-colors font-black" title="Approve instead"><ThumbsUp size={10} /></button>
        </div>
      )}
      <AnimatePresence>
        {showFlagInput && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-2 pt-1">
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-rose-200 text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" placeholder="Reason for flagging (optional)..." />
              <div className="flex gap-2">
                <button onClick={() => setShowFlagInput(false)} className="flex-1 py-1.5 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-400 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleFlag} className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white text-[10px] font-black hover:bg-rose-700 transition-colors">Confirm Flag</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {decision === 'Flagged' && flagNote && !showFlagInput && <p className="text-[9px] text-rose-600 italic border-t border-rose-100 pt-1.5">Note: {flagNote}</p>}
    </div>
  );
};

interface EditModalProps { story: GeneratedStory; meetingId: string; onClose: () => void; onRevalidated: (updatedStory: GeneratedStory, updatedVr: ValidationResult) => void; }
const EditStoryModal: React.FC<EditModalProps> = ({ story, meetingId, onClose, onRevalidated }) => {
  const [title, setTitle] = useState(story.title);
  const [storyText, setStoryText] = useState(story.story);
  const [priority, setPriority] = useState(story.priority || 'Should');
  const [criteria, setCriteria] = useState<string[]>(story.acceptance_criteria.length > 0 ? story.acceptance_criteria : ['']);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const updateCriterion = (idx: number, val: string) => setCriteria(prev => prev.map((c, i) => i === idx ? val : c));
  const addCriterion = () => setCriteria(prev => [...prev, '']);
  const removeCriterion = (idx: number) => setCriteria(prev => prev.filter((_, i) => i !== idx));
  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      const payload: UpdateStoryPayload = { meeting_id: meetingId, title, story: storyText, acceptance_criteria: criteria.filter(c => c.trim() !== ''), priority };
      const res = await ragApi.updateStory(story.story_id, payload);
      onRevalidated(res.story, res.validation_result);
      onClose();
    } catch (err: any) { setSaveError(err.message || 'Re-validation failed.'); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div><h3 className="text-base font-black text-gray-900">Edit and Re-Validate Story</h3><p className="text-[10px] text-gray-400 font-medium mt-0.5">Edits trigger 5-layer re-validation. BA decision resets to Pending.</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-grow p-6 space-y-5">
          <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Story Title</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" placeholder="Enter a concise story title..." /></div>
          <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">User Story (As a... I want... So that...)</label><textarea value={storyText} onChange={e => setStoryText(e.target.value)} rows={4} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none leading-relaxed" placeholder="As a [role], I want [feature], so that [benefit]..." /></div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Priority (MoSCoW)</label>
            <div className="flex gap-2">{['Must', 'Should', 'Could'].map(p => (<button key={p} onClick={() => setPriority(p)} className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${priority === p ? getPriorityStyle(p) + ' ring-2 ring-offset-1 ' + (p === 'Must' ? 'ring-red-300' : p === 'Should' ? 'ring-amber-300' : 'ring-blue-300') : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>{p}</button>))}</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Acceptance Criteria</label><button onClick={addCriterion} className="flex items-center gap-1 text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"><Plus size={11} /> Add</button></div>
            <div className="space-y-2">{criteria.map((c, idx) => (<div key={idx} className="flex gap-2 items-start"><span className="mt-2.5 text-[9px] font-black text-gray-300 w-4 shrink-0 text-right">{idx + 1}.</span><input value={c} onChange={e => updateCriterion(idx, e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" placeholder="Given ... When ... Then ..." />{criteria.length > 1 && <button onClick={() => removeCriterion(idx)} className="mt-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Minus size={12} /></button>}</div>))}</div>
          </div>
          {saveError && <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold"><AlertCircle size={14} className="shrink-0" />{saveError}</div>}
        </div>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !storyText.trim()} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-40">
            {saving ? <><Loader2 size={14} className="animate-spin" />Re-Validating...</> : <><RotateCcw size={14} />Save and System Re-Validate</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const JiraResultToast: React.FC<{ results: JiraPushResult[]; onClose: () => void }> = ({ results, onClose }) => {
  const ok = results.filter(r => r.success);
  const fail = results.filter(r => !r.success);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-w-sm w-full">
      <div className="flex items-start justify-between mb-3">
        <div><h4 className="text-sm font-black text-gray-900">Jira Push Complete</h4><p className="text-[10px] text-gray-400 font-medium">{ok.length} pushed, {fail.length} failed</p></div>
        <button onClick={onClose} className="p-1 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors"><X size={14} /></button>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {results.map((r, i) => (
          <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold ${r.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <span className="flex items-center gap-1.5">{r.success ? <CheckCircle2 size={10} /> : <XCircle size={10} />}{r.success ? r.jira_key : `Failed: ${(r.error ?? '').slice(0, 40)}`}</span>
            {r.success && r.jira_url && <a href={r.jira_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">Open <ExternalLink size={9} /></a>}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

interface StoryCardFullProps { story: GeneratedStory; validationResult?: ValidationResult; meetingId: string; baDecision: BADecision; flagNote: string; jiraResult?: JiraPushResult; onStoryUpdated: (s: GeneratedStory, v: ValidationResult) => void; onApprove: (id: string) => void; onFlag: (id: string, note: string) => void; }
const StoryCardFull: React.FC<StoryCardFullProps> = ({ story, validationResult, meetingId, baDecision, flagNote, jiraResult, onStoryUpdated, onApprove, onFlag }) => {
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(`Title: ${story.title}\nStory: ${story.story}\n\nAcceptance Criteria:\n${story.acceptance_criteria.map(ac => `- ${ac}`).join('\n')}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const baCfg = getBADecisionConfig(baDecision);
  return (
    <>
      <div className={`p-5 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden ${baDecision === 'Ready' ? 'border-indigo-200 ring-1 ring-indigo-100' : baDecision === 'Flagged' ? 'border-rose-200 ring-1 ring-rose-100 opacity-80' : 'border-gray-100 hover:border-indigo-200'}`}>
        <div className="absolute top-4 right-4 flex items-center gap-1.5 flex-wrap justify-end max-w-[55%]">
          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${getPriorityStyle(story.priority)}`}>{story.priority}</span>
          {validationResult && <span className={`flex items-center gap-0.5 text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${getSystemStatusConfig(validationResult.status).pill}`}>{getSystemStatusConfig(validationResult.status).icon}{getSystemStatusConfig(validationResult.status).label}</span>}
          <span className={`flex items-center gap-0.5 text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${baCfg.pill}`}>{baCfg.icon}{baCfg.label}</span>
          {jiraResult?.success && <a href={jiraResult.jira_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-[8px] px-2 py-0.5 rounded-full font-black uppercase bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 transition-colors"><Zap size={8} />{jiraResult.jira_key}<ArrowUpRight size={8} /></a>}
        </div>
        <h4 className="text-base font-black text-gray-900 mb-1.5 max-w-[58%] leading-snug">{story.title}</h4>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed font-medium italic">{story.story}</p>
        <div className="bg-gray-50/50 rounded-xl p-3.5 border border-gray-100 mb-3">
          <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Acceptance Criteria</h5>
          <div className="space-y-1.5">{story.acceptance_criteria.map((ac, idx) => (<div key={idx} className="flex items-start gap-2 text-[10px] text-gray-600 font-semibold"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" /><span>{ac}</span></div>))}</div>
        </div>
        {validationResult && <div className="mb-3"><QualityScorecard vr={validationResult} isExpanded={scorecardOpen} onToggle={() => setScorecardOpen(o => !o)} /></div>}
        <div className="mb-3">
          <BADecisionPanel storyId={story.story_id} decision={baDecision} flagNote={flagNote} onApprove={() => onApprove(story.story_id)} onFlag={note => onFlag(story.story_id, note)} />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black hover:bg-indigo-100 transition-colors border border-indigo-100"><Pencil size={11} />Edit and Re-Validate</button>
          <button onClick={handleCopy} className="p-2 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors" title="Copy story">{copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Clipboard size={14} />}</button>
        </div>
      </div>
      <AnimatePresence>{editOpen && <EditStoryModal key="edit-modal" story={story} meetingId={meetingId} onClose={() => setEditOpen(false)} onRevalidated={onStoryUpdated} />}</AnimatePresence>
    </>
  );
};

const SummaryBar: React.FC<{ stories: GeneratedStory[]; validationResults: ValidationResult[]; baDecisions: Record<string, BADecision> }> = ({ stories, validationResults, baDecisions }) => {
  const sysApproved = validationResults.filter(v => v.status === 'Approved').length;
  const needsReview = validationResults.filter(v => v.status === 'Needs Review').length;
  const baReady = Object.values(baDecisions).filter(d => d === 'Ready').length;
  const baFlagged = Object.values(baDecisions).filter(d => d === 'Flagged').length;
  return (
    <div className="flex items-center gap-3 px-3 py-2 text-[10px] font-bold flex-wrap">
      <span className="text-gray-400 uppercase tracking-widest">{stories.length} Stories</span>
      <span className="w-px h-3 bg-gray-200" />
      <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 size={10} /> {sysApproved} AI Approved</span>
      <span className="flex items-center gap-1 text-amber-700"><Clock size={10} /> {needsReview} Review</span>
      <span className="w-px h-3 bg-gray-200" />
      <span className="flex items-center gap-1 text-indigo-700"><ThumbsUp size={10} /> {baReady} BA Ready</span>
      <span className="flex items-center gap-1 text-rose-700"><Flag size={10} /> {baFlagged} Flagged</span>
    </div>
  );
};

interface JiraPushModalProps { stories: GeneratedStory[]; baDecisions: Record<string, BADecision>; getVr: (id: string) => ValidationResult | undefined; projectId: string; onClose: () => void; onPushed: (results: JiraPushResult[]) => void; }
const JiraPushModal: React.FC<JiraPushModalProps> = ({ stories, baDecisions, getVr, projectId, onClose, onPushed }) => {
  const readyStories = stories.filter(s => baDecisions[s.story_id] === 'Ready');
  const [selected, setSelected] = useState<Set<string>>(new Set(readyStories.map(s => s.story_id)));
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggle = (id: string) => setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const handlePush = async () => {
    if (selected.size === 0) return;
    setPushing(true); setError(null);
    try { const toPush = stories.filter(s => selected.has(s.story_id)); const results = await jiraApi.pushBatch(projectId, toPush, getVr); onPushed(results); onClose(); }
    catch (err: any) { setError(err.message || 'Failed to push to Jira'); } finally { setPushing(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div><h3 className="text-base font-black text-gray-900 flex items-center gap-2"><Zap size={16} className="text-blue-600" />Push to Jira Board</h3><p className="text-[10px] text-gray-400 font-medium mt-0.5">Only BA-approved (Ready) stories shown. Select which to push.</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-grow p-4 space-y-2">
          {readyStories.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><Flag size={28} className="mx-auto mb-3 opacity-30" /><p className="text-sm font-semibold">No BA-Ready stories yet.</p><p className="text-[11px] mt-1 max-w-xs mx-auto">Use the BA Decision panel on each story to mark them Ready before pushing to Jira.</p></div>
          ) : readyStories.map(s => {
            const vr = getVr(s.story_id);
            const isSel = selected.has(s.story_id);
            return (
              <label key={s.story_id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSel ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="checkbox" checked={isSel} onChange={() => toggle(s.story_id)} className="mt-0.5 accent-indigo-600" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-gray-900 truncate">{s.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{s.story}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase border ${getPriorityStyle(s.priority)}`}>{s.priority}</span>
                    {vr && <span className="text-[9px] text-indigo-600 font-bold">{vr.overall_quality_score.toFixed(1)}/100</span>}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        {error && <div className="mx-4 mb-3 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold"><AlertCircle size={13} />{error}</div>}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} disabled={pushing} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40">Cancel</button>
          <button onClick={handlePush} disabled={pushing || selected.size === 0 || readyStories.length === 0} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-40">
            {pushing ? <><Loader2 size={14} className="animate-spin" />Pushing...</> : <><Send size={14} />Push {selected.size} to Jira</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const FileStoryGenerator: React.FC = () => {
  const currentProject = useMeetingStore(s => s.currentProject);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [stories, setStories] = useState<GeneratedStory[] | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [meetingId, setMeetingId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [exportFilter, setExportFilter] = useState<'all' | 'ready'>('ready');
  const [baDecisions, setBADecisions] = useState<Record<string, BADecision>>({});
  const [flagNotes, setFlagNotes] = useState<Record<string, string>>({});
  const [jiraConfig, setJiraConfig] = useState<ProjectConfiguration | null>(null);
  const [jiraConfigLoading, setJiraConfigLoading] = useState(false);
  const [jiraResults, setJiraResults] = useState<Record<string, JiraPushResult>>({});
  const [jiraPushModalOpen, setJiraPushModalOpen] = useState(false);
  const [jiraToast, setJiraToast] = useState<JiraPushResult[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentProject?.id) return;
    setJiraConfigLoading(true);
    projectConfigApi.getConfiguration(currentProject.id).then(cfg => setJiraConfig(cfg)).catch(() => setJiraConfig(null)).finally(() => setJiraConfigLoading(false));
  }, [currentProject?.id]);

  const hasJira = !!jiraConfig?.jira_url && !!jiraConfig?.jira_api_token;
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { if (f.name.endsWith('.txt')) { setFile(f); setError(null); } else { setError('Please upload a valid .txt transcript file.'); setFile(null); } } };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError(null); setStories(null); setValidationResults([]); setMeetingId(''); setBADecisions({}); setFlagNotes({}); setJiraResults({});
    try {
      const data = await ragApi.uploadTranscript(file, 'Generate comprehensive user stories based on this transcript.');
      if (data.stories && data.stories.length > 0) {
        setStories(data.stories); setValidationResults(data.validation_results ?? []); setMeetingId(data.meeting_id ?? data.transcript_id ?? '');
        const init: Record<string, BADecision> = {};
        data.stories.forEach(s => { init[s.story_id] = 'Pending'; });
        setBADecisions(init);
      } else { setError("The RAG engine couldn't identify any clear user stories from the uploaded file."); }
    } catch (err: any) { setError(err.message || 'Failed to process transcript'); } finally { setLoading(false); }
  };

  const handleStoryUpdated = (updatedStory: GeneratedStory, updatedVr: ValidationResult) => {
    setStories(prev => prev ? prev.map(s => s.story_id === updatedStory.story_id ? updatedStory : s) : prev);
    setValidationResults(prev => { const exists = prev.some(v => v.story_id === updatedVr.story_id); return exists ? prev.map(v => v.story_id === updatedVr.story_id ? updatedVr : v) : [...prev, updatedVr]; });
    setBADecisions(prev => ({ ...prev, [updatedStory.story_id]: 'Pending' }));
  };

  const handleApprove = (storyId: string) => setBADecisions(prev => ({ ...prev, [storyId]: 'Ready' }));
  const handleFlag = (storyId: string, note: string) => { setBADecisions(prev => ({ ...prev, [storyId]: 'Flagged' })); setFlagNotes(prev => ({ ...prev, [storyId]: note })); };
  const getValidationFor = (storyId: string) => validationResults.find(v => v.story_id === storyId);
  const storiesForExport = () => { if (!stories) return []; if (exportFilter === 'ready') return stories.filter(s => baDecisions[s.story_id] === 'Ready'); return stories; };
  const exportToJSON = () => { if (!file) return; const blob = new Blob([JSON.stringify(storiesForExport().map(s => ({ ...s, ba_decision: baDecisions[s.story_id], flag_note: flagNotes[s.story_id], validation: getValidationFor(s.story_id), jira: jiraResults[s.story_id] })), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${file.name.replace('.txt', '')}_stories.json`; a.click(); };
  const exportToCSV = () => { if (!file) return; const data = storiesForExport(); const headers = ['ID', 'Title', 'Story', 'Priority', 'System Status', 'Quality Score', 'BA Decision', 'Jira Key', 'Acceptance Criteria']; const rows = data.map(s => { const vr = getValidationFor(s.story_id); const jr = jiraResults[s.story_id]; return [s.story_id, s.title, s.story, s.priority, vr?.status ?? '', vr?.overall_quality_score?.toFixed(1) ?? '', baDecisions[s.story_id] ?? 'Pending', jr?.jira_key ?? '', s.acceptance_criteria.join('; ')]; }); const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `${file.name.replace('.txt', '')}_stories.csv`; a.click(); };
  const exportToTxt = () => { if (!file) return; const text = storiesForExport().map(s => { const vr = getValidationFor(s.story_id); return [`Title: ${s.title}`, `BA Decision: ${baDecisions[s.story_id] ?? 'Pending'} | System: ${vr?.status ?? 'N/A'} | Quality: ${vr?.overall_quality_score?.toFixed(1) ?? 'N/A'}/100`, `Story: ${s.story}`, `Priority: ${s.priority}`, `Criteria:\n${s.acceptance_criteria.map(ac => `  - ${ac}`).join('\n')}`].join('\n'); }).join('\n\n---\n\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = `${file.name.replace('.txt', '')}_stories.txt`; a.click(); };
  const copyAllStories = () => { if (!stories) return; navigator.clipboard.writeText(storiesForExport().map(s => `Title: ${s.title}\nStory: ${s.story}\nCriteria:\n${s.acceptance_criteria.map(ac => `- ${ac}`).join('\n')}`).join('\n\n---\n\n')); };
  const reset = () => { setFile(null); setStories(null); setValidationResults([]); setMeetingId(''); setError(null); setBADecisions({}); setFlagNotes({}); setJiraResults({}); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const handleJiraPushed = (results: JiraPushResult[]) => { const map: Record<string, JiraPushResult> = {}; results.forEach(r => { map[r.story_id] = r; }); setJiraResults(prev => ({ ...prev, ...map })); setJiraToast(results); setTimeout(() => setJiraToast(null), 8000); };
  const readyCount = Object.values(baDecisions).filter(d => d === 'Ready').length;

  return (
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="space-y-1 mb-2">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Transcript to Story Hub</h2>
        <p className="text-gray-400 text-xs font-medium">AI-generates and validates stories. BA reviews and approves. Ready stories push to Jira.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-5 sticky top-8">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Control Panel</h3>
            <div onClick={() => fileInputRef.current?.click()} className={`relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center transition-all cursor-pointer group ${file ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20'}`}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt" className="hidden" />
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all group-hover:scale-110 shadow-sm ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>{file ? <FileText size={20} /> : <Upload size={20} />}</div>
              <div className="text-center"><p className="text-xs font-bold text-gray-900 truncate max-w-[140px]">{file ? file.name : 'Upload .txt'}</p><p className="text-[9px] text-gray-400 mt-0.5 uppercase font-black tracking-tighter">{file ? 'Click to change' : 'Drag or click'}</p></div>
            </div>
            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-2"><AlertCircle size={12} className="shrink-0" />{error}</div>}
            <div className="space-y-2">
              <button disabled={!file || loading} onClick={handleUpload} className="w-full py-3 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200 disabled:opacity-30">{loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}{loading ? 'Processing...' : 'Generate Stories'}</button>
              <button onClick={reset} className="w-full py-2.5 rounded-lg border border-gray-100 text-gray-400 text-[10px] font-bold hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"><Trash2 size={12} /> Reset View</button>
            </div>
            {stories && stories.length > 0 && (
              <div className="pt-4 border-t border-gray-50 space-y-2">
                {hasJira ? (
                  <button onClick={() => setJiraPushModalOpen(true)} disabled={readyCount === 0} className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black transition-all border disabled:opacity-30 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-sm shadow-blue-200 active:scale-[0.98]"><Zap size={13} />{readyCount > 0 ? `Push to Jira (${readyCount} Ready)` : 'No Ready Stories Yet'}</button>
                ) : (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-semibold leading-relaxed"><Zap size={11} className="inline mr-1" />{jiraConfigLoading ? 'Checking Jira config...' : 'No Jira configured. Set it up in Project Settings.'}</div>
                )}
              </div>
            )}
            {stories && stories.length > 0 && (
              <div className="pt-4 border-t border-gray-50 space-y-2">
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Export Filter</h4>
                <div className="flex flex-col gap-1.5">
                  {[{ value: 'ready', label: 'BA-Ready only (Sprint-ready)' }, { value: 'all', label: 'All stories' }].map(opt => (
                    <button key={opt.value} onClick={() => setExportFilter(opt.value as 'all' | 'ready')} className={`text-left px-3 py-2 rounded-lg border text-[10px] font-bold transition-all ${exportFilter === opt.value ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2 mb-2 text-indigo-600"><Info size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Workflow</span></div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-medium">AI generates + 5-layer validates stories. BA marks each Ready or Flagged. Only Ready stories go to Sprint / Jira. Flagged stories are blocked from increment.</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-9 min-h-[500px] flex flex-col">
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 flex-grow relative overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="relative mb-6"><div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" /><Sparkles size={24} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" /></div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Generating and Validating...</h3>
                  <p className="text-gray-400 text-sm max-w-sm font-medium">Running 5-layer quality validation. BA review workflow will follow.</p>
                </motion.div>
              ) : stories ? (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <SummaryBar stories={stories} validationResults={validationResults} baDecisions={baDecisions} />
                    <div className="flex gap-1.5 pr-1">
                      <button onClick={copyAllStories} className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm" title="Copy"><Clipboard size={14} /></button>
                      <button onClick={exportToJSON} className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-orange-500 hover:border-orange-100 transition-all shadow-sm" title="Export JSON"><FileJson size={14} /></button>
                      <button onClick={exportToCSV} className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm" title="Export CSV"><Table size={14} /></button>
                      <button onClick={exportToTxt} className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-blue-500 hover:border-blue-100 transition-all shadow-sm" title="Download TXT"><Download size={14} /></button>
                      <button onClick={() => window.print()} className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all shadow-sm" title="Print"><Printer size={14} /></button>
                    </div>
                  </div>
                  <div className="flex-grow overflow-y-auto p-5 space-y-4 custom-scrollbar">
                    {stories.map(story => (
                      <StoryCardFull key={story.story_id} story={story} validationResult={getValidationFor(story.story_id)} meetingId={meetingId} baDecision={baDecisions[story.story_id] ?? 'Pending'} flagNote={flagNotes[story.story_id] ?? ''} jiraResult={jiraResults[story.story_id]} onStoryUpdated={handleStoryUpdated} onApprove={handleApprove} onFlag={handleFlag} />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 border border-gray-200 shadow-inner"><FileText size={32} className="text-gray-300" /></div>
                  <h3 className="text-lg font-black text-gray-900 mb-1">No Results Yet</h3>
                  <p className="text-gray-500 text-xs max-w-sm font-medium italic">Upload a transcript and click Generate Stories to begin.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {jiraPushModalOpen && stories && currentProject && <JiraPushModal key="jira-modal" stories={stories} baDecisions={baDecisions} getVr={getValidationFor} projectId={currentProject.id} onClose={() => setJiraPushModalOpen(false)} onPushed={handleJiraPushed} />}
      </AnimatePresence>
      <AnimatePresence>
        {jiraToast && <JiraResultToast key="jira-toast" results={jiraToast} onClose={() => setJiraToast(null)} />}
      </AnimatePresence>
    </div>
  );
};
