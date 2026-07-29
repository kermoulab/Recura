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

## 💻 Local Installation & Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher (or `yarn` / `pnpm`)

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/recura-subscription-erp.git
   cd recura-subscription-erp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   Open your browser and navigate to `http://localhost:3000`.

---

## 📦 Production Build & Live Deployment

### Building for Production
To generate optimized production assets:
```bash
npm run build
```
The compiled static assets will be located in the `dist/` directory.

### Preview Production Build Locally
```bash
npm run preview
```

### Deploying Live
The application produces a standard single-page application (SPA) output in `dist/`. You can deploy it to any modern web hosting service or CDN platform:
- **Vercel / Netlify**: Connect your Git repository and set build command to `npm run build` with output directory `dist`.
- **Cloud Run / Docker**: Serve the `dist/` folder using Nginx, Caddy, or Node.js static server.
- **S3 / Cloudfront / Firebase Hosting**: Upload the contents of `dist/` directly.

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
│   │   ├── logs/          # Audit logging table
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
