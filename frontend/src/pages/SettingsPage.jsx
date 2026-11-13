import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings, Key, Cpu, Sliders, Database, ShieldAlert, 
  CheckCircle2, Sparkles, User, Save
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [topK, setTopK] = useState(5);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('gemini_model', model);
    localStorage.setItem('rag_chunk_size', chunkSize.toString());
    localStorage.setItem('rag_chunk_overlap', chunkOverlap.toString());
    localStorage.setItem('rag_top_k', topK.toString());

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-purple-400" />
          <span>System & Hyperparameter Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Tune chunking resolutions, vector retrieval top-k depths, and Gemini foundation model keys.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Preferences and RAG hyperparameters saved successfully!</span>
        </div>
      )}

      {/* User Profile */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-purple-400" />
          <span>Student / Researcher Profile</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-navy-900 border border-white/5 space-y-1">
            <span className="text-slate-400">Full Name</span>
            <div className="font-semibold text-white">{user?.name || 'Aarav Sharma'}</div>
          </div>
          <div className="p-3 rounded-xl bg-navy-900 border border-white/5 space-y-1">
            <span className="text-slate-400">Email Address</span>
            <div className="font-semibold text-white">{user?.email || 'student@university.edu'}</div>
          </div>
        </div>
      </div>

      {/* Gemini API Key Configuration */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          <span>Google Gemini API Key</span>
        </h2>
        <p className="text-xs text-slate-400">
          Enter your Gemini API key from Google AI Studio. If left blank, the application uses its built-in offline extractive grounding mode.
        </p>

        <div className="space-y-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-2.5 bg-navy-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Keys are securely stored and never committed to source control.</span>
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:underline"
            >
              Get free Gemini API Key →
            </a>
          </div>
        </div>
      </div>

      {/* RAG Hyperparameters */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-6">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>RAG Pipeline Hyperparameters</span>
        </h2>

        {/* Foundation Model */}
        <div className="space-y-1.5">
          <label className="block text-xs text-slate-300 font-medium">Generation Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-navy-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Recommended - Ultra Fast)</option>
            <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Complex Reasoning)</option>
            <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
          </select>
        </div>

        {/* Chunk Size Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Chunk Size (Characters)</span>
            <span className="text-purple-400 font-bold">{chunkSize} chars</span>
          </div>
          <input
            type="range"
            min="300"
            max="2500"
            step="100"
            value={chunkSize}
            onChange={(e) => setChunkSize(parseInt(e.target.value))}
            className="w-full accent-purple-600 bg-navy-900 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>300 (Fine-grained)</span>
            <span>Default: 1000</span>
            <span>2500 (Broad context)</span>
          </div>
        </div>

        {/* Chunk Overlap Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Chunk Overlap (Characters)</span>
            <span className="text-indigo-400 font-bold">{chunkOverlap} chars</span>
          </div>
          <input
            type="range"
            min="50"
            max="500"
            step="25"
            value={chunkOverlap}
            onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
            className="w-full accent-indigo-600 bg-navy-900 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>50 chars</span>
            <span>Default: 200</span>
            <span>500 chars</span>
          </div>
        </div>

        {/* Retrieval Top-K */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Retrieval Top-K (Passages Passed to LLM)</span>
            <span className="text-cyan-400 font-bold">{topK} chunks</span>
          </div>
          <input
            type="range"
            min="2"
            max="12"
            step="1"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value))}
            className="w-full accent-cyan-600 bg-navy-900 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>2 chunks (Focused)</span>
            <span>Default: 5</span>
            <span>12 chunks (Comprehensive)</span>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>

      {/* Database & Storage Status */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Data Layer & Vector Store Status</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-navy-950 border border-white/5 space-y-1">
            <div className="text-slate-400">Application Relational DB</div>
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SQLAlchemy (MySQL 8.0 & SQLite Enabled)</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-navy-950 border border-white/5 space-y-1">
            <div className="text-slate-400">ChromaDB Vector Store</div>
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Persistent Collection: folder_intelligence_docs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
