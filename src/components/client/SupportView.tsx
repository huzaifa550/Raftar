import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  ChevronDown,
  Phone,
  Send,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { SupportTicket, Order } from './types.ts';

interface SupportViewProps {
  tickets: SupportTicket[];
  orders: Order[];
  onCreateTicket: (data: { orderId?: string; subject: string; category: string; message: string }) => void;
  onReplyTicket: (ticketId: string, message: string) => void;
  isUrdu: boolean;
}

export const SupportView: React.FC<SupportViewProps> = ({
  tickets,
  orders,
  onCreateTicket,
  onReplyTicket,
  isUrdu,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(tickets[0] || null);
  const [replyText, setReplyText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New ticket state
  const [category, setCategory] = useState('Order Delay');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const faqs = [
    {
      q: 'How do I cancel my order?',
      qUr: 'میں اپنا آرڈر کیسے منسوخ کر سکتا ہوں؟',
      a: 'You can cancel your order directly from the "My Orders" tab while the order status is still PLACED. Once the restaurant begins kitchen preparation, please contact customer support immediately.',
      aUr: 'آپ "میرے آرڈرز" میں جا کر آرڈر کو اس وقت منسوخ کر سکتے ہیں جب تک وہ تیاری کے مرحلے میں داخل نہ ہو۔ کچن میں تیاری شروع ہونے کے بعد فوری طور پر سپورٹ سے رابطہ کریں۔',
    },
    {
      q: 'What should I do if my rider is delayed?',
      qUr: 'اگر رائیڈر تاخیر کا شکار ہو تو مجھے کیا کرنا چاہیے؟',
      a: 'Karachi traffic can occasionally cause minor delays. You can track your rider’s live location via the "Track Order" button or call the rider directly via the phone icon on your active order card.',
      aUr: 'آپ "لائیو ٹریک" بٹن کے ذریعے رائیڈر کی موجودہ پوزیشن دیکھ سکتے ہیں یا براہ راست کال کر کے رابطہ کر سکتے ہیں۔',
    },
    {
      q: 'How does Cash on Delivery (COD) change work?',
      qUr: 'کیش آن ڈلیوری پر بقایا رقم کی کیا پالیسی ہے؟',
      a: 'When placing your order, select your change note requirement (e.g. Rs. 1,000 note or Rs. 5,000 note). Your rider will carry sufficient change when arriving at your doorstep.',
      aUr: 'آرڈر دیتے وقت اپنے نوٹ کی مالیت منتخب کریں تاکہ رائیڈر آپ کے لیے بقایا رقم ساتھ لا سکے۔',
    },
    {
      q: 'How long do refunds take to process?',
      qUr: 'رقم کی واپسی (ریفنڈ) میں کتنا وقت لگتا ہے؟',
      a: 'Refunds for wallet transactions (JazzCash & EasyPaisa) are processed within 1 to 4 business hours. Bank debit/credit cards usually settle within 2-3 business days.',
      aUr: 'جاز کیش اور ایزی پیسہ سے کیے گئے آرڈرز کا ریفنڈ 1 سے 4 گھنٹے میں جبکہ بینک کارڈز پر 2 سے 3 دن میں منتقل ہو جاتا ہے۔',
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    onCreateTicket({
      category,
      orderId: selectedOrderId || undefined,
      subject,
      message,
    });
    setShowCreateModal(false);
    setSubject('');
    setMessage('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    onReplyTicket(selectedTicket.id, replyText);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-5 h-5 text-[#E53935]" />
            <h2 className="text-base sm:text-lg font-black text-[#212121]">
              {isUrdu ? 'کسٹمر کیئر و ہیلپ ڈیسک' : 'Customer Care & Help Center'}
            </h2>
          </div>
          <p className="text-xs text-[#666666]">
            {isUrdu
              ? 'ہم آپ کی مدد کے لیے ہفتے کے ساتوں دن 24 گھنٹے حاضر ہیں'
              : 'Our Karachi care specialists are available 24/7 to resolve any issue'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:021111723827"
            className="px-3.5 py-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-xs font-bold text-[#212121] flex items-center gap-1.5 transition"
          >
            <Phone className="w-3.5 h-3.5 text-[#E53935]" />
            <span>021-111-RAFTAR</span>
          </a>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isUrdu ? 'نئی شکایت / ٹکٹ' : 'New Support Ticket'}</span>
          </button>
        </div>
      </div>

      {/* Grid: FAQs & Ticket Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: FAQs */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-extrabold text-sm text-[#212121]">
            {isUrdu ? 'اکثر پوچھے جانے والے سوالات' : 'Frequently Asked Questions'}
          </h3>
          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden shadow-xs transition"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-3.5 text-left rtl:text-right flex items-center justify-between gap-2 text-xs font-bold text-[#212121] hover:bg-[#F5F5F5] transition"
                  >
                    <span>{isUrdu ? faq.qUr : faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#666666] flex-shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-[#E53935]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-3.5 pt-0 text-xs text-[#666666] leading-relaxed border-t border-[#F5F5F5] bg-[#FFFDF7]">
                      {isUrdu ? faq.aUr : faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Support Tickets & Live Chat */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E0E0E0] p-5 shadow-xs flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0E0E0] mb-3">
            <div>
              <h3 className="font-extrabold text-sm text-[#212121]">
                {selectedTicket ? selectedTicket.subject : 'Active Support Conversation'}
              </h3>
              <span className="text-[10px] text-[#666666]">
                {selectedTicket
                  ? `Category: ${selectedTicket.category} • Status: ${selectedTicket.status.toUpperCase()}`
                  : 'Select or start a support ticket'}
              </span>
            </div>
            {selectedTicket && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedTicket.status === 'resolved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-[#FFC107] text-[#212121]'
                }`}
              >
                {selectedTicket.status}
              </span>
            )}
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {!selectedTicket ? (
              <div className="text-center py-16 text-xs text-[#666666]">
                {isUrdu ? 'کوئی فعال ٹکٹ منتخب نہیں ہے' : 'No active tickets selected.'}
              </div>
            ) : (
              selectedTicket.messages.map((m) => {
                const isMe = m.sender === 'customer';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-[#666666] mb-1">
                      {m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div
                      className={`p-3 rounded-2xl max-w-sm text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#FFC107] text-[#212121] rounded-tr-xs'
                          : 'bg-[#F5F5F5] text-[#212121] rounded-tl-xs border border-[#E0E0E0]'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send Input */}
          {selectedTicket && (
            <form onSubmit={handleSendReply} className="pt-3 border-t border-[#E0E0E0] flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  isUrdu
                    ? 'اپنا پیغام یہاں لکھیں...'
                    : 'Type your message to customer support...'
                }
                className="flex-1 px-3 py-2 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'بھیجیں' : 'Send'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E0E0E0] shadow-2xl">
            <h3 className="font-black text-base text-[#212121] mb-1">
              {isUrdu ? 'نئی شکایت یا سوال درج کریں' : 'Submit Support Ticket'}
            </h3>
            <p className="text-xs text-[#666666] mb-4">
              {isUrdu
                ? 'براہ کرم اپنے مسئلے کی تفصیل لکھیں تاکہ ہماری ٹیم فوری حل فراہم کر سکے'
                : 'Provide details so our operations team can resolve this immediately'}
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#212121] block mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none"
                >
                  <option value="Order Delay">Order Delay</option>
                  <option value="Missing or Wrong Item">Missing or Wrong Item</option>
                  <option value="Food Quality Issue">Food Quality Issue</option>
                  <option value="Payment & Refund">Payment & Refund</option>
                  <option value="Rider Conduct">Rider Conduct</option>
                  <option value="General Question">General Question</option>
                </select>
              </div>

              {orders.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-[#212121] block mb-1">
                    Related Order (Optional)
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none"
                  >
                    <option value="">None / General Inquiry</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.orderNumber} - {o.merchantName} (Rs. {Math.round(o.pricing.total / 100)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#212121] block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My order from Student Biryani is delayed"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#212121] block mb-1">Message</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what happened..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2.5 bg-[#F5F5F5] rounded-xl text-xs border border-[#E0E0E0] outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#F5F5F5] font-bold text-xs text-[#212121]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#212121] font-bold text-xs transition shadow-xs"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
