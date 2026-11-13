import React, { useState, useEffect, useMemo } from 'react';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, Folder, FileText, Database, Target, Search,
  Calendar, ZoomIn, ZoomOut, RotateCcw, Share2, Layers,
  TrendingUp, Sparkles, User, CheckCircle2, SlidersHorizontal,
  Info, ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart as RechartsPie, Pie, Cell
} from 'recharts';

// Glowing SVG Sparkline Wave Component for Metric Cards
function SparklineWave({ id, color = '#8B5CF6', secondaryColor = '#6366F1' }) {
  return (
    <div className="w-full h-10 mt-2 overflow-hidden opacity-85">
      <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d="M0,28 Q25,12 50,22 T100,14 T150,24 T200,8 L200,40 L0,40 Z"
          fill={`url(#grad-${id})`}
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

// Interactive Knowledge Graph Component
function KnowledgeGraph() {
  const [zoom, setZoom] = useState(1);
  const [activeNode, setActiveNode] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  const nodes = useMemo(() => [
    { id: 'entity-center', label: 'Entity', type: 'Entity', x: 200, y: 150, r: 16, color: '#D946EF' },
    { id: 'doc-report', label: 'Report_Q2', type: 'Docs', x: 260, y: 70, r: 11, color: '#06B6D4' },
    { id: 'doc-finance', label: 'Finance', type: 'Docs', x: 130, y: 90, r: 12, color: '#06B6D4' },
    { id: 'fld-strategy', label: 'Strategy', type: 'Folders', x: 290, y: 140, r: 13, color: '#8B5CF6' },
    { id: 'kw-finance', label: 'Finance', type: 'Keywords', x: 195, y: 240, r: 9, color: '#14B8A6' },
    { id: 'kw-strategy', label: 'Strategy', type: 'Keywords', x: 275, y: 220, r: 10, color: '#14B8A6' },
    { id: 'kw-keyword', label: 'Keyword', type: 'Keywords', x: 150, y: 205, r: 8, color: '#14B8A6' },
    { id: 'fld-docs', label: 'Docuuments', type: 'Folders', x: 240, y: 120, r: 14, color: '#8B5CF6' },
    { id: 'doc-truthlens', label: 'TruthLens AI', type: 'Docs', x: 110, y: 160, r: 11, color: '#06B6D4' },
    { id: 'kw-distilbert', label: 'DistilBERT', type: 'Keywords', x: 80, y: 220, r: 9, color: '#14B8A6' },
    { id: 'fld-materials', label: 'Materials', type: 'Folders', x: 200, y: 60, r: 10, color: '#8B5CF6' }
  ], []);

  const links = useMemo(() => [
    { source: 'entity-center', target: 'doc-report' },
    { source: 'entity-center', target: 'doc-finance' },
    { source: 'entity-center', target: 'fld-strategy' },
    { source: 'entity-center', target: 'fld-docs' },
    { source: 'entity-center', target: 'kw-finance' },
    { source: 'entity-center', target: 'kw-strategy' },
    { source: 'entity-center', target: 'kw-keyword' },
    { source: 'entity-center', target: 'doc-truthlens' },
    { source: 'doc-truthlens', target: 'kw-distilbert' },
    { source: 'doc-finance', target: 'kw-finance' },
    { source: 'fld-strategy', target: 'kw-strategy' },
    { source: 'fld-materials', target: 'doc-report' },
    { source: 'fld-docs', target: 'doc-report' },
  ], []);

  const getNodePos = (id) => nodes.find(n => n.id === id) || { x: 200, y: 150 };

  return (
    <div className="relative w-full h-full min-h-[290px] flex flex-col justify-between overflow-hidden rounded-2xl bg-navy-950/90 border border-white/5 p-3">
      {/* Zoom / Controls Panel */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 bg-navy-900/90 border border-white/10 p-1 rounded-xl shadow-lg">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.15, 1.6))}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.15, 0.7))}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Categories Legend */}
      <div className="flex items-center justify-end gap-3 text-[11px] text-slate-400 z-10 pr-2 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/80"></span>
          Folders
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80"></span>
          Docs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-400 shadow-sm shadow-teal-400/80"></span>
          Keywords
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-fuchsia-500 shadow-sm shadow-fuchsia-500/80"></span>
          Entity
        </span>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="flex-1 w-full flex items-center justify-center cursor-grab active:cursor-grabbing">
        <svg
          viewBox="0 0 380 270"
          className="w-full h-full transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Edge links */}
          <g stroke="rgba(147, 51, 234, 0.35)" strokeWidth="1.2">
            {links.map((link, idx) => {
              const src = getNodePos(link.source);
              const tgt = getNodePos(link.target);
              return (
                <line
                  key={idx}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={activeNode && (activeNode.id === link.source || activeNode.id === link.target) ? '#C084FC' : 'rgba(168, 85, 247, 0.28)'}
                  strokeWidth={activeNode && (activeNode.id === link.source || activeNode.id === link.target) ? '2' : '1.2'}
                  strokeDasharray={link.source === 'entity-center' ? 'none' : '3 3'}
                />
              );
            })}
          </g>

          {/* Central pulse ring */}
          <circle
            cx="200"
            cy="150"
            r="24"
            fill="none"
            stroke="#D946EF"
            strokeWidth="1.2"
            opacity="0.3"
            className="animate-ping"
          />

          {/* Nodes */}
          {nodes.map((node) => {
            const isHovered = activeNode?.id === node.id;
            return (
              <g
                key={node.id}
                onMouseEnter={() => setActiveNode(node)}
                onMouseLeave={() => setActiveNode(null)}
                className="cursor-pointer group"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? node.r + 3 : node.r}
                  fill={node.color}
                  stroke="#0A0E17"
                  strokeWidth="2.5"
                  className="transition-all duration-200 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                />
                <text
                  x={node.x}
                  y={node.y + node.r + 9}
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="9.5"
                  fontWeight="600"
                  className="pointer-events-none select-none tracking-tight"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Tooltip Info Footer */}
      <div className="text-[10px] text-slate-400 px-2 py-1 bg-navy-900/60 rounded-xl border border-white/5 flex items-center justify-between">
        <span>{activeNode ? `Selected: ${activeNode.label} (${activeNode.type})` : 'Connected Knowledge Cluster: 11 active nodes'}</span>
        <span className="text-purple-400 font-mono">ChromaDB Synced</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('30d');
  const [activityTimeframe, setActivityTimeframe] = useState('days');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState('scale'); // 'scale' matches mockup numbers, 'live' matches local db

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await dashboardApi.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  // Document Type Distribution matching the visual donut in the screenshot
  const documentTypeDistribution = useMemo(() => [
    { name: 'PDF', count: 48, color: '#8B5CF6' },
    { name: 'DOCX', count: 31, color: '#6366F1' },
    { name: 'PPTX', count: 14, color: '#D946EF' },
    { name: 'XLSX', count: 4, color: '#14B8A6' },
    { name: 'TXT', count: 3, color: '#06B6D4' }
  ], []);

  // Folder Activity Timeline Chart Data matching Days 1-30 curve
  const timelineDataDays = useMemo(() => [
    { day: '1', indexed: 18, queries: 28 },
    { day: '3', indexed: 24, queries: 22 },
    { day: '7', indexed: 38, queries: 48 },
    { day: '9', indexed: 42, queries: 32 },
    { day: '13', indexed: 85, queries: 54 },
    { day: '15', indexed: 74, queries: 62 },
    { day: '18', indexed: 26, queries: 35 },
    { day: '21', indexed: 104, queries: 72 },
    { day: '24', indexed: 78, queries: 58 },
    { day: '27', indexed: 95, queries: 82 },
    { day: '30', indexed: 88, queries: 76 }
  ], []);

  const timelineDataWeeks = useMemo(() => [
    { day: 'Week 1', indexed: 80, queries: 98 },
    { day: 'Week 2', indexed: 165, queries: 142 },
    { day: 'Week 3', indexed: 210, queries: 185 },
    { day: 'Week 4', indexed: 280, queries: 240 }
  ], []);

  const activeTimeline = activityTimeframe === 'days' ? timelineDataDays : timelineDataWeeks;

  // Metric card numbers (scale mode matches git preview, live mode reflects active db)
  const metricTotalFolders = displayMode === 'scale' ? '245' : (stats?.total_folders || 2);
  const metricIndexedDocs = displayMode === 'scale' ? '18,340' : (stats?.total_documents || 1);
  const metricVectorChunks = displayMode === 'scale' ? '3.1M' : (stats?.total_chunks || 25);
  const metricQueryAccuracy = '94.2%';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header Bar matching Analytics Dashboard screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <span>Analytics Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring of vector counts, folder distribution, chunking density, and query accuracy
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter Pill Dropdown */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-white/10 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="30d" className="bg-navy-950 text-white">Last 30 Days</option>
              <option value="7d" className="bg-navy-950 text-white">Last 7 Days</option>
              <option value="all" className="bg-navy-950 text-white">All Time</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Global Search..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-navy-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-44 transition-all"
            />
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-navy-900 border border-white/10 text-xs text-white">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-[10px] text-white shadow-sm shadow-purple-500/50">
              {user?.name ? user.name[0].toUpperCase() : 'M'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-white leading-tight">
                {user?.name || 'Masina Bala Sai Rama Krishna'}
              </div>
              <div className="text-[10px] text-slate-400">AI Researcher & Analyst</div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <button
            onClick={() => setDisplayMode(m => m === 'scale' ? 'live' : 'scale')}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border border-purple-500/30 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 transition"
            title="Toggle between Enterprise Scale numbers and local DB numbers"
          >
            {displayMode === 'scale' ? 'Mode: Scale Preview' : 'Mode: Live Local DB'}
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Cards with Glowing Waves (Matching Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Folders */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 bg-navy-900/70 hover:border-purple-500/40 transition-all duration-200 flex flex-col justify-between shadow-xl shadow-purple-950/20">
          <div>
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Folder className="w-5 h-5" />
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

        {/* Card 2: Indexed Documents */}
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

        {/* Card 3: Vector Chunks */}
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

        {/* Card 4: RAG Query Accuracy */}
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

      {/* Middle Row (3 Key Analytical Panels Matching Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Document Type Distribution Donut Chart */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 bg-navy-900/60 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Document Type Distribution</span>
              <span className="text-[11px] font-normal text-slate-400">Total Classified</span>
            </h2>

            {/* Donut Chart Container */}
            <div className="h-56 w-full relative flex items-center justify-center mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={documentTypeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="count"
                    stroke="#0A0E17"
                    strokeWidth={3}
                  >
                    {documentTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2 rounded-xl bg-navy-950 border border-white/20 text-xs text-white shadow-xl">
                            <span className="font-bold">{payload[0].name}: </span>
                            <span className="text-purple-300 font-semibold">{payload[0].value}%</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>

              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xs text-slate-400 font-medium">Formats</span>
                <span className="text-xl font-extrabold text-white">100%</span>
              </div>
            </div>
          </div>

          {/* Slices Legend Pills Matching Screenshot */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-white/5 text-[11px]">
            {documentTypeDistribution.map(item => (
              <div key={item.name} className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></span>
                <span className="font-medium">{item.name}</span>
                <span className="text-slate-400 text-[10px]">({item.count}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Folder Activity Timeline Line Chart */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 bg-navy-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Folder Activity Timeline</h2>
              {/* Days / Weeks Toggle */}
              <div className="flex items-center bg-navy-950 p-1 rounded-xl border border-white/10 text-[11px]">
                <button
                  onClick={() => setActivityTimeframe('days')}
                  className={`px-2 py-0.5 rounded-lg font-medium transition ${
                    activityTimeframe === 'days'
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Days
                </button>
                <button
                  onClick={() => setActivityTimeframe('weeks')}
                  className={`px-2 py-0.5 rounded-lg font-medium transition ${
                    activityTimeframe === 'weeks'
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Weeks
                </button>
              </div>
            </div>

            {/* Sub Legend Indicators */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Documents Indexed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Queries Processed
              </span>
            </div>

            {/* Area Chart with Double Gradient Curves */}
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeTimeline}>
                  <defs>
                    <linearGradient id="colorIndexed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="indexed"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorIndexed)"
                  />
                  <Area
                    type="monotone"
                    dataKey="queries"
                    stroke="#A855F7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorQueries)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-white/5">
            Synchronized with persistent ChromaDB query logs
          </div>
        </div>

        {/* Panel 3: Knowledge Graph Preview */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 bg-navy-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Knowledge Graph Preview</span>
              </h2>
              <span className="text-[11px] text-purple-400 flex items-center gap-1 font-mono">
                <Share2 className="w-3 h-3" />
                Interactive
              </span>
            </div>

            {/* Interactive Graph Component */}
            <div className="h-64 w-full">
              <KnowledgeGraph />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-white/5">
            Dynamic entity linking across indexed PDF, PPTX & Word embeddings
          </div>
        </div>
      </div>
    </div>
  );
}

