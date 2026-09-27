# Raftaar (رفتار) — Deployment Guide

## 1. Local Development (One-Command Boot)
```bash
# 1. Start PostgreSQL with PostGIS and Redis
docker-compose up -d

# 2. Run Database Migrations & Seed
npm run seed:phase1

# 3. Start Full-Stack Development Server (Express API + Vite HMR)
npm run dev
```
Visit `http://localhost:3000` to access the interactive platform console, Swagger documentation at `/api/docs/openapi.json`, and live authentication workbench.

## 2. Running Automated Tests
```bash
npm test
```

## 3. Production Deployment (Cloud Run / VPS / Kubernetes)
- Build frontend: `npm run build`
- Start server: `npm start`
- Port: Configured via `PORT=3000`
- TLS Termination: Enforce HTTPS via Cloudflare or NGINX reverse proxy.
