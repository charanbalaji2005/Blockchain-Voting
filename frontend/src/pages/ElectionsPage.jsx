import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Vote, Clock, Users, ArrowRight, Filter } from 'lucide-react';
import api from '../utils/api';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_FILTERS = ['all', 'active', 'upcoming', 'ended', 'results_published'];

function StatusBadge({ status }) {
  const map = {
    active: { label: 'Live', cls: 'bg-success/15 text-success border-success/30' },
    upcoming: { label: 'Upcoming', cls: 'bg-accent/15 text-accent border-accent/30' },
    ended: { label: 'Ended', cls: 'bg-ghost text-muted border-border' },
    draft: { label: 'Draft', cls: 'bg-ghost text-muted border-border' },
    results_published: { label: 'Results', cls: 'bg-gold/15 text-gold border-gold/30' },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`badge border ${s.cls}`}>
      {status === 'active' && <span className="live-dot" />}
      {s.label}
    </span>
  );
}

function ElectionCard({ election, index }) {
  const isLive = election.status === 'active';
  const now = new Date();
  const end = new Date(election.end_time);
  const start = new Date(election.start_time);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link
        to={`/elections/${election.id}`}
        className={`block card rounded-2xl hover:border-accent/30 hover:shadow-glow-sm transition-all duration-300 group
          ${isLive ? 'border-success/20' : ''}`}
      >
        {/* Banner placeholder */}
        <div className={`h-2 w-full rounded-t-xl mb-5 -mt-6 -mx-6 px-6
          ${isLive ? 'bg-gradient-to-r from-success/40 via-success/20 to-transparent' : 'bg-gradient-to-r from-accent/20 via-accent/10 to-transparent'}`}
          style={{ marginTop: '-1.5rem', paddingTop: 0, height: '3px', borderRadius: '1rem 1rem 0 0', marginLeft: '-1.5rem', marginRight: '-1.5rem', width: 'calc(100% + 3rem)' }}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={election.status} />
              {election.blockchain_election_id && (
                <span className="badge bg-ink border border-border text-muted text-xs font-mono">
                  #{election.blockchain_election_id}
                </span>
              )}
            </div>
            <h3 className="font-display font-semibold text-lg text-white mb-2 group-hover:text-accent transition-colors line-clamp-2">
              {election.title}
            </h3>
            <p className="text-muted text-sm line-clamp-2 mb-4">{election.description}</p>

            <div className="flex items-center gap-5 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {election.total_votes.toLocaleString()} votes
              </div>
              <div className="flex items-center gap-1.5">
                <Vote className="w-3.5 h-3.5" />
                {election.candidates_count} candidates
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {isLive
                  ? `Ends ${formatDistanceToNow(end, { addSuffix: true })}`
                  : now < start
                    ? `Starts ${formatDistanceToNow(start, { addSuffix: true })}`
                    : `Ended ${format(end, 'MMM d, yyyy')}`}
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted group-hover:text-accent transition-colors shrink-0 mt-1" />
        </div>
      </Link>
    </motion.div>
  );
}

export default function ElectionsPage() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filter !== 'all') params.set('status', filter);
    params.set('ordering', '-created_at');

    api.get(`/elections/?${params}`)
      .then(r => setElections(r.data.results || r.data || []))
      .catch(() => setElections([]))
      .finally(() => setLoading(false));
  }, [search, filter]);

  return (
    <div className="min-h-screen bg-void">
      {/* Simple header for non-authed users */}
      <div className="bg-ink/80 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-bold text-white">VoteChain</Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display font-bold text-4xl text-white mb-2">Elections</h1>
          <p className="text-muted">All blockchain-verified elections. Click to view details and vote.</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              className="input pl-10"
              placeholder="Search elections..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted" />
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium capitalize transition-all
                  ${filter === f ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-white border border-border hover:border-accent/40'}`}
              >
                {f === 'results_published' ? 'results' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card rounded-2xl animate-pulse h-40" />
            ))}
          </div>
        ) : elections.length === 0 ? (
          <div className="card rounded-2xl text-center py-16">
            <Vote className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="font-display font-semibold text-white mb-2">No elections found</h3>
            <p className="text-muted text-sm">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {elections.map((election, i) => (
              <ElectionCard key={election.id} election={election} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}