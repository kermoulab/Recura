# Recura Subscription ERP

Recura Subscription ERP is an enterprise-grade management platform tailored for digital subscription resellers (Netflix, Disney+, Prime Video, Spotify, IPTV, YouTube Premium, and more). It streamlines customer CRM, order fulfillment, stock management, renewal alerts, and automated multi-lingual WhatsApp customer messaging.

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

---

## 💻 Installation (easy, no technical knowledge needed)

Recura installs itself through a friendly wizard. You only need a place to run it and a database — the wizard
walks you through both. Pick the option that fits you:

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

### Option C — Manual (developers)

Prerequisites: **Node.js 18+**, **npm**, and a PostgreSQL 13+ database.

```bash
npm install
npm run build
npm start
```

Open **http://localhost:8787/install** and follow the wizard. You can paste a `postgres://` connection string
from your database provider (Neon, Supabase, Render, …) or fill the fields by hand — the installer tests the
connection and creates everything for you.

> **Hosting the interface separately (e.g. Vercel)?** Deploy the server first (Options A or B), then build the
> front-end with `VITE_API_URL="https://<your-server>"` and set the server's
> `RECURA_CORS_ORIGINS` to your site's address. The `/install` wizard also works on the static host and talks
> to the server over CORS.

After installation, log in with the administrator account you created in the wizard. The installer locks itself
once finished.

---

## 📁 Project Structure

```text
├── public/                # Static assets & logos
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

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
