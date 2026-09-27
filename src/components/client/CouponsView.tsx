import React, { useState } from 'react';
import { Tag, Copy, Check, Clock, ShieldCheck, Flame } from 'lucide-react';
import { Coupon } from './types.ts';

interface CouponsViewProps {
  coupons: Coupon[];
  onApplyCouponToCart: (code: string) => void;
  isUrdu: boolean;
}

export const CouponsView: React.FC<CouponsViewProps> = ({
  coupons,
  onApplyCouponToCart,
  isUrdu,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Title banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="w-5 h-5 text-[#E53935]" />
          <h2 className="text-base sm:text-lg font-black text-[#212121]">
            {isUrdu ? 'خصوصی واؤچرز اور ڈسکاؤنٹ کوپنز' : 'Coupons & Exclusive Deals'}
          </h2>
        </div>
        <p className="text-xs text-[#666666]">
          {isUrdu
            ? 'اپنے کھانے اور گروسری پر فوری بچت حاصل کریں'
            : 'Copy any active code below or apply it straight to your checkout cart'}
        </p>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => {
          const isCopied = copiedCode === coupon.code;
          return (
            <div
              key={coupon.id}
              className="bg-white rounded-2xl border border-[#E0E0E0] p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#FFC107] transition"
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-[#E53935] text-white font-mono font-black text-sm tracking-wider shadow-xs">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className="p-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#666666] hover:text-[#212121] transition"
                      title="Copy code"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                    Active
                  </span>
                </div>

                <p className="text-xs font-bold text-[#212121] mb-2 leading-relaxed">
                  {coupon.description}
                </p>

                <div className="space-y-1 text-[11px] text-[#666666] mb-4 bg-[#FFFDF7] p-2.5 rounded-xl border border-[#FFD54F]/50">
                  <div className="flex justify-between">
                    <span>{isUrdu ? 'کم از کم آرڈر:' : 'Min. Order Value:'}</span>
                    <span className="font-bold text-[#212121]">
                      Rs. {Math.round(coupon.minOrderAmount / 100)}
                    </span>
                  </div>
                  {coupon.maxDiscountAmount && (
                    <div className="flex justify-between">
                      <span>{isUrdu ? 'زیادہ سے زیادہ رعایت:' : 'Max Discount:'}</span>
                      <span className="font-bold text-[#212121]">
                        Rs. {Math.round(coupon.maxDiscountAmount / 100)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{isUrdu ? 'میعاد:' : 'Valid Until:'}</span>
                    <span>{new Date(coupon.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onApplyCouponToCart(coupon.code)}
                className="w-full py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'کارٹ پر لاگو کریں' : 'Apply Directly to Cart'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
