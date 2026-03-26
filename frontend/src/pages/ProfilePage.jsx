import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Wallet, Shield, Save, Check, Copy, ExternalLink } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useWeb3 } from '../utils/useWeb3';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, fetchProfile } = useAuthStore();
  const { account, connect } = useWeb3();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/me/', form);
      fetchProfile();
      toast.success('Profile updated!');
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectWallet = async () => {
    const addr = await connect();
    if (addr) {
      await api.patch('/auth/me/', { wallet_address: addr });
      fetchProfile();
      toast.success('Wallet linked!');
    }
  };

  const copyWallet = () => {
    navigator.clipboard.writeText(user?.wallet_address || '');
    toast.success('Copied!');
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl text-white mb-1">Profile</h1>
        <p className="text-muted text-sm">Manage your identity and wallet settings</p>
      </div>

      {/* Identity status */}
      <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
        user?.is_verified ? 'bg-success/8 border-success/25' : 'bg-warning/8 border-warning/25'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          user?.is_verified ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="font-medium text-white text-sm mb-0.5">
            {user?.is_verified ? 'Identity Verified' : 'Pending Verification'}
          </div>
          <div className="text-xs text-muted">
            {user?.is_verified
              ? 'Your identity has been verified. You can vote in elections.'
              : 'An admin will verify your identity. This is required for voting.'}
          </div>
        </div>
        {user?.is_verified && <Check className="w-5 h-5 text-success ml-auto shrink-0" />}
      </div>

      {/* Personal info */}
      <div className="card rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            <User className="w-4 h-4" />
          </div>
          <h2 className="font-display font-semibold text-white">Personal Information</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white mb-2 font-medium">First Name</label>
              <input className="input" value={form.first_name} onChange={e => setForm(p => ({...p, first_name: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm text-white mb-2 font-medium">Last Name</label>
              <input className="input" value={form.last_name} onChange={e => setForm(p => ({...p, last_name: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white mb-2 font-medium">Email</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm text-white mb-2 font-medium">Phone</label>
            <input className="input" value={form.phone_number} onChange={e => setForm(p => ({...p, phone_number: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm text-muted mb-2 font-medium">Username (read-only)</label>
            <input className="input opacity-60 cursor-not-allowed" value={user?.username || ''} readOnly />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary mt-6">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Wallet */}
      <div className="card rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            <Wallet className="w-4 h-4" />
          </div>
          <h2 className="font-display font-semibold text-white">Wallet</h2>
        </div>

        {user?.wallet_address ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
            <span className="font-mono text-sm text-white flex-1 truncate">{user.wallet_address}</span>
            <button onClick={copyWallet} className="p-2 rounded-lg text-muted hover:text-white hover:bg-card transition-all">
              <Copy className="w-4 h-4" />
            </button>
            <a href={`https://sepolia.etherscan.io/address/${user.wallet_address}`} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted hover:text-accent transition-all">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="text-center py-6">
            <Wallet className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm mb-4">No wallet linked. Connect MetaMask to vote.</p>
            <button onClick={handleConnectWallet} className="btn-primary">
              <Wallet className="w-4 h-4" /> Connect MetaMask
            </button>
          </div>
        )}
      </div>
    </div>
  );
}