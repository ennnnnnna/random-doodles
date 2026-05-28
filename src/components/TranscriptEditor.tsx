import React, { useState, useRef, useEffect } from 'react';
import { RefinedTranscriptLine } from '../types';
import { Clock, Plus, BookOpen, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TranscriptEditorProps {
  lines: RefinedTranscriptLine[];
  onUpdate: (lines: RefinedTranscriptLine[]) => void;
  onAddToGlossary: (term: string) => void;
  speakerMap: Record<string, string>;
}

export default function TranscriptEditor({
  lines,
  onUpdate,
  onAddToGlossary,
  speakerMap
}: TranscriptEditorProps) {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleLineChange = (id: string, newText: string) => {
    const newLines = lines.map(line => line.id === id ? { ...line, text: newText } : line);
    onUpdate(newLines);
  };

  const handleSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.toString().trim() === '') {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelection({
      text: sel.toString().trim(),
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 10
    });
  };

  const addTermToGlossary = () => {
    if (selection) {
      onAddToGlossary(selection.text);
      setSelection(null);
    }
  };

  // Group consecutive lines by speaker
  const groupedLines = lines.reduce((acc: RefinedTranscriptLine[][], line, idx) => {
    if (idx === 0) return [[line]];
    const lastGroup = acc[acc.length - 1];
    if (lastGroup[0].speakerId === line.speakerId) {
      lastGroup.push(line);
    } else {
      acc.push([line]);
    }
    return acc;
  }, []);

  return (
    <div className="relative h-full flex flex-col" ref={editorRef} onMouseUp={handleSelection}>
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col flex-1">
        <div className="p-6 bg-slate-900 border-b border-slate-700 shrink-0 flex items-center justify-between">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <Clock className="w-4 h-4" />
            Time-Refined Transcript Editor
          </span>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">
            * Click text block to edit / Drag to add terms to glossary
          </div>
        </div>
        
        <div className="p-10 space-y-12 overflow-y-auto flex-1 custom-scrollbar bg-white">
          {groupedLines.map((group, gIdx) => (
            <div key={gIdx} className="flex gap-8 group">
              <div className="flex flex-col items-center pt-2 w-32 shrink-0">
                <div className="text-[11px] font-black text-slate-900 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl w-full text-center uppercase tracking-widest shadow-sm truncate" title={speakerMap[group[0].speakerId] || group[0].speakerName}>
                  {speakerMap[group[0].speakerId] || group[0].speakerName}
                </div>
                <div className="flex-1 w-0.5 bg-slate-100/50 mt-4 group-last:hidden rounded-full" />
              </div>
              
              <div className="flex-1 space-y-4">
                {group.map((line) => (
                  <textarea
                    key={line.id}
                    value={line.text}
                    onChange={(e) => handleLineChange(line.id, e.target.value)}
                    rows={Math.max(1, Math.ceil(line.text.length / 80))}
                    className="w-full text-base text-slate-600 leading-relaxed bg-transparent border-none focus:ring-0 focus:outline-none resize-none p-0 selection:bg-indigo-100 placeholder:italic font-medium hover:text-slate-900 transition-colors"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed z-50 px-3 py-2 bg-slate-900 border border-slate-700 rounded shadow-2xl flex items-center gap-3 pointer-events-auto"
            style={{ 
              left: selection.x, 
              top: selection.y, 
              transform: 'translate(-50%, -100%)' 
            }}
          >
            <span className="text-[10px] font-bold text-indigo-400 border-r border-slate-700 pr-3 max-w-[120px] truncate uppercase tracking-widest">
              Selected
            </span>
            <button
              onClick={addTermToGlossary}
              className="flex items-center gap-2 text-[10px] font-bold text-white hover:text-indigo-400 transition-colors uppercase tracking-widest"
            >
              <BookOpen className="w-3 h-3" />
              용어 사전에 추가
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-4 shrink-0">
        <div className="p-2 bg-slate-100 rounded text-slate-400">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-0.5">Tip: Interactive Glossary</h4>
          <p className="text-[11px] text-slate-400 font-medium">
            정제된 텍스트 중 수정이 필요한 사내 용어나 약어를 드래그하여 바로 사전에 등록할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
