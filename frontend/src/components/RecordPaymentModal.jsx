import React, { useState } from 'react';
import { X, Check, CreditCard, Landmark, QrCode, Banknote } from 'lucide-react';
import { Button } from './Button';
import { useData } from '../context/DataContext';

export function RecordPaymentModal({ invoice, onClose }) {
  const { recordPayment } = useData();
  const [method, setMethod] = useState('upi');
  const [amount, setAmount] = useState(invoice ? invoice.outstanding_balance : '0.00');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!invoice) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }
    if (numAmt > Number(invoice.outstanding_balance)) {
      setError(`Payment cannot exceed outstanding balance of ₹${invoice.outstanding_balance}.`);
      return;
    }

    recordPayment({
      invoiceId: invoice.id,
      method,
      amount: numAmt,
      note
    });

    onClose();
  };

  const methods = [
    { id: 'upi', label: 'UPI / QR', icon: QrCode },
    { id: 'bank_transfer', label: 'Bank Wire', icon: Landmark },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'cash', label: 'Cash', icon: Banknote },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-elevated border border-[#E8E6EB] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6EB] bg-[#FAF9FB]">
          <div>
            <h2 className="text-base font-semibold text-[#25232A]">Record Payment</h2>
            <p className="text-xs text-[#6E6B75] mt-0.5">Invoice {invoice.number} (Balance: ₹{invoice.outstanding_balance})</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#6E6B75] hover:bg-[#EAE8ED]">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-medium text-[#6E6B75] mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-[#714B67] bg-[#F5EEF3] text-[#714B67]'
                        : 'border-[#E8E6EB] bg-white text-[#25232A] hover:bg-[#FAF9FB]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="payment-amount" className="block text-xs font-medium text-[#6E6B75]">Amount (₹)</label>
              <button
                type="button"
                onClick={() => setAmount(invoice.outstanding_balance)}
                className="text-[11px] text-[#714B67] hover:underline font-medium"
              >
                Pay Full (₹{invoice.outstanding_balance})
              </button>
            </div>
            <input
              id="payment-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none tabular-nums text-base font-semibold text-[#25232A]"
              required
            />
          </div>

          {/* Reference / Note Field */}
          <div>
            <label htmlFor="payment-note" className="block text-xs font-medium text-[#6E6B75] mb-1">Transaction Ref / Note</label>
            <input
              id="payment-note"
              type="text"
              placeholder="e.g. UTR / HDFC Ref / Cheque #..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none text-xs text-[#25232A]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E8E6EB]">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Check}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
