# Recura Subscription ERP

Recura Subscription ERP is an enterprise-grade management platform tailored for digital subscription resellers (Netflix, Disney+, Prime Video, Spotify, IPTV, YouTube Premium, and more). It streamlines customer CRM, order fulfillment, stock management, renewal alerts, and automated multi-lingual WhatsApp customer messaging — and pairs with a companion mobile app that delivers renewal alerts as push notifications.

Recura is **fully self-hostable**: it runs from a single Docker command, in the cloud on Render, or entirely serverless against any hosted PostgreSQL (including Supabase) with no server to manage.

---

## 🚀 Key Features

### 📊 Executive Dashboard & Analytics
- **Real-Time KPIs**: Monitor Total Revenue, Monthly Recurring Revenue (MRR Growth), Active Customers, and Pending Renewal Counts.
- **Visual Analytics**: Interactive revenue charts, sales breakdowns by subscription provider, and status distributions.
- **Quick Actions**: Rapidly register orders, manage customers, or trigger renewal reminders.

### 📦 Order & Subscription Fulfillment
- **Account Credential Management**: Store and assign encrypted passwords, screen profile names, and PIN codes for customer orders.
- **Flexible Validity Periods**: Support for 1-month, 3-month, 6-month, and 12-month subscription options.
- **Renewal Tracking**: Mark orders as contacted for renewal and track real-time expiration timelines.

### 👥 Customer CRM Registry
- **Detailed Profiles**: Store WhatsApp contact details, email, registration date, spending history, and custom notes.
- **Language Localization**: Track customer language preference (**Arabic**, **French**, **English**) for personalized automation.
- **Customer Statuses**: Categorize customers as `Active`, `Inactive`, `Blocked`, or `VIP`.

### 📋 Subscription Plans & Inventory Control
- **Catalog Management**: Create and manage plans across multiple categories (Netflix, Disney+, Prime Video, Spotify, IPTV, etc.).
- **Stock Tracking**: Monitor total account inventory vs. active orders to prevent overselling.

### ⏰ Expiration & Renewal Alerts
- **Categorized Timelines**: Automatic sorting into **Expiring in 3 Days**, **Expiring in 7 Days**, and **Expired** categories.
- **One-Click WhatsApp Dispatch**: Directly send renewal notices formatted in the customer's preferred language via WhatsApp Web or mobile app.

### 💬 Automated WhatsApp Messaging
- **Customizable Multi-Lingual Templates**: Templates in Arabic, French, and English for both warning (3-day) and expired states.
- **Dynamic Tag Injection**: Automatically substitute `{customerName}`, `{planName}`, `{endDate}`, `{accountEmail}`, and other parameters into outgoing messages.

### 📱 Companion Mobile App & Push Notifications
- **Device Registration**: The mobile app registers per-user device tokens (`push_tokens`).
- **Renewal Event Queue**: Milestone events are queued (`push_events`) and deduplicated per entity and milestone (`push_log`), so a customer is never notified twice for the same renewal.
- **Automatic Setup**: The mobile-app push tables are created on every fresh install, so the web app and mobile app work together out of the box.

### 🛡️ Security, Audit Logging & Role Control
- **Role-Based Access Control (RBAC)**: Enforce strict boundaries between **System Administrators** (full system access, session control, security settings) and **Limited Staff Members**.
- **Active Session Management**: Administrators can view and terminate active user sessions and monitor device information.
- **Comprehensive Audit Log**: Trace logins, customer modifications, order creations, and WhatsApp message dispatches with timestamp and IP address logging.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Animations & Toast Notifications**: Motion & Sonner
- **Server**: Node.js HTTP server (`server/`) serving the SPA, REST API, and install wizard
- **Database**: PostgreSQL 13+ — direct `pg` connection **or** any PostgREST-compatible hosted database (e.g. Supabase)
- **Auth & Security**: argon2 password hashing, CSRF-protected login, secrets stored with file-permission protection (never in the browser)

---

## 💻 Installation (easy, no technical knowledge needed)

Recura installs itself through a friendly wizard. The wizard detects what you have
(Docker, a hosted database, a connection string), routes you to the easiest path, and creates your database schema
for you. Pick the option that fits you:

### Option A — Docker (recommended, one command)

