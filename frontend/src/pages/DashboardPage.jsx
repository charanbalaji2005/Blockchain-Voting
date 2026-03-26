import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Vote, BarChart3, Users, Clock, ArrowRight, Shield, Zap } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card rounded-2xl"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-display font-bold text-3xl text-white mb-1">{value ?? '—'}</div>
      <div className="text-sm text-muted">{label}</div>
    </motion.div>
  );
}

function ElectionStatusBadge({ status }) {
  const map = {
    active: { label: 'Live', cls: 'bg-success/15 text-success border-success/30' },
    upcoming: { label: 'Upcoming', cls: 'bg-accent/15 text-accent border-accent/30' },
    ended: { label: 'Ended', cls: 'bg-ghost text-muted border-border' },
    draft: { label: 'Draft', cls: 'bg-ghost text-muted border-border' },
    results_published: { label: 'Results Out', cls: 'bg-gold/15 text-gold border-gold/30' },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`badge border ${s.cls}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />}
      {s.label}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [elections, setElections] = useState([]);
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    api.get('/stats/').then(r => setStats(r.data)).catch(() => {});
    api.get('/elections/?ordering=-created_at').then(r => setElections(r.data.results || [])).catch(() => {});
    api.get('/my-votes/').then(r => setVotes(r.data)).catch(() => {});
  }, []);

  const activeElections = elections.filter(e => e.status === 'active');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-white mb-1">
            Welcome back, <span className="gradient-text">{user?.first_name || user?.username}</span>
          </h1>
          <p className="text-muted text-sm">
            {user?.is_verified
              ? '✅ Identity verified — you can participate in elections'
              : '⚠️ Identity pending verification — complete your profile to vote'}
          </p>
        </div>
        <Link to="/elections" className="btn-primary hidden sm:flex text-sm">
          Browse Elections <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Vote} label="Total Elections" value={stats?.total_elections} color="bg-accent/15 text-accent" delay={0} />
        <StatCard icon={Zap} label="Live Now" value={stats?.active_elections} color="bg-success/15 text-success" delay={0.1} />
        <StatCard icon={Users} label="Verified Voters" value={stats?.total_voters} color="bg-cyan-glow/15 text-cyan-glow" delay={0.2} />
        <StatCard icon={BarChart3} label="My Votes Cast" value={votes.length} color="bg-gold/15 text-gold" delay={0.3} />
      </div>

      {/* Verification banner */}
      {!user?.is_verified && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-5 rounded-2xl bg-warning/8 border border-warning/25 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white text-sm mb-0.5">Identity Verification Pending</div>
            <div className="text-muted text-xs">An admin will verify your account. You'll be notified when approved.</div>
          </div>
        </motion.div>
      )}

      {/* Wallet banner */}
      {!user?.wallet_address && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-5 rounded-2xl bg-accent/8 border border-accent/25 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white text-sm mb-0.5">Connect Your Wallet</div>
            <div className="text-muted text-xs">Use the wallet button in the header to link your MetaMask wallet.</div>
          </div>
        </motion.div>
      )}

      {/* Active Elections */}
      {activeElections.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-xl text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live Elections
          </h2>
          <div className="grid gap-4">
            {activeElections.map((election) => (
              <motion.div
                key={election.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="card-hover rounded-2xl border-success/20"
              >
                <Link to={`/elections/${election.id}`} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
                    <Vote className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold text-white text-sm truncate">{election.title}</h3>
                      <ElectionStatusBadge status={election.status} />
                    </div>
                    <div className="text-xs text-muted">
                      Ends {format(new Date(election.end_time), 'MMM d, yyyy h:mm a')} · {election.total_votes} votes cast
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* My Vote History */}
      <div>
        <h2 className="font-display font-semibold text-xl text-white mb-4">My Vote History</h2>
        {votes.length === 0 ? (
          <div className="card rounded-2xl text-center py-12">
            <Vote className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm">You haven't cast any votes yet.</p>
            <Link to="/elections" className="text-accent text-sm hover:underline mt-2 inline-block">
              Browse elections →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {votes.map((vote) => (
              <div key={vote.id} className="card rounded-2xl flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">Election #{vote.election}</div>
                  <div className="text-xs text-muted font-mono truncate">{vote.blockchain_tx_hash}</div>
                </div>
                <div className="text-xs text-muted shrink-0">{format(new Date(vote.voted_at), 'MMM d, yyyy')}</div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${vote.blockchain_tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline shrink-0"
                >
                  View ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}