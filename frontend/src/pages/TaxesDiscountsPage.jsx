import React from 'react';
import { Percent, Tag, Check, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { ProgressBar } from '../components/ProgressBar';

export function TaxesDiscountsPage() {
  const { taxes, discounts } = useData();

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-xl font-bold text-[#25232A]">Taxes & Discount Rules</h2>
        <p className="text-xs text-[#6E6B75] mt-0.5">Automated tax calculation and coupon usage guardrails enforced server-side.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxes Card (PRD 4.7) */}
        <div className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#714B67]" />
            <h3 className="font-semibold text-sm text-[#25232A]">Configured Tax Rules</h3>
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
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#A64D87]" />
            <h3 className="font-semibold text-sm text-[#25232A]">Active Discount Rules</h3>
          </div>

          <div className="space-y-3">
            {discounts.map(disc => {
              const usedPercent = disc.usage_limit ? Math.round((disc.times_used / disc.usage_limit) * 100) : 0;
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
    </div>
  );
}
