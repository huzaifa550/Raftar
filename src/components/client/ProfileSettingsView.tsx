import React, { useState } from 'react';
import { User, Phone, Mail, Globe, Bell, Shield, Save, Check } from 'lucide-react';

interface ProfileSettingsViewProps {
  currentUser: any;
  onUpdateProfile: (data: { fullName: string; phone: string }) => void;
  lang: 'en' | 'ur';
  onToggleLang: () => void;
  isUrdu: boolean;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  currentUser,
  onUpdateProfile,
  lang,
  onToggleLang,
  isUrdu,
}) => {
  const [fullName, setFullName] = useState(currentUser?.fullName || 'Fatima Noor');
  const [phone, setPhone] = useState(currentUser?.phone || '03001234567');
  const [email, setEmail] = useState('fatima.noor@example.com');
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ fullName, phone });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white p-6 rounded-3xl border border-[#E0E0E0] shadow-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-[#E0E0E0] mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FFC107] text-[#212121] flex items-center justify-center font-black text-2xl shadow-sm">
            {fullName.charAt(0) || 'C'}
          </div>
          <div>
            <h2 className="text-lg font-black text-[#212121]">{fullName}</h2>
            <p className="text-xs text-[#666666]">{phone} • Verified Raftaar Customer</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">
              Account Status: Active
            </span>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>
              {isUrdu
                ? 'پروفائل کامیابی سے اپ ڈیٹ ہو گئی ہے!'
                : 'Profile updated successfully!'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#212121] block mb-1">
              {isUrdu ? 'پورا نام' : 'Full Name'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#212121] block mb-1">
              {isUrdu ? 'فون نمبر' : 'Phone Number'}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#212121] block mb-1">
              {isUrdu ? 'ای میل ایڈریس' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>{isUrdu ? 'تبدیلیاں محفوظ کریں' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Preferences Card */}
      <div className="bg-white p-6 rounded-3xl border border-[#E0E0E0] shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-[#212121]">
          {isUrdu ? 'زبان اور ترجیحات' : 'Language & Notifications'}
        </h3>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F5]">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-[#E53935]" />
            <div>
              <span className="font-bold text-xs text-[#212121] block">
                {isUrdu ? 'زبان کا انتخاب' : 'Application Language'}
              </span>
              <span className="text-[11px] text-[#666666]">
                {lang === 'en' ? 'English (Left-to-Right)' : 'اردو (دائیں سے بائیں)'}
              </span>
            </div>
          </div>
          <button
            onClick={onToggleLang}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E0E0E0] font-bold text-xs text-[#212121] hover:bg-[#FFC107] transition"
          >
            {lang === 'en' ? 'Switch to اردو' : 'Switch to English'}
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F5]">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[#FFC107]" />
            <div>
              <span className="font-bold text-xs text-[#212121] block">
                {isUrdu ? 'ایس ایم ایس الرٹس' : 'SMS Order Notifications'}
              </span>
              <span className="text-[11px] text-[#666666]">
                Twilio automated updates on rider arrival
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={smsAlerts}
            onChange={(e) => setSmsAlerts(e.target.checked)}
            className="w-4 h-4 text-[#FFC107] rounded"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F5]">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-green-600" />
            <div>
              <span className="font-bold text-xs text-[#212121] block">
                {isUrdu ? 'پروموشنل آفرز' : 'Promotional Offers & Vouchers'}
              </span>
              <span className="text-[11px] text-[#666666]">
                Receive instant discounts and flash sale notifications
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={promoAlerts}
            onChange={(e) => setPromoAlerts(e.target.checked)}
            className="w-4 h-4 text-[#FFC107] rounded"
          />
        </div>
      </div>
    </div>
  );
};
