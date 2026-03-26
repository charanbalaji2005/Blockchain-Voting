import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Eye, Lock, ChevronRight, Vote, BarChart3, Users, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Tamper-Proof',
    desc: 'Every vote is immutably recorded on the Ethereum blockchain. No entity can alter or delete votes.',
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
  },
  {
    icon: Eye,
    title: 'Fully Transparent',
    desc: 'All transactions are publicly verifiable on Sepolia Etherscan. Audit the entire election yourself.',
    color: 'text-cyan-glow',
    bg: 'bg-cyan-glow/10 border-cyan-glow/20',
  },
  {
    icon: Lock,
    title: 'Privacy Preserved',
    desc: 'Your identity is verified off-chain. On-chain, only your wallet address is recorded.',
    color: 'text-gold',
    bg: 'bg-gold/10 border-gold/20',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    desc: 'Live vote tallies directly from the smart contract. No waiting, no manual counting.',
    color: 'text-success',
    bg: 'bg-success/10 border-success/20',
  },
];

const stats = [
  { label: 'Elections Held', value: '124+', icon: Vote },
  { label: 'Votes Cast', value: '48,200+', icon: BarChart3 },
  { label: 'Registered Voters', value: '12,500+', icon: Users },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' }
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void overflow-x-hidden font-body">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">VoteChain</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/elections" className="text-sm text-muted hover:text-white transition-colors">Elections</Link>
            <a href="#features" className="text-sm text-muted hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted hover:text-white transition-colors">How it Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-glow/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-mono mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Live on Sepolia Testnet
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display font-extrabold text-5xl md:text-7xl text-white leading-[1.05] tracking-tight mb-6"
          >
            Democracy Secured
            <br />
            <span className="gradient-text">On the Blockchain</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            VoteChain is a fully decentralized voting platform. Every ballot is a smart contract transaction — 
            immutable, auditable, and trustless.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="btn-primary text-base px-8 py-4 shadow-accent">
              Start Voting <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/elections" className="btn-ghost text-base px-8 py-4">
              View Elections
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-3xl font-display font-bold text-white mb-1">{value}</div>
                <div className="text-xs text-muted font-mono">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-12 bg-gradient-to-b from-border to-transparent" />
          <div className="text-xs text-muted font-mono">scroll</div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-muted text-xs font-mono mb-4">
              Core Properties
            </div>
            <h2 className="font-display font-bold text-4xl text-white mb-4">
              Why Blockchain Voting?
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              Traditional voting systems rely on trust. VoteChain eliminates it — every action is mathematically verifiable.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={`card-hover border rounded-2xl p-8 ${f.bg}`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-void/50 flex items-center justify-center mb-5 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-xl text-white mb-3">{f.title}</h3>
                <p className="text-muted leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 bg-ink/40">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl text-white mb-4">How It Works</h2>
            <p className="text-muted">From registration to verified result in 4 steps.</p>
          </motion.div>

          <div className="space-y-4">
            {[
              { step: '01', title: 'Create Account & Verify Identity', desc: 'Register with your email and submit your national ID for off-chain verification. This ensures one-person-one-vote.' },
              { step: '02', title: 'Connect MetaMask Wallet', desc: 'Link your Ethereum wallet on Sepolia testnet. Your wallet address becomes your voting identity on-chain.' },
              { step: '03', title: 'Register for an Election', desc: 'Admin approves your registration and calls registerVoter() on the smart contract, whitelisting your address.' },
              { step: '04', title: 'Cast Your Vote On-Chain', desc: 'Click "Vote", confirm the MetaMask transaction. Your vote is permanently recorded on the blockchain.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex gap-6 p-6 card rounded-2xl"
              >
                <div className="font-display font-bold text-4xl text-border shrink-0 w-16 text-right">{item.step}</div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-white mb-2">{item.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="card rounded-3xl p-12 border-accent/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-glow-accent pointer-events-none" />
            <h2 className="font-display font-bold text-4xl text-white mb-4 relative">
              Ready to Vote?
            </h2>
            <p className="text-muted mb-8 relative">
              Join thousands of verified voters participating in transparent, blockchain-secured elections.
            </p>
            <Link to="/register" className="btn-primary text-base px-10 py-4 shadow-accent-lg relative">
              Create Free Account <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="font-display font-semibold text-white text-sm">VoteChain</span>
          </div>
          <p className="text-xs text-muted font-mono">
            Smart Contract: {' '}
            <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Sepolia Etherscan ↗
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}