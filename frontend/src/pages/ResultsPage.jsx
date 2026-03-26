import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { Trophy, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const COLORS = ['#6C63FF', '#00E5FF', '#FFD700', '#00E676', '#FF4757', '#FF6B35', '#A29BFE'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-card">
      <div className="font-display font-semibold text-white text-sm mb-1">{payload[0].name}</div>
      <div className="text-muted text-xs">{payload[0].value.toLocaleString()} votes · {payload[0].payload.percentage}%</div>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchResults = () => {
    api.get(`/elections/${id}/results/`)
      .then(r => { setData(r.data); setLastUpdated(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResults();
    // Auto-refresh every 15s if live
    const interval = setInterval(fetchResults, 15000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  const { election, total_votes, candidates, winner, status } = data;

  return (
    <div className="min-h-screen bg-void">
      <div className="bg-ink/80 backdrop-blur-xl border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link to={`/elections/${id}`} className="p-2 rounded-lg text-muted hover:text-white hover:bg-surface">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-display font-semibold text-white">Results — {election}</span>
          <button onClick={fetchResults} className="ml-auto p-2 rounded-lg text-muted hover:text-white hover:bg-surface">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display font-bold text-4xl text-white mb-2">{election}</h1>
          <p className="text-muted font-mono text-sm">
            {total_votes.toLocaleString()} votes · Last updated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        {/* Winner card */}
        {winner && (status === 'ended' || status === 'results_published') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card rounded-2xl border-gold/30 bg-gold/5 text-center p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-glow-accent pointer-events-none opacity-30" />
            <Trophy className="w-12 h-12 text-gold mx-auto mb-4" />
            <div className="text-gold text-xs font-mono uppercase tracking-widest mb-2">Winner</div>
            <h2 className="font-display font-bold text-3xl text-white mb-1">{winner.name}</h2>
            <p className="text-muted mb-3">{winner.party}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30">
              <span className="font-display font-bold text-gold text-xl">{winner.vote_count.toLocaleString()}</span>
              <span className="text-gold/70 text-sm">votes · {winner.percentage}%</span>
            </div>
          </motion.div>
        )}

        {/* Candidate bars */}
        <div className="card rounded-2xl">
          <h3 className="font-display font-semibold text-white mb-6">Vote Distribution</h3>
          <div className="space-y-4">
            {candidates.map((c, i) => (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {i === 0 && winner && (status === 'ended' || status === 'results_published') && (
                      <Trophy className="w-4 h-4 text-gold" />
                    )}
                    <span className="font-medium text-white text-sm">{c.name}</span>
                    <span className="text-xs text-muted">{c.party}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-white text-sm">{c.vote_count.toLocaleString()}</span>
                    <span className="text-muted text-xs ml-1">({c.percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.percentage}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Bar chart */}
          <div className="card rounded-2xl">
            <h3 className="font-display font-semibold text-white mb-5 text-sm">Votes by Candidate</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={candidates} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,99,255,0.05)' }} />
                <Bar dataKey="vote_count" radius={[6, 6, 0, 0]}>
                  {candidates.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="card rounded-2xl">
            <h3 className="font-display font-semibold text-white mb-5 text-sm">Vote Share</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={candidates}
                  dataKey="vote_count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                >
                  {candidates.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: 11 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blockchain verification */}
        <div className="card rounded-2xl border-accent/20 bg-accent/5 text-center py-6">
          <p className="text-muted text-sm mb-3">Results are publicly verifiable on the blockchain.</p>
          <a
            href="https://sepolia.etherscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-accent text-sm hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Verify on Sepolia Etherscan
          </a>
        </div>
      </div>
    </div>
  );
}