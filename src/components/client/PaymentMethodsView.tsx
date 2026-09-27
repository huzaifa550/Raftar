import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle2, Wallet, Banknote, X, ShieldCheck } from 'lucide-react';
import { PaymentMethodRecord } from './types.ts';

interface PaymentMethodsViewProps {
  methods: PaymentMethodRecord[];
  onSetDefaultMethod: (id: string) => void;
  onDeleteMethod: (id: string) => void;
  onAddMethod: (method: Partial<PaymentMethodRecord>) => void;
  isUrdu: boolean;
}

export const PaymentMethodsView: React.FC<PaymentMethodsViewProps> = ({
  methods,
  onSetDefaultMethod,
  onDeleteMethod,
  onAddMethod,
  isUrdu,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState<'jazzcash' | 'easypaisa' | 'raast' | 'card'>('jazzcash');
  const [phone, setPhone] = useState('03001234567');
  const [raastId, setRaastId] = useState('03001234567');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cardHolder, setCardHolder] = useState('Fatima Noor');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'jazzcash') {
      onAddMethod({
        type: 'jazzcash',
        title: 'JazzCash Mobile Account',
        subtitle: `${phone} • Fast Checkout`,
        isDefault: false,
        details: { phone },
      });
    } else if (type === 'easypaisa') {
      onAddMethod({
        type: 'easypaisa',
        title: 'EasyPaisa Wallet',
        subtitle: `${phone} • OTP Verification`,
        isDefault: false,
        details: { phone },
      });
    } else if (type === 'raast') {
      onAddMethod({
        type: 'raast',
        title: 'Raast P2M Direct Instant Pay',
        subtitle: `ID: ${raastId} • State Bank of Pakistan`,
        isDefault: false,
        details: { raastId },
      });
    } else {
      const last4 = cardNumber.slice(-4) || '1234';
      onAddMethod({
        type: 'card',
        title: 'Debit / Credit Card',
        subtitle: `•••• ${last4} (${cardHolder})`,
        isDefault: false,
        details: { last4, cardHolder, expiry },
      });
    }

    setShowAddModal(false);
    setCardNumber('');
    setExpiry('');
  };

  const getMethodIcon = (t: string) => {
    switch (t) {
      case 'cod':
        return <Banknote className="w-5 h-5 text-green-700" />;
      case 'jazzcash':
      case 'easypaisa':
      case 'raast':
        return <Wallet className="w-5 h-5 text-[#E53935]" />;
      default:
        return <CreditCard className="w-5 h-5 text-[#FFC107]" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E0E0E0] shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#212121]">
            {isUrdu ? 'طریقہ ہائے ادائیگی' : 'Payment Methods & Digital Wallets'}
          </h2>
          <p className="text-xs text-[#666666]">
            {isUrdu
              ? 'کیش آن ڈلیوری، جاز کیش، ایزی پیسہ یا بینک کارڈز شامل کریں'
              : 'Configure your primary payment method for quick one-click orders'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isUrdu ? '+ نیا طریقہ شامل کریں' : '+ Add Payment Method'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((method) => (
          <div
            key={method.id}
            className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
              method.isDefault ? 'border-[#FFC107] ring-1 ring-[#FFC107]/40' : 'border-[#E0E0E0]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#F5F5F5]">{getMethodIcon(method.type)}</div>
                  <div>
                    <h3 className="font-extrabold text-xs text-[#212121]">{method.title}</h3>
                    <p className="text-[11px] text-[#666666]">{method.subtitle}</p>
                  </div>
                </div>
                {method.isDefault && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FFC107] text-[#212121] font-black text-[10px]">
                    Default
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex items-center justify-between">
              {!method.isDefault ? (
                <button
                  onClick={() => onSetDefaultMethod(method.id)}
                  className="text-xs font-bold text-[#E53935] hover:underline"
                >
                  {isUrdu ? 'طے شدہ بنائیں' : 'Set as Default'}
                </button>
              ) : (
                <span className="text-[11px] font-bold text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isUrdu ? 'بنیادی طریقہ' : 'Primary Method'}
                </span>
              )}

              {method.type !== 'cod' && (
                <button
                  onClick={() => onDeleteMethod(method.id)}
                  className="p-1.5 rounded-lg text-[#666666] hover:text-[#E53935] hover:bg-red-50 transition"
                  title="Remove method"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E0E0E0] shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#666666] hover:bg-[#F5F5F5]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-black text-base text-[#212121] mb-1">
              {isUrdu ? 'طریقہ ادائیگی شامل کریں' : 'Add Payment Method'}
            </h3>
            <p className="text-xs text-[#666666] mb-4">
              {isUrdu ? 'جاز کیش، ایزی پیسہ یا بینک کارڈ منتخب کریں' : 'Select your payment channel'}
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#212121] block mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'jazzcash', label: 'JazzCash' },
                    { id: 'easypaisa', label: 'EasyPaisa' },
                    { id: 'raast', label: 'Raast ID' },
                    { id: 'card', label: 'Bank Card' },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setType(t.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        type === t.id
                          ? 'bg-[#FFC107] text-[#212121] border-[#FFC107]'
                          : 'bg-[#F5F5F5] text-[#666666] border-[#E0E0E0]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {['jazzcash', 'easypaisa'].includes(type) && (
                <div>
                  <label className="text-xs font-bold text-[#212121] block mb-1">
                    Mobile Account Number (03XX-XXXXXXX)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none"
                  />
                </div>
              )}

              {type === 'raast' && (
                <div>
                  <label className="text-xs font-bold text-[#212121] block mb-1">
                    Raast Mobile / IBAN Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={raastId}
                    onChange={(e) => setRaastId(e.target.value)}
                    className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none"
                  />
                </div>
              )}

              {type === 'card' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-[#212121] block mb-1">Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4242 •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-[#212121] block mb-1">Cardholder</label>
                      <input
                        type="text"
                        required
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#212121] block mb-1">MM/YY</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        required
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs shadow-xs transition"
                >
                  {isUrdu ? 'طریقہ محفوظ کریں' : 'Save Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
