import React, { useState } from 'react';
import { Meeting, MeetingAnalysis, SummaryItem } from '../types';
import { Download, User, Sparkles, ChevronDown, Link as LinkIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TranscriptEditor from './TranscriptEditor';

// ── Accordion item ────────────────────────────────────────────────────────────
function TopicAccordion({ item, index, onJumpToTranscript, speakerMap }: {
  item: SummaryItem; index: number;
  onJumpToTranscript: () => void;
  speakerMap: Record<string, string>;
}) {
  const [open, setOpen] = useState(index === 0);
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }}
      className="bg-white border border-[--c-border] rounded-2xl overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-4">
          <span className="w-8 h-8 flex items-center justify-center rounded-xl font-black text-xs text-white"
            style={{ background: 'var(--c-purple)' }}>{index + 1}</span>
          <h5 className="text-base font-black text-[--c-ink]">{item.topic}</h5>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: open ? 'var(--c-blue)' : '#CBD5E1' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-6 pb-6 space-y-5">
              <div className="p-5 rounded-xl text-body" style={{ background: 'var(--c-purple-soft)', border: '1px solid #DDD6FE' }}>
                {item.summary.split(/(\[\d+\])/).map((part, i) =>
                  part.match(/\[\d+\]/)
                    ? <sup key={i} className="font-bold ml-0.5" style={{ color: 'var(--c-purple)' }}>{part}</sup>
                    : part
                )}
              </div>

              {item.citations?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-label">인용 근거</p>
                  {item.citations.map(c => (
                    <div key={c.id} className="flex gap-3 p-3 rounded-xl border border-[--c-border] bg-white hover:border-blue-200 transition-all group/c">
                      <span className="text-xs font-bold w-6 shrink-0" style={{ color: 'var(--c-purple)' }}>[{c.id}]</span>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm text-[--c-muted] italic">"{c.text}"</p>
                        <div className="flex items-center justify-between">
                          <span className="text-label">— {speakerMap[c.speaker] || c.speaker}</span>
                          <button onClick={onJumpToTranscript}
                            className="opacity-0 group-hover/c:opacity-100 flex items-center gap-1 text-xs font-bold transition-all"
                            style={{ color: 'var(--c-blue)' }}>
                            <LinkIcon className="w-3 h-3" />원문 보기
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnalysisResult({ meeting, setMeeting, onSave, onUpdateRefinedTranscript, onAddToGlossary }: {
  meeting: Meeting;
  setMeeting: React.Dispatch<React.SetStateAction<Meeting>>;
  onSave: () => void;
  onUpdateRefinedTranscript: (lines: MeetingAnalysis['refinedTranscript']) => void;
  onAddToGlossary: (term: string) => void;
}) {
  const [tab, setTab] = useState<'summary' | 'transcript'>('summary');
  const analysis = meeting.analysis;
  if (!analysis) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <header className="px-8 py-5 bg-gray-50 border-b border-[--c-border] shrink-0">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <input type="text" value={meeting.title}
              onChange={(e) => setMeeting(m => ({ ...m, title: e.target.value }))}
              placeholder="회의 제목을 입력하세요"
              className="w-full bg-transparent text-xl font-black text-[--c-ink] focus:outline-none focus:ring-2 rounded px-2 -ml-2 placeholder:text-gray-300" />
            <div className="flex items-center gap-3 flex-wrap">
              {meeting.type && (
                <span className="chip chip-blue">{meeting.type}</span>
              )}
              <span className="text-label">{meeting.date}</span>
              {meeting.keywords.filter(Boolean).map(kw => (
                <span key={kw} className="chip chip-yellow">#{kw}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex bg-gray-100 p-1 rounded-xl border border-[--c-border]">
              {(['summary', 'transcript'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: tab === t ? '#fff' : 'transparent',
                    color: tab === t ? 'var(--c-blue)' : 'var(--c-muted)',
                    boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  {t === 'summary' ? '요약 리포트' : '정제 원문'}
                </button>
              ))}
            </div>
            <button onClick={onSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md"
              style={{ background: 'var(--c-ink)' }}>
              <Download className="w-4 h-4" />저장
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {tab === 'summary' ? (
            <motion.div key="sum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full grid grid-cols-12 overflow-hidden">
              {/* Main */}
              <div className="col-span-12 lg:col-span-8 overflow-y-auto custom-scrollbar p-10 border-r border-[--c-border]">
                <div className="max-w-[760px] mx-auto space-y-16">
                  {/* Summaries */}
                  <section className="space-y-6">
                    <div>
                      <p className="text-label mb-1" style={{ color: 'var(--c-purple)' }}>주제별 요약</p>
                      <h4 className="text-2xl font-black text-[--c-ink]">Topic Summaries</h4>
                      <p className="text-body mt-1">내용의 핵심 논의 사항을 주제별로 정리하였습니다.</p>
                    </div>
                    <div className="space-y-3">
                      {analysis.summaryItems.map((item, idx) => (
                        <TopicAccordion key={idx} item={item} index={idx}
                          speakerMap={meeting.speakerMap}
                          onJumpToTranscript={() => setTab('transcript')} />
                      ))}
                    </div>
                  </section>

                  {/* Q&A */}
                  {meeting.prefixedQuestions?.trim() && analysis.questionMappings?.length > 0 && (
                    <section className="space-y-6 pt-10 border-t border-[--c-border]">
                      <div>
                        <p className="text-label mb-1" style={{ color: 'var(--c-pink)' }}>사전 질문 매핑</p>
                        <h4 className="text-2xl font-black text-[--c-ink]">Q&A</h4>
                      </div>
                      <div className="space-y-3">
                        {analysis.questionMappings.map((m, idx) => (
                          <div key={idx} className="p-5 rounded-2xl border border-[--c-border] hover:border-pink-200 transition-all space-y-4">
                            <div className="flex gap-3">
                              <span className="text-lg font-black" style={{ color: 'var(--c-pink)' }}>Q.</span>
                              <p className="text-sm font-bold text-[--c-ink] leading-snug">{m.question}</p>
                            </div>
                            <div className="flex gap-3 pt-3 border-t border-[--c-border]">
                              <span className="text-lg font-black" style={{ color: 'var(--c-blue)' }}>A.</span>
                              <p className="text-body">{m.answerMapping}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="col-span-12 lg:col-span-4 overflow-y-auto custom-scrollbar p-8 space-y-10 bg-gray-50">
                {/* Action Items */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-label">Action Items</h4>
                    <span className="chip chip-orange" style={{ fontSize: '10px' }}>AI 추출</span>
                  </div>
                  <div className="space-y-3">
                    {analysis.actionItems.map((item, idx) => (
                      <motion.div key={idx}
                        initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                        className="p-4 bg-white border border-[--c-border] rounded-2xl shadow-sm hover:border-orange-200 transition-all relative group"
                      >
                        <button
                          onClick={() => {
                            const next = [...analysis.actionItems];
                            next.splice(idx, 1);
                            setMeeting(m => ({ ...m, analysis: { ...analysis, actionItems: next } }));
                          }}
                          className="absolute top-3 right-3 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                          style={{ color: '#CBD5E1' }}
                        >
                          <X className="w-3.5 h-3.5 hover:text-red-400" />
                        </button>
                        <div className="flex gap-3">
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 text-white"
                            style={{ background: 'var(--c-orange)' }}>{idx + 1}</span>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-[--c-ink] leading-snug pr-4">{item.what}</p>
                            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-muted)' }}>
                              <User className="w-3 h-3" />
                              {meeting.speakerMap[item.who] || item.who}
                              {item.when && <span className="ml-2">· {item.when}</span>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Participants */}
                <section className="space-y-4">
                  <h4 className="text-label">참석자</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(meeting.speakerMap).map(([id, name]) => (
                      <div key={id} className="p-3 bg-white border border-[--c-border] rounded-xl text-center hover:border-blue-200 transition-all">
                        <p className="text-label mb-0.5" style={{ color: '#CBD5E1' }}>{id}</p>
                        <p className="text-sm font-bold text-[--c-ink]">{name}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          ) : (
            <motion.div key="trans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-gray-50 flex flex-col">
              <TranscriptEditor
                lines={analysis.refinedTranscript}
                onUpdate={onUpdateRefinedTranscript}
                onAddToGlossary={onAddToGlossary}
                speakerMap={meeting.speakerMap}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
