import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, Tag, ShieldCheck, Check } from 'lucide-react';
import { CustomerNotification } from './types.ts';

interface NotificationsViewProps {
  notifications: CustomerNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  isUrdu: boolean;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  isUrdu,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'promo' | 'order'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'promo') return n.type === 'promo';
    if (filter === 'order') return n.type === 'order';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E0E0E0] shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#FFFDF7] border border-[#FFC107]">
            <Bell className="w-5 h-5 text-[#E53935]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#212121]">
              {isUrdu ? 'اطلاعات و نوٹیفیکیشنز' : 'Notifications & Updates'}
            </h2>
            <p className="text-xs text-[#666666]">
              {isUrdu
                ? 'اپنے آرڈرز، واؤچرز اور ڈسکاؤنٹ کی تازہ ترین معلومات'
                : 'Stay informed on delivery milestones, flash sales, and rewards'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="px-3 py-1.5 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-xs font-bold text-[#E53935] transition flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'سب کو پڑھا ہوا نشان زد کریں' : 'Mark all read'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E0E0E0] text-xs w-fit">
        {[
          { id: 'all', label: 'All', labelUr: 'تمام' },
          { id: 'unread', label: `Unread (${unreadCount})`, labelUr: `غیر پڑھے (${unreadCount})` },
          { id: 'order', label: 'Orders', labelUr: 'آرڈرز' },
          { id: 'promo', label: 'Offers', labelUr: 'آفرز' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === tab.id
                ? 'bg-[#FFC107] text-[#212121] shadow-xs'
                : 'text-[#666666] hover:text-[#212121]'
            }`}
          >
            {isUrdu ? tab.labelUr : tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E0E0E0] p-10 text-center shadow-xs">
          <p className="text-xs text-[#666666]">
            {isUrdu ? 'کوئی نوٹیفیکیشن موجود نہیں ہے' : 'No notifications in this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.read && onMarkRead(notif.id)}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition cursor-pointer flex items-start gap-3 ${
                !notif.read
                  ? 'border-[#FFC107] bg-[#FFFDF7] ring-1 ring-[#FFC107]/30'
                  : 'border-[#E0E0E0]'
              }`}
            >
              <div
                className={`p-2 rounded-xl flex-shrink-0 ${
                  notif.type === 'promo'
                    ? 'bg-red-50 text-[#E53935]'
                    : notif.type === 'order'
                    ? 'bg-amber-50 text-[#FFC107]'
                    : 'bg-[#F5F5F5] text-[#212121]'
                }`}
              >
                {notif.type === 'promo' ? (
                  <Tag className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-extrabold text-xs text-[#212121]">
                    {isUrdu && notif.titleUr ? notif.titleUr : notif.title}
                  </h4>
                  <span className="text-[10px] text-[#666666] flex-shrink-0">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#666666] leading-relaxed">
                  {isUrdu && notif.bodyUr ? notif.bodyUr : notif.body}
                </p>
              </div>

              {!notif.read && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#E53935] flex-shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
