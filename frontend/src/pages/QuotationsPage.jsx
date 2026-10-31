import React, { useState } from 'react';
import { FileSignature, Plus, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';

export function QuotationsPage({ setActiveTab }) {
  const { templates, createQuotationFromTemplate } = useData();
  const [createdNotice, setCreatedNotice] = useState('');

  const handleUseTemplate = (tplId) => {
    const newSub = createQuotationFromTemplate(tplId);
    if (newSub) {
      setCreatedNotice(`Quotation ${newSub.number} created from template! Valid for 30 days.`);
      setTimeout(() => setCreatedNotice(''), 5000);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#25232A]">Quotation Templates</h2>
          <p className="text-xs text-[#6E6B75] mt-0.5">Preconfigured bundles for fast quote generation with preset validity windows.</p>
        </div>
      </div>

      {createdNotice && (
        <div className="p-3.5 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-medium flex items-center justify-between border border-[#BBF7D0]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
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
    </div>
  );
}
