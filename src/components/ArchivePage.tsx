import React, { useState } from 'react';
import { Meeting } from '../types';
import { Search, Trash2, FileText, Calendar, Tag, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  meetings: Meeting[];
  onLoad: (m: Meeting) => void;
  onDelete: (id: string) => void;
}

export default function ArchivePage({ meetings, onLoad, onDelete }: Props) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');

  const allTypes = Array.from(new Set(meetings.map(m => m.type).filter(Boolean)));
  const allKeywords = Array.from(new Set(meetings.flatMap(m => m.keywords).filter(Boolean)));

  const filtered = meetings.filter(m => {
    const q = query.toLowerCase();
    const matchQuery = !q || m.title.toLowerCase().includes(q) || m.originalTranscript.toLowerCase().includes(q);
    const matchType = !filterType || m.type === filterType;
    const matchKw = !filterKeyword || m.keywords.includes(filterKeyword);
    return matchQuery && matchType && matchKw;
  });

  return (
    <div className="max-w-[960px] mx-auto py-10 px-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[--c-ink] tracking-tight">회의록 아카이브</h2>
        <p className="text-body mt-1">저장된 회의록을 검색하고 불러오세요.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[--c-border] rounded-xl flex-1 min-w-[200px]">
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--c-muted)' }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="제목 또는 내용 검색..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-300" />
        </div>

        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-4 py-2 bg-white border border-[--c-border] rounded-xl text-sm outline-none cursor-pointer"
          style={{ color: filterType ? 'var(--c-ink)' : 'var(--c-muted)' }}>
          <option value="">회의 종류 전체</option>
          {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={filterKeyword} onChange={e => setFilterKeyword(e.target.value)}
          className="px-4 py-2 bg-white border border-[--c-border] rounded-xl text-sm outline-none cursor-pointer"
          style={{ color: filterKeyword ? 'var(--c-ink)' : 'var(--c-muted)' }}>
          <option value="">키워드 전체</option>
          {allKeywords.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {/* Count */}
      <p className="text-caption">{filtered.length}개의 회의록</p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 space-y-3">
          <FileText className="w-12 h-12 mx-auto" style={{ color: '#E2E8F0' }} />
          <p className="text-body font-semibold text-[--c-muted]">저장된 회의록이 없습니다.</p>
          <p className="text-caption">분석 완료 후 저장 버튼을 눌러 아카이브에 추가하세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m, idx) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
              className="bg-white border border-[--c-border] rounded-2xl p-5 flex items-center gap-5 hover:border-blue-200 transition-all shadow-sm group cursor-pointer"
              onClick={() => onLoad(m)}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--c-blue-soft)' }}>
                <FileText className="w-5 h-5" style={{ color: 'var(--c-blue)' }} />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-base font-black text-[--c-ink] truncate">
                  {m.title || '(제목 없음)'}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-caption">
                    <Calendar className="w-3 h-3" />{m.date}
                  </span>
                  {m.type && <span className="chip chip-blue" style={{ fontSize: '11px', padding: '2px 8px' }}>{m.type}</span>}
                  {m.keywords.slice(0, 3).map(kw => (
                    <span key={kw} className="chip chip-yellow" style={{ fontSize: '11px', padding: '2px 8px' }}>#{kw}</span>
                  ))}
                  {m.keywords.length > 3 && <span className="text-caption">+{m.keywords.length - 3}</span>}
                </div>
                {m.analysis && (
                  <p className="text-caption">
                    토픽 {m.analysis.selectedTopics.length}개 · 액션 {m.analysis.actionItems.length}개
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); if (window.confirm('이 회의록을 삭제하시겠습니까?')) onDelete(m.id); }}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                  style={{ color: '#CBD5E1' }}
                >
                  <Trash2 className="w-4 h-4 hover:text-red-400" />
                </button>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" style={{ color: 'var(--c-blue)' }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
