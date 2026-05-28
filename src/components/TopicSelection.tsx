import React from 'react';
import { LayoutGrid, CheckCircle2, Sparkles, RotateCw, X, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TopicSelectionProps {
  recommendedTopics: string[];
  selectedTopics: string[];
  onToggleTopic: (topic: string) => void;
  onRefreshTopics: () => void;
  onExcludeTopic: (topic: string) => void;
  onStartFinalAnalysis: () => void;
  isAnalyzing: boolean;
}

export default function TopicSelection({
  recommendedTopics,
  selectedTopics,
  onToggleTopic,
  onRefreshTopics,
  onExcludeTopic,
  onStartFinalAnalysis,
  isAnalyzing
}: TopicSelectionProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (!isAnalyzing) {
      setIsRefreshing(false);
    }
  }, [isAnalyzing]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshTopics();
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-8 py-16 px-6">
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            AI 분석 완료
          </div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">2단계: 핵심 주제 선택</h2>
          <p className="text-sm text-slate-400 font-medium tracking-wide">리포트에 포함할 핵심 논의 주제를 선택해주세요.</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
            {recommendedTopics.map((topic, index) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <button
                  disabled={isAnalyzing}
                  onClick={() => onToggleTopic(topic)}
                  className={`
                    w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left
                    ${selectedTopics.includes(topic)
                      ? 'border-indigo-600 bg-white shadow-md'
                      : 'border-slate-100 bg-white hover:border-slate-200'}
                    ${isAnalyzing ? 'cursor-not-allowed opacity-80' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectedTopics.includes(topic) 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'border-slate-200'
                    } ${isAnalyzing ? 'opacity-50' : ''}`}>
                      {selectedTopics.includes(topic) && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                    <span className={`font-bold text-sm ${
                      selectedTopics.includes(topic) ? 'text-slate-800' : 'text-slate-500'
                    }`}>
                      {topic}
                    </span>
                  </div>
                  {selectedTopics.includes(topic) && (
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg mr-8">Selected</span>
                  )}
                </button>
                
                {!isAnalyzing && (
                  <button
                    disabled={isAnalyzing}
                    onClick={(e) => {
                      e.stopPropagation();
                      onExcludeTopic(topic);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                    title="이 주제는 부적절함 (다음 제안에서 제외)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
        </div>

        <div className="flex flex-col items-center gap-6 pt-8">
          <button
            onClick={handleRefresh}
            disabled={isAnalyzing}
            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${(isAnalyzing && isRefreshing) ? 'animate-spin' : ''}`} />
            다른 주제 추천받기 (새로고침)
          </button>

          <button
            onClick={onStartFinalAnalysis}
            disabled={isAnalyzing || selectedTopics.length === 0}
            className={`
              w-full max-w-sm py-4 rounded-lg font-bold text-sm tracking-widest uppercase transition-all shadow-lg
              ${isAnalyzing || selectedTopics.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'}
            `}
          >
            {(isAnalyzing && !isRefreshing) ? '분석 중...' : '최종 맞춤 요약 및 정제 시작'}
          </button>
        </div>
      </section>
    </div>
  );
}
