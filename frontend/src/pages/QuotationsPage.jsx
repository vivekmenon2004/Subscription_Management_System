import React, { useState } from 'react';
import { FileSignature, Plus, ArrowRight, CheckCircle2, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';

export function QuotationsPage({ setActiveTab }) {
  const { templates, products, plans, addQuotationTemplate, createQuotationFromTemplate, activeRole } = useData();
  const [createdNotice, setCreatedNotice] = useState('');

  // Admin Create Template Modal State
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplValidity, setTplValidity] = useState('30');
  const [tplPlan, setTplPlan] = useState(plans[0]?.id || 1);
  const [tplProduct, setTplProduct] = useState(products[0]?.id || 1);
  const [tplQuantity, setTplQuantity] = useState('1');

  const handleUseTemplate = (tplId) => {
    const newSub = createQuotationFromTemplate(tplId);
    if (newSub) {
      setCreatedNotice(`Quotation ${newSub.number} created from template! Valid for 30 days.`);
      setTimeout(() => setCreatedNotice(''), 5000);
    }
  };

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (activeRole !== 'admin') return;

    const selectedProd = products.find(p => p.id === Number(tplProduct)) || products[0];
    const selectedPlan = plans.find(p => p.id === Number(tplPlan)) || plans[0];

    addQuotationTemplate({
      name: tplName,
      validity_days: Number(tplValidity) || 30,
      plan: selectedPlan.id,
      plan_name: selectedPlan.name,
      lines: [
        {
          product: selectedProd.id,
          product_name: selectedProd.name,
          variant: null,
          variant_name: null,
          quantity: Number(tplQuantity) || 1
        }
      ]
    });

    setShowAddTemplate(false);
    setTplName('');
    setTplValidity('30');
    setCreatedNotice('Quotation template created successfully.');
    setTimeout(() => setCreatedNotice(''), 5000);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#25232A]">Quotation Templates</h2>
            {activeRole === 'admin' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF2F8] text-[#714B67] border border-[#FBCFE8]">
                Admin: Full Template Control
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                Staff: Use Only (PRD 2.1)
              </span>
            )}
          </div>
          <p className="text-xs text-[#6E6B75] mt-0.5">Preconfigured packages for rapid quote generation with preset validity windows.</p>
        </div>

        {activeRole === 'admin' ? (
          <Button variant="primary" size="md" icon={Plus} onClick={() => setShowAddTemplate(true)}>
            Create Template
          </Button>
        ) : (
          <div className="text-right text-xs text-[#6E6B75]">
            <span className="italic">Template management is Admin-only; Staff can generate quotes (TPL-2)</span>
          </div>
        )}
      </div>

      {activeRole === 'staff' && (
        <div className="p-3 bg-[#FAF9FB] border border-[#E8E6EB] rounded-xl flex items-center justify-between text-xs text-[#6E6B75]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <strong>Staff "Use Only" Mode:</strong> Per PRD Section 2.1 & 4.4 (TPL-2), staff members instantiate quotes from pre-approved templates into customer subscriptions. Template definitions are configured by Administrators.
          </span>
        </div>
      )}

      {createdNotice && (
        <div className="p-3.5 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-medium flex items-center justify-between border border-[#BBF7D0]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{createdNotice}</span>
          </div>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className="underline font-semibold"
          >
            View in Subscriptions →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(tpl => (
          <div key={tpl.id} className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#A64D87] bg-[#FDF2F8] px-2.5 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> Validity: {tpl.validity_days} Days
                </span>
                <span className="text-xs text-[#6E6B75] font-medium">{tpl.plan_name}</span>
              </div>
              <h3 className="font-bold text-base text-[#25232A] mt-2">{tpl.name}</h3>
              <p className="text-xs text-[#6E6B75] mt-0.5">Preset package with lines ready to copy into customer quotation.</p>
            </div>

            {/* Template Lines */}
            <div className="bg-[#FAF9FB] p-3 rounded-xl border border-[#E8E6EB] space-y-2 text-xs">
              <p className="text-[11px] font-semibold text-[#8C8895] uppercase tracking-wider">Bundled Products</p>
              <div className="divide-y divide-[#E8E6EB]">
                {tpl.lines.map((l, i) => (
                  <div key={i} className="py-1.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-medium text-[#25232A]">{l.product_name}</span>
                      {l.variant_name && <span className="text-[#714B67] ml-1">({l.variant_name})</span>}
                    </div>
                    <span className="text-[#6E6B75] font-semibold">Qty: {l.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                icon={ArrowRight}
                onClick={() => handleUseTemplate(tpl.id)}
              >
                Create Quotation From Template
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Modal: Create Quotation Template (TPL-1) */}
      {showAddTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-elevated border border-[#E8E6EB] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-[#25232A]">Create Quotation Template</h3>
                <p className="text-[11px] text-[#6E6B75]">Admin exclusive (PRD TPL-1)</p>
              </div>
              <button onClick={() => setShowAddTemplate(false)} className="text-[#8C8895] hover:text-[#25232A] font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateTemplate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#25232A] mb-1">Template Package Name</label>
                <input
                  type="text"
                  required
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="e.g. Enterprise Onboarding Bundle"
                  className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#25232A] mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    required
                    value={tplValidity}
                    onChange={(e) => setTplValidity(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#25232A] mb-1">Target Billing Plan</label>
                  <select
                    value={tplPlan}
                    onChange={(e) => setTplPlan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#25232A] mb-1">Primary Product Line</label>
                  <select
                    value={tplProduct}
                    onChange={(e) => setTplProduct(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#25232A] mb-1">Bundled Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tplQuantity}
                    onChange={(e) => setTplQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E6EB]">
                <Button variant="secondary" size="md" type="button" onClick={() => setShowAddTemplate(false)}>Cancel</Button>
                <Button variant="primary" size="md" type="submit">Create Template</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
