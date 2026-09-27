import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  MapPin,
  ChevronDown,
  ShoppingBag,
  Globe,
  User,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { CustomerAddress, CustomerNotification } from './types.ts';

interface ClientHeaderProps {
  currentAddress: CustomerAddress | null;
  addresses: CustomerAddress[];
  onSelectAddress: (addr: CustomerAddress) => void;
  onOpenAddressModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notifications: CustomerNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  cartCount: number;
  onOpenCart: () => void;
  lang: 'en' | 'ur';
  onToggleLang: () => void;
  currentUser: any;
  onOpenProfile: () => void;
  onLogout?: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
  currentAddress,
  addresses,
  onSelectAddress,
  onOpenAddressModal,
  searchQuery,
  onSearchChange,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  cartCount,
  onOpenCart,
  lang,
  onToggleLang,
  currentUser,
  onOpenProfile,
  onLogout,
}) => {
  const isUrdu = lang === 'ur';
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const notifRef = useRef<HTMLDivElement>(null);
  const addrRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (addrRef.current && !addrRef.current.contains(e.target as Node)) {
        setShowAddressDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.read);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E0E0E0] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#FFC107] text-[#212121] flex items-center justify-center font-black text-base shadow-sm ring-1 ring-[#FFC107]/40">
            <span>رفتار</span>
          </div>
          <div className="hidden sm:flex items-center">
            <span className="font-extrabold text-xl text-[#212121] tracking-tight">Raftaar</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E53935] text-white tracking-wider uppercase">
              Express
            </span>
          </div>
        </div>

        {/* Delivery Address Affordance */}
        <div className="relative" ref={addrRef}>
          <button
            onClick={() => setShowAddressDropdown(!showAddressDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-[#F5F5F5] border border-[#E0E0E0] text-xs font-semibold text-[#212121] transition max-w-[180px] sm:max-w-[260px]"
          >
            <MapPin className="w-4 h-4 text-[#E53935] flex-shrink-0" />
            <div className="truncate text-left rtl:text-right">
              <span className="text-[10px] text-[#666666] block leading-none">
                {isUrdu ? 'ڈلیوری پتہ' : 'Deliver to'}
              </span>
              <span className="font-bold text-xs truncate block">
                {currentAddress
                  ? `${currentAddress.label}: ${currentAddress.area}`
                  : 'Clifton Block 7, Karachi'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#666666] flex-shrink-0 ml-1" />
          </button>

          {showAddressDropdown && (
            <div className="absolute left-0 rtl:left-auto rtl:right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E0E0E0] p-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#E0E0E0] mb-2">
                <span className="text-xs font-bold text-[#212121]">
                  {isUrdu ? 'پتہ تبدیل کریں' : 'Choose Delivery Address'}
                </span>
                <button
                  onClick={() => {
                    setShowAddressDropdown(false);
                    onOpenAddressModal();
                  }}
                  className="text-[11px] font-bold text-[#E53935] hover:underline"
                >
                  {isUrdu ? '+ نیا پتہ' : '+ Add New'}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1.5">
                {addresses.length === 0 ? (
                  <div className="text-center py-4 text-xs text-[#666666]">
                    {isUrdu ? 'کوئی محفوظ پتہ نہیں' : 'No saved addresses yet.'}
                  </div>
                ) : (
                  addresses.map((addr) => {
                    const isSelected = currentAddress?.id === addr.id;
                    return (
                      <button
                        key={addr.id}
                        onClick={() => {
                          onSelectAddress(addr);
                          setShowAddressDropdown(false);
                        }}
                        className={`w-full text-left rtl:text-right p-2.5 rounded-xl border text-xs transition flex items-start gap-2 ${
                          isSelected
                            ? 'bg-[#FFC107]/20 border-[#FFC107] text-[#212121]'
                            : 'hover:bg-[#F5F5F5] border-[#E0E0E0] text-[#666666]'
                        }`}
                      >
                        <MapPin
                          className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                            isSelected ? 'text-[#E53935]' : 'text-[#666666]'
                          }`}
                        />
                        <div className="flex-1 truncate">
                          <div className="font-bold text-[#212121] flex items-center justify-between">
                            <span>{addr.label}</span>
                            {addr.isDefault && (
                              <span className="text-[9px] bg-[#FFC107] text-[#212121] px-1 rounded font-bold">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="truncate text-[11px] text-[#666666]">
                            {addr.streetAddress}, {addr.area}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={
                isUrdu
                  ? 'کھانا، ریسٹورنٹ یا گروسری تلاش کریں...'
                  : 'Search biryani, pizza, burger, grocery...'
              }
              className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 bg-[#F5F5F5] focus:bg-white rounded-xl text-xs border border-[#E0E0E0] focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/30 transition outline-none"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#212121]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-xs font-semibold text-[#212121] border border-[#E0E0E0] flex items-center gap-1 transition"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#E53935]" />
            <span>{isUrdu ? 'EN' : 'اردو'}</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0] transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-[#212121]" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E53935] text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E0E0E0] p-3 z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#E0E0E0] mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#212121]">
                      {isUrdu ? 'اطلاعات' : 'Notifications'}
                    </span>
                    {unreadNotifs.length > 0 && (
                      <span className="bg-[#FFC107] text-[#212121] text-[10px] font-black px-1.5 rounded-full">
                        {unreadNotifs.length}
                      </span>
                    )}
                  </div>
                  {unreadNotifs.length > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-[10px] font-bold text-[#E53935] hover:underline"
                    >
                      {isUrdu ? 'سب پڑھ لیں' : 'Mark all read'}
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#666666]">
                      {isUrdu ? 'کوئی نئی اطلاع نہیں' : 'No notifications right now.'}
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.read && onMarkNotificationRead(notif.id)}
                        className={`p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                          !notif.read
                            ? 'bg-[#FFFDF7] border-[#FFC107] shadow-xs'
                            : 'bg-white border-[#E0E0E0] text-[#666666]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span
                            className={`font-bold text-xs ${
                              !notif.read ? 'text-[#212121]' : 'text-[#666666]'
                            }`}
                          >
                            {isUrdu && notif.titleUr ? notif.titleUr : notif.title}
                          </span>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#E53935] flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#666666] leading-relaxed">
                          {isUrdu && notif.bodyUr ? notif.bodyUr : notif.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart Trigger (Primary Red action button) */}
          <button
            onClick={onOpenCart}
            className="px-3.5 py-1.5 rounded-xl bg-[#E53935] hover:bg-[#C62828] text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isUrdu ? 'کارٹ' : 'Cart'}</span>
            <span className="bg-[#FFC107] text-[#212121] text-[11px] font-black px-1.5 rounded-full">
              {cartCount}
            </span>
          </button>

          {/* User Profile & Account Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0] transition"
              title="User Account Menu"
            >
              <div className="w-7 h-7 rounded-full bg-[#FFC107] text-[#212121] flex items-center justify-center font-black text-xs shadow-xs border border-[#FFD54F]">
                {currentUser?.fullName?.charAt(0) || 'U'}
              </div>
              <span className="hidden md:inline text-xs font-bold text-[#212121] max-w-[110px] truncate">
                {currentUser?.fullName?.split(' ')[0] || 'Account'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E0E0E0] p-3 z-50 animate-fade-in space-y-2.5">
                {/* User Info Header */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E0E0E0]">
                  <div className="w-10 h-10 rounded-full bg-[#FFC107] text-[#212121] flex items-center justify-center font-black text-sm shadow-xs border border-[#FFD54F]">
                    {currentUser?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="truncate flex-1">
                    <div className="font-bold text-xs text-[#212121] truncate">
                      {currentUser?.fullName || 'Signed In Customer'}
                    </div>
                    <div className="text-[10px] text-[#666666] truncate font-mono">
                      {currentUser?.phone || currentUser?.email || 'Active Session'}
                    </div>
                    <span className="inline-block px-2 py-0.5 mt-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                      {currentUser?.roles?.[0]?.replace('_', ' ') || 'Customer'}
                    </span>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onOpenProfile();
                    }}
                    className="w-full text-left rtl:text-right px-2.5 py-1.5 rounded-xl hover:bg-[#F5F5F5] text-xs font-semibold text-[#212121] flex items-center gap-2 transition"
                  >
                    <User className="w-3.5 h-3.5 text-[#666666]" />
                    <span>{isUrdu ? 'میری پروفائل' : 'My Profile & Settings'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onOpenAddressModal();
                    }}
                    className="w-full text-left rtl:text-right px-2.5 py-1.5 rounded-xl hover:bg-[#F5F5F5] text-xs font-semibold text-[#212121] flex items-center gap-2 transition"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#666666]" />
                    <span>{isUrdu ? 'محفوظ پتے' : 'Delivery Addresses'}</span>
                  </button>
                </div>

                {/* Prominent Red Logout Button */}
                <div className="pt-2 border-t border-[#E0E0E0]">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-[#E53935] font-bold text-xs flex items-center justify-center gap-2 transition border border-red-200 shadow-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isUrdu ? 'لاگ آؤٹ کریں' : 'Log Out of Account'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
