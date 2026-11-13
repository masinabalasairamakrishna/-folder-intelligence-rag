import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

export default function CitationBadge({ citation, onClick }) {
  if (!citation) return null;

  return (
    <button
      onClick={() => onClick && onClick(citation)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-purple-950/60 text-purple-300 border border-purple-700/50 hover:bg-purple-900/80 hover:border-purple-500 transition-all duration-150 group shadow-sm shadow-purple-900/20"
      title="Click to inspect source text"
    >
      <FileText className="w-3 h-3 text-purple-400 group-hover:text-purple-200" />
      <span className="truncate max-w-[140px]">{citation.filename}</span>
      {citation.page_number && (
        <span className="bg-purple-800/80 text-purple-200 px-1.5 py-0.2 rounded text-[10px]">
          p.{citation.page_number}
        </span>
      )}
      <ExternalLink className="w-2.5 h-2.5 text-purple-400 opacity-60 group-hover:opacity-100" />
    </button>
  );
}
