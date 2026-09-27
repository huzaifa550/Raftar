import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  Heart,
  User,
} from 'lucide-react';
import { ClientNavTab } from './types.ts';

interface ClientBottomNavProps {
  activeTab: ClientNavTab;
  onSelectTab: (tab: ClientNavTab) => void;
  cartCount: number;
  activeOrdersCount: number;
  onOpenCart: () => void;
  cartTotal?: number;
  isUrdu: boolean;
}

export const ClientBottomNav: React.FC<ClientBottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartCount,
  activeOrdersCount,
  onOpenCart,
  cartTotal = 0,
  isUrdu,
}) => {
  return (
    <>
      {/* Floating Sticky Cart Bar (When Cart Has Items) */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 left-3 right-3 md:hidden z-40 animate-bounce-short">
          <button
            onClick={onOpenCart}
            className="w-full bg-[#E53935] hover:bg-[#C62828] active:bg-[#B71C1C] text-white py-3 px-4 rounded-2xl shadow-xl flex items-center justify-between transition-transform active:scale-[0.98] border border-[#B71C1C]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#FFC107] text-[#212121] flex items-center justify-center font-black text-xs">
                {cartCount}
              </div>
              <span className="font-bold text-xs">
                {isUrdu ? 'کارٹ دیکھیں' : 'View Cart & Checkout'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-black text-sm">
              <span>Rs. {(cartTotal / 100).toLocaleString('en-PK')}</span>
              <span className="text-xs font-normal">→</span>
            </div>
          </button>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0E0E0] h-16 px-2 flex items-center justify-around z-40 shadow-lg"
      >
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center w-14 h-full transition ${
            activeTab === 'dashboard' ? 'text-[#E53935]' : 'text-[#666666]'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition ${
              activeTab === 'dashboard' ? 'bg-[#FFC107]/20 text-[#212121]' : ''
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">
            {isUrdu ? 'ہوم' : 'Home'}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('orders')}
          className={`flex flex-col items-center justify-center w-14 h-full relative transition ${
            activeTab === 'orders' ? 'text-[#E53935]' : 'text-[#666666]'
          }`}
        >
          <div
            className={`p-1 rounded-xl relative transition ${
              activeTab === 'orders' ? 'bg-[#FFC107]/20 text-[#212121]' : ''
            }`}
          >
            <Receipt className="w-5 h-5" />
            {activeOrdersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E53935] text-white text-[9px] font-black flex items-center justify-center">
                {activeOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5">
            {isUrdu ? 'آرڈرز' : 'Orders'}
          </span>
        </button>

        <button
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center w-14 h-full relative text-[#666666] active:scale-95 transition"
        >
          <div className="relative p-1">
            <ShoppingBag className="w-5 h-5 text-[#E53935]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FFC107] text-[#212121] text-[9px] font-black flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5">
            {isUrdu ? 'کارٹ' : 'Cart'}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('favorites')}
          className={`flex flex-col items-center justify-center w-14 h-full transition ${
            activeTab === 'favorites' ? 'text-[#E53935]' : 'text-[#666666]'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition ${
              activeTab === 'favorites' ? 'bg-[#FFC107]/20 text-[#212121]' : ''
            }`}
          >
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">
            {isUrdu ? 'پسندیدہ' : 'Favorites'}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center w-14 h-full transition ${
            activeTab === 'profile' ? 'text-[#E53935]' : 'text-[#666666]'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition ${
              activeTab === 'profile' ? 'bg-[#FFC107]/20 text-[#212121]' : ''
            }`}
          >
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">
            {isUrdu ? 'پروفائل' : 'Profile'}
          </span>
        </button>
      </nav>
    </>
  );
};
