import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ArrowRight,
  Laptop,
  CheckCircle2
} from 'lucide-react';

export function ProductDetailsModal({ 
  product, 
  onClose, 
  onSelectPlan 
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    return product?.variants && product.variants.length > 0 ? product.variants[0].id : null;
  });

  if (!product) return null;

  const plans = (product.plans && product.plans.length > 0) 
    ? product.plans 
    : [
        {
          id: 1,
          name: 'Standard Monthly Plan',
          price: product.sales_price || '1000.00',
          billing_period: 'monthly',
          min_quantity: 1,
          description: product.description || 'Standard monthly subscription with full platform access.',
          features: ['Full application access', 'Standard reporting', 'Email support']
        }
      ];

  const iconUrl = product.icon_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=128&q=80';
  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
  const variantExtraPrice = selectedVariant ? Number(selectedVariant.extra_price || 0) : 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-details-title"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header banner */}
        <div className="bg-gradient-to-r from-[#714B67] via-[#8C3A73] to-[#25232A] p-6 sm:p-8 text-white relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-hidden focus:ring-2 focus:ring-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <img
              src={iconUrl}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover bg-white p-1 border-2 border-white/20 shadow-md flex-shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-semibold uppercase tracking-wider backdrop-blur-xs">
                  {product.type || 'Software'}
                </span>
                {product.already_subscribed && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-medium border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Already Subscribed</span>
                  </span>
                )}
              </div>
              <h2 id="product-details-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {product.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          
          {/* Product Overview & Access Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Product Description
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {product.description || product.notes || 'Enterprise cloud software product ready for immediate deployment and recurring subscription billing.'}
              </p>

              {/* Product Variants (if applicable) */}
              {product.variants && product.variants.length > 0 && (
                <div className="pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
                    Select Edition / Variant:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariantId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            isSelected
                              ? 'border-[#714B67] bg-[#714B67]/10 text-[#714B67] font-semibold'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {v.attribute}: {v.value} {Number(v.extra_price) > 0 ? `(+₹${Number(v.extra_price).toLocaleString('en-IN')})` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Launch Support Pill card */}
            <div className="bg-[#F7F6F8] rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#25232A] mb-2 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-[#714B67]" aria-hidden="true" />
                  <span>Deployment Modes</span>
                </h4>
                <ul className="text-xs text-gray-600 space-y-1.5 mb-3">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                    <span>Instant Web Access</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                    <span>Windows Client App ({product.app_protocol || 'brightloop'}://)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                    <span>Single Sign-On Authentication</span>
                  </li>
                </ul>
              </div>

              <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-200/60">
                Tax: {product.default_tax_name || 'Standard GST'} applicable at checkout.
              </div>
            </div>
          </div>

          {/* Subscription Plans Comparison */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[#25232A]">
                Choose a Subscription Plan
              </h3>
              <p className="text-xs text-gray-500">
                Select the billing cycle and tier that best matches your team's requirements.
              </p>
            </div>

            <div className={`grid grid-cols-1 ${plans.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'max-w-md mx-auto'} gap-6`}>
              {plans.map((plan) => {
                const effectivePrice = Number(plan.price) + variantExtraPrice;
                const formattedPrice = effectivePrice.toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                });

                const features = Array.isArray(plan.features) && plan.features.length > 0 
                  ? plan.features 
                  : (plan.entitlements?.features || ['Full Feature Access', 'Automated Invoicing', 'Priority Support']);

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 relative ${
                      plan.is_trending
                        ? 'border-[#714B67] bg-gradient-to-b from-[#714B67]/5 to-transparent shadow-md ring-1 ring-[#714B67]/30'
                        : 'border-gray-200 hover:border-gray-300 bg-white shadow-xs'
                    }`}
                  >
                    {plan.is_trending && (
                      <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-[#714B67] to-[#8C3A73] text-white shadow-xs">
                        Most Popular
                      </span>
                    )}

                    <div>
                      {/* Plan Name */}
                      <h4 className="text-base font-bold text-[#25232A] mb-1">
                        {plan.name}
                      </h4>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                        {plan.description || 'Recurring plan tailored for ongoing operational access.'}
                      </p>

                      {/* Pricing */}
                      <div className="flex items-baseline gap-1 mb-4 pb-4 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-500">₹</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-[#25232A] tabular-nums">
                          {formattedPrice}
                        </span>
                        <span className="text-xs font-medium text-gray-500 capitalize">
                          / {plan.billing_period || 'month'}
                        </span>
                      </div>

                      {/* Plan Feature List */}
                      <ul className="space-y-2 mb-6">
                        {features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2 text-xs text-[#25232A]">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-2.5 h-2.5" aria-hidden="true" />
                            </div>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Subscribe / Select Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectPlan && onSelectPlan(product, plan, selectedVariant);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                        plan.is_trending
                          ? 'bg-[#714B67] hover:bg-[#5C3D54] text-white shadow-sm'
                          : 'bg-gray-100 hover:bg-gray-200 text-[#25232A]'
                      }`}
                    >
                      <span>Subscribe Now</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Backed by Brightloop Enterprise SLA. You can pause or cancel recurring renewals anytime from your portal.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
