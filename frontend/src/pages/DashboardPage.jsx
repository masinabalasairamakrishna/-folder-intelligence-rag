import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { 
  FolderKanban, FileText, Database, MessageSquare, HardDrive, 
  UploadCloud, ArrowUpRight, Clock, PlusCircle, CheckCircle2,
  Sparkles, GitCompare, HelpCircle
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const res = await dashboardApi.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-950/60 via-navy-900 to-indigo-950/60 border border-purple-500/20 shadow-2xl shadow-purple-950/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RAG Engine Online & Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Folder Intelligence Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Query multiple folders, compare academic literature, and extract citations verified by ChromaDB & Google Gemini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/upload"
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Folder</span>
            </Link>
            <Link
              to="/chat"
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Questions</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Folders</span>
            <FolderKanban className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : stats?.total_folders || 0}
          </div>
          <div className="text-[11px] text-purple-300/70">Isolated Repositories</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Documents</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : stats?.total_documents || 0}
          </div>
          <div className="text-[11px] text-indigo-300/70">PDF, DOCX, PPTX, CSV</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Vector Chunks</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : stats?.total_chunks || 0}
          </div>
          <div className="text-[11px] text-cyan-300/70">In ChromaDB Embeddings</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Questions Answered</span>
            <MessageSquare className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : stats?.total_questions || 0}
          </div>
          <div className="text-[11px] text-pink-300/70">Grounded Syntheses</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Storage Used</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : formatBytes(stats?.storage_bytes)}
          </div>
          <div className="text-[11px] text-emerald-300/70">Local Document Vault</div>
        </div>
      </div>

      {/* Main Split: Recent Folders & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Folders */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-purple-400" />
              <h2 className="font-bold text-white text-base">Recent Folders</h2>
            </div>
            <Link to="/folders" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.recent_folders && stats.recent_folders.length > 0 ? (
            <div className="divide-y divide-white/5">
              {stats.recent_folders.map((f) => (
                <div key={f.id} className="py-3 flex items-center justify-between hover:bg-white/5 px-2 rounded-xl transition">
                  <div>
                    <Link to={`/folders`} className="text-sm font-semibold text-white hover:text-purple-300 transition">
                      {f.name}
                    </Link>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{f.document_count} files</span>
                      <span>•</span>
                      <span>Created {new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link
                    to="/chat"
                    className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-medium hover:bg-purple-600 hover:text-white transition"
                  >
                    Chat
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <UploadCloud className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-xs text-slate-400">No folders uploaded yet.</div>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 font-semibold hover:underline"
              >
                Upload your first folder <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-white text-base">Recent AI Conversations</h2>
            </div>
            <Link to="/chat" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
              <span>Open Chat</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.recent_conversations && stats.recent_conversations.length > 0 ? (
            <div className="divide-y divide-white/5">
              {stats.recent_conversations.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between hover:bg-white/5 px-2 rounded-xl transition">
                  <div className="truncate max-w-[280px]">
                    <div className="text-sm font-medium text-white truncate">{c.title}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link
                    to={`/chat?conv=${c.id}`}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-600 hover:text-white transition"
                  >
                    Resume
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-xs text-slate-400">No conversations yet.</div>
              <Link
                to="/chat"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-semibold hover:underline"
              >
                Ask your first question <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
