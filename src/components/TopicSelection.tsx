import React from 'react';
import { Sparkles, RotateCw, X } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  recommendedTopics: string[];
  selectedTopics: string[];
  onToggleTopic: (t: string) => void;
  onRefreshTopics: () => void;
  onExcludeTopic: (t: string) => void;
  onStartFinalAnalysis: () => void;
  isAnalyzing: boolean;
}

export default function TopicSelection({
  recommendedTopics, selectedTopics, onToggleTopic,
  onRefreshTopics, onExcludeTopic, onStartFinalAnalysis, isAnalyzing
}: Props) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => { if (!isAnalyzing) setIsRefreshing(false); }, [isAnalyzing]);

  return (
    <div className="max-w-[720px] mx-auto py-14 px-6 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold chip chip-blue mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          AI 분석 완료
        </div>
        <h2 className="text-2xl font-black text-[--c-ink] tracking-tight">2단계: 핵심 주제 선택</h2>
        <p className="text-sm text-[--c-muted]">리포트에 포함할 핵심 논의 주제를 선택해주세요.</p>
      </div>

      <div className="space-y-2.5">
        {recommendedTopics.map((topic, idx) => {
          const selected = selectedTopics.includes(topic);
          return (
            <motion.div key={topic}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative"
            >
              <button
                disabled={isAnalyzing}
                onClick={() => onToggleTopic(topic)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left"
                style={{
                  borderColor: selected ? 'var(--c-blue)' : 'var(--c-border)',
                  background: selected ? 'var(--c-blue-soft)' : '#fff',
                }}
              >
                {/* Checkbox */}
                <span className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: selected ? 'var(--c-blue)' : '#fff',
                    borderColor: selected ? 'var(--c-blue)' : '#CBD5E1',
                  }}>
                  {selected && <span className="w-2 h-2 bg-white rounded-sm block" />}
                </span>

                <span className="text-sm font-semibold flex-1"
                  style={{ color: selected ? 'var(--c-ink)' : 'var(--c-muted)' }}>
                  {topic}
                </span>

                {selected && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg chip chip-blue">선택됨</span>
                )}
              </button>

              {!isAnalyzing && (
                <button
                  onClick={(e) => { e.stopPropagation(); onExcludeTopic(topic); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  style={{ color: '#CBD5E1' }}
                  title="이 주제 제외"
                >
                  <X className="w-4 h-4 hover:text-red-400" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-5 pt-4">
        <button
          onClick={() => { setIsRefreshing(true); onRefreshTopics(); }}
          disabled={isAnalyzing}
          className="flex items-center gap-2 text-sm font-semibold transition-colors"
          style={{ color: isAnalyzing ? '#CBD5E1' : 'var(--c-muted)' }}
        >
          <RotateCw className={`w-4 h-4 ${isAnalyzing && isRefreshing ? 'animate-spin' : ''}`} />
          다른 주제 추천받기
        </button>

        <button
          onClick={onStartFinalAnalysis}
          disabled={isAnalyzing || selectedTopics.length === 0}
          className="w-full max-w-sm py-4 rounded-2xl font-black text-sm tracking-wide uppercase text-white transition-all shadow-lg"
          style={{
            background: (isAnalyzing || selectedTopics.length === 0) ? '#E2E8F0' : 'var(--c-blue)',
            color: (isAnalyzing || selectedTopics.length === 0) ? '#94A3B8' : '#fff',
            cursor: (isAnalyzing || selectedTopics.length === 0) ? 'not-allowed' : 'pointer',
          }}
        >
          {isAnalyzing && !isRefreshing ? '분석 중...' : '최종 맞춤 요약 및 정제 시작'}
        </button>
      </div>
    </div>
  );
}
