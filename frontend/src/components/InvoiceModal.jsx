import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { useData } from '../context/DataContext';

export function InvoiceModal({ invoice, onClose, onRecordPayment }) {
  const { confirmInvoice, cancelInvoice } = useData();
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-elevated border border-[#E8E6EB] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6EB] bg-[#FAF9FB]">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-[#25232A]">Invoice {invoice.number}</h2>
            <StatusBadge
              status={invoice.status}
              isOverdue={invoice.is_overdue}
              daysOverdue={invoice.days_overdue}
            />
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-[#6E6B75] hover:bg-[#EAE8ED] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm" id="printable-invoice">
          {/* Company & Customer Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg text-[#714B67]">Brightloop Software Pvt Ltd</p>
              <p className="text-xs text-[#6E6B75]">12 Innovation Way, Tech Park</p>
              <p className="text-xs text-[#6E6B75]">Bangalore, Karnataka 560100</p>
              <p className="text-xs text-[#6E6B75]">GSTIN: 29AAACB1234F1Z5</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-xs text-[#8C8895] uppercase tracking-wider">Billed To</p>
              <p className="font-medium text-[#25232A]">{invoice.customer_name}</p>
              <p className="text-xs text-[#6E6B75]">{invoice.customer_email}</p>
              <p className="text-xs text-[#6E6B75] mt-1">Sub: <span className="font-mono text-[#714B67]">{invoice.subscription_number}</span></p>
            </div>
          </div>

          {/* Dates & Period */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F7F6F8] p-3.5 rounded-xl border border-[#E8E6EB] text-xs">
            <div>
              <p className="text-[#8C8895]">Issue Date</p>
              <p className="font-medium text-[#25232A] mt-0.5">{invoice.issue_date}</p>
            </div>
            <div>
              <p className="text-[#8C8895]">Due Date</p>
              <p className="font-medium text-[#25232A] mt-0.5">{invoice.due_date}</p>
            </div>
            <div>
              <p className="text-[#8C8895]">Billing Period</p>
              <p className="font-medium text-[#25232A] mt-0.5">{invoice.period_start} → {invoice.period_end}</p>
            </div>
            <div>
              <p className="text-[#8C8895]">Plan</p>
              <p className="font-medium text-[#25232A] mt-0.5">{invoice.plan_name}</p>
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-[#E8E6EB] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FB] text-[#6E6B75] border-b border-[#E8E6EB]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Item</th>
                  <th className="py-2.5 px-2 font-medium text-center">Qty</th>
                  <th className="py-2.5 px-3 font-medium text-right">Unit Price</th>
                  <th className="py-2.5 px-3 font-medium text-right">Disc</th>
                  <th className="py-2.5 px-3 font-medium text-right">Tax (18%)</th>
                  <th className="py-2.5 px-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6EB]">
                {invoice.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9FB]/50">
                    <td className="py-2.5 px-3 font-medium text-[#25232A]">{line.product_name}</td>
                    <td className="py-2.5 px-2 text-center text-[#6E6B75] tabular-nums">{line.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-[#6E6B75] tabular-nums">₹{line.unit_price}</td>
                    <td className="py-2.5 px-3 text-right text-[#A64D87] tabular-nums">₹{line.discount}</td>
                    <td className="py-2.5 px-3 text-right text-[#6E6B75] tabular-nums">₹{line.tax_amount}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#25232A] tabular-nums">₹{line.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Breakdown */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-[#6E6B75]">
                <span>Subtotal</span>
                <span className="tabular-nums">₹{invoice.subtotal}</span>
              </div>
              {Number(invoice.discount_total) > 0 && (
                <div className="flex justify-between text-[#A64D87]">
                  <span>Discounts Applied</span>
                  <span className="tabular-nums">-₹{invoice.discount_total}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6E6B75]">
                <span>GST (Taxes)</span>
                <span className="tabular-nums">₹{invoice.tax_total}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm text-[#25232A] pt-2 border-t border-[#E8E6EB]">
                <span>Invoice Total</span>
                <span className="tabular-nums text-[#714B67]">₹{invoice.total}</span>
              </div>
              <div className="flex justify-between text-xs text-[#15803D]">
                <span>Amount Paid</span>
                <span className="tabular-nums">₹{invoice.amount_paid}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-dashed border-[#E8E6EB] text-[#25232A]">
                <span>Outstanding Balance</span>
                <span className={`tabular-nums ${Number(invoice.outstanding_balance) > 0 ? 'text-[#DC2626]' : 'text-[#15803D]'}`}>
                  ₹{invoice.outstanding_balance}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[#E8E6EB] bg-[#FAF9FB]">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
              Print / PDF
            </Button>
            {invoice.status === 'Draft' && (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                onClick={() => {
                  confirmInvoice(invoice.id);
                  onClose();
                }}
              >
                Confirm Invoice
              </Button>
            )}
            {invoice.status === 'Confirmed' && Number(invoice.amount_paid) === 0 && (
              <Button
                variant="outlined"
                size="sm"
                onClick={() => {
                  cancelInvoice(invoice.id);
                  onClose();
                }}
              >
                Cancel Invoice
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {Number(invoice.outstanding_balance) > 0 && invoice.status === 'Confirmed' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onRecordPayment(invoice);
                }}
              >
                Record Payment
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
