import React, { useState, useEffect } from 'react';
import {
  ClientNavTab,
  Merchant,
  MenuItem,
  Order,
  Coupon,
  CustomerAddress,
  CustomerNotification,
  SupportTicket,
  PaymentMethodRecord,
} from './client/types.ts';
import { ClientHeader } from './client/ClientHeader.tsx';
import { ClientSidebar } from './client/ClientSidebar.tsx';
import { ClientBottomNav } from './client/ClientBottomNav.tsx';
import { DashboardHome } from './client/DashboardHome.tsx';
import { MyOrdersView } from './client/MyOrdersView.tsx';
import { FavoritesView } from './client/FavoritesView.tsx';
import { CouponsView } from './client/CouponsView.tsx';
import { AddressesView } from './client/AddressesView.tsx';
import { PaymentMethodsView } from './client/PaymentMethodsView.tsx';
import { NotificationsView } from './client/NotificationsView.tsx';
import { SupportView } from './client/SupportView.tsx';
import { ProfileSettingsView } from './client/ProfileSettingsView.tsx';

import {
  X,
  Star,
  Clock,
  MapPin,
  Bike,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Navigation,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Tag,
  WifiOff,
} from 'lucide-react';
import { soundEngine } from '../utils/audio.ts';

interface ClientDashboardProps {
  currentUser: any;
  accessToken: string;
  onLogout?: () => void;
  lang: 'en' | 'ur';
  onToggleLang: () => void;
  onViewOtherSurface?: (surface: string) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  currentUser,
  accessToken,
  onLogout,
  lang,
  onToggleLang,
  onViewOtherSurface,
}) => {
  const isUrdu = lang === 'ur';

  // Navigation State
  const [activeTab, setActiveTab] = useState<ClientNavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Network & Connectivity State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Data States
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [currentAddress, setCurrentAddress] = useState<CustomerAddress | null>(null);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [favoriteMerchantIds, setFavoriteMerchantIds] = useState<string[]>([]);
  const [favoriteItemIds, setFavoriteItemIds] = useState<string[]>([]);

  // Search & Filter State
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterFreeDelivery, setFilterFreeDelivery] = useState(false);
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);

  // Storefront & Menu Inspection
  const [selectedMerchantSlug, setSelectedMerchantSlug] = useState<string | null>(null);
  const [merchantDetails, setMerchantDetails] = useState<any>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  // Cart State
  const [cart, setCart] = useState<{
    merchantId: string | null;
    merchantName: string | null;
    items: any[];
  }>({
    merchantId: null,
    merchantName: null,
    items: [],
  });
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartCoupon, setCartCoupon] = useState('RAFTAR50');
  const [tipAmount, setTipAmount] = useState(5000);
  const [selectedPayment, setSelectedPayment] = useState<'cod' | 'jazzcash' | 'easypaisa' | 'raast' | 'card'>('cod');
  const [codNoteDenom, setCodNoteDenom] = useState<'exact' | '500' | '1000' | '5000'>('1000');
  const [priceQuote, setPriceQuote] = useState<any>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Modals
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('Delicious food and fast delivery!');
  const [reorderAffectedModal, setReorderAffectedModal] = useState<{
    order: Order;
    availableItems: any[];
    missingItems: any[];
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Connectivity Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial Boot Data
  useEffect(() => {
    fetchInitialData();
  }, [accessToken]);

  // Periodic Polling (every 3 seconds for orders & notifications)
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => {
      pollOrdersAndNotifs();
    }, 3000);
    return () => clearInterval(interval);
  }, [accessToken, trackingOrder]);

  // Pricing Quote Recalculation
  useEffect(() => {
    if (cart.items.length > 0 && cart.merchantId) {
      calculateQuote();
    } else {
      setPriceQuote(null);
    }
  }, [cart, cartCoupon, tipAmount, currentAddress]);

  const fetchInitialData = async () => {
    try {
      // 1. Categories
      const catRes = await fetch('/api/v1/catalog/categories');
      const catData = await catRes.json();
      if (catData.success) setCategories(catData.data);

      // 2. Merchants
      fetchMerchants();

      // 3. Coupons
      const coupRes = await fetch('/api/v1/orders/coupons');
      const coupData = await coupRes.json();
      if (coupData.success) setCoupons(coupData.data);

      if (accessToken) {
        // 4. Orders
        const ordRes = await fetch('/api/v1/orders', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const ordData = await ordRes.json();
        if (ordData.success) setOrders(ordData.data);

        // 5. Addresses
        const addrRes = await fetch('/api/v1/catalog/addresses', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const addrData = await addrRes.json();
        if (addrData.success && addrData.data.length > 0) {
          setAddresses(addrData.data);
          const def = addrData.data.find((a: any) => a.isDefault) || addrData.data[0];
          setCurrentAddress(def);
        }

        // 6. Notifications
        const notifRes = await fetch('/api/v1/customer/notifications', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const notifData = await notifRes.json();
        if (notifData.success) setNotifications(notifData.data);

        // 7. Payment Methods
        const payRes = await fetch('/api/v1/customer/payments/methods', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const payData = await payRes.json();
        if (payData.success) setPaymentMethods(payData.data);

        // 8. Support Tickets
        const supRes = await fetch('/api/v1/customer/support', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const supData = await supRes.json();
        if (supData.success) setTickets(supData.data);

        // 9. Favorites
        const favRes = await fetch('/api/v1/customer/favorites', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const favData = await favRes.json();
        if (favData.success) {
          setFavoriteMerchantIds(favData.data.merchantIds || []);
          setFavoriteItemIds(favData.data.itemIds || []);
        }
      }
    } catch (err) {
      console.error('Client data init error:', err);
    }
  };

  const pollOrdersAndNotifs = async () => {
    try {
      const [ordRes, notifRes] = await Promise.all([
        fetch('/api/v1/orders', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/v1/customer/notifications', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const ordData = await ordRes.json();
      if (ordData.success) {
        setOrders(ordData.data);
        if (trackingOrder) {
          const updated = ordData.data.find((o: Order) => o.id === trackingOrder.id);
          if (updated) setTrackingOrder(updated);
        }
      }
      const notifData = await notifRes.json();
      if (notifData.success) setNotifications(notifData.data);
    } catch (err) {
      // Degrade gracefully on dropped connection
    }
  };

  const fetchMerchants = async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab === 'grocery') params.append('type', 'shop');
      else if (activeTab === 'restaurants') params.append('type', 'restaurant');
      if (selectedCategory) params.append('category', selectedCategory);
      if (globalSearch) params.append('search', globalSearch);
      if (filterFreeDelivery) params.append('freeDelivery', 'true');
      if (filterOpenOnly) params.append('openOnly', 'true');

      const res = await fetch(`/api/v1/catalog/merchants?${params.toString()}`);
      const data = await res.json();
      if (data.success) setMerchants(data.data);
    } catch (err) {
      console.error('Fetch merchants error:', err);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [activeTab, selectedCategory, globalSearch, filterFreeDelivery, filterOpenOnly]);

  const loadMerchantDetails = async (slug: string) => {
    try {
      setSelectedMerchantSlug(slug);
      const res = await fetch(`/api/v1/catalog/merchants/${slug}`);
      const data = await res.json();
      if (data.success) {
        setMerchantDetails(data.data);
      }
    } catch (err) {
      showToast('Could not load merchant menu', true);
    }
  };

  const calculateQuote = async () => {
    try {
      const itemsPayload = cart.items.map((i) => ({
        itemId: i.itemId,
        quantity: i.quantity,
        selectedOptionIds: i.selectedOptionIds || [],
      }));

      const res = await fetch('/api/v1/orders/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: cart.merchantId,
          items: itemsPayload,
          couponCode: cartCoupon || undefined,
          fulfillmentMode: 'delivery',
          tipAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPriceQuote(data.data);
      }
    } catch (err) {
      console.error('Price quote calculation failed', err);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    if (cart.merchantId && cart.merchantId !== selectedMerchantSlug && cart.items.length > 0) {
      if (!window.confirm('Adding items from a different store will clear your current cart. Proceed?')) {
        return;
      }
      setCart({ merchantId: selectedMerchantSlug, merchantName: merchantDetails?.merchant?.name || 'Store', items: [] });
    }

    const newItem = {
      itemId: item.id,
      name: item.name,
      unitPrice: item.discountedPrice || item.price,
      quantity: itemQuantity,
      selectedOptionIds: [...selectedOptionIds],
    };

    setCart((prev) => ({
      merchantId: selectedMerchantSlug,
      merchantName: merchantDetails?.merchant?.name || prev.merchantName || 'Store',
      items: [...prev.items, newItem],
    }));

    soundEngine.playItemAdded();
    showToast(`Added ${item.name} to cart!`);
    setSelectedMenuItem(null);
    setItemQuantity(1);
    setSelectedOptionIds([]);
  };

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0 || !cart.merchantId) return;
    setIsPlacingOrder(true);

    try {
      const itemsPayload = cart.items.map((i) => ({
        itemId: i.itemId,
        quantity: i.quantity,
        selectedOptionIds: i.selectedOptionIds || [],
      }));

      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          merchantId: cart.merchantId,
          items: itemsPayload,
          fulfillmentMode: 'delivery',
          paymentMethod: selectedPayment,
          couponCode: cartCoupon || undefined,
          addressId: currentAddress?.id,
          tipAmount,
          customerNote: selectedPayment === 'cod' ? `Note: Carry change for Rs. ${codNoteDenom} note` : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundEngine.playOrderPlaced();
        showToast(`Order #${data.data.orderNumber} placed successfully!`);
        setCart({ merchantId: null, merchantName: null, items: [] });
        setShowCartModal(false);
        setOrders((prev) => [data.data, ...prev]);
        setTrackingOrder(data.data);
      } else {
        showToast(data.error?.message || 'Order placement failed', true);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, true);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleReorder = async (order: Order) => {
    try {
      const res = await fetch(`/api/v1/catalog/merchants/${order.merchantId}`);
      const data = await res.json();

      if (!data.success) {
        showToast('Store is currently unavailable for reorder', true);
        return;
      }

      const currentCatalog = data.data.items || [];
      const availableItems: any[] = [];
      const missingItems: any[] = [];

      order.items?.forEach((oldItem: any) => {
        const found = currentCatalog.find((c: any) => c.id === oldItem.itemId);
        if (found && found.isAvailable) {
          availableItems.push({
            itemId: found.id,
            name: found.name,
            unitPrice: found.discountedPrice || found.price,
            quantity: oldItem.quantity,
            selectedOptionIds: [],
          });
        } else {
          missingItems.push(oldItem);
        }
      });

      if (missingItems.length > 0) {
        setReorderAffectedModal({
          order,
          availableItems,
          missingItems,
        });
      } else {
        setCart({
          merchantId: order.merchantId,
          merchantName: order.merchantName,
          items: availableItems,
        });
        setShowCartModal(true);
        showToast('Reorder items loaded into cart!');
      }
    } catch (err) {
      showToast('Could not verify reorder items', true);
    }
  };

  const handleToggleFavorite = async (type: 'merchant' | 'item', id: string) => {
    try {
      const res = await fetch('/api/v1/customer/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'merchant') {
          setFavoriteMerchantIds(data.data.favorites.merchantIds);
        } else {
          setFavoriteItemIds(data.data.favorites.itemIds);
        }
        showToast(data.message);
      }
    } catch (err) {
      showToast('Failed to update favorite', true);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    try {
      const res = await fetch(`/api/v1/orders/${reviewOrder.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Thank you! Review submitted.');
        setReviewOrder(null);
      } else {
        showToast(data.error?.message || 'Review failed', true);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, true);
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Order cancelled successfully.');
        pollOrdersAndNotifs();
      } else {
        showToast(data.error?.message || 'Cancellation failed', true);
      }
    } catch (err: any) {
      showToast(`Cancel failed: ${err.message}`, true);
    }
  };

  const cartTotal = priceQuote?.pricing?.total || cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const activeOrdersCount = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className={`min-h-screen bg-[#FFFDF7] text-[#212121] flex flex-col font-sans ${
        isUrdu ? 'rtl' : 'ltr'
      }`}
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-[#E53935] text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 z-50">
          <WifiOff className="w-4 h-4" />
          <span>
            {isUrdu
              ? 'انٹرنیٹ رابطہ منقطع ہے۔ ایپ خود بخود بحال ہو جائے گی۔'
              : 'You are currently offline. Real-time updates will resume once connected.'}
          </span>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border text-xs font-bold animate-fade-in ${
            toastMessage.isError
              ? 'bg-[#E53935] text-white border-[#B71C1C]'
              : 'bg-[#212121] text-white border-l-4 border-l-[#FFC107] border-[#333333]'
          }`}
        >
          {toastMessage.isError ? (
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#FFC107] flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Client Header */}
      <ClientHeader
        currentAddress={currentAddress}
        addresses={addresses}
        onSelectAddress={(addr) => {
          setCurrentAddress(addr);
          showToast(`Switched delivery location to: ${addr.area}`);
        }}
        onOpenAddressModal={() => setActiveTab('addresses')}
        searchQuery={globalSearch}
        onSearchChange={setGlobalSearch}
        notifications={notifications}
        onMarkNotificationRead={async (id) => {
          await fetch(`/api/v1/customer/notifications/${id}/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        }}
        onMarkAllNotificationsRead={async () => {
          await fetch('/api/v1/customer/notifications/read-all', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          showToast('Marked all as read');
        }}
        cartCount={cart.items.length}
        onOpenCart={() => setShowCartModal(true)}
        lang={lang}
        onToggleLang={onToggleLang}
        currentUser={currentUser}
        onOpenProfile={() => setActiveTab('profile')}
        onLogout={onLogout}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-6">
        {/* Desktop Sidebar Navigation */}
        <ClientSidebar
          activeTab={activeTab}
          onSelectTab={(t) => {
            setActiveTab(t);
            setSelectedMerchantSlug(null);
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          cartCount={cart.items.length}
          unreadNotifsCount={unreadNotifsCount}
          activeOrdersCount={activeOrdersCount}
          currentUser={currentUser}
          onLogout={onLogout}
          isUrdu={isUrdu}
        />

        {/* Dynamic Main Surface Area */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
          {/* Storefront View if merchant selected */}
          {selectedMerchantSlug && merchantDetails ? (
            <div className="space-y-6">
              {/* Back button */}
              <button
                onClick={() => setSelectedMerchantSlug(null)}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E0E0E0] text-xs font-bold text-[#212121] hover:bg-[#F5F5F5] transition flex items-center gap-1.5"
              >
                ← {isUrdu ? 'واپس ڈیش بورڈ' : 'Back to Stores'}
              </button>

              {/* Merchant Banner */}
              <div className="relative h-48 sm:h-64 rounded-3xl overflow-hidden border border-[#E0E0E0]">
                <img
                  src={merchantDetails.merchant?.bannerUrl || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1000'}
                  alt={merchantDetails.merchant?.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6 flex flex-col justify-end text-white">
                  <h1 className="text-xl sm:text-3xl font-black">{merchantDetails.merchant?.name}</h1>
                  <p className="text-xs sm:text-sm text-gray-200 mt-1">
                    {merchantDetails.merchant?.cuisines?.join(' • ')} • {merchantDetails.merchant?.area}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                    <span className="flex items-center gap-1 bg-[#FFC107] text-[#212121] px-2 py-0.5 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-[#212121]" />
                      {merchantDetails.merchant?.rating}
                    </span>
                    <span>25-35 mins</span>
                    {merchantDetails.merchant?.hasFreeDelivery && (
                      <span className="bg-[#E53935] text-white px-2 py-0.5 rounded-full text-[10px]">
                        FREE DELIVERY
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Categories & Items */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-base text-[#212121]">
                  {isUrdu ? 'مینیو و ڈشز' : 'Menu & Specialties'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {merchantDetails.items?.map((item: MenuItem) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-[#E0E0E0] p-4 shadow-xs hover:border-[#FFC107] transition flex gap-3.5 justify-between"
                    >
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#212121]">{item.name}</h4>
                          <p className="text-xs text-[#666666] line-clamp-2 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-black text-sm text-[#212121]">
                            Rs. {((item.discountedPrice || item.price) / 100).toLocaleString('en-PK')}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedMenuItem(item);
                              setItemQuantity(1);
                              setSelectedOptionIds([]);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs flex items-center gap-1 shadow-xs transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isUrdu ? 'شامل کریں' : 'Add'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#F5F5F5] flex-shrink-0">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardHome
                  currentUser={currentUser}
                  currentAddress={currentAddress}
                  onOpenAddressModal={() => setActiveTab('addresses')}
                  orders={orders}
                  merchants={merchants}
                  coupons={coupons}
                  onNavigateTab={(t) => setActiveTab(t)}
                  onSelectMerchant={loadMerchantDetails}
                  onTrackOrder={(id) => {
                    const ord = orders.find((o) => o.id === id);
                    if (ord) setTrackingOrder(ord);
                  }}
                  onOpenOrderDetails={setDetailOrder}
                  onReorder={handleReorder}
                  onOpenReviewModal={setReviewOrder}
                  onApplyCouponToCart={(code) => {
                    setCartCoupon(code);
                    showToast(`Applied coupon: ${code}`);
                    setShowCartModal(true);
                  }}
                  isUrdu={isUrdu}
                />
              )}

              {(activeTab === 'browse_food' || activeTab === 'restaurants' || activeTab === 'grocery') && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E0E0E0] shadow-xs">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#212121]">
                        {activeTab === 'grocery'
                          ? isUrdu ? 'گروسری مارٹس' : 'Grocery & Fresh Marts'
                          : isUrdu ? 'ریسٹورنٹس اور کھانے' : 'Restaurants & Dining'}
                      </h2>
                      <p className="text-xs text-[#666666]">
                        {isUrdu
                          ? 'کراچی بھر سے تصدیق شدہ دکانیں اور فاسٹ ڈلیوری'
                          : 'Explore top rated outlets in your vicinity'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFilterFreeDelivery(!filterFreeDelivery)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          filterFreeDelivery
                            ? 'bg-[#E53935] text-white border-[#E53935]'
                            : 'bg-white text-[#212121] border-[#E0E0E0]'
                        }`}
                      >
                        {isUrdu ? 'مفت ڈلیوری' : 'Free Delivery Only'}
                      </button>
                    </div>
                  </div>

                  {/* Merchant Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {merchants.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => loadMerchantDetails(m.slug)}
                        className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="relative h-36 bg-[#F5F5F5]">
                          <img
                            src={m.bannerUrl || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500'}
                            alt={m.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          {m.hasFreeDelivery && (
                            <span className="absolute top-2 left-2 bg-[#E53935] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                              FREE DELIVERY
                            </span>
                          )}
                          <div className="absolute bottom-2 right-2 bg-white/95 px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#212121] flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#FFC107] fill-[#FFC107]" />
                            <span>{m.rating}</span>
                          </div>
                        </div>

                        <div className="p-4 flex flex-col justify-between flex-1">
                          <div>
                            <h3 className="font-extrabold text-sm text-[#212121] group-hover:text-[#E53935] transition">
                              {m.name}
                            </h3>
                            <p className="text-xs text-[#666666] mt-0.5 truncate">
                              {m.cuisines?.join(' • ')}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-[#666666] mt-2">
                              <Clock className="w-3.5 h-3.5 text-[#FFC107]" />
                              <span>25-35 mins</span>
                              <span>•</span>
                              <span>{m.area}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex items-center justify-between">
                            <span className="text-xs font-bold text-green-700">● Open Now</span>
                            <button className="px-3.5 py-1.5 rounded-xl bg-[#FFC107] group-hover:bg-[#FFD54F] text-[#212121] font-bold text-xs shadow-xs transition">
                              {isUrdu ? 'مینیو دیکھیں' : 'View Menu'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <MyOrdersView
                  orders={orders}
                  onTrackOrder={(id) => {
                    const ord = orders.find((o) => o.id === id);
                    if (ord) setTrackingOrder(ord);
                  }}
                  onOpenOrderDetails={setDetailOrder}
                  onReorder={handleReorder}
                  onOpenReviewModal={setReviewOrder}
                  onCancelOrder={handleCancelOrder}
                  isUrdu={isUrdu}
                />
              )}

              {activeTab === 'favorites' && (
                <FavoritesView
                  favoriteMerchantIds={favoriteMerchantIds}
                  favoriteItemIds={favoriteItemIds}
                  merchants={merchants}
                  onToggleFavorite={handleToggleFavorite}
                  onSelectMerchant={loadMerchantDetails}
                  onBrowseStores={() => setActiveTab('browse_food')}
                  isUrdu={isUrdu}
                />
              )}

              {activeTab === 'coupons' && (
                <CouponsView
                  coupons={coupons}
                  onApplyCouponToCart={(c) => {
                    setCartCoupon(c);
                    showToast(`Applied ${c} to cart!`);
                    setShowCartModal(true);
                  }}
                  isUrdu={isUrdu}
                />
              )}

              {activeTab === 'addresses' && (
                <AddressesView
                  addresses={addresses}
                  onSetDefaultAddress={async (id) => {
                    await fetch(`/api/v1/catalog/addresses/${id}/default`, {
                      method: 'PUT',
                      headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    setAddresses((prev) =>
                      prev.map((a) => ({ ...a, isDefault: a.id === id }))
                    );
                    const def = addresses.find((a) => a.id === id);
                    if (def) setCurrentAddress(def);
                    showToast('Default address updated');
                  }}
                  onDeleteAddress={async (id) => {
                    await fetch(`/api/v1/catalog/addresses/${id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    setAddresses((prev) => prev.filter((a) => a.id !== id));
                    showToast('Address deleted');
                  }}
                  onSaveAddress={async (data) => {
                    const res = await fetch('/api/v1/catalog/addresses', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                      },
                      body: JSON.stringify(data),
                    });
                    const resData = await res.json();
                    if (resData.success) {
                      setAddresses((prev) => [...prev, resData.data]);
                      if (data.isDefault) setCurrentAddress(resData.data);
                      showToast('New address saved!');
                    }
                  }}
                  isUrdu={isUrdu}
                />
              )}

              {activeTab === 'payments' && (
                <PaymentMethodsView
                  methods={paymentMethods}
                  onSetDefaultMethod={async (id) => {
                    await fetch(`/api/v1/customer/payments/methods/${id}/default`, {
                      method: 'PUT',
                      headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    setPaymentMethods((prev) =>
                      prev.map((m) => ({ ...m, isDefault: m.id === id }))
                    );
                    showToast('Default payment method updated');
                  }}
                  onDeleteMethod={async (id) => {
                    await fetch(`/api/v1/customer/payments/methods/${id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
                    showToast('Payment method removed');
                  }}
                  onAddMethod={async (data) => {
                    const res = await fetch('/api/v1/customer/payments/methods', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                      },
                      body: JSON.stringify(data),
                    });
                    const resData = await res.json();
                    if (resData.success) {
                      setPaymentMethods((prev) => [...prev, resData.data]);
                      showToast('Payment method saved!');
                    }
                  }}
                  isUrdu={isUrdu}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsView
                  notifications={notifications}
                  onMarkRead={async (id) => {
                    await fetch(`/api/v1/customer/notifications/${id}/read`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                    );
                  }}
                  onMarkAllRead={async () => {
                    await fetch('/api/v1/customer/notifications/read-all', {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                    showToast('All notifications marked read');
                  }}
                  isUrdu={isUrdu}
                />
              )}

              {activeTab === 'support' && (
                <SupportView
                  tickets={tickets}
                  orders={orders}
                  onCreateTicket={async (data) => {
                    const res = await fetch('/api/v1/customer/support', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                      },
                      body: JSON.stringify(data),
                    });
                    const resData = await res.json();
                    if (resData.success) {
                      setTickets((prev) => [resData.data, ...prev]);
                      showToast('Support ticket created!');
                    }
                  }}
                  onReplyTicket={async (ticketId, msg) => {
                    const res = await fetch(`/api/v1/customer/support/${ticketId}/reply`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                      },
                      body: JSON.stringify({ message: msg }),
                    });
                    const resData = await res.json();
                    if (resData.success) {
                      setTickets((prev) =>
                        prev.map((t) => (t.id === ticketId ? resData.data : t))
                      );
                    }
                  }}
                  isUrdu={isUrdu}
                />
              )}

              {(activeTab === 'profile' || activeTab === 'settings') && (
                <ProfileSettingsView
                  currentUser={currentUser}
                  onUpdateProfile={async (data) => {
                    const res = await fetch('/api/v1/customer/profile', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                      },
                      body: JSON.stringify(data),
                    });
                    const resData = await res.json();
                    if (resData.success) {
                      showToast('Profile updated!');
                    }
                  }}
                  lang={lang}
                  onToggleLang={onToggleLang}
                  isUrdu={isUrdu}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <ClientBottomNav
        activeTab={activeTab}
        onSelectTab={(t) => {
          setActiveTab(t);
          setSelectedMerchantSlug(null);
        }}
        cartCount={cart.items.length}
        activeOrdersCount={activeOrdersCount}
        onOpenCart={() => setShowCartModal(true)}
        cartTotal={cartTotal}
        isUrdu={isUrdu}
      />

      {/* Item Customization Modal */}
      {selectedMenuItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E0E0E0] shadow-2xl relative">
            <button
              onClick={() => setSelectedMenuItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#666666] hover:bg-[#F5F5F5]"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-40 rounded-2xl overflow-hidden mb-4 bg-[#F5F5F5]">
              <img
                src={selectedMenuItem.image || 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500'}
                alt={selectedMenuItem.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-black text-base text-[#212121]">{selectedMenuItem.name}</h3>
            <p className="text-xs text-[#666666] mt-1 leading-relaxed">{selectedMenuItem.description}</p>
            <div className="mt-4 flex items-center justify-between border-t border-[#E0E0E0] pt-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  className="w-8 h-8 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#212121] flex items-center justify-center font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black text-sm">{itemQuantity}</span>
                <button
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  className="w-8 h-8 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#212121] flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => handleAddToCart(selectedMenuItem)}
                className="px-5 py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs shadow-xs transition"
              >
                Add for Rs. {(((selectedMenuItem.discountedPrice || selectedMenuItem.price) * itemQuantity) / 100).toLocaleString('en-PK')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Cart & Checkout Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col border border-[#E0E0E0] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#E0E0E0] flex items-center justify-between bg-[#FFFDF7]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#E53935]" />
                <h3 className="font-black text-base text-[#212121]">
                  {isUrdu ? 'آپ کا شاپنگ کارٹ' : 'Checkout & Order Summary'}
                </h3>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-1 rounded-full text-[#666666] hover:bg-[#E0E0E0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {cart.items.length === 0 ? (
                <div className="text-center py-12 text-[#666666] text-xs">
                  {isUrdu ? 'آپ کا کارٹ خالی ہے' : 'Your cart is empty. Add delicious items to checkout!'}
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-2">
                    {cart.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F5] text-xs"
                      >
                        <div className="flex-1">
                          <span className="font-extrabold text-[#212121] block">{item.name}</span>
                          <span className="text-[11px] text-[#666666]">
                            Rs. {(item.unitPrice / 100).toLocaleString('en-PK')} × {item.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#212121]">
                            Rs. {((item.unitPrice * item.quantity) / 100).toLocaleString('en-PK')}
                          </span>
                          <button
                            onClick={() => {
                              setCart((prev) => ({
                                ...prev,
                                items: prev.items.filter((_, i) => i !== idx),
                              }));
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#212121] block">
                      {isUrdu ? 'طریقہ ادائیگی' : 'Payment Method'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'cod', label: 'Cash on Delivery' },
                        { id: 'jazzcash', label: 'JazzCash' },
                        { id: 'easypaisa', label: 'EasyPaisa' },
                        { id: 'card', label: 'Bank Card' },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          onClick={() => setSelectedPayment(pm.id as any)}
                          className={`p-2.5 rounded-xl font-bold text-xs border transition ${
                            selectedPayment === pm.id
                              ? 'bg-[#FFC107] text-[#212121] border-[#FFC107] shadow-xs'
                              : 'bg-white text-[#666666] border-[#E0E0E0]'
                          }`}
                        >
                          {pm.label}
                        </button>
                      ))}
                    </div>

                    {selectedPayment === 'cod' && (
                      <div className="mt-2 p-2.5 bg-[#FFFDF7] rounded-xl border border-[#FFD54F] text-xs">
                        <span className="font-bold text-[#212121] block mb-1">
                          {isUrdu ? 'بقایا نوٹ کی ضرورت' : 'Need change for note:'}
                        </span>
                        <div className="flex gap-2">
                          {['exact', '500', '1000', '5000'].map((denom) => (
                            <button
                              key={denom}
                              onClick={() => setCodNoteDenom(denom as any)}
                              className={`flex-1 py-1 rounded-lg text-[11px] font-bold border ${
                                codNoteDenom === denom
                                  ? 'bg-[#E53935] text-white border-[#E53935]'
                                  : 'bg-white text-[#212121] border-[#E0E0E0]'
                              }`}
                            >
                              {denom === 'exact' ? 'Exact' : `Rs. ${denom}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coupon Box */}
                  <div>
                    <label className="text-xs font-bold text-[#212121] block mb-1">
                      {isUrdu ? 'ڈسکاؤنٹ واؤچر' : 'Promo / Coupon Code'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cartCoupon}
                        onChange={(e) => setCartCoupon(e.target.value.toUpperCase())}
                        placeholder="RAFTAR50"
                        className="flex-1 p-2 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] uppercase font-mono font-bold"
                      />
                      <button
                        onClick={calculateQuote}
                        className="px-4 py-2 rounded-xl bg-[#212121] text-white font-bold text-xs"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Tip options */}
                  <div>
                    <label className="text-xs font-bold text-[#212121] block mb-1">
                      {isUrdu ? 'رائیڈر کے لیے بخشیش (Tip)' : 'Rider Tip (PKR)'}
                    </label>
                    <div className="flex gap-2">
                      {[0, 5000, 10000, 20000].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTipAmount(t)}
                          className={`flex-1 py-1.5 rounded-xl font-bold text-xs border ${
                            tipAmount === t
                              ? 'bg-[#FFC107] text-[#212121] border-[#FFC107]'
                              : 'bg-[#F5F5F5] text-[#666666] border-[#E0E0E0]'
                          }`}
                        >
                          {t === 0 ? 'Rs. 0' : `Rs. ${t / 100}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Breakdown */}
                  {priceQuote && (
                    <div className="bg-[#FFFDF7] p-3.5 rounded-2xl border border-[#FFD54F] space-y-1.5 text-xs">
                      <div className="flex justify-between text-[#666666]">
                        <span>Subtotal</span>
                        <span>Rs. {(priceQuote.pricing.subtotal / 100).toLocaleString('en-PK')}</span>
                      </div>
                      <div className="flex justify-between text-[#666666]">
                        <span>Delivery Fee</span>
                        <span>Rs. {(priceQuote.pricing.deliveryFee / 100).toLocaleString('en-PK')}</span>
                      </div>
                      {priceQuote.pricing.couponDiscount > 0 && (
                        <div className="flex justify-between text-green-700 font-bold">
                          <span>Coupon Discount</span>
                          <span>-Rs. {(priceQuote.pricing.couponDiscount / 100).toLocaleString('en-PK')}</span>
                        </div>
                      )}
                      {tipAmount > 0 && (
                        <div className="flex justify-between text-[#666666]">
                          <span>Rider Tip</span>
                          <span>Rs. {(tipAmount / 100).toLocaleString('en-PK')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black text-[#212121] pt-2 border-t border-[#FFD54F]">
                        <span>Total Payable</span>
                        <span>Rs. {(priceQuote.pricing.total / 100).toLocaleString('en-PK')}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="p-4 border-t border-[#E0E0E0] bg-white">
                <button
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-3 rounded-2xl bg-[#E53935] hover:bg-[#C62828] active:bg-[#B71C1C] text-white font-black text-sm shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPlacingOrder ? (
                    <span>Placing Order...</span>
                  ) : (
                    <>
                      <span>{isUrdu ? 'آرڈر کنفرم کریں' : 'Confirm & Place Order'}</span>
                      <span>•</span>
                      <span>Rs. {((priceQuote?.pricing?.total || cartTotal) / 100).toLocaleString('en-PK')}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Radar / Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E0E0E0] shadow-2xl relative">
            <button
              onClick={() => setTrackingOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#666666] hover:bg-[#F5F5F5]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-[#E53935] animate-ping" />
              <h3 className="font-black text-base text-[#212121]">
                Live Delivery Radar • #{trackingOrder.orderNumber}
              </h3>
            </div>
            <p className="text-xs text-[#666666] mb-4">
              {trackingOrder.merchantName} → {trackingOrder.deliveryAddress?.area || 'Clifton Block 7'}
            </p>

            {/* Radar simulation canvas */}
            <div className="h-48 rounded-2xl bg-[#212121] relative overflow-hidden flex items-center justify-center mb-4 border border-[#333333]">
              <div className="absolute inset-0 bg-[radial-gradient(#FFC107_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
              <div className="w-32 h-32 rounded-full border border-[#FFC107]/40 animate-ping absolute" />
              <div className="w-20 h-20 rounded-full border border-[#E53935]/60 absolute flex items-center justify-center text-white">
                <Bike className="w-7 h-7 text-[#FFC107] animate-bounce" />
              </div>
              <div className="absolute bottom-2 left-2 bg-black/80 px-2.5 py-1 rounded-lg text-[10px] text-white font-mono">
                ETA: 12 mins • Speed: 28 km/h
              </div>
            </div>

            {/* Delivery OTP card */}
            {trackingOrder.deliveryOtp && (
              <div className="bg-[#FFFDF7] border-2 border-[#FFC107] p-3 rounded-2xl flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#E53935]" />
                  <div>
                    <span className="text-[10px] text-[#666666] block font-bold uppercase">
                      Delivery Handshake OTP
                    </span>
                    <span className="text-xs text-[#212121] font-medium">
                      Provide this to rider upon arrival
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xl font-black text-[#212121] tracking-widest bg-white px-3 py-1 rounded-xl border border-[#FFC107]">
                  {trackingOrder.deliveryOtp}
                </span>
              </div>
            )}

            <button
              onClick={() => setTrackingOrder(null)}
              className="w-full py-2.5 rounded-xl bg-[#212121] text-white font-bold text-xs"
            >
              Close Tracker
            </button>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E0E0E0] shadow-2xl relative">
            <button
              onClick={() => setDetailOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#666666] hover:bg-[#F5F5F5]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-black text-base text-[#212121] mb-1">
              Order Receipt • #{detailOrder.orderNumber}
            </h3>
            <p className="text-xs text-[#666666] mb-4">
              {detailOrder.merchantName} • {new Date(detailOrder.createdAt).toLocaleString()}
            </p>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {detailOrder.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b border-[#F5F5F5]">
                  <span>{item.quantity}× {item.name}</span>
                  <span className="font-bold">Rs. {(item.totalPrice / 100).toLocaleString('en-PK')}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#FFFDF7] p-3 rounded-2xl border border-[#FFD54F] text-xs space-y-1 mb-4">
              <div className="flex justify-between text-[#666666]">
                <span>Subtotal</span>
                <span>Rs. {(detailOrder.pricing.subtotal / 100).toLocaleString('en-PK')}</span>
              </div>
              <div className="flex justify-between text-[#666666]">
                <span>Delivery Fee</span>
                <span>Rs. {(detailOrder.pricing.deliveryFee / 100).toLocaleString('en-PK')}</span>
              </div>
              {detailOrder.pricing.couponDiscount > 0 && (
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Coupon Discount</span>
                  <span>-Rs. {(detailOrder.pricing.couponDiscount / 100).toLocaleString('en-PK')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-[#212121] pt-2 border-t border-[#FFD54F]">
                <span>Grand Total</span>
                <span>Rs. {(detailOrder.pricing.total / 100).toLocaleString('en-PK')}</span>
              </div>
            </div>

            <button
              onClick={() => setDetailOrder(null)}
              className="w-full py-2.5 rounded-xl bg-[#212121] text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#E0E0E0] shadow-2xl relative">
            <button
              onClick={() => setReviewOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#666666] hover:bg-[#F5F5F5]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-black text-base text-[#212121] mb-1">
              Rate your order from {reviewOrder.merchantName}
            </h3>
            <p className="text-xs text-[#666666] mb-4">
              How was your food quality and rider speed?
            </p>

            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewRating(s)}
                  className="p-1 hover:scale-110 transition"
                >
                  <Star
                    className={`w-7 h-7 ${
                      s <= reviewRating
                        ? 'text-[#FFC107] fill-[#FFC107]'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write feedback..."
              className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none mb-4"
            />

            <button
              onClick={handleSubmitReview}
              className="w-full py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs shadow-xs transition"
            >
              Submit Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
