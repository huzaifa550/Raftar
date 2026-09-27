import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Bike,
  UtensilsCrossed,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Plus,
  Minus,
  X,
  Store,
  ChevronRight,
  Receipt,
  Navigation,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingUp,
  Volume2,
  VolumeX,
  Globe,
  Flame,
  AlertTriangle,
  Play,
  LogOut,
} from 'lucide-react';
import { AdminPanel } from './components/AdminPanel.tsx';
import { FinanceAdminHub } from './components/FinanceAdminHub.tsx';
import { ClientDashboard } from './components/ClientDashboard.tsx';
import { AuthScreen } from './components/AuthScreen.tsx';
import { soundEngine } from './utils/audio.ts';

// Types
interface Category {
  id: string;
  name: string;
  slug: string;
  type: 'food' | 'grocery';
  icon: string;
}

interface DeliveryZone {
  areaName: string;
  baseFee: number;
  perKmFee: number;
  minEstimatedMinutes: number;
  maxEstimatedMinutes: number;
}

interface Merchant {
  id: string;
  name: string;
  slug: string;
  type: 'restaurant' | 'shop';
  rating: number;
  reviewCount: number;
  area: string;
  cuisines: string[];
  isOpen: boolean;
  hasFreeDelivery: boolean;
  logoUrl: string;
  bannerUrl: string;
  commissionRate: number;
  deliveryZones: DeliveryZone[];
}

interface OptionChoice {
  id: string;
  name: string;
  additionalPrice: number;
  isAvailable: boolean;
}

interface OptionGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  choices: OptionChoice[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  image: string;
  isAvailable: boolean;
  optionGroups?: OptionGroup[];
}

interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  status: 'online' | 'offline' | 'busy';
  activeOrderId: string | null;
  rating: number;
  completedOrdersCount: number;
  cashInHand: number;
  todayEarnings: number;
}

interface DispatchOffer {
  id: string;
  orderId: string;
  orderNumber: string;
  merchantName: string;
  merchantAddress: string;
  deliveryAddress: {
    streetAddress: string;
    area: string;
    city: string;
  };
  pickupDistanceKm: number;
  deliveryDistanceKm: number;
  estimatedEarning: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  merchantId: string;
  merchantName: string;
  merchantType: 'restaurant' | 'shop';
  fulfillmentMode: 'delivery' | 'pickup';
  status: string;
  pricing: {
    subtotal: number;
    couponDiscount: number;
    deliveryFee: number;
    serviceFee: number;
    tip: number;
    total: number;
  };
  deliveryOtp: string;
  payment: {
    method: string;
    status: string;
  };
  statusHistory: Array<{
    toStatus: string;
    timestamp: string;
    reason?: string;
  }>;
  createdAt: string;
}

