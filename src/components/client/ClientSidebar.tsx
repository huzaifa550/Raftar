import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Store,
  ShoppingBag,
  Receipt,
  Heart,
  Tag,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { ClientNavTab } from './types.ts';

interface ClientSidebarProps {
  activeTab: ClientNavTab;
  onSelectTab: (tab: ClientNavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  cartCount: number;
  unreadNotifsCount: number;
  activeOrdersCount: number;
  currentUser: any;
  onLogout?: () => void;
  isUrdu: boolean;
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  cartCount,
  unreadNotifsCount,
  activeOrdersCount,
  currentUser,
  onLogout,
  isUrdu,
}) => {
  const navItems: Array<{
    id: ClientNavTab;
    label: string;
    labelUr: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', labelUr: 'ڈیش بورڈ', icon: LayoutDashboard },
    { id: 'browse_food', label: 'Browse Food', labelUr: 'کھانا تلاش کریں', icon: UtensilsCrossed },
    { id: 'restaurants', label: 'Restaurants', labelUr: 'ریسٹورنٹس', icon: Store },
    { id: 'grocery', label: 'Grocery & Shops', labelUr: 'گروسری اور دکانیں', icon: ShoppingBag },
    {
      id: 'orders',
      label: 'My Orders',
      labelUr: 'میرے آرڈرز',
      icon: Receipt,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-[#E53935] text-white',
    },
    { id: 'favorites', label: 'Favorites', labelUr: 'پسندیدہ', icon: Heart },
    { id: 'coupons', label: 'Coupons & Offers', labelUr: 'کوپنز اور آفرز', icon: Tag },
    { id: 'addresses', label: 'Saved Addresses', labelUr: 'محفوظ پتے', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', labelUr: 'طریقہ ہائے ادائیگی', icon: CreditCard },
    {
      id: 'notifications',
      label: 'Notifications',
      labelUr: 'اطلاعات',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      badgeColor: 'bg-[#FFC107] text-[#212121]',
    },
    { id: 'support', label: 'Support & Help', labelUr: 'مدد و سپورٹ', icon: HelpCircle },
    { id: 'profile', label: 'Profile', labelUr: 'پروفائل', icon: User },
    { id: 'settings', label: 'Settings', labelUr: 'ترتیبات', icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-[#E0E0E0] h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header / Brand info */}
      <div className="p-3.5 border-b border-[#E0E0E0] flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#FFC107] text-[#212121] flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
              ⚡
            </div>
            <div className="truncate">
              <span className="text-xs font-black tracking-tight text-[#212121] block">
                {isUrdu ? 'کسٹمر پورٹل' : 'CUSTOMER HUB'}
              </span>
              <span className="text-[10px] text-[#666666] font-medium block truncate">
                {currentUser?.fullName || (isUrdu ? 'معزز مہمان' : 'Signed in Customer')}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#666666] hover:text-[#212121] transition ml-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all relative group ${
                active
                  ? 'bg-[#FFC107] text-[#212121] shadow-xs font-bold'
                  : 'text-[#666666] hover:text-[#212121] hover:bg-[#F5F5F5]'
              }`}
              title={collapsed ? (isUrdu ? item.labelUr : item.label) : undefined}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  active ? 'text-[#212121]' : 'text-[#666666] group-hover:text-[#E53935]'
                } transition-colors`}
              />
              {!collapsed && (
                <span className="flex-1 text-left rtl:text-right truncate">
                  {isUrdu ? item.labelUr : item.label}
                </span>
              )}
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-[#E53935] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User / Guest Status Footer */}
      <div className="p-3 border-t border-[#E0E0E0] bg-[#FFFDF7]">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-full bg-[#E53935] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {currentUser?.fullName?.charAt(0) || 'C'}
              </div>
              <div className="truncate">
                <div className="text-[11px] font-bold text-[#212121] truncate">
                  {currentUser?.fullName || 'Fatima Noor'}
                </div>
                <div className="text-[10px] text-[#666666] truncate">
                  {currentUser?.phone || '0300-1234567'}
                </div>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#666666] hover:text-[#E53935] transition"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-[#E53935] text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.fullName?.charAt(0) || 'C'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