If you have [Docker](https://www.docker.com/products/docker-desktop/) installed, everything (app + database)
starts with one command:

```bash
docker compose up -d
```

Then open **http://localhost:8787/install**, click **"Using Docker? Fill it in"** in the wizard, and press
**Test Connection** → **Continue**. The bundled database is already configured for you.

### Option B — Render (one click, runs in the cloud)

1. Push this repo to GitHub.
2. On [Render](https://render.com), choose **New + → Blueprint** and connect the repo.
3. Render creates the app **and a database** automatically.
4. Open `https://<your-service>.onrender.com/install` and click **"Use the database provided by my hosting"** →
   **Test Connection** → **Continue**. Done.

### Option C — Hosted database only, no server (Supabase / any PostgREST)

Don't want to run a server at all? Recura can run entirely in the browser against a hosted PostgreSQL database
that speaks PostgREST (e.g. **Supabase**):

1. Create a free project at [Supabase](https://supabase.com) (or any PostgREST-compatible database).
2. Open Recura's `/install` wizard and choose **"Hosted database (PostgREST)"**.
3. Paste your database URL and public key, then **Verify connection & schema**. The wizard copies the full schema
   (all tables, indexes, and mobile-app push tables) into your database's SQL console — including a one-click
   **RLS fix** that keeps the public API key writable.

No Docker, no Node.js, no server. The SPA and installer work from any static host (Vercel, Netlify, GitHub Pages).
The wizard auto-detects non-PostgREST providers (e.g. GraphQL on Nhost/Hasura) and guides you to the
connection-string path instead.

### Option D — Manual (developers)

Prerequisites: **Node.js 18+**, **npm**, and a PostgreSQL 13+ database.

```bash
npm install
npm run build
npm start
```

Open **http://localhost:8787/install** and follow the wizard. You can paste a `postgres://` connection string
from your database provider (Neon, Supabase, Render, …) or fill the fields by hand — the installer tests the
connection, detects the provider, and creates the whole schema for you. All API calls run with a 30-second
timeout so slow or cold-start servers never cause failed saves, and any row-level-security (RLS) blocks are
detected early with a clear, copy-paste fix.

> **Hosting the interface separately (e.g. Vercel)?** Deploy the server first (Options A or B), then build the
> front-end with `VITE_API_URL="https://<your-server>"` and set the server's
> `RECURA_CORS_ORIGINS` to your site's address. The `/install` wizard also works on the static host and talks
> to the server over CORS. If no server is reachable at all, the wizard automatically falls back to the
> browser-only hosted-database flow (Option C).

After installation, log in with the administrator account you created in the wizard. The installer locks itself
once finished.

---

## 📁 Project Structure

```text
├── server/              # Node.js server: SPA serving, REST API, install wizard, auth
│   ├── migrations/      # SQL migrations (schema, WhatsApp templates, push tables, …)
│   └── test/            # Server unit & integration tests (node --test)
├── installer/           # Standalone browser installer (works on static hosts too)
├── recura-data/         # Runtime state & encrypted DB config (git-ignored)
├── public/              # Static assets & logos
├── src/
│   ├── components/        # UI Views & Components
│   │   ├── alerts/        # Renewal alert views
│   │   ├── common/        # Shared components & branding logos
│   │   ├── customers/     # Customer CRM management
│   │   ├── dashboard/     # KPI cards, charts, & stats
│   │   ├── layout/        # Sidebar navigation & Header bar
│   │   ├── orders/        # Order creation & list views
│   │   ├── plans/         # Subscription catalog & inventory
│   │   └── settings/      # User profile, session control, & templates
│   ├── data/              # Initial mock data & defaults
│   ├── types/             # TypeScript type definitions (ERP schema)
│   ├── App.tsx            # Main Application component & navigation logic
│   ├── main.tsx           # Entry point
│   └── index.css          # Tailwind CSS global styles
├── index.html             # HTML entry point
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite bundler configuration
```

---

## 🧪 Development

```bash
npm install
npm run dev           # Front-end dev server on http://localhost:3000
npm run dev:server    # Backend server (API + installer) on port 8787
npm run lint          # TypeScript type-check
npm run test:server   # Server unit & integration tests
npm run build         # Production build
npm start             # Production server (SPA + API + installer)
```

### ⚙️ Environment Variables

| Variable | Used by | Description |
| --- | --- | --- |
| `DATABASE_URL` | server | Postgres connection string; when set, the installer's "database provided by my hosting" option is pre-wired (Docker/Render set this automatically). |
| `RECURA_DATA_DIR` | server | Directory for install state and the encrypted DB config (default: `./recura-data`). |
| `RECURA_CORS_ORIGINS` | server | Comma-separated origins allowed to call the API cross-origin; also switches the CSRF cookie to `SameSite=None; Secure` (requires HTTPS). |
| `VITE_API_URL` | front-end (build-time) | Hosted Recura server URL when the SPA is served separately (e.g. Vercel → Render). Leave empty for same-origin. |
| `PORT` | server | HTTP port (default `8787`). |

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
