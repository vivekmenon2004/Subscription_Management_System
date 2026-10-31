import React, { useState } from 'react';
import { CreditCard, Ban, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useData } from '../context/DataContext';
import { SearchField } from '../components/SearchField';

export function PaymentsPage() {
  const { payments, voidPayment, activeRole } = useData();
  const [search, setSearch] = useState('');

  const filteredPayments = payments.filter(p =>
    p.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.method.toLowerCase().includes(search.toLowerCase()) ||
    p.note?.toLowerCase().includes(search.toLowerCase())
  );

  const getMethodBadge = (method) => {
    const map = {
      upi: 'bg-purple-50 text-purple-700 border-purple-200',
      bank_transfer: 'bg-blue-50 text-blue-700 border-blue-200',
      card: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cash: 'bg-amber-50 text-amber-700 border-amber-200',
      other: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border uppercase tracking-wider ${map[method] || map.other}`}>
        {method.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#25232A]">Payment Transactions</h2>
          <p className="text-xs text-[#6E6B75] mt-0.5">Matched invoice payments, multi-method collections, and audit logs.</p>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-[#E8E6EB] shadow-card flex justify-between items-center">
        <div className="w-full md:w-72">
          <SearchField value={search} onChange={setSearch} placeholder="Search payments by invoice, method, note..." />
        </div>
        <div className="text-xs text-[#6E6B75]">
          Total Payments: <span className="font-semibold text-[#25232A]">{filteredPayments.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E6EB] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FB] text-[#6E6B75] border-b border-[#E8E6EB]">
              <tr>
                <th className="py-3 px-4 font-semibold">Tx ID</th>
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Method</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Recorded By</th>
                <th className="py-3 px-4 font-semibold">Note / Ref</th>
                <th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                {activeRole === 'admin' && (
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6EB]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={activeRole === 'admin' ? 10 : 9} className="text-center py-8 text-[#6E6B75]">
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className={`hover:bg-[#FAF9FB]/60 transition-colors ${p.is_void ? 'opacity-50 line-through' : ''}`}>
                    <td className="py-3.5 px-4 font-mono text-[#8C8895]">#{p.id}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#714B67]">{p.invoice_number}</td>
                    <td className="py-3.5 px-4 font-medium text-[#25232A]">{p.customer_name}</td>
                    <td className="py-3.5 px-4">{getMethodBadge(p.method)}</td>
                    <td className="py-3.5 px-4 text-[#6E6B75]">{p.payment_date}</td>
                    <td className="py-3.5 px-4 text-[#6E6B75]">{p.recorded_by_name || 'System'}</td>
                    <td className="py-3.5 px-4 text-[#6E6B75] max-w-xs truncate">{p.note || '—'}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#15803D] tabular-nums">
                      ₹{p.amount}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.is_void ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                          VOIDED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                          SUCCESS
                        </span>
                      )}
                    </td>
                    {activeRole === 'admin' && (
                      <td className="py-3.5 px-4 text-right">
                        {!p.is_void && (
                          <button
                            onClick={() => voidPayment(p.id)}
                            title="Void Payment (Admin only - reopens invoice balance)"
                            className="p-1.5 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors border border-[#FECACA]"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
