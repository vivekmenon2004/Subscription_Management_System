# Brightloop Subscription Platform

Brightloop is a subscription management and recurring invoicing platform built with React and Django REST Framework. It follows the product requirements documented in the PRD and the visual direction in `Design.jpeg`.

## Project status

- The React frontend includes dashboard, subscription, invoice, payment, catalog, reports, and customer portal experiences.
- The Django backend provides API modules for accounts, catalog, plans, quotations, subscriptions, billing, payments, reports, and the customer portal.
- The `/login` and `/register` frontend pages are currently a preview experience. Their credentials are not sent to or stored by the backend; demo role selection opens the frontend workspace.
- The frontend and backend can be run separately. The frontend is not yet wired to authenticate against the Django API.

## Design system

- Primary: `#714B67`; secondary: `#A64D87`; tertiary: `#25232A`; neutral: `#F7F6F8`.
- Inter typography, with tabular figures for financial values.
- Rounded cards, soft shadows, status badges, progress indicators, and a floating navigation pill with a frosted-glass treatment.

## Repository structure

```text
backend/
  apps/                 Django apps for accounts, billing, catalog, plans,
                        payments, portal, quotations, reports, subscriptions
  brightloop/           Django settings and API routing
  manage.py
  requirements.txt
  seed_data.py
frontend/
  src/
    components/         Shared navigation and UI components
    context/            Frontend state and demo role switching
    pages/              Product screens and auth preview
  package.json
  vite.config.js
Design.jpeg             Product design reference
Subscription Management System - PRD.pdf
                        Product requirements document
```

## Getting started

### Backend

Requires Python and pip. From the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment (`.venv\Scripts\Activate.ps1` in PowerShell, or `source .venv/bin/activate` on macOS/Linux), then run:

```bash
pip install -r requirements.txt
python manage.py migrate
python seed_data.py
python manage.py runserver 8000
```

The API is served at `http://127.0.0.1:8000/api/v1/`.

### Frontend

In a separate terminal, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`).

To run the frontend checks:

```bash
npm test
npm run lint
npm run build
```

## Frontend workflows

- Dashboard: subscription and billing overview.
- Subscriptions: browse and explore subscription lifecycle actions.
- Invoices and payments: review invoice and transaction workflows.
- Catalog and plans: browse products and recurring plans.
- Quotations, taxes, and discounts: explore configured examples.
- Reports: review summary and reporting views.
- Customer portal: explore the customer-facing subscription and billing experience.
- Auth preview: responsive sign-in and account creation layouts, password checks, and demo role selection. No credentials are persisted or sent.

## Backend capabilities

The backend is organized into Django apps for account and role management, product catalog, billing plans, quotations, subscription lifecycle, invoice generation, payments, reporting, and customer self-service. Apply migrations and run `seed_data.py` to initialize a local development database with sample data.

## Design reference

The product requirements and visual specifications are in `Subscription Management System - PRD.pdf` and `Design.jpeg`, respectively.
