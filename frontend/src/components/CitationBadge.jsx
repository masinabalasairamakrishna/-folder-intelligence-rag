import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

export default function CitationBadge({ citation, onClick }) {
  if (!citation) return null;

  const fname = citation.filename || 'Document';
  const isSlide = fname.toLowerCase().endsWith('.pptx') || fname.toLowerCase().endsWith('.ppt');
  const pageLabel = citation.page_number != null
    ? (isSlide ? `Slide ${citation.page_number}` : `p.${citation.page_number}`)
    : null;

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(citation)}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-950/80 text-purple-200 border border-purple-500/40 hover:bg-purple-900 hover:border-purple-400 hover:text-white transition-all duration-150 group shadow-md shadow-purple-950/40 cursor-pointer"
      title={`Click to inspect verified context from ${fname}`}
    >
      <FileText className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-200" />
      <span className="truncate max-w-[130px]">{fname}</span>
      {pageLabel && (
        <span className="bg-purple-700/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
          {pageLabel}
        </span>
      )}
      <ExternalLink className="w-2.5 h-2.5 text-purple-400 opacity-70 group-hover:opacity-100" />
    </button>
  );
}

