import React from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  Receipt,
  Heart,
  Tag,
  MapPin,
  HelpCircle,
  Navigation,
  Flame,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { Order, Merchant, Coupon, CustomerAddress, ClientNavTab } from './types.ts';
import { ActiveOrderTracker } from './ActiveOrderTracker.tsx';

interface DashboardHomeProps {
  currentUser: any;
  currentAddress: CustomerAddress | null;
  onOpenAddressModal: () => void;
  orders: Order[];
  merchants: Merchant[];
  coupons: Coupon[];
  onNavigateTab: (tab: ClientNavTab) => void;
  onSelectMerchant: (slug: string) => void;
  onTrackOrder: (orderId: string) => void;
  onOpenOrderDetails: (order: Order) => void;
  onReorder: (order: Order) => void;
  onOpenReviewModal: (order: Order) => void;
  onApplyCouponToCart: (code: string) => void;
  isUrdu: boolean;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  currentUser,
  currentAddress,
  onOpenAddressModal,
  orders,
  merchants,
  coupons,
  onNavigateTab,
  onSelectMerchant,
  onTrackOrder,
  onOpenOrderDetails,
  onReorder,
  onOpenReviewModal,
  onApplyCouponToCart,
  isUrdu,
}) => {
  const customerName = currentUser?.fullName || (isUrdu ? 'معزز کسٹمر' : 'Food Lover');
  const recentOrders = orders.slice(0, 3);
  const featuredMerchants = merchants.slice(0, 4);

  const quickActions = [
    {
      id: 'food',
      label: 'Order Food',
      labelUr: 'کھانا آرڈر کریں',
      icon: UtensilsCrossed,
      color: 'bg-[#FFC107] text-[#212121]',
      action: () => onNavigateTab('browse_food'),
    },
    {
      id: 'grocery',
      label: 'Grocery',
      labelUr: 'گروسری مارٹ',
      icon: ShoppingBag,
      color: 'bg-[#FFFDF7] text-[#212121] border border-[#FFC107]',
      action: () => onNavigateTab('grocery'),
    },
    {
      id: 'orders',
      label: 'View Orders',
      labelUr: 'آرڈرز دیکھیں',
      icon: Receipt,
      color: 'bg-[#F5F5F5] text-[#212121]',
      action: () => onNavigateTab('orders'),
    },
    {
      id: 'favorites',
      label: 'Favorites',
      labelUr: 'پسندیدہ',
      icon: Heart,
      color: 'bg-[#F5F5F5] text-[#212121]',
      action: () => onNavigateTab('favorites'),
    },
    {
      id: 'coupons',
      label: 'Coupons',
      labelUr: 'کوپنز و آفرز',
      icon: Tag,
      color: 'bg-[#F5F5F5] text-[#212121]',
      action: () => onNavigateTab('coupons'),
    },
    {
      id: 'track',
      label: 'Track Order',
      labelUr: 'ٹریک کریں',
      icon: Navigation,
      color: 'bg-[#F5F5F5] text-[#212121]',
      action: () => {
        const active = orders.find((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
        if (active) onTrackOrder(active.id);
        else onNavigateTab('orders');
      },
    },
    {
      id: 'addresses',
      label: 'Manage Addresses',
      labelUr: 'پتے سنبھالیں',
      icon: MapPin,
      color: 'bg-[#F5F5F5] text-[#212121]',
      action: () => onNavigateTab('addresses'),
    },
    {
      id: 'support',
      label: 'Customer Support',
      labelUr: 'کسٹمر سپورٹ',
      icon: HelpCircle,
      color: 'bg-[#F5F5F5] text-[#212121]',
      action: () => onNavigateTab('support'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Welcome Header Banner */}
      <div className="bg-gradient-to-r from-white via-[#FFFDF7] to-white rounded-3xl p-5 sm:p-6 border border-[#E0E0E0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👋</span>
            <h1 className="text-lg sm:text-2xl font-black text-[#212121] tracking-tight">
              {isUrdu ? `خوش آمدید، ${customerName}` : `Welcome back, ${customerName}`}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#666666]">
            <span>
              {isUrdu
                ? 'کراچی کی تیز ترین ڈلیوری آپ کی دہلیز پر حاضر ہے'
                : 'Fastest doorstep food & grocery delivery in Karachi'}
            </span>
          </div>
        </div>

        {/* Current Delivery Address Bar */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-[#E0E0E0] shadow-xs">
          <MapPin className="w-4 h-4 text-[#E53935] flex-shrink-0" />
          <div className="text-xs truncate max-w-[200px]">
            <span className="text-[10px] text-[#666666] block leading-none">
              {isUrdu ? 'موجودہ پتہ' : 'Current Address'}
            </span>
            <span className="font-bold text-[#212121] truncate block">
              {currentAddress
                ? `${currentAddress.label}: ${currentAddress.area}`
                : 'Clifton Block 7, Karachi'}
            </span>
          </div>
          <button
            onClick={onOpenAddressModal}
            className="px-2.5 py-1 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[11px] font-bold text-[#212121] transition"
          >
            {isUrdu ? 'تبدیل' : 'Change'}
          </button>
        </div>
      </div>

      {/* 2. Promotional Banner (Yellow & Red Theme) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#FFC107] text-[#212121] p-5 sm:p-7 shadow-sm border border-[#FFD54F]">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E53935] text-white text-[11px] font-black uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5" />
            {isUrdu ? '40% تک رعایت' : 'Up to 40% OFF Deals'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#212121]">
            {isUrdu
              ? 'کراچی کے ذائقے دار کھانے، اب آدھی قیمت پر!'
              : 'Karachi Craving? Student Biryani, Karahi & Pizza'}
          </h2>
          <p className="text-xs sm:text-sm font-medium mt-1 text-[#212121]/90">
            {isUrdu
              ? 'کوڈ RAFTAR50 لگائیں اور حاصل کریں 250 روپے تک کی فوری بچت۔'
              : 'Use coupon code RAFTAR50 for instant Rs. 250 discount on your order.'}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('browse_food')}
              className="px-4 py-2 rounded-xl bg-[#212121] hover:bg-[#333333] text-white font-bold text-xs shadow-xs transition"
            >
              {isUrdu ? 'ابھی آرڈر کریں' : 'Order Now'}
            </button>
            <button
              onClick={() => onApplyCouponToCart('RAFTAR50')}
              className="px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-[#212121] font-bold text-xs transition border border-[#212121]/10"
            >
              {isUrdu ? 'کوپن RAFTAR50 کاپی کریں' : 'Copy RAFTAR50'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Active Order Card (§5) */}
      <ActiveOrderTracker
        orders={orders}
        onTrackOrder={onTrackOrder}
        onBrowseStores={() => onNavigateTab('browse_food')}
        isUrdu={isUrdu}
      />

      {/* 4. Quick Actions (§6) */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-[#212121] tracking-tight">
          {isUrdu ? 'فوری اقدامات' : 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.id}
                onClick={qa.action}
                className={`p-3.5 rounded-2xl flex items-center gap-3 transition shadow-xs hover:shadow-sm active:scale-[0.98] ${qa.color}`}
              >
                <div className="p-2 rounded-xl bg-white/80 text-[#212121] flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#E53935]" />
                </div>
                <span className="font-bold text-xs text-left rtl:text-right truncate">
                  {isUrdu ? qa.labelUr : qa.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Available Coupons Carousel */}
      {coupons.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#212121] tracking-tight">
              {isUrdu ? 'دستیاب کوپنز' : 'Available Coupons'}
            </h3>
            <button
              onClick={() => onNavigateTab('coupons')}
              className="text-xs font-bold text-[#E53935] hover:underline"
            >
              {isUrdu ? 'سب دیکھیں' : 'View all'} →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="min-w-[260px] bg-white rounded-2xl border border-[#E0E0E0] p-3.5 shadow-xs flex flex-col justify-between flex-shrink-0"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-[#E53935] text-white font-black text-xs">
                      {c.code}
                    </span>
                    <span className="text-[10px] text-[#666666]">
                      Min: Rs. {Math.round(c.minOrderAmount / 100)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#212121] line-clamp-2">
                    {c.description}
                  </p>
                </div>
                <button
                  onClick={() => onApplyCouponToCart(c.code)}
                  className="mt-3 w-full py-1.5 rounded-xl bg-[#FFFDF7] hover:bg-[#FFC107] border border-[#FFC107] text-[#212121] font-bold text-xs transition"
                >
                  {isUrdu ? 'کارٹ پر لگائیں' : 'Apply to Cart'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Recent Orders (§7) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#212121] tracking-tight">
            {isUrdu ? 'حالیہ آرڈرز' : 'Recent Orders'}
          </h3>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#E53935] hover:underline"
          >
            {isUrdu ? 'تمام آرڈرز' : 'All Orders'} →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 text-center shadow-xs">
            <p className="text-xs text-[#666666]">
              {isUrdu ? 'آپ نے ابھی تک کوئی آرڈر نہیں دیا ہے۔' : 'No past orders yet.'}
            </p>
            <button
              onClick={() => onNavigateTab('browse_food')}
              className="mt-3 px-4 py-2 rounded-xl bg-[#FFC107] text-[#212121] font-bold text-xs"
            >
              {isUrdu ? 'پہلا کھانا آرڈر کریں' : 'Order Your First Meal'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentOrders.map((order) => {
              const isDelivered = order.status === 'DELIVERED';
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-[#E0E0E0] p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-xs text-[#212121] truncate">
                          {order.merchantName}
                        </h4>
                        <span className="text-[10px] font-mono text-[#666666]">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDelivered
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-100 text-[#E53935]'
                            : 'bg-[#FFC107]/20 text-[#212121]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#666666] line-clamp-1 mb-2">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.payment.method.toUpperCase()}
                    </div>

                    <div className="text-xs font-black text-[#212121] mb-3">
                      Rs. {(order.pricing.total / 100).toLocaleString('en-PK')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#E0E0E0]">
                    <button
                      onClick={() => onReorder(order)}
                      className="flex-1 py-1.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-xs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isUrdu ? 'دوبارہ' : 'Reorder'}</span>
                    </button>
                    <button
                      onClick={() => onOpenOrderDetails(order)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#212121] font-semibold text-[11px] transition"
                    >
                      {isUrdu ? 'تفصیل' : 'Details'}
                    </button>
                    {isDelivered && (
                      <button
                        onClick={() => onOpenReviewModal(order)}
                        className="px-2.5 py-1.5 rounded-xl border border-[#E53935] text-[#E53935] hover:bg-[#E53935] hover:text-white font-semibold text-[11px] transition"
                        title="Review Order"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Recommended Restaurants Near You */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#212121] tracking-tight">
            {isUrdu ? 'آپ کے قریب مقبول ریسٹورنٹس' : 'Popular Restaurants Near You'}
          </h3>
          <button
            onClick={() => onNavigateTab('restaurants')}
            className="text-xs font-bold text-[#E53935] hover:underline"
          >
            {isUrdu ? 'سب دیکھیں' : 'View all'} →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredMerchants.map((merchant) => (
            <div
              key={merchant.id}
              onClick={() => onSelectMerchant(merchant.slug)}
              className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative h-32 bg-[#F5F5F5] overflow-hidden">
                <img
                  src={merchant.bannerUrl || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60'}
                  alt={merchant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                {merchant.hasFreeDelivery && (
                  <span className="absolute top-2 left-2 bg-[#E53935] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                    {isUrdu ? 'مفت ڈلیوری' : 'FREE DELIVERY'}
                  </span>
                )}
                <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#212121] flex items-center gap-1 shadow-xs">
                  <Star className="w-3 h-3 text-[#FFC107] fill-[#FFC107]" />
                  <span>{merchant.rating}</span>
                </div>
              </div>

              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <h4 className="font-bold text-xs text-[#212121] group-hover:text-[#E53935] transition truncate">
                    {merchant.name}
                  </h4>
                  <p className="text-[11px] text-[#666666] truncate mt-0.5">
                    {merchant.cuisines?.join(' • ') || 'Karachi Food & Sweets'}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-[#666666] mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#FFC107]" />
                      25-35 min
                    </span>
                    <span>•</span>
                    <span>{merchant.area}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E0E0E0] flex items-center justify-between">
                  <div className="text-[11px] font-bold text-[#212121]">
                    <span className="text-[#666666] line-through text-[10px] mr-1">Rs. 899</span>
                    <span>Rs. 599</span>
                  </div>
                  <button className="px-3 py-1 rounded-xl bg-[#FFC107] group-hover:bg-[#FFD54F] text-[#212121] font-bold text-[11px] shadow-xs transition">
                    {isUrdu ? 'مینیو دیکھیں' : 'Order Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
