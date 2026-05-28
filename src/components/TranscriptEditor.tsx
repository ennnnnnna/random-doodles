import React, { useState, useRef } from 'react';
import { RefinedTranscriptLine } from '../types';
import { Clock, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  lines: RefinedTranscriptLine[];
  onUpdate: (lines: RefinedTranscriptLine[]) => void;
  onAddToGlossary: (term: string) => void;
  speakerMap: Record<string, string>;
}

export default function TranscriptEditor({ lines, onUpdate, onAddToGlossary, speakerMap }: Props) {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const handleLineChange = (id: string, text: string) =>
    onUpdate(lines.map(l => l.id === id ? { ...l, text } : l));

  const handleSelection = () => {
    const sel = window.getSelection();
    if (!sel || !sel.toString().trim()) { setSelection(null); return; }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setSelection({ text: sel.toString().trim(), x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 10 });
  };

  // Group by speaker
  const groups = lines.reduce((acc: RefinedTranscriptLine[][], line, idx) => {
    if (idx === 0) return [[line]];
    const last = acc[acc.length - 1];
    if (last[0].speakerId === line.speakerId) { last.push(line); } else { acc.push([line]); }
    return acc;
  }, []);

  return (
    <div className="relative h-full flex flex-col px-6 pb-6" ref={ref} onMouseUp={handleSelection}>
      <div className="bg-white border border-[--c-border] rounded-2xl overflow-hidden shadow-sm flex flex-col flex-1">
        <div className="px-6 py-3 border-b border-[--c-border] flex items-center justify-between"
          style={{ background: 'var(--c-ink)' }}>
          <span className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--c-blue)' }}>
            <Clock className="w-4 h-4" />
            정제 원문 에디터
          </span>
          <span className="text-xs hidden sm:block" style={{ color: '#4B5563' }}>
            * 드래그하여 용어 사전에 추가 가능
          </span>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
          {groups.map((group, gi) => (
            <div key={gi} className="flex gap-6 group">
              <div className="flex flex-col items-center pt-1 w-28 shrink-0">
                <div className="px-3 py-1.5 rounded-xl text-xs font-black text-center w-full truncate"
                  style={{ background: 'var(--c-blue-soft)', color: 'var(--c-blue)' }}
                  title={speakerMap[group[0].speakerId] || group[0].speakerName}>
                  {speakerMap[group[0].speakerId] || group[0].speakerName}
                </div>
                <div className="flex-1 w-0.5 mt-3 group-last:hidden rounded-full" style={{ background: 'var(--c-border)' }} />
              </div>
              <div className="flex-1 space-y-3">
                {group.map(line => (
                  <textarea key={line.id}
                    value={line.text}
                    onChange={(e) => handleLineChange(line.id, e.target.value)}
                    rows={Math.max(1, Math.ceil(line.text.length / 80))}
                    className="w-full text-body-lg bg-transparent border-none focus:ring-0 focus:outline-none resize-none p-0 selection:bg-blue-100 hover:text-[--c-ink] transition-colors"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hint bar */}
      <div className="mt-3 p-3 bg-white border border-[--c-border] rounded-xl flex items-center gap-3">
        <BookOpen className="w-4 h-4 shrink-0" style={{ color: 'var(--c-blue)' }} />
        <p className="text-caption">
          정제된 텍스트 중 수정이 필요한 사내 용어를 드래그하여 용어 사전에 바로 등록할 수 있습니다.
        </p>
      </div>

      {/* Selection popup */}
      <AnimatePresence>
        {selection && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="fixed z-50 px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2"
            style={{ background: 'var(--c-ink)', left: selection.x, top: selection.y, transform: 'translate(-50%, -100%)' }}
          >
            <span className="text-xs font-semibold max-w-[120px] truncate" style={{ color: 'var(--c-blue)' }}>
              선택됨
            </span>
            <button
              onClick={() => { onAddToGlossary(selection.text); setSelection(null); }}
              className="flex items-center gap-1.5 text-xs font-bold text-white hover:opacity-80 transition-opacity"
            >
              <BookOpen className="w-3 h-3" />용어 사전에 추가
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
