import React, { useState, useEffect } from 'react';
import { Meeting, MeetingAnalysis, RefinedTranscriptLine } from './types';
import MeetingInput from './components/MeetingInput';
import TopicSelection from './components/TopicSelection';
import AnalysisResult from './components/AnalysisResult';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'smart_meeting_logger_meetings';

const createEmptyMeeting = (): Meeting => ({
  id: crypto.randomUUID(),
  title: '',
  date: new Date().toISOString().split('T')[0],
  type: '',
  keywords: [],
  originalTranscript: '',
  glossary: '',
  prefixedQuestions: '',
  speakerMap: {},
  updatedAt: new Date().toISOString()
});

export default function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting>(createEmptyMeeting());
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedSpeakers, setDetectedSpeakers] = useState<string[]>([]);
  const [recommendedTopics, setRecommendedTopics] = useState<string[]>([]);
  const [excludedTopics, setExcludedTopics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMeetings(parsed);
        // If we have saved meetings, we could optionally load the latest one,
        // but the user asked to remove shorthand for cross-analysis,
        // so let's just keep the "New Meeting" state or the first one.
        if (parsed.length > 0) {
          // setCurrentMeeting(parsed[0]);
        }
      } catch (e) {
        console.error('Failed to parse saved meetings');
      }
    }
  }, []);

  // Save to localStorage whenever meetings list changes
  const saveToStorage = (allMeetings: Meeting[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMeetings));
    setMeetings(allMeetings);
  };

  const handleNewMeeting = () => {
    setCurrentMeeting(createEmptyMeeting());
    setPhase(1);
    setDetectedSpeakers([]);
    setRecommendedTopics([]);
    setExcludedTopics([]);
    setError(null);
  };

  const handleSelectMeeting = (meeting: Meeting) => {
    setCurrentMeeting(meeting);
    if (meeting.analysis) {
      setPhase(3);
    } else {
      setPhase(1);
    }
    setError(null);
  };

  const handleDeleteMeeting = (id: string) => {
    const next = meetings.filter(m => m.id !== id);
    saveToStorage(next);
    if (currentMeeting.id === id) {
      handleNewMeeting();
    }
  };

  const startPhase1Analysis = async (options?: { refresh?: boolean, stayInPhase1?: boolean }) => {
    if (!currentMeeting.originalTranscript) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: currentMeeting.originalTranscript,
          excludedTopics: options?.refresh ? excludedTopics : []
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
 
      setDetectedSpeakers(data.speakers || []);
      setRecommendedTopics(data.topics || []);
      
      if (!options?.stayInPhase1) {
        setPhase(2);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startPhase2Analysis = async () => {
    if (!currentMeeting.analysis?.selectedTopics.length) return;
    
    // Default speaker mapping for empty entries
    const fullSpeakerMap: Record<string, string> = { ...currentMeeting.speakerMap };
    detectedSpeakers.forEach((sid, idx) => {
      if (!fullSpeakerMap[sid] || fullSpeakerMap[sid].trim() === '') {
        fullSpeakerMap[sid] = `참석자 ${idx + 1}`;
      }
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
          speakerMap: fullSpeakerMap
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const analysis: MeetingAnalysis = {
        topics: recommendedTopics,
        selectedTopics: currentMeeting.analysis.selectedTopics,
        excludedTopics: excludedTopics,
        summaryItems: data.summaryItems,
        questionMappings: data.questionMappings,
        actionItems: data.actionItems,
        refinedTranscript: data.refinedLines.map((l: any, i: number) => ({ ...l, id: String(i) }))
      };

      setCurrentMeeting({ ...currentMeeting, analysis });
      setPhase(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeeting = () => {
    const index = meetings.findIndex(m => m.id === currentMeeting.id);
    let next;
    if (index >= 0) {
      next = [...meetings];
      next[index] = { ...currentMeeting, updatedAt: new Date().toISOString() };
    } else {
      next = [{ ...currentMeeting, updatedAt: new Date().toISOString() }, ...meetings];
    }
    saveToStorage(next);
    alert('브라우저에 성공적으로 저장되었습니다!');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar removed as per user request v1 */}
      
      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="bg-white border-b border-slate-200 flex items-center justify-between px-6 h-14 shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold tracking-tight text-slate-800">Smart Meeting Logger</h1>
          </div>
          <div className="flex items-center gap-6">
            <PhaseIndicator active={phase === 1} label="1" title="INPUT" onClick={() => setPhase(1)} />
            <div className="w-6 h-px bg-slate-200" />
            <PhaseIndicator active={phase === 2} label="2" title="TOPICS" onClick={() => {
              if (detectedSpeakers.length > 0) setPhase(2);
            }} />
            <div className="w-6 h-px bg-slate-200" />
            <PhaseIndicator active={phase === 3} label="3" title="REPORT" onClick={() => {
              if (currentMeeting.analysis?.summaryItems.length) setPhase(3);
            }} />
          </div>
          <button 
            onClick={handleNewMeeting}
            className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest px-3 py-1.5 border border-indigo-100 rounded hover:bg-indigo-50 transition-colors"
          >
            New Analysis
          </button>
        </header>

        {error && (
          <div className="m-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
             System Error: {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <motion.div
                key="phase1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <MeetingInput
                  meeting={currentMeeting}
                  setMeeting={setCurrentMeeting}
                  onStartAnalysis={(options) => startPhase1Analysis(options)}
                  onNextPhase={() => setPhase(2)}
                  isAnalyzing={isAnalyzing}
                  detectedSpeakers={detectedSpeakers}
                />
              </motion.div>
            )}

            {phase === 2 && (
              <motion.div
                key="phase2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <TopicSelection
                  recommendedTopics={recommendedTopics}
                  selectedTopics={currentMeeting.analysis?.selectedTopics || []}
                  onToggleTopic={(topic) => {
                    const currentTags = currentMeeting.analysis?.selectedTopics || [];
                    const nextTags = currentTags.includes(topic)
                      ? currentTags.filter(t => t !== topic)
                      : [...currentTags, topic];
                    setCurrentMeeting({
                      ...currentMeeting,
                      analysis: {
                        ...(currentMeeting.analysis || {
                          topics: recommendedTopics,
                          summaryItems: [],
                          questionMappings: [],
                          actionItems: [],
                          refinedTranscript: []
                        }),
                        selectedTopics: nextTags
                      }
                    });
                  }}
                  onExcludeTopic={(topic) => {
                    setExcludedTopics([...excludedTopics, topic]);
                    setRecommendedTopics(recommendedTopics.filter(t => t !== topic));
                    // Also deselect if it was selected
                    const currentTags = currentMeeting.analysis?.selectedTopics || [];
                    if (currentTags.includes(topic)) {
                      setCurrentMeeting({
                        ...currentMeeting,
                        analysis: {
                          ...currentMeeting.analysis!,
                          selectedTopics: currentTags.filter(t => t !== topic)
                        }
                      });
                    }
                  }}
                  onRefreshTopics={() => startPhase1Analysis({ refresh: true })}
                  onStartFinalAnalysis={startPhase2Analysis}
                  isAnalyzing={isAnalyzing}
                />
              </motion.div>
            )}

            {phase === 3 && (
              <motion.div
                key="phase3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <AnalysisResult
                  meeting={currentMeeting}
                  setMeeting={setCurrentMeeting}
                  onSave={handleSaveMeeting}
                  onUpdateRefinedTranscript={(lines) => {
                    const confirmRestart = window.confirm(
                      "원문이 수정되었습니다.\n\n수정하신 발언 내용은 주요 논의 분석과 핵심 주제(Topic)에 영향을 줄 수 있습니다.\n수정된 전체 스크립트를 기반으로 다시 1차 화자/주제 분석을 진행하시겠습니까?"
                    );
                    
                    if (confirmRestart) {
                      const reconstructed = lines
                        .map(line => `[${line.speakerName}] ${line.text}`)
                        .join('\n');
                      
                      const updatedMeeting = {
                        ...currentMeeting,
                        originalTranscript: reconstructed,
                        analysis: undefined
                      };
                      setCurrentMeeting(updatedMeeting);
                      setDetectedSpeakers([]);
                      setRecommendedTopics([]);
                      setPhase(1);
                    } else {
                      setCurrentMeeting({
                        ...currentMeeting,
                        analysis: {
                          ...currentMeeting.analysis!,
                          refinedTranscript: lines
                        }
                      });
                    }
                  }}
                  onAddToGlossary={(term) => {
                    const existing = currentMeeting.glossary;
                    setCurrentMeeting({
                      ...currentMeeting,
                      glossary: existing ? `${existing}, ${term}` : term
                    });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function PhaseIndicator({ active, label, title, onClick }: { active: boolean; label: string; title: string; onClick?: () => void }) {
  return (
    <div 
      className={`flex items-center gap-2 ${onClick ? 'cursor-pointer group' : ''}`}
      onClick={onClick}
    >
      <div className={`
        w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-all
        ${active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}
      `}>
        {label}
      </div>
      <span className={`text-[10px] font-bold tracking-widest transition-all ${active ? 'text-slate-800' : 'text-slate-300 group-hover:text-slate-400'}`}>
        {title}
      </span>
    </div>
  );
}
