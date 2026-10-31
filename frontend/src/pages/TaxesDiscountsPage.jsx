import React, { useState } from 'react';
import { Percent, Tag, Plus, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useData } from '../context/DataContext';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/Button';

export function TaxesDiscountsPage() {
  const { taxes, discounts, addTax, addDiscount, activeRole } = useData();

  // Modals for Admin
  const [showAddTax, setShowAddTax] = useState(false);
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState('18.00');
  const [taxInclusive, setTaxInclusive] = useState(false);

  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [discName, setDiscName] = useState('');
  const [discType, setDiscType] = useState('percentage');
  const [discValue, setDiscValue] = useState('10.00');
  const [discScope, setDiscScope] = useState('all');
  const [discLimit, setDiscLimit] = useState('10');
  const [discNotice, setDiscNotice] = useState('');

  const handleCreateTax = (e) => {
    e.preventDefault();
    if (activeRole !== 'admin') return;
    addTax({
      name: taxName,
      rate: taxRate,
      is_inclusive: taxInclusive
    });
    setShowAddTax(false);
    setTaxName('');
    setTaxRate('18.00');
    setTaxInclusive(false);
    setDiscNotice('Tax rule created successfully.');
    setTimeout(() => setDiscNotice(''), 4000);
  };

  const handleCreateDiscount = (e) => {
    e.preventDefault();
    if (activeRole !== 'admin') return;
    addDiscount({
      name: discName,
      type: discType,
      value: discValue,
      scope: discScope,
      usage_limit: discLimit ? Number(discLimit) : null
    });
    setShowAddDiscount(false);
    setDiscName('');
    setDiscValue('10.00');
    setDiscLimit('10');
    setDiscNotice('Discount rule created successfully.');
    setTimeout(() => setDiscNotice(''), 4000);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#25232A]">Taxes & Discount Rules</h2>
            {activeRole === 'admin' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF2F8] text-[#714B67] border border-[#FBCFE8]">
                Admin Configured (PRD 4.7/4.8)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Staff: Read Only
              </span>
            )}
          </div>
          <p className="text-xs text-[#6E6B75] mt-0.5">Automated tax calculation and coupon usage guardrails enforced server-side.</p>
        </div>

        {activeRole === 'admin' ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" icon={Plus} onClick={() => setShowAddTax(true)}>
              Add Tax Rule
            </Button>
            <Button variant="primary" size="md" icon={Plus} onClick={() => setShowAddDiscount(true)}>
              Create Discount Rule
            </Button>
          </div>
        ) : (
          <div className="text-right text-xs text-[#6E6B75]">
            <span className="italic">Tax & discount rule creation is restricted to Admin</span>
          </div>
        )}
      </div>

      {activeRole === 'staff' && (
        <div className="p-3 bg-[#FAF9FB] border border-[#E8E6EB] rounded-xl flex items-center justify-between text-xs text-[#6E6B75]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <strong>Staff Read-Only View:</strong> Per PRD Section 2.1 & 4.8 ("Only the admin can create discount rules"), staff members can view active discount guardrails and tax rates, but rule definitions are controlled by System Administrators.
          </span>
        </div>
      )}

      {discNotice && (
        <div className="p-3.5 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-medium flex items-center justify-between border border-[#BBF7D0]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{discNotice}</span>
          </div>
          <button onClick={() => setDiscNotice('')} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxes Card (PRD 4.7) */}
        <div className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#714B67]" />
              <h3 className="font-semibold text-sm text-[#25232A]">Configured Tax Rules</h3>
            </div>
            {activeRole === 'admin' && (
              <button 
                onClick={() => setShowAddTax(true)}
                className="text-xs text-[#714B67] hover:underline font-semibold"
              >
                + New Tax
              </button>
            )}
          </div>

          <div className="space-y-3">
            {taxes.map(tax => (
              <div key={tax.id} className="p-3.5 bg-[#FAF9FB] rounded-xl border border-[#E8E6EB] flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-sm text-[#25232A]">{tax.name}</p>
                  <p className="text-[#6E6B75] mt-0.5">
                    Rate: <span className="font-semibold text-[#714B67]">{tax.rate}%</span> · {tax.is_inclusive ? 'Tax Inclusive' : 'Tax Exclusive (Added)'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
                  Active
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#6E6B75]">
            * Taxes are calculated on discounted amounts using standard Decimal half-up arithmetic to ensure accurate bookkeeping.
          </p>
        </div>

        {/* Discounts Card (PRD 4.8) */}
        <div className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#A64D87]" />
              <h3 className="font-semibold text-sm text-[#25232A]">Active Discount Rules</h3>
            </div>
            {activeRole === 'admin' && (
              <button 
                onClick={() => setShowAddDiscount(true)}
                className="text-xs text-[#A64D87] hover:underline font-semibold"
              >
                + New Discount
              </button>
            )}
          </div>

          <div className="space-y-3">
            {discounts.map(disc => {
              return (
                <div key={disc.id} className="p-3.5 bg-[#FAF9FB] rounded-xl border border-[#E8E6EB] space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm text-[#25232A]">{disc.name}</p>
                      <p className="text-[#6E6B75] mt-0.5">
                        Discount: <span className="font-bold text-[#A64D87]">{disc.type === 'percentage' ? `${disc.value}%` : `₹${disc.value}`}</span>
                        <span className="mx-1.5">·</span>
                        Scope: <span className="capitalize">{disc.scope}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-[#714B67] border border-purple-200">
                      Auto-Apply
                    </span>
                  </div>

                  {/* Usage limit progress */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-[#6E6B75]">
                      <span>Usage Counter</span>
                      <span className="tabular-nums font-medium text-[#25232A]">{disc.times_used} / {disc.usage_limit || '∞'} used</span>
                    </div>
                    <ProgressBar
                      value={disc.times_used}
                      max={disc.usage_limit || 100}
                      variant="secondary"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-[#6E6B75]">
            * One discount per line (most valuable eligible rule wins). Cancelling an invoice restores the usage count automatically.
          </p>
        </div>
      </div>

      {/* Admin Modal: Add Tax Rule */}
      {showAddTax && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-elevated border border-[#E8E6EB] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-[#25232A]">Add Tax Rule (PRD TAX-1)</h3>
              <button onClick={() => setShowAddTax(false)} className="text-[#8C8895] hover:text-[#25232A] font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateTax} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#25232A] mb-1">Tax Name</label>
                <input
                  type="text"
                  required
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  placeholder="e.g. GST 12%"
                  className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#25232A] mb-1">Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="12.00"
                  className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="taxInc"
                  checked={taxInclusive}
                  onChange={(e) => setTaxInclusive(e.target.checked)}
                  className="rounded text-[#714B67]"
                />
                <label htmlFor="taxInc" className="text-xs text-[#25232A] select-none font-medium">
                  Tax Inclusive of listed prices
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E6EB]">
                <Button variant="secondary" size="md" type="button" onClick={() => setShowAddTax(false)}>Cancel</Button>
                <Button variant="primary" size="md" type="submit">Create Tax Rule</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Modal: Create Discount Rule */}
      {showAddDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-elevated border border-[#E8E6EB] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-[#25232A]">Create Discount Rule (PRD 4.8)</h3>
                <p className="text-[11px] text-[#6E6B75]">Admin-exclusive capability</p>
              </div>
              <button onClick={() => setShowAddDiscount(false)} className="text-[#8C8895] hover:text-[#25232A] font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateDiscount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#25232A] mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={discName}
                  onChange={(e) => setDiscName(e.target.value)}
                  placeholder="e.g. Diwali Startup Special"
                  className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#25232A] mb-1">Discount Type</label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#25232A] mb-1">Value ({discType === 'percentage' ? '%' : '₹'})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={discValue}
                    onChange={(e) => setDiscValue(e.target.value)}
                    placeholder={discType === 'percentage' ? '15' : '500'}
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#25232A] mb-1">Usage Limit (DISC-4)</label>
                  <input
                    type="number"
                    value={discLimit}
                    onChange={(e) => setDiscLimit(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#25232A] mb-1">Scope (DISC-2)</label>
                  <select
                    value={discScope}
                    onChange={(e) => setDiscScope(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  >
                    <option value="all">All Invoices & Products</option>
                    <option value="products">Specific Products</option>
                    <option value="subscriptions">Specific Subscriptions</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E6EB]">
                <Button variant="secondary" size="md" type="button" onClick={() => setShowAddDiscount(false)}>Cancel</Button>
                <Button variant="primary" size="md" type="submit">Save Discount Rule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
