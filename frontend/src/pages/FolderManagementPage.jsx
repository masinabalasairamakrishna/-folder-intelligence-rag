import React, { useState, useEffect } from 'react';
import { folderApi, docApi } from '../services/api';
import { 
  FolderKanban, FileText, Search, Trash2, RefreshCw, Eye, 
  Filter, Folder, AlertCircle, CheckCircle2, ChevronRight, Hash, Layers
} from 'lucide-react';

export default function FolderManagementPage() {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const res = await folderApi.list();
      setFolders(res.data);
      if (res.data.length > 0) {
        selectFolder(res.data[0]);
      } else {
        setSelectedFolder(null);
        setDocuments([]);
      }
    } catch (err) {
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const selectFolder = async (folder) => {
    setSelectedFolder(folder);
    setRenameValue(folder.name);
    setIsEditingName(false);
    setSelectedDocDetails(null);
    try {
      const res = await folderApi.get(folder.id);
      setDocuments(res.data.documents || []);
    } catch (err) {
      setError('Failed to load folder documents');
    }
  };

  const handleRenameFolder = async () => {
    if (!renameValue.trim() || !selectedFolder) return;
    try {
      const res = await folderApi.update(selectedFolder.id, { name: renameValue.trim() });
      setSelectedFolder(res.data);
      setIsEditingName(false);
      setFolders(prev => prev.map(f => f.id === res.data.id ? res.data : f));
    } catch (err) {
      setError('Failed to rename folder');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder, its files, and ChromaDB vector embeddings?')) return;
    try {
      await folderApi.delete(folderId);
      loadFolders();
    } catch (err) {
      setError('Failed to delete folder');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this document and its embeddings?')) return;
    try {
      await docApi.delete(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (selectedDocDetails?.id === docId) setSelectedDocDetails(null);
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  const handleReindexDocument = async (docId) => {
    setActionLoading(true);
    try {
      const res = await docApi.reindex(docId);
      alert(res.data.message);
      if (selectedFolder) selectFolder(selectedFolder);
    } catch (err) {
      setError('Failed to reindex document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDocDetails = async (docId) => {
    try {
      const res = await docApi.get(docId);
      setSelectedDocDetails(res.data);
    } catch (err) {
      setError('Failed to load document chunk details');
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.relative_path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || doc.file_type.toUpperCase() === selectedType;
    return matchesSearch && matchesType;
  });

  const availableTypes = ['ALL', ...new Set(documents.map(d => d.file_type.toUpperCase()))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-purple-400" />
            <span>Folder & Document Repository Manager</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse directory structures, filter files, inspect chunk distributions, and manage vector indices.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folders List Sidebar */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Folders</span>
            <span className="text-[11px] text-slate-400">{folders.length} Total</span>
          </div>

          <div className="space-y-1.5 max-h-[650px] overflow-y-auto">
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => selectFolder(f)}
                className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between text-xs ${
                  selectedFolder?.id === f.id
                    ? 'bg-purple-600/30 border border-purple-500/40 text-white font-semibold shadow-md shadow-purple-900/30'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Folder className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="truncate">{f.name}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-950 text-slate-400 border border-white/5">
                  {f.document_count}
                </span>
              </button>
            ))}

            {folders.length === 0 && !loading && (
              <div className="text-center py-6 text-xs text-slate-500">
                No folders found. Upload one to get started.
              </div>
            )}
          </div>
        </div>

        {/* Selected Folder Details & File Table */}
        <div className="lg:col-span-3 space-y-6">
          {selectedFolder ? (
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-6">
              {/* Folder Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="space-y-1 flex-1">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="px-3 py-1 bg-navy-900 border border-purple-500 rounded-lg text-sm text-white"
                      />
                      <button
                        onClick={handleRenameFolder}
                        className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="px-2 py-1 text-slate-400 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-white">{selectedFolder.name}</h2>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-xs text-purple-400 hover:underline"
                      >
                        Rename
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-slate-400">
                    Created: {new Date(selectedFolder.created_at).toLocaleString()} • {documents.length} files
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteFolder(selectedFolder.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800 text-xs font-semibold hover:bg-rose-900 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Folder</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by filename or relative path..."
                    className="w-full pl-9 pr-4 py-2 bg-navy-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {availableTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selectedType === type
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Documents Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-navy-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Filename & Path</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Size</th>
                      <th className="py-3 px-3">Chunks</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{doc.filename}</div>
                          <div className="text-[10px] font-mono text-slate-500 truncate max-w-xs">{doc.relative_path}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="uppercase px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800 text-[10px] font-bold">
                            {doc.file_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-3 px-3 text-purple-300 font-bold">
                          {doc.chunk_count}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            doc.indexing_status === 'INDEXED' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {doc.indexing_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => handleViewDocDetails(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                            title="Inspect chunks"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReindexDocument(doc.id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition"
                            title="Re-index document"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredDocs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500">
                          No matching documents found in this folder.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Document Chunks Inspector Modal/Drawer */}
              {selectedDocDetails && (
                <div className="p-5 rounded-2xl bg-navy-950/90 border border-purple-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm">
                      <Layers className="w-4 h-4" />
                      <span>Extracted Vector Chunks for: {selectedDocDetails.filename}</span>
                    </div>
                    <button
                      onClick={() => setSelectedDocDetails(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {selectedDocDetails.chunks.map(chunk => (
                      <div key={chunk.id} className="p-3 rounded-xl bg-navy-900 border border-white/5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-mono text-purple-300">Vector ID: {chunk.vector_id}</span>
                          <span>{chunk.page_number ? `Page ${chunk.page_number}` : 'Page N/A'} • Chunk #{chunk.chunk_index}</span>
                        </div>
                        <p className="font-mono text-slate-200 text-xs whitespace-pre-wrap">
                          {chunk.chunk_text || 'No preview stored'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <FolderKanban className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-white">No folder selected</div>
              <p className="text-xs">Select a folder on the left or upload documents to explore.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
