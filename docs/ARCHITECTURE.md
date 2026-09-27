# Raftaar (رفتار) — System Architecture

## High-Level Architecture
Raftaar is an on-demand, multi-vendor food, grocery, and essentials delivery marketplace designed specifically for Pakistani urban hubs (Karachi, Lahore, Islamabad/Rawalpindi).

```
+-----------------------------------------------------------------------------------+
|                            CLIENT SURFACES (Web & PWA)                            |
|  [Customer App]   [Customer Web]   [Merchant Portal]   [Rider App]   [Admin Hub]  |
+-----------------------------------------------------------------------------------+
                                         |  (HTTPS / WSS / REST)
                                         v
+-----------------------------------------------------------------------------------+
|                        EXPRESS APPLICATION GATEWAY                                |
|  - Correlation ID & Timing Middleware   - Zod Payload Validation                  |
|  - JWT & Token Rotation Auth Guard      - Granular RBAC & Tenant Isolation Guard  |
|  - Centralized Error Handler (RFC 7807) - Audit Logging Interceptor               |
+-----------------------------------------------------------------------------------+
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
         v                               v                               v
+------------------+           +-------------------+           +-------------------+
| CORE DOMAIN      |           | PROVIDER LAYER    |           | REAL-TIME ENGINE  |
| - Auth & Users   |           | - SMS Provider    |           | - Socket.IO Rooms |
| - Merchants      |           |   (Mock / Twilio) |           | - Merchant Chimes |
| - Catalog        |           | - Payment Engine  |           | - Rider Dispatch  |
| - Pricing Engine |           |   (COD/Jazz/Easy) |           | - GPS Telemetry   |
| - Order Machine  |           | - Map Provider    |           | - Support Chat    |
| - RBAC Service   |           |   (OSM / Google)  |           +-------------------+
+------------------+           +-------------------+
         |                               |
         +-------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                              PERSISTENCE LAYER                                    |
|  - PostgreSQL 16 + PostGIS (Spatial indexing for polygons & proximity dispatch)   |
|  - In-Memory High-Speed Cache & Session Store                                    |
|  - Immutable Audit Log Ledger                                                     |
+-----------------------------------------------------------------------------------+
```

## Security & Tenant Boundary Isolation
1. **Tenant Isolation:** Every order, cart, merchant menu, or delivery query is scoped strictly by the token's authenticated claims. A customer can never view another customer's order history (IDOR protection).
2. **Dual-Token Lifetime:**
   - Access Token: 15 minutes, signed with HMAC-SHA256.
   - Refresh Token: 30 days, single-use with cryptographic rotation. Previous refresh tokens are invalidated upon use.
3. **Audit Ledger:** Every sensitive administrative, status change, or refund operation is immutably appended to `audit_logs`.
