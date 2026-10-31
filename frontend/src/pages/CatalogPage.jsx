import React, { useState } from 'react';
import { Plus, Package, AlertTriangle, Check, SlidersHorizontal, Globe, Monitor } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';

export function CatalogPage() {
  const { products, plans, addProduct, addPlan, activeRole } = useData();
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'plans'

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdType, setNewProdType] = useState('Software');
  const [newProdSales, setNewProdSales] = useState('1000.00');
  const [newProdCost, setNewProdCost] = useState('400.00');
  const [newProdIcon, setNewProdIcon] = useState('');
  const [newProdWebUrl, setNewProdWebUrl] = useState('');
  const [newProdDesktopUrl, setNewProdDesktopUrl] = useState('');
  const [newProdProtocol, setNewProdProtocol] = useState('brightloop');
  const [newProdAvailable, setNewProdAvailable] = useState(true);
  const [newProdAccessEnabled, setNewProdAccessEnabled] = useState(true);
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
      description: newProdDescription,
      type: newProdType,
      sales_price: Number(newProdSales).toFixed(2),
      cost_price: Number(newProdCost).toFixed(2),
      icon_url: newProdIcon,
      web_url: newProdWebUrl,
      desktop_download_url: newProdDesktopUrl,
      app_protocol: newProdProtocol,
      is_available: newProdAvailable,
      is_access_enabled: newProdAccessEnabled,
      entitlements: { features: ['core_access'] },
      variants
    });

    setShowAddProduct(false);
    setNewProdName('');
    setNewProdDescription('');
    setNewProdIcon('');
    setNewProdWebUrl('');
    setNewProdDesktopUrl('');
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#25232A]">Catalog & Recurring Plans</h2>
            {activeRole === 'staff' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Staff: Read Only
              </span>
            )}
            {activeRole === 'admin' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF2F8] text-[#714B67] border border-[#FBCFE8]">
                Admin: Full CRUD
              </span>
            )}
          </div>
          <p className="text-xs text-[#6E6B75] mt-0.5">Software offerings, variants, margins, and recurring subscription plans.</p>
        </div>
        {activeRole === 'admin' ? (
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
        ) : (
          <div className="text-right text-xs text-[#6E6B75]">
            <span className="italic">Catalog creation is restricted to Admin (PRD 2.1)</span>
          </div>
        )}
      </div>

      {activeRole === 'staff' && (
        <div className="p-3 bg-[#FAF9FB] border border-[#E8E6EB] rounded-xl flex items-center justify-between text-xs text-[#6E6B75]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <strong>Staff Read-Only View:</strong> Per PRD Section 2.1, sales staff can view product specifications, variants, and profit margins, while catalog modifications are reserved for Admins.
          </span>
        </div>
      )}

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
                <p className="text-xs text-[#6E6B75] mt-0.5">{prod.description || prod.notes || 'Catalog software subscription item'}</p>

                {/* Product Access Capabilities Badges (Requirement 3) */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {prod.web_url ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      <Globe className="w-3 h-3" /> Web App
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-200">
                      No Web URL
                    </span>
                  )}
                  {prod.app_protocol ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      <Monitor className="w-3 h-3" /> Windows Desktop
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-200">
                      No Desktop Protocol
                    </span>
                  )}
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                    prod.is_available !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {prod.is_available !== false ? 'Available' : 'Unavailable'}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                    prod.is_access_enabled !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {prod.is_access_enabled !== false ? 'Access: ON' : 'Access: OFF'}
                  </span>
                </div>
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

              {/* Product Access Configuration Fields (Section 3) */}
              <div className="pt-2 border-t border-[#E8E6EB] space-y-2">
                <p className="font-semibold text-[#25232A]">Product Access & Application URLs</p>
                
                <div>
                  <label className="block text-[#6E6B75] mb-1">Description</label>
                  <textarea
                    rows="2"
                    placeholder="Comprehensive description of product functionality"
                    value={newProdDescription}
                    onChange={(e) => setNewProdDescription(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#6E6B75] mb-1">Web Application URL</label>
                    <input
                      type="url"
                      placeholder="https://app.brightloop.io"
                      value={newProdWebUrl}
                      onChange={(e) => setNewProdWebUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6E6B75] mb-1">Launch Protocol</label>
                    <input
                      type="text"
                      placeholder="e.g. brightloop"
                      value={newProdProtocol}
                      onChange={(e) => setNewProdProtocol(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#6E6B75] mb-1">Windows Download URL</label>
                    <input
                      type="url"
                      placeholder="https://downloads.../setup.exe"
                      value={newProdDesktopUrl}
                      onChange={(e) => setNewProdDesktopUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6E6B75] mb-1">Icon / Image URL</label>
                    <input
                      type="url"
                      placeholder="https://.../icon.png"
                      value={newProdIcon}
                      onChange={(e) => setNewProdIcon(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status Toggles */}
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProdAvailable}
                      onChange={(e) => setNewProdAvailable(e.target.checked)}
                      className="rounded text-[#714B67] focus:ring-[#714B67]"
                    />
                    <span className="font-medium text-[#25232A]">Product Available</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProdAccessEnabled}
                      onChange={(e) => setNewProdAccessEnabled(e.target.checked)}
                      className="rounded text-[#714B67] focus:ring-[#714B67]"
                    />
                    <span className="font-medium text-[#25232A]">Access Enabled</span>
                  </label>
                </div>
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
