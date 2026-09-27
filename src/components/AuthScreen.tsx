import React, { useState } from 'react';
import {
  ShoppingBag,
  ShieldAlert,
  Smartphone,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Store,
  Bike,
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: any, token: string, initialSurface?: string) => void;
  onToast: (msg: string, isError?: boolean) => void;
  lang: 'en' | 'ur';
  initialTab?: 'customer' | 'admin';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onToast,
  lang,
  initialTab = 'customer',
}) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>(initialTab);

  // Customer Login Form State
  const [customerPhone, setCustomerPhone] = useState<string>('03001111111');
  const [customerName, setCustomerName] = useState<string>('Hamza Tariq');
  const [customerLoading, setCustomerLoading] = useState<boolean>(false);

  // Admin Login Form State
  const [adminEmail, setAdminEmail] = useState<string>('huzaifa24615@gmail.com');
  const [adminPassword, setAdminPassword] = useState<string>('huzaifa@7786');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Customer Sign In
  const handleCustomerLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setCustomerLoading(true);

    try {
      // Fast demo persona switch or standard OTP verify
      const res = await fetch('/api/v1/auth/switch-demo-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onToast(`Welcome to Raftaar, ${customerName || data.data.user.fullName}!`);
        onLoginSuccess(data.data.user, data.data.accessToken, 'discovery');
      } else {
        const msg = data.error?.message || 'Login failed. Please check phone number.';
        setErrorMessage(msg);
        onToast(msg, true);
      }
    } catch (err: any) {
      const msg = err.message || 'Error communicating with authentication server';
      setErrorMessage(msg);
      onToast(msg, true);
    } finally {
      setCustomerLoading(false);
    }
  };

  // 2. Admin Sign In
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!adminEmail.trim()) {
      setErrorMessage('Admin email is required.');
      return;
    }
    if (!adminPassword) {
      setErrorMessage('Admin password is required.');
      return;
    }

    setAdminLoading(true);
    try {
      const res = await fetch('/api/v1/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail.trim(),
          password: adminPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onToast(`Admin login successful. Welcome, ${data.data.user.fullName}!`);
        onLoginSuccess(data.data.user, data.data.accessToken, 'admin_panel');
      } else {
        const msg = data.error?.message || 'Invalid admin credentials.';
        setErrorMessage(msg);
        onToast(msg, true);
      }
    } catch (err: any) {
      const msg = err.message || 'Error logging into admin portal';
      setErrorMessage(msg);
      onToast(msg, true);
    } finally {
      setAdminLoading(false);
    }
  };

  // 3. Quick One-Click Demo Role Login
  const handleQuickRoleLogin = async (role: string, surface: string) => {
    setCustomerLoading(true);
    try {
      const res = await fetch('/api/v1/auth/switch-demo-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onToast(`Signed in as ${role.toUpperCase().replace('_', ' ')}!`);
        onLoginSuccess(data.data.user, data.data.accessToken, surface);
      } else {
        onToast('Sign in failed', true);
      }
    } catch (err: any) {
      onToast(`Error: ${err.message}`, true);
    } finally {
      setCustomerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#212121] flex flex-col justify-center items-center px-4 py-8 relative">
      {/* Decorative Brand Circles */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#FFC107]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#E53935]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-[#E0E0E0] rounded-3xl shadow-xl p-8 relative z-10 space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFC107] text-[#212121] font-black text-2xl shadow-sm border border-[#FFD54F]">
            <span>رفتار</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">
              Sign In to Raftaar
            </h1>
            <p className="text-xs text-[#666666]">
              {lang === 'ur'
                ? 'اپنے اکاؤنٹ میں لاگ ان کریں اور فوری ڈیلیوری کا لطف اٹھائیں'
                : 'Log in to your account to order food, grocery or manage the marketplace'}
            </p>
          </div>
        </div>

        {/* Tab Switcher: Customer vs Admin Portal */}
        <div className="flex p-1 bg-[#F5F5F5] rounded-2xl border border-[#E0E0E0]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('customer');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'customer'
                ? 'bg-white text-[#212121] shadow-xs'
                : 'text-[#666666] hover:text-[#212121]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#E53935]" />
            <span>Customer Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-[#FFC107] text-[#212121] shadow-xs'
                : 'text-[#666666] hover:text-[#212121]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#212121]" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: Customer Login */}
        {activeTab === 'customer' ? (
          <div className="space-y-4">
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#212121]">Mobile Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#666666]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0300-1234567"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#212121]">Your Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#666666]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Hamza Tariq"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={customerLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#E53935] hover:bg-[#C62828] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
              >
                {customerLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Enter Marketplace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Personas */}
            <div className="pt-3 border-t border-[#E0E0E0] space-y-2">
              <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider block text-center">
                Or Quick-Access Role Persona
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('customer', 'discovery')}
                  className="p-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[11px] font-bold text-[#212121] border border-[#E0E0E0] flex flex-col items-center gap-1 transition"
                >
                  <ShoppingBag className="w-4 h-4 text-[#E53935]" />
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('restaurant_partner', 'merchant_portal')}
                  className="p-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[11px] font-bold text-[#212121] border border-[#E0E0E0] flex flex-col items-center gap-1 transition"
                >
                  <Store className="w-4 h-4 text-[#FFC107]" />
                  <span>Restaurant</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('rider', 'rider_app')}
                  className="p-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[11px] font-bold text-[#212121] border border-[#E0E0E0] flex flex-col items-center gap-1 transition"
                >
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span>Rider</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: Admin Portal Login */
          <div className="space-y-4">
            <div className="bg-[#FFFDF7] border border-[#FFC107]/60 rounded-2xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#212121]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#E53935]" />
                  Super Admin Credentials
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('huzaifa24615@gmail.com');
                    setAdminPassword('huzaifa@7786');
                    setErrorMessage(null);
                  }}
                  className="text-[10px] font-bold text-[#E53935] hover:underline"
                >
                  Fill huzaifa24615
                </button>
              </div>
              <div className="text-[11px] font-mono bg-white p-2 rounded-xl border border-[#E0E0E0] space-y-0.5">
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

            <form onSubmit={handleAdminLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#212121]">Admin Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#666666]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="huzaifa24615@gmail.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#212121]">Admin Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#666666]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="huzaifa@7786"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#666666] hover:text-[#212121]"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
              >
                {adminLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-[#212121]" />
                    <span>Sign In to Admin Panel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
