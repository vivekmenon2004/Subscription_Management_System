import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, FileText, LogOut, User, ArrowLeft,
  CheckCircle, AlertCircle, Clock, RefreshCw, Shield, Sparkles,
  ExternalLink, Download, ChevronDown, ChevronUp, AlertTriangle,
  HelpCircle, Building2, Calendar, DollarSign, Layers, Check,
  Printer, X, Info
} from 'lucide-react';
import { useData } from '../context/DataContext';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function fmt(val, currency = true) {
  if (val === null || val === undefined || isNaN(val)) return currency ? '₹0.00' : '0';
  const num = typeof val === 'number' ? val : parseFloat(val);
  const formatted = num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `₹${formatted}` : formatted;
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(d);
  }
}

function StatusPill({ status, isOverdue = false, isPaused = false }) {
  if (isPaused) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Paused
      </span>
    );
  }
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Payment Overdue
      </span>
    );
  }

  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'paid' || s === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {status.toUpperCase()}
      </span>
    );
  }
  if (s === 'expired' || s === 'closed' || s === 'void') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        {status.toUpperCase()}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
      {(status || 'CONFIRMED').toUpperCase()}
    </span>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E8E6EB] shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-[#FAF9FB] border border-[#E8E6EB] flex items-center justify-center text-[#714B67] shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-bold text-[#1C1B23] text-base leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-[#8C8895] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false, accent = false }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[#F7F6F8] last:border-0 text-sm">
      <span className="text-[#6E6B75] text-xs font-medium">{label}</span>
      <span className={`font-semibold text-right ${mono ? 'font-mono text-xs' : ''} ${accent ? 'text-[#714B67]' : 'text-[#1C1B23]'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="h-28 bg-[#EAE8ED] rounded-2xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="h-44 bg-[#EAE8ED] rounded-2xl" />
        <div className="h-44 bg-[#EAE8ED] rounded-2xl" />
        <div className="h-44 bg-[#EAE8ED] rounded-2xl" />
      </div>
      <div className="h-64 bg-[#EAE8ED] rounded-2xl w-full" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Offline Demo Fallback Generator
// ──────────────────────────────────────────────────────────────────────────────
function buildOfflineData(searchParams, products = [], subscriptions = [], invoices = [], payments = []) {
  const prodId = searchParams.get('product_id');
  const subId = searchParams.get('subscription_id');

  const prod = products.find(p => String(p.id) === String(prodId)) || products[0] || {
    id: 1,
    name: 'Brightloop Analytics Suite',
    type: 'saas',
    description: 'Enterprise subscription analytics, customer telemetry, and revenue monitoring platform.',
    entitlements: { features: ['Full Telemetry', 'Revenue Forecasting', 'Automated Invoicing', 'API Integrations'], tier: 'Enterprise', max_users: 25 }
  };

  const sub = subscriptions.find(s => String(s.id) === String(subId)) || subscriptions[0] || {
    id: 1,
    number: 'SUB-2026-DEMO-01',
    status: 'active',
    is_paused: false,
    start_date: '2026-01-01',
    expiry_date: '2026-12-31',
    next_billing_date: '2026-11-01',
    payment_terms: 'Immediate Payment',
    total_recurring_amount: '4999.00',
    plan_name: 'Enterprise Annual'
  };

  const plan = {
    id: 1,
    name: sub.plan_name || 'Enterprise Annual',
    price: sub.total_recurring_amount || '4999.00',
    billing_period: 'Yearly',
    closable: true,
    pausable: true,
    renewable: true,
    entitlements: { features: ['Real-time telemetry', 'Unlimited data retention', 'Priority 24/7 SLA', 'Custom webhooks'], tier: 'Enterprise', max_users: 20 }
  };

  const subInvoices = invoices.filter(i => String(i.subscription_id || i.subscription) === String(sub.id));
  const subPayments = payments.filter(p => subInvoices.some(inv => inv.id === p.invoice || inv.number === p.invoice_number));

  return {
    subDetails: {
      customer: {
        id: 999,
        name: 'Demo Customer Account',
        email: 'customer@brightloop.io',
        company: 'Acme Corporation'
      },
      product: prod,
      subscription: {
        ...sub,
        lines: [
          {
            product_id: prod.id,
            product_name: prod.name,
            variant: 'Pro Tier',
            quantity: 1,
            unit_price: sub.total_recurring_amount || '4999.00',
            tax_name: 'GST 18%',
            tax_rate: '18.00',
            amount: sub.total_recurring_amount || '4999.00'
          }
        ]
      },
      plan,
      entitlements: {
        plan_name: plan.name,
        tier: 'Enterprise',
        features: ['Real-time telemetry', 'Custom webhooks', 'API access', 'Automated reconciliation'],
        max_users: 20,
        api_access: true,
        custom_branding: true
      },
      session: {
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        product_id: prod.id
      }
    },
    payHistory: {
      summary: {
        total_paid: subPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 4999).toFixed(2),
        payment_count: subPayments.length || 1,
        latest_payment: subPayments[0] || {
          id: 101,
          invoice_number: subInvoices[0]?.number || 'INV-2026-001',
          method: 'credit_card',
          method_display: 'Credit Card',
          amount: '4999.00',
          payment_date: '2026-01-01',
          note: 'Online Gateway Payment - Ref TXN-78902',
          transaction_ref: 'TXN-78902'
        }
      },
      payments: subPayments.length > 0 ? subPayments : [
        {
          id: 101,
          invoice_number: 'INV-2026-001',
          method: 'credit_card',
          method_display: 'Credit Card',
          amount: '4999.00',
          payment_date: '2026-01-01',
          note: 'Online Gateway Payment - Ref TXN-78902',
          transaction_ref: 'TXN-78902'
        }
      ]
    },
    invoiceData: {
      subscription_number: sub.number,
      invoice_count: subInvoices.length || 1,
      invoices: subInvoices.length > 0 ? subInvoices : [
        {
          id: 201,
          number: 'INV-2026-001',
          status: 'paid',
          period_start: '2026-01-01',
          period_end: '2026-12-31',
          issue_date: '2026-01-01',
          due_date: '2026-01-15',
          subtotal: '4999.00',
          tax_total: '899.82',
          discount_total: '0.00',
          total: '5898.82',
          amount_paid: '5898.82',
          outstanding_balance: '0.00',
          is_overdue: false,
          days_overdue: 0,
          lines: [
            {
              product_name: prod.name,
              quantity: 1,
              unit_price: '4999.00',
              discount: '0.00',
              tax_rate: '18.00',
              tax_amount: '899.82',
              amount: '4999.00'
            }
          ]
        }
      ]
    }
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Top Navigation Header
// ──────────────────────────────────────────────────────────────────────────────
function DemoHeader({ customer, product, subscription, onLogout, onReturnToPortal, onOpenSupport }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E6EB] px-4 lg:px-8 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & Product Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#714B67] to-[#512D49] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            BL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#1C1B23] tracking-tight text-base">Brightloop</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                <Sparkles className="w-3 h-3 text-purple-600" />
                Demo Interface
              </span>
            </div>
            <p className="text-xs text-[#8C8895] flex items-center gap-1.5 mt-0.5">
              <span>Product:</span>
              <strong className="text-[#714B67] font-semibold">{product?.name || 'Subscribed Product'}</strong>
            </p>
          </div>
        </div>

        {/* Right: Customer Profile, Subscription Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Subscription Status Pill */}
          {subscription && (
            <div className="hidden sm:block">
              <StatusPill status={subscription.status} isPaused={subscription.is_paused} />
            </div>
          )}

          {/* Customer Badge */}
          {customer && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#FAF9FB] border border-[#E8E6EB]">
              <div className="w-8 h-8 rounded-full bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold text-xs uppercase">
                {customer.name ? customer.name.slice(0, 2) : <User className="w-4 h-4" />}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-[#1C1B23] leading-tight">{customer.name || 'Customer'}</p>
                <p className="text-[10px] text-[#8C8895]">{customer.company || customer.email || 'Subscribed Client'}</p>
              </div>
            </div>
          )}

          {/* Support Button */}
          <button
            onClick={onOpenSupport}
            className="p-2 rounded-xl border border-[#E8E6EB] hover:bg-[#FAF9FB] text-[#6E6B75] hover:text-[#1C1B23] transition-colors"
            title="Help & Support"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Return to Portal Button */}
          <button
            onClick={onReturnToPortal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#714B67] text-[#714B67] hover:bg-[#714B67]/5 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customer Portal</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl border border-[#E8E6EB] hover:bg-red-50 hover:text-red-600 text-[#8C8895] transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Welcome Banner
// ──────────────────────────────────────────────────────────────────────────────
function WelcomeBanner({ customer, product, plan, subscription }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#714B67] via-[#5C3953] to-[#3B2235] text-white p-6 sm:p-8 shadow-md">
      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm text-purple-200 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            Live Demonstration Sandbox
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {customer?.name || 'Valued Customer'}!
          </h1>
          <p className="text-sm text-purple-100/90 leading-relaxed">
            You are viewing your official demonstration dashboard for <strong className="text-white font-semibold">{product?.name}</strong>.
            This demonstration is dynamically wired to your actual live subscription data, current plan terms, billing dates, and invoices.
          </p>
          {product?.description && (
            <p className="text-xs text-purple-200/80 italic pt-1">
              "{product.description}"
            </p>
          )}
        </div>

        {/* Plan & Subscription Badge Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[240px] shrink-0 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-purple-200">Active Plan</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              {subscription?.status || 'Active'}
            </span>
          </div>
          <p className="text-lg font-extrabold">{plan?.name || 'Custom Plan'}</p>
          <p className="text-xs text-purple-200">
            <span className="text-base font-bold text-white">{fmt(plan?.price)}</span> / {plan?.billing_period || 'month'}
          </p>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-purple-200">
            <span>Sub ID:</span>
            <span className="font-mono font-bold text-white">#{subscription?.number}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Overview Section
// ──────────────────────────────────────────────────────────────────────────────
function OverviewSection({ subDetails, onViewInvoices, onViewPlan }) {
  const { customer, product, subscription, plan, entitlements } = subDetails || {};

  return (
    <div className="space-y-6">
      {/* Paused Warning if applicable */}
      {subscription?.is_paused && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Subscription Is Currently Paused</h4>
            <p className="text-xs text-amber-700 mt-1">
              Your subscription #{subscription.number} is temporarily paused. Access to product services may be throttled until resumed in your customer portal.
            </p>
          </div>
        </div>
      )}

      {/* Grid: 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Subscription Overview */}
        <Card className="p-6">
          <SectionHeader icon={Layers} title="Subscription Overview" subtitle="Core contract metadata" />
          <div className="space-y-1">
            <InfoRow label="Subscription #" value={subscription?.number} mono accent />
            <InfoRow label="Product Name" value={product?.name} />
            <InfoRow label="Plan Level" value={plan?.name} />
            <InfoRow label="Status" value={<StatusPill status={subscription?.status} isPaused={subscription?.is_paused} />} />
            <InfoRow label="Start Date" value={fmtDate(subscription?.start_date)} />
            <InfoRow label="Expiry Date" value={fmtDate(subscription?.expiry_date)} />
            <InfoRow label="Next Billing" value={fmtDate(subscription?.next_billing_date)} />
            <InfoRow label="Billing Frequency" value={plan?.billing_period || 'Monthly'} />
            <InfoRow label="Recurring Amount" value={fmt(subscription?.total_recurring_amount)} accent />
          </div>
        </Card>

        {/* Card 2: Entitlements & Features */}
        <Card className="p-6">
          <SectionHeader icon={Shield} title="Features & Entitlements" subtitle="Allocated capabilities" />
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F7F6F8]">
              <span className="text-xs font-medium text-[#6E6B75]">Entitlement Tier</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800">
                {entitlements?.tier || 'Standard Tier'}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#1C1B23] block">Included Features:</span>
              <div className="space-y-1.5">
                {(entitlements?.features && entitlements.features.length > 0) ? (
                  entitlements.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#4A4754]">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#8C8895] italic">Standard product features active.</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#F7F6F8] space-y-1">
              <InfoRow label="Max Allocated Users" value={`${entitlements?.max_users || 5} Seats`} />
              <InfoRow label="API Access" value={entitlements?.api_access ? 'Enabled' : 'Disabled'} />
              <InfoRow label="Custom Branding" value={entitlements?.custom_branding ? 'Enabled' : 'Disabled'} />
            </div>

            <button
              onClick={onViewPlan}
              className="w-full mt-2 py-2 rounded-xl bg-[#FAF9FB] hover:bg-[#F0EDF3] border border-[#E8E6EB] text-xs font-semibold text-[#714B67] transition-colors"
            >
              View Full Plan Details
            </button>
          </div>
        </Card>

        {/* Card 3: Account & Handshake Details */}
        <Card className="p-6">
          <SectionHeader icon={Building2} title="Customer Information" subtitle="Authenticated subscriber" />
          <div className="space-y-1">
            <InfoRow label="Customer Name" value={customer?.name} />
            <InfoRow label="Email" value={customer?.email} />
            <InfoRow label="Company / Entity" value={customer?.company || 'Personal Account'} />
            <InfoRow label="Payment Terms" value={subscription?.payment_terms || 'Due on Receipt'} />
            <InfoRow label="Launch Handshake" value="Authenticated Token" accent />
            <InfoRow label="Handshake Protocol" value="Secure Short-Lived TTL" />
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-purple-50 border border-purple-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Demonstration Mode Note</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-normal">
              This demo product website showcases how Brightloop hands off authenticated sessions to external SaaS applications.
            </p>
          </div>

          <button
            onClick={onViewInvoices}
            className="w-full mt-4 py-2.5 rounded-xl bg-[#714B67] hover:bg-[#5C3953] text-white text-xs font-semibold transition-colors shadow-xs"
          >
            Review Invoices & Payments
          </button>
        </Card>
      </div>

      {/* Subscription Line Items */}
      {subscription?.lines && subscription.lines.length > 0 && (
        <Card className="p-6">
          <SectionHeader icon={Layers} title="Subscription Order Lines" subtitle="Billed services in this subscription" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FB] border-b border-[#E8E6EB] text-[#6E6B75]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Service / Product</th>
                  <th className="py-2.5 px-3 font-semibold">Variant</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Quantity</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Unit Price</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Tax Rate</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Recurring Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F6F8]">
                {subscription.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9FB]">
                    <td className="py-3 px-3 font-medium text-[#1C1B23]">{line.product_name}</td>
                    <td className="py-3 px-3 text-[#6E6B75]">{line.variant || 'Default'}</td>
                    <td className="py-3 px-3 text-right tabular-nums">{line.quantity}</td>
                    <td className="py-3 px-3 text-right tabular-nums">{fmt(line.unit_price)}</td>
                    <td className="py-3 px-3 text-right tabular-nums">{line.tax_name || `${line.tax_rate}%`}</td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums text-[#714B67]">{fmt(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Plan & Entitlements Section
// ──────────────────────────────────────────────────────────────────────────────
function PlanSection({ subDetails }) {
  const { plan, entitlements, product, subscription } = subDetails || {};

  return (
    <div className="space-y-6">
      {/* Plan Pricing & Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1 bg-gradient-to-b from-white to-[#FAF9FB]">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-[#714B67]">
            Active Subscription Plan
          </span>
          <h3 className="text-2xl font-black text-[#1C1B23] mt-3">{plan?.name || 'Standard Plan'}</h3>
          <p className="text-xs text-[#8C8895] mt-1">{product?.name}</p>

          <div className="my-5 pt-4 border-t border-[#E8E6EB]">
            <p className="text-xs text-[#6E6B75]">Recurring Price</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-[#714B67]">{fmt(plan?.price)}</span>
              <span className="text-xs text-[#6E6B75]">/ {plan?.billing_period || 'Period'}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <InfoRow label="Billing Cycle" value={plan?.billing_period || 'Monthly'} />
            <InfoRow label="Pausable" value={plan?.pausable ? 'Yes' : 'No'} />
            <InfoRow label="Closable" value={plan?.closable ? 'Yes' : 'No'} />
            <InfoRow label="Auto-Renewable" value={plan?.renewable ? 'Yes' : 'No'} />
          </div>
        </Card>

        {/* Detailed Entitlements breakdown */}
        <Card className="p-6 md:col-span-2">
          <SectionHeader icon={Shield} title="Entitlements & Included Limits" subtitle="Real-time capability provisioning" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#E8E6EB]">
              <p className="text-xs text-[#8C8895]">Entitlement Tier</p>
              <p className="text-lg font-bold text-[#1C1B23] mt-0.5">{entitlements?.tier || 'Professional'}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#E8E6EB]">
              <p className="text-xs text-[#8C8895]">User Seats</p>
              <p className="text-lg font-bold text-[#1C1B23] mt-0.5">{entitlements?.max_users || 5} Active Users</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#E8E6EB]">
              <p className="text-xs text-[#8C8895]">API Rate Limits & Access</p>
              <p className="text-lg font-bold text-[#1C1B23] mt-0.5">{entitlements?.api_access ? 'Full REST Access' : 'Restricted'}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#E8E6EB]">
              <p className="text-xs text-[#8C8895]">Custom Branding</p>
              <p className="text-lg font-bold text-[#1C1B23] mt-0.5">{entitlements?.custom_branding ? 'Whitelabel Enabled' : 'Standard BL'}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <h4 className="text-xs font-bold text-[#1C1B23] uppercase tracking-wider">Features Included in Plan</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(entitlements?.features || []).map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF9FB] border border-[#F0EDF3] text-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="font-medium text-[#2A2832]">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Payments History Section
// ──────────────────────────────────────────────────────────────────────────────
function PaymentsSection({ payHistory }) {
  const { summary, payments = [] } = payHistory || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5">
          <p className="text-xs font-medium text-[#8C8895]">Total Paid to Date</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
            {fmt(summary?.total_paid)}
          </p>
          <p className="text-[11px] text-[#8C8895] mt-1">{summary?.payment_count || 0} transaction(s) recorded</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-[#8C8895]">Latest Payment</p>
          <p className="text-2xl font-extrabold text-[#1C1B23] mt-1 tabular-nums">
            {summary?.latest_payment ? fmt(summary.latest_payment.amount) : '₹0.00'}
          </p>
          <p className="text-[11px] text-[#8C8895] mt-1">
            {summary?.latest_payment ? fmtDate(summary.latest_payment.payment_date) : 'No transactions'}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-[#8C8895]">Payment Method</p>
          <p className="text-2xl font-extrabold text-[#714B67] mt-1">
            {summary?.latest_payment?.method_display || 'Direct / Gateway'}
          </p>
          <p className="text-[11px] text-[#8C8895] mt-1">
            Ref: {summary?.latest_payment?.transaction_ref || 'Verified BL Record'}
          </p>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card className="p-6">
        <SectionHeader icon={CreditCard} title="Payment Records" subtitle="All settlement transactions for this subscription" />

        {payments.length === 0 ? (
          <div className="p-12 text-center text-[#8C8895]">
            <CreditCard className="w-10 h-10 mx-auto text-[#D4C8D0] mb-2" />
            <p className="text-sm font-semibold">No payment records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FB] border-b border-[#E8E6EB] text-[#6E6B75]">
                <tr>
                  <th className="py-3 px-3 font-semibold">Date</th>
                  <th className="py-3 px-3 font-semibold">Invoice #</th>
                  <th className="py-3 px-3 font-semibold">Payment Method</th>
                  <th className="py-3 px-3 font-semibold">Transaction Reference</th>
                  <th className="py-3 px-3 font-semibold">Recorded By</th>
                  <th className="py-3 px-3 font-semibold text-right">Amount</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F6F8]">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAF9FB]">
                    <td className="py-3 px-3 font-medium text-[#1C1B23]">{fmtDate(p.payment_date)}</td>
                    <td className="py-3 px-3 font-mono text-[#714B67] font-semibold">{p.invoice_number}</td>
                    <td className="py-3 px-3 text-[#4A4754]">{p.method_display || p.method}</td>
                    <td className="py-3 px-3 text-[#6E6B75] font-mono text-[11px]">{p.transaction_ref || p.note || '—'}</td>
                    <td className="py-3 px-3 text-[#6E6B75]">{p.recorded_by || 'Payment Gateway'}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 tabular-nums">{fmt(p.amount)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.is_void ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        {p.is_void ? 'Void' : 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Invoices Section
// ──────────────────────────────────────────────────────────────────────────────
function InvoicesSection({ invoiceData, onSelectInvoice }) {
  const { invoices = [], invoice_count = 0 } = invoiceData || {};
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader
          icon={FileText}
          title="Invoices & Statements"
          subtitle={`${invoice_count} statement(s) linked to this customer subscription`}
        />

        {invoices.length === 0 ? (
          <div className="p-12 text-center text-[#8C8895]">
            <FileText className="w-10 h-10 mx-auto text-[#D4C8D0] mb-2" />
            <p className="text-sm font-semibold">No invoices available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map(inv => (
              <div key={inv.id} className="rounded-2xl border border-[#E8E6EB] overflow-hidden">
                {/* Header Row */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white hover:bg-[#FAF9FB] cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#714B67] flex items-center justify-center font-bold text-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold font-mono text-[#714B67]">{inv.number}</p>
                      <p className="text-xs text-[#8C8895]">
                        Issue: {fmtDate(inv.issue_date)} • Due: {fmtDate(inv.due_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatusPill status={inv.status} isOverdue={inv.is_overdue} />
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1C1B23] tabular-nums">{fmt(inv.total)}</p>
                      {parseFloat(inv.outstanding_balance) > 0 && (
                        <p className="text-[10px] text-red-600 font-bold">Due: {fmt(inv.outstanding_balance)}</p>
                      )}
                    </div>
                    {expandedId === inv.id ? (
                      <ChevronUp className="w-4 h-4 text-[#8C8895]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#8C8895]" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === inv.id && (
                  <div className="p-5 bg-[#FAF9FB] border-t border-[#E8E6EB] space-y-4">
                    {/* Period & Terms */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[#8C8895] block">Service Period</span>
                        <span className="font-semibold text-[#1C1B23]">
                          {fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8C8895] block">Issue Date</span>
                        <span className="font-semibold text-[#1C1B23]">{fmtDate(inv.issue_date)}</span>
                      </div>
                      <div>
                        <span className="text-[#8C8895] block">Due Date</span>
                        <span className={`font-semibold ${inv.is_overdue ? 'text-red-600' : 'text-[#1C1B23]'}`}>
                          {fmtDate(inv.due_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8C8895] block">Amount Paid</span>
                        <span className="font-semibold text-emerald-600">{fmt(inv.amount_paid)}</span>
                      </div>
                    </div>

                    {/* Line Items */}
                    {inv.lines && inv.lines.length > 0 && (
                      <div className="rounded-xl border border-[#E8E6EB] overflow-hidden bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#F7F6F8] border-b border-[#E8E6EB] text-[#6E6B75]">
                            <tr>
                              <th className="py-2 px-3 font-semibold">Item</th>
                              <th className="py-2 px-3 font-semibold text-right">Qty</th>
                              <th className="py-2 px-3 font-semibold text-right">Price</th>
                              <th className="py-2 px-3 font-semibold text-right">Tax</th>
                              <th className="py-2 px-3 font-semibold text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F7F6F8]">
                            {inv.lines.map((ln, idx) => (
                              <tr key={idx}>
                                <td className="py-2 px-3 font-medium text-[#1C1B23]">{ln.product_name}</td>
                                <td className="py-2 px-3 text-right tabular-nums">{ln.quantity}</td>
                                <td className="py-2 px-3 text-right tabular-nums">{fmt(ln.unit_price)}</td>
                                <td className="py-2 px-3 text-right tabular-nums text-[#8C8895]">
                                  {fmt(ln.tax_amount)} ({ln.tax_rate}%)
                                </td>
                                <td className="py-2 px-3 text-right font-bold tabular-nums text-[#1C1B23]">
                                  {fmt(ln.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Invoice Footer Actions & Balance */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => onSelectInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8E6EB] hover:bg-[#FAF9FB] text-xs font-semibold text-[#714B67] transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print / View Full Receipt
                      </button>

                      <div className="text-right text-xs space-y-0.5">
                        <p className="text-[#6E6B75]">
                          Subtotal: <span className="tabular-nums font-semibold">{fmt(inv.subtotal)}</span> | Tax: <span className="tabular-nums font-semibold">{fmt(inv.tax_total)}</span>
                        </p>
                        <p className="text-sm font-bold text-[#1C1B23]">
                          Total: <span className="text-[#714B67] tabular-nums">{fmt(inv.total)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Invoice Detail Modal
// ──────────────────────────────────────────────────────────────────────────────
function InvoiceDetailModal({ invoice, onClose }) {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#E8E6EB] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#714B67] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1C1B23]">Invoice #{invoice.number}</h3>
              <p className="text-xs text-[#8C8895]">Official Statement Receipt</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#FAF9FB] text-[#8C8895]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-[#8C8895]">Status</p>
            <StatusPill status={invoice.status} isOverdue={invoice.is_overdue} />
          </div>
          <div>
            <p className="text-[#8C8895]">Issue Date</p>
            <p className="font-semibold text-[#1C1B23]">{fmtDate(invoice.issue_date)}</p>
          </div>
          <div>
            <p className="text-[#8C8895]">Due Date</p>
            <p className="font-semibold text-[#1C1B23]">{fmtDate(invoice.due_date)}</p>
          </div>
          <div>
            <p className="text-[#8C8895]">Service Period</p>
            <p className="font-semibold text-[#1C1B23]">{fmtDate(invoice.period_start)} – {fmtDate(invoice.period_end)}</p>
          </div>
        </div>

        {/* Lines */}
        <div className="rounded-xl border border-[#E8E6EB] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FB] border-b border-[#E8E6EB]">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-[#6E6B75]">Product</th>
                <th className="py-2.5 px-3 text-right font-semibold text-[#6E6B75]">Qty</th>
                <th className="py-2.5 px-3 text-right font-semibold text-[#6E6B75]">Price</th>
                <th className="py-2.5 px-3 text-right font-semibold text-[#6E6B75]">Tax</th>
                <th className="py-2.5 px-3 text-right font-semibold text-[#6E6B75]">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDF3]">
              {(invoice.lines || []).map((l, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 font-medium text-[#1C1B23]">{l.product_name}</td>
                  <td className="py-2.5 px-3 text-right">{l.quantity}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{fmt(l.unit_price)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{fmt(l.tax_amount)}</td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums">{fmt(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1.5 text-xs max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-[#8C8895]">Subtotal</span><span className="font-semibold tabular-nums">{fmt(invoice.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-[#8C8895]">Tax</span><span className="font-semibold tabular-nums">{fmt(invoice.tax_total)}</span></div>
          <div className="flex justify-between text-sm font-bold border-t border-[#E8E6EB] pt-2">
            <span>Total</span><span className="text-[#714B67] tabular-nums">{fmt(invoice.total)}</span>
          </div>
          <div className="flex justify-between text-xs text-emerald-600 font-semibold">
            <span>Amount Paid</span><span className="tabular-nums">{fmt(invoice.amount_paid)}</span>
          </div>
          {parseFloat(invoice.outstanding_balance) > 0 && (
            <div className="flex justify-between text-xs text-red-600 font-bold">
              <span>Balance Outstanding</span><span className="tabular-nums">{fmt(invoice.outstanding_balance)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E6EB]">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF9FB] hover:bg-[#F0EDF3] border border-[#E8E6EB] text-xs font-semibold text-[#1C1B23] transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Statement
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#714B67] hover:bg-[#5C3953] text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Support Modal
// ──────────────────────────────────────────────────────────────────────────────
function SupportModal({ isOpen, onClose, customer, subscription }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#E8E6EB] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#714B67] flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1C1B23]">Help & Support</h3>
              <p className="text-xs text-[#8C8895]">Brightloop Customer Care</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#FAF9FB] text-[#8C8895]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#4A4754]">
          <p>
            Need assistance with your subscription or demonstration access? Our dedicated support team is available 24/7.
          </p>

          <div className="p-3.5 rounded-2xl bg-[#FAF9FB] border border-[#E8E6EB] space-y-1.5 font-medium">
            <p><strong className="text-[#1C1B23]">Subscription ID:</strong> #{subscription?.number}</p>
            <p><strong className="text-[#1C1B23]">Registered Email:</strong> {customer?.email}</p>
            <p><strong className="text-[#1C1B23]">Support Email:</strong> support@brightloop.io</p>
            <p><strong className="text-[#1C1B23]">Toll-Free Hotline:</strong> +1 (800) 555-0199</p>
          </div>

          <p className="text-[11px] text-[#8C8895]">
            Note: This demonstration environment reflects your actual billing status and active permissions. Any adjustments made in the customer portal update in real-time.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#714B67] hover:bg-[#5C3953] text-white text-xs font-semibold transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main DemoProductPage Component
// ──────────────────────────────────────────────────────────────────────────────
export function DemoProductPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, subscriptions, invoices, payments } = useData();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [subDetails, setSubDetails] = useState(null);
  const [payHistory, setPayHistory] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const launchToken = searchParams.get('launch_token');
  const isOfflineMode = searchParams.get('_offline') === '1' || !launchToken;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If offline mode or mock token, build fallback from client state
    if (isOfflineMode || (launchToken && launchToken.startsWith('mock-'))) {
      const offline = buildOfflineData(searchParams, products, subscriptions, invoices, payments);
      setSubDetails(offline.subDetails);
      setPayHistory(offline.payHistory);
      setInvoiceData(offline.invoiceData);
      setLoading(false);
      return;
    }

    try {
      const tokenParam = encodeURIComponent(launchToken);
      const headers = { 'Content-Type': 'application/json' };

      // Fetch all 3 endpoints concurrently
      const [resSub, resPay, resInv] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/v1/demo/subscription-details?launch_token=${tokenParam}`, { headers }),
        fetch(`http://127.0.0.1:8000/api/v1/demo/payment-history?launch_token=${tokenParam}`, { headers }),
        fetch(`http://127.0.0.1:8000/api/v1/demo/invoices?launch_token=${tokenParam}`, { headers })
      ]);

      if (!resSub.ok) {
        const errJson = await resSub.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.detail || `Authentication failed (${resSub.status})`);
      }

      const dataSub = await resSub.json();
      const dataPay = resPay.ok ? await resPay.json() : { summary: { total_paid: '0.00', payment_count: 0 }, payments: [] };
      const dataInv = resInv.ok ? await resInv.json() : { invoice_count: 0, invoices: [] };

      setSubDetails(dataSub);
      setPayHistory(dataPay);
      setInvoiceData(dataInv);
    } catch (err) {
      console.warn('[DemoProductPage] API fetch failed, falling back to cached subscription data:', err.message);
      // If server unreachable, check if we can fall back gracefully
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        const offline = buildOfflineData(searchParams, products, subscriptions, invoices, payments);
        setSubDetails(offline.subDetails);
        setPayHistory(offline.payHistory);
        setInvoiceData(offline.invoiceData);
      } else {
        setError(err.message || 'Unable to authenticate demo session.');
      }
    } finally {
      setLoading(false);
    }
  }, [launchToken, isOfflineMode, searchParams, products, subscriptions, invoices, payments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReturnToPortal = () => {
    navigate('/app');
  };

  const handleLogout = () => {
    localStorage.removeItem('brightloop_token');
    localStorage.removeItem('brightloop_user');
    navigate('/login');
  };

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F6F8] flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl border border-[#E8E6EB] p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1C1B23]">Demo Access Denied</h2>
          <p className="text-xs text-[#6E6B75] leading-relaxed">
            {error}
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <button
              onClick={handleReturnToPortal}
              className="w-full py-2.5 rounded-xl bg-[#714B67] hover:bg-[#5C3953] text-white text-xs font-semibold transition-colors"
            >
              Return to Customer Portal
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 rounded-xl bg-[#FAF9FB] hover:bg-[#F0EDF3] border border-[#E8E6EB] text-xs font-semibold text-[#6E6B75] transition-colors"
            >
              Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F8] flex flex-col font-sans text-[#1C1B23]">
      {/* Top Navbar */}
      <DemoHeader
        customer={subDetails?.customer}
        product={subDetails?.product}
        subscription={subDetails?.subscription}
        onLogout={handleLogout}
        onReturnToPortal={handleReturnToPortal}
        onOpenSupport={() => setIsSupportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Welcome Banner */}
            <WelcomeBanner
              customer={subDetails?.customer}
              product={subDetails?.product}
              plan={subDetails?.plan}
              subscription={subDetails?.subscription}
            />

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E6EB] pb-3">
              {[
                { id: 'overview', label: 'Subscription Overview', icon: LayoutDashboard },
                { id: 'plan', label: 'Plan & Entitlements', icon: Shield },
                { id: 'payments', label: 'Payment History', icon: CreditCard },
                { id: 'invoices', label: 'Invoices & Statements', icon: FileText }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#714B67] text-white shadow-sm'
                        : 'bg-white text-[#6E6B75] hover:text-[#1C1B23] border border-[#E8E6EB] hover:bg-[#FAF9FB]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Tab View */}
            {activeTab === 'overview' && (
              <OverviewSection
                subDetails={subDetails}
                onViewInvoices={() => setActiveTab('invoices')}
                onViewPlan={() => setActiveTab('plan')}
              />
            )}

            {activeTab === 'plan' && (
              <PlanSection subDetails={subDetails} />
            )}

            {activeTab === 'payments' && (
              <PaymentsSection payHistory={payHistory} />
            )}

            {activeTab === 'invoices' && (
              <InvoicesSection
                invoiceData={invoiceData}
                onSelectInvoice={setSelectedInvoice}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        customer={subDetails?.customer}
        subscription={subDetails?.subscription}
      />
    </div>
  );
}

export default DemoProductPage;
