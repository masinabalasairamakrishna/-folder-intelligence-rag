import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api';
import { 
  BarChart3, PieChart, Activity, Database, CheckCircle2, 
  FileText, FolderKanban, ShieldCheck, HardDrive
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart as RechartsPie, Pie, Cell, Legend 
} from 'recharts';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await dashboardApi.getStats();
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fileTypeData = stats?.file_type_distribution
    ? Object.entries(stats.file_type_distribution).map(([type, count]) => ({
        name: type.toUpperCase(),
        count: count
      }))
    : [];

  const statusData = stats?.indexing_status_distribution
    ? Object.entries(stats.indexing_status_distribution).map(([status, count]) => ({
        name: status,
        value: count
      }))
    : [];

  const COLORS = ['#8B5CF6', '#6366F1', '#06B6D4', '#EC4899', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <span>Vector Storage & System Analytics</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time metrics on ChromaDB embedding distributions, document MIME classifications, and ingestion reliability.
        </p>
      </div>

      {/* Diagnostic Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Vector DB Status</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>ChromaDB Active</span>
          </div>
          <div className="text-[11px] text-slate-400">Cosine Space (dim=768)</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>LLM Grounding</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-purple-300">
            Strict Multi-Tenant
          </div>
          <div className="text-[11px] text-slate-400">Isolated $and Filters</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Ingested Files</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.total_documents || 0}
          </div>
          <div className="text-[11px] text-slate-400">In {stats?.total_folders || 0} folders</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Indexed Chunks</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.total_chunks || 0}
          </div>
          <div className="text-[11px] text-slate-400">Recursive Chunks</div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Type Distribution Bar Chart */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
          <h2 className="text-sm font-bold text-white">Document Type Distribution</h2>
          <div className="h-64 w-full">
            {fileTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fileTypeData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#475569',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No documents uploaded yet to plot distributions.
              </div>
            )}
          </div>
        </div>

        {/* Indexing Status Pie Chart */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
          <h2 className="text-sm font-bold text-white">Document Indexing Health</h2>
          <div className="h-64 w-full">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#475569',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No indexing status events recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
