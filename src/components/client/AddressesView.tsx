import React, { useState } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, Home, Briefcase, Compass, X } from 'lucide-react';
import { CustomerAddress } from './types.ts';

interface AddressesViewProps {
  addresses: CustomerAddress[];
  onSetDefaultAddress: (id: string) => void;
  onDeleteAddress: (id: string) => void;
  onSaveAddress: (data: Partial<CustomerAddress>) => void;
  isUrdu: boolean;
}

export const AddressesView: React.FC<AddressesViewProps> = ({
  addresses,
  onSetDefaultAddress,
  onDeleteAddress,
  onSaveAddress,
  isUrdu,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [recipientName, setRecipientName] = useState('Fatima Noor');
  const [recipientPhone, setRecipientPhone] = useState('03001234567');
  const [area, setArea] = useState('Clifton Block 7');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetAddress || !area) return;

    onSaveAddress({
      label,
      recipientName,
      recipientPhone,
      area,
      streetAddress,
      landmark,
      deliveryInstructions: instructions,
      city: 'Karachi',
      latitude: 24.825,
      longitude: 67.034,
      isDefault,
    });

    setShowAddModal(false);
    setStreetAddress('');
    setLandmark('');
    setInstructions('');
  };

  const getLabelIcon = (l: string) => {
    switch (l) {
      case 'Home':
        return <Home className="w-4 h-4 text-[#E53935]" />;
      case 'Work':
        return <Briefcase className="w-4 h-4 text-[#FFC107]" />;
      default:
        return <Compass className="w-4 h-4 text-[#666666]" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E0E0E0] shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#212121]">
            {isUrdu ? 'محفوظ شدہ ڈلیوری پتے' : 'Saved Delivery Addresses'}
          </h2>
          <p className="text-xs text-[#666666]">
            {isUrdu
              ? 'اپنے گھر، دفتر یا دیگر پتے باآسانی محفوظ اور منتخب کریں'
              : 'Manage multiple dropoff addresses for fast and effortless ordering'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isUrdu ? '+ نیا پتہ شامل کریں' : '+ Add New Address'}</span>
        </button>
      </div>

      {/* Address cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
              addr.isDefault ? 'border-[#FFC107] ring-1 ring-[#FFC107]/40' : 'border-[#E0E0E0]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#F5F5F5]">{getLabelIcon(addr.label)}</div>
                  <span className="font-extrabold text-sm text-[#212121]">{addr.label}</span>
                </div>
                {addr.isDefault && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FFC107] text-[#212121] font-black text-[10px]">
                    Default
                  </span>
                )}
              </div>

              <p className="text-xs font-semibold text-[#212121] mt-1">{addr.streetAddress}</p>
              <p className="text-xs text-[#666666]">{addr.area}, {addr.city}</p>

              {addr.landmark && (
                <p className="text-[11px] text-[#666666] mt-1">
                  <span className="font-semibold text-[#212121]">Landmark:</span> {addr.landmark}
                </p>
              )}
              {addr.deliveryInstructions && (
                <p className="text-[11px] text-[#666666] mt-0.5">
                  <span className="font-semibold text-[#212121]">Note:</span> {addr.deliveryInstructions}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex items-center justify-between">
              {!addr.isDefault ? (
                <button
                  onClick={() => onSetDefaultAddress(addr.id)}
                  className="text-xs font-bold text-[#E53935] hover:underline"
                >
                  {isUrdu ? 'پہلے سے طے کریں' : 'Set as Default'}
                </button>
              ) : (
                <span className="text-[11px] font-bold text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isUrdu ? 'بنیادی پتہ' : 'Primary Address'}
                </span>
              )}
              <button
                onClick={() => onDeleteAddress(addr.id)}
                className="p-1.5 rounded-lg text-[#666666] hover:text-[#E53935] hover:bg-red-50 transition"
                title="Delete address"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Address Modal */}
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
              {isUrdu ? 'نیا ڈلیوری پتہ شامل کریں' : 'Add New Delivery Address'}
            </h3>
            <p className="text-xs text-[#666666] mb-4">
              {isUrdu
                ? 'اپنے پتے کی درست معلومات درج کریں تاکہ رائیڈر باآسانی پہنچ سکے'
                : 'Enter your location details so riders deliver without delays'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#212121] block mb-1">
                  {isUrdu ? 'پتے کی قسم' : 'Address Label'}
                </label>
                <div className="flex gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((l) => (
                    <button
                      type="button"
                      key={l}
                      onClick={() => setLabel(l)}
                      className={`flex-1 py-1.5 rounded-xl font-bold text-xs border transition ${
                        label === l
                          ? 'bg-[#FFC107] text-[#212121] border-[#FFC107]'
                          : 'bg-[#F5F5F5] text-[#666666] border-[#E0E0E0]'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#212121] block mb-1">
                  {isUrdu ? 'علاقہ / ٹاؤن' : 'Area / Neighborhood'}
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none"
                >
                  <option value="Clifton Block 7">Clifton Block 7</option>
                  <option value="Clifton Block 2">Clifton Block 2</option>
                  <option value="DHA Phase 5">DHA Phase 5</option>
                  <option value="DHA Phase 6">DHA Phase 6</option>
                  <option value="Gulshan-e-Iqbal Block 13">Gulshan-e-Iqbal Block 13</option>
                  <option value="PECHS Block 2">PECHS Block 2</option>
                  <option value="Saddar Town">Saddar Town</option>
                  <option value="North Nazimabad Block H">North Nazimabad Block H</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#212121] block mb-1">
                  {isUrdu ? 'مکمل گلی / گھر کا پتہ' : 'Street Address & Flat / House #'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House 42-B, Street 14, Block 7"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#212121] block mb-1">
                  {isUrdu ? 'قریبی مشہور جگہ (Landmark)' : 'Nearby Landmark (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Bilawal House or Teen Talwar"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#212121] block mb-1">
                  {isUrdu ? 'رائیڈر کے لیے ہدایات' : 'Rider Instructions (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ring bell 2, leave with watchman"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defAddr"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-[#FFC107] focus:ring-[#FFC107]"
                />
                <label htmlFor="defAddr" className="text-xs font-medium text-[#212121] cursor-pointer">
                  {isUrdu ? 'اسے بنیادی پتہ منتخب کریں' : 'Set as default delivery address'}
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs shadow-xs transition"
                >
                  {isUrdu ? 'پتہ محفوظ کریں' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
