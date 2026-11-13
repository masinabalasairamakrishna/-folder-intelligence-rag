import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderTree, Search, Cpu, ShieldCheck, Sparkles, FileText, 
  Layers, ArrowRight, CheckCircle2, Database, Terminal
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: FolderTree,
      title: 'Recursive Folder Ingestion',
      desc: 'Upload complete folder trees containing PDFs, Word docs, PowerPoints, CSVs, and code files while preserving directory hierarchy.',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: Database,
      title: 'ChromaDB Vector Store',
      desc: 'High-speed cosine similarity retrieval backed by Google text-embedding-004 vectors with strict multi-tenant isolation.',
      color: 'from-indigo-500 to-cyan-500',
    },
    {
      icon: Cpu,
      title: 'Grounding via Google Gemini',
      desc: 'Strictly grounded answers that never hallucinate unsupported facts. Includes precise source citations and page numbers.',
      color: 'from-pink-500 to-purple-500',
    },
    {
      icon: FileText,
      title: 'Hierarchical Summarization',
      desc: 'Map-reduce summarization extracts executive overviews, key bullet points, domain topics, and terminology dictionaries.',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Layers,
      title: 'Cross-Document Comparison',
      desc: 'Select two or more documents to contrast methodologies, discover commonalities, and map differences side-by-side.',
      color: 'from-amber-500 to-purple-500',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise-Grade Security',
      desc: 'JWT authentication, SHA-256 duplicate detection, path traversal prevention, and isolated vector collections.',
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 lg:pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-navy-950/0 to-transparent pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-semibold shadow-lg shadow-purple-900/30">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>B.Tech CSE (AI) Major Project 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">Folder Intelligence</span> & RAG System
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            Upload complete folders of course notes, research papers, and technical manuals. Query your documents with natural language and get strictly grounded answers with verifiable page-level citations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 transition flex items-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* RAG Workflow Diagram */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">How The RAG Architecture Works</h2>
            <p className="text-xs sm:text-sm text-slate-400">End-to-end multi-stage pipeline ensuring 0% hallucination</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-navy-900/80 border border-purple-900/30 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-sm">1</div>
              <h3 className="text-sm font-semibold text-white">Ingest & Extract</h3>
              <p className="text-xs text-slate-400">Parses PDF (PyMuPDF), DOCX, PPTX, CSV, XLSX, and TXT with page tracking.</p>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/80 border border-indigo-900/30 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">2</div>
              <h3 className="text-sm font-semibold text-white">Chunk & Embed</h3>
              <p className="text-xs text-slate-400">Recursive character chunking and Google text-embedding-004 vectors.</p>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/80 border border-cyan-900/30 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-sm">3</div>
              <h3 className="text-sm font-semibold text-white">ChromaDB Search</h3>
              <p className="text-xs text-slate-400">User and folder isolated cosine similarity retrieves the top-k relevant excerpts.</p>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/80 border border-emerald-900/30 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-sm">4</div>
              <h3 className="text-sm font-semibold text-white">Grounded Answer</h3>
              <p className="text-xs text-slate-400">Gemini synthesizes answers with clickable citations and exact page numbers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Core Capabilities</h2>
          <p className="text-sm text-slate-400">Built for academic excellence, technical documentation, and enterprise research.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="glass-panel p-6 rounded-2xl space-y-4 hover:border-purple-500/40 transition group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${f.color} p-0.5 shadow-lg group-hover:scale-105 transition`}>
                  <div className="w-full h-full bg-navy-900 rounded-[10px] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
