# Brightloop Subscription Platform

A modern, full-lifecycle Subscription Management and Recurring Invoicing platform built with **React 18 + Vite** and **Python Django 5 + Django REST Framework**, adhering strictly to the **Product Requirements Document (PRD)** and the **`Design.jpeg` Design System**.

---

## 🎨 Design System Implementation (`Design.jpeg` & `ui-skills`)
- **Color Palette**:
  - Primary (`#714B67`): Key action buttons, active navigation, headers.
  - Secondary (`#A64D87`): Accents, progress bars, highlights, quotations.
  - Tertiary / Dark (`#25232A`): Inverted buttons, dark text, dark progress elements.
  - Neutral (`#F7F6F8`): Card surfaces and background canvas.
- **Typography**: Inter (Google Fonts) with `tabular-nums` for precise financial figures.
- **Components**:
  - **Floating Navigation Pill**: Rounded pill with filled circular active state.
  - **4 Button Styles**: Primary (`#714B67`), Secondary (`#EAE8ED`), Inverted (`#25232A`), Outlined (`#D7D4DC`).
  - **Search Field**: Neutral fill with leading magnifier icon.
  - **Status Badges**: Draft (grey), Quotation/Confirmed (purple/amber), Active/Paid (green), Overdue (red with overdue days counter).
  - **Progress Bars**: Usage limits and billing cycle indicators.

---

## 📂 Project Structure

```
Subscription_Management_System/
├── .agents/skills/              # UI engineering skills (baseline-ui, fixing-accessibility, etc.)
├── AGENTS.md                    # Project-level agent instructions
├── Design.jpeg                  # Visual design specification board
├── Subscription Management System - PRD.pdf  # 17-page detailed PRD
│
├── backend/                     # Django 5 REST Framework backend
│   ├── manage.py
│   ├── seed_data.py             # Pre-seeded database script with demo data
│   ├── requirements.txt
│   ├── brightloop/              # Project settings & URL routing (/api/v1/)
│   └── apps/
│       ├── accounts/            # User (email unique), roles (Admin, Staff, Customer), AUTH-2 validation
│       ├── catalog/             # Products, cost vs sales margins, variants (PROD-1)
│       ├── plans/               # Recurring billing plans with behavior flags
│       ├── quotations/          # Quotation templates & auto-expiry generator
│       ├── subscriptions/       # Subscriptions, lines, 5-stage state machine & audit log
│       ├── billing/             # Taxes, discounts with limits, invoice generator (idempotent, Decimal math)
│       ├── payments/            # Multi-method payments (UPI, wire, card), partials, auto-paid, void
│       ├── reports/             # 5 KPI cards (MRR, active, overdue), revenue charts, month-end CSV
│       └── portal/              # Customer self-service portal endpoints (strictly customer-scoped)
│
└── frontend/                    # React 18 + Vite + Tailwind CSS frontend
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── context/DataContext.jsx  # Real-time state & API integration with role switching
        ├── components/          # Button, PillNav, Navbar, SearchField, StatusBadge, Modals
        └── pages/               # Dashboard, Subscriptions, Invoices, Payments, Catalog, Portal, Reports
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup & Run

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations (already generated)
python manage.py migrate

# Seed database with sample data
python seed_data.py

# Start Django development server
python manage.py runserver 8000
```

The Django REST API will run at `http://127.0.0.1:8000/api/v1/`.

### 2. Frontend Setup & Run

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies (already installed)
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔑 Demo User Accounts (Pre-seeded)

All accounts use the **AUTH-2** compliant password: `Password123!`

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.io` | `Password123!` | Full access: manage staff, catalog, plans, discounts, void payments |
| **Staff** | `staff@brightloop.io` | `Password123!` | Manage customers, quotes, subscriptions, generate & confirm invoices, record payments |
| **Customer** | `customer@acmecorp.com` | `Password123!` | Self-service portal: view own subscriptions, download invoice PDFs, pay balance, self-service pause/renew/close |

You can switch roles directly using the quick-toggle in the top right corner of the navigation bar.

---

## 🛠️ PRD Features & Business Rules Tested
- **INV-1 & INV-2**: Daily recurring invoice generation job; unique constraint `(subscription, period_start, period_end)` prevents double billing.
- **TAX-3 & DISC-3**: Accurate Decimal arithmetic; discounts auto-applied with usage limit counters; taxes calculated on discounted amount.
- **PAY-2 & PAY-3**: Partial payments supported; invoice moves automatically to `Paid` once balance reaches ₹0.
- **SUB-1 & 6.1**: Full lifecycle state machine (`Draft` → `Quotation` → `Confirmed` → `Active` → `Closed` / `Paused`).
- **AUTH-2**: Live 4-point password complexity validator (9+ characters, uppercase, lowercase, special character).
- **PORT-1 to PORT-4**: Customer-scoped self-service portal with profile editing and printable invoice receipts.
