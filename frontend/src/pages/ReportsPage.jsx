import React from 'react';
import { Download, Calendar, CreditCard } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';

export function ReportsPage() {
  const { invoices } = useData();

  const handleExportCSV = () => {
    const headers = ["Invoice Number", "Customer", "Issue Date", "Due Date", "Status", "Subtotal", "Tax", "Total", "Paid", "Balance"];
    const rows = invoices.map(i => [
      i.number,
      i.customer_name,
      i.issue_date,
      i.due_date,
      i.status,
      i.subtotal,
      i.tax_total,
      i.total,
      i.amount_paid,
      i.outstanding_balance
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `brightloop_finance_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#25232A]">Financial Reports & Audit</h2>
          <p className="text-xs text-[#6E6B75] mt-0.5">Month-end summaries, collection by payment method, and exportable ledger.</p>
        </div>
        <Button variant="primary" size="md" icon={Download} onClick={handleExportCSV}>
          Export Month-End CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collections by Method */}
        <div className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#714B67]" />
            <h3 className="font-semibold text-sm text-[#25232A]">Collections by Method</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { method: 'Bank Transfer', amount: 4842.72, count: 1 },
              { method: 'UPI', amount: 1000.00, count: 1 },
              { method: 'Credit Card', amount: 0.00, count: 0 },
              { method: 'Cash', amount: 0.00, count: 0 }
            ].map((m, idx) => (
              <div key={idx} className="p-2.5 bg-[#FAF9FB] rounded-xl border border-[#E8E6EB] flex justify-between items-center">
                <div>
                  <p className="font-medium text-[#25232A]">{m.method}</p>
                  <p className="text-[10px] text-[#6E6B75]">{m.count} transaction(s)</p>
                </div>
                <p className="font-bold text-[#15803D] tabular-nums">₹{m.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Month-End Reconciliation Snapshot */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#A64D87]" />
              <h3 className="font-semibold text-sm text-[#25232A]">Period Ledger Summary</h3>
            </div>
            <span className="text-xs font-semibold text-[#714B67]">October 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FB] text-[#6E6B75] border-b border-[#E8E6EB]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Invoice</th>
                  <th className="py-2.5 px-3 font-semibold">Customer</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Paid</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Balance</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6EB]">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-[#FAF9FB]/50">
                    <td className="py-2.5 px-3 font-mono font-medium text-[#714B67]">{inv.number}</td>
                    <td className="py-2.5 px-3 text-[#25232A]">{inv.customer_name}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#25232A] tabular-nums">₹{inv.total}</td>
                    <td className="py-2.5 px-3 text-right text-[#15803D] tabular-nums">₹{inv.amount_paid}</td>
                    <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-[#DC2626]">₹{inv.outstanding_balance}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F3F2F5] text-[#4A4753]">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
