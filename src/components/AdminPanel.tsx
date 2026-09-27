import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Bike,
  Receipt,
  Users,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Send,
  Activity,
  Smartphone,
  Eye,
  Sliders,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
  LogOut,
  Store,
  ShoppingBag,
  X,
  Sparkles,
  MapPin,
  Phone,
  Percent,
} from 'lucide-react';
import { AdminAuthScreen } from './AdminAuthScreen.tsx';

interface Props {
  accessToken: string | null;
  currentUser?: any;
  onToast: (msg: string, isError?: boolean) => void;
  lang: 'en' | 'ur';
  onAdminLogout?: () => void;
  onBackToApp?: () => void;
}

export const AdminPanel: React.FC<Props> = ({
  accessToken,
  currentUser,
  onToast,
  lang,
  onAdminLogout,
  onBackToApp,
}) => {
  // Admin authentication state: require explicit admin session
  const [adminUser, setAdminUser] = useState<any | null>(() => {
    if (
      currentUser?.roles?.includes('super_admin') &&
      currentUser?.email === 'huzaifa24615@gmail.com'
    ) {
      return currentUser;
    }
    return null;
  });

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    if (
      currentUser?.roles?.includes('super_admin') &&
      currentUser?.email === 'huzaifa24615@gmail.com'
    ) {
      return accessToken;
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'merchants' | 'riders' | 'orders' | 'users' | 'audit_logs' | 'twilio' | 'claude'>('overview');
  const [loading, setLoading] = useState<boolean>(false);

  // Claude AI state
  const [claudeStatus, setClaudeStatus] = useState<any>(null);
  const [claudePrompt, setClaudePrompt] = useState<string>('Write a 3-course signature Pakistani BBQ special menu for a restaurant in Karachi.');
  const [claudeResult, setClaudeResult] = useState<string | null>(null);
  const [claudeLoading, setClaudeLoading] = useState<boolean>(false);

  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search & filter states
  const [merchantSearch, setMerchantSearch] = useState<string>('');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  // Selected Order for Admin Status Override
  const [overrideOrderId, setOverrideOrderId] = useState<string | null>(null);
  const [overrideTargetStatus, setOverrideTargetStatus] = useState<string>('DELIVERED');
  const [overrideOtp, setOverrideOtp] = useState<string>('123456');

  // Test SMS state
  const [testSmsPhone, setTestSmsPhone] = useState<string>('03001234567');
  const [testSmsStatus, setTestSmsStatus] = useState<string | null>(null);

  // Add Merchant Modal State
  const [showAddMerchantModal, setShowAddMerchantModal] = useState<boolean>(false);
  const [addMerchantSubmitting, setAddMerchantSubmitting] = useState<boolean>(false);
  const [newMerchantForm, setNewMerchantForm] = useState({
    name: '',
    nameUrdu: '',
    type: 'restaurant' as 'restaurant' | 'shop',
    cuisines: 'Pakistani, Fast Food',
    area: 'Clifton',
    address: 'Block 4, Clifton, Karachi',
    phone: '0300-1234567',
    commissionRate: 15,
    minOrderAmount: 500, // in Rs
    baseDeliveryFee: 70, // in Rs
    description: '',
  });

  // Add Rider Modal State
  const [showAddRiderModal, setShowAddRiderModal] = useState<boolean>(false);
  const [addRiderSubmitting, setAddRiderSubmitting] = useState<boolean>(false);
  const [newRiderForm, setNewRiderForm] = useState({
    name: '',
    nameUrdu: '',
    phone: '0300-4444444',
    cnic: '42201-1234567-1',
    vehicleType: 'motorcycle' as 'motorcycle' | 'bicycle',
    vehicleNumber: 'KHI-CD-2024 (Honda CD70)',
    area: 'Clifton',
    maxCashLimit: 15000, // in Rs
  });

  // Safe JSON response parser that prevents Unexpected token '<' errors
  const parseResponseJson = async (res: Response) => {
    try {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return {
          success: false,
          error: { message: `Server returned non-JSON response (${res.status})` },
        };
      }
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        error: { message: e?.message || 'Invalid JSON response from server' },
      };
    }
  };

  const currentEffectiveToken = adminToken || accessToken;

  const fetchAdminData = async () => {
    if (!currentEffectiveToken) return;
    setLoading(true);
    try {
      // 1. Platform Metrics
      try {
        const metRes = await fetch('/api/v1/finance/metrics', {
          headers: { Authorization: `Bearer ${currentEffectiveToken}` },
        });
        if (metRes.ok) {
          const mData = await parseResponseJson(metRes);
          if (mData?.success) setMetrics(mData.data);
        }
      } catch (err: any) {
        console.warn('Metrics fetch notice:', err.message);
      }

      // 2. Merchants List
      try {
        const merchRes = await fetch('/api/v1/catalog/merchants', {
          headers: { Authorization: `Bearer ${currentEffectiveToken}` },
        });
        if (merchRes.ok) {
          const mData = await parseResponseJson(merchRes);
          if (mData?.success) setMerchants(mData.data);
        }
      } catch (err: any) {
        console.warn('Merchants fetch notice:', err.message);
      }

      // 3. Riders List
      try {
        const ridersRes = await fetch('/api/v1/dispatch/riders', {
          headers: { Authorization: `Bearer ${currentEffectiveToken}` },
        });
        if (ridersRes.ok) {
          const rData = await parseResponseJson(ridersRes);
          if (rData?.success) setRiders(rData.data);
        }
      } catch (err: any) {
        console.warn('Riders fetch notice:', err.message);
      }

      // 4. All Platform Orders
      try {
        const ordRes = await fetch('/api/v1/orders', {
          headers: { Authorization: `Bearer ${currentEffectiveToken}` },
        });
        if (ordRes.ok) {
          const oData = await parseResponseJson(ordRes);
          if (oData?.success) setOrders(oData.data);
        }
      } catch {
        // Gracefully ignore transient background poll errors
      }

      // 5. System Users
      try {
        const usersRes = await fetch('/api/v1/rbac/users', {
          headers: { Authorization: `Bearer ${currentEffectiveToken}` },
        });
        if (usersRes.ok) {
          const uData = await parseResponseJson(usersRes);
          if (uData?.success) setUsers(uData.data);
        }
      } catch (err: any) {
        console.warn('Users fetch notice:', err.message);
      }

      // 6. Audit Logs
      try {
        const auditRes = await fetch('/api/v1/rbac/audit-logs?limit=80', {
          headers: { Authorization: `Bearer ${currentEffectiveToken}` },
        });
        if (auditRes.ok) {
          const aData = await parseResponseJson(auditRes);
          if (aData?.success) setAuditLogs(aData.data);
        }
      } catch (err: any) {
        console.warn('Audit logs fetch notice:', err.message);
      }
    } catch (err: any) {
      console.warn('Admin fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaudeStatus = async () => {
    try {
      const res = await fetch('/api/v1/claude/status');
      const data = await parseResponseJson(res);
      if (data?.success) {
        setClaudeStatus(data.data);
      }
    } catch (err: any) {
      console.warn('Claude status fetch notice:', err.message);
    }
  };

  const handleTestClaudePrompt = async (customPrompt?: string) => {
    const textToSend = customPrompt || claudePrompt;
    if (!textToSend.trim()) return;
    setClaudeLoading(true);
    setClaudeResult(null);
    try {
      const res = await fetch('/api/v1/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend }),
      });
      const data = await parseResponseJson(res);
      if (data?.success && data.data?.text) {
        setClaudeResult(data.data.text);
        onToast(`Claude response received (Source: ${data.data.source})!`);
      } else {
        onToast('Claude call returned empty response', true);
      }
    } catch (err: any) {
      onToast(`Claude error: ${err.message}`, true);
    } finally {
      setClaudeLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken || (currentUser?.roles?.includes('super_admin') && currentUser?.email === 'huzaifa24615@gmail.com')) {
      fetchAdminData();
      fetchClaudeStatus();
    }
  }, [adminToken, accessToken]);

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    onToast('Logged out from Super Admin Panel');
    if (onAdminLogout) onAdminLogout();
  };

  // Create Merchant Handler
  const handleCreateMerchant = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMerchantForm.name.trim()) {
      onToast('Partner name is required', true);
      return;
    }
    setAddMerchantSubmitting(true);
    try {
      const res = await fetch('/api/v1/catalog/merchants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentEffectiveToken}`,
        },
        body: JSON.stringify({
          name: newMerchantForm.name.trim(),
          nameUrdu: newMerchantForm.nameUrdu.trim() || newMerchantForm.name.trim(),
          type: newMerchantForm.type,
          cuisines: newMerchantForm.cuisines.split(',').map((c) => c.trim()),
          area: newMerchantForm.area,
          address: newMerchantForm.address,
          phone: newMerchantForm.phone,
          commissionRate: Number(newMerchantForm.commissionRate),
          minOrderAmount: Math.round(Number(newMerchantForm.minOrderAmount) * 100),
          baseDeliveryFee: Math.round(Number(newMerchantForm.baseDeliveryFee) * 100),
          description: newMerchantForm.description,
        }),
      });
      const data = await parseResponseJson(res);
      if (res.ok && data.success) {
        onToast(`Partner "${newMerchantForm.name}" created and published!`);
        setShowAddMerchantModal(false);
        setNewMerchantForm({
          name: '',
          nameUrdu: '',
          type: 'restaurant',
          cuisines: 'Pakistani, Fast Food',
          area: 'Clifton',
          address: 'Block 4, Clifton, Karachi',
          phone: '0300-1234567',
          commissionRate: 15,
          minOrderAmount: 500,
          baseDeliveryFee: 70,
          description: '',
        });
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Failed to create partner', true);
      }
    } catch (err: any) {
      onToast(`Error creating partner: ${err.message}`, true);
    } finally {
      setAddMerchantSubmitting(false);
    }
  };

  // Quick Preset Add Handler
  const handleQuickAddPreset = async (preset: {
    name: string;
    nameUrdu: string;
    type: 'restaurant' | 'shop';
    cuisines: string[];
    area: string;
    commissionRate: number;
  }) => {
    try {
      const res = await fetch('/api/v1/catalog/merchants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentEffectiveToken}`,
        },
        body: JSON.stringify({
          ...preset,
          address: `${preset.area}, Karachi`,
          phone: '+923009876543',
          minOrderAmount: 50000,
          baseDeliveryFee: 7000,
        }),
      });
      const data = await parseResponseJson(res);
      if (res.ok && data.success) {
        onToast(`Quick-Added ${preset.name}!`);
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Quick add failed', true);
      }
    } catch (err: any) {
      onToast(`Error: ${err.message}`, true);
    }
  };

  // Delete Merchant Handler
  const handleDeleteMerchant = async (merchantId: string, merchantName: string) => {
    if (!window.confirm(`Are you sure you want to remove merchant "${merchantName}" from the platform?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/catalog/merchants/${merchantId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentEffectiveToken}`,
        },
      });
      const data = await parseResponseJson(res);
      if (res.ok && data.success) {
        onToast(`Merchant "${merchantName}" removed successfully`);
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Delete failed', true);
      }
    } catch (err: any) {
      onToast(`Error: ${err.message}`, true);
    }
  };

  // Rider Onboard Handler
  const handleCreateRider = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newRiderForm.name.trim() || !newRiderForm.phone.trim()) {
      onToast('Rider name and phone number are required', true);
      return;
    }
    setAddRiderSubmitting(true);
    try {
      const res = await fetch('/api/v1/dispatch/riders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentEffectiveToken}`,
        },
        body: JSON.stringify({
          name: newRiderForm.name.trim(),
          nameUrdu: newRiderForm.nameUrdu.trim() || newRiderForm.name.trim(),
          phone: newRiderForm.phone.trim(),
          cnic: newRiderForm.cnic.trim(),
          vehicleType: newRiderForm.vehicleType,
          vehicleNumber: newRiderForm.vehicleNumber.trim(),
          area: newRiderForm.area,
          maxCashLimit: Math.round(Number(newRiderForm.maxCashLimit) * 100),
        }),
      });
      const data = await parseResponseJson(res);
      if (res.ok && data?.success) {
        onToast(`Rider "${newRiderForm.name}" onboarded into active fleet!`);
        setShowAddRiderModal(false);
        setNewRiderForm({
          name: '',
          nameUrdu: '',
          phone: '0300-4444444',
          cnic: '42201-1234567-1',
          vehicleType: 'motorcycle',
          vehicleNumber: 'KHI-CD-2024 (Honda CD70)',
          area: 'Clifton',
          maxCashLimit: 15000,
        });
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Failed to onboard rider', true);
      }
    } catch (err: any) {
      onToast(`Error onboarding rider: ${err.message}`, true);
    } finally {
      setAddRiderSubmitting(false);
    }
  };

  // Quick Preset Rider Add Handler
  const handleQuickAddRiderPreset = async (preset: {
    name: string;
    nameUrdu: string;
    phone: string;
    vehicleType: 'motorcycle' | 'bicycle';
    vehicleNumber: string;
    area: string;
  }) => {
    try {
      const res = await fetch('/api/v1/dispatch/riders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentEffectiveToken}`,
        },
        body: JSON.stringify({
          ...preset,
          cnic: `42${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000000 + Math.random() * 9000000)}-1`,
          maxCashLimit: 1500000,
        }),
      });
      const data = await parseResponseJson(res);
      if (res.ok && data?.success) {
        onToast(`Quick-Onboarded: ${preset.name}!`);
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Quick onboard failed', true);
      }
    } catch (err: any) {
      onToast(`Error: ${err.message}`, true);
    }
  };

  // Delete Rider Handler
  const handleDeleteRider = async (riderId: string, riderName: string) => {
    if (!confirm(`Are you sure you want to remove rider "${riderName}" from the dispatch fleet?`)) return;
    try {
      const res = await fetch(`/api/v1/dispatch/riders/${riderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentEffectiveToken}`,
        },
      });
      const data = await parseResponseJson(res);
      if (res.ok && data?.success) {
        onToast(`Rider "${riderName}" removed from active fleet`);
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Delete rider failed', true);
      }
    } catch (err: any) {
      onToast(`Error: ${err.message}`, true);
    }
  };

  // Merchant actions
  const handleToggleMerchantStatus = async (merchantId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/v1/catalog/merchants/${merchantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        onToast(`Merchant status changed to ${nextStatus.toUpperCase()}`);
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Update failed', true);
      }
    } catch (err: any) {
      onToast(`Error: ${err.message}`, true);
    }
  };

  const handleToggleMerchantOpen = async (merchantId: string, currentOpen: boolean) => {
    try {
      const res = await fetch(`/api/v1/catalog/merchants/${merchantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isOpen: !currentOpen }),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        onToast(`Merchant set to ${!currentOpen ? 'OPEN (Taking Orders)' : 'CLOSED'}`);
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Update failed', true);
      }
    } catch (err: any) {
      onToast(`Error: ${err.message}`, true);
    }
  };

  const handleUpdateCommission = async (merchantId: string, currentRate: number) => {
    const val = prompt('Enter new platform commission percentage (%):', currentRate.toString());
    if (!val) return;
    const rate = parseFloat(val);
    if (isNaN(rate) || rate < 0 || rate > 50) {
      onToast('Invalid commission percentage', true);
      return;
    }
    try {
      const res = await fetch(`/api/v1/catalog/merchants/${merchantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ commissionRate: rate }),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        onToast(`Commission rate set to ${rate}%`);
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Failed', true);
      }
    } catch (err: any) {
      onToast(`Error: ${err.message}`, true);
    }
  };

  // Rider actions
  const handleToggleRiderShift = async (riderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'online' ? 'offline' : 'online';
    try {
      const res = await fetch(`/api/v1/dispatch/riders/${riderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        onToast(`Rider shift set to ${nextStatus.toUpperCase()}`);
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Update failed', true);
      }
    } catch (err: any) {
      onToast(`Error: ${err.message}`, true);
    }
  };

  const handleResetRiderCash = async (riderId: string, riderName: string) => {
    if (!confirm(`Confirm physical cash deposit audit for ${riderName}? This clears their active cash in hand to Rs. 0.`)) return;
    try {
      const res = await fetch(`/api/v1/dispatch/riders/${riderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ resetCashInHand: true }),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        onToast(`Cash in hand cleared for ${riderName}!`);
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Reset failed', true);
      }
    } catch (err: any) {
      onToast(`Error: ${err.message}`, true);
    }
  };

  // Order status override
  const handleAdminStatusOverride = async (orderId: string) => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetStatus: overrideTargetStatus,
          reason: 'Admin Control Tower intervention',
          otp: overrideTargetStatus === 'DELIVERED' ? overrideOtp : undefined,
        }),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        onToast(`Order transitioned to ${overrideTargetStatus}! Twilio notification triggered.`);
        setOverrideOrderId(null);
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Transition failed', true);
      }
    } catch (err: any) {
      onToast(`Transition error: ${err.message}`, true);
    }
  };

  // User role toggle
  const handleToggleUserRole = async (userId: string, currentRoles: string[], targetRole: string) => {
    let nextRoles: string[];
    if (currentRoles.includes(targetRole)) {
      if (currentRoles.length === 1) {
        onToast('User must retain at least one role', true);
        return;
      }
      nextRoles = currentRoles.filter((r) => r !== targetRole);
    } else {
      nextRoles = [...currentRoles, targetRole];
    }

    try {
      const res = await fetch(`/api/v1/rbac/users/${userId}/roles`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentEffectiveToken}`,
        },
        body: JSON.stringify({ roles: nextRoles }),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        onToast(`Roles updated: [${nextRoles.join(', ')}]`);
        fetchAdminData();
      } else {
        onToast(data.error?.message || 'Role update failed', true);
      }
    } catch (err: any) {
      onToast(`Role update error: ${err.message}`, true);
    }
  };

  const handleTestTwilioSms = async () => {
    try {
      setTestSmsStatus('Dispatching test message via Twilio REST API...');
      const res = await fetch('/api/v1/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testSmsPhone }),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        setTestSmsStatus(`Twilio Dispatched! Provider: ${data.data?.provider} | OTP: ${data.data?.mockOtpCode}`);
        onToast(`Twilio SMS dispatched to ${testSmsPhone}!`);
      } else {
        setTestSmsStatus(`Error: ${data.error?.message}`);
        onToast('Twilio dispatch failed', true);
      }
    } catch (err: any) {
      setTestSmsStatus(`Error: ${err.message}`);
      onToast(`Twilio error: ${err.message}`, true);
    }
  };

  // Enforce security: if not logged in as Admin, show Admin Authentication Screen
  if (!adminUser || !adminToken) {
    return (
      <AdminAuthScreen
        onSuccess={(token, user) => {
          setAdminToken(token);
          setAdminUser(user);
          onToast(`Super Admin unlocked: ${user.fullName}`);
        }}
        onToast={onToast}
        onBackToApp={onBackToApp}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#FFFDF7] text-[#212121] min-h-screen">
      {/* Top Banner - Header has White background with Yellow/Red branding */}
      <div className="bg-white text-[#212121] p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFC107] text-[#212121] flex items-center gap-1.5 shadow-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-[#212121]" />
              <span>Super Admin Control Tower</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E53935] text-white shadow-xs">
              Live Production
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              Admin: {adminUser?.fullName || 'Huzaifa'} ({adminUser?.email || 'huzaifa24615@gmail.com'})
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#212121] tracking-tight">
            Raftaar Marketplace Administration & Operations Desk
          </h1>
          <p className="text-[#666666] text-sm">
            Merchant KYC & Parameters • Fleet Operations • Order Interventions • Multi-Role RBAC • Immutable Audit Trails • Twilio Gateway
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="px-3.5 py-2 bg-[#FFC107] text-[#212121] hover:bg-[#FFD54F] text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Systems</span>
          </button>

          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-[#E53935] border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
            title="Log Out from Super Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#F5F5F5] rounded-2xl border border-[#E0E0E0] overflow-x-auto">
        {[
          { id: 'overview', label: 'Command Overview', icon: Activity },
          { id: 'merchants', label: `Merchants (${merchants.length})`, icon: Building2 },
          { id: 'riders', label: `Rider Fleet (${riders.length})`, icon: Bike },
          { id: 'orders', label: `Orders Pipeline (${orders.length})`, icon: Receipt },
          { id: 'users', label: `Users & RBAC (${users.length})`, icon: Users },
          { id: 'audit_logs', label: `Audit Trail (${auditLogs.length})`, icon: History },
          { id: 'twilio', label: 'Twilio SMS Monitor', icon: Smartphone },
          { id: 'claude', label: 'Claude AI Gateway', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
                active
                  ? 'bg-[#FFC107] text-[#212121] shadow-xs'
                  : 'text-[#666666] hover:text-[#212121] hover:bg-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#212121]' : 'text-[#666666]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Command Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-[#E0E0E0] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[#666666] text-xs font-semibold">
                <span>Platform GMV</span>
                <DollarSign className="w-4 h-4 text-[#FFC107]" />
              </div>
              <div className="text-2xl font-black text-[#212121]">
                Rs. {((metrics?.totalGmv || 0) / 100).toLocaleString('en-PK')}
              </div>
              <p className="text-[11px] text-[#666666]">Gross transaction volume delivered</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E0E0E0] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[#666666] text-xs font-semibold">
                <span>Platform Net Revenue</span>
                <TrendingUp className="w-4 h-4 text-[#E53935]" />
              </div>
              <div className="text-2xl font-black text-[#E53935]">
                Rs. {((metrics?.totalPlatformRevenue || 0) / 100).toLocaleString('en-PK')}
              </div>
              <p className="text-[11px] text-[#666666]">Commissions earned + platform tech service fees</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E0E0E0] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[#666666] text-xs font-semibold">
                <span>Riders on Shift</span>
                <Bike className="w-4 h-4 text-[#FFC107]" />
              </div>
              <div className="text-2xl font-black text-[#212121]">
                {riders.filter((r) => r.status === 'online' || r.status === 'busy').length} / {riders.length} Active
              </div>
              <p className="text-[11px] text-[#666666]">Motorcycles circulating across Karachi hubs</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E0E0E0] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[#666666] text-xs font-semibold">
                <span>Registered Merchants</span>
                <Building2 className="w-4 h-4 text-[#E53935]" />
              </div>
              <div className="text-2xl font-black text-[#212121]">
                {merchants.filter((m) => m.status === 'active').length} / {merchants.length} Active
              </div>
              <p className="text-[11px] text-[#666666]">Restaurants & Grocery stores</p>
            </div>
          </div>

          {/* System Services Status Grid */}
          <div className="p-6 bg-white rounded-2xl border border-[#E0E0E0] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#212121] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#E53935]" />
              <span>Core Operational Infrastructure Status</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
                <span className="text-[#666666] block font-semibold">Twilio SMS Engine</span>
                <div className="flex items-center gap-1.5 text-[#212121] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#FFC107]" />
                  <span>Twilio REST Active</span>
                </div>
                <p className="text-[10px] text-[#666666]">OTP + Delivery SMS enabled</p>
              </div>

              <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
                <span className="text-[#666666] block font-semibold">State Machine Engine</span>
                <div className="flex items-center gap-1.5 text-[#212121] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#FFC107]" />
                  <span>Enforcing Strict RBAC</span>
                </div>
                <p className="text-[10px] text-[#666666]">IDOR + 6-digit OTP guards</p>
              </div>

              <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
                <span className="text-[#666666] block font-semibold">Settlement Dispatch Rail</span>
                <div className="flex items-center gap-1.5 text-[#212121] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#FFC107]" />
                  <span>SBP Raast + 1-Link</span>
                </div>
                <p className="text-[10px] text-[#666666]">Instant merchant disbursements</p>
              </div>

              <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
                <span className="text-[#666666] block font-semibold">Audit Logging System</span>
                <div className="flex items-center gap-1.5 text-[#212121] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#FFC107]" />
                  <span>{auditLogs.length} Events Captured</span>
                </div>
                <p className="text-[10px] text-[#666666]">Verifiable state record</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Merchants Management */}
      {activeTab === 'merchants' && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#212121]">Merchant Partners & KYC Governance</h3>
              <p className="text-xs text-[#666666]">
                Manage operational status, kitchen hours, commission splits, and add new restaurants or shops.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#666666]" />
                <input
                  type="text"
                  placeholder="Filter merchants..."
                  value={merchantSearch}
                  onChange={(e) => setMerchantSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#E0E0E0] rounded-xl text-xs text-[#212121] placeholder-[#666666] focus:outline-none focus:border-[#FFC107]"
                />
              </div>

              <button
                onClick={() => setShowAddMerchantModal(true)}
                className="px-4 py-2 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Restaurant / Shop</span>
              </button>
            </div>
          </div>

          {/* Quick Onboarding Presets Bar */}
          <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#FFC107]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#212121] flex items-center gap-1.5 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#E53935]" />
              <span>1-Click Onboard Presets:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { name: 'KFC Clifton', nameUrdu: 'کے ایف سی کلفٹن', type: 'restaurant' as const, cuisines: ['Fast Food', 'Burgers', 'Fried Chicken'], area: 'Clifton', commissionRate: 15 },
                { name: 'Naheed Supermarket', nameUrdu: 'ناہید سپر مارکیٹ', type: 'shop' as const, cuisines: ['Grocery', 'Dairy', 'Personal Care'], area: 'Bahadurabad', commissionRate: 10 },
                { name: 'Bundu Khan BBQ', nameUrdu: 'بندو خان کباب', type: 'restaurant' as const, cuisines: ['Pakistani', 'BBQ', 'Tikka'], area: 'Gulshan', commissionRate: 14 },
                { name: 'Al-Fatah Gourmet Mart', nameUrdu: 'الفتح گورمے مارٹ', type: 'shop' as const, cuisines: ['Supermarket', 'Imported Foods', 'Bakery'], area: 'DHA Phase 6', commissionRate: 12 },
                { name: 'Espresso Artisan Cafe', nameUrdu: 'اسپریسو کیفے', type: 'restaurant' as const, cuisines: ['Coffee', 'Desserts', 'Breakfast'], area: 'Clifton Block 4', commissionRate: 16 },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleQuickAddPreset(preset)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FFC107]/20 border border-[#E0E0E0] text-[11px] font-semibold text-[#212121] transition shadow-2xs flex items-center gap-1"
                >
                  <span>+</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121]">
              <thead className="bg-[#F5F5F5] text-[#212121] uppercase text-[10px] font-bold tracking-wider border-b border-[#E0E0E0]">
                <tr>
                  <th className="p-3">Store / Restaurant</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Area</th>
                  <th className="p-3">Commission %</th>
                  <th className="p-3">Min Order</th>
                  <th className="p-3">Kitchen Status</th>
                  <th className="p-3">KYC Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {merchants
                  .filter((m) => m.name.toLowerCase().includes(merchantSearch.toLowerCase()))
                  .map((m) => (
                    <tr key={m.id} className="hover:bg-[#FFFDF7] transition">
                      <td className="p-3">
                        <span className="font-bold text-[#212121] block">{m.name}</span>
                        <span className="text-[10px] text-[#666666] font-mono">{m.slug}</span>
                      </td>
                      <td className="p-3">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F5F5] text-[#212121] border border-[#E0E0E0]">
                          {m.type === 'shop' ? '🛒 Shop' : '🍽️ Restaurant'}
                        </span>
                      </td>
                      <td className="p-3 text-[#666666]">{m.area || 'Karachi'}</td>
                      <td className="p-3 font-bold text-[#212121]">
                        {m.commissionRate || 15}%
                        <button
                          onClick={() => handleUpdateCommission(m.id, m.commissionRate || 15)}
                          className="ml-2 text-[10px] text-[#E53935] hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                      <td className="p-3 text-[#666666]">
                        Rs. {((m.minOrderAmount || 0) / 100).toLocaleString('en-PK')}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleMerchantOpen(m.id, m.isOpen)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition shadow-xs ${
                            m.isOpen
                              ? 'bg-[#FFC107] text-[#212121]'
                              : 'bg-[#F5F5F5] text-[#666666] border border-[#E0E0E0]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${m.isOpen ? 'bg-[#212121]' : 'bg-[#E53935]'}`} />
                          <span>{m.isOpen ? 'OPEN' : 'CLOSED'}</span>
                        </button>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-xs ${
                            m.status === 'active'
                              ? 'bg-[#FFC107] text-[#212121]'
                              : 'bg-[#E53935] text-white'
                          }`}
                        >
                          {m.status || 'active'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleMerchantStatus(m.id, m.status || 'active')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              (m.status || 'active') === 'active'
                                ? 'border border-[#E53935] text-[#E53935] hover:bg-[#E53935] hover:text-white'
                                : 'bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] shadow-xs'
                            }`}
                          >
                            {(m.status || 'active') === 'active' ? 'Suspend' : 'Approve'}
                          </button>

                          <button
                            onClick={() => handleDeleteMerchant(m.id, m.name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-[#666666] hover:text-[#E53935] transition"
                            title="Delete Merchant Partner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Rider Fleet Management */}
      {activeTab === 'riders' && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#212121]">Rider Fleet & Cash Float Command</h3>
              <p className="text-xs text-[#666666]">
                Track real-time rider shifts, physical COD collections, onboard new riders, and audit cash in hand.
              </p>
            </div>

            <button
              onClick={() => setShowAddRiderModal(true)}
              className="px-4 py-2 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Rider</span>
            </button>
          </div>

          {/* Quick Onboarding Rider Presets Bar */}
          <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#FFC107]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#212121] flex items-center gap-1.5 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#E53935]" />
              <span>1-Click Rider Presets:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { name: 'Hamza Farooq', nameUrdu: 'حمزہ فاروق', phone: '+923007788991', vehicleType: 'motorcycle' as const, vehicleNumber: 'KHI-LEE-9182 (Honda CD70)', area: 'Clifton' },
                { name: 'Asad Ali', nameUrdu: 'اسد علی', phone: '+923008899002', vehicleType: 'motorcycle' as const, vehicleNumber: 'KHI-KAS-3321 (Yamaha YBR)', area: 'Gulshan-e-Iqbal' },
                { name: 'Zubair Shah', nameUrdu: 'زبیر شاہ', phone: '+923009900113', vehicleType: 'motorcycle' as const, vehicleNumber: 'KHI-DHA-7744 (Honda 125)', area: 'DHA Phase 5' },
                { name: 'Usman Riaz', nameUrdu: 'عثمان ریاض', phone: '+923001122334', vehicleType: 'motorcycle' as const, vehicleNumber: 'KHI-EV-1029 (Super Star EV)', area: 'Saddar' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleQuickAddRiderPreset(preset)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FFC107]/20 border border-[#E0E0E0] text-[11px] font-semibold text-[#212121] transition shadow-2xs flex items-center gap-1"
                >
                  <span>+</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121]">
              <thead className="bg-[#FFFDF7] text-[#666666] uppercase text-[10px] font-bold tracking-wider border-b border-[#E0E0E0]">
                <tr>
                  <th className="p-3">Rider Name</th>
                  <th className="p-3">Vehicle Details</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Shift Status</th>
                  <th className="p-3">COD Cash in Hand</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {riders.map((r) => {
                  const cashRupees = (r.cashInHand || 0) / 100;
                  const isNearCeiling = cashRupees >= 10000;
                  return (
                    <tr key={r.id} className="hover:bg-[#FFFDF7]/60 transition">
                      <td className="p-3 font-bold text-[#212121]">
                        {r.name}
                        {r.activeOrderId && (
                          <span className="block text-[10px] text-[#E53935] font-mono">Trip: {r.activeOrderId}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[#212121] font-bold block">{r.vehicleNumber}</span>
                        <span className="text-[10px] text-[#666666]">{r.vehicleType}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#666666]">{r.phone}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'online'
                              ? 'bg-[#FFC107] text-[#212121]'
                              : r.status === 'busy'
                              ? 'bg-[#E53935] text-white'
                              : 'bg-[#F5F5F5] text-[#666666] border border-[#E0E0E0]'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-sm block font-mono text-[#212121]">
                          Rs. {cashRupees.toLocaleString('en-PK')}
                        </span>
                        <span className={`text-[10px] ${isNearCeiling ? 'text-[#E53935] font-bold' : 'text-[#666666]'}`}>
                          {isNearCeiling ? 'Float limit warning' : 'Max Float: Rs. 15,000'}
                        </span>
                      </td>
                      <td className="p-3 text-[#212121] font-bold">
                        <span className="text-[#FFC107] mr-1">★</span>{r.rating}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRiderShift(r.id, r.status)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              r.status === 'online'
                                ? 'border border-[#E0E0E0] bg-white text-[#666666] hover:border-[#E53935] hover:text-[#E53935]'
                                : 'bg-[#FFC107] text-[#212121] hover:bg-[#FFD54F]'
                            }`}
                          >
                            {r.status === 'online' ? 'Set Offline' : 'Set Online'}
                          </button>
                          {cashRupees > 0 && (
                            <button
                              onClick={() => handleResetRiderCash(r.id, r.name)}
                              className="px-2.5 py-1 bg-[#E53935] text-white hover:bg-[#C62828] rounded-lg text-xs font-bold transition shadow-xs"
                            >
                              Audit & Clear Cash
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRider(r.id, r.name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-[#666666] hover:text-[#E53935] transition"
                            title="Remove Rider from Fleet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Live Orders Pipeline & Intervention */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#212121]">Live Orders Control & Admin Intervention</h3>
              <p className="text-xs text-[#666666]">
                Inspect state machine transitions, override stuck deliveries, and trigger automated Twilio customer dispatches.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#666666]" />
              <input
                type="text"
                placeholder="Search order #..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E0E0E0] rounded-xl text-xs text-[#212121] focus:outline-none focus:border-[#FFC107]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121]">
              <thead className="bg-[#FFFDF7] text-[#666666] uppercase text-[10px] font-bold tracking-wider border-b border-[#E0E0E0]">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Merchant</th>
                  <th className="p-3">Customer Phone</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3">Delivery OTP</th>
                  <th className="p-3 text-right">Admin Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {orders
                  .filter((o) => o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()))
                  .map((o) => (
                    <tr key={o.id} className="hover:bg-[#FFFDF7]/60 transition">
                      <td className="p-3 font-mono font-bold text-[#212121]">{o.orderNumber}</td>
                      <td className="p-3 font-bold text-[#212121]">{o.merchantName}</td>
                      <td className="p-3 font-mono text-[11px] text-[#666666]">{o.customerPhone}</td>
                      <td className="p-3 font-bold text-[#212121]">
                        Rs. {(o.pricing.total / 100).toLocaleString('en-PK')}
                      </td>
                      <td className="p-3">
                        <span className="uppercase font-bold text-[10px] text-[#212121] block">{o.payment.method}</span>
                        <span className="text-[10px] text-[#666666] capitalize">{o.payment.status}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.status === 'DELIVERED'
                              ? 'bg-[#FFC107] text-[#212121]'
                              : o.status === 'CANCELLED' || o.status === 'REJECTED'
                              ? 'bg-[#E53935]/15 text-[#E53935] border border-[#E53935]/30'
                              : 'bg-[#E53935] text-white'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-sm font-bold text-[#E53935]">
                        {o.deliveryOtp}
                      </td>
                      <td className="p-3 text-right">
                        {overrideOrderId === o.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={overrideTargetStatus}
                              onChange={(e) => setOverrideTargetStatus(e.target.value)}
                              className="px-2 py-1 bg-white border border-[#E0E0E0] rounded-lg text-xs text-[#212121]"
                            >
                              <option value="DELIVERED">DELIVERED (Twilio SMS)</option>
                              <option value="CANCELLED">CANCELLED</option>
                              <option value="ACCEPTED">ACCEPTED</option>
                              <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                            </select>
                            <button
                              onClick={() => handleAdminStatusOverride(o.id)}
                              className="px-3 py-1 bg-[#FFC107] text-[#212121] hover:bg-[#FFD54F] font-bold rounded-lg text-xs shadow-xs"
                            >
                              Execute
                            </button>
                            <button
                              onClick={() => setOverrideOrderId(null)}
                              className="px-2 py-1 bg-[#F5F5F5] text-[#666666] hover:text-[#212121] rounded-lg text-xs border border-[#E0E0E0]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setOverrideOrderId(o.id);
                              setOverrideOtp(o.deliveryOtp);
                            }}
                            className="px-2.5 py-1 border border-[#E53935] text-[#E53935] hover:bg-[#C62828] hover:text-white hover:border-[#C62828] font-bold rounded-lg text-xs transition"
                          >
                            Override Status
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Users & RBAC */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Platform Users & Role-Based Access Control (RBAC)</h3>
            <p className="text-xs text-[#666666]">
              Assign or revoke roles across Super Admin, Platform Admin, Operations Manager, Finance Staff, Merchant Partner, Rider, and Customer.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121]">
              <thead className="bg-[#FFFDF7] text-[#666666] uppercase text-[10px] font-bold tracking-wider border-b border-[#E0E0E0]">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Assigned Roles</th>
                  <th className="p-3 text-right">Role Management Toggles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FFFDF7]/60 transition">
                    <td className="p-3 font-bold text-[#212121]">{u.fullName}</td>
                    <td className="p-3 font-mono text-[11px] text-[#666666]">{u.phone}</td>
                    <td className="p-3 text-[#666666]">{u.email || '-'}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r: string) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              r === 'super_admin'
                                ? 'bg-[#E53935] text-white'
                                : r === 'admin'
                                ? 'bg-[#C62828] text-white'
                                : r === 'finance_staff'
                                ? 'bg-[#FFC107] text-[#212121]'
                                : 'bg-[#F5F5F5] text-[#212121] border border-[#E0E0E0]'
                            }`}
                          >
                            {r.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {['admin', 'finance_staff', 'rider', 'manager'].map((role) => {
                          const hasRole = u.roles.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => handleToggleUserRole(u.id, u.roles, role)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                                hasRole
                                  ? 'bg-[#E53935] text-white hover:bg-[#C62828]'
                                  : 'bg-white text-[#212121] border border-[#E0E0E0] hover:border-[#FFC107]'
                              }`}
                            >
                              {hasRole ? `- ${role}` : `+ ${role}`}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Immutable Audit Trail */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Immutable Platform Audit Trail</h3>
            <p className="text-xs text-[#666666]">
              Verifiable event stream capturing logins, order state transitions, role updates, and financial operations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121]">
              <thead className="bg-[#FFFDF7] text-[#666666] uppercase text-[10px] font-bold tracking-wider border-b border-[#E0E0E0]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Actor Phone / ID</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Target ID</th>
                  <th className="p-3 text-right">Inspect Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0] font-mono text-[11px]">
                {auditLogs.slice(0, 30).map((log) => (
                  <tr key={log.id} className="hover:bg-[#FFFDF7]/60 transition">
                    <td className="p-3 text-[#666666] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="p-3 text-[#212121] font-bold">{log.action}</td>
                    <td className="p-3 text-[#666666]">{log.resource}</td>
                    <td className="p-3 text-[#666666]">{log.actorPhone || log.actorId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-[#FFC107]/20 text-[#212121] border border-[#FFC107]/40 text-[10px] font-bold">
                        {log.actorRole || 'system'}
                      </span>
                    </td>
                    <td className="p-3 text-[#666666]">{log.targetId || '-'}</td>
                    <td className="p-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedAuditLog(log)}
                        className="px-2.5 py-1 bg-white text-[#E53935] border border-[#E53935] hover:bg-[#C62828] hover:text-white rounded-lg text-xs font-bold transition"
                      >
                        View Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedAuditLog && (
            <div className="p-4 bg-[#FFFDF7] rounded-2xl border border-[#E0E0E0] space-y-2 mt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#212121]">Event Payload: {selectedAuditLog.action}</span>
                <button onClick={() => setSelectedAuditLog(null)} className="text-[#666666] hover:text-[#E53935] font-bold">
                  Close
                </button>
              </div>
              <pre className="text-[11px] font-mono text-[#212121] bg-white p-3 rounded-xl border border-[#E0E0E0] overflow-x-auto">
                {JSON.stringify(selectedAuditLog.diff || selectedAuditLog, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: Twilio SMS Monitor */}
      {activeTab === 'twilio' && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#E53935] text-white">
                Exclusive SMS Provider: Twilio Programmable SMS
              </span>
            </div>
            <h3 className="text-xl font-black text-[#212121] mt-2">Twilio Production REST Gateway</h3>
            <p className="text-xs text-[#666666]">
              Authentication OTP codes and automated order delivery confirmation text messages are strictly dispatched via Twilio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
              <span className="text-xs font-semibold text-[#666666]">Adapter Engine</span>
              <p className="font-mono text-sm font-bold text-[#212121]">TwilioSmsAdapter</p>
              <span className="text-[10px] text-[#E53935] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E53935] inline-block animate-pulse"></span> Active & Configured
              </span>
            </div>

            <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
              <span className="text-xs font-semibold text-[#666666]">API Endpoint</span>
              <p className="font-mono text-xs text-[#212121] truncate">api.twilio.com/2010-04-01/Messages.json</p>
              <span className="text-[10px] text-[#666666] font-mono">HTTPS Basic Auth</span>
            </div>

            <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
              <span className="text-xs font-semibold text-[#666666]">Sender Identifier</span>
              <p className="font-mono text-sm font-bold text-[#212121]">+1800RAFTAR / MessagingService</p>
              <span className="text-[10px] text-[#666666] font-mono">Pakistani Number Normalization</span>
            </div>
          </div>

          {/* Test SMS Dispatcher */}
          <div className="p-5 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-3">
            <h4 className="text-sm font-bold text-[#212121] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#E53935]" />
              <span>Direct Twilio Test Bench</span>
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={testSmsPhone}
                onChange={(e) => setTestSmsPhone(e.target.value)}
                placeholder="+923001234567"
                className="flex-1 px-4 py-2 bg-white border border-[#E0E0E0] rounded-xl text-xs text-[#212121] focus:outline-none focus:border-[#FFC107] font-mono"
              />
              <button
                onClick={handleTestTwilioSms}
                className="px-5 py-2 bg-[#FFC107] text-[#212121] hover:bg-[#FFD54F] font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Twilio Test Message</span>
              </button>
            </div>
            {testSmsStatus && (
              <p className="text-xs font-mono text-[#212121] bg-white p-3 rounded-xl border border-[#E0E0E0]">
                {testSmsStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: Claude AI Gateway */}
      {activeTab === 'claude' && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E0E0E0]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFC107] text-[#212121] flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#E53935]" />
                  <span>Anthropic Claude</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    claudeStatus?.connected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {claudeStatus?.connected ? 'Connected (Live API)' : 'Ready (Awaiting API Key)'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#212121]">
                Anthropic Claude AI Integration Desk
              </h3>
              <p className="text-xs text-[#666666]">
                Power intelligent menu generation, appetizing dish copy, Urdu translations, and marketplace operations using Claude 3.5 Sonnet.
              </p>
            </div>

            <button
              onClick={fetchClaudeStatus}
              className="px-3.5 py-2 bg-[#F5F5F5] hover:bg-[#E0E0E0] text-xs font-bold text-[#212121] rounded-xl flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#666666]" />
              <span>Verify Gateway</span>
            </button>
          </div>

          {/* Connection Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FFFDF7] rounded-2xl border border-[#E0E0E0] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#666666]">Claude Model Engine</span>
              <p className="font-mono text-xs font-bold text-[#212121] truncate">
                {claudeStatus?.model || 'claude-3-5-sonnet-20241022'}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold block">Anthropic SDK v0.78+</span>
            </div>

            <div className="p-4 bg-[#FFFDF7] rounded-2xl border border-[#E0E0E0] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#666666]">Server Proxy Route</span>
              <p className="font-mono text-xs font-bold text-[#212121]">POST /api/v1/claude/generate</p>
              <span className="text-[10px] text-[#666666] block">Protected Backend Handler</span>
            </div>

            <div className="p-4 bg-[#FFFDF7] rounded-2xl border border-[#E0E0E0] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#666666]">Environment Key</span>
              <p className="font-mono text-xs font-bold text-[#212121]">
                {claudeStatus?.connected ? 'ANTHROPIC_API_KEY Configured ✓' : 'ANTHROPIC_API_KEY (Optional)'}
              </p>
              <span className="text-[10px] text-[#666666] block">Configurable via .env file</span>
            </div>
          </div>

          {/* Interactive Test Bench */}
          <div className="p-5 bg-[#FFFDF7] rounded-2xl border border-[#FFC107]/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-[#212121] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#E53935]" />
                <span>Live Claude Prompt Bench</span>
              </h4>
              <span className="text-[11px] text-[#666666]">Test menu item creation or copy generation</span>
            </div>

            {/* Quick Prompt Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#666666]">Try Preset:</span>
              {[
                'Write a 3-course signature Pakistani BBQ special menu for a restaurant in Karachi.',
                'Generate appetizing item descriptions for Chicken Biryani and Beef Bihari Kabab.',
                'Translate this menu description into authentic conversational Urdu: "Slow-cooked mutton shank stew served with ginger, green chilies, and hot tandoori naan".',
                'Write an engaging 2-sentence intro for an organic grocery mart in DHA Phase 6.',
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setClaudePrompt(p);
                    handleTestClaudePrompt(p);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FFC107]/20 border border-[#E0E0E0] text-[11px] font-semibold text-[#212121] transition"
                >
                  Prompt #{idx + 1}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={claudePrompt}
                onChange={(e) => setClaudePrompt(e.target.value)}
                placeholder="Enter prompt for Claude (e.g. Generate marketing copy for seasonal mango feast)..."
                className="w-full p-3 rounded-xl border border-[#E0E0E0] bg-white text-xs text-[#212121] focus:outline-none focus:border-[#FFC107]"
              />

              <div className="flex justify-end">
                <button
                  onClick={() => handleTestClaudePrompt()}
                  disabled={claudeLoading}
                  className="px-5 py-2.5 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-black text-xs rounded-xl transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {claudeLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#212121] border-t-transparent rounded-full animate-spin" />
                      <span>Claude is Thinking...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#E53935]" />
                      <span>Execute Claude Generation</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {claudeResult && (
              <div className="space-y-1.5 pt-2 border-t border-[#E0E0E0]">
                <div className="flex items-center justify-between text-xs font-bold text-[#212121]">
                  <span>Claude Generation Output:</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Response Received ✓
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E0E0E0] text-xs leading-relaxed text-[#212121] whitespace-pre-line shadow-xs">
                  {claudeResult}
                </div>
              </div>
            )}
          </div>

          {/* Connection Documentation Guide */}
          <div className="p-5 bg-white rounded-2xl border border-[#E0E0E0] space-y-3">
            <h4 className="text-sm font-bold text-[#212121] flex items-center gap-2">
              <span>How to Connect Your App with Claude</span>
            </h4>
            <div className="space-y-2 text-xs text-[#666666] leading-relaxed">
              <p>
                <strong>Option 1: Live Anthropic API Connection</strong>
                <br />
                Add your Anthropic API Key to your server environment file (`.env`):
                <code className="block my-1.5 p-2.5 rounded-xl bg-[#F5F5F5] text-[#212121] font-mono text-[11px] border border-[#E0E0E0]">
                  ANTHROPIC_API_KEY=sk-ant-api03-...<br />
                  CLAUDE_MODEL=claude-3-5-sonnet-20241022
                </code>
                The backend service (`server/src/modules/claude/claude.service.ts`) automatically detects your key and connects directly via the official `@anthropic-ai/sdk`.
              </p>
              <p className="pt-1">
                <strong>Option 2: Connecting via Claude Code / Claude Desktop</strong>
                <br />
                If you are using Claude Code CLI or Claude Desktop, point Claude to this project root directory. Claude can directly read, review, and execute commands within this full-stack TypeScript repository.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner / Merchant Modal */}
      {showAddMerchantModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E0E0E0] rounded-3xl max-w-xl w-full p-6 text-[#212121] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E0E0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFC107] text-[#212121] flex items-center justify-center font-bold text-sm">
                  {newMerchantForm.type === 'shop' ? '🛒' : '🍽️'}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#212121]">
                    Register New Marketplace Partner
                  </h3>
                  <p className="text-[11px] text-[#666666]">
                    Onboard new restaurants or grocery/shops directly into production catalog
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMerchantModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#F5F5F5] text-[#666666] hover:text-[#212121] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMerchant} className="space-y-4">
              {/* Partner Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#212121]">Partner Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewMerchantForm({
                        ...newMerchantForm,
                        type: 'restaurant',
                        cuisines: 'Pakistani, Fast Food, Biryani',
                      })
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      newMerchantForm.type === 'restaurant'
                        ? 'bg-[#FFC107] text-[#212121] border-[#FFC107] shadow-xs'
                        : 'bg-[#F5F5F5] text-[#666666] border-[#E0E0E0]'
                    }`}
                  >
                    <Store className="w-4 h-4 text-[#E53935]" />
                    <span>Restaurant / Eatery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setNewMerchantForm({
                        ...newMerchantForm,
                        type: 'shop',
                        cuisines: 'Grocery, Fresh Produce, Dairy',
                      })
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      newMerchantForm.type === 'shop'
                        ? 'bg-[#FFC107] text-[#212121] border-[#FFC107] shadow-xs'
                        : 'bg-[#F5F5F5] text-[#666666] border-[#E0E0E0]'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-[#E53935]" />
                    <span>Grocery & Supermarket</span>
                  </button>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Partner Name (English)</label>
                  <input
                    type="text"
                    required
                    value={newMerchantForm.name}
                    onChange={(e) =>
                      setNewMerchantForm({ ...newMerchantForm, name: e.target.value })
                    }
                    placeholder="e.g. KFC Clifton"
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Urdu Name (اردو نام)</label>
                  <input
                    type="text"
                    value={newMerchantForm.nameUrdu}
                    onChange={(e) =>
                      setNewMerchantForm({ ...newMerchantForm, nameUrdu: e.target.value })
                    }
                    placeholder="مثلاً: کے ایف سی کلفٹن"
                    dir="rtl"
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>
              </div>

              {/* Area & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Area / Neighborhood</label>
                  <select
                    value={newMerchantForm.area}
                    onChange={(e) =>
                      setNewMerchantForm({ ...newMerchantForm, area: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  >
                    <option value="Clifton">Clifton (Karachi)</option>
                    <option value="DHA Phase 5">DHA Phase 5 & 6 (Karachi)</option>
                    <option value="Gulshan-e-Iqbal">Gulshan-e-Iqbal</option>
                    <option value="Bahadurabad">Bahadurabad & PECHS</option>
                    <option value="Saddar">Saddar & Burns Road</option>
                    <option value="North Nazimabad">North Nazimabad</option>
                    <option value="Tariq Road">Tariq Road</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Phone Number</label>
                  <input
                    type="tel"
                    value={newMerchantForm.phone}
                    onChange={(e) =>
                      setNewMerchantForm({ ...newMerchantForm, phone: e.target.value })
                    }
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>
              </div>

              {/* Cuisines / Categories */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#212121]">
                  Cuisines or Categories (Comma-separated)
                </label>
                <input
                  type="text"
                  value={newMerchantForm.cuisines}
                  onChange={(e) =>
                    setNewMerchantForm({ ...newMerchantForm, cuisines: e.target.value })
                  }
                  placeholder="e.g. Fast Food, Burgers, Fried Chicken, Snacks"
                  className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                />
              </div>

              {/* Description & Claude AI generator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#212121]">Store / Restaurant Description</label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newMerchantForm.name) {
                        onToast('Please enter partner name first', true);
                        return;
                      }
                      const prompt = `Write an appetizing, appealing 2-sentence description for a ${newMerchantForm.type === 'shop' ? 'grocery store / mart' : 'restaurant'} named "${newMerchantForm.name}" in ${newMerchantForm.area}, Karachi specializing in ${newMerchantForm.cuisines}.`;
                      try {
                        const res = await fetch('/api/v1/claude/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ prompt }),
                        });
                        const data = await res.json();
                        if (data?.success && data.data?.text) {
                          setNewMerchantForm((prev) => ({ ...prev, description: data.data.text }));
                          onToast('Description generated via Claude AI!');
                        }
                      } catch {
                        onToast('Claude generation failed', true);
                      }
                    }}
                    className="text-[11px] font-bold text-[#E53935] hover:text-[#C62828] flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3 text-[#FFC107]" />
                    <span>Generate with Claude AI</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={newMerchantForm.description}
                  onChange={(e) => setNewMerchantForm({ ...newMerchantForm, description: e.target.value })}
                  placeholder="Appetizing description for marketplace customers..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                />
              </div>

              {/* Financial Parameters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Commission %</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newMerchantForm.commissionRate}
                    onChange={(e) =>
                      setNewMerchantForm({
                        ...newMerchantForm,
                        commissionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Min Order (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newMerchantForm.minOrderAmount}
                    onChange={(e) =>
                      setNewMerchantForm({
                        ...newMerchantForm,
                        minOrderAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Delivery Fee (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={newMerchantForm.baseDeliveryFee}
                    onChange={(e) =>
                      setNewMerchantForm({
                        ...newMerchantForm,
                        baseDeliveryFee: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#E0E0E0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMerchantModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-xs font-bold text-[#212121] transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={addMerchantSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-black text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {addMerchantSubmitting ? 'Registering...' : 'Create & Publish Partner'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Rider Modal */}
      {showAddRiderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E0E0E0] rounded-3xl max-w-lg w-full p-6 text-[#212121] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E0E0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFC107] text-[#212121] flex items-center justify-center font-bold text-sm">
                  🏍️
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#212121]">
                    Onboard New Express Rider
                  </h3>
                  <p className="text-[11px] text-[#666666]">
                    Enroll rider into Raftaar dispatch network with automated live GPS tracking
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddRiderModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#F5F5F5] text-[#666666] hover:text-[#212121] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRider} className="space-y-4">
              {/* Vehicle Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#212121]">Vehicle Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewRiderForm({
                        ...newRiderForm,
                        vehicleType: 'motorcycle',
                        vehicleNumber: 'KHI-CD-2024 (Honda CD70)',
                      })
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      newRiderForm.vehicleType === 'motorcycle'
                        ? 'bg-[#FFC107] text-[#212121] border-[#FFC107] shadow-xs'
                        : 'bg-[#F5F5F5] text-[#666666] border-[#E0E0E0]'
                    }`}
                  >
                    <Bike className="w-4 h-4 text-[#E53935]" />
                    <span>Motorcycle / Bike (70cc / 125cc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setNewRiderForm({
                        ...newRiderForm,
                        vehicleType: 'bicycle',
                        vehicleNumber: 'CYCLE-EXP-01 (Speed Bicycle)',
                      })
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      newRiderForm.vehicleType === 'bicycle'
                        ? 'bg-[#FFC107] text-[#212121] border-[#FFC107] shadow-xs'
                        : 'bg-[#F5F5F5] text-[#666666] border-[#E0E0E0]'
                    }`}
                  >
                    <span>🚲 Bicycle / EV Cycle</span>
                  </button>
                </div>
              </div>

              {/* Rider Full Name & Urdu Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Rider Full Name</label>
                  <input
                    type="text"
                    required
                    value={newRiderForm.name}
                    onChange={(e) =>
                      setNewRiderForm({ ...newRiderForm, name: e.target.value })
                    }
                    placeholder="e.g. Farhan Siddiqui"
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Urdu Name (اردو نام)</label>
                  <input
                    type="text"
                    value={newRiderForm.nameUrdu}
                    onChange={(e) =>
                      setNewRiderForm({ ...newRiderForm, nameUrdu: e.target.value })
                    }
                    placeholder="مثلاً: فرحان صدیقی"
                    dir="rtl"
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone & CNIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newRiderForm.phone}
                    onChange={(e) =>
                      setNewRiderForm({ ...newRiderForm, phone: e.target.value })
                    }
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">CNIC Number</label>
                  <input
                    type="text"
                    required
                    value={newRiderForm.cnic}
                    onChange={(e) =>
                      setNewRiderForm({ ...newRiderForm, cnic: e.target.value })
                    }
                    placeholder="42201-1234567-1"
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>
              </div>

              {/* Vehicle Number & Assigned Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Vehicle Reg & Model</label>
                  <input
                    type="text"
                    required
                    value={newRiderForm.vehicleNumber}
                    onChange={(e) =>
                      setNewRiderForm({ ...newRiderForm, vehicleNumber: e.target.value })
                    }
                    placeholder="e.g. KHI-ABC-1234 (Honda CD70)"
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#212121]">Assigned Hub / Station</label>
                  <select
                    value={newRiderForm.area}
                    onChange={(e) =>
                      setNewRiderForm({ ...newRiderForm, area: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                  >
                    <option value="Clifton">Clifton (Karachi South)</option>
                    <option value="DHA Phase 5">DHA Phase 5 & 6</option>
                    <option value="Gulshan-e-Iqbal">Gulshan-e-Iqbal (Karachi East)</option>
                    <option value="Saddar">Saddar & Burns Road</option>
                    <option value="Bahadurabad">Bahadurabad & PECHS</option>
                    <option value="North Nazimabad">North Nazimabad</option>
                  </select>
                </div>
              </div>

              {/* Max COD Float Limit */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#212121]">Max COD Cash in Hand Float Limit (Rs.)</label>
                <input
                  type="number"
                  step="1000"
                  min="5000"
                  max="50000"
                  value={newRiderForm.maxCashLimit}
                  onChange={(e) =>
                    setNewRiderForm({ ...newRiderForm, maxCashLimit: parseFloat(e.target.value) || 15000 })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-xs font-medium text-[#212121] focus:outline-none focus:border-[#FFC107] focus:bg-white"
                />
                <span className="text-[10px] text-[#666666]">Standard platform safety ceiling before mandatory bank/EasyPaisa remittance: Rs. 15,000</span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#E0E0E0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRiderModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-xs font-bold text-[#212121] transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={addRiderSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-black text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {addRiderSubmitting ? 'Enrolling...' : 'Onboard & Activate Rider'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
