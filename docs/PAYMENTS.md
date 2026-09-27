# Raftaar (رفتار) — Payment Adapters & Reconciliation

## 1. Supported Payment Channels in Pakistan
1. **Cash on Delivery (COD):** The standard consumer choice across Pakistan. Delivery requires rider to collect and log exact cash before OTP completion.
2. **Pakistani Wallets (JazzCash & Easypaisa):** Mobile wallet direct debit via API/USSD push and QR code integration.
3. **Card Processing (PayFast / Stripe compatible):** 3D-Secure credit/debit card processing. Only provider tokens and masked last-4 digits are retained in the database.

## 2. Settlement Math
- `Merchant Payout = Order Gross Item Subtotal - Platform Commission % - Refund Adjustments`
- `Rider Payout = Base Fare + (Distance in KM * Per KM Rate) + Peak Incentive + 100% of Customer Tip`
- `Rider Net COD Balance = Total COD Cash in Hand - Accrued Rider Earnings`
