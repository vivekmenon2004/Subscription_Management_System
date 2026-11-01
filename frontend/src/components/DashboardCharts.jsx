import React, { useState, useId } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Repeat, FileText, 
  CreditCard, CheckCircle2, AlertCircle, Clock, Shield, 
  User, Sparkles, Filter, ChevronRight, Activity, ArrowUpRight
} from 'lucide-react';

// ============================================================================
// 1. REVENUE & CASH FLOW AREA / BEZIER LINE CHART
// ============================================================================
export function RevenueAreaChart({ data = [], height = 240 }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const gradId = useId();

  // Fallback data if empty
  const chartData = data.length > 0 ? data : [
    { month: 'May 2026', invoiced: 3500, collected: 3500 },
    { month: 'Jun 2026', invoiced: 4200, collected: 4000 },
    { month: 'Jul 2026', invoiced: 4800, collected: 4800 },
    { month: 'Aug 2026', invoiced: 6500, collected: 6200 },
    { month: 'Sep 2026', invoiced: 8400, collected: 7900 },
    { month: 'Oct 2026', invoiced: 10223, collected: 5842 }
  ];

  const maxVal = Math.max(...chartData.map(d => Math.max(d.invoiced, d.collected)), 1000) * 1.15;
  const width = 640;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  // Coordinate projections
  const getX = (idx) => paddingX + (idx / Math.max(chartData.length - 1, 1)) * graphWidth;
  const getY = (val) => height - paddingY - (val / maxVal) * graphHeight;

  // Build SVG Path
  const collectedPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.collected) }));
  const invoicedPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.invoiced) }));

  // Create smooth bezier path string
  const createSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const collectedLinePath = createSmoothPath(collectedPoints);
  const invoicedLinePath = createSmoothPath(invoicedPoints);

  const collectedAreaPath = `${collectedLinePath} L ${collectedPoints[collectedPoints.length - 1].x} ${height - paddingY} L ${collectedPoints[0].x} ${height - paddingY} Z`;

  const activeData = hoverIndex !== null ? chartData[hoverIndex] : chartData[chartData.length - 1];
  const activePt = hoverIndex !== null ? collectedPoints[hoverIndex] : collectedPoints[collectedPoints.length - 1];

  const totalCollected = chartData.reduce((acc, d) => acc + d.collected, 0);
  const totalInvoiced = chartData.reduce((acc, d) => acc + d.invoiced, 0);
  const collectionRatio = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 100;

  return (
    <div className="relative">
      {/* Top summary row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#714B67]" />
            <span className="font-medium text-[#25232A]">Revenue Collected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D7D4DC]" />
            <span className="text-[#6E6B75]">Invoiced Billing</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
            {collectionRatio}% Collection Rate
          </span>
          <span className="text-[11px] text-[#6E6B75] hidden sm:inline">Hover points for month drill-down</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-visible">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`areaGrad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#714B67" stopOpacity="0.28" />
              <stop offset="90%" stopColor="#714B67" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id={`strokeGrad-${gradId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8C4673" />
              <stop offset="100%" stopColor="#714B67" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = height - paddingY - pct * graphHeight;
            const val = Math.round(pct * maxVal);
            return (
              <g key={i} className="opacity-70">
                <line 
                  x1={paddingX} 
                  y1={y} 
                  x2={width - paddingX} 
                  y2={y} 
                  stroke="#E8E6EB" 
                  strokeDasharray={i === 0 ? "none" : "3 3"} 
                />
                <text 
                  x={paddingX - 8} 
                  y={y + 3} 
                  textAnchor="end" 
                  className="text-[9px] fill-[#8C8895] font-mono"
                >
                  ₹{(val / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Invoiced curve (dashed baseline) */}
          <path
            d={invoicedLinePath}
            fill="none"
            stroke="#D7D4DC"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="transition-all duration-300"
          />

          {/* Collected filled area */}
          <path
            d={collectedAreaPath}
            fill={`url(#areaGrad-${gradId})`}
            className="transition-all duration-300"
          />

          {/* Collected solid curve */}
          <path
            d={collectedLinePath}
            fill="none"
            stroke={`url(#strokeGrad-${gradId})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* X Axis month labels and interactive triggers */}
          {chartData.map((d, i) => {
            const x = getX(i);
            const isHover = hoverIndex === i;
            return (
              <g key={i}>
                <text 
                  x={x} 
                  y={height - 8} 
                  textAnchor="middle" 
                  className={`text-[10px] transition-colors ${
                    isHover ? 'fill-[#714B67] font-bold' : 'fill-[#8C8895]'
                  }`}
                >
                  {d.month.split(' ')[0]}
                </text>

                {/* Click / Hover trigger column */}
                <rect 
                  x={x - graphWidth / (chartData.length * 2)} 
                  y={paddingY} 
                  width={graphWidth / chartData.length} 
                  height={graphHeight} 
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              </g>
            );
          })}

          {/* Hover indicator vertical cursor */}
          {hoverIndex !== null && (
            <g className="pointer-events-none transition-all duration-150">
              <line 
                x1={activePt.x} 
                y1={paddingY} 
                x2={activePt.x} 
                y2={height - paddingY} 
                stroke="#714B67" 
                strokeWidth="1.5" 
                strokeDasharray="2 2"
                opacity="0.8"
              />
              <circle 
                cx={activePt.x} 
                cy={activePt.y} 
                r="6" 
                fill="#FFFFFF" 
                stroke="#714B67" 
                strokeWidth="3" 
                className="shadow-md"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Card */}
        {hoverIndex !== null && (
          <div 
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-lg border border-[#E8E6EB] text-xs transition-all duration-150"
            style={{ 
              left: `${(activePt.x / width) * 100}%`, 
              top: `${(activePt.y / height) * 100 - 10}%` 
            }}
          >
            <div className="font-bold text-[#25232A] mb-1">{activeData.month}</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between gap-4">
                <span className="text-[#6E6B75]">Collected:</span>
                <span className="font-bold text-[#15803D] tabular-nums">₹{activeData.collected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#6E6B75]">Invoiced:</span>
                <span className="font-semibold text-[#25232A] tabular-nums">₹{activeData.invoiced.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. SUBSCRIPTION PIPELINE DONUT / RING CHART
// ============================================================================
export function PipelineDonutChart({ subscriptions = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const categories = [
    { label: 'Active', count: subscriptions.filter(s => s.status === 'Active' && !s.is_paused).length, color: '#10B981', ringColor: 'stroke-emerald-500' },
    { label: 'Quotation', count: subscriptions.filter(s => s.status === 'Quotation').length, color: '#EC4899', ringColor: 'stroke-pink-500' },
    { label: 'Confirmed', count: subscriptions.filter(s => s.status === 'Confirmed').length, color: '#714B67', ringColor: 'stroke-[#714B67]' },
    { label: 'Paused', count: subscriptions.filter(s => s.is_paused).length, color: '#F59E0B', ringColor: 'stroke-amber-500' },
    { label: 'Closed', count: subscriptions.filter(s => s.status === 'Closed').length, color: '#9CA3AF', ringColor: 'stroke-gray-400' },
  ];

  const total = categories.reduce((sum, c) => sum + c.count, 0) || 1;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const slices = categories.map(cat => {
    const strokeDash = (cat.count / total) * circumference;
    const offset = circumference - cumulativeOffset;
    cumulativeOffset += strokeDash;
    const percentage = Math.round((cat.count / total) * 100);
    return {
      ...cat,
      strokeDash,
      offset,
      percentage
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Donut SVG */}
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
          {/* Base grey track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#F3F2F5"
            strokeWidth="18"
          />

          {/* Slices */}
          {slices.map((slice, i) => (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={hoveredIdx === i ? 22 : 18}
              strokeDasharray={`${slice.strokeDash} ${circumference}`}
              strokeDashoffset={slice.offset}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-2xl font-black text-[#25232A] tabular-nums">
            {activeSlice ? activeSlice.count : total}
          </span>
          <span className="text-[10px] uppercase font-bold text-[#8C8895] tracking-wider">
            {activeSlice ? activeSlice.label : 'Total Subs'}
          </span>
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div className="flex-1 w-full space-y-2 text-xs">
        {slices.map((cat, i) => (
          <div 
            key={i} 
            className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition-colors ${
              hoveredIdx === i ? 'bg-[#F7F6F8] font-bold' : 'hover:bg-[#FAF9FB]'
            }`}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-[#25232A]">{cat.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#25232A] tabular-nums">{cat.count}</span>
              <span className="text-[10px] text-[#8C8895] w-8 text-right font-mono">{cat.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 3. STAFF ACTIVITY VELOCITY BAR CHART
// ============================================================================
export function ActivityBarChart({ auditLogs = [] }) {
  // Aggregate recent days or categories
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
  
  // Action grouping
  const data = [
    { day: 'Mon', quotes: 2, payments: 1, engine: 1 },
    { day: 'Tue', quotes: 4, payments: 3, engine: 1 },
    { day: 'Wed', quotes: 1, payments: 2, engine: 0 },
    { day: 'Thu', quotes: 3, payments: 4, engine: 1 },
    { day: 'Fri', quotes: 5, payments: 3, engine: 1 },
    { day: 'Sat', quotes: 2, payments: 1, engine: 0 },
    { day: 'Today', quotes: 4, payments: 2, engine: 1 }
  ];

  const maxVal = Math.max(...data.map(d => d.quotes + d.payments + d.engine), 8);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#6E6B75] text-[11px]">Operations & Execution Volume</span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-[#25232A]">
            <span className="w-2 h-2 rounded bg-[#714B67]" /> Quotes/Subs
          </span>
          <span className="flex items-center gap-1 text-[#25232A]">
            <span className="w-2 h-2 rounded bg-emerald-500" /> Payments
          </span>
          <span className="flex items-center gap-1 text-[#25232A]">
            <span className="w-2 h-2 rounded bg-amber-500" /> Billing Runs
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 pt-2 items-end h-36 border-b border-[#E8E6EB] pb-2">
        {data.map((item, idx) => {
          const qHeight = (item.quotes / maxVal) * 100;
          const pHeight = (item.payments / maxVal) * 100;
          const eHeight = (item.engine / maxVal) * 100;

          return (
            <div key={idx} className="flex flex-col items-center justify-end h-full group relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-[#25232A] text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap">
                <span>{item.day}: {item.quotes + item.payments + item.engine} ops</span>
                <span className="text-emerald-300">₹ Payments: {item.payments}</span>
              </div>

              {/* Stacked bar */}
              <div className="w-full max-w-[28px] flex flex-col justify-end gap-0.5 rounded-t-md overflow-hidden transition-all duration-200 group-hover:scale-105">
                <div style={{ height: `${eHeight}%` }} className="bg-amber-400 w-full" title="Billing engine" />
                <div style={{ height: `${pHeight}%` }} className="bg-emerald-500 w-full" title="Payments recorded" />
                <div style={{ height: `${qHeight}%` }} className="bg-[#714B67] w-full" title="Quotes & subs" />
              </div>

              <span className="text-[10px] font-semibold text-[#8C8895] mt-1.5">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 4. LIVE ACTIVITY & REAL-TIME AUDIT STREAM
// ============================================================================
export function LiveActivityFeed({ auditLogs = [] }) {
  const [filterRole, setFilterRole] = useState('ALL'); // 'ALL' | 'admin' | 'staff'

  const filteredLogs = auditLogs.filter(log => {
    if (filterRole === 'ALL') return true;
    return log.actor_role === filterRole;
  });

  const getActionIcon = (action, entityType) => {
    if (entityType === 'Payment' || action.toLowerCase().includes('payment')) {
      return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (entityType === 'BillingEngine' || action.toLowerCase().includes('billing')) {
      return <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
    }
    if (entityType === 'Staff' || action.toLowerCase().includes('staff')) {
      return <User className="w-3.5 h-3.5 text-blue-600" />;
    }
    return <Repeat className="w-3.5 h-3.5 text-[#714B67]" />;
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now';
    const date = new Date(ts);
    const now = new Date();
    const diffHours = Math.round((now - date) / (1000 * 3600));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E8E6EB]">
        <div className="flex items-center gap-1.5">
          {['ALL', 'admin', 'staff'].map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filterRole === role
                  ? 'bg-[#714B67] text-white shadow-xs'
                  : 'bg-[#F3F2F5] text-[#6E6B75] hover:text-[#25232A]'
              }`}
            >
              {role === 'ALL' ? 'All Activity' : `${role} Actions`}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-[#8C8895] font-mono">{filteredLogs.length} events logged</span>
      </div>

      {/* Timeline List */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#6E6B75]">
            No activity records match the selected filter.
          </div>
        ) : (
          filteredLogs.map(log => {
            const roleBadgeClass = log.actor_role === 'admin' 
              ? 'bg-[#FDF2F8] text-[#714B67] border-[#FBCFE8]' 
              : 'bg-blue-50 text-blue-700 border-blue-200';

            return (
              <div 
                key={log.id} 
                className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF9FB] border border-[#E8E6EB] hover:bg-white transition-all hover:shadow-xs text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-[#E8E6EB] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  {getActionIcon(log.action, log.entity_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-[#25232A] truncate">
                        {log.actor_name || 'System Operator'}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase tracking-wider ${roleBadgeClass}`}>
                        {log.actor_role || 'Staff'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8C8895] shrink-0 font-mono">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  <p className="text-[#4A4753] text-[11px] mt-0.5">
                    <span className="font-medium text-[#714B67]">{log.action}</span>
                    {' on '}
                    <span className="font-mono font-medium text-[#25232A]">{log.entity_type} #{log.entity_id}</span>
                  </p>

                  {log.before_after_json && Object.keys(log.before_after_json).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(log.before_after_json).map(([k, v]) => (
                        <span key={k} className="px-1.5 py-0.5 rounded bg-white border border-[#E8E6EB] text-[10px] text-[#6E6B75] font-mono">
                          {k}: <strong className="text-[#25232A]">{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 5. STAFF PERFORMANCE & RECOVERY VELOCITY CARD
// ============================================================================
export function StaffPerformanceCard({ staffMembers = [], payments = [], subscriptions = [] }) {
  // Compute staff metrics
  const staffStats = staffMembers.map(member => {
    const recordedPayments = payments.filter(p => !p.is_void && (p.recorded_by_name === member.name || p.recorded_by === member.id));
    const collectedAmt = recordedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const convertedSubs = subscriptions.filter(s => s.status === 'Active');

    return {
      ...member,
      collectedAmt,
      paymentCount: recordedPayments.length,
      dealCount: convertedSubs.length
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <h4 className="font-semibold text-sm text-[#25232A]">Staff Execution & Collections</h4>
        <span className="text-[11px] text-[#714B67] font-semibold bg-[#F5EEF3] px-2 py-0.5 rounded">
          Active Team
        </span>
      </div>

      <div className="space-y-2.5">
        {staffStats.map(s => (
          <div key={s.id} className="p-3 bg-[#FAF9FB] rounded-xl border border-[#E8E6EB] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#EAE8ED] flex items-center justify-center text-[#714B67] font-bold text-xs border border-[#DDD9E2]">
                {s.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-[#25232A]">{s.name}</p>
                <p className="text-[10px] text-[#6E6B75] capitalize">{s.role} · {s.email}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-[#15803D] text-sm tabular-nums">
                ₹{s.collectedAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-[#6E6B75]">{s.paymentCount} payments recorded</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

