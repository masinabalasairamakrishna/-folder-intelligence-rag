import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { folderApi, docApi } from '../services/api';
import { 
  UploadCloud, FolderPlus, FileText, CheckCircle2, AlertCircle, 
  Loader2, Folder, HardDrive, Sparkles, ArrowRight, Check
} from 'lucide-react';

export default function FolderUploadPage() {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [relativePaths, setRelativePaths] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadResults, setUploadResults] = useState([]);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const res = await folderApi.list();
      setFolders(res.data);
      if (res.data.length > 0) {
        setSelectedFolderId(res.data[0].id.toString());
      } else {
        // If user has zero folders, default newFolderName so the user never encounters a blank field
        setNewFolderName('');
      }
    } catch (err) {
      console.error('Failed to load folders', err);
    }
  };

  const handleFolderSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const paths = files.map(f => f.webkitRelativePath || f.name);
    setFilesToUpload(files);
    setRelativePaths(paths);
    setError('');

    // Auto-fill folder name from top-level uploaded directory
    if (files[0].webkitRelativePath) {
      const rootDir = files[0].webkitRelativePath.split('/')[0];
      if (rootDir) {
        setNewFolderName(rootDir);
        setSelectedFolderId(''); // Switch to creating this new folder
      }
    }
  };

  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setFilesToUpload(files);
    setRelativePaths(files.map(f => f.name));
    setError('');

    // Auto-suggest folder name if no existing folder is selected
    if (!selectedFolderId && !newFolderName) {
      const cleanBaseName = files[0].name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
      setNewFolderName(cleanBaseName || 'My_Documents');
    }
  };

  const handleCreateNewFolder = async (nameToUse) => {
    const folderName = (nameToUse || newFolderName).trim();
    if (!folderName) return null;
    try {
      const res = await folderApi.create({ name: folderName });
      setFolders(prev => [res.data, ...prev]);
      setSelectedFolderId(res.data.id.toString());
      setNewFolderName('');
      return res.data.id;
    } catch (err) {
      console.error('Failed to create folder', err);
      throw err;
    }
  };

  const handleUploadAndIndex = async () => {
    setError('');
    setStatusMessage('');
    if (!filesToUpload.length) {
      setError('Please select files or a folder to upload first.');
      return;
    }

    let targetFolderId = selectedFolderId;

    // If user explicitly typed a new folder name, create it
    if (newFolderName.trim()) {
      try {
        targetFolderId = await handleCreateNewFolder(newFolderName.trim());
      } catch (err) {
        setError('Failed to create folder: ' + (err.response?.data?.detail || err.message));
        return;
      }
    }

    // If still no folder is chosen (e.g. dropdown was on "-- Or Create New Below --" and input was empty),
    // automatically generate a sensible folder name from the first file name!
    if (!targetFolderId) {
      try {
        const autoName = filesToUpload[0]?.name 
          ? filesToUpload[0].name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
          : 'My_Uploaded_Documents';
        targetFolderId = await handleCreateNewFolder(autoName || 'My_Uploaded_Documents');
      } catch (err) {
        setError('Failed to initialize workspace folder. Please enter a folder name.');
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(15);
    setStatusMessage('Uploading documents to secure local vault...');

    try {
      const formData = new FormData();
      filesToUpload.forEach(file => {
        formData.append('files', file);
      });
      relativePaths.forEach(path => {
        formData.append('relative_paths', path);
      });

      setUploadProgress(40);
      setStatusMessage('Extracting text and chunking with metadata...');

      const res = await docApi.upload(targetFolderId, formData);
      setUploadProgress(85);
      setStatusMessage('Generating embeddings and indexing in ChromaDB...');

      setTimeout(() => {
        setUploadProgress(100);
        setStatusMessage('Indexing completed successfully!');
        setUploadResults(res.data);
        setIsUploading(false);
        // Refresh folders list so document count updates
        folderApi.list().then(r => setFolders(r.data));
      }, 800);
    } catch (err) {
      setIsUploading(false);
      setError(err.response?.data?.detail || 'Document processing and indexing failed. Check file formats.');
    }
  };

  const currentDestinationName = () => {
    if (newFolderName.trim()) {
      return `New Folder: "${newFolderName.trim()}" (will be created automatically)`;
    }
    const found = folders.find(f => f.id.toString() === selectedFolderId);
    if (found) {
      return `Existing Folder: "${found.name}" (${found.document_count} files)`;
    }
    if (filesToUpload.length > 0) {
      const autoName = filesToUpload[0].name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
      return `Auto-created Folder: "${autoName}"`;
    }
    return 'Select an existing folder or type a new folder name below';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <UploadCloud className="w-6 h-6 text-purple-400" />
          <span>Upload Folder & Recursive Ingestion</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Select an entire folder or individual documents. Chunks and embeddings are indexed directly into ChromaDB.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Target Folder Selector / Creator */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Folder className="w-4 h-4 text-indigo-400" />
            <span>Target Workspace Folder</span>
          </h2>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="truncate max-w-xs">{currentDestinationName()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-medium">Choose Existing Folder</label>
            <select
              value={selectedFolderId}
              onChange={(e) => {
                setSelectedFolderId(e.target.value);
                if (e.target.value) setNewFolderName('');
              }}
              className="w-full px-3.5 py-2.5 bg-navy-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.document_count} files)</option>
              ))}
              <option value="">-- Or Create New Below --</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-medium">Or Create New Folder</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => {
                  setNewFolderName(e.target.value);
                  if (e.target.value) setSelectedFolderId('');
                }}
                placeholder="e.g. College_Materials"
                className="w-full px-3.5 py-2.5 bg-navy-900 border border-purple-500/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => handleCreateNewFolder()}
                disabled={!newFolderName.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600/30 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30 text-xs font-semibold transition disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="glass-card rounded-2xl p-8 border border-white/10 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Upload Entire Folder or Select Multiple Files</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Preserves nested relative directories. Supports PDF, DOCX, PPTX, TXT, MD, CSV, XLSX, and JSON.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Folder input button */}
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderSelect}
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Select Complete Folder</span>
          </button>

          {/* Files input button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFilesSelect}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Select Individual Files</span>
          </button>
        </div>

        {/* Selected files preview */}
        {filesToUpload.length > 0 && (
          <div className="text-left bg-navy-950/70 p-4 rounded-xl border border-white/5 space-y-2 max-h-56 overflow-y-auto">
            <div className="text-xs font-semibold text-purple-300 flex items-center justify-between">
              <span>Selected ({filesToUpload.length} files ready for indexing):</span>
              <span className="text-[11px] text-slate-400">
                Destination: <strong className="text-white">{newFolderName || folders.find(f => f.id.toString() === selectedFolderId)?.name || 'Auto-created Folder'}</strong>
              </span>
            </div>
            <div className="space-y-1">
              {relativePaths.map((p, idx) => (
                <div key={idx} className="text-xs font-mono text-slate-300 flex items-center justify-between">
                  <span className="truncate max-w-md">{p}</span>
                  <span className="text-slate-500 text-[10px]">
                    {(filesToUpload[idx].size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isUploading && (
          <div className="space-y-2 text-left">
            <div className="flex justify-between text-xs text-purple-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {statusMessage}
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-navy-950 rounded-full h-2 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isUploading || filesToUpload.length === 0}
            onClick={handleUploadAndIndex}
            className="px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 transition disabled:opacity-40 cursor-pointer"
          >
            {isUploading ? 'Processing & Indexing...' : `Ingest & Index ${filesToUpload.length || 0} Documents`}
          </button>
        </div>
      </div>

      {/* Upload Results Summary */}
      {uploadResults.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold text-white text-sm">Indexed Successfully into ChromaDB</h3>
            </div>
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span>Ask Questions Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
            {uploadResults.map((doc) => (
              <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{doc.filename}</div>
                  <div className="text-[11px] font-mono text-slate-400">{doc.relative_path}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
                    {doc.chunk_count} chunks
                  </span>
                  <span className="text-emerald-400 font-semibold text-[11px]">INDEXED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
