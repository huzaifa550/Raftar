# Raftaar (رفتار) — Order State Machine Specification

## 1. Lifecycle States
1. `PLACED`: Customer has authorized checkout. Cart snapshot saved. Acceptance countdown initiated (e.g. 5 minutes).
2. `ACCEPTED`: Merchant kitchen/store confirms receipt and commits to estimated prep time.
3. `PREPARING`: Merchant has started cooking or assembling grocery items. Dispatch algorithm initiates search for nearby riders.
4. `READY_FOR_PICKUP`: Packaging sealed with order number tag.
5. `RIDER_ASSIGNED`: Rider has accepted dispatch offer and is routing to the merchant.
6. `RIDER_AT_MERCHANT`: Rider has arrived at the merchant store/kitchen geofence.
7. `PICKED_UP`: Handover confirmed between merchant and rider.
8. `OUT_FOR_DELIVERY`: Rider is en route to customer doorstep.
9. `RIDER_ARRIVED`: Rider has arrived at customer premises.
10. `DELIVERED`: Handover completed upon **server verification of 6-digit Customer OTP**. For COD, exact cash collected is logged.
11. `COLLECTED`: For Pickup orders, customer collects order at merchant counter with pickup PIN.
12. `CANCELLED`: Terminal state prior to prep or due to merchant non-response timeout.
13. `REJECTED`: Terminal state if merchant declines order with mandatory reason code.
14. `REFUND_PENDING`: Dispute submitted post-delivery.
15. `REFUNDED`: Finance or Admin confirms funds reversal.

## 2. Server-Enforced Transition Table
Every state transition validates:
- Current state matches the allowed prerequisite.
- The actor's token carries the necessary role and ownership rights.
- Transition is immutably logged into `order_status_history` with actor, timestamp, and metadata diff.
