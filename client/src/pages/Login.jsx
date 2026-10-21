import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';

export default function Login() {
  const { login, googleLogin, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification state
  const [step, setStep] = useState('login'); // 'login' | 'otp'
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      toast.success('Welcome back');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Login failed';
      setError(status ? `${message} (HTTP ${status})` : message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleCredential(credential) {
    setError('');
    setLoading(true);
    try {
      const res = await googleLogin(credential);
      if (res?.requireOtp) {
        setOtpEmail(res.email);
        setStep('otp');
        toast.success(`OTP sent to ${res.email}`);
      } else {
        toast.success('Signed in with Google');
        navigate(res.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Google sign-in failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp.trim()) return;
    setError('');
    setLoading(true);
    try {
      const user = await verifyOtp({ email: otpEmail, otp: otp.trim() });
      toast.success('Email verified successfully!');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid or expired OTP';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setResending(true);
    setError('');
    try {
      await resendOtp(otpEmail);
      toast.success('A new code has been sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      {step === 'otp' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => {
                setStep('login');
                setOtp('');
                setError('');
              }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
              <Mail size={12} /> Email Verification
            </span>
          </div>

          <h1 className="text-2xl font-bold">Check your Gmail</h1>
          <p className="mt-1 text-sm text-slate-500">
            We sent a 6-digit verification code to <span className="font-semibold text-slate-700 dark:text-slate-300">{otpEmail}</span>.
          </p>

          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <div>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-center text-xs text-slate-400">Enter the 6-digit code</p>
            </div>

            {error && <p className="text-sm text-center text-rose-500">{error}</p>}

            <button
              disabled={loading || otp.length < 6}
              className="w-full rounded-xl bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="font-medium text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                {resending ? <RefreshCw size={12} className="animate-spin" /> : null}
                {resending ? 'Sending...' : 'Resend code'}
              </button>
            </p>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to access campus events and your dashboard.</p>

          {/* Google Sign-in */}
          <div className="mt-8">
            <GoogleSignInButton
              onCredentialReceived={handleGoogleCredential}
              disabled={loading}
            />
          </div>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
            <span className="px-3 text-xs text-slate-400 uppercase tracking-wider">or sign in with email</span>
            <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Login with Email'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500 text-center">
            New here?{' '}
            <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
