import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Clock, Users, CheckCircle2, Vote, ExternalLink,
  ArrowLeft, Zap, Shield, AlertTriangle, Loader2
} from 'lucide-react';
import api from '../utils/api';
import { useWeb3 } from '../utils/useWeb3';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function ElectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { account, connect, castVoteOnChain, isCorrectNetwork, switchToSepolia } = useWeb3();

  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [registering, setRegistering] = useState(false);

  const fetchElection = () => {
    setLoading(true);
    api.get(`/elections/${id}/`)
      .then(r => {
        setElection(r.data);
        if (r.data.user_has_voted) setVoted(true);
      })
      .catch(() => toast.error('Election not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchElection(); }, [id]);

  const handleRegister = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setRegistering(true);
    try {
      await api.post('/voter/register/', { election_id: id });
      toast.success('Registration submitted! Awaiting admin approval.');
      fetchElection();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleVote = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!account) {
      const addr = await connect();
      if (!addr) return;
    }
    if (!isCorrectNetwork) {
      await switchToSepolia();
      toast('Switched to Sepolia. Please try voting again.', { icon: '⚠️' });
      return;
    }
    if (!selected) { toast.error('Select a candidate first'); return; }

    const candidate = election.candidates.find(c => c.id === selected);
    if (!candidate?.blockchain_candidate_id) {
      toast.error('Candidate not yet on blockchain');
      return;
    }

    setVoting(true);
    const toastId = toast.loading('Waiting for MetaMask confirmation...');
    try {
      const { txHash: hash } = await castVoteOnChain(
        election.blockchain_election_id,
        candidate.blockchain_candidate_id
      );
      toast.loading('Transaction submitted, waiting for confirmation...', { id: toastId });

      // Record in backend
      await api.post('/vote/', {
        election_id: election.id,
        candidate_id: candidate.id,
        tx_hash: hash,
      });

      setTxHash(hash);
      setVoted(true);
      toast.success('🗳️ Vote cast successfully!', { id: toastId, duration: 5000 });
      fetchElection();
    } catch (err) {
      const msg = err?.info?.error?.message || err?.message || 'Vote failed';
      toast.error(msg.length > 80 ? 'Transaction rejected or failed.' : msg, { id: toastId });
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <p className="text-muted">Election not found.</p>
      </div>
    );
  }

  const isLive = election.status === 'active';
  const isUpcoming = election.status === 'upcoming';
  const regStatus = election.user_registration?.status;
  const canVote = isLive && isAuthenticated && regStatus === 'blockchain_registered' && !voted;

  return (
    <div className="min-h-screen bg-void">
      {/* Minimal top nav */}
      <div className="bg-ink/80 backdrop-blur-xl border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-muted hover:text-white hover:bg-surface transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="font-display font-semibold text-white text-sm line-clamp-1">{election.title}</div>
          <div className="ml-auto flex items-center gap-2">
            {isLive && (
              <span className="badge bg-success/15 text-success border border-success/30">
                <span className="live-dot" /> Live
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Election header */}
        <div className="card rounded-2xl">
          <div className="flex flex-wrap gap-3 mb-4">
            {election.blockchain_election_id && (
              <span className="badge bg-ink border border-border text-muted font-mono">
                Chain ID #{election.blockchain_election_id}
              </span>
            )}
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">{election.title}</h1>
          <p className="text-muted leading-relaxed mb-6">{election.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Vote, label: 'Votes Cast', value: election.total_votes.toLocaleString() },
              { icon: Users, label: 'Candidates', value: election.candidates_count },
              { icon: Clock, label: 'Start', value: format(new Date(election.start_time), 'MMM d, h:mm a') },
              { icon: Clock, label: isLive ? 'Ends' : 'Ended', value: isLive ? formatDistanceToNow(new Date(election.end_time), { addSuffix: true }) : format(new Date(election.end_time), 'MMM d, h:mm a') },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-surface rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted text-xs mb-1">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </div>
                <div className="font-display font-semibold text-white text-sm">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Status / Action banners */}
        {voted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl bg-success/10 border border-success/30 flex items-center gap-4"
          >
            <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
            <div>
              <div className="font-display font-semibold text-white mb-1">Vote Recorded on Blockchain!</div>
              {txHash && (
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-success hover:underline font-mono flex items-center gap-1">
                  {txHash.slice(0, 16)}...{txHash.slice(-8)} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </motion.div>
        )}

        {!isAuthenticated && isLive && (
          <div className="p-5 rounded-2xl bg-accent/8 border border-accent/25 flex items-center gap-4">
            <Zap className="w-6 h-6 text-accent shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-white text-sm mb-0.5">Sign in to vote</div>
              <div className="text-muted text-xs">Create an account and verify your identity to participate.</div>
            </div>
            <Link to="/register" className="btn-primary text-sm px-4 py-2 shrink-0">Sign Up</Link>
          </div>
        )}

        {isAuthenticated && !regStatus && isLive && !voted && (
          <div className="p-5 rounded-2xl bg-accent/8 border border-accent/25 flex items-center gap-4">
            <Shield className="w-6 h-6 text-accent shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-white text-sm mb-0.5">Register to Vote</div>
              <div className="text-muted text-xs">You need to register for this election before casting a ballot.</div>
            </div>
            <button onClick={handleRegister} disabled={registering} className="btn-primary text-sm px-4 py-2 shrink-0">
              {registering ? 'Registering...' : 'Register'}
            </button>
          </div>
        )}

        {isAuthenticated && regStatus === 'pending' && (
          <div className="p-5 rounded-2xl bg-warning/8 border border-warning/25 flex items-center gap-4">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <div>
              <div className="font-medium text-white text-sm mb-0.5">Registration Pending</div>
              <div className="text-muted text-xs">An admin will review and approve your voter registration shortly.</div>
            </div>
          </div>
        )}

        {/* Candidates */}
        <div>
          <h2 className="font-display font-semibold text-xl text-white mb-5">
            Candidates
            {canVote && <span className="text-muted text-sm font-body font-normal ml-2">— Select one to vote</span>}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {election.candidates.map((candidate) => {
              const isSelected = selected === candidate.id;
              return (
                <motion.div
                  key={candidate.id}
                  whileHover={canVote ? { scale: 1.01 } : {}}
                  whileTap={canVote ? { scale: 0.99 } : {}}
                  onClick={() => canVote && setSelected(candidate.id)}
                  className={`card rounded-2xl transition-all duration-200
                    ${canVote ? 'cursor-pointer' : ''}
                    ${isSelected ? 'border-accent shadow-accent' : canVote ? 'hover:border-accent/40' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-xl font-display font-bold text-accent shrink-0">
                      {candidate.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display font-semibold text-white">{candidate.name}</h3>
                          <div className="text-sm text-muted mt-0.5">{candidate.party}</div>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                      {candidate.description && (
                        <p className="text-muted text-xs mt-2 line-clamp-2">{candidate.description}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Vote button */}
          <AnimatePresence>
            {canVote && selected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-6 flex justify-center"
              >
                <button
                  onClick={handleVote}
                  disabled={voting}
                  className="btn-primary px-10 py-4 text-base shadow-accent-lg"
                >
                  {voting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Broadcasting to Blockchain...</>
                  ) : (
                    <><Vote className="w-4 h-4" /> Cast My Vote</>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results link */}
        {(election.status === 'ended' || election.status === 'results_published' || election.total_votes > 0) && (
          <div className="text-center">
            <Link
              to={`/results/${id}`}
              className="btn-ghost px-8 py-3 text-sm"
            >
              <BarChart3 className="w-4 h-4" /> View Live Results
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}