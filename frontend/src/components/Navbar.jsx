import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, MessageSquare, LayoutDashboard, UploadCloud, 
  FileText, GitCompare, HelpCircle, BarChart3, Settings, LogOut,
  Sparkles, Layers
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Folder', path: '/upload', icon: UploadCloud },
    { name: 'Folders', path: '/folders', icon: FolderKanban },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare },
    { name: 'Summarizer', path: '/summarizer', icon: FileText },
    { name: 'Compare', path: '/compare', icon: GitCompare },
    { name: 'Quiz Gen', path: '/quiz', icon: HelpCircle },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-600/30 group-hover:shadow-purple-600/50 transition">
              <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-300 text-lg">
                FolderIntelligence
              </span>
              <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                RAG AI
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-900/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Profile / Auth buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{user?.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition shadow-lg shadow-purple-600/30"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
