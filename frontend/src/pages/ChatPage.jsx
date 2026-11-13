import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { folderApi, chatApi } from '../services/api';
import CitationBadge from '../components/CitationBadge';
import SourceViewerModal from '../components/SourceViewerModal';
import { 
  Send, Bot, User, Sparkles, Folder, Languages, Copy, 
  Check, Trash2, Plus, MessageSquare, ArrowRight, CornerDownLeft,
  Loader2, ShieldCheck, HelpCircle, Key, X, Sliders
} from 'lucide-react';

export default function ChatPage() {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [tempModel, setTempModel] = useState(localStorage.getItem('gemini_model') || 'gemini-1.5-flash');
  const [hasGeminiKey, setHasGeminiKey] = useState(!!(localStorage.getItem('gemini_api_key') || '').trim());
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "Give full comprehensive explanation of all topics in this file",
    "Explain the TruthLens AI architecture and verification pipeline in detail",
    "What are the decision verdicts (SUPPORTED, CONTRADICTED) and evaluation rules?",
    "Summarize the literature survey benchmark datasets (Wang, Thorne, Devlin)"
  ]);
  const messagesEndRef = useRef(null);
  const [searchParams] = useSearchParams();


  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (selectedFolderId) {
      loadConversations(selectedFolderId);
    }
  }, [selectedFolderId]);

  useEffect(() => {
    const convParam = searchParams.get('conv');
    if (convParam) {
      loadSpecificConversation(parseInt(convParam));
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadFolders = async () => {
    try {
      const res = await folderApi.list();
      setFolders(res.data);
      if (res.data.length > 0) {
        setSelectedFolderId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load folders', err);
    }
  };

  const loadConversations = async (folderId) => {
    try {
      const res = await chatApi.getConversations(folderId);
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const loadSpecificConversation = async (convId) => {
    try {
      const res = await chatApi.getConversation(convId);
      setActiveConversationId(convId);
      if (res.data.folder_id) {
        setSelectedFolderId(res.data.folder_id.toString());
      }
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load conversation details', err);
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputQuery('');
  };

  const handleSendMessage = async (queryText = inputQuery) => {
    const q = queryText.trim();
    if (!q || loading) return;

    const userMessage = {
      role: 'user',
      content: q,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const savedKey = localStorage.getItem('gemini_api_key');
      const savedModel = localStorage.getItem('gemini_model');

      const res = await chatApi.ask({
        folder_id: selectedFolderId ? parseInt(selectedFolderId) : null,
        conversation_id: activeConversationId,
        question: q,
        language: language,
        top_k: 25,
        api_key: savedKey && savedKey.trim() ? savedKey.trim() : undefined,
        model: savedModel && savedModel.trim() ? savedModel.trim() : undefined
      });

      const assistantMessage = {
        role: 'assistant',
        content: res.data.answer,
        sources_json: res.data.sources,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setActiveConversationId(res.data.conversation_id);
      
      if (res.data.suggested_follow_ups && res.data.suggested_follow_ups.length > 0) {
        setSuggestedQuestions(res.data.suggested_follow_ups);
      }

      if (selectedFolderId) {
        loadConversations(selectedFolderId);
      }
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: 'Error: Failed to retrieve or generate answer. Please ensure documents are indexed in the folder.',
        sources_json: [],
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await chatApi.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConversationId === convId) {
        handleStartNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-2xl overflow-hidden glass-card border border-white/10">
      {/* Sidebar: Folder & History Selection */}
      <div className="w-72 bg-navy-950/70 border-r border-white/10 flex flex-col p-4 space-y-4 hidden md:flex">
        {/* Folder Picker */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5" />
            <span>Target Folder</span>
          </label>
          <select
            value={selectedFolderId}
            onChange={(e) => {
              setSelectedFolderId(e.target.value);
              handleStartNewChat();
            }}
            className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
          >
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.document_count} files)</option>
            ))}
            <option value="">Query All Folders</option>
          </select>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleStartNewChat}
          className="w-full py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New AI Conversation</span>
        </button>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
            History
          </div>
          {conversations.map(c => (
            <div
              key={c.id}
              onClick={() => loadSpecificConversation(c.id)}
              className={`w-full group p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                activeConversationId === c.id
                  ? 'bg-purple-600/30 text-white font-medium border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                <span className="truncate">{c.title}</span>
              </div>
              <button
                onClick={(e) => handleDeleteConversation(c.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {conversations.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500">
              No conversations in this folder.
            </div>
          )}
        </div>

        {/* Engine Grounding Badge */}
        <div className="p-3 rounded-xl bg-navy-900/80 border border-white/5 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Strict RAG Grounding</span>
          </div>
          <p className="text-[10px] leading-tight">
            Responses are verified against indexed chunks with zero speculative fabrication.
          </p>
        </div>
      </div>

      {/* Main Chat Arena */}
      <div className="flex-1 flex flex-col bg-navy-900/40">
        {/* Chat Header */}
        <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-navy-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Folder Grounded Intelligence Assistant
              </h3>
              <p className="text-[11px] text-slate-400">
                {selectedFolderId
                  ? `Active Scope: ${folders.find(f => f.id.toString() === selectedFolderId)?.name || 'Selected Folder'}`
                  : 'Scope: All Available Folders'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Engine & API Key Trigger */}
            <button
              onClick={() => {
                setTempApiKey(localStorage.getItem('gemini_api_key') || '');
                setTempModel(localStorage.getItem('gemini_model') || 'gemini-1.5-flash');
                setShowKeyModal(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition ${
                hasGeminiKey
                  ? 'bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border-purple-400/60 text-purple-200 shadow-md shadow-purple-900/40 hover:border-purple-300'
                  : 'bg-navy-950 border-white/10 text-slate-300 hover:text-white hover:border-purple-500/40'
              }`}
              title="Click to configure Gemini API Key or change AI Model"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>{hasGeminiKey ? 'Gemini 1.5 Active' : 'Offline RAG Mode'}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-navy-950 px-2.5 py-1 rounded-xl border border-white/10 text-xs">
              <Languages className="w-3.5 h-3.5 text-purple-400" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition ${
                  language === 'en' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('te')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition ${
                  language === 'te' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                తెలుగు (Telugu)
              </button>
            </div>

            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition text-xs flex items-center gap-1"
                title="Clear current view"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-600/30">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-white">Ask Anything About Your Documents</h4>
                <p className="text-xs text-slate-400">
                  Select a question below or type your own. Citations and page numbers will accompany every answer.
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="w-full grid grid-cols-1 gap-2 pt-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="p-3 text-left rounded-xl bg-navy-950/70 hover:bg-purple-950/50 border border-white/5 hover:border-purple-500/40 text-xs text-slate-300 hover:text-purple-200 transition flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-purple-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3.5 max-w-3xl ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white shadow-purple-600/30'
                      : 'bg-indigo-600 text-white shadow-indigo-600/30'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 space-y-3 ${
                    msg.role === 'user'
                      ? 'bg-purple-600/20 border border-purple-500/30 text-purple-50 rounded-tr-none'
                      : 'glass-card border border-white/10 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {/* Content Text */}
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Sources Strip */}
                  {msg.role === 'assistant' && msg.sources_json && msg.sources_json.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                        Verified Sources ({msg.sources_json.length} Chunks Retrieved):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources_json.map((source, sIdx) => (
                          <CitationBadge
                            key={sIdx}
                            citation={source}
                            onClick={(cit) => setActiveCitation(cit)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Action Footer */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Grounded in ChromaDB Vectors</span>
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="p-1 hover:text-white transition flex items-center gap-1 text-[11px]"
                      >
                        {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Assistant Loading Indicator */}
          {loading && (
            <div className="flex gap-3.5 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center gap-3 text-xs text-purple-300">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>Searching ChromaDB vectors and synthesizing grounded answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-navy-950/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-navy-900 border border-white/10 rounded-2xl p-1.5 focus-within:border-purple-500 shadow-xl"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={language === 'te' ? 'పత్రాల గురించి ఏదైనా ప్రశ్నించండి...' : 'Ask a question about your uploaded documents...'}
              className="flex-1 px-4 py-2 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition disabled:opacity-40 shadow-md shadow-purple-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Gemini API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-2xl p-6 border border-white/20 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Key className="w-4 h-4 text-amber-400" />
                <span>AI Engine & Gemini API Key</span>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Configure your <strong>Google Gemini API Key</strong> for generative synthesis, or leave it blank to use the built-in <strong>High-Precision Offline Grounded Extractor</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                  Gemini API Key (Google AI Studio)
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Paste AIzaSy... key or leave blank for offline"
                  className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                  Foundation Model Selection
                </label>
                <select
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra-fast, High Context)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Multi-Step Reasoning)</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  Get free Gemini API Key →
                </a>
                {tempApiKey && (
                  <button
                    type="button"
                    onClick={() => setTempApiKey('')}
                    className="text-rose-400 hover:underline"
                  >
                    Clear Key (Use Offline)
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (tempApiKey.trim()) {
                    localStorage.setItem('gemini_api_key', tempApiKey.trim());
                    setHasGeminiKey(true);
                  } else {
                    localStorage.removeItem('gemini_api_key');
                    setHasGeminiKey(false);
                  }
                  localStorage.setItem('gemini_model', tempModel);
                  setShowKeyModal(false);
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30"
              >
                Save Configuration
              </button>
            </div>
          </div>
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
