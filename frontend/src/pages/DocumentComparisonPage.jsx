import React, { useState, useEffect } from 'react';
import { folderApi, aiApi } from '../services/api';
import CitationBadge from '../components/CitationBadge';
import SourceViewerModal from '../components/SourceViewerModal';
import { 
  GitCompare, Layers, Sparkles, CheckCircle2, AlertCircle, 
  Loader2, ArrowRight, FileText, CheckSquare, Square
} from 'lucide-react';

export default function DocumentComparisonPage() {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [query, setQuery] = useState('Compare key methodologies, concepts, findings, and trade-offs.');
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [activeCitation, setActiveCitation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (selectedFolderId) {
      loadDocuments(selectedFolderId);
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

  const loadDocuments = async (folderId) => {
    try {
      const res = await folderApi.get(folderId);
      const docs = res.data.documents || [];
      setDocuments(docs);
      if (docs.length >= 2) {
        setSelectedDocIds([docs[0].id, docs[1].id]);
      } else if (docs.length === 1) {
        setSelectedDocIds([docs[0].id]);
      } else {
        setSelectedDocIds([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDocument = (id) => {
    if (selectedDocIds.includes(id)) {
      setSelectedDocIds(prev => prev.filter(d => d !== id));
    } else {
      if (selectedDocIds.length >= 5) {
        alert('You can select a maximum of 5 documents for comparison.');
        return;
      }
      setSelectedDocIds(prev => [...prev, id]);
    }
  };

  const handleCompare = async () => {
    setError('');
    if (selectedDocIds.length < 2) {
      setError('Please select at least 2 documents to compare.');
      return;
    }

    setLoading(true);
    setComparisonResult(null);

    try {
      const res = await aiApi.compareDocs({
        document_ids: selectedDocIds,
        query: query.trim() || undefined
      });
      setComparisonResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Comparison failed. Verify document contents.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <GitCompare className="w-6 h-6 text-purple-400" />
          <span>Cross-Document Comparative Intelligence</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Perform multi-document contrastive retrieval to uncover overlapping concepts, distinct conclusions, and trade-offs.
        </p>
      </div>

      {/* Document Picker Panel */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-medium">Comparative Focus Prompt</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Compare search algorithms vs relational model"
              className="w-full px-3.5 py-2.5 bg-navy-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Document Selection Grid */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-purple-300">
            Select 2 to 5 Documents to Compare ({selectedDocIds.length} Selected):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {documents.map(d => {
              const isSelected = selectedDocIds.includes(d.id);
              return (
                <div
                  key={d.id}
                  onClick={() => toggleDocument(d.id)}
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition ${
                    isSelected
                      ? 'bg-purple-600/25 border-purple-500 text-white font-medium shadow-sm'
                      : 'bg-navy-950/60 border-white/5 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  )}
                  <div className="truncate">
                    <div className="truncate font-semibold">{d.filename}</div>
                    <div className="text-[10px] text-slate-400 uppercase">{d.file_type} • {d.chunk_count} chunks</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || selectedDocIds.length < 2}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing & Contrasting Chunks...</span>
            </>
          ) : (
            <>
              <GitCompare className="w-4 h-4" />
              <span>Compare Selected Documents</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="glass-card rounded-2xl p-8 border border-white/10 space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white">Comparative Synthesis Report</h2>
            <p className="text-xs text-purple-400 mt-1 font-mono">
              Focus: "{comparisonResult.query}"
            </p>
          </div>

          {/* Common Aspects */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Shared Concepts & Commonalities</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              {comparisonResult.common_aspects.map((ca, i) => (
                <li key={i} className="flex items-start gap-2 bg-navy-950/70 p-3.5 rounded-xl border border-white/5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{ca}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Distinct Aspects Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Distinct Document Characteristics & Divergences</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(comparisonResult.distinct_aspects).map(([docName, points], i) => (
                <div key={i} className="p-5 rounded-2xl bg-navy-950/80 border border-purple-900/40 space-y-2">
                  <h4 className="font-bold text-xs text-white border-b border-white/5 pb-2 truncate">
                    {docName}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-1.5">
                        <span className="text-purple-400">-</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Synthesis Summary
            </h3>
            <div className="p-5 rounded-2xl bg-navy-900/60 border border-white/5 text-xs sm:text-sm text-slate-200 leading-relaxed">
              {comparisonResult.comparison_summary}
            </div>
          </div>

          {/* Conclusion */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Comparative Conclusion
            </h3>
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800 text-xs sm:text-sm text-cyan-100 font-medium">
              {comparisonResult.conclusion}
            </div>
          </div>

          {/* Citations Strip */}
          {comparisonResult.sources && comparisonResult.sources.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Grounding Document Sources:
              </div>
              <div className="flex flex-wrap gap-2">
                {comparisonResult.sources.map((c, i) => (
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
