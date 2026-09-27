import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Banknote,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  Building2,
  CreditCard,
  Sliders,
  FileCheck,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

interface FinanceMetrics {
  totalGmv: number;
  totalPlatformRevenue: number;
  totalCommissionsEarned: number;
  totalServiceFeesEarned: number;
  totalCodCashInCirculation: number;
  totalMerchantPayoutsSettled: number;
  totalMerchantPayoutsPending: number;
  totalRefundsDisbursed: number;
  activeRiderCount: number;
  activeMerchantCount: number;
  totalCompletedOrders: number;
}

interface RiderRemittance {
  id: string;
  riderId: string;
  riderName: string;
  amount: number;
  remittanceMethod: string;
  referenceNumber: string;
  status: 'pending' | 'verified' | 'rejected';
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

interface MerchantSettlement {
  id: string;
  merchantId: string;
  merchantName: string;
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  grossSales: number;
  commissionRate: number;
  commissionAmount: number;
  refundDeductions: number;
  netPayout: number;
  payoutMethod: string;
  beneficiaryIbanOrRaast: string;
  status: 'draft' | 'processing' | 'settled';
  transferReference?: string;
  settledAt?: string;
  createdAt: string;
}

interface CustomerRefund {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  channel: string;
  resolutionNotes?: string;
  createdAt: string;
}

interface Props {
  accessToken: string | null;
  onToast: (msg: string, isError?: boolean) => void;
  lang: 'en' | 'ur';
}

export const FinanceAdminHub: React.FC<Props> = ({ accessToken, onToast, lang }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'remittances' | 'settlements' | 'refunds' | 'twilio' | 'settings'>('overview');
  const [loading, setLoading] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [remittances, setRemittances] = useState<RiderRemittance[]>([]);
  const [settlements, setSettlements] = useState<MerchantSettlement[]>([]);
  const [refunds, setRefunds] = useState<CustomerRefund[]>([]);

  // Platform financial settings
  const [settings, setSettings] = useState({
    defaultRestaurantCommission: 15,
    defaultGroceryCommission: 12,
    serviceFeeFlatPaisa: 2000,
    maxRiderCashInHandPaisa: 1500000,
    twilioSmsEnabled: true,
  });

  // Test SMS state
  const [testSmsPhone, setTestSmsPhone] = useState<string>('03001234567');
  const [testSmsStatus, setTestSmsStatus] = useState<string | null>(null);

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

  const fetchFinanceData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      // 1. Financial Metrics
      try {
        const metRes = await fetch('/api/v1/finance/metrics', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (metRes.ok) {
          const mData = await parseResponseJson(metRes);
          if (mData?.success) setMetrics(mData.data);
        }
      } catch (err: any) {
        console.warn('Finance metrics notice:', err.message);
      }

      // 2. Remittances
      try {
        const remRes = await fetch('/api/v1/finance/remittances', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (remRes.ok) {
          const rData = await parseResponseJson(remRes);
          if (rData?.success) setRemittances(rData.data);
        }
      } catch (err: any) {
        console.warn('Remittances notice:', err.message);
      }

      // 3. Settlements
      try {
        const setRes = await fetch('/api/v1/finance/settlements', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (setRes.ok) {
          const sData = await parseResponseJson(setRes);
          if (sData?.success) setSettlements(sData.data);
        }
      } catch (err: any) {
        console.warn('Settlements notice:', err.message);
      }

      // 4. Refunds
      try {
        const refRes = await fetch('/api/v1/finance/refunds', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (refRes.ok) {
          const rfData = await parseResponseJson(refRes);
          if (rfData?.success) setRefunds(rfData.data);
        }
      } catch (err: any) {
        console.warn('Refunds notice:', err.message);
      }
    } catch (err: any) {
      console.warn('Finance fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [accessToken]);

  const handleVerifyRemittance = async (id: string, action: 'verify' | 'reject') => {
    try {
      const res = await fetch(`/api/v1/finance/remittances/${id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action,
          notes: action === 'verify' ? 'Verified in physical cash depot deposit slip' : 'Deposit slip rejected',
        }),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        onToast(`Remittance ${action === 'verify' ? 'verified' : 'rejected'} successfully!`);
        fetchFinanceData();
      } else {
        onToast(data.error?.message || 'Remittance action failed', true);
      }
    } catch (err: any) {
      onToast(`Remittance error: ${err.message}`, true);
    }
  };

  const handleDisburseSettlement = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/finance/settlements/${id}/disburse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        onToast(`Merchant settlement disbursed via Raast: ${data.data?.transferReference}`);
        fetchFinanceData();
      } else {
        onToast(data.error?.message || 'Settlement failed', true);
      }
    } catch (err: any) {
      onToast(`Disbursement error: ${err.message}`, true);
    }
  };

  const handleReviewRefund = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/v1/finance/refunds/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action,
          notes: action === 'approve' ? 'Approved after rider incident report review' : 'Rejected after inspection',
        }),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        onToast(`Refund dispute ${action === 'approve' ? 'approved & disbursed' : 'rejected'}!`);
        fetchFinanceData();
      } else {
        onToast(data.error?.message || 'Refund action failed', true);
      }
    } catch (err: any) {
      onToast(`Refund error: ${err.message}`, true);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/v1/finance/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        onToast('Platform financial parameters updated successfully!');
      } else {
        onToast(data.error?.message || 'Failed to update settings', true);
      }
    } catch (err: any) {
      onToast(`Settings update error: ${err.message}`, true);
    }
  };

  const handleTestTwilioSms = async () => {
    try {
      setTestSmsStatus('Sending via Twilio REST API...');
      const res = await fetch('/api/v1/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testSmsPhone }),
      });
      const data = await parseResponseJson(res);
      if (data.success) {
        setTestSmsStatus(`Twilio dispatched! Provider: ${data.data?.provider} | OTP: ${data.data?.mockOtpCode}`);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#FFFDF7] text-[#212121] min-h-screen">
      {/* Top Banner - Header has White background with Yellow/Red branding */}
      <div className="bg-white text-[#212121] p-6 rounded-2xl border border-[#E0E0E0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFC107] text-[#212121]">
              Financial Operations
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E53935]/10 text-[#E53935] border border-[#E53935]/20">
              Twilio SMS Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#212121] tracking-tight">
            Financial Operations, Settlements & Reconciliation Control Tower
          </h1>
          <p className="text-[#666666] text-sm">
            Rider COD Float Remittance • Merchant Batch Settlements • Multi-Channel Payment Adapters • Customer Refund Disputes
          </p>
        </div>

        <button
          onClick={fetchFinanceData}
          disabled={loading}
          className="px-4 py-2 bg-[#FFC107] text-[#212121] hover:bg-[#FFD54F] text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledgers</span>
        </button>
      </div>

      {/* Navigation Tabs - White background with Yellow active tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-[#E0E0E0] shadow-xs overflow-x-auto">
        {[
          { id: 'overview', label: 'Financial Overview', icon: TrendingUp },
          { id: 'remittances', label: `Rider COD Float (${remittances.filter(r => r.status === 'pending').length} pending)`, icon: Banknote },
          { id: 'settlements', label: `Merchant Settlements (${settlements.length})`, icon: Building2 },
          { id: 'refunds', label: `Disputes & Refunds (${refunds.filter(r => r.status === 'pending').length})`, icon: Receipt },
          { id: 'twilio', label: 'Twilio SMS Gateway', icon: MessageSquare },
          { id: 'settings', label: 'Platform Parameters', icon: Sliders },
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
                  : 'text-[#666666] hover:text-[#212121] hover:bg-[#F5F5F5]'
              }`}
            >
              <Icon className="w-4 h-4 text-[#E53935]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Financial Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-[#E0E0E0] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#666666] text-xs font-semibold">
                <span>Platform GMV</span>
                <div className="w-8 h-8 rounded-lg bg-[#FFFDF7] border border-[#E0E0E0] flex items-center justify-center text-[#E53935]">
                  <DollarSign className="w-4 h-4 text-[#E53935]" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#212121]">
                Rs. {((metrics?.totalGmv || 0) / 100).toLocaleString('en-PK')}
              </div>
              <p className="text-[11px] text-[#666666]">Gross sales across food & groceries</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E0E0E0] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#666666] text-xs font-semibold">
                <span>Net Platform Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-[#FFFDF7] border border-[#E0E0E0] flex items-center justify-center text-[#E53935]">
                  <TrendingUp className="w-4 h-4 text-[#E53935]" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#212121]">
                Rs. {((metrics?.totalPlatformRevenue || 0) / 100).toLocaleString('en-PK')}
              </div>
              <p className="text-[11px] text-[#666666]">
                Commissions (Rs. {((metrics?.totalCommissionsEarned || 0) / 100).toLocaleString('en-PK')}) + Service Fees
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E0E0E0] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#666666] text-xs font-semibold">
                <span>Active COD Float</span>
                <div className="w-8 h-8 rounded-lg bg-[#FFFDF7] border border-[#E0E0E0] flex items-center justify-center text-[#E53935]">
                  <Banknote className="w-4 h-4 text-[#E53935]" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#212121]">
                Rs. {((metrics?.totalCodCashInCirculation || 0) / 100).toLocaleString('en-PK')}
              </div>
              <p className="text-[11px] text-[#666666]">Physical cash with active riders</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E0E0E0] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#666666] text-xs font-semibold">
                <span>Merchant Settlements</span>
                <div className="w-8 h-8 rounded-lg bg-[#FFFDF7] border border-[#E0E0E0] flex items-center justify-center text-[#E53935]">
                  <Building2 className="w-4 h-4 text-[#E53935]" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#212121]">
                Rs. {((metrics?.totalMerchantPayoutsSettled || 0) / 100).toLocaleString('en-PK')}
              </div>
              <p className="text-[11px] text-[#666666]">
                Pending: Rs. {((metrics?.totalMerchantPayoutsPending || 0) / 100).toLocaleString('en-PK')}
              </p>
            </div>
          </div>

          {/* Operational Infrastructure Summary */}
          <div className="p-6 bg-white rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#212121] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#E53935]" />
              <span>Multi-Channel Rail & Settlement Status</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
                <span className="text-[#666666] block font-semibold">SBP Raast Engine</span>
                <div className="flex items-center gap-1.5 text-[#212121] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#E53935]" />
                  <span>Instant 24/7 Rail Online</span>
                </div>
                <p className="text-[10px] text-[#666666]">Batch disbursements active</p>
              </div>

              <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
                <span className="text-[#666666] block font-semibold">JazzCash & Easypaisa</span>
                <div className="flex items-center gap-1.5 text-[#212121] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#E53935]" />
                  <span>USSD Push / QR Live</span>
                </div>
                <p className="text-[10px] text-[#666666]">Zero processing lag</p>
              </div>

              <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
                <span className="text-[#666666] block font-semibold">Rider COD Float Ceiling</span>
                <div className="flex items-center gap-1.5 text-[#212121] font-bold">
                  <AlertTriangle className="w-4 h-4 text-[#E53935]" />
                  <span>Rs. 15,000 Cap Enforced</span>
                </div>
                <p className="text-[10px] text-[#666666]">Auto-locks riders upon breach</p>
              </div>

              <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
                <span className="text-[#666666] block font-semibold">Twilio Dedicated SMS</span>
                <div className="flex items-center gap-1.5 text-[#212121] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#E53935]" />
                  <span>Twilio REST Adapter Active</span>
                </div>
                <p className="text-[10px] text-[#666666]">Phone OTPs & Delivery SMS</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Rider Remittances */}
      {activeTab === 'remittances' && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Rider COD Float Remittance Ledger</h3>
            <p className="text-xs text-[#666666]">
              Verify physical cash deposits made by delivery riders at hubs, Easypaisa shops, or bank branches to reset their cash-in-hand float.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121]">
              <thead className="bg-[#FFFDF7] text-[#666666] uppercase text-[10px] font-bold tracking-wider border-b border-[#E0E0E0]">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Rider</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {remittances.map((rem) => (
                  <tr key={rem.id} className="hover:bg-[#FFFDF7]/60 transition">
                    <td className="p-3 font-mono font-bold text-[#212121]">{rem.referenceNumber}</td>
                    <td className="p-3 font-bold text-[#212121]">{rem.riderName}</td>
                    <td className="p-3 font-black text-sm text-[#212121]">
                      Rs. {(rem.amount / 100).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3 uppercase text-[11px] text-[#666666]">{rem.remittanceMethod.replace('_', ' ')}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rem.status === 'verified'
                            ? 'bg-[#FFC107] text-[#212121]'
                            : rem.status === 'pending'
                            ? 'bg-[#E53935]/15 text-[#E53935] border border-[#E53935]/30'
                            : 'bg-[#F5F5F5] text-[#666666] border border-[#E0E0E0]'
                        }`}
                      >
                        {rem.status}
                      </span>
                    </td>
                    <td className="p-3 text-[#666666]">{new Date(rem.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {rem.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerifyRemittance(rem.id, 'verify')}
                            className="px-2.5 py-1 bg-[#FFC107] text-[#212121] hover:bg-[#FFD54F] rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Verify & Clear</span>
                          </button>
                          <button
                            onClick={() => handleVerifyRemittance(rem.id, 'reject')}
                            className="px-2.5 py-1 bg-white text-[#E53935] hover:bg-[#C62828] hover:text-white rounded-lg text-xs font-bold transition border border-[#E53935]"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#666666] italic">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Merchant Settlements */}
      {activeTab === 'settlements' && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Merchant Batch Settlement Engine</h3>
            <p className="text-xs text-[#666666]">
              Disburse net payouts to restaurants and shops via State Bank of Pakistan Raast instant rail after deducting commission and dispute refunds.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121]">
              <thead className="bg-[#FFFDF7] text-[#666666] uppercase text-[10px] font-bold tracking-wider border-b border-[#E0E0E0]">
                <tr>
                  <th className="p-3">Merchant</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Gross Sales</th>
                  <th className="p-3">Commission</th>
                  <th className="p-3">Refunds</th>
                  <th className="p-3">Net Payout</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {settlements.map((set) => (
                  <tr key={set.id} className="hover:bg-[#FFFDF7]/60 transition">
                    <td className="p-3">
                      <span className="font-bold text-[#212121] block">{set.merchantName}</span>
                      <span className="text-[10px] text-[#666666] font-mono">{set.beneficiaryIbanOrRaast}</span>
                    </td>
                    <td className="p-3 text-[#666666] text-[11px]">
                      {new Date(set.periodStart).toLocaleDateString()} - {new Date(set.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-[#212121] font-semibold">{set.orderCount}</td>
                    <td className="p-3 text-[#212121]">Rs. {(set.grossSales / 100).toLocaleString('en-PK')}</td>
                    <td className="p-3 text-[#666666]">
                      -Rs. {(set.commissionAmount / 100).toLocaleString('en-PK')} ({set.commissionRate}%)
                    </td>
                    <td className="p-3 text-[#E53935] font-medium">-Rs. {(set.refundDeductions / 100).toLocaleString('en-PK')}</td>
                    <td className="p-3 font-black text-sm text-[#212121]">
                      Rs. {(set.netPayout / 100).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          set.status === 'settled'
                            ? 'bg-[#FFC107] text-[#212121]'
                            : 'bg-[#E53935]/15 text-[#E53935] border border-[#E53935]/30'
                        }`}
                      >
                        {set.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {set.status !== 'settled' ? (
                        <button
                          onClick={() => handleDisburseSettlement(set.id)}
                          className="px-3 py-1 bg-[#FFC107] text-[#212121] hover:bg-[#FFD54F] font-bold rounded-lg text-xs transition shadow-xs"
                        >
                          Disburse via Raast
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] text-[#666666]">{set.transferReference}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Customer Disputes & Refunds */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Customer Dispute & Refund Desk</h3>
            <p className="text-xs text-[#666666]">
              Review damaged item claims, spilled meals, or delayed deliveries to approve reversals to customer wallets or cards.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121]">
              <thead className="bg-[#FFFDF7] text-[#666666] uppercase text-[10px] font-bold tracking-wider border-b border-[#E0E0E0]">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Merchant</th>
                  <th className="p-3">Refund Amount</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {refunds.map((ref) => (
                  <tr key={ref.id} className="hover:bg-[#FFFDF7]/60 transition">
                    <td className="p-3 font-mono font-bold text-[#212121]">{ref.orderNumber}</td>
                    <td className="p-3 text-[#212121] font-semibold">{ref.customerName}</td>
                    <td className="p-3 text-[#666666]">{ref.merchantName}</td>
                    <td className="p-3 font-bold text-[#212121]">Rs. {(ref.amount / 100).toLocaleString('en-PK')}</td>
                    <td className="p-3 text-[#666666] text-xs max-w-xs truncate">{ref.reason}</td>
                    <td className="p-3 uppercase text-[10px] font-mono text-[#666666]">{ref.channel}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ref.status === 'approved' || ref.status === 'processed'
                            ? 'bg-[#FFC107] text-[#212121]'
                            : ref.status === 'pending'
                            ? 'bg-[#E53935]/15 text-[#E53935] border border-[#E53935]/30'
                            : 'bg-[#F5F5F5] text-[#666666] border border-[#E0E0E0]'
                        }`}
                      >
                        {ref.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {ref.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReviewRefund(ref.id, 'approve')}
                            className="px-2.5 py-1 bg-[#FFC107] text-[#212121] hover:bg-[#FFD54F] font-bold rounded-lg text-xs transition shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewRefund(ref.id, 'reject')}
                            className="px-2.5 py-1 bg-white text-[#E53935] hover:bg-[#C62828] hover:text-white font-bold rounded-lg text-xs transition border border-[#E53935]"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#666666] italic">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Twilio SMS Gateway */}
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
              All authentication OTP codes, rider dispatch alerts, and automated customer delivery completion text messages are strictly dispatched via Twilio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
              <span className="text-xs font-semibold text-[#666666]">Twilio SMS Adapter</span>
              <p className="font-mono text-sm font-bold text-[#212121]">TwilioSmsAdapter</p>
              <span className="text-[10px] text-[#E53935] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E53935] inline-block animate-pulse"></span> Active & Configured
              </span>
            </div>

            <div className="p-4 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1">
              <span className="text-xs font-semibold text-[#666666]">API Route</span>
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

      {/* TAB 6: Platform Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-6 shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Marketplace Financial Controls & Commission Rates</h3>
            <p className="text-xs text-[#666666]">
              Adjust platform commission take-rates, consumer technology service fee, and maximum rider cash-in-hand float threshold.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-3">
              <label className="text-xs font-bold text-[#212121] block">
                Restaurant Commission Take-Rate: {settings.defaultRestaurantCommission}%
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={settings.defaultRestaurantCommission}
                onChange={(e) => setSettings({ ...settings, defaultRestaurantCommission: parseInt(e.target.value, 10) })}
                className="w-full accent-[#E53935] cursor-pointer"
              />
              <p className="text-[11px] text-[#666666]">Platform split deducted automatically before merchant batch payout.</p>
            </div>

            <div className="p-5 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-3">
              <label className="text-xs font-bold text-[#212121] block">
                Grocery & Essentials Commission: {settings.defaultGroceryCommission}%
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={settings.defaultGroceryCommission}
                onChange={(e) => setSettings({ ...settings, defaultGroceryCommission: parseInt(e.target.value, 10) })}
                className="w-full accent-[#E53935] cursor-pointer"
              />
              <p className="text-[11px] text-[#666666]">Lower margin tier for supermarket & FMCG merchants.</p>
            </div>

            <div className="p-5 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-3">
              <label className="text-xs font-bold text-[#212121] block">
                Consumer Platform Service Fee (Rs.): {settings.serviceFeeFlatPaisa / 100}
              </label>
              <input
                type="number"
                value={settings.serviceFeeFlatPaisa / 100}
                onChange={(e) => setSettings({ ...settings, serviceFeeFlatPaisa: (parseInt(e.target.value, 10) || 0) * 100 })}
                className="w-full px-4 py-2 bg-white border border-[#E0E0E0] rounded-xl text-xs text-[#212121] focus:outline-none focus:border-[#FFC107]"
              />
              <p className="text-[11px] text-[#666666]">Flat order fee collected on every customer delivery.</p>
            </div>

            <div className="p-5 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-3">
              <label className="text-xs font-bold text-[#212121] block">
                Rider Cash Float Ceiling (Rs.): {settings.maxRiderCashInHandPaisa / 100}
              </label>
              <input
                type="number"
                value={settings.maxRiderCashInHandPaisa / 100}
                onChange={(e) => setSettings({ ...settings, maxRiderCashInHandPaisa: (parseInt(e.target.value, 10) || 0) * 100 })}
                className="w-full px-4 py-2 bg-white border border-[#E0E0E0] rounded-xl text-xs text-[#212121] focus:outline-none focus:border-[#FFC107]"
              />
              <p className="text-[11px] text-[#666666]">Maximum unremitted COD cash allowed per delivery rider.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-[#FFC107] text-[#212121] hover:bg-[#FFD54F] font-black text-xs rounded-xl transition shadow-xs"
            >
              Save Financial Parameters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
