# Raftaar (رفتار) — Role-Based Access Control (RBAC) Matrix

## Permission Model
Raftaar uses a granular `resource:action` permission architecture. Roles represent atomic bundles of these permissions.

| Permission String | Resource | Action | Description |
| :--- | :--- | :--- | :--- |
| `catalog:read` | catalog | read | View merchant categories, menus, dishes, and grocery products |
| `catalog:write` | catalog | write | Create and edit menus, options, and items |
| `catalog:delete` | catalog | delete | Archive or delete catalog products |
| `orders:create` | orders | create | Create carts and submit orders for checkout |
| `orders:read_own` | orders | read_own | View orders placed by self or belonging to assigned merchant/rider |
| `orders:read_all` | orders | read_all | View all platform orders across all merchants |
| `orders:accept` | orders | accept | Merchant accept or decline incoming orders |
| `orders:update_prep` | orders | update_prep | Update kitchen cooking or packing stage |
| `orders:override_status` | orders | override_status | Admin state machine bypass for emergency exceptions |
| `orders:cancel` | orders | cancel | Customer or merchant cancel an unaccepted order |
| `dispatch:view` | dispatch | view | View live dispatch queue and active riders |
| `dispatch:assign` | dispatch | assign | Manually assign or reassign a rider to an order |
| `dispatch:accept_offer` | dispatch | accept_offer | Rider accepts a timed 30-second dispatch proposal |
| `rider:stream_location` | rider | stream_location | Push periodic GPS coordinates while online |
| `payments:read` | payments | read | Inspect transaction ledgers and payment statuses |
| `payments:reconcile_cod` | payments | reconcile_cod | Verify physical cash collected by riders on COD deliveries |
| `refunds:create` | refunds | create | Initiate refund requests for damaged/delayed orders |
| `refunds:approve` | refunds | approve | Authorize financial reversal to customer account/wallet |
| `settlements:manage` | settlements | manage | Generate and disburse merchant net earnings payouts |
| `coupons:redeem` | coupons | redeem | Apply coupon codes during order calculation |
| `coupons:manage` | coupons | manage | Configure coupon rules, usage limits, and discounts |
| `merchants:approve` | merchants | approve | Review merchant registration and KYC documents |
| `riders:approve` | riders | approve | Review rider driving license, CNIC, and bike documents |
| `support:chat` | support | chat | Post and receive messages on support tickets |
| `support:manage_tickets` | support | manage_tickets | Assign, escalate, and resolve customer/partner disputes |
| `audit_logs:read` | audit_logs | read | Inspect immutable operational history |
| `settings:edit` | settings | edit | Modify platform fee percentages, delivery tiers, and operating thresholds |
