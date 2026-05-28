import React, { useState, useEffect } from 'react';
import { Meeting, MeetingAnalysis } from './types';
import { storage } from './storage';
import MeetingInput from './components/MeetingInput';
import TopicSelection from './components/TopicSelection';
import AnalysisResult from './components/AnalysisResult';
import ArchivePage from './components/ArchivePage';
import InsightsPage from './components/InsightsPage';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Archive, BarChart2, Plus, ArrowLeft } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
const createEmptyMeeting = (): Meeting => ({
  id: crypto.randomUUID(),
  title: '',
  date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
  type: '',
  keywords: [],
  originalTranscript: '',
  glossary: '',
  prefixedQuestions: '',
  speakerMap: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

type Page = 'analyze' | 'archive' | 'insights';

// ── Component ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>('analyze');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting>(createEmptyMeeting());
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedSpeakers, setDetectedSpeakers] = useState<string[]>([]);
  const [recommendedTopics, setRecommendedTopics] = useState<string[]>([]);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [excludedTopics, setExcludedTopics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMeetings(storage.getAll());
  }, []);

  const refreshMeetings = () => setMeetings(storage.getAll());

  const handleNewMeeting = () => {
    setCurrentMeeting(createEmptyMeeting());
    setPhase(1);
    setDetectedSpeakers([]);
    setRecommendedTopics([]);
    setSuggestedKeywords([]);
    setExcludedTopics([]);
    setError(null);
    setPage('analyze');
  };

  const handleLoadMeeting = (meeting: Meeting) => {
    setCurrentMeeting(meeting);
    setPhase(meeting.analysis ? 3 : 1);
    setError(null);
    setPage('analyze');
  };

  const handleDeleteMeeting = (id: string) => {
    storage.remove(id);
    refreshMeetings();
    if (currentMeeting.id === id) handleNewMeeting();
  };

  const startPhase1Analysis = async (options?: { refresh?: boolean; stayInPhase1?: boolean }) => {
    if (!currentMeeting.originalTranscript) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: currentMeeting.originalTranscript,
          excludedTopics: options?.refresh ? excludedTopics : [],
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setDetectedSpeakers(data.speakers || []);
      setRecommendedTopics(data.topics || []);
      setSuggestedKeywords(data.keywords || []);

      // Pre-fill keywords with AI suggestions (keep any manual ones already added)
      if (!options?.refresh) {
        const existingManual = currentMeeting.keywords;
        const merged = Array.from(new Set([...existingManual, ...(data.keywords || [])]));
        setCurrentMeeting(m => ({ ...m, keywords: merged }));
      }

      if (!options?.stayInPhase1) setPhase(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startPhase2Analysis = async () => {
    if (!currentMeeting.analysis?.selectedTopics?.length) return;

    const fullSpeakerMap: Record<string, string> = { ...currentMeeting.speakerMap };
    detectedSpeakers.forEach((sid, idx) => {
      if (!fullSpeakerMap[sid]?.trim()) fullSpeakerMap[sid] = `참석자 ${idx + 1}`;
    });

    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/refine-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: currentMeeting.originalTranscript,
          glossary: currentMeeting.glossary,
          questions: currentMeeting.prefixedQuestions,
          selectedTopics: currentMeeting.analysis.selectedTopics,
          speakerMap: fullSpeakerMap,
          keywords: currentMeeting.keywords,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const analysis: MeetingAnalysis = {
        topics: recommendedTopics,
        selectedTopics: currentMeeting.analysis.selectedTopics,
        excludedTopics,
        summaryItems: data.summaryItems,
        questionMappings: data.questionMappings,
        actionItems: data.actionItems,
        refinedTranscript: data.refinedLines.map((l: any, i: number) => ({ ...l, id: String(i) })),
      };

      setCurrentMeeting(m => ({ ...m, analysis }));
      setPhase(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeeting = () => {
    const toSave = { ...currentMeeting, updatedAt: new Date().toISOString() };
    storage.save(toSave);
    refreshMeetings();
    alert('저장되었습니다!');
  };

  return (
    <div className="flex flex-col h-screen bg-[--c-bg] overflow-hidden">
      {/* ── Top nav ── */}
      <header className="bg-white border-b border-[--c-border] flex items-center justify-between px-6 h-14 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: 'var(--c-blue)' }} />
          <span className="text-base font-black tracking-tight text-[--c-ink]">Smart Meeting Logger</span>
        </div>

        <nav className="flex items-center gap-1">
          <NavBtn active={page === 'analyze'} onClick={() => setPage('analyze')} icon={<Sparkles className="w-4 h-4" />} label="분석" />
          <NavBtn active={page === 'archive'} onClick={() => setPage('archive')} icon={<Archive className="w-4 h-4" />} label="아카이브" />
          <NavBtn active={page === 'insights'} onClick={() => setPage('insights')} icon={<BarChart2 className="w-4 h-4" />} label="인사이트" />
        </nav>

        <button
          onClick={handleNewMeeting}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all"
          style={{ color: 'var(--c-blue)', borderColor: 'var(--c-blue-soft)', background: 'var(--c-blue-soft)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          새 분석
        </button>
      </header>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-xl text-sm font-semibold flex items-center gap-2"
          style={{ background: '#FEF2F2', color: 'var(--c-red)', border: '1px solid #FCA5A5' }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--c-red)' }} />
          {error}
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {page === 'analyze' && (
            <motion.div key="analyze" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col overflow-hidden">
              {/* Phase tabs */}
              <div className="bg-white border-b border-[--c-border] px-6 py-2 flex items-center gap-4 shrink-0">
                <PhaseTab n={1} active={phase === 1} label="입력" onClick={() => setPhase(1)} />
                <div className="w-8 h-px bg-[--c-border]" />
                <PhaseTab n={2} active={phase === 2} label="주제 선택" onClick={() => { if (detectedSpeakers.length) setPhase(2); }} disabled={!detectedSpeakers.length} />
                <div className="w-8 h-px bg-[--c-border]" />
                <PhaseTab n={3} active={phase === 3} label="리포트" onClick={() => { if (currentMeeting.analysis) setPhase(3); }} disabled={!currentMeeting.analysis} />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {phase === 1 && (
                    <motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <MeetingInput
                        meeting={currentMeeting}
                        setMeeting={setCurrentMeeting}
                        onStartAnalysis={(opts) => startPhase1Analysis(opts)}
                        onNextPhase={() => setPhase(2)}
                        isAnalyzing={isAnalyzing}
                        detectedSpeakers={detectedSpeakers}
                        suggestedKeywords={suggestedKeywords}
                      />
                    </motion.div>
                  )}
                  {phase === 2 && (
                    <motion.div key="p2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <TopicSelection
                        recommendedTopics={recommendedTopics}
                        selectedTopics={currentMeeting.analysis?.selectedTopics || []}
                        onToggleTopic={(topic) => {
                          const cur = currentMeeting.analysis?.selectedTopics || [];
                          const next = cur.includes(topic) ? cur.filter(t => t !== topic) : [...cur, topic];
                          setCurrentMeeting(m => ({
                            ...m,
                            analysis: { ...(m.analysis || { topics: recommendedTopics, summaryItems: [], questionMappings: [], actionItems: [], refinedTranscript: [] }), selectedTopics: next }
                          }));
                        }}
                        onExcludeTopic={(topic) => {
                          setExcludedTopics(e => [...e, topic]);
                          setRecommendedTopics(t => t.filter(x => x !== topic));
                          const cur = currentMeeting.analysis?.selectedTopics || [];
                          if (cur.includes(topic))
                            setCurrentMeeting(m => ({ ...m, analysis: { ...m.analysis!, selectedTopics: cur.filter(t => t !== topic) } }));
                        }}
                        onRefreshTopics={() => startPhase1Analysis({ refresh: true })}
                        onStartFinalAnalysis={startPhase2Analysis}
                        isAnalyzing={isAnalyzing}
                      />
                    </motion.div>
                  )}
                  {phase === 3 && (
                    <motion.div key="p3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <AnalysisResult
                        meeting={currentMeeting}
                        setMeeting={setCurrentMeeting}
                        onSave={handleSaveMeeting}
                        onUpdateRefinedTranscript={(lines) => {
                          if (window.confirm('원문이 수정되었습니다.\n수정된 스크립트로 1차 분석을 다시 진행하시겠습니까?')) {
                            const reconstructed = lines.map(l => `[${l.speakerName}] ${l.text}`).join('\n');
                            setCurrentMeeting(m => ({ ...m, originalTranscript: reconstructed, analysis: undefined }));
                            setDetectedSpeakers([]);
                            setRecommendedTopics([]);
                            setPhase(1);
                          } else {
                            setCurrentMeeting(m => ({ ...m, analysis: { ...m.analysis!, refinedTranscript: lines } }));
                          }
                        }}
                        onAddToGlossary={(term) => {
                          setCurrentMeeting(m => ({ ...m, glossary: m.glossary ? `${m.glossary}, ${term}` : term }));
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {page === 'archive' && (
            <motion.div key="archive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto custom-scrollbar">
              <ArchivePage
                meetings={meetings}
                onLoad={handleLoadMeeting}
                onDelete={handleDeleteMeeting}
              />
            </motion.div>
          )}

          {page === 'insights' && (
            <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto custom-scrollbar">
              <InsightsPage meetings={meetings} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Small UI helpers ──────────────────────────────────────────────────────────
function NavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
      style={{
        background: active ? 'var(--c-blue-soft)' : 'transparent',
        color: active ? 'var(--c-blue)' : 'var(--c-muted)',
      }}
    >
      {icon}{label}
    </button>
  );
}

function PhaseTab({ n, active, label, onClick, disabled }: { n: number; active: boolean; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 transition-all"
      style={{ opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >
      <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black transition-all"
        style={{
          background: active ? 'var(--c-blue)' : '#F1F5F9',
          color: active ? '#fff' : 'var(--c-muted)',
        }}>
        {n}
      </span>
      <span className="text-sm font-semibold" style={{ color: active ? 'var(--c-ink)' : 'var(--c-muted)' }}>{label}</span>
    </button>
  );
}
