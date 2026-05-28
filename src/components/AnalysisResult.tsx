import React, { useState } from 'react';
import { Meeting, MeetingAnalysis, SummaryItem } from '../types';
import { Download, Zap, MessageSquare, CheckSquare, User, Clock, Sparkles, ChevronDown, ChevronUp, Link as LinkIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TranscriptEditor from './TranscriptEditor';

interface AnalysisResultProps {
  meeting: Meeting;
  setMeeting: React.Dispatch<React.SetStateAction<Meeting>>;
  onSave: () => void;
  onUpdateRefinedTranscript: (lines: MeetingAnalysis['refinedTranscript']) => void;
  onAddToGlossary: (term: string) => void;
}

interface TopicAccordionItemProps {
  item: SummaryItem;
  index: number;
  onJumpToTranscript?: () => void;
  speakerMap: Record<string, string>;
  key?: React.Key;
}

function TopicAccordionItem({ 
  item, 
  index, 
  onJumpToTranscript,
  speakerMap
}: TopicAccordionItemProps) {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  const getSpeakerMappedName = (idOrName: string) => {
    return speakerMap[idOrName] || idOrName;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all"
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-7 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-5">
          <span className="w-9 h-9 flex items-center justify-center bg-slate-900 text-white rounded-xl font-bold text-xs shadow-lg shadow-slate-200">
            {index + 1}
          </span>
          <h5 className="text-lg font-black text-slate-800 tracking-tight">{item.topic}</h5>
        </div>
        <div className={`p-1.5 rounded-full transition-all ${isExpanded ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-7 pt-0 space-y-6">
              <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl relative">
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {/* Process footnotes for visual styling */}
                  {item.summary.split(/(\[\d+\])/).map((part, i) => {
                    if (part.match(/\[\d+\]/)) {
                      return <sup key={i} className="text-indigo-600 font-bold ml-0.5">{part}</sup>;
                    }
                    return part;
                  })}
                </p>
              </div>

              {item.citations && item.citations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Citations & Evidence</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {item.citations.map((cite) => (
                      <div key={cite.id} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-xl group/cite hover:border-indigo-200 transition-all">
                        <span className="text-[10px] font-bold text-indigo-400 w-6">[{cite.id}]</span>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs text-slate-500 font-normal leading-relaxed italic">"{cite.text}"</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">— {getSpeakerMappedName(cite.speaker)}</span>
                            <button 
                              onClick={onJumpToTranscript}
                              className="opacity-0 group-hover/cite:opacity-100 flex items-center gap-1 text-[9px] font-bold text-indigo-500 hover:text-indigo-700 transition-all uppercase tracking-widest"
                            >
                              <LinkIcon className="w-3 h-3" />
                              View in Transcript
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AnalysisResult({
  meeting,
  setMeeting,
  onSave,
  onUpdateRefinedTranscript,
  onAddToGlossary
}: AnalysisResultProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
  const analysis = meeting.analysis;

  if (!analysis) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header with Editable Title */}
      <header className="px-8 py-6 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-8">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={meeting.title}
              onChange={(e) => setMeeting({ ...meeting, title: e.target.value })}
              placeholder="회의 제목을 입력하세요"
              className="w-full bg-transparent text-2xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded px-2 -ml-2 transition-all placeholder:text-slate-300 tracking-tight"
            />
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                 {meeting.type || '일반 미팅'}
               </div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{meeting.date}</div>
               {meeting.keywords.length > 0 && meeting.keywords[0].trim() !== '' && (
                 <div className="flex items-center gap-2 ml-2">
                   {meeting.keywords.map(kw => (
                     <span key={kw} className="text-[10px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full">#{kw}</span>
                   ))}
                 </div>
               )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-slate-200/50 p-1 rounded-2xl flex shrink-0 border border-slate-200 shadow-inner">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
                    activeTab === 'summary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Summary Report
                </button>
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
                    activeTab === 'transcript' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Transcript Tab
                </button>
             </div>
             <button
               onClick={onSave}
               className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-100"
             >
               <Download className="w-4 h-4" />
               Save Report
             </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'summary' ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full grid grid-cols-12 gap-0 overflow-hidden"
            >
              {/* Main Content Area */}
              <div className="col-span-12 lg:col-span-8 overflow-y-auto custom-scrollbar bg-white p-10 lg:p-16 border-r border-slate-100">
                <div className="max-w-[800px] mx-auto space-y-20">
                  {/* Summary Section */}
                  <section className="space-y-8">
                    <div className="relative">
                      <div className="absolute -left-12 top-0 h-full w-1 bg-indigo-600 hidden lg:block rounded-full opacity-20" />
                      <h3 className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">Phase 01</h3>
                      <h4 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-2">Topic Summaries</h4>
                      <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">내용의 핵심 논의 사항을 주제별로 상세하게 정리하였습니다.</p>
                    </div>

                    <div className="space-y-4">
                      {analysis.summaryItems.map((item, idx) => (
                        <TopicAccordionItem 
                          key={idx} 
                          item={item} 
                          index={idx} 
                          speakerMap={meeting.speakerMap}
                          onJumpToTranscript={() => setActiveTab('transcript')}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Questions Mapping Section */}
                  {meeting.prefixedQuestions && meeting.prefixedQuestions.trim() !== '' && analysis.questionMappings && analysis.questionMappings.length > 0 && (
                    <section className="space-y-8 pt-12 border-t border-slate-100">
                      <div>
                        <h3 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] mb-2">Phase 02</h3>
                        <h4 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-2">사전질문 Q&A</h4>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">사전 질문들에 대한 논의 내용을 매핑하였습니다.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {analysis.questionMappings.map((mapping, idx) => (
                          <div key={idx} className="p-6 bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm space-y-4 group hover:bg-white hover:border-rose-200 transition-all">
                            <div className="flex gap-4">
                              <span className="text-rose-500 font-black text-lg leading-none pt-0.5">Q.</span>
                              <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug tracking-tight">{mapping.question}</p>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-slate-100/80">
                              <span className="text-indigo-500 font-black text-lg leading-none pt-0.5">A.</span>
                              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                                {mapping.answerMapping}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {/* Sidebar Stats Area */}
              <div className="col-span-12 lg:col-span-4 bg-slate-50/30 flex flex-col overflow-hidden border-l border-slate-100">
                <div className="p-12 space-y-16 flex-1 overflow-y-auto custom-scrollbar">
                  {/* Action Items List */}
                  <section className="space-y-8">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Action Items</h4>
                       <span className="text-[9px] font-black text-indigo-500 bg-white border border-indigo-100 px-3 py-1 rounded-full shadow-sm">AI EXTRACTED</span>
                    </div>
                    <div className="space-y-4">
                      {analysis.actionItems.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 transition-all relative group"
                        >
                          <button
                            onClick={() => {
                              const nextActionItems = [...analysis.actionItems];
                              nextActionItems.splice(idx, 1);
                              setMeeting({
                                ...meeting,
                                analysis: {
                                  ...analysis,
                                  actionItems: nextActionItems
                                }
                              });
                            }}
                            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            title="삭제"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-start gap-5">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 font-black text-xs text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                               {idx + 1}
                             </div>
                             <div className="flex-1 space-y-2">
                               <p className="text-sm font-bold text-slate-700 leading-snug tracking-tight pr-6">{item.what}</p>
                               <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    {meeting.speakerMap[item.who] || item.who}
                                  </div>
                               </div>
                             </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  {/* Speaker Mapping List */}
                  <section className="space-y-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Participants</h4>
                    <div className="grid grid-cols-2 gap-3">
                       {Object.entries(meeting.speakerMap).map(([id, name]) => (
                          <div key={id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm text-center group hover:border-indigo-200 transition-all">
                             <span className="text-[8px] font-black text-slate-300 block uppercase mb-1 tracking-widest group-hover:text-indigo-400 transition-colors">{id}</span>
                             <span className="text-xs font-black text-slate-700">{name}</span>
                          </div>
                       ))}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="transcript"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full bg-slate-50 flex flex-col"
            >
              <div className="flex-1 overflow-hidden">
                <TranscriptEditor 
                  lines={analysis.refinedTranscript} 
                  onUpdate={onUpdateRefinedTranscript}
                  onAddToGlossary={onAddToGlossary}
                  speakerMap={meeting.speakerMap}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
