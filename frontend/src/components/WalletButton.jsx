import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Check, AlertTriangle, ExternalLink, Copy } from 'lucide-react';
import { useWeb3 } from '../utils/useWeb3';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

function shortenAddress(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function WalletButton() {
  const { account, connect, isConnecting, isCorrectNetwork, switchToSepolia, chainId } = useWeb3();
  const { user, fetchProfile } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = async () => {
    const addr = await connect();
    if (addr && user) {
      try {
        await api.patch('/auth/me/', { wallet_address: addr });
        fetchProfile();
        toast.success('Wallet linked to your account!');
      } catch (_) {}
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    toast.success('Address copied!');
  };

  if (!account) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/15 text-accent border border-accent/30 
                   text-sm font-display font-semibold transition-all hover:bg-accent/25 disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-mono font-medium transition-all
          ${isCorrectNetwork
            ? 'bg-success/10 text-success border-success/30 hover:bg-success/20'
            : 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20'
          }`}
      >
        {isCorrectNetwork ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        {shortenAddress(account)}
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-64 bg-card border border-border rounded-2xl p-3 shadow-card z-50"
          >
            <div className="px-2 py-2 mb-2">
              <div className="text-xs text-muted mb-1">Connected Wallet</div>
              <div className="font-mono text-sm text-white">{shortenAddress(account)}</div>
              <div className={`flex items-center gap-1.5 mt-1 text-xs ${isCorrectNetwork ? 'text-success' : 'text-warning'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isCorrectNetwork ? 'bg-success' : 'bg-warning'} animate-pulse`} />
                {isCorrectNetwork ? 'Sepolia Testnet' : `Wrong Network (${chainId})`}
              </div>
            </div>
            <div className="border-t border-border my-2" />
            <button
              onClick={copyAddress}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted hover:text-white hover:bg-surface transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Address
            </button>
            <a
              href={`https://sepolia.etherscan.io/address/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted hover:text-white hover:bg-surface transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View on Etherscan
            </a>
            {!isCorrectNetwork && (
              <button
                onClick={() => { switchToSepolia(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-warning hover:bg-warning/10 transition-all mt-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Switch to Sepolia
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}
    </div>
  );
}