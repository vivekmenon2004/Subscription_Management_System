# Brightloop Subscription Platform

Brightloop is a subscription-management platform concept for managing recurring plans, subscriptions, invoices, payments, and customer self-service in one place. This repository currently contains the React frontend prototype; the accompanying product requirements document describes the intended full-stack product.

> **Project status:** The frontend demonstrates the main workflows using seeded, in-memory data. A production backend, persistent database, authentication flow, scheduled billing jobs, and payment gateway are not included in this repository. Demo role selection is for exploring the UI and is not an authorization or security boundary.

## Contents

- [Product goals](#product-goals)
- [What is in this repository](#what-is-in-this-repository)
- [Frontend demo](#frontend-demo)
- [Technology](#technology)
- [Getting started](#getting-started)
- [Demo roles and data](#demo-roles-and-data)
- [Product scope from the PRD](#product-scope-from-the-prd)
- [Planned architecture](#planned-architecture)
- [Current limitations](#current-limitations)
- [Requirements document](#requirements-document)

## Product goals

Brightloop is intended to replace spreadsheet-based subscription tracking and manual billing with a single workflow to:

- Maintain products, variants, recurring plans, taxes, and discount rules.
- Convert quotation templates into customer subscriptions.
- Track subscription status, renewals, pauses, and closures.
- Generate accurate recurring invoices and track partial or complete payments.
- Give customers a portal for their own subscriptions, invoices, and payment history.
- Give finance teams a view of recurring revenue, collections, outstanding balances, and overdue invoices.

The PRD targets reliable, duplicate-safe billing and accurate financial calculations, with a responsive and accessible interface.

## What is in this repository

```text
.
├── README.md
├── Subscription Management System - PRD.pdf
└── frontend/
    ├── package.json
    └── src/
        ├── components/     # Shared navigation, buttons, forms, and modals
        ├── context/        # Seeded demo data and client-side actions
        ├── pages/          # Dashboard and business workflows
        └── services/       # API request helper
```

The backend and deployment services described in the PRD have not yet been added.

## Frontend demo

The current React app includes these screens and workflows:

- **Dashboard:** Subscription and billing overview, with a demo billing-generation action.
- **Subscriptions:** Browse subscriptions and explore pause, resume, renew, and close actions.
- **Invoices:** Review, confirm, cancel, and print invoices, and start payment recording.
- **Payments:** Review payment transactions and explore payment voiding.
- **Catalog & plans:** Review products and recurring plans.
- **Quotation templates:** View templates and create a quotation in the demo workflow.
- **Taxes & discounts:** Review configured tax and discount examples.
- **Reports:** Explore financial summaries and reporting views.
- **Customer portal:** Switch to a customer view of subscription, invoice, and payment information.

An in-app role switcher lets you explore the admin, staff, and customer experiences. The UI is built around Brightloop's plum-toned design system, with a floating icon navigation bar.

## Technology

### Implemented frontend

- React 18
- Vite 5
- Tailwind CSS 3
- Lucide React icons

### Intended full-stack technology in the PRD

The product requirements document proposes React with a Django REST Framework API, PostgreSQL, Celery and Redis for scheduled jobs, and Docker Compose for deployment. These backend and infrastructure components are not part of the current codebase.

## Getting started

### Prerequisites

- Node.js 18 or later
- npm

### Install and run

```bash
cd frontend
npm install
npm run dev
```

Vite prints the local development URL after startup.

### Build for production

```bash
cd frontend
npm run build
npm run preview
```

The production bundle is generated in `frontend/dist/`.

## Demo roles and data

Use the role switcher in the top navigation to explore the demo as an admin, staff member, or customer. The seeded example data is defined in `frontend/src/context/DataContext.jsx`.

Demo data and actions live in React context and are held in memory. They are not saved to a database and normally reset when the page is reloaded. Switching demo roles only changes the UI context; it does not authenticate a user or enforce backend permissions.

## Product scope from the PRD

The PRD describes the target behavior for the full product. This is planned product scope, not a claim that every item is implemented in the current frontend:

### Accounts and permissions

- Customer registration, sign-in, password reset, and profile management.
- Admin, staff, and customer roles with role-specific access.
- Server-enforced permissions and customer-level data scoping.

### Catalogue and quotations

- Products with variants, sales and cost prices, and default taxes.
- Daily, weekly, monthly, and yearly plans with availability and lifecycle rules.
- Admin-managed quotation templates that can be turned into editable quotations.
- Taxes and scoped fixed-amount or percentage discounts.

### Subscription lifecycle and billing

- Draft, quotation, confirmed, active, and closed subscription stages.
- Plan-controlled pause, close, renewal, and expiry behavior.
- Scheduled invoice generation with a uniqueness constraint per subscription and billing period.
- Invoice snapshots, tax breakdowns, payment terms, and sequential invoice numbering.
- Decimal-based financial calculations with documented rounding.

### Payments, portal, and reporting

- Manual payment recording, including partial payments and payment reversal.
- Overdue invoice tracking and reminder jobs.
- A customer portal limited to the signed-in customer's own records.
- Dashboard and report views for recurring revenue, collections, outstanding balances, and overdue invoices.

### Version 1 exclusions in the PRD

- Live payment collection through a card, UPI, or other payment gateway.
- Multi-currency, multi-company, and multi-language support.
- Native mobile applications.
- Dunning automation beyond overdue tracking and reminder emails.

## Planned architecture

The PRD proposes a single-page React application communicating with a versioned JSON API under `/api/v1/`. The backend is planned to use Django REST Framework, PostgreSQL, and Celery workers with Redis for scheduled billing and expiry tasks. Invoice PDF generation, email delivery, and Docker Compose deployment are also part of the proposed architecture.

The frontend includes an API request helper configured for a local development API at `http://127.0.0.1:8000/api/v1`; the current screens are driven by seeded client-side demo data. No backend server is included here.

## Current limitations

- No backend, database, migrations, or persistent storage.
- No production authentication, authorization, or customer data isolation.
- Billing and payment actions are UI demonstrations, not financial transactions.
- No scheduled jobs, email delivery, invoice PDF service, or payment gateway integration.
- No automated test command is currently defined in the frontend package scripts.

Do not use the demo to process real customer, invoice, or payment data.

## Requirements document

See the [Brightloop Product Requirements Document](./Subscription%20Management%20System%20-%20PRD.pdf) for detailed roles and permissions, functional requirements, data model, API outline, acceptance criteria, design tokens, and delivery plan.
