import React, { useState, useMemo } from 'react';
import { 
  DollarSign, AlertCircle, ArrowUpRight, Play,
  Repeat, FileText, CheckCircle2, TrendingUp,
  BarChart3, Clock, Sparkles, ShieldCheck,
  Check, Users, Target, ArrowRight, Zap, RefreshCw
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { 
  RevenueAreaChart, 
  PipelineDonutChart, 
  ActivityBarChart, 
  LiveActivityFeed, 
  StaffPerformanceCard 
} from '../components/DashboardCharts';

export function DashboardPage({ setActiveTab, onOpenInvoice, onRecordPayment, onOpenNewSub }) {
  const { 
    subscriptions = [], 
    invoices = [], 
    payments = [], 
    staffMembers = [],
    auditLogs = [],
    runDailyBillingJob, 
    confirmSubscription,
    activeRole,
    currentUser,
    refreshCustomerData
  } = useData();

  const [jobNotice, setJobNotice] = useState('');
  const [timeRange, setTimeRange] = useState('30d'); // '30d' | '90d' | '1y'
  const [dashboardTab, setDashboardTab] = useState('overview'); // 'overview' | 'activity' | 'operations'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. KPI Calculations (PRD REP-1 & SaaS Metrics)
  const activeSubs = subscriptions.filter(s => s.status === 'Active' && !s.is_paused);
  const activeCount = activeSubs.length;

  // Monthly Recurring Revenue (MRR)
  const mrr = subscriptions
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => {
      const amt = Number(s.total_recurring_amount) || 0;
      const period = s.plan_details?.billing_period || 'monthly';
      if (period === 'yearly') return sum + (amt / 12);
      if (period === 'weekly') return sum + (amt * 4.33);
      if (period === 'daily') return sum + (amt * 30);
      return sum + amt;
    }, 0);

  // Annual Run Rate (ARR)
  const arr = mrr * 12;

  // Revenue Collected in period
  const totalCollected = payments
    .filter(p => !p.is_void)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Total Outstanding on confirmed invoices
  const confirmedInvoices = invoices.filter(inv => inv.status === 'Confirmed');
  const totalOutstanding = confirmedInvoices
    .reduce((sum, inv) => sum + (Number(inv.outstanding_balance) || 0), 0);

  // Overdue count & amount
  const overdueInvoices = invoices.filter(inv => inv.is_overdue);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.outstanding_balance) || 0), 0);

  // Staff-specific operational queues
  const quotationsToConfirm = subscriptions.filter(s => s.status === 'Quotation');
  const urgentCollectionInvoices = confirmedInvoices.filter(inv => Number(inv.outstanding_balance) > 0);

  // Staff quota progress (Mock/Target Calculation)
  const weeklyTarget = 50000;
  const targetPct = Math.min(100, Math.round((totalCollected / weeklyTarget) * 100));

  const handleRunBilling = async () => {
    if (activeRole !== 'admin') return;
    const count = await runDailyBillingJob();
    setJobNotice(`Success! Daily billing engine executed by Admin. Processed batch with ${count} recurring invoice(s).`);
    setTimeout(() => setJobNotice(''), 6000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCustomerData(activeRole);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Monthly breakdown data for charts
  const monthlyChartData = useMemo(() => [
    { month: 'May 2026', invoiced: 3500, collected: 3500 },
    { month: 'Jun 2026', invoiced: 4200, collected: 4000 },
    { month: 'Jul 2026', invoiced: 4842, collected: 4842 },
    { month: 'Aug 2026', invoiced: 6500, collected: 6200 },
    { month: 'Sep 2026', invoiced: 8400, collected: 7900 },
    { month: 'Oct 2026', invoiced: 10223, collected: Math.max(5842, totalCollected) }
  ], [totalCollected]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* =========================================================================
          SECTION 1: SAAS COCKPIT HERO BANNER
          ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#714B67] via-[#8C4673] to-[#25232A] rounded-3xl p-6 md:p-8 text-white shadow-elevated">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm mb-3 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {activeRole === 'admin' 
                  ? 'Admin Dashboard · SaaS Control Cockpit' 
                  : 'Staff Operations Workspace · Lifecycle Management'}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {activeRole === 'admin' ? 'Brightloop Admin Dashboard' : `Welcome Back, ${currentUser?.name || 'Staff'}`}
            </h2>
            
            <p className="text-white/80 text-xs md:text-sm mt-1.5 max-w-2xl leading-relaxed">
              {activeRole === 'admin'
                ? 'Comprehensive SaaS financial cockpit: Recurring revenue metrics, automated billing engine dispatch, and real-time team audit logs.'
                : 'Day-to-day subscription operations: Quotation conversion, invoice matching, payment recovery, and customer support.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-all border border-white/20"
              title="Refresh Real-time Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {activeRole === 'admin' ? (
              <button
                onClick={handleRunBilling}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#714B67] font-bold text-xs hover:bg-[#FAF6F9] active:scale-95 transition-all shadow-md"
                title="Admin trigger for scheduled billing cycle"
              >
                <Play className="w-3.5 h-3.5 fill-[#714B67]" aria-hidden="true" />
                Run Billing Engine
              </button>
            ) : (
              <div 
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 text-white text-xs font-medium backdrop-blur-sm border border-white/20"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Auto-Billing: Active</span>
              </div>
            )}

            {activeRole !== 'customer' && (
              <button
                onClick={onOpenNewSub}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500/80 hover:bg-pink-500 text-white font-semibold text-xs backdrop-blur-sm transition-all shadow-sm"
              >
                <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
                New Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Billing Job Notice */}
      {jobNotice && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between border border-emerald-200 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{jobNotice}</span>
          </div>
          <button onClick={() => setJobNotice('')} className="underline text-[11px] hover:text-emerald-950 font-bold">Dismiss</button>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: 5 KEY SAAS METRIC CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. MRR */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#E8E6EB] shadow-card hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span className="font-medium">Monthly Recurring (MRR)</span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF6F9] flex items-center justify-center text-[#714B67]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#714B67] mt-2 tabular-nums">
            ₹{mrr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +14.8%
            </span>
            <span className="text-[#8C8895]">vs last month</span>
          </div>
        </div>

        {/* 2. ARR */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#E8E6EB] shadow-card hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span className="font-medium">Annualized Run Rate (ARR)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#25232A] mt-2 tabular-nums">
            ₹{(arr / 1000).toFixed(1)}k
          </p>
          <p className="text-[11px] text-[#6E6B75] mt-1 font-mono">12x Normalized MRR</p>
        </div>

        {/* 3. Revenue Collected */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#E8E6EB] shadow-card hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span className="font-medium">Total Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#15803D] mt-2 tabular-nums">
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#6E6B75] mt-1">
            {payments.filter(p => !p.is_void).length} successful collections
          </p>
        </div>

        {/* 4. Active Subscriptions */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#E8E6EB] shadow-card hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span className="font-medium">Active Subscriptions</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#25232A] mt-2 tabular-nums">{activeCount}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            96% zero-churn retention
          </p>
        </div>

        {/* 5. Overdue & At-Risk */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#E8E6EB] shadow-card hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span className="font-medium">Overdue Recovery</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#DC2626] mt-2 tabular-nums">{overdueInvoices.length}</p>
          <p className="text-[11px] text-[#DC2626] font-semibold mt-1">
            ₹{overdueAmount.toFixed(2)} pending
          </p>
        </div>
      </div>

      {/* Staff Weekly Collections Quota Progress (For Staff Role) */}
      {activeRole === 'staff' && (
        <div className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#25232A]">Weekly Collections Quota</h3>
                <p className="text-xs text-[#6E6B75]">Team target: ₹{weeklyTarget.toLocaleString()} per week</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#15803D] tabular-nums">
                ₹{totalCollected.toLocaleString()} / ₹{weeklyTarget.toLocaleString()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                {targetPct}% Attained
              </span>
            </div>
          </div>

          <div className="w-full bg-[#F3F2F5] h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#714B67] to-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${targetPct}%` }}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: ACTIONABLE OPERATIONAL ALERT (IF OVERDUE)
          ========================================================================= */}
      {overdueInvoices.length > 0 && (
        <div className="bg-[#FFF8F8] border border-[#FECACA] rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 text-[#DC2626]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm">Action Required: {overdueInvoices.length} Overdue Invoices Requiring Follow-up</h3>
            </div>
            <span className="text-xs font-black text-[#DC2626] tabular-nums">
              Total Due: ₹{overdueAmount.toFixed(2)}
            </span>
          </div>

          <div className="divide-y divide-[#FEE2E2]">
            {overdueInvoices.map(inv => (
              <div key={inv.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#25232A]">{inv.number}</span>
                  <span className="text-[#8C8895]">·</span>
                  <span className="text-[#25232A] font-semibold">{inv.customer_name}</span>
                  <span className="text-[#8C8895]">·</span>
                  <span className="text-[#DC2626] font-bold bg-red-100 px-2 py-0.5 rounded text-[10px]">
                    {inv.days_overdue} days overdue
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-[#25232A] tabular-nums">₹{inv.outstanding_balance}</span>
                  <Button variant="danger" size="sm" onClick={() => onRecordPayment(inv)}>
                    Record Payment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 4: MAIN SAAS ANALYTICS GRID WITH CHARTS & GRAPHS
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2-Column: Main Interactive Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E8E6EB] p-6 shadow-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#714B67]" />
                <h3 className="font-bold text-base text-[#25232A]">Revenue & Cash Flow Dynamics</h3>
              </div>
              <p className="text-xs text-[#6E6B75] mt-0.5">
                Monthly recurring billing trajectory vs actual collections
              </p>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 bg-[#F3F2F5] p-1 rounded-xl">
              {['30d', '90d', '1y'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    timeRange === range
                      ? 'bg-white text-[#714B67] shadow-xs'
                      : 'text-[#6E6B75] hover:text-[#25232A]'
                  }`}
                >
                  {range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'Yearly'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Bezier Area Chart */}
          <div className="pt-2">
            <RevenueAreaChart data={monthlyChartData} height={230} />
          </div>

          {/* Activity Velocity Grouped Bar Chart */}
          <div className="pt-5 border-t border-[#E8E6EB]">
            <h4 className="font-bold text-xs text-[#25232A] mb-1">Weekly Operational Velocity</h4>
            <ActivityBarChart auditLogs={auditLogs} />
          </div>
        </div>

        {/* Right 1-Column: Pipeline Donut & Action Queues */}
        <div className="space-y-6">
          
          {/* Donut Chart: Lifecycle & Status */}
          <div className="bg-white rounded-3xl border border-[#E8E6EB] p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#25232A]">Subscription Pipeline</h3>
                <p className="text-[11px] text-[#6E6B75] mt-0.5">Status breakdown & distribution</p>
              </div>
              <span className="text-[10px] font-bold text-[#714B67] bg-[#FDF2F8] px-2 py-0.5 rounded-full border border-[#FBCFE8]">
                Real-time
              </span>
            </div>

            <PipelineDonutChart subscriptions={subscriptions} />

            <div className="pt-3 border-t border-[#E8E6EB]">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs font-semibold"
                onClick={() => setActiveTab('subscriptions')}
              >
                Explore Full Subscriptions Pipeline →
              </Button>
            </div>
          </div>

          {/* Admin Leaderboard OR Staff Urgent Queue */}
          {activeRole === 'admin' ? (
            <div className="bg-white rounded-3xl border border-[#E8E6EB] p-6 shadow-card">
              <StaffPerformanceCard 
                staffMembers={staffMembers}
                payments={payments}
                subscriptions={subscriptions}
              />
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E8E6EB] p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#25232A]">My Action Queue</h3>
                  <p className="text-[11px] text-[#6E6B75] mt-0.5">Tasks requiring your attention</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {quotationsToConfirm.length + urgentCollectionInvoices.length} Pending
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {quotationsToConfirm.slice(0, 3).map(q => (
                  <div key={q.id} className="p-2.5 bg-[#FAF9FB] rounded-xl border border-[#E8E6EB] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#25232A]">{q.number}</p>
                      <p className="text-[10px] text-[#6E6B75]">{q.customer_details?.name || 'Customer'}</p>
                    </div>
                    <button
                      onClick={() => confirmSubscription(q.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#714B67] text-white text-[10px] font-bold hover:bg-[#8C4673]"
                    >
                      Confirm Quote
                    </button>
                  </div>
                ))}

                {quotationsToConfirm.length === 0 && urgentCollectionInvoices.length === 0 && (
                  <div className="text-center py-6 text-xs text-[#6E6B75]">
                    No urgent tasks pending. All quotes and invoices current!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: REAL-TIME AUDIT LOG & RECENT ACTIVITY TIMELINE
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E8E6EB] p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#714B67]" />
              <h3 className="font-bold text-base text-[#25232A]">Live SaaS Audit & Activity Stream</h3>
            </div>
            <p className="text-xs text-[#6E6B75] mt-0.5">
              Real-time chronological events executed across administrator engine and staff operations
            </p>
          </div>
          <div className="text-xs text-[#8C8895]">
            Auto-synced with system database
          </div>
        </div>

        <LiveActivityFeed auditLogs={auditLogs} />
      </div>

    </div>
  );
}
