import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, Vote, BarChart3, User, LogOut,
  Menu, X, Zap, ChevronRight
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import WalletButton from './WalletButton';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/elections', icon: Vote, label: 'Elections' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-void flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-ink border-r border-border fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm">VoteChain</div>
              <div className="text-xs text-muted font-mono">Sepolia Network</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-medium transition-all duration-200 group
                  ${active
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-muted hover:text-white hover:bg-surface'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-sm font-display font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.username}</div>
              <div className="text-xs text-muted truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted hover:text-danger hover:bg-danger/10 transition-all duration-200 font-body"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:pl-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-ink/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              className="lg:hidden p-2 rounded-xl text-muted hover:text-white hover:bg-surface"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden font-display font-bold text-white">VoteChain</div>
            <div className="flex items-center gap-3 ml-auto">
              <WalletButton />
            </div>
          </div>
        </header>

        {/* Page */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-ink border-r border-border z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <Link to="/" className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-accent" />
                  </div>
                  <span className="font-display font-bold text-white">VoteChain</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-muted hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {navItems.map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-medium transition-all
                      ${location.pathname === to ? 'bg-accent/15 text-accent border border-accent/30' : 'text-muted hover:text-white hover:bg-surface'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}