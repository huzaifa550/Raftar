import React, { useState } from 'react';
import { Heart, Star, Clock, ShoppingBag, UtensilsCrossed, Trash2, ArrowRight } from 'lucide-react';
import { Merchant, MenuItem } from './types.ts';

interface FavoritesViewProps {
  favoriteMerchantIds: string[];
  favoriteItemIds: string[];
  merchants: Merchant[];
  onToggleFavorite: (type: 'merchant' | 'item', id: string) => void;
  onSelectMerchant: (slug: string) => void;
  onBrowseStores: () => void;
  isUrdu: boolean;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favoriteMerchantIds,
  favoriteItemIds,
  merchants,
  onToggleFavorite,
  onSelectMerchant,
  onBrowseStores,
  isUrdu,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'restaurants' | 'grocery'>('all');

  const favoriteMerchants = merchants.filter((m) =>
    favoriteMerchantIds.includes(m.id) &&
    (activeTab === 'all' || (activeTab === 'restaurants' ? m.type === 'restaurant' : m.type === 'shop'))
  );

  return (
    <div className="space-y-4">
      {/* Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E0E0E0] shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#212121]">
            {isUrdu ? 'آپ کے پسندیدہ ریسٹورنٹس اور کھانے' : 'Your Favorites'}
          </h2>
          <p className="text-xs text-[#666666]">
            {isUrdu
              ? 'اپنے پسندیدہ کھانے ایک کلک میں دوبارہ منگوائیں'
              : 'Quick access to the places and meals you love'}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-xl border border-[#E0E0E0] text-xs">
          {[
            { id: 'all', label: 'All', labelUr: 'سب' },
            { id: 'restaurants', label: 'Restaurants', labelUr: 'کھانا' },
            { id: 'grocery', label: 'Grocery & Shops', labelUr: 'گروسری' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === tab.id
                  ? 'bg-[#FFC107] text-[#212121] shadow-xs'
                  : 'text-[#666666] hover:text-[#212121]'
              }`}
            >
              {isUrdu ? tab.labelUr : tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Favorites */}
      {favoriteMerchants.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E0E0E0] p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-red-50 text-[#E53935] flex items-center justify-center mx-auto mb-3 text-2xl">
            ❤️
          </div>
          <h3 className="font-bold text-sm text-[#212121]">
            {isUrdu ? 'ابھی کوئی پسندیدہ نہیں ہے' : 'No favorites saved yet'}
          </h3>
          <p className="text-xs text-[#666666] mt-1 max-w-sm mx-auto">
            {isUrdu
              ? 'کسی بھی ریسٹورنٹ یا کھانے پر دل کے نشان کو دبا کر اسے اپنی فہرست میں محفوظ کریں۔'
              : 'Tap the heart icon on any restaurant or dish to save it here for fast reordering.'}
          </p>
          <button
            onClick={onBrowseStores}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs shadow-xs transition"
          >
            {isUrdu ? 'ریسٹورنٹس دیکھیں' : 'Explore Restaurants'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteMerchants.map((merchant) => (
            <div
              key={merchant.id}
              className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="relative h-36 bg-[#F5F5F5]">
                <img
                  src={merchant.bannerUrl || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60'}
                  alt={merchant.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onToggleFavorite('merchant', merchant.id)}
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 text-[#E53935] hover:bg-white shadow-sm transition"
                  title="Remove from favorites"
                >
                  <Heart className="w-4 h-4 fill-[#E53935]" />
                </button>
                <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#212121] flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#FFC107] fill-[#FFC107]" />
                  <span>{merchant.rating}</span>
                </div>
              </div>

              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-extrabold text-sm text-[#212121]">
                    {merchant.name}
                  </h3>
                  <p className="text-xs text-[#666666] mt-0.5 truncate">
                    {merchant.cuisines?.join(', ')}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#666666] mt-2">
                    <Clock className="w-3.5 h-3.5 text-[#FFC107]" />
                    <span>25-35 mins</span>
                    <span>•</span>
                    <span>{merchant.area}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#212121]">
                    {merchant.isOpen ? (
                      <span className="text-green-700 font-semibold">● Open Now</span>
                    ) : (
                      <span className="text-[#666666]">Closed</span>
                    )}
                  </span>
                  <button
                    onClick={() => onSelectMerchant(merchant.slug)}
                    className="px-4 py-1.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs shadow-xs transition"
                  >
                    {isUrdu ? 'مینیو دیکھیں' : 'View Menu'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
