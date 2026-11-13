import React, { useState, useEffect } from 'react';
import { folderApi, aiApi } from '../services/api';
import CitationBadge from '../components/CitationBadge';
import SourceViewerModal from '../components/SourceViewerModal';
import { 
  FileText, Folder, Sparkles, BookOpen, Layers, CheckCircle2, 
  HelpCircle, Loader2, ArrowRight, BookMarked
} from 'lucide-react';

export default function SummarizerPage() {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [mode, setMode] = useState('folder'); // 'folder' or 'document'
  const [focusTopic, setFocusTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);
  const [activeCitation, setActiveCitation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (selectedFolderId) {
      loadFolderDocuments(selectedFolderId);
    }
  }, [selectedFolderId]);

  const loadFolders = async () => {
    try {
      const res = await folderApi.list();
      setFolders(res.data);
      if (res.data.length > 0) {
        setSelectedFolderId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFolderDocuments = async (folderId) => {
    try {
      const res = await folderApi.get(folderId);
      const docs = res.data.documents || [];
      setDocuments(docs);
      if (docs.length > 0) {
        setSelectedDocId(docs[0].id.toString());
      } else {
        setSelectedDocId('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateSummary = async () => {
    setError('');
    setLoading(true);
    setSummaryResult(null);

    try {
      let res;
      if (mode === 'folder') {
        res = await aiApi.summarizeFolder({
          folder_id: parseInt(selectedFolderId),
          focus_topic: focusTopic.trim() || null
        });
      } else {
        res = await aiApi.summarizeDoc({
          document_id: parseInt(selectedDocId),
          focus_topic: focusTopic.trim() || null
        });
      }
      setSummaryResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate summary. Ensure documents are indexed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-purple-400" />
          <span>Hierarchical Document & Folder Summarizer</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Map-reduce extraction compiles executive summaries, core topics, and domain terminology with verified citations.
        </p>
      </div>

      {/* Control Panel */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setMode('folder')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              mode === 'folder'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Summarize Entire Folder</span>
          </button>
          <button
            onClick={() => setMode('document')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              mode === 'document'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Summarize Single Document</span>
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-medium">Select Folder</label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-navy-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            >
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.document_count} files)</option>
              ))}
            </select>
          </div>

          {mode === 'document' && (
            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-medium">Select Document</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-navy-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id}>{d.filename}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-medium">Focus Topic (Optional)</label>
            <input
              type="text"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              placeholder="e.g. Search Algorithms, ACID properties"
              className="w-full px-3.5 py-2.5 bg-navy-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <button
          onClick={handleGenerateSummary}
          disabled={loading || !selectedFolderId}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing Hierarchical Summary...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Comprehensive Summary</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Summary Output */}
      {summaryResult && (
        <div className="glass-card rounded-2xl p-8 border border-white/10 space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white">{summaryResult.title}</h2>
            <div className="text-xs text-purple-400 font-semibold mt-1">
              Extracted & Grounded via RAG Pipeline
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <BookMarked className="w-4 h-4" />
              <span>Executive Summary</span>
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed bg-navy-950/60 p-5 rounded-2xl border border-white/5">
              {summaryResult.executive_summary}
            </p>
          </div>

          {/* Key Points */}
          {summaryResult.key_points && summaryResult.key_points.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Key Highlights & Core Points</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {summaryResult.key_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 bg-navy-900/60 p-3 rounded-xl border border-white/5">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Core Topics Chips */}
          {summaryResult.topics && summaryResult.topics.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Extracted Domain Topics</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {summaryResult.topics.map((t, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800 text-xs font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Terminology Dictionary */}
          {summaryResult.terminology && Object.keys(summaryResult.terminology).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Key Terminology & Definitions</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(summaryResult.terminology).map(([term, def], i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-navy-950 border border-white/5 space-y-1">
                    <div className="font-bold text-xs text-white">{term}</div>
                    <div className="text-[11px] text-slate-400 leading-normal">{def}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Citations */}
          {summaryResult.sources && summaryResult.sources.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Grounded Context Sources:
              </div>
              <div className="flex flex-wrap gap-2">
                {summaryResult.sources.map((c, i) => (
                  <CitationBadge key={i} citation={c} onClick={setActiveCitation} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Source Viewer Modal */}
      <SourceViewerModal
        isOpen={!!activeCitation}
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
}
