import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Repeat, 
  FileText, 
  User, 
  PackageCheck
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { TrendingPlansCarousel } from '../components/TrendingPlansCarousel';
import { AvailableProductsSection } from '../components/AvailableProductsSection';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { PurchaseCheckoutModal } from '../components/PurchaseCheckoutModal';

export function CustomerHomePage({ 
  onNavigateTab,
  onOpenInvoice
}) {
  const { 
    currentUser, 
    subscriptions = [], 
    invoices = [], 
    catalogProducts = [],
    trendingPlans = [],
    products = [],
    plans = [],
    isDiscoveryLoading
  } = useData();

  // Modals state
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [checkoutModalData, setCheckoutModalData] = useState(null); // { product, plan, variant }

  // Customer-scoped subscriptions & invoices
  const mySubscriptions = (subscriptions || []).filter(
    s => s.customer === currentUser?.id || currentUser?.role !== 'customer'
  );
  const activeSubs = mySubscriptions.filter(s => s.status === 'Active' && !s.is_paused);

  const myInvoices = (invoices || []).filter(
    inv => inv.customer === currentUser?.id || currentUser?.role !== 'customer'
  );
  const pendingInvoices = myInvoices.filter(inv => Number(inv.outstanding_balance) > 0);

  // Fallback for products if discovery is loading or offline
  const allAvailableProducts = catalogProducts.length > 0 ? catalogProducts : products;

  // Handlers
  const handleOpenPlanDetail = (plan, product) => {
    const targetProduct = product?.id 
      ? allAvailableProducts.find(p => p.id === product.id) || product
      : allAvailableProducts[0];
    
    // Open Checkout modal directly for this trending plan
    setCheckoutModalData({
      product: targetProduct,
      plan: plan,
      variant: null
    });
  };

  const handleOpenProductPlans = (product) => {
    setSelectedProductForDetail(product);
  };

  const handleSelectPlanFromModal = (prod, plan, variant) => {
    setSelectedProductForDetail(null);
    setCheckoutModalData({
      product: prod,
      plan,
      variant
    });
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-300">
      
      {/* =========================================================================
          SECTION 1: HEADER / GREETING & NAVIGATION SHORTCUTS
          ========================================================================= */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#714B67] via-[#8C3A73] to-[#25232A] p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-xs mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-pink-300" aria-hidden="true" />
              <span>Customer Discovery Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
              Welcome back, {currentUser?.name || 'Valued Customer'}!
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/80 leading-relaxed">
              Explore enterprise applications, discover trending subscription plans, and manage your cloud software assets with instant web & desktop launch.
            </p>
          </div>

          {/* Quick Stat Pill Cards */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 self-start md:self-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
              <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider block">
                Active Plans
              </span>
              <span className="text-2xl font-black tabular-nums tracking-tight text-white">
                {activeSubs.length}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
              <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider block">
                Open Invoices
              </span>
              <span className="text-2xl font-black tabular-nums tracking-tight text-white">
                {pendingInvoices.length}
              </span>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      </header>

      {/* =========================================================================
          SECTION 2: TRENDING SUBSCRIPTION PLANS – AUTO CAROUSEL
          ========================================================================= */}
      <TrendingPlansCarousel
        plans={trendingPlans.length > 0 ? trendingPlans : plans}
        onSelectPlan={handleOpenPlanDetail}
      />

      {/* =========================================================================
          SECTION 3: AVAILABLE APPLICATIONS / PRODUCTS SECTION
          ========================================================================= */}
      <AvailableProductsSection
        products={allAvailableProducts}
        isLoading={isDiscoveryLoading}
        onViewProductPlans={handleOpenProductPlans}
      />

      {/* =========================================================================
          SECTION 4: MY SUBSCRIPTION SUMMARY & CUSTOMER SHORTCUTS
          ========================================================================= */}
      <section aria-label="Customer Subscription Summary and Shortcuts">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#25232A]">
              My Subscriptions & Customer Shortcuts
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Quick access to your active software subscriptions, invoices, and product access credentials.
            </p>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('subs')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#714B67] hover:underline"
            >
              <span>View All Subscriptions</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Card 1: Subscribed Products */}
          <div 
            onClick={() => onNavigateTab && onNavigateTab('products')}
            className="bg-white rounded-2xl p-5 border border-gray-200/90 hover:border-[#714B67]/40 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#714B67] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <PackageCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold text-[#25232A] group-hover:text-[#714B67] transition-colors">
                Subscribed Products
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Launch your software in browser or desktop with one-click SSO.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#714B67]">
              <span>Launch Products</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </div>
          </div>

          {/* Card 2: My Subscriptions */}
          <div 
            onClick={() => onNavigateTab && onNavigateTab('subs')}
            className="bg-white rounded-2xl p-5 border border-gray-200/90 hover:border-[#714B67]/40 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#8C3A73] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Repeat className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold text-[#25232A] group-hover:text-[#714B67] transition-colors">
                Manage Subscriptions
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Pause, renew, or review upcoming billing renewals.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#8C3A73]">
              <span>{activeSubs.length} Active {activeSubs.length === 1 ? 'Plan' : 'Plans'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </div>
          </div>

          {/* Card 3: Invoices */}
          <div 
            onClick={() => onNavigateTab && onNavigateTab('invoices')}
            className="bg-white rounded-2xl p-5 border border-gray-200/90 hover:border-[#714B67]/40 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold text-[#25232A] group-hover:text-[#714B67] transition-colors">
                Invoices & Receipts
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Download tax invoices (GSTIN) and review payment records.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>{myInvoices.length} Invoices</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </div>
          </div>

          {/* Card 4: Profile & Organization */}
          <div 
            onClick={() => onNavigateTab && onNavigateTab('profile')}
            className="bg-white rounded-2xl p-5 border border-gray-200/90 hover:border-[#714B67]/40 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold text-[#25232A] group-hover:text-[#714B67] transition-colors">
                Account & Billing Profile
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Company tax ID, billing address, and security settings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-amber-700">
              <span>Manage Profile</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </div>
          </div>

        </div>

        {/* Active Subscriptions Preview Table */}
        {activeSubs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#25232A]">
                Recent Active Subscriptions
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                Single Source of Truth: Django Backend
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {activeSubs.slice(0, 3).map((sub) => {
                const planName = sub.plan_details?.name || sub.plan_name || 'Standard Plan';
                const subLines = sub.lines || [];
                const firstProduct = subLines[0]?.product_name || 'Brightloop Software';

                return (
                  <div key={sub.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-gray-500">
                          {sub.number}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#25232A]">
                        {firstProduct} — <span className="text-gray-600 font-medium">{planName}</span>
                      </h4>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Start: {sub.start_date} • Next Billing: {sub.next_billing_date || 'Automated'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onNavigateTab && onNavigateTab('products')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#714B67] bg-[#714B67]/10 hover:bg-[#714B67] hover:text-white transition-colors"
                      >
                        Launch App
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          INTERACTIVE MODALS
          ========================================================================= */}
      {selectedProductForDetail && (
        <ProductDetailsModal
          product={selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
          onSelectPlan={handleSelectPlanFromModal}
        />
      )}

      {checkoutModalData && (
        <PurchaseCheckoutModal
          product={checkoutModalData.product}
          plan={checkoutModalData.plan}
          variant={checkoutModalData.variant}
          onClose={() => setCheckoutModalData(null)}
          onOpenInvoice={onOpenInvoice}
          onGoToSubscriptions={() => {
            setCheckoutModalData(null);
            if (onNavigateTab) onNavigateTab('subs');
          }}
        />
      )}

    </div>
  );
}
