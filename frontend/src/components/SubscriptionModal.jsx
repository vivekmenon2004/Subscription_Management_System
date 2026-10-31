import React, { useState } from 'react';
import { X, Plus, Trash2, Check, UserPlus, Building, Mail, Phone, FileText } from 'lucide-react';
import { Button } from './Button';
import { useData } from '../context/DataContext';

export function SubscriptionModal({ onClose }) {
  const { products, plans, addSubscription, customers, addCustomer, activeRole } = useData();

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || 3);
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || 1);
  const [paymentTerms, setPaymentTerms] = useState('30_days');
  const [showAddCustomerInline, setShowAddCustomerInline] = useState(false);

  // Quick Customer Add state
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustTaxId, setNewCustTaxId] = useState('');

  const [lines, setLines] = useState([
    {
      product: products[0]?.id || 1,
      variant: products[0]?.variants?.[0]?.id || null,
      quantity: 1,
      unit_price: products[0]?.sales_price || '1000.00'
    }
  ]);

  const selectedCustomer = customers.find(c => c.id === Number(selectedCustomerId)) || customers[0];

  const handleAddLine = () => {
    const defaultProd = products[0];
    setLines([
      ...lines,
      {
        product: defaultProd?.id || 1,
        variant: defaultProd?.variants?.[0]?.id || null,
        quantity: 1,
        unit_price: defaultProd?.sales_price || '1000.00'
      }
    ]);
  };

  const handleRemoveLine = (idx) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleProductChange = (idx, prodId) => {
    const prod = products.find(p => p.id === Number(prodId));
    const newLines = [...lines];
    newLines[idx].product = Number(prodId);
    newLines[idx].variant = prod?.variants?.[0]?.id || null;
    newLines[idx].unit_price = prod?.sales_price || '1000.00';
    setLines(newLines);
  };

  const handleVariantChange = (idx, varId) => {
    const newLines = [...lines];
    const prod = products.find(p => p.id === newLines[idx].product);
    const variant = prod?.variants?.find(v => v.id === Number(varId));
    newLines[idx].variant = varId ? Number(varId) : null;
    const extra = variant ? Number(variant.extra_price) : 0;
    newLines[idx].unit_price = (Number(prod?.sales_price || 0) + extra).toFixed(2);
    setLines(newLines);
  };

  const handleQtyChange = (idx, qty) => {
    const newLines = [...lines];
    newLines[idx].quantity = Math.max(1, Number(qty));
    setLines(newLines);
  };

  const handleQuickAddCustomer = (e) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail) return;
    const created = addCustomer({
      name: newCustName,
      email: newCustEmail,
      company_name: newCustCompany,
      phone: newCustPhone,
      tax_id: newCustTaxId
    });
    setSelectedCustomerId(created.id);
    setShowAddCustomerInline(false);
    setNewCustName('');
    setNewCustEmail('');
    setNewCustCompany('');
    setNewCustPhone('');
    setNewCustTaxId('');
  };

  const totalAmount = lines.reduce((acc, l) => acc + (Number(l.unit_price) * l.quantity), 0).toFixed(2);

  const handleSubmit = (asStatus = 'Draft') => {
    const today = new Date();
    const expiry = new Date();
    expiry.setMonth(today.getMonth() + 1);

    const formattedLines = lines.map((l, i) => {
      const prod = products.find(p => p.id === l.product);
      const variant = prod?.variants?.find(v => v.id === l.variant);
      return {
        id: i + 1,
        product: l.product,
        product_name: prod ? prod.name : 'Product',
        variant: l.variant,
        variant_name: variant ? variant.value : null,
        quantity: l.quantity,
        unit_price: l.unit_price,
        tax_rate: '18.00',
        tax_name: 'GST 18%',
        amount: (Number(l.unit_price) * l.quantity).toFixed(2)
      };
    });

    addSubscription({
      customer: Number(selectedCustomerId),
      plan: Number(selectedPlanId),
      status: asStatus,
      start_date: today.toISOString().split('T')[0],
      expiry_date: expiry.toISOString().split('T')[0],
      next_billing_date: today.toISOString().split('T')[0],
      payment_terms: paymentTerms,
      total_recurring_amount: totalAmount,
      lines: formattedLines
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-elevated border border-[#E8E6EB] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6EB] bg-[#FAF9FB]">
          <div>
            <h2 className="text-base font-semibold text-[#25232A]">Create Subscription / Quotation</h2>
            <p className="text-xs text-[#6E6B75] mt-0.5">Define customer, billing plan, and line items (Admin / Staff)</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#6E6B75] hover:bg-[#EAE8ED]">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Customer & Plan row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-[#25232A]">Select Customer</label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerInline(!showAddCustomerInline)}
                  className="text-[11px] text-[#714B67] hover:underline font-medium"
                >
                  {showAddCustomerInline ? 'Cancel' : '+ New Customer'}
                </button>
              </div>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] text-xs font-medium focus:border-[#714B67] focus:outline-none"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : `(${c.email})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#25232A] mb-1">Billing Plan</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] text-xs font-medium focus:border-[#714B67] focus:outline-none"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.billing_period})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#25232A] mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] text-xs font-medium focus:border-[#714B67] focus:outline-none"
              >
                <option value="immediate">Immediate</option>
                <option value="15_days">15 Days</option>
                <option value="30_days">30 Days</option>
                <option value="45_days">45 Days</option>
              </select>
            </div>
          </div>

          {/* Quick Add Customer Subform */}
          {showAddCustomerInline && (
            <div className="p-4 bg-[#FAF9FB] rounded-xl border border-[#E8E6EB] space-y-3 animate-fadeIn">
              <p className="font-semibold text-xs text-[#714B67] flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Quick Create Customer (PRD Section 2)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Contact Name *"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#D7D4DC] bg-white"
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#D7D4DC] bg-white"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#D7D4DC] bg-white"
                />
                <input
                  type="text"
                  placeholder="Tax ID / GSTIN"
                  value={newCustTaxId}
                  onChange={(e) => setNewCustTaxId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#D7D4DC] bg-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => setShowAddCustomerInline(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" onClick={handleQuickAddCustomer}>
                  Add Customer
                </Button>
              </div>
            </div>
          )}

          {/* Selected Customer Preview Card */}
          {selectedCustomer && (
            <div className="p-3 bg-[#FAF9FB] rounded-xl border border-[#E8E6EB] flex items-center justify-between text-xs text-[#6E6B75]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EAE8ED] text-[#714B67] font-bold flex items-center justify-center">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-[#25232A]">
                    {selectedCustomer.name} · <span className="font-normal text-[#6E6B75]">{selectedCustomer.company_name || 'Individual'}</span>
                  </p>
                  <p className="text-[11px] text-[#6E6B75]">{selectedCustomer.email} · Tax ID: {selectedCustomer.tax_id || 'N/A'}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Customer
              </span>
            </div>
          )}

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-[#25232A]">Products & Add-on Lines</label>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 text-xs text-[#714B67] font-medium hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => {
                const prod = products.find(p => p.id === line.product);
                return (
                  <div key={idx} className="flex items-center gap-2 bg-[#F7F6F8] p-2.5 rounded-xl border border-[#E8E6EB]">
                    {/* Product */}
                    <div className="flex-1">
                      <select
                        value={line.product}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D7D4DC] bg-white text-xs"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (₹{p.sales_price})</option>
                        ))}
                      </select>
                    </div>

                    {/* Variant if any */}
                    {prod?.variants?.length > 0 && (
                      <div className="w-32">
                        <select
                          value={line.variant || ''}
                          onChange={(e) => handleVariantChange(idx, e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#D7D4DC] bg-white text-xs"
                        >
                          {prod.variants.map(v => (
                            <option key={v.id} value={v.id}>{v.value} (+₹{v.extra_price})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="w-16">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-[#D7D4DC] bg-white text-xs text-center tabular-nums"
                      />
                    </div>

                    {/* Line amount */}
                    <div className="w-24 text-right font-medium text-xs text-[#25232A] tabular-nums">
                      ₹{(Number(line.unit_price) * line.quantity).toFixed(2)}
                    </div>

                    {/* Remove button */}
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="p-1 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtotal preview */}
          <div className="flex justify-between items-center p-3.5 bg-[#FAF9FB] rounded-xl border border-[#E8E6EB]">
            <span className="text-xs font-medium text-[#6E6B75]">Total Recurring Subtotal</span>
            <span className="text-base font-bold text-[#714B67] tabular-nums">₹{totalAmount}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E6EB] bg-[#FAF9FB]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outlined" size="sm" onClick={() => handleSubmit('Draft')}>
              Save as Draft
            </Button>
            <Button variant="primary" size="sm" icon={Check} onClick={() => handleSubmit('Quotation')}>
              Create Quotation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
