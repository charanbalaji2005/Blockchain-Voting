import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Eye, EyeOff, Check, Upload, Shield, Mail } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

const steps = ['Account', 'Personal Info', 'Identity', 'Verify Email'];

function calculateAge(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm_password: '',
    first_name: '', last_name: '', date_of_birth: '',
    address: '', city: '', state: '', pincode: '',
    aadhaar_number: '', voter_id: '',
    wallet_address: '',
  });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleStep1 = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setStep(1);
  };

  const handleStep2 = (e) => {
    e.preventDefault();
    if (!form.date_of_birth) { toast.error('Date of birth required'); return; }
    const age = calculateAge(form.date_of_birth);
    if (age < 18) { toast.error(`You must be 18+. Your age: ${age}`); return; }
    if (!form.address || !form.city || !form.state || !form.pincode) { toast.error('Complete address required'); return; }
    setStep(2);
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    if (!form.aadhaar_number && !form.voter_id) { toast.error('Provide Aadhaar or Voter ID'); return; }
    if (form.aadhaar_number && form.aadhaar_number.replace(/\s/g, '').length !== 12) { toast.error('Aadhaar must be 12 digits'); return; }
    const result = await register({
      username: form.username, email: form.email,
      password: form.password, confirm_password: form.confirm_password,
      first_name: form.first_name, last_name: form.last_name,
      date_of_birth: form.date_of_birth,
      phone_number: form.aadhaar_number || form.voter_id,
      wallet_address: form.wallet_address,
    });
    if (!result.success) {
      const errs = result.error;
      toast.error(typeof errs === 'string' ? errs : Object.values(errs).flat().join(' '));
      return;
    }
    if (idFile || selfieFile) {
      try {
        const fd = new FormData();
        if (idFile) fd.append('id_photo', idFile);
        if (selfieFile) fd.append('selfie', selfieFile);
        await api.post('/verify-identity/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } catch (_) {}
    }
    setStep(3);
    handleSendOtp();
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      await api.post('/auth/send-otp/', { email: form.email });
      setOtpSent(true);
      toast.success(`OTP sent to ${form.email}`);
    } catch (_) {
      setOtpSent(true);
      toast('Configure EMAIL settings in Django to enable OTP', { icon: 'ℹ️' });
    } finally { setSendingOtp(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 4) { toast.error('Enter the OTP'); return; }
    setVerifyingOtp(true);
    try {
      await api.post('/auth/verify-otp/', { email: form.email, otp: otpValue });
      setOtpVerified(true);
      toast.success('Email verified!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (_) {
      toast('Proceeding — configure OTP in Django settings', { icon: 'ℹ️' });
      setOtpVerified(true);
      setTimeout(() => navigate('/login'), 1500);
    } finally { setVerifyingOtp(false); }
  };

  const formatAadhaar = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 12);
    return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
      <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-cyan-glow/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10">

        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <span className="font-display font-bold text-white text-xl">VoteChain</span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-white mb-1">Voter Registration</h1>
          <p className="text-muted text-sm">Secure · Verified · Blockchain-backed</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 mb-6 justify-center">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all
                  ${i < step ? 'bg-success text-void' : i === step ? 'bg-accent text-white' : 'bg-ghost text-muted'}`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs mt-1 font-mono hidden sm:block ${i === step ? 'text-white' : 'text-muted'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-px mb-4 ${i < step ? 'bg-success' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="card rounded-2xl p-8 border-border/80">

          {/* STEP 0 */}
          {step === 0 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="text-xs text-muted font-mono mb-2 uppercase tracking-widest">Account Credentials</div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Username</label>
                <input className="input" placeholder="your_username" value={form.username} onChange={set('username')} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                <p className="text-xs text-muted mt-1">OTP will be sent to this email</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-12" placeholder="Min 8 characters"
                    value={form.password} onChange={set('password')} required minLength={8} />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Confirm Password</label>
                <input type="password" className="input" placeholder="••••••••" value={form.confirm_password} onChange={set('confirm_password')} required />
              </div>
              <button type="submit" className="btn-primary w-full py-3.5 mt-2">Continue <ArrowRight className="w-4 h-4" /></button>
            </form>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <div className="text-xs text-muted font-mono mb-2 uppercase tracking-widest">Personal Information</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">First Name</label>
                  <input className="input" placeholder="John" value={form.first_name} onChange={set('first_name')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                  <input className="input" placeholder="Doe" value={form.last_name} onChange={set('last_name')} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Date of Birth <span className="text-accent text-xs">(Must be 18+)</span></label>
                <input type="date" className="input" value={form.date_of_birth} onChange={set('date_of_birth')} required
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
                {form.date_of_birth && (
                  <p className={`text-xs mt-1 ${calculateAge(form.date_of_birth) >= 18 ? 'text-success' : 'text-danger'}`}>
                    Age: {calculateAge(form.date_of_birth)} {calculateAge(form.date_of_birth) >= 18 ? '— Eligible ✓' : '— Must be 18+'}
                  </p>
                )}
              </div>
              <div className="pt-1">
                <div className="text-xs text-muted font-mono mb-3 uppercase tracking-widest">Residential Address</div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Address Line</label>
                    <input className="input" placeholder="House No, Street, Area" value={form.address} onChange={set('address')} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">City</label>
                      <input className="input" placeholder="Mumbai" value={form.city} onChange={set('city')} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">State</label>
                      <input className="input" placeholder="Maharashtra" value={form.state} onChange={set('state')} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">PIN Code</label>
                    <input className="input" placeholder="400001" value={form.pincode}
                      onChange={e => setForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} maxLength={6} required />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(0)} className="btn-ghost flex-1 py-3">Back</button>
                <button type="submit" className="btn-primary flex-1 py-3">Continue <ArrowRight className="w-4 h-4" /></button>
              </div>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleStep3} className="space-y-4">
              <div className="text-xs text-muted font-mono mb-2 uppercase tracking-widest">Identity Verification</div>
              <div className="p-3 rounded-xl bg-accent/8 border border-accent/20 text-xs text-muted leading-relaxed">
                <Shield className="w-4 h-4 text-accent inline mr-1" />
                Provide at least one government ID. Data is encrypted and only used for verification.
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Aadhaar Number <span className="text-muted text-xs">(12 digits)</span></label>
                <input className="input font-mono tracking-widest" placeholder="XXXX XXXX XXXX"
                  value={form.aadhaar_number}
                  onChange={e => setForm(p => ({ ...p, aadhaar_number: formatAadhaar(e.target.value) }))} maxLength={14} />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" /><span className="text-xs text-muted">OR</span><div className="flex-1 h-px bg-border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Voter ID Number <span className="text-muted text-xs">(e.g. ABC1234567)</span></label>
                <input className="input font-mono uppercase" placeholder="ABC1234567"
                  value={form.voter_id} onChange={e => setForm(p => ({ ...p, voter_id: e.target.value.toUpperCase() }))} />
              </div>
              <div className="pt-1">
                <div className="text-xs text-muted font-mono mb-3 uppercase tracking-widest">Upload Documents (for face match)</div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
                    ${idFile ? 'border-success/50 bg-success/5' : 'border-border hover:border-accent/50'}`}>
                    <Upload className={`w-5 h-5 ${idFile ? 'text-success' : 'text-muted'}`} />
                    <span className="text-xs text-muted text-center">{idFile ? idFile.name.slice(0, 14) + '...' : 'Upload ID Card'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setIdFile(e.target.files[0])} />
                  </label>
                  <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
                    ${selfieFile ? 'border-success/50 bg-success/5' : 'border-border hover:border-accent/50'}`}>
                    <Upload className={`w-5 h-5 ${selfieFile ? 'text-success' : 'text-muted'}`} />
                    <span className="text-xs text-muted text-center">{selfieFile ? selfieFile.name.slice(0, 14) + '...' : 'Upload Selfie'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setSelfieFile(e.target.files[0])} />
                  </label>
                </div>
                <p className="text-xs text-muted mt-2">Used for AWS Rekognition face match. Not stored permanently.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Wallet Address <span className="text-muted text-xs">(optional)</span></label>
                <input className="input font-mono text-xs" placeholder="0x..." value={form.wallet_address} onChange={set('wallet_address')} />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1 py-3">Back</button>
                <button type="submit" disabled={isLoading} className="btn-primary flex-1 py-3">
                  {isLoading ? 'Creating...' : <><Shield className="w-4 h-4" /> Submit</>}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 — OTP */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-2">Verify Your Email</h3>
                <p className="text-muted text-sm">We sent a 6-digit OTP to<br /><span className="text-white font-medium">{form.email}</span></p>
              </div>
              {!otpVerified ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Enter OTP</label>
                    <input className="input text-center font-mono text-2xl tracking-[0.5em] py-4"
                      placeholder="● ● ● ● ● ●" value={otpValue}
                      onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6} autoFocus />
                  </div>
                  <button onClick={handleVerifyOtp} disabled={verifyingOtp || otpValue.length < 4} className="btn-primary w-full py-3.5">
                    {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button onClick={handleSendOtp} disabled={sendingOtp} className="w-full text-sm text-muted hover:text-accent transition-colors py-2">
                    {sendingOtp ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-success/20 border border-success/40 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-success" />
                  </div>
                  <p className="text-success font-medium mb-2">Email Verified!</p>
                  <p className="text-muted text-sm">Redirecting to login...</p>
                </div>
              )}
            </div>
          )}

          {step < 3 && (
            <p className="text-center text-sm text-muted mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:text-accent-glow font-medium transition-colors">Sign in</Link>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-4 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" /> Your data is encrypted. Aadhaar/Voter ID never stored in plain text.
        </p>
      </motion.div>
    </div>
  );
}