import React, { useState } from 'react';
import { Meeting } from '../types';
import { User, ChevronDown, Play, Settings2, Sparkles, CheckSquare, RotateCw, Calendar, Type, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MeetingInputProps {
  meeting: Meeting;
  setMeeting: (meeting: Meeting) => void;
  onStartAnalysis: (options?: { stayInPhase1?: boolean }) => void;
  onNextPhase: () => void;
  isAnalyzing: boolean;
  detectedSpeakers: string[];
  suggestedKeywords: string[];
}

export default function MeetingInput({
  meeting, setMeeting, onStartAnalysis, onNextPhase,
  isAnalyzing, detectedSpeakers, suggestedKeywords
}: MeetingInputProps) {
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  const handleSpeakerChange = (id: string, name: string) =>
    setMeeting({ ...meeting, speakerMap: { ...meeting.speakerMap, [id]: name } });

  const addKeyword = (kw: string) => {
    const t = kw.trim();
    if (!t || meeting.keywords.includes(t)) return;
    setMeeting({ ...meeting, keywords: [...meeting.keywords, t] });
  };

  const removeKeyword = (kw: string) =>
    setMeeting({ ...meeting, keywords: meeting.keywords.filter(k => k !== kw) });

  const inputCls = "w-full px-4 py-3 text-sm border border-[--c-border] rounded-xl focus:ring-2 focus:border-[--c-blue] outline-none bg-white transition-all placeholder:text-gray-300 font-medium leading-relaxed";

  const analysisReady = detectedSpeakers.length > 0;

  return (
    <div className="max-w-[1100px] mx-auto py-8 px-6 space-y-8">
      <div className="flex items-center gap-3 pb-4 border-b border-[--c-border]">
        <div className="p-2 rounded-lg" style={{ background: 'var(--c-blue-soft)' }}>
          <Settings2 className="w-5 h-5" style={{ color: 'var(--c-blue)' }} />
        </div>
        <div>
          <h2 className="text-xl font-black text-[--c-ink] tracking-tight">1단계: 회의 정보 입력</h2>
          <p className="text-sm text-[--c-muted]">분석을 위한 기본 정보와 녹취록을 입력해주세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Transcript */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[--c-border] rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-5 py-3 border-b border-[--c-border] bg-gray-50 flex items-center justify-between">
              <span className="text-label">회의 녹취록 원문</span>
              <span className="text-xs text-[--c-muted] italic">ClovaNote 형식 지원</span>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <textarea
                value={meeting.originalTranscript}
                onChange={(e) => setMeeting({ ...meeting, originalTranscript: e.target.value })}
                placeholder={"[참석자 1] [00:00:15] 안녕하세요, 오늘 회의 시작하겠습니다.\n[홍길동] [00:00:20] 예, 인사팀장 홍길동입니다..."}
                className="flex-1 w-full min-h-[520px] p-4 text-sm border border-[--c-border] rounded-xl focus:ring-2 focus:border-[--c-blue] outline-none resize-none bg-gray-50 placeholder:text-gray-300 font-medium leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-[--c-border] rounded-2xl shadow-sm p-6 space-y-6">
            {/* Title */}
            <Field label="회의 제목" icon={<Type className="w-3.5 h-3.5" style={{ color: 'var(--c-blue)' }} />}>
              <input type="text" value={meeting.title}
                onChange={(e) => setMeeting({ ...meeting, title: e.target.value })}
                placeholder="예: 2024년 하반기 인사 제도 개편 안내"
                className={inputCls} />
            </Field>

            {/* Date + Type */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="회의 일자" icon={<Calendar className="w-3.5 h-3.5" style={{ color: 'var(--c-blue)' }} />}>
                <input type="date"
                  value={meeting.date.split('.').join('-')}
                  onChange={(e) => { if (e.target.value) setMeeting({ ...meeting, date: e.target.value.split('-').join('.') }); }}
                  className={inputCls} />
              </Field>
              <Field label="회의 종류" icon={<Settings2 className="w-3.5 h-3.5" style={{ color: 'var(--c-blue)' }} />}>
                <input type="text" value={meeting.type}
                  onChange={(e) => setMeeting({ ...meeting, type: e.target.value })}
                  placeholder="예: 정기 간담회"
                  className={inputCls} />
              </Field>
            </div>

            {/* Keywords */}
            <Field label="키워드" icon={<Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--c-blue)' }} />}>
              {/* Active chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 border border-[--c-border] rounded-xl bg-gray-50 mb-2">
                {meeting.keywords.length === 0
                  ? <span className="text-sm text-gray-300 p-1 italic">
                      {analysisReady ? '아래에서 AI 추천 키워드를 선택하거나 직접 추가하세요.' : '녹취록 분석 후 AI가 키워드를 제안해드립니다.'}
                    </span>
                  : meeting.keywords.map(kw => (
                    <span key={kw} className="chip chip-yellow">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="ml-0.5 opacity-60 hover:opacity-100">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                }
              </div>

              {/* Manual input */}
              <div className="flex gap-2 mb-3">
                <input type="text" value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(newKeyword); setNewKeyword(''); } }}
                  placeholder="키워드 직접 추가 후 Enter"
                  className={`${inputCls} !py-2 text-sm flex-1`} />
                <button onClick={() => { addKeyword(newKeyword); setNewKeyword(''); }}
                  className="px-4 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: 'var(--c-blue)' }}>
                  추가
                </button>
              </div>

              {/* AI suggested chips (shown after analysis) */}
              <AnimatePresence>
                {analysisReady && suggestedKeywords.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <p className="text-label mb-2" style={{ color: 'var(--c-purple)' }}>AI 추천 키워드</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedKeywords.map(kw => {
                        const added = meeting.keywords.includes(kw);
                        return (
                          <button key={kw} disabled={added} onClick={() => addKeyword(kw)}
                            className={`chip ${added ? 'chip-slate opacity-50 cursor-not-allowed' : 'chip-purple'}`}>
                            {!added && <Plus className="w-3 h-3" />}
                            {kw}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Field>

            {/* Glossary + Questions */}
            <div className="pt-4 border-t border-[--c-border] space-y-5">
              <Field label="사내 전문 용어 (오타 교정용)">
                <textarea value={meeting.glossary}
                  onChange={(e) => setMeeting({ ...meeting, glossary: e.target.value })}
                  placeholder="예: PA(People Advisor), 육성팀, 시니어데스크"
                  className={`${inputCls} h-20 resize-none`} />
              </Field>
              <Field label="사전 질문 리스트 (매핑용)">
                <textarea value={meeting.prefixedQuestions}
                  onChange={(e) => setMeeting({ ...meeting, prefixedQuestions: e.target.value })}
                  placeholder="사전에 취합된 질문들을 입력하면 답변 내용을 자동으로 찾아줍니다."
                  className={`${inputCls} h-20 resize-none`} />
              </Field>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            {!analysisReady ? (
              <button
                onClick={() => onStartAnalysis({ stayInPhase1: true })}
                disabled={isAnalyzing || !meeting.originalTranscript}
                className="w-full py-4 rounded-2xl font-black text-sm tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-2 text-white"
                style={{
                  background: (isAnalyzing || !meeting.originalTranscript) ? '#E2E8F0' : 'var(--c-blue)',
                  color: (isAnalyzing || !meeting.originalTranscript) ? '#94A3B8' : '#fff',
                  cursor: (isAnalyzing || !meeting.originalTranscript) ? 'not-allowed' : 'pointer',
                }}
              >
                <Sparkles className="w-4 h-4" />
                {isAnalyzing ? '분석 중...' : '화자 분석 및 주제 추출 시작'}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl border" style={{ background: 'var(--c-blue-soft)', borderColor: '#C7D7FD' }}>
                  <div className="flex items-center gap-2 font-bold text-sm mb-1" style={{ color: 'var(--c-blue)' }}>
                    <CheckSquare className="w-4 h-4" />
                    화자 분석 완료
                  </div>
                  <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
                    {detectedSpeakers.length}명의 참석자가 식별되었습니다.
                  </p>
                </div>

                <button onClick={() => setShowSpeakerModal(true)}
                  className="w-full py-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2"
                  style={{ borderColor: 'var(--c-blue)', color: 'var(--c-blue)', background: '#fff' }}>
                  <User className="w-4 h-4" />
                  참석자 이름 매핑 ({detectedSpeakers.length})
                </button>

                <button onClick={onNextPhase} disabled={isAnalyzing}
                  className="w-full py-4 rounded-2xl font-black text-sm tracking-wide uppercase text-white transition-all shadow-xl flex items-center justify-center gap-2"
                  style={{ background: 'var(--c-ink)' }}>
                  2단계: 핵심 주제 선택하기
                  <Play className="w-4 h-4 fill-white" />
                </button>

                <button onClick={() => onStartAnalysis({ stayInPhase1: true })} disabled={isAnalyzing}
                  className="w-full py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{ color: 'var(--c-muted)' }}>
                  <RotateCw className="w-3.5 h-3.5" />
                  화자/주제 분석 다시하기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Speaker Modal */}
      <AnimatePresence>
        {showSpeakerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-[--c-border] flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ background: 'var(--c-blue)' }}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[--c-ink]">참석자 이름 매핑</h3>
                    <p className="text-sm text-[--c-muted]">{detectedSpeakers.length}명의 참석자 정보를 입력해주세요.</p>
                  </div>
                </div>
                <button onClick={() => setShowSpeakerModal(false)} className="p-2 rounded-xl hover:bg-white transition-all">
                  <X className="w-5 h-5 text-[--c-muted]" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detectedSpeakers.map((id) => (
                    <div key={id} className="p-4 bg-gray-50 border border-[--c-border] rounded-2xl space-y-2 hover:border-blue-200 transition-all">
                      <label className="text-label" style={{ color: 'var(--c-blue)' }}>{id}</label>
                      <input
                        type="text"
                        value={meeting.speakerMap[id] ?? id}
                        onChange={(e) => handleSpeakerChange(id, e.target.value)}
                        placeholder="이름 또는 직책"
                        className="w-full px-3 py-2 text-sm border border-[--c-border] rounded-xl focus:ring-2 focus:border-[--c-blue] outline-none bg-white font-semibold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-[--c-border] bg-gray-50 flex justify-between items-center">
                <p className="text-xs text-[--c-muted] italic">* 비워둘 경우 참석자 ID로 자동 표시됩니다.</p>
                <button onClick={() => setShowSpeakerModal(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
                  style={{ background: 'var(--c-blue)' }}>
                  저장하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-label">{label}</span>
      </div>
      {children}
    </div>
  );
}
