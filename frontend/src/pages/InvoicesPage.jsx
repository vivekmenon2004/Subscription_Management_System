import React, { useState } from 'react';
import { Play, FileText, CheckCircle2, Eye, CreditCard, XCircle, Printer } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { SearchField } from '../components/SearchField';
import { StatusBadge } from '../components/StatusBadge';

export function InvoicesPage({ onOpenInvoice, onRecordPayment }) {
  const { invoices, confirmInvoice, cancelInvoice, runDailyBillingJob } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jobNotice, setJobNotice] = useState('');

  const filterTabs = ['ALL', 'Draft', 'Confirmed', 'Paid', 'Overdue', 'Cancelled'];

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.subscription_number?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'Overdue') return inv.is_overdue;
    return inv.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleRunBilling = () => {
    const count = runDailyBillingJob();
    setJobNotice(`Billing job completed! Created ${count} recurring invoice(s).`);
    setTimeout(() => setJobNotice(''), 5000);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#25232A]">Invoices & Billing</h2>
          <p className="text-xs text-[#6E6B75] mt-0.5">Automated recurring invoice generation, status lifecycle, and payments matching.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="md" icon={Play} onClick={handleRunBilling}>
            Run Daily Billing Job
          </Button>
        </div>
      </div>

      {jobNotice && (
        <div className="p-3.5 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-medium flex items-center justify-between border border-[#BBF7D0]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{jobNotice}</span>
          </div>
          <button onClick={() => setJobNotice('')} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E8E6EB] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === tab
                  ? 'bg-[#714B67] text-white shadow-sm'
                  : 'bg-[#F7F6F8] text-[#6E6B75] hover:text-[#25232A] hover:bg-[#EAE8ED]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full md:w-64">
          <SearchField value={search} onChange={setSearch} placeholder="Search by INV#, customer..." />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-[#E8E6EB] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FB] text-[#6E6B75] border-b border-[#E8E6EB]">
              <tr>
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Subscription</th>
                <th className="py-3 px-4 font-semibold">Period</th>
                <th className="py-3 px-4 font-semibold">Due Date</th>
                <th className="py-3 px-4 font-semibold text-right">Total (₹)</th>
                <th className="py-3 px-4 font-semibold text-right">Outstanding (₹)</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6EB]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-[#6E6B75]">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-[#FAF9FB]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#714B67]">
                      {inv.number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#25232A]">{inv.customer_name}</div>
                      <div className="text-[11px] text-[#6E6B75]">{inv.customer_email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-[#25232A]">
                      {inv.subscription_number}
                    </td>

                    <td className="py-3.5 px-4 text-[#6E6B75]">
                      {inv.period_start} → {inv.period_end}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[#25232A]">{inv.due_date}</div>
                      {inv.is_overdue && (
                        <div className="text-[10px] text-[#DC2626] font-semibold">{inv.days_overdue} days overdue</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-[#25232A] tabular-nums">
                      ₹{inv.total}
                    </td>

                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <span className={`font-semibold ${Number(inv.outstanding_balance) > 0 ? (inv.is_overdue ? 'text-[#DC2626]' : 'text-[#D97706]') : 'text-[#15803D]'}`}>
                        ₹{inv.outstanding_balance}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={inv.status} isOverdue={inv.is_overdue} daysOverdue={inv.days_overdue} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenInvoice(inv)}
                          title="View Invoice & Printable PDF"
                          className="p-1.5 text-[#714B67] hover:bg-[#F5EEF3] rounded-lg transition-colors border border-[#E8DCE5]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {inv.status === 'Draft' && (
                          <Button variant="primary" size="sm" onClick={() => confirmInvoice(inv.id)}>
                            Confirm
                          </Button>
                        )}

                        {Number(inv.outstanding_balance) > 0 && inv.status === 'Confirmed' && (
                          <button
                            onClick={() => onRecordPayment(inv)}
                            title="Record Payment"
                            className="p-1.5 text-[#15803D] hover:bg-[#DCFCE7] rounded-lg transition-colors border border-[#BBF7D0]"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {inv.status === 'Confirmed' && Number(inv.amount_paid) === 0 && (
                          <button
                            onClick={() => cancelInvoice(inv.id)}
                            title="Cancel Invoice"
                            className="p-1.5 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors border border-[#FECACA]"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
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
