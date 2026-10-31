import React, { useState } from 'react';
import { 
  Users, DollarSign, AlertCircle, ArrowUpRight, Play, 
  Repeat, FileText, CheckCircle2, Calendar, TrendingUp 
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';

export function DashboardPage({ setActiveTab, onOpenInvoice, onRecordPayment, onOpenNewSub }) {
  const { subscriptions, invoices, payments, runDailyBillingJob, activeRole } = useData();
  const [jobNotice, setJobNotice] = useState('');

  // 1. KPI Calculations (PRD REP-1)
  const activeSubs = subscriptions.filter(s => s.status === 'Active' && !s.is_paused);
  const activeCount = activeSubs.length;

  // Monthly Recurring Revenue (MRR)
  const mrr = subscriptions
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => {
      const amt = Number(s.total_recurring_amount);
      const period = s.plan_details?.billing_period || 'monthly';
      if (period === 'yearly') return sum + (amt / 12);
      if (period === 'weekly') return sum + (amt * 4.33);
      if (period === 'daily') return sum + (amt * 30);
      return sum + amt;
    }, 0);

  // Revenue Collected in period
  const totalCollected = payments
    .filter(p => !p.is_void)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Total Outstanding on confirmed invoices
  const totalOutstanding = invoices
    .filter(inv => inv.status === 'Confirmed')
    .reduce((sum, inv) => sum + Number(inv.outstanding_balance), 0);

  // Overdue count & amount
  const overdueInvoices = invoices.filter(inv => inv.is_overdue);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.outstanding_balance), 0);

  const handleRunBilling = () => {
    if (activeRole !== 'admin') return;
    const count = runDailyBillingJob();
    setJobNotice(`Success! Daily billing job executed by Admin. Generated ${count} invoice(s).`);
    setTimeout(() => setJobNotice(''), 5000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Role Scoped Actions */}
      <div className="bg-gradient-to-r from-[#714B67] to-[#8C4673] rounded-2xl p-6 text-white shadow-elevated flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {activeRole === 'admin' 
              ? 'Admin Finance Cockpit · Full Engine Control' 
              : 'Staff Operations Workspace · Day-to-Day Lifecycle'}
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            {activeRole === 'admin' ? 'Brightloop Finance Cockpit' : 'Operations & Sales Workspace'}
          </h2>
          <p className="text-white/80 text-xs md:text-sm mt-1 max-w-xl">
            {activeRole === 'admin'
              ? 'Live subscription metrics, administrative billing engine trigger, and revenue auditing.'
              : 'Day-to-day customer subscription management, quotations, and invoice generation.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeRole === 'admin' ? (
            <button
              onClick={handleRunBilling}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#714B67] font-semibold text-xs hover:bg-[#FAF6F9] active:scale-95 transition-all shadow-sm"
              title="Admin trigger for the scheduled billing engine"
            >
              <Play className="w-4 h-4 fill-[#714B67]" aria-hidden="true" />
              Run Daily Billing Job
            </button>
          ) : (
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white/90 text-xs font-medium backdrop-blur-sm border border-white/10"
              title="Per PRD Section 4.6, scheduled daily billing runs automatically in Celery. Manual batch execution is restricted to Admin."
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Billing Run: Auto (Celery)</span>
            </div>
          )}
          {activeRole !== 'customer' && (
            <button
              onClick={onOpenNewSub}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-xs backdrop-blur-sm transition-all shadow-sm"
            >
              <Repeat className="w-4 h-4" aria-hidden="true" />
              New Subscription
            </button>
          )}
        </div>
      </div>

      {jobNotice && (
        <div className="p-3.5 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-medium flex items-center justify-between border border-[#BBF7D0] animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{jobNotice}</span>
          </div>
          <button onClick={() => setJobNotice('')} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* 5 KPI Cards (REP-1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Active Subscriptions */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E6EB] shadow-card">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span>Active Subscriptions</span>
            <Repeat className="w-4 h-4 text-[#714B67]" />
          </div>
          <p className="text-2xl font-bold text-[#25232A] mt-2 tabular-nums">{activeCount}</p>
          <p className="text-[11px] text-[#15803D] font-medium mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> 100% automated billing
          </p>
        </div>

        {/* MRR */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E6EB] shadow-card">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span>Monthly Recurring (MRR)</span>
            <TrendingUp className="w-4 h-4 text-[#A64D87]" />
          </div>
          <p className="text-2xl font-bold text-[#714B67] mt-2 tabular-nums">₹{mrr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-[#6E6B75] mt-1">Normalized to 30 days</p>
        </div>

        {/* Collected in Period */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E6EB] shadow-card">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span>Revenue Collected</span>
            <DollarSign className="w-4 h-4 text-[#15803D]" />
          </div>
          <p className="text-2xl font-bold text-[#15803D] mt-2 tabular-nums">₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-[#6E6B75] mt-1">{payments.filter(p => !p.is_void).length} payments matched</p>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E6EB] shadow-card">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span>Total Outstanding</span>
            <FileText className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-2xl font-bold text-[#25232A] mt-2 tabular-nums">₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-[#D97706] mt-1">On confirmed invoices</p>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E6EB] shadow-card">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span>Overdue Invoices</span>
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <p className="text-2xl font-bold text-[#DC2626] mt-2 tabular-nums">{overdueInvoices.length}</p>
          <p className="text-[11px] text-[#DC2626] font-medium mt-1">₹{overdueAmount.toFixed(2)} to chase</p>
        </div>
      </div>

      {/* Overdue Alerts Card (PRD PAY-5) */}
      {overdueInvoices.length > 0 && (
        <div className="bg-[#FFF8F8] border border-[#FECACA] rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#DC2626]">
              <AlertCircle className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Action Required: {overdueInvoices.length} Overdue Invoice(s)</h3>
            </div>
            <span className="text-xs font-bold text-[#DC2626] tabular-nums">Total Due: ₹{overdueAmount.toFixed(2)}</span>
          </div>

          <div className="divide-y divide-[#FEE2E2]">
            {overdueInvoices.map(inv => (
              <div key={inv.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono font-medium text-[#25232A]">{inv.number}</span>
                  <span className="mx-2 text-[#6E6B75]">·</span>
                  <span className="text-[#25232A] font-medium">{inv.customer_name}</span>
                  <span className="mx-2 text-[#6E6B75]">·</span>
                  <span className="text-[#DC2626] font-semibold">{inv.days_overdue} days overdue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#25232A] tabular-nums">₹{inv.outstanding_balance}</span>
                  <Button variant="danger" size="sm" onClick={() => onRecordPayment(inv)}>
                    Record Payment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Revenue Trend & Subscription Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-[#25232A]">Monthly Invoiced vs Collected</h3>
              <p className="text-xs text-[#6E6B75] mt-0.5">Recurring cash flow snapshot</p>
            </div>
            <span className="text-xs font-medium text-[#714B67] bg-[#F5EEF3] px-2.5 py-1 rounded-lg">Last 4 Months</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { month: 'October 2026', invoiced: 10223.52, collected: 5842.72 },
              { month: 'September 2026', invoiced: 4842.72, collected: 4842.72 },
              { month: 'August 2026', invoiced: 4842.72, collected: 4842.72 },
              { month: 'July 2026', invoiced: 3500.00, collected: 3500.00 },
            ].map((row, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs text-[#25232A]">
                  <span className="font-medium">{row.month}</span>
                  <span className="text-[#6E6B75] tabular-nums">₹{row.collected.toLocaleString()} / ₹{row.invoiced.toLocaleString()}</span>
                </div>
                <ProgressBar
                  value={row.collected}
                  max={row.invoiced}
                  variant={row.collected >= row.invoiced ? "success" : "primary"}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E8E6EB] text-xs">
            <div className="flex items-center gap-4 text-[#6E6B75]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#714B67]" />
                <span>Collected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EAE8ED]" />
                <span>Total Invoiced</span>
              </div>
            </div>
            <button onClick={() => setActiveTab('reports')} className="text-[#714B67] hover:underline font-medium">
              View full reports →
            </button>
          </div>
        </div>

        {/* Subscription Pipeline Status */}
        <div className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-[#25232A]">Subscription Lifecycle</h3>
            <p className="text-xs text-[#6E6B75] mt-0.5">Pipeline distribution</p>
          </div>

          <div className="space-y-3">
            {[
              { status: 'Active', count: subscriptions.filter(s => s.status === 'Active' && !s.is_paused).length, color: 'bg-green-500' },
              { status: 'Quotation', count: subscriptions.filter(s => s.status === 'Quotation').length, color: 'bg-pink-500' },
              { status: 'Confirmed', count: subscriptions.filter(s => s.status === 'Confirmed').length, color: 'bg-[#714B67]' },
              { status: 'Paused', count: subscriptions.filter(s => s.is_paused).length, color: 'bg-amber-500' },
              { status: 'Closed', count: subscriptions.filter(s => s.status === 'Closed').length, color: 'bg-gray-400' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-[#25232A] font-medium">{item.status}</span>
                </div>
                <span className="px-2 py-0.5 bg-[#F3F2F5] rounded-md font-semibold tabular-nums text-[#25232A]">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E8E6EB]">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setActiveTab('subscriptions')}
            >
              Manage Subscriptions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
