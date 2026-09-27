import React from 'react';
import {
  Bike,
  Clock,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Phone,
  ShieldCheck,
  ChevronRight,
  Receipt,
  Store,
} from 'lucide-react';
import { Order } from './types.ts';

interface ActiveOrderTrackerProps {
  orders: Order[];
  onTrackOrder: (orderId: string) => void;
  onBrowseStores: () => void;
  isUrdu: boolean;
}

export const ActiveOrderTracker: React.FC<ActiveOrderTrackerProps> = ({
  orders,
  onTrackOrder,
  onBrowseStores,
  isUrdu,
}) => {
  const activeOrders = orders.filter(
    (o) => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status)
  );

  if (activeOrders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left rtl:sm:text-right">
          <div className="w-12 h-12 rounded-2xl bg-[#FFFDF7] border border-[#FFC107] text-[#FFC107] flex items-center justify-center font-bold text-xl flex-shrink-0">
            🛵
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#212121]">
              {isUrdu ? 'کوئی فعال آرڈر نہیں ہے' : 'No active orders right now'}
            </h4>
            <p className="text-xs text-[#666666] mt-0.5">
              {isUrdu
                ? 'کراچی کے بہترین کھانوں اور گروسری سے لطف اندوز ہوں!'
                : 'Craving something delicious? Order from top restaurants & shops.'}
            </p>
          </div>
        </div>
        <button
          onClick={onBrowseStores}
          className="px-5 py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs shadow-xs transition"
        >
          {isUrdu ? 'ریسٹورنٹس دیکھیں' : 'Browse Restaurants'}
        </button>
      </div>
    );
  }

  const getStatusStepIndex = (status: string) => {
    const steps = ['PLACED', 'ACCEPTED', 'PREPARING', 'RIDER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'];
    return steps.indexOf(status);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E53935] animate-ping" />
          <h3 className="font-extrabold text-sm text-[#212121] tracking-tight">
            {isUrdu ? 'فعال آرڈرز' : 'Active Orders'}{' '}
            <span className="text-xs font-semibold text-[#666666]">
              ({activeOrders.length})
            </span>
          </h3>
        </div>
        {activeOrders.length > 1 && (
          <span className="text-[11px] text-[#666666] font-medium">
            {isUrdu ? 'آگے بڑھنے کے لیے سکرول کریں' : 'Scroll for more'} →
          </span>
        )}
      </div>

      {/* Horizontally scrollable stack if multiple */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {activeOrders.map((order) => {
          const stepIdx = getStatusStepIndex(order.status);
          const isCancelled = order.status === 'CANCELLED';
          const isFailed = order.status === 'FAILED';

          return (
            <div
              key={order.id}
              className="min-w-[320px] sm:min-w-[420px] max-w-[480px] bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-4 flex flex-col justify-between flex-shrink-0"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-[#E0E0E0] pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FFFDF7] border border-[#FFC107] flex items-center justify-center font-bold text-lg text-[#212121] flex-shrink-0">
                    <Store className="w-5 h-5 text-[#E53935]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#212121] truncate max-w-[180px]">
                      {order.merchantName}
                    </h4>
                    <span className="text-[11px] font-mono text-[#666666]">
                      #{order.orderNumber}
                    </span>
                  </div>
                </div>

                <div className="text-right rtl:text-left">
                  <span className="text-xs font-black text-[#212121] block">
                    Rs. {(order.pricing.total / 100).toLocaleString('en-PK')}
                  </span>
                  <span className="text-[10px] text-[#666666]">
                    {order.fulfillmentMode.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Status Flow Stepper */}
              {!isCancelled && !isFailed ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#666666] mb-1.5">
                    <span className={stepIdx >= 0 ? 'text-[#E53935] font-black' : ''}>
                      {isUrdu ? 'آرڈر دیا گیا' : 'Placed'}
                    </span>
                    <span className={stepIdx >= 2 ? 'text-[#E53935] font-black' : ''}>
                      {isUrdu ? 'تیار ہو رہا ہے' : 'Preparing'}
                    </span>
                    <span className={stepIdx >= 5 ? 'text-[#E53935] font-black' : ''}>
                      {isUrdu ? 'راستے میں ہے' : 'On The Way'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-[#F5F5F5] rounded-full overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-[#FFC107] to-[#E53935] h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(15, (stepIdx / 6) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#212121]">
                      <Clock className="w-3.5 h-3.5 text-[#E53935]" />
                      <span>
                        {stepIdx >= 5
                          ? isUrdu
                            ? 'تقریباً 10-15 منٹ'
                            : 'ETA ~10-15 mins'
                          : isUrdu
                          ? 'تقریباً 25-30 منٹ'
                          : 'ETA ~25-30 mins'}
                      </span>
                    </div>

                    {order.deliveryOtp && (
                      <div className="flex items-center gap-1 bg-[#FFFDF7] border border-[#FFC107] px-2 py-0.5 rounded-lg text-[11px] font-bold text-[#212121]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#E53935]" />
                        <span>OTP: {order.deliveryOtp}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#E53935] font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {isCancelled
                      ? isUrdu
                        ? 'یہ آرڈر منسوخ کر دیا گیا ہے'
                        : 'Order cancelled'
                      : 'Payment Failed'}
                  </span>
                </div>
              )}

              {/* Rider preview if assigned */}
              {order.rider && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#F5F5F5] text-xs mb-3">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-[#E53935]" />
                    <span className="font-bold text-[#212121]">{order.rider.name}</span>
                    <span className="text-[10px] text-[#666666]">
                      ({order.rider.vehicleNumber})
                    </span>
                  </div>
                  <a
                    href={`tel:${order.rider.phone}`}
                    className="p-1.5 rounded-lg bg-white border border-[#E0E0E0] text-[#212121] hover:text-[#E53935] transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Bottom Actions */}
              <button
                onClick={() => onTrackOrder(order.id)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'لائیو ٹریک کریں' : 'Track Order Live'}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
