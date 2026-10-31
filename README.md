# Brightloop Subscription Platform

Brightloop is a subscription management and recurring invoicing platform built with React and Django REST Framework. It follows the product requirements documented in the PRD and the visual direction in `Design.jpeg`.

## Project status

- The React frontend includes dashboard, subscription, invoice, payment, catalog, reports, and customer portal experiences.
- The Django backend provides API modules for accounts, catalog, plans, quotations, subscriptions, billing, payments, reports, and the customer portal.
- `/login` and `/register` use the Django API for account creation and JWT sign-in. Seeded demo role chips remain a separate mock-data preview.
- The frontend and backend run separately; set the frontend API URL and backend CORS origin to match your local addresses.

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
Copy-Item .env.example .env
```

Replace `DJANGO_SECRET_KEY` with a fresh random value (for example, generate one with `python -c "import secrets; print(secrets.token_urlsafe(50))"`). Never use a development key in production. Then:

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

For production, set `DJANGO_DEBUG=False`, a unique secret key, the deployed hostnames in `DJANGO_ALLOWED_HOSTS`, and the frontend origin(s) in `CORS_ALLOWED_ORIGINS`. HTTPS redirects, secure cookies, and one-year HSTS are enabled when debug is off. Enable `DJANGO_HSTS_INCLUDE_SUBDOMAINS` or `DJANGO_HSTS_PRELOAD` only after confirming every affected hostname is HTTPS-only.

### Frontend

In a separate terminal, from the repository root:

```bash
cd frontend
Copy-Item .env.example .env
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
- Authentication: account registration and email/password sign-in return JWT access and refresh tokens. Access tokens are refreshed automatically; refresh tokens rotate and are blacklisted at logout. “Remember me” stores tokens persistently; otherwise they last for the browser session.
- Demo role chips enter a separate seeded mock workspace and do not authenticate with the API.

## Backend capabilities

The backend is organized into Django apps for account and role management, product catalog, billing plans, quotations, subscription lifecycle, invoice generation, payments, reporting, and customer self-service. Apply migrations and run `seed_data.py` to initialize a local development database with sample data.

JWT endpoints are under `/api/v1/auth/`: `register`, `login`, `refresh`, `logout`, and authenticated `me`. Registration creates customer accounts; staff and admin accounts must be provisioned by an administrator. Access tokens expire after 15 minutes; rotating refresh tokens expire after 7 days and are blacklisted when rotated or logged out. Password reset is not exposed until a real email-backed reset flow is configured.

## Design reference

The product requirements and visual specifications are in `Subscription Management System - PRD.pdf` and `Design.jpeg`, respectively.
