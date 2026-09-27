# Raftaar (رفتار) — Architecture Decisions Record (ADR)

## ADR 001: Monorepo & Full-Stack Architecture
* **Status:** Accepted
* **Context:** The platform requires 5 coordinated surfaces (Customer mobile web/PWA, Customer desktop portal, Merchant dashboard, Rider app, Admin panel) powered by a single authoritative backend.
* **Decision:** We use a unified TypeScript monorepo with an Express API core mounted alongside Vite in development and production. All DTOs, Zod validation schemas, business rules, and RBAC contracts are strictly shared between frontend and backend.

## ADR 002: Mobile-First Pakistani Market Authentication
* **Status:** Accepted
* **Context:** In Pakistan, phone numbers (+92 3XX XXXXXXX) are the primary digital identity; email adoption is secondary among riders, shop merchants, and customers.
* **Decision:** Authentication is phone-number-first via 6-digit Time-based/Random OTPs with a 3-minute validity window. We introduce a pluggable `SmsProvider` interface with a `MockSmsAdapter` (for development and CI) that outputs deterministic OTPs with an in-memory inspection endpoint, switchable via `SMS_PROVIDER=mock|twilio|local_pk`. Dual-token strategy: 15-minute access JWT and rotating 30-day refresh tokens.

## ADR 003: Monetary Storage in Integer Minor Units (Paisa / PKR)
* **Status:** Accepted
* **Context:** Floating point arithmetic leads to rounding errors in multi-item orders, discounts, and tiered sales tax.
* **Decision:** All money values (subtotals, delivery fees, service fees, tips, tax, refunds, commissions) are strictly represented as integers in Paisas (1 PKR = 100 Paisas) or integer Rupees with explicit currency tags (`PKR`). The pricing engine is purely server-side authoritative.

## ADR 004: Decoupled Multi-Provider Abstraction Layer
* **Status:** Accepted
* **Context:** Third-party credentials (SMS gateways, payment gateways like JazzCash/Easypaisa/PayFast, map tile APIs) vary between local dev, staging, and production environments.
* **Decision:** Implement strict adapter patterns for `SmsProvider`, `PaymentProvider`, `MapProvider`, and `NotificationProvider`. Each provider defaults to a fully functional, self-contained Mock adapter with realistic telemetry if external credentials are not set.

## ADR 005: Hybrid Spatial Storage & Geofencing
* **Status:** Accepted
* **Context:** Merchant delivery polygons and rider dispatch require geo-queries (PostGIS `ST_Contains`, `ST_DWithin`).
* **Decision:** Production utilizes PostgreSQL + PostGIS extension with Polygon boundaries. The application data access layer encapsulates geo-containment (Ray-Casting algorithm on spherical coordinates in TypeScript fallback) so local development works without demanding a native PostGIS installation.

## ADR 006: Granular RBAC & Tenant Isolation
* **Status:** Accepted
* **Context:** Nine distinct roles exist across customers, merchants, riders, and platform staff.
* **Decision:** Enforce permission bundles (`resource:action`) on every endpoint backed by an object-level tenant guard (`assertOwnership` verifying matching `customer_id`, `merchant_id`, or `rider_id`).
