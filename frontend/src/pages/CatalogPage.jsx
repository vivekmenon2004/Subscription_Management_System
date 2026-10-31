import React, { useState } from 'react';
import { Plus, Package, Layers, AlertTriangle, Check, SlidersHorizontal } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';

export function CatalogPage() {
  const { products, plans, addProduct, addPlan, activeRole } = useData();
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'plans'

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdType, setNewProdType] = useState('Software');
  const [newProdSales, setNewProdSales] = useState('1000.00');
  const [newProdCost, setNewProdCost] = useState('400.00');
  const [newProdVariantAttr, setNewProdVariantAttr] = useState('Tier');
  const [newProdVariantVal, setNewProdVariantVal] = useState('Pro');
  const [newProdVariantExtra, setNewProdVariantExtra] = useState('500.00');

  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('4999.00');
  const [newPlanPeriod, setNewPlanPeriod] = useState('monthly');
  const [newPlanAutoClose, setNewPlanAutoClose] = useState(false);
  const [newPlanClosable, setNewPlanClosable] = useState(true);
  const [newPlanPausable, setNewPlanPausable] = useState(true);
  const [newPlanRenewable, setNewPlanRenewable] = useState(true);

  const handleCreateProduct = (e) => {
    e.preventDefault();
    const variants = newProdVariantVal ? [
      { id: Date.now(), attribute: newProdVariantAttr, value: newProdVariantVal, extra_price: newProdVariantExtra, effective_unit_price: (Number(newProdSales) + Number(newProdVariantExtra)).toFixed(2) }
    ] : [];

    addProduct({
      name: newProdName,
      type: newProdType,
      sales_price: Number(newProdSales).toFixed(2),
      cost_price: Number(newProdCost).toFixed(2),
      variants
    });

    setShowAddProduct(false);
    setNewProdName('');
  };

  const handleCreatePlan = (e) => {
    e.preventDefault();
    addPlan({
      name: newPlanName,
      price: Number(newPlanPrice).toFixed(2),
      billing_period: newPlanPeriod,
      min_quantity: 1,
      auto_close: newPlanAutoClose,
      closable: newPlanClosable,
      pausable: newPlanPausable,
      renewable: newPlanRenewable
    });
    setShowAddPlan(false);
    setNewPlanName('');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#25232A]">Catalog & Recurring Plans</h2>
          <p className="text-xs text-[#6E6B75] mt-0.5">Software offerings, variants, margins, and recurring subscription plans.</p>
        </div>
        {activeRole === 'admin' && (
          <div className="flex items-center gap-2">
            {activeTab === 'products' ? (
              <Button variant="primary" size="md" icon={Plus} onClick={() => setShowAddProduct(true)}>
                Add Product
              </Button>
            ) : (
              <Button variant="primary" size="md" icon={Plus} onClick={() => setShowAddPlan(true)}>
                Add Plan
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E6EB]">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-[#714B67] text-[#714B67]'
              : 'border-transparent text-[#6E6B75] hover:text-[#25232A]'
          }`}
        >
          <Package className="w-4 h-4" />
          Products & Variants ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'plans'
              ? 'border-[#714B67] text-[#714B67]'
              : 'border-transparent text-[#6E6B75] hover:text-[#25232A]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Recurring Billing Plans ({plans.length})
        </button>
      </div>

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(prod => (
            <div key={prod.id} className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F3F2F5] text-[#714B67]">
                    {prod.type}
                  </span>
                  {prod.has_cost_warning && (
                    <span className="flex items-center gap-1 text-[11px] text-[#DC2626] font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" /> High Cost!
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-base text-[#25232A] mt-2">{prod.name}</h3>
                <p className="text-xs text-[#6E6B75] mt-0.5">{prod.notes || 'Catalog software subscription item'}</p>
              </div>

              {/* Price & Margin Breakdown (PRD 4.2) */}
              <div className="bg-[#FAF9FB] p-3 rounded-xl border border-[#E8E6EB] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6E6B75]">Sales Price:</span>
                  <span className="font-bold text-[#25232A] tabular-nums">₹{prod.sales_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E6B75]">Cost Price:</span>
                  <span className="text-[#6E6B75] tabular-nums">₹{prod.cost_price}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#E8E6EB]">
                  <span className="font-medium text-[#714B67]">Profit Margin:</span>
                  <span className="font-bold text-[#15803D] tabular-nums">₹{prod.margin}</span>
                </div>
              </div>

              {/* Variants List (PROD-1) */}
              {prod.variants?.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-semibold text-[#8C8895] uppercase tracking-wider">Configured Variants</p>
                  <div className="space-y-1">
                    {prod.variants.map((v, i) => (
                      <div key={i} className="flex justify-between items-center text-xs bg-[#F7F6F8] px-2.5 py-1.5 rounded-lg border border-[#E8E6EB]">
                        <span className="font-medium text-[#25232A]">{v.attribute}: {v.value}</span>
                        <span className="font-semibold text-[#714B67] tabular-nums">+₹{v.extra_price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Plans Tab Content (PRD 4.3) */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FDF2F8] text-[#A64D87] uppercase tracking-wider">
                  {p.billing_period}
                </span>
                <h3 className="font-bold text-base text-[#25232A] mt-2">{p.name}</h3>
                <p className="text-2xl font-black text-[#714B67] mt-1 tabular-nums">
                  ₹{Number(p.price).toLocaleString()}
                  <span className="text-xs font-normal text-[#6E6B75]"> / {p.billing_period}</span>
                </p>
              </div>

              {/* Behavior Flags (PLAN-2) */}
              <div className="space-y-2 pt-2 border-t border-[#E8E6EB] text-xs">
                <p className="text-[11px] font-semibold text-[#8C8895] uppercase tracking-wider">Plan Behavior Flags</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${p.pausable ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                    <span>Pausable</span>
                    {p.pausable && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${p.renewable ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                    <span>Renewable</span>
                    {p.renewable && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${p.closable ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                    <span>Closable Early</span>
                    {p.closable && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${p.auto_close ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                    <span>Auto-Close</span>
                    {p.auto_close && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-elevated border border-[#E8E6EB] p-5 space-y-4">
            <h3 className="font-semibold text-base text-[#25232A]">Add New Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6E6B75] mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brightloop Payroll Suite"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#6E6B75] mb-1">Type</label>
                  <select
                    value={newProdType}
                    onChange={(e) => setNewProdType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
                  >
                    <option value="Software">Software</option>
                    <option value="Add-on">Add-on</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#6E6B75] mb-1">Sales Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdSales}
                    onChange={(e) => setNewProdSales(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#6E6B75] mb-1">Cost Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newProdCost}
                  onChange={(e) => setNewProdCost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none tabular-nums"
                />
              </div>

              <div className="pt-2 border-t border-[#E8E6EB]">
                <p className="font-medium text-[#25232A] mb-1.5">Optional Variant</p>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    placeholder="Attribute (e.g. Tier)"
                    value={newProdVariantAttr}
                    onChange={(e) => setNewProdVariantAttr(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-[#D7D4DC]"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Pro)"
                    value={newProdVariantVal}
                    onChange={(e) => setNewProdVariantVal(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-[#D7D4DC]"
                  />
                  <input
                    type="number"
                    placeholder="+Price (₹)"
                    value={newProdVariantExtra}
                    onChange={(e) => setNewProdVariantExtra(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-[#D7D4DC]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setShowAddProduct(false)}>Cancel</Button>
                <Button variant="primary" size="sm" type="submit">Save Product</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-elevated border border-[#E8E6EB] p-5 space-y-4">
            <h3 className="font-semibold text-base text-[#25232A]">Add New Recurring Plan</h3>
            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6E6B75] mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Startup Growth Plan"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#6E6B75] mb-1">Billing Period</label>
                  <select
                    value={newPlanPeriod}
                    onChange={(e) => setNewPlanPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#6E6B75] mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              {/* Checkbox flags */}
              <div className="space-y-2 pt-2 border-t border-[#E8E6EB]">
                <p className="font-semibold text-[#25232A]">Behavior Rules</p>
                <label className="flex items-center gap-2 text-[#25232A]">
                  <input type="checkbox" checked={newPlanPausable} onChange={(e) => setNewPlanPausable(e.target.checked)} />
                  <span>Allow pausing subscription</span>
                </label>
                <label className="flex items-center gap-2 text-[#25232A]">
                  <input type="checkbox" checked={newPlanRenewable} onChange={(e) => setNewPlanRenewable(e.target.checked)} />
                  <span>Allow renewing subscription</span>
                </label>
                <label className="flex items-center gap-2 text-[#25232A]">
                  <input type="checkbox" checked={newPlanClosable} onChange={(e) => setNewPlanClosable(e.target.checked)} />
                  <span>Allow early closing</span>
                </label>
                <label className="flex items-center gap-2 text-[#25232A]">
                  <input type="checkbox" checked={newPlanAutoClose} onChange={(e) => setNewPlanAutoClose(e.target.checked)} />
                  <span>Auto-close when reaching expiry date</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setShowAddPlan(false)}>Cancel</Button>
                <Button variant="primary" size="sm" type="submit">Save Plan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
