# Iris / Homio 2.0 — Multi-Tenant E-Commerce Platform

A modern, high-performance multi-tenant e-commerce platform and inventory management system built with **NPM Workspaces**:

- **[`apps/iris-admin`](file:///Users/invercity/projects/iris/apps/iris-admin)** — Headless CMS & Admin Portal built on **PayloadCMS v3** (Next.js 15 App Router + MongoDB + S3/Cloudflare R2 adapter for product media storage). Features custom **Bootstrap 5** design and bilingual **EN / UA** localization.
- **[`apps/iris-api`](file:///Users/invercity/projects/iris/apps/iris-api)** — Fast, lightweight backend service built with **NestJS & Mongoose**, providing multi-tenant REST APIs and automated migration scripts.
- **[`apps/iris-app`](file:///Users/invercity/projects/iris/apps/iris-app)** — Storefront and point-of-sale customer application built with **React 19 + Vite + TypeScript**, supporting dynamic store subdomains (`*.homee.ua`), cart management, and instant EN / UA language switching.
- **[`packages/shared`](file:///Users/invercity/projects/iris/packages/shared)** — Shared domain models, TypeScript types, DTOs, order calculation logic (`calculateOrderTotal`), phone masking (`maskClientPhone`), and DNS subdomain resolution utilities (`resolveTenantSlugFromHostname`).

---

## Architecture: Multi-Tenancy & Subdomains (`*.homee.ua`)

Every store on the platform is represented by a document in the `tenants` collection:
- `slug` — Unique store identifier and DNS subdomain prefix (e.g., `vitaly` for `vitaly.homee.ua`).
- `domain` — Canonical domain name for the store (`vitaly.homee.ua`).
- All business collections (`goods`, `orders`, `clients`, `places`, `media`) maintain an indexed `tenant` reference (`ObjectId -> tenants`).
- **Storefront (`iris-app`)** automatically detects the active store from the hostname (`vitaly.homee.ua` or `vitaly.localhost:5173`), or via `?tenant=vitaly` parameter, and attaches the `x-tenant-slug` header to API requests.
- **API (`iris-api`)** uses `TenantMiddleware` to resolve the tenant from `x-tenant-slug`, `x-tenant-id`, query parameters, or `Host`/`Origin` headers.
- **Admin Panel (`iris-admin`)** uses `@payloadcms/plugin-multi-tenant`:
  - **Super-Administrators** (`admin`) have global system visibility and can switch between tenant store scopes via the Tenant Selector.
  - **Store Owners & Managers** are strictly scoped to their assigned store: they manage only their own goods, orders, clients, and media, while system-level collections (`Tenants` and `Users`) are hidden.

---

## Product Media Storage (S3 / Cloudflare R2)

The `media` collection in `iris-admin` utilizes `@payloadcms/storage-s3` and `sharp`:
- Automatically generates responsive **WebP** image variants: `thumbnail` (300×300), `card` (640×640), and `large` (1200×1200).
- Supports **Cloudflare R2** (zero egress fees) or **AWS S3** in production via environment variables: `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
- In local development (when S3 credentials are not configured), uploaded files are stored safely on local disk in `apps/iris-admin/media`.

---

## Bilingual Support (EN & UA)

The entire user interface supports both **English** and **Ukrainian**:
1. **Admin Panel (`iris-admin`)**:
   - Integrates native `@payloadcms/translations` for `en` and `uk`.
   - All collection labels and fields support bilingual `{ en: '...', uk: '...' }` definitions.
   - Users can switch their preferred language in their admin user profile or account settings.
2. **Storefront (`iris-app`)**:
   - Live language toggle pill (`EN` | `UA`) located in the header.
   - Saves language preference in `localStorage` (`iris_locale`) with automatic browser language detection fallback.

---

## Bootstrap 5 Customization

The admin panel features a clean, professional Bootstrap 5 aesthetic:
- Modern system font stack (`system-ui, -apple-system, "Segoe UI", Roboto...`).
- Authentic Bootstrap color system (`#0d6efd` primary blue, `#198754` success green, `#dc3545` danger red).
- Bootstrap `0.375rem` (6px) rounded corners on inputs, cards, and buttons.
- Distinctive Bootstrap focus outlines (`box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25)`).

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Migrations & Seed Demo Stores
```bash
# Migrate existing legacy MongoDB data to multi-tenant structure
npm run migrate

# Seed demo super-admin and store accounts (vitaly.homee.ua and olena.homee.ua)
npm run seed
```

Default credentials created by `npm run seed`:
- **Super-Admin**: `admin@homee.ua` / `admin12345` (global admin access)
- **Store Owner (Vitaly)**: `vitaly@homee.ua` / `admin12345` (vitaly.homee.ua)
- **Store Owner (Olena)**: `olena@homee.ua` / `admin12345` (olena.homee.ua)

### 4. Start Development Servers
```bash
# Run all 3 services concurrently (API + Storefront App + Admin Panel)
npm run dev

# Or run services individually:
npm run dev:api    # NestJS API (Port 3000)
npm run dev:app    # Vite React Storefront (Port 5173)
npm run dev:admin  # Next.js PayloadCMS Admin (Port 3001)
```

### 5. Build & Test
```bash
# Typecheck all workspaces
npm run typecheck

# Build shared library, API, storefront, and admin panel
npm run build

# Run unit and domain tests
npm test
```

---

## Continuous Integration (CI)

GitHub Actions workflow [.github/workflows/test.yml](file:///.github/workflows/test.yml) validates all pull requests and pushes across Node.js 20 and 22 LTS with an automated MongoDB 7.0 container:
1. `npm run typecheck`
2. `npm run build:shared`
3. `npm run build:api`
4. `npm run build:app`
5. `npm run build:admin`
6. `npm run migrate`
7. `npm run seed`
8. `npm test`