export default function App() {
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [activeMainSurface, setActiveMainSurface] = useState<
    'discovery' | 'storefront' | 'orders' | 'merchant_portal' | 'rider_app' | 'telemetry_radar' | 'phase1_hub' | 'finance_hub' | 'admin_panel'
  >('discovery');

  // Multi-Channel Payment & Dispute State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'jazzcash' | 'easypaisa' | 'raast' | 'card'>('cod');
  const [codNoteDenomination, setCodNoteDenomination] = useState<'exact' | '500' | '1000' | '5000'>('exact');
  const [walletPhone, setWalletPhone] = useState<string>('03001234567');
  const [raastId, setRaastId] = useState<string>('03001234567');
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '4242 4242 4242 4242',
    cardHolder: 'Muhammad Ali',
    expiryMonth: '12',
    expiryYear: '28',
    cvv: '123',
  });

  // Location State
  const [selectedArea, setSelectedArea] = useState<{ name: string; lat: number; lng: number }>({
    name: 'Clifton Block 7',
    lat: 24.825,
    lng: 67.034,
  });

  // Discovery State
  const [activeServiceTab, setActiveServiceTab] = useState<'all' | 'food' | 'grocery'>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFreeDelivery, setFilterFreeDelivery] = useState<boolean>(false);
  const [filterOpenOnly, setFilterOpenOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'deliveryTime' | 'distance'>('popular');

  // Storefront & Cart State
  const [selectedMerchantSlug, setSelectedMerchantSlug] = useState<string | null>(null);
  const [merchantDetails, setMerchantDetails] = useState<any>(null);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [cart, setCart] = useState<{
    merchantId: string | null;
    merchantName: string | null;
    items: any[];
  }>({
    merchantId: null,
    merchantName: null,
    items: [],
  });

  // Checkout State
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string>('RAFTAR50');
  const [tipAmount, setTipAmount] = useState<number>(5000);
  const [priceQuote, setPriceQuote] = useState<any>(null);
  const [orderToast, setOrderToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setOrderToast({ message, isError });
    setTimeout(() => setOrderToast(null), 3500);
  };

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);

  // Merchant Portal State
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('merch_student_biryani');
  const [merchantDashboard, setMerchantDashboard] = useState<any>(null);
  const [merchantItems, setMerchantItems] = useState<MenuItem[]>([]);
  const [isChimeMuted, setIsChimeMuted] = useState<boolean>(false);

  // Rider App State
  const [selectedRiderId, setSelectedRiderId] = useState<string>('rider_001');
  const [currentRider, setCurrentRider] = useState<Rider | null>(null);
  const [activeOffer, setActiveOffer] = useState<DispatchOffer | null>(null);
  const [offerCountdown, setOfferCountdown] = useState<number>(30);
  const [otpVerifyInput, setOtpVerifyInput] = useState<string>('');
  const [riderSimulatingMove, setRiderSimulatingMove] = useState<boolean>(false);

  // Telemetry radar state
  const [radarTrackingData, setRadarTrackingData] = useState<any>(null);

  // Session
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: '' }),
      });
    } catch {
      // Ignore network errors on logout
    }
    setCurrentUser(null);
    setAccessToken('');
    setIsLoggedIn(false);
    setCart({ merchantId: null, merchantName: null, items: [] });
    showToast('You have been logged out securely.');
  };

  const handleLoginSuccess = (user: any, token: string, initialSurface = 'discovery') => {
    setCurrentUser(user);
    setAccessToken(token);
    setIsLoggedIn(true);
    setActiveMainSurface(initialSurface as any);
    fetchOrders(token);
  };

  // Initial Boot
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Poll / Refetch Merchants
  useEffect(() => {
    fetchMerchants();
  }, [activeServiceTab, selectedCategory, filterFreeDelivery, filterOpenOnly, sortBy, selectedArea]);

  // Pricing quote calculation
  useEffect(() => {
    if (cart.items.length > 0 && cart.merchantId) {
      fetchPriceQuote();
    } else {
      setPriceQuote(null);
    }
  }, [cart, appliedCoupon, tipAmount, selectedArea]);

  // Periodic Surface-Aware Polling (Graceful background updates)
  useEffect(() => {
    if (!accessToken) return;

    const timer = setInterval(() => {
      // 1. Live Order Tracking Telemetry (if actively following a live rider)
      if (activeTrackingOrderId) {
        fetchTelemetry(activeTrackingOrderId);
      }

      // 2. Orders Pipeline (only refresh regularly if user is on orders screen or tracking)
      if (activeMainSurface === 'orders' || activeTrackingOrderId) {
        fetchOrders(accessToken);
      }

      // 3. Merchant Portal (only when restaurant partner is logged in & viewing merchant portal)
      if (activeMainSurface === 'merchant_portal') {
        fetchMerchantPortalData();
      }

      // 4. Rider App (only when courier is on the rider app surface)
      if (activeMainSurface === 'rider_app') {
        fetchRiderData();
      }
    }, activeTrackingOrderId ? 4000 : 10000);

    return () => clearInterval(timer);
  }, [accessToken, selectedMerchantId, selectedRiderId, activeTrackingOrderId, activeMainSurface]);

  // 30-Second Dispatch Offer Countdown Timer
  useEffect(() => {
    if (!activeOffer) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeOffer.expiresAt - Date.now()) / 1000));
      setOfferCountdown(remaining);
      if (remaining <= 0) {
        setActiveOffer(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeOffer]);

  const fetchInitialData = async () => {
    try {
      const catRes = await fetch('/api/v1/catalog/categories');
      const catData = await catRes.json();
      if (catData.success) setCategories(catData.data);

      const authRes = await fetch('/api/v1/auth/switch-demo-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer' }),
      });
      const authData = await authRes.json();
      if (authData.success) {
        setCurrentUser(authData.data.user);
        setAccessToken(authData.data.accessToken);
        fetchOrders(authData.data.accessToken);
      }
    } catch (err) {
      console.error('Init error:', err);
    }
  };

  const switchDemoRole = async (role: string) => {
    try {
      const res = await fetch('/api/v1/auth/switch-demo-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.data.user);
        setAccessToken(data.data.accessToken);
        showToast(`Switched active demo persona to: ${role.toUpperCase()}`);
        if (role === 'customer') setActiveMainSurface('discovery');
        else if (role === 'restaurant_partner') setActiveMainSurface('merchant_portal');
        else if (role === 'rider') setActiveMainSurface('rider_app');
        else if (role === 'finance_staff') setActiveMainSurface('finance_hub');
        else if (role === 'super_admin') setActiveMainSurface('admin_panel');
        fetchOrders(data.data.accessToken);
      }
    } catch (err: any) {
      showToast(`Role switch failed: ${err.message}`, true);
    }
  };

  const fetchMerchants = async () => {
    try {
      const params = new URLSearchParams();
      if (activeServiceTab !== 'all') {
        params.append('type', activeServiceTab === 'food' ? 'restaurant' : 'shop');
      }
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (filterFreeDelivery) params.append('freeDelivery', 'true');
      if (filterOpenOnly) params.append('openOnly', 'true');
      if (sortBy) params.append('sortBy', sortBy);
      params.append('lat', selectedArea.lat.toString());
      params.append('lng', selectedArea.lng.toString());

      const res = await fetch(`/api/v1/catalog/merchants?${params.toString()}`);
      const data = await res.json();
      if (data.success) setMerchants(data.data);
    } catch (err) {
      console.error('Merchants fetch failed:', err);
    }
  };

  const openMerchantStore = async (slug: string) => {
    setSelectedMerchantSlug(slug);
    setActiveMainSurface('storefront');
    try {
      const res = await fetch(`/api/v1/catalog/merchants/${slug}?lat=${selectedArea.lat}&lng=${selectedArea.lng}`);
      const data = await res.json();
      if (data.success) setMerchantDetails(data.data);
    } catch (err) {
      console.error('Storefront load error:', err);
    }
  };

  const fetchPriceQuote = async () => {
    try {
      const payload = {
        merchantId: cart.merchantId,
        items: cart.items.map((i) => ({
          itemId: i.itemId,
          quantity: i.quantity,
          selectedOptionIds: i.selectedOptionIds,
        })),
        couponCode: appliedCoupon || undefined,
        fulfillmentMode: 'delivery',
        lat: selectedArea.lat,
        lng: selectedArea.lng,
        tipAmount,
      };
      const res = await fetch('/api/v1/orders/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) setPriceQuote(data.data.pricing);
    } catch (err) {
      console.error('Quote error:', err);
    }
  };

  const handleAddToCart = () => {
    if (!customizingItem || !merchantDetails) return;
    const currentMerchantId = merchantDetails.merchant.id;
    const currentMerchantName = merchantDetails.merchant.name;

    if (cart.merchantId && cart.merchantId !== currentMerchantId) {
      if (!window.confirm(`Clear current items from ${cart.merchantName} to add items from ${currentMerchantName}?`)) return;
      setCart({ merchantId: null, merchantName: null, items: [] });
    }

    const newItem = {
      id: `cart_${Date.now()}`,
      itemId: customizingItem.id,
      merchantId: currentMerchantId,
      merchantName: currentMerchantName,
      name: customizingItem.name,
      unitPrice: customizingItem.discountedPrice || customizingItem.price,
      quantity: itemQuantity,
      selectedOptionIds,
      optionsPrice: 0,
    };

    setCart((prev) => ({
      merchantId: currentMerchantId,
      merchantName: currentMerchantName,
      items: [...prev.items, newItem],
    }));

    setCustomizingItem(null);
    showToast(`Added ${itemQuantity}x ${customizingItem.name} to basket!`);
  };

  const handlePlaceOrder = async () => {
    if (!cart.merchantId || cart.items.length === 0 || !accessToken) return;
    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          merchantId: cart.merchantId,
          items: cart.items.map((it) => ({
            itemId: it.itemId,
            quantity: it.quantity,
            selectedOptionIds: it.selectedOptionIds,
          })),
          fulfillmentMode: 'delivery',
          paymentMethod: selectedPaymentMethod,
          couponCode: appliedCoupon || undefined,
          tipAmount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCart({ merchantId: null, merchantName: null, items: [] });
        setShowCheckoutModal(false);
        setActiveTrackingOrderId(data.data.id);
        setActiveMainSurface('orders');
        showToast(`Order ${data.data.orderNumber} placed! Delivery OTP: ${data.data.deliveryOtp}`);
        fetchOrders(accessToken);
        fetchMerchantPortalData();
      } else {
        showToast(data.error?.message || 'Order failed', true);
      }
    } catch (err: any) {
      showToast(`Order error: ${err.message}`, true);
    }
  };

  const fetchOrders = async (token?: string) => {
    const t = token || accessToken;
    if (!t) return;
    try {
      const res = await fetch('/api/v1/orders', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setOrders(data.data);
      }
    } catch {
      // Gracefully ignore network hiccups during background polling
    }
  };

  const fetchMerchantPortalData = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/v1/dispatch/merchant/dashboard?merchantId=${selectedMerchantId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setMerchantDashboard(data.data);
      }

      const menuRes = await fetch(`/api/v1/catalog/merchants/${selectedMerchantId}`);
      if (menuRes.ok) {
        const mData = await menuRes.json();
        if (mData.success && mData.data?.categories) {
          const allItems = mData.data.categories.flatMap((c: any) => c.items);
          setMerchantItems(allItems);
        }
      }
    } catch {
      // Graceful poll
    }
  };

  const fetchRiderData = async () => {
    if (!accessToken) return;
    try {
      const ridersRes = await fetch('/api/v1/dispatch/riders');
      const rData = await ridersRes.json();
      if (rData.success && rData.data.length > 0) {
        const r = rData.data.find((item: any) => item.id === selectedRiderId) || rData.data[0];
        setCurrentRider(r);
      }

      const offerRes = await fetch(`/api/v1/dispatch/riders/${selectedRiderId}/active-offer`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const oData = await offerRes.json();
      if (oData.success && oData.data) {
        setActiveOffer(oData.data);
        setOfferCountdown(oData.data.remainingSeconds || 30);
      } else {
        setActiveOffer(null);
      }
    } catch {
      // Graceful poll
    }
  };

  const handleToggleRiderShift = async (goOnline: boolean) => {
    try {
      const res = await fetch(`/api/v1/dispatch/riders/${selectedRiderId}/shift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isOnline: goOnline }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentRider((prev) => (prev ? { ...prev, status: data.data.status } : null));
        showToast(`Rider shift: ${data.data.status.toUpperCase()}`);
      }
    } catch (err: any) {
      showToast(`Shift toggle error: ${err.message}`, true);
    }
  };

  const handleRespondOffer = async (offerId: string, accept: boolean) => {
    try {
      const res = await fetch(`/api/v1/dispatch/offers/${offerId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ riderId: selectedRiderId, accept }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveOffer(null);
        showToast(accept ? 'Offer accepted! Routing to merchant...' : 'Offer declined. Cascaded to next rider.');
        fetchRiderData();
        fetchOrders(accessToken);
      } else {
        showToast(data.error?.message || 'Offer response failed', true);
      }
    } catch (err: any) {
      showToast(`Offer response failed: ${err.message}`, true);
    }
  };

  const handleMerchantAcceptPrep = async (orderId: string, prepMinutes: number) => {
    try {
      const res = await fetch('/api/v1/dispatch/merchant/prep-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderId, prepMinutes }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order accepted! Kitchen prep clock set to ${prepMinutes}m.`);
        fetchMerchantPortalData();
        fetchOrders(accessToken);
      } else {
        showToast(data.error?.message || 'Accept failed', true);
      }
    } catch (err: any) {
      showToast(`Accept failed: ${err.message}`, true);
    }
  };

  const handleToggle86Item = async (itemId: string, isAvailable: boolean) => {
    try {
      const res = await fetch(`/api/v1/dispatch/merchant/menu-item/${itemId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isAvailable, merchantId: selectedMerchantId }),
      });
      const data = await res.json();
      if (data.success) {
        setMerchantItems((prev) =>
          prev.map((it) => (it.id === itemId ? { ...it, isAvailable } : it))
        );
        showToast(`Item availability set to: ${isAvailable ? 'AVAILABLE' : '86 / SOLD OUT'}`);
      } else {
        showToast(data.error?.message || 'Toggle failed', true);
      }
    } catch (err: any) {
      showToast(`Toggle failed: ${err.message}`, true);
    }
  };

  const fetchTelemetry = async (orderId: string) => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/v1/dispatch/orders/${orderId}/live-tracking`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setRadarTrackingData(data.data);
      }
    } catch {
      // Graceful poll retry
    }
  };

  const handleRiderStepTransition = async (orderId: string, targetStatus: string, otp?: string) => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetStatus,
          otp,
          reason: `Rider action: ${targetStatus}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (targetStatus === 'DELIVERED') {
          soundEngine.playDeliverySuccess();
          showToast('Delivery confirmed with OTP! Twilio customer notification dispatched.');
        } else {
          showToast(`Progressed to: ${targetStatus}`);
        }
        fetchOrders(accessToken);
        fetchRiderData();
      } else {
        showToast(data.error?.message || 'Transition failed', true);
      }
    } catch (err: any) {
      showToast(`Step failed: ${err.message}`, true);
    }
  };

  const isRtl = lang === 'ur';
  const cartSubtotal = cart.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // If logged out, render AuthScreen
  if (!isLoggedIn) {
    return (
      <div
        className={`min-h-screen bg-[#FFFDF7] text-[#212121] flex flex-col font-sans ${
          isRtl ? 'rtl' : 'ltr'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          onToast={showToast}
          lang={lang}
          initialTab={activeMainSurface === 'admin_panel' ? 'admin' : 'customer'}
        />
        {orderToast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border ${
              orderToast.isError
                ? 'bg-[#E53935] text-white border-[#B71C1C]'
                : 'bg-[#212121] text-white border-l-4 border-l-[#FFC107] border-[#333333]'
            } animate-fade-in`}
          >
            {orderToast.isError ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-white" />
            ) : (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#FFC107]" />
            )}
            <span className="text-xs font-semibold">{orderToast.message}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#FFFDF7] text-[#212121] flex flex-col font-sans ${
        isRtl ? 'rtl' : 'ltr'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Toast Banner - Modern Yellow & Red theme */}
      {orderToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border ${
            orderToast.isError
              ? 'bg-[#E53935] text-white border-[#B71C1C]'
              : 'bg-[#212121] text-white border-l-4 border-l-[#FFC107] border-[#333333]'
          } animate-fade-in`}
        >
          {orderToast.isError ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-white" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#FFC107]" />
          )}
          <span className="text-xs font-semibold">{orderToast.message}</span>
        </div>
      )}

      {/* Demo Persona Switcher Bar */}
      <div className="bg-white text-[#212121] border-b border-[#E0E0E0] py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 whitespace-nowrap text-[#666666]">
            <span className="font-bold text-[#212121] uppercase text-[10px] tracking-wider">Demo Persona:</span>
            <span>{currentUser?.fullName || 'Customer'}</span>
          </div>
          <div className="flex items-center gap-1">
            {[
              { id: 'customer', label: 'Customer' },
              { id: 'restaurant_partner', label: 'Restaurant' },
              { id: 'rider', label: 'Rider' },
              { id: 'finance_staff', label: 'Finance' },
              { id: 'super_admin', label: 'Admin' },
            ].map((p) => {
              const active = currentUser?.roles?.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => switchDemoRole(p.id)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition ${
                    active
                      ? 'bg-[#FFC107] text-[#212121] shadow-xs'
                      : 'text-[#666666] hover:text-[#212121] hover:bg-[#F5F5F5]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeMainSurface === 'discovery' ? (
        <ClientDashboard
          currentUser={currentUser}
          accessToken={accessToken}
          onLogout={handleLogout}
          lang={lang}
          onToggleLang={() => setLang(lang === 'en' ? 'ur' : 'en')}
          onViewOtherSurface={(surface) => setActiveMainSurface(surface as any)}
        />
      ) : (
        <>
          {/* Main Header - Navigation: White background with Yellow/Red branding */}
          <header className="sticky top-0 z-40 bg-white text-[#212121] border-b border-[#E0E0E0] shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <button
                  onClick={() => setActiveMainSurface('discovery')}
                  className="flex items-center gap-2.5 text-left focus:outline-none group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#FFC107] text-[#212121] flex items-center justify-center font-black text-base shadow-sm ring-1 ring-[#FFC107]/40 group-hover:bg-[#FFD54F] transition-colors">
                    <span>رفتار</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-extrabold text-xl text-[#212121] tracking-tight">Raftaar</span>
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E53935] text-white tracking-wider uppercase">
                      Operations
                    </span>
                  </div>
                </button>
              </div>

              {/* Center Navigation Tabs */}
              <div className="hidden lg:flex items-center gap-1 p-1 bg-[#F5F5F5] rounded-2xl border border-[#E0E0E0] text-xs">
                {[
                  { id: 'discovery', label: 'Client Dashboard', icon: Store },
                  { id: 'merchant_portal', label: 'Merchant Kitchen', icon: UtensilsCrossed, action: fetchMerchantPortalData },
                  { id: 'rider_app', label: 'Rider App', icon: Bike, action: fetchRiderData },
                  { id: 'telemetry_radar', label: 'Live Radar', icon: Navigation, action: () => activeTrackingOrderId && fetchTelemetry(activeTrackingOrderId) },
                  { id: 'finance_hub', label: 'Finance', icon: Receipt },
                  { id: 'admin_panel', label: 'Admin Panel', icon: ShieldCheck },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeMainSurface === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveMainSurface(tab.id as any);
                        if (tab.action) tab.action();
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                        active
                          ? 'bg-[#FFC107] text-[#212121] shadow-xs'
                          : 'text-[#666666] hover:text-[#212121] hover:bg-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#212121]' : 'text-[#666666]'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Header Controls */}
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                <button
                  onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
                  className="px-2.5 py-1.5 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-xs font-semibold text-[#212121] border border-[#E0E0E0] flex items-center gap-1 transition"
                >
                  <Globe className="w-3.5 h-3.5 text-[#E53935]" />
                  <span>{lang === 'en' ? 'اردو' : 'EN'}</span>
                </button>

                {/* Accessible Header Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#E53935] border border-red-200 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  title="Log Out of Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          {/* Surface Bar (Mobile Friendly) */}
          <div className="lg:hidden bg-white border-b border-[#E0E0E0] text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto space-x-1 rtl:space-x-reverse py-2">
              {[
                { id: 'discovery', label: 'Client Dashboard' },
                { id: 'merchant_portal', label: 'Kitchen', action: fetchMerchantPortalData },
                { id: 'rider_app', label: 'Rider', action: fetchRiderData },
                { id: 'telemetry_radar', label: 'Radar' },
                { id: 'finance_hub', label: 'Finance' },
                { id: 'admin_panel', label: 'Admin' },
              ].map((tab) => {
                const active = activeMainSurface === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveMainSurface(tab.id as any);
                      if (tab.action) tab.action();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap ${
                      active ? 'bg-[#FFC107] text-[#212121] shadow-xs' : 'text-[#666666] hover:text-[#212121]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Surface Render - Light Background: #FFFDF7 */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#FFFDF7]">
        {/* ======================================================== */}
        {/* SURFACE: MERCHANT KITCHEN PORTAL                         */}
        {/* ======================================================== */}
        {activeMainSurface === 'merchant_portal' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#212121] flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-[#E53935]" />
                    <span>Merchant Kitchen Live Operations</span>
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#E53935] text-white shadow-xs">
                    Live Dispatch Linked
                  </span>
                </div>
                <p className="text-xs text-[#666666] mt-1">
                  Active kitchen queue, auditory incoming order alert chime, prep time clock, and instant 86 menu item toggle.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={selectedMerchantId}
                  onChange={(e) => {
                    setSelectedMerchantId(e.target.value);
                    fetchMerchantPortalData();
                  }}
                  className="bg-white border border-[#E0E0E0] text-[#212121] text-xs rounded-xl px-3 py-2 font-bold focus:border-[#FFC107] focus:outline-none"
                >
                  <option value="merch_student_biryani">Student Biryani (Saddar)</option>
                  <option value="merch_kolachi">Kolachi (Do Darya)</option>
                  <option value="merch_bundu_khan">Bundu Khan BBQ</option>
                  <option value="merch_imtiaz">Imtiaz Super Market</option>
                </select>

                <button
                  onClick={() => setIsChimeMuted(!isChimeMuted)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    isChimeMuted
                      ? 'bg-[#F5F5F5] text-[#666666] border-[#E0E0E0]'
                      : 'bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] border-[#FFC107] shadow-xs'
                  }`}
                >
                  {isChimeMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isChimeMuted ? 'Chime Muted' : 'Chime Active'}</span>
                </button>

                <button
                  onClick={() => soundEngine.playMerchantIncomingChime(false)}
                  className="px-3 py-2 bg-white hover:bg-[#F5F5F5] text-[#212121] rounded-xl text-xs font-semibold border border-[#E0E0E0] shadow-xs"
                >
                  Test Sound
                </button>
              </div>
            </div>

            {/* Merchant Today Stats Overview */}
            {merchantDashboard && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#666666] block">Pending Acceptance</span>
                  <span className="text-2xl font-black text-[#E53935] font-mono">
                    {merchantDashboard.stats.pendingAcceptanceCount}
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#666666] block">Cooking in Kitchen</span>
                  <span className="text-2xl font-black text-[#212121] font-mono">
                    {merchantDashboard.stats.activeCookingCount}
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#666666] block">Today Gross Sales</span>
                  <span className="text-2xl font-black text-[#212121] font-mono">
                    Rs. {(merchantDashboard.stats.todayGrossSales / 100).toLocaleString('en-PK')}
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#666666] block">Today Net Payout</span>
                  <span className="text-2xl font-black text-[#212121] font-mono">
                    Rs. {(merchantDashboard.stats.todayNetPayout / 100).toLocaleString('en-PK')}
                  </span>
                </div>
              </div>
            )}

            {/* Live Incoming Orders Queue */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#212121] uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E53935]" />
                <span>
                  Incoming Orders Awaiting Acceptance ({merchantDashboard?.pendingOrders?.length || 0})
                </span>
              </h3>

              {merchantDashboard?.pendingOrders?.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#E0E0E0] shadow-sm text-xs text-[#666666]">
                  No pending incoming orders at this moment. Place an order from the Customer Store tab to test kitchen flow.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {merchantDashboard.pendingOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl bg-white border-2 border-[#E53935] shadow-sm space-y-4 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-base text-[#212121]">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs text-[#666666] block">
                            Customer: {order.customerName} ({order.customerPhone})
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E53935] text-white animate-pulse shadow-xs">
                          ACTION REQUIRED
                        </span>
                      </div>

                      <div className="space-y-1 bg-[#FFFDF7] p-3 rounded-xl border border-[#E0E0E0] text-xs">
                        {order.items.map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between font-semibold text-[#212121]">
                            <span>{it.quantity}x {it.name}</span>
                            <span>Rs. {(it.totalPrice / 100).toLocaleString('en-PK')}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#E0E0E0]">
                        <span className="text-[11px] font-bold text-[#666666] block">
                          Commit Kitchen Preparation Time & Initiate Dispatch:
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleMerchantAcceptPrep(order.id, 15)}
                            className="py-2 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            15 Mins
                          </button>
                          <button
                            onClick={() => handleMerchantAcceptPrep(order.id, 25)}
                            className="py-2 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            25 Mins
                          </button>
                          <button
                            onClick={() => handleMerchantAcceptPrep(order.id, 40)}
                            className="py-2 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            40 Mins
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cooking & Ready Orders */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#212121] uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#E53935]" />
                <span>
                  Cooking & Ready for Pickup ({merchantDashboard?.kitchenOrders?.length || 0} active)
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {merchantDashboard?.kitchenOrders?.map((order: any) => (
                  <div key={order.id} className="p-4 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-[#212121]">{order.orderNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFFDF7] text-[#E53935] border border-[#E53935]/30 font-bold uppercase">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#666666]">
                      {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleRiderStepTransition(order.id, 'PREPARING')}
                        className="w-full py-2 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        Start Cooking (PREPARING)
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleRiderStepTransition(order.id, 'READY_FOR_PICKUP')}
                        className="w-full py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        Seal & Pack (READY_FOR_PICKUP)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instant 86 / Out of Stock Menu Toggle Table */}
            <div className="p-6 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#212121] uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FFC107]" />
                  <span>Instant 86 / Menu Item Availability Switch</span>
                </h3>
                <p className="text-xs text-[#666666]">
                  Immediately toggle dish availability. Out-of-stock items will not be orderable on the customer app.
                </p>
              </div>

              <div className="divide-y divide-[#E0E0E0] max-h-72 overflow-y-auto">
                {merchantItems.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#212121] block">{item.name}</span>
                      <span className="text-[11px] text-[#666666] font-mono">
                        Rs. {(item.price / 100).toLocaleString('en-PK')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggle86Item(item.id, !item.isAvailable)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition ${
                        item.isAvailable
                          ? 'bg-[#FFC107] text-[#212121] hover:bg-[#FFD54F] shadow-xs'
                          : 'bg-[#E53935] text-white hover:bg-[#C62828] shadow-xs'
                      }`}
                    >
                      <span>{item.isAvailable ? 'AVAILABLE' : '86 / SOLD OUT'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SURFACE: RIDER APP                                       */}
        {/* ======================================================== */}
        {activeMainSurface === 'rider_app' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FFFDF7] text-[#212121] flex items-center justify-center font-bold text-xl border border-[#FFC107] shadow-xs">
                  <Bike className="w-6 h-6 text-[#E53935]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#212121]">{currentRider?.name || 'Bilal Ahmed'}</h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase shadow-xs ${
                        currentRider?.status === 'online'
                          ? 'bg-[#FFC107] text-[#212121]'
                          : currentRider?.status === 'busy'
                          ? 'bg-[#E53935] text-white'
                          : 'bg-[#F5F5F5] text-[#666666] border border-[#E0E0E0]'
                      }`}
                    >
                      {currentRider?.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#666666]">
                    {currentRider?.vehicleNumber} • Rating: ★ {currentRider?.rating} ({currentRider?.completedOrdersCount} trips)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleRiderShift(currentRider?.status === 'offline')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs ${
                    currentRider?.status === 'offline'
                      ? 'bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121]'
                      : 'border border-[#E53935] text-[#E53935] hover:bg-[#E53935] hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${currentRider?.status === 'online' ? 'bg-[#212121]' : 'bg-[#E53935]'}`} />
                  <span>{currentRider?.status === 'offline' ? 'Go Online' : 'End Shift (Go Offline)'}</span>
                </button>
              </div>
            </div>

            {/* Rider Cash Balance */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-[#666666] block">Cash in Hand (COD)</span>
                <span className="text-xl font-bold text-[#212121] font-mono">
                  Rs. {((currentRider?.cashInHand || 0) / 100).toLocaleString('en-PK')}
                </span>
                <span className="text-[10px] text-[#E53935] font-semibold block">Max Limit: Rs. 15,000</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-[#666666] block">Today Rider Earnings</span>
                <span className="text-xl font-bold text-[#212121] font-mono">
                  Rs. {((currentRider?.todayEarnings || 0) / 100).toLocaleString('en-PK')}
                </span>
                <span className="text-[10px] text-[#666666] block">Includes 100% Tips</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-[#666666] block">Station Zone</span>
                <span className="text-base font-bold text-[#212121]">Clifton / Saddar</span>
                <span className="text-[10px] text-[#666666] block">Karachi South Hub</span>
              </div>
            </div>

            {/* 30-Second Timed Dispatch Offer Modal */}
            {activeOffer && (
              <div className="p-6 rounded-2xl bg-white border-2 border-[#E53935] shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[#212121]">
                      New Dispatch Offer ({activeOffer.orderNumber})
                    </span>
                  </div>
                  <span className="font-mono text-xl font-black text-[#E53935]">
                    {offerCountdown}s left
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FFFDF7] border border-[#E0E0E0] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-[#666666] uppercase font-bold block">1. Pickup Location</span>
                    <span className="font-bold text-[#212121] text-sm">{activeOffer.merchantName}</span>
                    <span className="text-[#666666] block">{activeOffer.merchantAddress}</span>
                    <span className="text-[#E53935] font-bold block mt-1">
                      Distance to pickup: {activeOffer.pickupDistanceKm} km
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#666666] uppercase font-bold block">2. Dropoff Customer</span>
                    <span className="font-bold text-[#212121] text-sm">{activeOffer.deliveryAddress.streetAddress}</span>
                    <span className="text-[#666666] block">{activeOffer.deliveryAddress.area}, Karachi</span>
                    <span className="text-[#212121] font-bold block mt-1">
                      Trip delivery: {activeOffer.deliveryDistanceKm} km
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-[10px] text-[#666666] uppercase font-bold block">Guaranteed Earning</span>
                    <span className="text-2xl font-black text-[#212121] font-mono">
                      Rs. {(activeOffer.estimatedEarning / 100).toLocaleString('en-PK')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespondOffer(activeOffer.id, false)}
                      className="px-4 py-2 bg-white text-[#E53935] border border-[#E53935] hover:bg-[#E53935] hover:text-white rounded-xl text-xs font-bold transition"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleRespondOffer(activeOffer.id, true)}
                      className="px-6 py-2 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Accept Offer (Rs. {(activeOffer.estimatedEarning / 100).toLocaleString('en-PK')})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Delivery Order Workflow Steps */}
            {currentRider?.activeOrderId ? (
              <div className="p-6 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-4">
                  <div>
                    <span className="text-xs font-bold text-[#212121] uppercase tracking-wider block">
                      Active Order Delivery Workflow
                    </span>
                    <span className="font-mono text-xl font-bold text-[#212121]">
                      Order ID: {currentRider.activeOrderId}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#E53935] text-white font-bold text-xs shadow-xs">
                    ACTIVE TRIP
                  </span>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-[#212121] block">
                    Turn-by-Turn Delivery Actions:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => handleRiderStepTransition(currentRider.activeOrderId!, 'RIDER_AT_MERCHANT')}
                      className="p-3 bg-white hover:bg-[#FFFDF7] text-[#212121] rounded-xl text-xs font-bold border border-[#E0E0E0] hover:border-[#FFC107] text-center transition shadow-xs"
                    >
                      1. Arrived at Merchant
                    </button>

                    <button
                      onClick={() => handleRiderStepTransition(currentRider.activeOrderId!, 'PICKED_UP')}
                      className="p-3 bg-white hover:bg-[#FFFDF7] text-[#212121] rounded-xl text-xs font-bold border border-[#E0E0E0] hover:border-[#FFC107] text-center transition shadow-xs"
                    >
                      2. Confirm Order Picked Up
                    </button>

                    <button
                      onClick={() => handleRiderStepTransition(currentRider.activeOrderId!, 'OUT_FOR_DELIVERY')}
                      className="p-3 bg-white hover:bg-[#FFFDF7] text-[#212121] rounded-xl text-xs font-bold border border-[#E0E0E0] hover:border-[#FFC107] text-center transition shadow-xs"
                    >
                      3. En Route to Customer
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#FFFDF7] border border-[#E0E0E0] space-y-3 mt-4">
                    <span className="text-xs font-bold text-[#212121] uppercase tracking-wider block">
                      Doorstep Customer Handover & OTP Verification
                    </span>

                    <button
                      onClick={() => handleRiderStepTransition(currentRider.activeOrderId!, 'RIDER_ARRIVED')}
                      className="w-full py-2.5 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] border border-[#FFC107] rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      4. Mark "Rider Arrived at Doorstep"
                    </button>

                    <div>
                      <label className="block text-xs font-semibold text-[#212121] mb-1">
                        Enter Customer 6-Digit Delivery OTP:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpVerifyInput}
                          onChange={(e) => setOtpVerifyInput(e.target.value)}
                          placeholder="e.g. 123456"
                          className="flex-1 bg-white border border-[#E0E0E0] rounded-xl px-4 py-2 text-center text-lg font-mono text-[#212121] tracking-widest focus:outline-none focus:border-[#FFC107]"
                        />
                        <button
                          onClick={() => {
                            if (otpVerifyInput.length === 6) {
                              handleRiderStepTransition(currentRider.activeOrderId!, 'DELIVERED', otpVerifyInput);
                              setOtpVerifyInput('');
                            } else {
                              alert('Please enter complete 6-digit OTP code');
                            }
                          }}
                          className="px-6 py-2 bg-[#E53935] hover:bg-[#C62828] text-white font-bold rounded-xl text-xs transition shadow-xs"
                        >
                          Verify & Complete Handover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#E0E0E0] shadow-sm space-y-2 text-xs text-[#666666]">
                <Bike className="w-8 h-8 text-[#FFC107] mx-auto" />
                <p>No active delivery trip currently. Rider is online and waiting for nearest dispatch offers.</p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SURFACE: LIVE TELEMETRY RADAR                            */}
        {/* ======================================================== */}
        {activeMainSurface === 'telemetry_radar' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#212121] flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-[#E53935]" />
                    <span>Live GPS Telemetry & Animated Route Radar</span>
                  </h2>
                  <p className="text-xs text-[#666666]">
                    Real-time visual route tracking in Karachi connecting Merchant, Rider Motorcycle, and Customer premises.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (activeTrackingOrderId) fetchTelemetry(activeTrackingOrderId);
                  }}
                  className="px-4 py-2 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Coordinates</span>
                </button>
              </div>

              {/* Animated Map Canvas Visualization */}
              <div className="relative h-72 rounded-2xl bg-[#FFFDF7] border border-[#E0E0E0] overflow-hidden flex items-center justify-center p-6">
                <div className="relative w-full max-w-md flex items-center justify-between">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#E0E0E0] -translate-y-1/2 border-dashed" />

                  {/* Merchant Pin */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-[#FFC107] text-[#212121] flex items-center justify-center font-bold border-2 border-white shadow-md">
                      <Store className="w-6 h-6 text-[#212121]" />
                    </div>
                    <span className="text-xs font-bold text-[#212121] mt-2">
                      {radarTrackingData?.merchant?.name || 'Student Biryani'}
                    </span>
                    <span className="text-[10px] text-[#666666]">Pickup Point</span>
                  </div>

                  {/* Rider Motorcycle */}
                  <div className="relative z-10 flex flex-col items-center animate-bounce">
                    <div className="w-12 h-12 rounded-xl bg-[#E53935] text-white flex items-center justify-center font-bold border-2 border-white shadow-md">
                      <Bike className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-[#212121] mt-2">
                      {radarTrackingData?.rider?.name || 'Rider Bilal'}
                    </span>
                    <span className="text-[10px] text-[#E53935] font-mono font-bold">
                      ETA: {radarTrackingData?.etaMinutes || 12} mins
                    </span>
                  </div>

                  {/* Customer Dropoff */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-[#212121] text-white flex items-center justify-center font-bold border-2 border-white shadow-md">
                      <Navigation className="w-6 h-6 text-[#FFC107]" />
                    </div>
                    <span className="text-xs font-bold text-[#212121] mt-2">
                      {radarTrackingData?.customer?.area || 'Clifton Block 7'}
                    </span>
                    <span className="text-[10px] text-[#666666]">Delivery Point</span>
                  </div>
                </div>
              </div>

              {/* Coordinates & Telemetry Metrics */}
              {radarTrackingData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0]">
                    <span className="text-[10px] text-[#666666] uppercase block font-sans">Active Order</span>
                    <span className="font-bold text-[#212121]">{radarTrackingData.orderNumber}</span>
                  </div>
                  <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0]">
                    <span className="text-[10px] text-[#666666] uppercase block font-sans">Rider Vehicle</span>
                    <span className="font-bold text-[#212121]">{radarTrackingData.rider.vehicleNumber}</span>
                  </div>
                  <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0]">
                    <span className="text-[10px] text-[#666666] uppercase block font-sans">Remaining Distance</span>
                    <span className="font-bold text-[#212121]">{radarTrackingData.distanceKm} km</span>
                  </div>
                  <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0]">
                    <span className="text-[10px] text-[#666666] uppercase block font-sans">Dynamic ETA</span>
                    <span className="font-bold text-[#E53935]">{radarTrackingData.etaMinutes} mins</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SURFACE: DISCOVERY (Handled by ClientDashboard)           */}
        {/* ======================================================== */}
        {/* ======================================================== */}
        {/* SURFACE: STOREFRONT & MENU                               */}
        {/* ======================================================== */}
        {activeMainSurface === 'storefront' && (
          <div className="space-y-6">
            <button
              onClick={() => setActiveMainSurface('discovery')}
              className="text-xs font-semibold text-[#666666] hover:text-[#E53935] flex items-center gap-1 transition"
            >
              ← Back to all restaurants
            </button>

            {merchantDetails && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold text-[#212121]">{merchantDetails.merchant.name}</h1>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E53935] text-white shadow-xs">
                      Popular Restaurant
                    </span>
                  </div>
                  <p className="text-xs text-[#666666]">{merchantDetails.merchant.description}</p>
                </div>

                <div className="space-y-6">
                  {merchantDetails.categories.map((catGroup: any) => (
                    <div key={catGroup.category.id} className="space-y-3">
                      <h3 className="text-base font-bold text-[#212121] border-b border-[#E0E0E0] pb-2">
                        {catGroup.category.name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {catGroup.items.map((item: any) => {
                          const isDiscounted = item.discountedPrice && item.discountedPrice < item.price;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (item.isAvailable) {
                                  setCustomizingItem(item);
                                  setItemQuantity(1);
                                }
                              }}
                              className={`p-4 rounded-2xl border transition-all flex justify-between gap-3 shadow-sm hover:shadow-md ${
                                item.isAvailable
                                  ? 'bg-white border-[#E0E0E0] hover:border-[#FFC107] cursor-pointer'
                                  : 'bg-[#F5F5F5] border-[#E0E0E0] opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-[#212121] text-sm">{item.name}</h4>
                                  {!item.isAvailable && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F5] text-[#666666] border border-[#E0E0E0] font-bold">
                                      86 / SOLD OUT
                                    </span>
                                  )}
                                  {isDiscounted && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E53935] text-white font-bold shadow-xs">
                                      40% OFF
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#666666] line-clamp-2">{item.description}</p>
                                
                                <div className="flex items-center gap-2 pt-1">
                                  {isDiscounted ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[#666666] line-through font-mono">
                                        Rs. {(item.price / 100).toLocaleString('en-PK')}
                                      </span>
                                      <span className="text-base font-black text-[#E53935] font-mono">
                                        Rs. {(item.discountedPrice / 100).toLocaleString('en-PK')}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-[#212121] text-sm font-mono block">
                                      Rs. {(item.price / 100).toLocaleString('en-PK')}
                                    </span>
                                  )}
                                </div>

                                {item.isAvailable && (
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      className="px-3 py-1 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs rounded-lg transition shadow-xs"
                                    >
                                      Order Now
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F5F5F5] flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SURFACE: ORDERS & LIVE TRACKING                          */}
        {/* ======================================================== */}
        {activeMainSurface === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#212121]">Your Orders & Live State Pipeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((o) => (
                <div key={o.id} className="p-5 rounded-2xl bg-white border border-[#E0E0E0] shadow-sm space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-base font-bold text-[#212121]">{o.orderNumber}</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase shadow-xs ${
                        o.status === 'DELIVERED'
                          ? 'bg-[#E53935] text-white'
                          : 'bg-[#FFC107] text-[#212121]'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#212121]">{o.merchantName}</h4>
                  <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#FFC107]/40 flex items-center justify-between text-xs">
                    <span className="text-[#666666]">Customer 6-Digit Delivery OTP:</span>
                    <span className="font-mono text-lg font-bold text-[#212121] tracking-wider">{o.deliveryOtp}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E0E0E0] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#212121]">Total: Rs. {(o.pricing.total / 100).toLocaleString('en-PK')}</span>
                    <div className="flex items-center gap-3">
                      {o.status === 'DELIVERED' && (
                        <button
                          onClick={async () => {
                            const reason = prompt('Reason for refund (e.g., spilled_food, damaged_item, wrong_item):', 'spilled_food');
                            if (!reason) return;
                            const desc = prompt('Describe the issue:', 'Container spilled in delivery bag');
                            if (!desc) return;
                            try {
                              const r = await fetch('/api/v1/finance/refunds', {
                                method: 'POST',
                                headers: {
                                   'Content-Type': 'application/json',
                                   Authorization: `Bearer ${accessToken}`,
                                },
                                body: JSON.stringify({
                                   orderId: o.id,
                                   amount: o.pricing.total,
                                   reason,
                                   description: desc,
                                }),
                              });
                              const data = await r.json();
                              if (data.success) {
                                showToast('Refund dispute registered with Finance!');
                                fetchOrders(accessToken);
                              } else {
                                showToast(data.error?.message || 'Refund request failed', true);
                              }
                            } catch (err: any) {
                              showToast(`Refund error: ${err.message}`, true);
                            }
                          }}
                          className="border border-[#E53935] text-[#E53935] hover:bg-[#E53935] hover:text-white px-2.5 py-1 rounded-lg font-semibold transition"
                        >
                          Request Refund
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setActiveTrackingOrderId(o.id);
                          setActiveMainSurface('telemetry_radar');
                          fetchTelemetry(o.id);
                        }}
                        className="px-3 py-1.5 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold rounded-xl transition shadow-xs"
                      >
                        Track on Radar →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SURFACE: FINANCE & SETTLEMENTS HUB                       */}
        {/* ======================================================== */}
        {activeMainSurface === 'finance_hub' && (
          <FinanceAdminHub accessToken={accessToken} onToast={showToast} lang={lang} />
        )}

        {/* ======================================================== */}
        {/* SURFACE: SUPER ADMIN CONTROL TOWER                       */}
        {/* ======================================================== */}
        {activeMainSurface === 'admin_panel' && (
          <AdminPanel
            accessToken={accessToken}
            currentUser={currentUser}
            onToast={showToast}
            lang={lang}
            onAdminLogout={handleLogout}
            onBackToApp={() => setActiveMainSurface('discovery')}
          />
        )}
      </main>
        </>
      )}

      {/* Item Customizer Modal */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E0E0E0] rounded-3xl max-w-md w-full p-6 space-y-4 text-[#212121] shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#212121] text-base">{customizingItem.name}</h3>
              <button onClick={() => setCustomizingItem(null)} className="text-[#666666] hover:text-[#E53935]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#666666]">{customizingItem.description}</p>
            <div className="text-base font-bold text-[#212121] font-mono">
              Rs. {((customizingItem.discountedPrice || customizingItem.price) / 100).toLocaleString('en-PK')}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E0E0E0]">
              <div className="flex items-center gap-3 bg-[#F5F5F5] px-3 py-1.5 rounded-xl border border-[#E0E0E0]">
                <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))} className="text-[#666666] hover:text-[#212121]">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm text-[#212121] font-mono">{itemQuantity}</span>
                <button onClick={() => setItemQuantity(itemQuantity + 1)} className="text-[#666666] hover:text-[#212121]">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="px-6 py-2.5 bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold rounded-xl text-xs transition shadow-sm"
              >
                Add to Basket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Drawer Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E0E0E0] rounded-3xl max-w-lg w-full p-6 space-y-4 text-[#212121] shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E0E0E0] pb-3">
              <h3 className="font-bold text-[#212121] text-base">Checkout Order</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-[#666666] hover:text-[#E53935]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {cart.items.length === 0 ? (
              <p className="text-xs text-[#666666] py-6 text-center">Your basket is empty.</p>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-[#E0E0E0] max-h-40 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="py-2 flex justify-between text-xs text-[#212121]">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-mono font-bold">
                        Rs. {((item.unitPrice * item.quantity) / 100).toLocaleString('en-PK')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-[#FFFDF7] rounded-xl space-y-1.5 text-xs border border-[#E0E0E0]">
                  <div className="flex justify-between text-[#666666]">
                    <span>Subtotal</span>
                    <span>Rs. {(cartSubtotal / 100).toLocaleString('en-PK')}</span>
                  </div>
                  {priceQuote && priceQuote.couponDiscount > 0 && (
                    <div className="flex justify-between text-[#E53935] font-bold">
                      <span>Coupon Discount (RAFTAR50)</span>
                      <span>-Rs. {(priceQuote.couponDiscount / 100).toLocaleString('en-PK')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#666666]">
                    <span>Delivery Fee</span>
                    <span>Rs. {priceQuote ? (priceQuote.deliveryFee / 100).toLocaleString('en-PK') : '60'}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E0E0E0] flex justify-between text-sm font-bold text-[#212121]">
                    <span>Total ({selectedPaymentMethod.toUpperCase()})</span>
                    <span className="font-mono text-[#E53935]">
                      Rs. {priceQuote ? (priceQuote.total / 100).toLocaleString('en-PK') : (cartSubtotal / 100).toLocaleString('en-PK')}
                    </span>
                  </div>
                </div>

                {/* Multi-Channel Payment Method Selector */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-[#212121] block">Select Payment Channel:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-[11px] font-bold">
                    {[
                      { id: 'cod', label: 'Cash on Delivery' },
                      { id: 'jazzcash', label: 'JazzCash' },
                      { id: 'easypaisa', label: 'Easypaisa' },
                      { id: 'raast', label: 'Raast Pay' },
                      { id: 'card', label: 'Card / PayPak' },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(pm.id as any)}
                        className={`p-2 rounded-xl border text-center transition ${
                          selectedPaymentMethod === pm.id
                            ? 'bg-[#FFC107] text-[#212121] border-[#FFC107] shadow-xs'
                            : 'bg-white text-[#212121] border-[#E0E0E0] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>

                  {/* Channel-Specific Configuration Inputs */}
                  {selectedPaymentMethod === 'cod' && (
                    <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-2">
                      <span className="text-[11px] text-[#666666] block">Currency Note Denomination for Change:</span>
                      <div className="flex gap-2 text-xs">
                        {(['exact', '500', '1000', '5000'] as const).map((note) => (
                          <button
                            key={note}
                            type="button"
                            onClick={() => setCodNoteDenomination(note)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                              codNoteDenomination === note
                                ? 'bg-[#FFC107] text-[#212121] border-[#FFC107] shadow-xs'
                                : 'bg-white text-[#212121] border-[#E0E0E0] hover:bg-[#F5F5F5]'
                            }`}
                          >
                            {note === 'exact' ? 'Exact Change' : `Rs. ${note} Note`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedPaymentMethod === 'jazzcash' || selectedPaymentMethod === 'easypaisa') && (
                    <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1.5">
                      <label className="text-[11px] text-[#666666] block">
                        {selectedPaymentMethod === 'jazzcash' ? 'JazzCash Mobile Account Number' : 'Easypaisa Mobile Number'}:
                      </label>
                      <input
                        type="text"
                        value={walletPhone}
                        onChange={(e) => setWalletPhone(e.target.value)}
                        placeholder="+923001234567"
                        className="w-full px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-xs text-[#212121] font-mono focus:outline-none focus:border-[#FFC107]"
                      />
                    </div>
                  )}

                  {selectedPaymentMethod === 'raast' && (
                    <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-1.5">
                      <label className="text-[11px] text-[#666666] block">
                        SBP Raast ID (Mobile Alias or IBAN):
                      </label>
                      <input
                        type="text"
                        value={raastId}
                        onChange={(e) => setRaastId(e.target.value)}
                        placeholder="+923001234567 or PK36MEZN..."
                        className="w-full px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-xs text-[#212121] font-mono focus:outline-none focus:border-[#FFC107]"
                      />
                    </div>
                  )}

                  {selectedPaymentMethod === 'card' && (
                    <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#E0E0E0] space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-[#666666]">
                        <span>Card Details (3DS 2.0 Authenticated):</span>
                        <button
                          type="button"
                          onClick={() =>
                            setCardInfo({
                              cardNumber: '4242 4242 4242 4242',
                              cardHolder: 'Muhammad Ali',
                              expiryMonth: '12',
                              expiryYear: '28',
                              cvv: '123',
                            })
                          }
                          className="text-[#E53935] hover:text-[#C62828] underline font-bold"
                        >
                          Fill Test Visa
                        </button>
                      </div>
                      <input
                        type="text"
                        value={cardInfo.cardNumber}
                        onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: e.target.value })}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-xs text-[#212121] font-mono focus:outline-none focus:border-[#FFC107]"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cardInfo.cardHolder}
                          onChange={(e) => setCardInfo({ ...cardInfo, cardHolder: e.target.value })}
                          placeholder="Cardholder Name"
                          className="flex-1 px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-xs text-[#212121] focus:outline-none focus:border-[#FFC107]"
                        />
                        <input
                          type="text"
                          value={`${cardInfo.expiryMonth}/${cardInfo.expiryYear}`}
                          onChange={() => {}}
                          placeholder="MM/YY"
                          className="w-20 px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-xs text-[#212121] font-mono focus:outline-none focus:border-[#FFC107]"
                        />
                        <input
                          type="text"
                          value={cardInfo.cvv}
                          onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                          placeholder="CVV"
                          className="w-16 px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-xs text-[#212121] font-mono focus:outline-none focus:border-[#FFC107]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-3.5 bg-[#E53935] hover:bg-[#C62828] text-white font-bold rounded-2xl text-xs transition mt-2 shadow-md"
                >
                  Confirm Order ({selectedPaymentMethod.toUpperCase()})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#E0E0E0] bg-white py-6 text-center text-xs text-[#666666]">
        <p className="flex items-center justify-center gap-1.5">
          <span className="font-bold text-[#212121]">Raftaar (رفتار)</span>
          <span>•</span>
          <span className="text-[#E53935] font-semibold">Yellow & Red Express</span>
          <span>•</span>
          <span>Karachi, Pakistan</span>
        </p>
      </footer>
    </div>
  );
}
