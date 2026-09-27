import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Filter,
  RotateCcw,
  Navigation,
  Star,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  Store,
} from 'lucide-react';
import { Order } from './types.ts';

interface MyOrdersViewProps {
  orders: Order[];
  onTrackOrder: (orderId: string) => void;
  onOpenOrderDetails: (order: Order) => void;
  onReorder: (order: Order) => void;
  onOpenReviewModal: (order: Order) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
  isUrdu: boolean;
}

export const MyOrdersView: React.FC<MyOrdersViewProps> = ({
  orders,
  onTrackOrder,
  onOpenOrderDetails,
  onReorder,
  onOpenReviewModal,
  onCancelOrder,
  isUrdu,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');

  const filteredOrders = orders.filter((order) => {
    // Tab filtering
    if (activeTab === 'active') {
      if (['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.status)) return false;
    } else if (activeTab === 'completed') {
      if (order.status !== 'DELIVERED') return false;
    } else if (activeTab === 'cancelled') {
      if (!['CANCELLED', 'REJECTED'].includes(order.status)) return false;
    }

    // Search filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchMerchant = order.merchantName.toLowerCase().includes(q);
      if (!matchNumber && !matchMerchant) return false;
    }

    return true;
  });

  const handleConfirmCancel = () => {
    if (cancellingOrderId) {
      onCancelOrder(cancellingOrderId, cancelReason);
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E0E0E0] shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#212121]">
            {isUrdu ? 'میرے آرڈرز کی تاریخ' : 'My Orders & Order History'}
          </h2>
          <p className="text-xs text-[#666666]">
            {isUrdu
              ? 'اپنے تمام جاری اور مکمل شدہ آرڈرز کی نگرانی کریں'
              : 'Track active deliveries, reorder meals, or view invoices'}
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-xl border border-[#E0E0E0] text-xs">
          {[
            { id: 'all', label: 'All Orders', labelUr: 'تمام' },
            { id: 'active', label: 'Active', labelUr: 'فعال' },
            { id: 'completed', label: 'Completed', labelUr: 'مکمل' },
            { id: 'cancelled', label: 'Cancelled', labelUr: 'منسوخ' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  active
                    ? 'bg-[#FFC107] text-[#212121] shadow-xs'
                    : 'text-[#666666] hover:text-[#212121]'
                }`}
              >
                {isUrdu ? tab.labelUr : tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isUrdu
                ? 'آرڈر نمبر یا ریسٹورنٹ سے تلاش کریں...'
                : 'Search by Order # or restaurant name...'
            }
            className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 bg-white rounded-xl text-xs border border-[#E0E0E0] focus:border-[#FFC107] focus:ring-1 focus:ring-[#FFC107] outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FFFDF7] border border-[#FFC107] text-[#FFC107] flex items-center justify-center mx-auto mb-3 text-xl">
            📦
          </div>
          <h3 className="font-bold text-sm text-[#212121]">
            {isUrdu ? 'کوئی آرڈر نہیں ملا' : 'No orders found'}
          </h3>
          <p className="text-xs text-[#666666] mt-1 max-w-sm mx-auto">
            {isUrdu
              ? 'اس فلٹر کے تحت کوئی ریکارڈ موجود نہیں ہے۔'
              : 'Try changing your search term or select a different filter tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isActive = !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.status);
            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#E0E0E0] p-4 sm:p-5 shadow-xs hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFFDF7] border border-[#FFC107] flex items-center justify-center font-bold text-xl text-[#212121] flex-shrink-0">
                    <Store className="w-6 h-6 text-[#E53935]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-[#212121]">
                        {order.merchantName}
                      </h3>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isDelivered
                            ? 'bg-green-100 text-green-800'
                            : isCancelled
                            ? 'bg-red-100 text-[#E53935]'
                            : 'bg-[#FFC107] text-[#212121]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666] mt-1">
                      <span className="font-mono font-bold text-[#212121]">
                        #{order.orderNumber}
                      </span>
                      <span>•</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{order.fulfillmentMode.toUpperCase()}</span>
                      <span>•</span>
                      <span className="font-semibold text-[#212121]">
                        Rs. {(order.pricing.total / 100).toLocaleString('en-PK')}
                      </span>
                    </div>

                    {/* Cancellation reason if cancelled */}
                    {isCancelled && (
                      <div className="mt-2 text-xs text-[#E53935] bg-red-50 p-2 rounded-xl border border-red-200 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {isUrdu
                            ? 'منسوخی کی وجہ: گاہک یا ریسٹورنٹ کی جانب سے منسوخ'
                            : 'Cancellation reason: Cancelled by user before preparation began'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#E0E0E0] justify-end">
                  {/* Track Order if Active */}
                  {isActive && (
                    <button
                      onClick={() => onTrackOrder(order.id)}
                      className="px-4 py-2 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{isUrdu ? 'ٹریک کریں' : 'Track Order'}</span>
                    </button>
                  )}

                  {/* Reorder Button */}
                  <button
                    onClick={() => onReorder(order)}
                    className="px-3.5 py-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#212121] font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#E53935]" />
                    <span>{isUrdu ? 'دوبارہ منگوائیں' : 'Reorder'}</span>
                  </button>

                  {/* Invoice / Details */}
                  <button
                    onClick={() => onOpenOrderDetails(order)}
                    className="px-3 py-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#212121] font-semibold text-xs transition"
                  >
                    {isUrdu ? 'رسید' : 'Invoice'}
                  </button>

                  {/* Review Button for Delivered */}
                  {isDelivered && (
                    <button
                      onClick={() => onOpenReviewModal(order)}
                      className="px-3 py-2 rounded-xl border border-[#E53935] text-[#E53935] hover:bg-[#E53935] hover:text-white font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>{isUrdu ? 'ریویو' : 'Review'}</span>
                    </button>
                  )}

                  {/* Cancel affordance for new placed orders */}
                  {order.status === 'PLACED' && (
                    <button
                      onClick={() => setCancellingOrderId(order.id)}
                      className="px-2.5 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold transition"
                    >
                      {isUrdu ? 'منسوخ' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancellingOrderId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-[#E0E0E0] shadow-xl">
            <h3 className="font-bold text-sm text-[#212121]">
              {isUrdu ? 'آرڈر منسوخ کریں؟' : 'Cancel Order?'}
            </h3>
            <p className="text-xs text-[#666666] mt-1">
              {isUrdu
                ? 'کیا آپ واقعی اس آرڈر کو منسوخ کرنا چاہتے ہیں؟'
                : 'Are you sure? Once cancelled, this action cannot be reversed.'}
            </p>

            <div className="mt-3">
              <label className="text-[11px] font-bold text-[#212121] block mb-1">
                {isUrdu ? 'منسوخی کی وجہ' : 'Reason for cancellation'}
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery time too long">Delivery time too long</option>
                <option value="Found alternative meal">Found alternative meal</option>
              </select>
            </div>

            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setCancellingOrderId(null)}
                className="flex-1 py-2 rounded-xl bg-[#F5F5F5] font-bold text-xs text-[#212121]"
              >
                {isUrdu ? 'نہیں، واپس جائیں' : 'Keep Order'}
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2 rounded-xl bg-[#E53935] hover:bg-[#C62828] text-white font-bold text-xs"
              >
                {isUrdu ? 'ہاں، منسوخ کریں' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
