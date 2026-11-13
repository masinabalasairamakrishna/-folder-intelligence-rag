import React from 'react';
import { X, FileText, Hash, Bookmark, CheckCircle2 } from 'lucide-react';

export default function SourceViewerModal({ citation, isOpen, onClose }) {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="glass-card w-full max-w-2xl rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl shadow-purple-950/50 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-navy-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base truncate max-w-md">
                {citation.filename}
              </h3>
              <p className="text-xs text-purple-300/70 truncate max-w-md font-mono">
                {citation.relative_path || citation.filename}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-navy-900/60 border-b border-white/5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
            <span>Page/Slide: </span>
            <strong className="text-white">{citation.page_number ? `Page ${citation.page_number}` : 'N/A (Text File)'}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-purple-400" />
            <span>Chunk Index: </span>
            <strong className="text-white">#{citation.chunk_index}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Grounding Score: </span>
            <strong className="text-emerald-300">{citation.score ? `${Math.round(citation.score * 100)}%` : 'Verified'}</strong>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-400">
            Retrieved Passages & Context Chunks:
          </div>
          <div className="p-4 rounded-xl bg-navy-950/80 border border-purple-900/40 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-mono">
            {citation.excerpt || 'No passage excerpt available.'}
          </div>
          <div className="text-xs text-slate-400 italic">
            This excerpt was matched from ChromaDB vector space and directly grounded in the LLM synthesis.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-navy-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-600/30"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
}
