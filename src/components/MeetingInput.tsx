import React, { useState } from 'react';
import { Meeting } from '../types';
import { User, ChevronDown, Play, Settings2, Sparkles, CheckSquare, RotateCw, Calendar, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MeetingInputProps {
  meeting: Meeting;
  setMeeting: (meeting: Meeting) => void;
  onStartAnalysis: (options?: { stayInPhase1?: boolean }) => void;
  onNextPhase: () => void;
  isAnalyzing: boolean;
  detectedSpeakers: string[];
}

export default function MeetingInput({
  meeting,
  setMeeting,
  onStartAnalysis,
  onNextPhase,
  isAnalyzing,
  detectedSpeakers
}: MeetingInputProps) {
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  const handleSpeakerChange = (id: string, name: string) => {
    setMeeting({
      ...meeting,
      speakerMap: {
        ...meeting.speakerMap,
        [id]: name
      }
    });
  };

  const handleAddKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    if (!meeting.keywords.includes(trimmed)) {
      setMeeting({
        ...meeting,
        keywords: [...meeting.keywords, trimmed]
      });
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setMeeting({
      ...meeting,
      keywords: meeting.keywords.filter(item => item !== kw)
    });
  };

  const AI_SUGGESTIONS = ['인사제도', '복지개편', '기업문화', '조직문화', '타운홀'];

  const inputClasses = "w-full p-3.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-slate-50/20 transition-all placeholder:text-slate-300 font-medium leading-relaxed shadow-sm";

  return (
    <div className="max-w-[1100px] mx-auto space-y-8 py-8 px-6">
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Settings2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">1단계: 회의 정보 입력</h2>
              <p className="text-xs text-slate-400 font-medium">분석을 위한 기본 정보와 녹취록을 입력해주세요.</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Transcript Column */}
          <div className="md:col-span-12 lg:col-span-7 h-full">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">회의 녹취록 원문</label>
                <span className="text-[10px] text-slate-400 font-medium italic">ClovaNote 형식 지원</span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <textarea
                  value={meeting.originalTranscript}
                  onChange={(e) => setMeeting({ ...meeting, originalTranscript: e.target.value })}
                  placeholder="[참석자 1] [00:00:15] 안녕하세요, 오늘 회의 시작하겠습니다.&#10;[홍길동] [00:00:20] 예, 인사팀장 홍길동입니다..."
                  className="flex-1 w-full min-h-[550px] p-5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none resize-none bg-slate-50/20 transition-all placeholder:text-slate-300 font-medium leading-relaxed shadow-sm md:min-h-[580px]"
                />
              </div>
            </div>
          </div>

          {/* Settings Column */}
          <div className="md:col-span-12 lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 ml-1">
                    <Type className="w-3 h-3 text-indigo-500" />
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">회의 제목</label>
                  </div>
                  <input
                    type="text"
                    value={meeting.title}
                    onChange={(e) => setMeeting({ ...meeting, title: e.target.value })}
                    placeholder="예: 2024년 하반기 인사 제도 개편 안내"
                    className={inputClasses}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 ml-1">
                      <Calendar className="w-3 h-3 text-indigo-500" />
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">회의 일자</label>
                    </div>
                    <input
                      type="date"
                      value={meeting.date.split('.').join('-')}
                      onChange={(e) => {
                        const d = e.target.value;
                        if (d) {
                          setMeeting({ ...meeting, date: d.split('-').join('.') });
                        }
                      }}
                      className={inputClasses}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 ml-1">
                      <Settings2 className="w-3 h-3 text-indigo-500" />
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">회의 종류</label>
                    </div>
                    <input
                      type="text"
                      value={meeting.type}
                      onChange={(e) => setMeeting({ ...meeting, type: e.target.value })}
                      placeholder="예: 정기 간담회"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 ml-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">키워드</label>
                  </div>
                  
                  {/* Current Active Keywords */}
                  <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 border border-slate-200 rounded-xl bg-slate-50/10 mb-2">
                    {meeting.keywords.filter(Boolean).length === 0 ? (
                      <span className="text-xs text-slate-300 p-1 font-medium italic">지정된 키워드가 없습니다.</span>
                    ) : (
                      meeting.keywords.filter(Boolean).map((kw) => (
                        <span key={kw} className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 shadow-sm leading-none">
                          {kw}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(kw)}
                            className="w-3.5 h-3.5 rounded-full hover:bg-indigo-100 flex items-center justify-center text-indigo-400 hover:text-indigo-600 transition-colors"
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Manual Keyword Input Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKeyword(newKeyword);
                          setNewKeyword('');
                        }
                      }}
                      placeholder="키워드 직접 추가 후 Enter"
                      className={`${inputClasses} flex-1 !p-2 text-xs`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleAddKeyword(newKeyword);
                        setNewKeyword('');
                      }}
                      className="px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold whitespace-nowrap hover:bg-indigo-700 transition-all active:scale-[0.97]"
                    >
                      추가
                    </button>
                  </div>

                  {/* AI Suggested Keywords */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">AI 추천 키워드 제안</span>
                    <div className="flex flex-wrap gap-1.5">
                      {AI_SUGGESTIONS.map((suggestion) => {
                        const isAdded = meeting.keywords.includes(suggestion);
                        return (
                          <button
                            key={suggestion}
                            type="button"
                            disabled={isAdded}
                            onClick={() => handleAddKeyword(suggestion)}
                            className={`text-[10px] font-bold px-2 py-1 border rounded-lg transition-all ${
                              isAdded 
                              ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
                              : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 shadow-sm active:scale-[0.95]'
                            }`}
                          >
                            + {suggestion}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="pt-6 border-t border-slate-100 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">사내 전문 용어 (오타 교정용)</label>
                  <textarea
                    value={meeting.glossary}
                    onChange={(e) => setMeeting({ ...meeting, glossary: e.target.value })}
                    placeholder="예: PA(People Advisor), 육성팀, 시니어데스크"
                    className={`${inputClasses} h-24 resize-none`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">사전 질문 리스트 (매핑용)</label>
                  <textarea
                    value={meeting.prefixedQuestions}
                    onChange={(e) => setMeeting({ ...meeting, prefixedQuestions: e.target.value })}
                    placeholder="사전에 취합된 질문들을 입력하면 답변 내용을 자동으로 찾아줍니다."
                    className={`${inputClasses} h-24 resize-none`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {detectedSpeakers.length === 0 ? (
                <button
                  onClick={() => onStartAnalysis({ stayInPhase1: true })}
                  disabled={isAnalyzing || !meeting.originalTranscript}
                  className={`
                    w-full py-5 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-2
                    ${isAnalyzing || !meeting.originalTranscript 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'}
                  `}
                >
                  <Sparkles className="w-4 h-4" />
                  {isAnalyzing ? '분석 중...' : '화자 분석 및 주제 추출 시작'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-[10px] uppercase tracking-widest mb-2">
                      <CheckSquare className="w-3.5 h-3.5" />
                      화자 분석 완료
                    </div>
                    <p className="text-[11px] text-indigo-600/70 font-medium leading-relaxed">
                      {detectedSpeakers.length}명의 참석자가 식별되었습니다. 아래 버튼을 눌러 각 참석자의 실제 성함을 매핑해주세요.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => setShowSpeakerModal(true)}
                      className="w-full py-4 border-2 border-indigo-100 bg-white text-indigo-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-indigo-600 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      참석자 이름 매핑 ({detectedSpeakers.length})
                    </button>

                    <button
                      onClick={onNextPhase}
                      disabled={isAnalyzing}
                      className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-widest uppercase hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2"
                    >
                      2단계: 핵심 주제 선택하기
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                  </div>

                  <button
                    onClick={() => onStartAnalysis({ stayInPhase1: true })}
                    disabled={isAnalyzing}
                    className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-3 h-3" />
                    화자/주제 분석 다시하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Speaker Modal */}
      <AnimatePresence>
        {showSpeakerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">참석자 이름 매핑</h3>
                    <p className="text-sm text-slate-400 font-medium">발견된 {detectedSpeakers.length}명의 참석자에 대한 정보를 입력해주세요.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSpeakerModal(false)}
                  className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 shadow-sm"
                >
                  <ChevronDown className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto bg-white flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {detectedSpeakers.map((speakerId) => (
                    <div key={speakerId} className="p-5 bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm space-y-3 group hover:border-indigo-200 transition-all">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">{speakerId}</label>
                        <span className="text-[10px] text-slate-300 font-bold">IDENTITY</span>
                      </div>
                      <input
                        type="text"
                        value={meeting.speakerMap[speakerId] ?? speakerId}
                        onChange={(e) => handleSpeakerChange(speakerId, e.target.value)}
                        placeholder="이름 또는 직책"
                        className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all bg-white font-bold text-slate-700"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                  * 비워둘 경우 '참석자 ID'로 자동 표시됩니다.
                </div>
                <button
                  onClick={() => setShowSpeakerModal(false)}
                  className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-100 transition-all active:scale-[0.98]"
                >
                  매핑 내용 저장하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
