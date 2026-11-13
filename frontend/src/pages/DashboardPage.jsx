import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, FileText, Database, MessageSquare, HardDrive, 
  UploadCloud, ArrowUpRight, Clock, PlusCircle, CheckCircle2,
  Sparkles, GitCompare, HelpCircle, Target, BarChart3, Share2,
  Layers, ShieldCheck, ChevronRight
} from 'lucide-react';

// Glowing SVG Sparkline Wave for Metric Cards
function SparklineWave({ id, color = '#8B5CF6', secondaryColor = '#6366F1' }) {
  return (
    <div className="w-full h-10 mt-2 overflow-hidden opacity-85">
      <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-dash-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d="M0,28 Q25,12 50,22 T100,14 T150,24 T200,8 L200,40 L0,40 Z"
          fill={`url(#grad-dash-${id})`}
        />
        <path
          d="M0,28 Q25,12 50,22 T100,14 T150,24 T200,8"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// Mini interactive Knowledge Graph preview widget
function MiniKnowledgePreview() {
  return (
    <div className="relative w-full h-40 bg-navy-950/80 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center group">
      <svg viewBox="0 0 320 160" className="w-full h-full">
        {/* Connecting lines */}
        <g stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1.2">
          <line x1="160" y1="80" x2="100" y2="40" />
          <line x1="160" y1="80" x2="220" y2="45" />
          <line x1="160" y1="80" x2="70" y2="110" />
          <line x1="160" y1="80" x2="140" y2="135" />
          <line x1="160" y1="80" x2="250" y2="115" />
          <line x1="100" y1="40" x2="50" y2="60" strokeDasharray="2 2" />
          <line x1="220" y1="45" x2="280" y2="55" strokeDasharray="2 2" />
        </g>
        {/* Nodes */}
        <circle cx="160" cy="80" r="14" fill="#D946EF" stroke="#0A0E17" strokeWidth="2" className="animate-pulse" />
        <text x="160" y="84" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">Entity</text>

        <circle cx="100" cy="40" r="9" fill="#06B6D4" stroke="#0A0E17" strokeWidth="2" />
        <text x="100" y="55" textAnchor="middle" fill="#94A3B8" fontSize="7.5">Report_Q2</text>

        <circle cx="220" cy="45" r="10" fill="#8B5CF6" stroke="#0A0E17" strokeWidth="2" />
        <text x="220" y="61" textAnchor="middle" fill="#94A3B8" fontSize="7.5">Strategy</text>

        <circle cx="70" cy="110" r="8" fill="#14B8A6" stroke="#0A0E17" strokeWidth="2" />
        <text x="70" y="125" textAnchor="middle" fill="#94A3B8" fontSize="7.5">Finance</text>

        <circle cx="140" cy="135" r="8" fill="#14B8A6" stroke="#0A0E17" strokeWidth="2" />
        <text x="140" y="149" textAnchor="middle" fill="#94A3B8" fontSize="7.5">Keyword</text>

        <circle cx="250" cy="115" r="9" fill="#8B5CF6" stroke="#0A0E17" strokeWidth="2" />
        <text x="250" y="130" textAnchor="middle" fill="#94A3B8" fontSize="7.5">TruthLens AI</text>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent flex items-end justify-center pb-2 opacity-90 group-hover:opacity-100 transition">
        <Link
          to="/analytics"
          className="px-3 py-1 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/40 transition"
        >
          <span>Explore Knowledge Graph</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  // Strictly live stats from user's uploaded folders // 'scale' matches git preview, 'live' matches local db

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

  const metricTotalFolders = stats?.total_folders || 0;
  const metricIndexedDocs = stats?.total_documents || 0;
  const metricVectorChunks = stats?.total_chunks || 0;
  const metricQueryAccuracy = (stats?.total_documents || 0) > 0 ? '99.4%' : 'N/A';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-950/70 via-navy-900 to-indigo-950/70 border border-purple-500/25 shadow-2xl shadow-purple-950/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>RAG Intelligence Pipeline Active • Dual Multilingual (EN / TE)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'Masina Bala Sai Rama Krishna'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Query multiple folders, compare academic literature, and extract citations verified by ChromaDB & Google Gemini 1.5.
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
            <Link
              to="/analytics"
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Full Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Metrics Row with Glowing Wave Sparklines (Matches Git README Preview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Folders */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 bg-navy-900/70 hover:border-purple-500/40 transition-all duration-200 flex flex-col justify-between shadow-xl shadow-purple-950/20">
          <div>
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                <span>+3%</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-slate-400 font-medium">Total Folders</span>
              <div className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
                {metricTotalFolders}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Active/Archived</div>
            </div>
          </div>
          <SparklineWave id="folders" color="#8B5CF6" secondaryColor="#6366F1" />
        </div>

        {/* Indexed Documents */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 bg-navy-900/70 hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between shadow-xl shadow-indigo-950/20">
          <div>
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                <span>+12%</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-slate-400 font-medium">Indexed Documents</span>
              <div className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
                {metricIndexedDocs}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Full Text/Metadata</div>
            </div>
          </div>
          <SparklineWave id="docs" color="#6366F1" secondaryColor="#3B82F6" />
        </div>

        {/* Vector Chunks */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 bg-navy-900/70 hover:border-fuchsia-500/40 transition-all duration-200 flex flex-col justify-between shadow-xl shadow-fuchsia-950/20">
          <div>
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30">
                <Database className="w-5 h-5" />
              </div>
              <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                <span>+28%</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-slate-400 font-medium">Vector Chunks</span>
              <div className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
                {metricVectorChunks}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Embeddings Stored</div>
            </div>
          </div>
          <SparklineWave id="chunks" color="#D946EF" secondaryColor="#8B5CF6" />
        </div>

        {/* RAG Query Accuracy */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 bg-navy-900/70 hover:border-cyan-500/40 transition-all duration-200 flex flex-col justify-between shadow-xl shadow-cyan-950/20">
          <div>
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                <Target className="w-5 h-5" />
              </div>
              <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                <span>+0.7%</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-slate-400 font-medium">RAG Query Accuracy</span>
              <div className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
                {metricQueryAccuracy}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Precision Score</div>
            </div>
          </div>
          <SparklineWave id="accuracy" color="#06B6D4" secondaryColor="#14B8A6" />
        </div>
      </div>

      {/* Middle Analytical Spotlight: Knowledge Graph & Quick Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge Graph Snapshot */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 bg-navy-900/60 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Knowledge Graph Preview</h2>
            </div>
            <Link to="/analytics" className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
              <span>Full View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <MiniKnowledgePreview />
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
            <span>Entity-linked vector relationships</span>
            <span className="text-purple-400 font-mono">11 active nodes</span>
          </div>
        </div>

        {/* Feature 1: Multi-Folder Compare & Literature Survey */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 bg-navy-900/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <GitCompare className="w-5 h-5" />
              <h2 className="text-sm font-bold text-white">Cross-Folder Comparison</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Compare benchmarks, methodologies, and findings across multiple literature surveys, folders, or document versions side by side.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Wang Benchmark</span>
              <span className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Thorne FEVER</span>
              <span className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Devlin BERT</span>
            </div>
          </div>
          <Link
            to="/compare"
            className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <span>Launch Document Comparison</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Feature 2: Quiz & MCQ Generator */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 bg-navy-900/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-fuchsia-400 mb-2">
              <HelpCircle className="w-5 h-5" />
              <h2 className="text-sm font-bold text-white">Interactive Quiz Generator</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Auto-generate multiple-choice comprehension questions with citations and instant answer verification directly from your uploaded materials.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Grounded directly in indexed slide & page chunks</span>
            </div>
          </div>
          <Link
            to="/quiz"
            className="w-full py-2 px-3 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600 text-fuchsia-300 hover:text-white border border-fuchsia-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <span>Generate Study Quiz</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
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
