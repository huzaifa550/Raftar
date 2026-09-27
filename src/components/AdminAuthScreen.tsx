import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AdminAuthScreenProps {
  onSuccess: (adminToken: string, adminUser: any) => void;
  onToast: (msg: string, isError?: boolean) => void;
  onBackToApp?: () => void;
}

export const AdminAuthScreen: React.FC<AdminAuthScreenProps> = ({
  onSuccess,
  onToast,
  onBackToApp,
}) => {
  const [email, setEmail] = useState<string>('huzaifa24615@gmail.com');
  const [password, setPassword] = useState<string>('huzaifa@7786');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your admin email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your admin password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onToast(`Welcome, Super Admin ${data.data.user.fullName}!`);
        onSuccess(data.data.accessToken, data.data.user);
      } else {
        const msg = data.error?.message || 'Authentication failed. Please verify credentials.';
        setErrorMessage(msg);
        onToast(msg, true);
      }
    } catch (err: any) {
      const msg = err.message || 'Network error while contacting authentication gateway';
      setErrorMessage(msg);
      onToast(msg, true);
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = () => {
    setEmail('huzaifa24615@gmail.com');
    setPassword('huzaifa@7786');
    setErrorMessage(null);
    onToast('Preset admin credentials populated!');
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#212121] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative Brand Gradient Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FFC107]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#E53935]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-[#E0E0E0] rounded-3xl shadow-xl p-8 relative z-10 space-y-6">
        {/* Card Header with Raftaar Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFC107] text-[#212121] shadow-md border border-[#FFD54F]">
            <ShieldAlert className="w-8 h-8 text-[#212121]" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E53935] text-white">
                Restricted Access
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFC107] text-[#212121]">
                Super Admin Tower
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">
              Raftaar Admin Portal
            </h1>
            <p className="text-xs text-[#666666]">
              Sign in with authorized administrative credentials to manage merchants, riders, orders, and system settings.
            </p>
          </div>
        </div>

        {/* Quick Credential Preset Helper */}
        <div className="bg-[#FFFDF7] border border-[#FFC107]/60 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#212121] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E53935]" />
              Authorized Credentials
            </span>
            <button
              type="button"
              onClick={handleFillCredentials}
              className="text-[11px] font-bold text-[#E53935] hover:text-[#C62828] hover:underline"
            >
              Click to Auto-Fill
            </button>
          </div>
          <div className="text-[11px] font-mono bg-white p-2.5 rounded-xl border border-[#E0E0E0] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#666666]">Email:</span>
              <span className="font-bold text-[#212121]">huzaifa24615@gmail.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666666]">Password:</span>
              <span className="font-bold text-[#212121]">huzaifa@7786</span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#212121] flex items-center justify-between">
              <span>Admin Email</span>
              <span className="text-[10px] text-[#666666] font-normal">Super Admin Account</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#666666]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="huzaifa24615@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white focus:ring-2 focus:ring-[#FFC107]/20 transition"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#212121] flex items-center justify-between">
              <span>Security Password</span>
              <span className="text-[10px] text-[#666666] font-normal">Required</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#666666]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white focus:ring-2 focus:ring-[#FFC107]/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#666666] hover:text-[#212121]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] active:bg-[#FFA000] text-[#212121] font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#212121] border-t-transparent rounded-full animate-spin" />
                <span>Authenticating Security Gateway...</span>
              </span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Sign In to Admin Panel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Disclaimers & Back Navigation */}
        <div className="pt-2 border-t border-[#E0E0E0] flex items-center justify-between text-[11px] text-[#666666]">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="flex items-center gap-1 font-semibold text-[#666666] hover:text-[#212121] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Marketplace</span>
            </button>
          )}

          <div className="flex items-center gap-1 ml-auto text-[10px] text-[#666666]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit TLS Secured</span>
          </div>
        </div>
      </div>
    </div>
  );
};
