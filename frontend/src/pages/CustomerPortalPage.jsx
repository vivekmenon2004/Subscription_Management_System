import React, { useState } from 'react';
import { 
  CheckCircle, Pause, Play, RefreshCw, XCircle,
  FileText, Check,
  Globe, Monitor, ExternalLink, ShieldCheck, Key, Laptop, AlertOctagon,
  Copy, CheckCircle2, Clock, Sparkles, HelpCircle, Layers,
  Download, AlertCircle, ChevronLeft, ChevronRight, LayoutGrid, Sliders
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';

export function CustomerPortalPage({ onOpenInvoice }) {
  const { 
    currentUser, 
    subscriptions = [], 
    invoices = [], 
    products = [],
    togglePauseSubscription, 
    renewSubscription, 
    closeSubscription,
    launchProductWeb,
    launchProductDesktop
  } = useData();

  // AUTH-6: Scoped to customer only
  const mySubscriptions = (subscriptions || []).filter(s => s.customer === currentUser?.id || currentUser?.role !== 'customer');
  const myInvoices = (invoices || []).filter(inv => inv.customer === currentUser?.id || currentUser?.role !== 'customer');
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'subs' | 'invoices' | 'profile'
  const [subViewMode, setSubViewMode] = useState('slides'); // 'slides' | 'grid'
  const [slideIndex, setSlideIndex] = useState(0);

  // Launch state & feedback
  const [launchingProdId, setLaunchingProdId] = useState(null);
  const [desktopModal, setDesktopModal] = useState(null); // { prod, sub, code, protocolUrl, downloadUrl }
  const [webSuccessModal, setWebSuccessModal] = useState(null); // { prod, sub, launchUrl, token, entitlements }
  const [launchError, setLaunchError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Profile Form state
  const [name, setName] = useState(currentUser?.name || '');
  const [company, setCompany] = useState(currentUser?.customer_profile?.company_name || '');
  const [phone, setPhone] = useState(currentUser?.customer_profile?.phone || '');
  const [password, setPassword] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // AUTH-2 Password rule live checklist
  const hasMinLength = password.length >= 9;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 4000);
  };

  // Derive subscribed products from customer subscriptions
  const subscribedProducts = [];
  const seenKeys = new Set();

  mySubscriptions.forEach(sub => {
    // Check payment status on subscription's invoices
    const subInvoices = myInvoices.filter(inv => inv.subscription === sub.id || inv.subscription_number === sub.number);
    const hasOverdue = subInvoices.some(inv => inv.is_overdue);
    const hasUnpaid = subInvoices.some(inv => Number(inv.outstanding_balance) > 0);
    const overdueInvoice = subInvoices.find(inv => inv.is_overdue);

    let paymentStatus = 'Current';
    if (hasOverdue) paymentStatus = 'Overdue';
    else if (hasUnpaid) paymentStatus = 'Pending';
    else if (subInvoices.length > 0) paymentStatus = 'Paid';

    const isSubActive = sub.status === 'Active' && !sub.is_paused && (!sub.expiry_date || new Date(sub.expiry_date) >= new Date());

    (sub.lines || []).forEach(line => {
      const prodId = line.product;
      const catalogProd = products.find(p => p.id === prodId) || {};
      const key = `${prodId}_${sub.id}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const prodName = line.product_name || catalogProd.name || 'Software Product';
      const prodType = catalogProd.type || 'Software';
      const prodDesc = catalogProd.description || catalogProd.notes || 'Subscribed Brightloop Software module.';
      const iconUrl = catalogProd.icon_url || '';
      const webUrl = catalogProd.web_url || '';
      const desktopDownloadUrl = catalogProd.desktop_download_url || 'https://downloads.brightloop.io/releases/brightloop-desktop-setup-v2.4.exe';
      const appProtocol = catalogProd.app_protocol || 'brightloop';
      const isAvailable = catalogProd.is_available !== false;
      const isAccessEnabled = catalogProd.is_access_enabled !== false;
      const entitlements = {
        tier: sub.plan_details?.name || 'Standard',
        billing_period: sub.plan_details?.billing_period || 'Monthly',
        ...(catalogProd.entitlements || {}),
        ...(sub.plan_details?.entitlements || {})
      };

      // Determine product access permission
      let accessAllowed = true;
      let accessReason = 'Active';

      if (!isAvailable) {
        accessAllowed = false;
        accessReason = 'Product is temporarily unavailable';
      } else if (!isAccessEnabled) {
        accessAllowed = false;
        accessReason = 'Access disabled by system administrator';
      } else if (sub.status !== 'Active') {
        accessAllowed = false;
        accessReason = `Subscription is ${sub.status}`;
      } else if (sub.is_paused) {
        accessAllowed = false;
        accessReason = 'Subscription is paused';
      } else if (sub.expiry_date && new Date(sub.expiry_date) < new Date()) {
        accessAllowed = false;
        accessReason = `Subscription expired on ${sub.expiry_date}`;
      } else if (hasOverdue) {
        accessAllowed = false;
        accessReason = `Access suspended: Overdue balance ₹${overdueInvoice?.outstanding_balance || ''}`;
      }

      subscribedProducts.push({
        product_id: prodId,
        product_name: prodName,
        product_type: prodType,
        description: prodDesc,
        icon_url: iconUrl,
        web_url: webUrl,
        desktop_download_url: desktopDownloadUrl,
        app_protocol: appProtocol,
        is_available: isAvailable,
        is_access_enabled: isAccessEnabled,
        subscription: sub,
        variant_name: line.variant_name,
        payment_status: paymentStatus,
        has_overdue: hasOverdue,
        overdue_invoice: overdueInvoice,
        access_allowed: accessAllowed,
        access_reason: accessReason,
        is_sub_active: isSubActive,
        entitlements
      });
    });
  });

  const activeProducts = subscribedProducts.filter(p => p.is_sub_active);
  const inactiveProducts = subscribedProducts.filter(p => !p.is_sub_active);

  // Button A: Open in Web Handler
  const handleOpenInWeb = async (item) => {
    setLaunchError(null);
    setLaunchingProdId(item.product_id);
    try {
      const res = await launchProductWeb(item.product_id, item.subscription.id);
      setWebSuccessModal({
        prod: item,
        sub: item.subscription,
        launchUrl: res.launch_url,
        token: res.token,
        entitlements: res.entitlements
      });
      // Try opening in new tab
      if (res.launch_url) {
        window.open(res.launch_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setLaunchError(`Web Access Denied: ${err.message}`);
    } finally {
      setLaunchingProdId(null);
    }
  };

  // Button B: Open in App Handler
  const handleOpenInApp = async (item) => {
    setLaunchError(null);
    setLaunchingProdId(item.product_id);
    try {
      const res = await launchProductDesktop(item.product_id, item.subscription.id);
      
      // Dispatch protocol directly
      if (res.protocol_url) {
        try {
          const link = document.createElement('a');
          link.href = res.protocol_url;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          setTimeout(() => document.body.removeChild(link), 1000);
        } catch (e) {
          console.warn('[DesktopLaunch] Direct dispatch warning:', e);
        }
      }

      // Show launch modal with ticket details & fallback options
      setDesktopModal({
        prod: item,
        sub: item.subscription,
        code: res.code,
        protocolUrl: res.protocol_url,
        downloadUrl: res.download_url || item.desktop_download_url,
        expiresIn: res.expires_in_seconds || 120,
        appProtocol: res.app_protocol || 'brightloop'
      });
    } catch (err) {
      setLaunchError(`Desktop Access Denied: ${err.message}`);
    } finally {
      setLaunchingProdId(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Customer Header */}
      <div className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#714B67] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {(currentUser?.name || 'Customer').charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#25232A]">{currentUser?.name || 'Customer'}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5EEF3] text-[#714B67] border border-[#E8DCE5]">
                Self-Service Portal
              </span>
            </div>
            <p className="text-xs text-[#6E6B75] mt-0.5">
              {currentUser?.customer_profile?.company_name ? `${currentUser.customer_profile.company_name} · ` : ''}{currentUser?.email || ''}
            </p>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center gap-1.5 bg-[#F7F6F8] p-1 rounded-xl border border-[#E8E6EB] self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'products' ? 'bg-white text-[#714B67] shadow-sm' : 'text-[#6E6B75] hover:text-[#25232A]'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            My Subscribed Products ({subscribedProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('subs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'subs' ? 'bg-white text-[#714B67] shadow-sm' : 'text-[#6E6B75]'}`}
          >
            My Subscriptions ({mySubscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'invoices' ? 'bg-white text-[#714B67] shadow-sm' : 'text-[#6E6B75]'}`}
          >
            My Invoices ({myInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'profile' ? 'bg-white text-[#714B67] shadow-sm' : 'text-[#6E6B75]'}`}
          >
            My Profile
          </button>
        </div>
      </div>

      {/* Global Launch Error Alert */}
      {launchError && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-2xl text-xs text-[#991B1B] flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span className="font-medium">{launchError}</span>
          </div>
          <button onClick={() => setLaunchError(null)} className="text-[#991B1B] hover:font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 0: MY SUBSCRIBED PRODUCTS (WEB + WINDOWS DESKTOP ACCESS) */}
      {/* ======================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#714B67] to-[#A64D87] text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#EAE8ED]" />
                <h3 className="text-lg font-bold">Customer Product Access Authority</h3>
              </div>
              <p className="text-xs text-[#EAE8ED] mt-1 max-w-xl">
                Securely launch your subscribed software solutions in browser or installed Windows Desktop client.
                Authentication, active status, payment terms, and entitlements are verified in real time by Django.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/20 self-start md:self-auto">
              <Key className="w-4 h-4 text-white" />
              <span>Single-Sign-On Verified</span>
            </div>
          </div>

          {/* Section 1: Active Subscribed Products */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#25232A] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Active Subscribed Products ({activeProducts.length})
              </h4>
              <span className="text-xs text-[#6E6B75]">Ready for Web & Windows Desktop Launch</span>
            </div>

            {activeProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8E6EB] p-8 text-center text-xs text-[#6E6B75] shadow-card">
                <Layers className="w-8 h-8 text-[#8C8895] mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-[#25232A]">No active software products found</p>
                <p className="mt-1">When your subscription is confirmed and paid, subscribed software products will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeProducts.map(item => (
                  <div 
                    key={`${item.product_id}_${item.subscription.id}`}
                    className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card flex flex-col justify-between space-y-4 hover:border-[#714B67]/40 transition-colors"
                  >
                    <div>
                      {/* Top Bar: Icon, Name, and Status Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.icon_url ? (
                            <img 
                              src={item.icon_url} 
                              alt={item.product_name}
                              className="w-12 h-12 rounded-xl object-cover border border-[#E8E6EB] shadow-xs" 
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#F5EEF3] text-[#714B67] flex items-center justify-center font-bold text-lg border border-[#E8DCE5]">
                              <Laptop className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[#FAF9FB] text-[#714B67] border border-[#E8E6EB]">
                              {item.product_type}
                            </span>
                            <h4 className="font-bold text-base text-[#25232A] mt-1">{item.product_name}</h4>
                            {item.variant_name && (
                              <span className="text-xs text-[#6E6B75]">Edition: {item.variant_name}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={item.subscription.status} isPaused={item.subscription.is_paused} />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            item.payment_status === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : item.payment_status === 'Overdue'
                              ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            Payment: {item.payment_status}
                          </span>
                        </div>
                      </div>

                      {/* Product Description */}
                      <p className="text-xs text-[#6E6B75] mt-3 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Subscription Metadata Grid */}
                    <div className="bg-[#FAF9FB] p-3 rounded-xl border border-[#E8E6EB] space-y-1.5 text-xs">
                      <div className="flex justify-between text-[#6E6B75]">
                        <span>Subscription Plan:</span>
                        <span className="font-semibold text-[#25232A]">
                          {item.subscription.plan_details?.name || 'Standard'} ({item.subscription.plan_details?.billing_period})
                        </span>
                      </div>
                      <div className="flex justify-between text-[#6E6B75]">
                        <span>Subscription ID:</span>
                        <span className="font-mono font-medium text-[#714B67]">{item.subscription.number}</span>
                      </div>
                      <div className="flex justify-between text-[#6E6B75]">
                        <span>Purchase Date:</span>
                        <span className="text-[#25232A]">{item.subscription.start_date || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-[#6E6B75]">
                        <span>Expiry Date:</span>
                        <span className="font-medium text-[#25232A]">{item.subscription.expiry_date || 'Ongoing Recurring'}</span>
                      </div>
                      <div className="flex justify-between text-[#6E6B75]">
                        <span>Next Billing Date:</span>
                        <span className="text-[#25232A]">{item.subscription.next_billing_date || 'N/A'}</span>
                      </div>

                      {/* Entitlements snippet */}
                      {item.entitlements && (
                        <div className="pt-2 border-t border-[#E8E6EB] flex items-center justify-between text-[11px]">
                          <span className="text-[#8C8895]">Entitlements:</span>
                          <span className="font-medium text-[#714B67] truncate max-w-[240px]">
                            Tier: {item.entitlements.tier || 'Pro'} · Max Users: {item.entitlements.max_users || 5}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Overdue Payment Warning */}
                    {item.has_overdue && (
                      <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl flex items-center justify-between text-xs text-[#991B1B]">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                          <span>Outstanding invoice balance requires settlement before launch.</span>
                        </div>
                        {item.overdue_invoice && (
                          <button 
                            onClick={() => onOpenInvoice(item.overdue_invoice)}
                            className="font-bold underline hover:text-[#7F1D1D] shrink-0"
                          >
                            Pay ₹{item.overdue_invoice.outstanding_balance}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Action Launch Buttons (Requirement 4: Button A & Button B) */}
                    <div className="pt-2 border-t border-[#E8E6EB] space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Button A: Open in Web */}
                        <Button
                          variant="primary"
                          size="md"
                          icon={Globe}
                          className="w-full justify-center"
                          disabled={launchingProdId === item.product_id}
                          onClick={() => {
                            if (!item.access_allowed) {
                              setLaunchError(`Web Access Restricted: ${item.access_reason}`);
                              return;
                            }
                            handleOpenInWeb(item);
                          }}
                        >
                          {launchingProdId === item.product_id ? 'Verifying...' : 'Open in Web'}
                        </Button>

                        {/* Button B: Open in App (Windows Desktop) */}
                        <Button
                          variant="inverted"
                          size="md"
                          icon={Monitor}
                          className="w-full justify-center"
                          disabled={launchingProdId === item.product_id}
                          onClick={() => {
                            if (!item.access_allowed) {
                              setLaunchError(`Desktop Access Restricted: ${item.access_reason}`);
                              return;
                            }
                            handleOpenInApp(item);
                          }}
                        >
                          {launchingProdId === item.product_id ? 'Generating...' : 'Open in App'}
                        </Button>
                      </div>

                      {/* Desktop installer fallback option */}
                      <div className="flex items-center justify-between text-[11px] text-[#6E6B75] px-1 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Key className="w-3 h-3 text-[#714B67]" />
                          Single-use PKCE ticket handoff
                        </span>
                        <a 
                          href={item.desktop_download_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[#714B67] hover:underline flex items-center gap-1 font-medium"
                        >
                          <Download className="w-3 h-3" />
                          Download Windows App (.exe)
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Inactive & Expired Products */}
          {inactiveProducts.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-[#E8E6EB]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#8C8895] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                  Past & Inactive Subscribed Products ({inactiveProducts.length})
                </h4>
                <span className="text-xs text-[#8C8895]">Requires Subscription Renewal or Resumption</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inactiveProducts.map(item => (
                  <div 
                    key={`inactive_${item.product_id}_${item.subscription.id}`}
                    className="bg-white/70 rounded-2xl border border-[#E8E6EB] p-5 shadow-xs flex flex-col justify-between space-y-3 opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-[#25232A]">{item.product_name}</h4>
                        <p className="text-xs text-[#6E6B75] mt-0.5">{item.subscription.plan_details?.name}</p>
                      </div>
                      <StatusBadge status={item.subscription.status} isPaused={item.subscription.is_paused} />
                    </div>

                    <div className="p-3 bg-[#F7F6F8] rounded-xl text-xs space-y-1 text-[#6E6B75]">
                      <div className="flex justify-between">
                        <span>Access Status:</span>
                        <span className="font-semibold text-[#DC2626]">{item.access_reason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subscription:</span>
                        <span className="font-mono text-[#25232A]">{item.subscription.number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expiry Date:</span>
                        <span>{item.subscription.expiry_date || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Self-service renewal / resume actions */}
                    <div className="flex items-center justify-between pt-1">
                      {item.subscription.is_paused ? (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          icon={Play}
                          onClick={() => togglePauseSubscription(item.subscription.id)}
                        >
                          Resume Subscription
                        </Button>
                      ) : (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          icon={RefreshCw}
                          onClick={() => renewSubscription(item.subscription.id)}
                        >
                          Renew Subscription
                        </Button>
                      )}
                      <span className="text-[11px] text-[#8C8895]">1-Click Self-Service</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: MY SUBSCRIPTIONS */}
      {/* ======================================================== */}
      {activeTab === 'subs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#25232A]">Active & Past Subscriptions</h3>
              <p className="text-xs text-[#6E6B75] mt-0.5">Manage recurring terms, renewals, and self-service lifecycle actions.</p>
            </div>

            {/* View Mode Toggle: Slide Animation vs Grid View */}
            {mySubscriptions.length > 0 && (
              <div className="flex items-center gap-1 bg-[#F3F2F5] p-1 rounded-xl border border-[#E8E6EB] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSubViewMode('slides')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    subViewMode === 'slides' ? 'bg-[#714B67] text-white shadow-xs' : 'text-[#6E6B75] hover:text-[#25232A]'
                  }`}
                  aria-label="View as Slide Animation"
                >
                  <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Slide View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    subViewMode === 'grid' ? 'bg-[#714B67] text-white shadow-xs' : 'text-[#6E6B75] hover:text-[#25232A]'
                  }`}
                  aria-label="View as Card Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Grid View</span>
                </button>
              </div>
            )}
          </div>

          {mySubscriptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E6EB] p-8 text-center text-xs text-[#6E6B75] shadow-card">
              <Layers className="w-8 h-8 text-[#8C8895] mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-[#25232A]">No subscriptions found</p>
              <p className="mt-1">You currently have no active or archived subscriptions associated with this account.</p>
            </div>
          ) : subViewMode === 'slides' ? (
            /* ======================================================== */
            /* SLIDE ANIMATION VIEW (Carousel with animated sliding) */
            /* ======================================================== */
            <div className="bg-white rounded-2xl border border-[#E8E6EB] p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between text-xs border-b border-[#E8E6EB] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#714B67]"></span>
                  <span className="font-semibold text-[#25232A]">Subscription Slide Animation</span>
                  <span className="text-[#6E6B75]">
                    (Showing {Math.min(slideIndex + 1, mySubscriptions.length)} of {mySubscriptions.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSlideIndex(prev => (prev > 0 ? prev - 1 : mySubscriptions.length - 1))}
                    className="p-1.5 rounded-lg border border-[#D7D4DC] hover:bg-[#F3F2F5] text-[#25232A] transition-colors"
                    aria-label="Previous subscription slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlideIndex(prev => (prev < mySubscriptions.length - 1 ? prev + 1 : 0))}
                    className="p-1.5 rounded-lg border border-[#D7D4DC] hover:bg-[#F3F2F5] text-[#25232A] transition-colors"
                    aria-label="Next subscription slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Animated Slide Stage */}
              <div className="overflow-hidden relative">
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${(slideIndex % mySubscriptions.length) * 100}%)` }}
                >
                  {mySubscriptions.map(sub => (
                    <div 
                      key={sub.id} 
                      className="w-full shrink-0 px-2"
                    >
                      <div className="bg-gradient-to-br from-[#FAF9FB] via-white to-[#FAF9FB] rounded-2xl border border-[#E8E6EB] p-6 space-y-5 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-[#714B67] bg-[#F5EEF3] px-2.5 py-1 rounded-md border border-[#E8DCE5]">
                                {sub.number}
                              </span>
                              <StatusBadge status={sub.status} isPaused={sub.is_paused} />
                            </div>
                            <h4 className="font-bold text-xl text-[#25232A] mt-3">{sub.plan_details?.name || 'Custom Plan'}</h4>
                            <p className="text-2xl font-black text-[#25232A] mt-1 tabular-nums">
                              ₹{sub.total_recurring_amount}
                              <span className="text-xs font-normal text-[#6E6B75]"> / {sub.plan_details?.billing_period}</span>
                            </p>
                          </div>

                          <div className="bg-white p-3.5 rounded-xl border border-[#E8E6EB] space-y-1.5 text-xs sm:w-72 shadow-xs">
                            <div className="flex justify-between text-[#6E6B75]">
                              <span>Next Billing Date:</span>
                              <span className="font-medium text-[#25232A]">{sub.next_billing_date || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-[#6E6B75]">
                              <span>Expiry Date:</span>
                              <span className="font-medium text-[#25232A]">{sub.expiry_date || 'Ongoing Recurring'}</span>
                            </div>
                            <div className="flex justify-between text-[#6E6B75]">
                              <span>Included Items:</span>
                              <span className="font-medium text-[#25232A]">{sub.lines?.length || 0} service line(s)</span>
                            </div>
                          </div>
                        </div>

                        {/* Line items snippet */}
                        {sub.lines && sub.lines.length > 0 && (
                          <div className="pt-3 border-t border-[#E8E6EB]">
                            <p className="text-xs font-semibold text-[#6E6B75] mb-2">Subscribed Services & Editions:</p>
                            <div className="flex flex-wrap gap-2">
                              {sub.lines.map((ln, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E8E6EB] rounded-lg text-xs font-medium text-[#25232A]"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#714B67]" />
                                  {ln.product_name || 'Software Product'}
                                  {ln.variant_name && <span className="text-[#8C8895]">({ln.variant_name})</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Self service controls (PORT-3) */}
                        {sub.status === 'Active' && (
                          <div className="pt-3 border-t border-[#E8E6EB] flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-[#6E6B75]">Self-Service Lifecycle Actions:</span>
                            <div className="flex items-center gap-2">
                              {sub.plan_details?.pausable && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon={sub.is_paused ? Play : Pause}
                                  onClick={() => togglePauseSubscription(sub.id)}
                                >
                                  {sub.is_paused ? 'Resume Subscription' : 'Pause Subscription'}
                                </Button>
                              )}
                              {sub.plan_details?.renewable && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon={RefreshCw}
                                  onClick={() => renewSubscription(sub.id)}
                                >
                                  Renew Now
                                </Button>
                              )}
                              {sub.plan_details?.closable && (
                                <Button
                                  variant="outlined"
                                  size="sm"
                                  icon={XCircle}
                                  className="text-[#DC2626] border-[#FECACA] hover:bg-[#FEE2E2]"
                                  onClick={() => closeSubscription(sub.id, 'Cancelled by customer via self-service portal')}
                                >
                                  Cancel Subscription
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dot Indicators */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {mySubscriptions.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      (slideIndex % mySubscriptions.length) === idx ? 'w-6 bg-[#714B67]' : 'w-2 bg-[#D7D4DC] hover:bg-[#8C8895]'
                    }`}
                    aria-label={`Go to subscription slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* GRID VIEW (Original 2-column cards) */
            /* ======================================================== */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mySubscriptions.map(sub => (
                <div key={sub.id} className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-semibold text-[#714B67]">{sub.number}</span>
                      <StatusBadge status={sub.status} isPaused={sub.is_paused} />
                    </div>
                    <h4 className="font-bold text-base text-[#25232A] mt-2">{sub.plan_details?.name}</h4>
                    <p className="text-xl font-black text-[#25232A] mt-1 tabular-nums">
                      ₹{sub.total_recurring_amount}
                      <span className="text-xs font-normal text-[#6E6B75]"> / {sub.plan_details?.billing_period}</span>
                    </p>
                  </div>

                  <div className="bg-[#FAF9FB] p-3 rounded-xl border border-[#E8E6EB] space-y-1 text-xs">
                    <div className="flex justify-between text-[#6E6B75]">
                      <span>Next Billing Date:</span>
                      <span className="font-medium text-[#25232A]">{sub.next_billing_date || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-[#6E6B75]">
                      <span>Expiry Date:</span>
                      <span className="font-medium text-[#25232A]">{sub.expiry_date || 'Ongoing'}</span>
                    </div>
                    <div className="flex justify-between text-[#6E6B75]">
                      <span>Included Lines:</span>
                      <span className="font-medium text-[#25232A]">{sub.lines.length} service(s)</span>
                    </div>
                  </div>

                  {/* Self service controls (PORT-3) */}
                  {sub.status === 'Active' && (
                    <div className="pt-2 border-t border-[#E8E6EB] flex items-center justify-between gap-2">
                      {sub.plan_details?.pausable && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={sub.is_paused ? Play : Pause}
                          onClick={() => togglePauseSubscription(sub.id)}
                        >
                          {sub.is_paused ? 'Resume' : 'Pause'}
                        </Button>
                      )}
                      {sub.plan_details?.renewable && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={RefreshCw}
                          onClick={() => renewSubscription(sub.id)}
                        >
                          Renew
                        </Button>
                      )}
                      {sub.plan_details?.closable && (
                        <Button
                          variant="outlined"
                          size="sm"
                          icon={XCircle}
                          className="text-[#DC2626] border-[#FECACA] hover:bg-[#FEE2E2]"
                          onClick={() => closeSubscription(sub.id, 'Cancelled by customer via self-service portal')}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MY INVOICES & PAYMENTS */}
      {/* ======================================================== */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-[#E8E6EB] shadow-card overflow-hidden">
          <div className="p-4 border-b border-[#E8E6EB] flex justify-between items-center">
            <h3 className="font-semibold text-sm text-[#25232A]">Billing & Invoices</h3>
            <span className="text-xs text-[#6E6B75]">{myInvoices.length} invoices found</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FB] text-[#6E6B75] border-b border-[#E8E6EB]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Invoice #</th>
                  <th className="py-3 px-4 font-semibold">Issue Date</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Total (₹)</th>
                  <th className="py-3 px-4 font-semibold text-right">Balance Due</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6EB]">
                {myInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-[#FAF9FB]/60">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#714B67]">{inv.number}</td>
                    <td className="py-3.5 px-4 text-[#6E6B75]">{inv.issue_date}</td>
                    <td className="py-3.5 px-4 text-[#25232A]">{inv.due_date}</td>
                    <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#25232A]">₹{inv.total}</td>
                    <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#DC2626]">
                      ₹{inv.outstanding_balance}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={inv.status} isOverdue={inv.is_overdue} daysOverdue={inv.days_overdue} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button variant="secondary" size="sm" icon={FileText} onClick={() => onOpenInvoice(inv)}>
                        View & PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MY PROFILE & PASSWORD */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-[#E8E6EB] p-6 shadow-card max-w-xl space-y-6">
          <div>
            <h3 className="font-semibold text-base text-[#25232A]">Profile & Security Settings</h3>
            <p className="text-xs text-[#6E6B75] mt-0.5">Update personal details and change account password.</p>
          </div>

          {profileSaved && (
            <div className="p-3 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Profile and security updated successfully!
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#6E6B75] mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#6E6B75] mb-1">Company Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#6E6B75] mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
              />
            </div>

            {/* Change Password with AUTH-2 live checklist */}
            <div className="pt-4 border-t border-[#E8E6EB] space-y-3">
              <label className="block font-semibold text-[#25232A]">
                Change Password <span className="font-normal text-[#8C8895]">(Leave blank to keep current)</span>
              </label>
              <input
                type="password"
                placeholder="Enter new strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D7D4DC] focus:border-[#714B67] focus:outline-none"
              />

              {password.length > 0 && (
                <div className="bg-[#FAF9FB] p-3 rounded-xl border border-[#E8E6EB] space-y-1.5 text-[11px]">
                  <p className="font-semibold text-[#25232A]">AUTH-2 Password Rule Requirements:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-700' : 'text-gray-500'}`}>
                      <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-green-600' : 'text-gray-300'}`} />
                      <span>Longer than 8 characters (9+)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-green-700' : 'text-gray-500'}`}>
                      <Check className={`w-3.5 h-3.5 ${hasUpper ? 'text-green-600' : 'text-gray-300'}`} />
                      <span>At least one uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLower ? 'text-green-700' : 'text-gray-500'}`}>
                      <Check className={`w-3.5 h-3.5 ${hasLower ? 'text-green-600' : 'text-gray-300'}`} />
                      <span>At least one lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-green-700' : 'text-gray-500'}`}>
                      <Check className={`w-3.5 h-3.5 ${hasSpecial ? 'text-green-600' : 'text-gray-300'}`} />
                      <span>At least one special char (!@#$)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={password.length > 0 && !isPasswordValid}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: WINDOWS DESKTOP LAUNCH HANDOFF & FALLBACK MODAL */}
      {/* ======================================================== */}
      {desktopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-elevated border border-[#E8E6EB] p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25232A] text-white flex items-center justify-center shadow-xs">
                  <Monitor className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#25232A]">Launching Windows Desktop Client</h3>
                  <p className="text-xs text-[#6E6B75] mt-0.5">{desktopModal.prod.product_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setDesktopModal(null)}
                className="text-[#8C8895] hover:text-[#25232A] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Protocol Trigger Status Box */}
            <div className="p-4 bg-[#FAF9FB] border border-[#E8E6EB] rounded-xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom Protocol Dispatched to Windows</span>
              </div>
              
              <div className="font-mono text-[11px] bg-white p-2.5 rounded-lg border border-[#E8E6EB] text-[#714B67] break-all select-all flex items-center justify-between gap-2">
                <span className="truncate">{desktopModal.protocolUrl}</span>
                <button 
                  onClick={() => copyToClipboard(desktopModal.protocolUrl)}
                  className="p-1 rounded hover:bg-gray-100 text-[#8C8895] hover:text-[#25232A] shrink-0"
                  title="Copy Protocol URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6E6B75]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#8C8895]" />
                  Code Expires in {desktopModal.expiresIn}s (Single-Use Only)
                </span>
                {copiedCode && <span className="text-emerald-600 font-medium">Copied!</span>}
              </div>
            </div>

            {/* Application not installed / Fallback options (Requirement 5) */}
            <div className="p-4 bg-[#F5EEF3] border border-[#E8DCE5] rounded-xl space-y-2 text-xs">
              <p className="font-bold text-[#714B67] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                Application not launching?
              </p>
              <p className="text-[#6E6B75]">
                If the desktop application did not open automatically, make sure Brightloop Desktop is installed on this PC and the protocol is registered.
              </p>
              
              <div className="flex items-center gap-2 pt-2">
                <a
                  href={desktopModal.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#714B67] text-white font-medium hover:bg-[#5C3C54] transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Windows App (.exe)
                </a>
                <button
                  onClick={() => {
                    const el = document.createElement('a');
                    el.href = desktopModal.protocolUrl;
                    el.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D7D4DC] text-[#25232A] font-medium hover:bg-[#FAF9FB] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Retry Protocol Open
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="md" onClick={() => setDesktopModal(null)}>
                Done / Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: WEB LAUNCH SESSION FEEDBACK MODAL */}
      {/* ======================================================== */}
      {webSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-elevated border border-[#E8E6EB] p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#714B67] text-white flex items-center justify-center shadow-xs">
                  <Globe className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#25232A]">Web Session Authenticated</h3>
                  <p className="text-xs text-[#6E6B75] mt-0.5">{webSuccessModal.prod.product_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setWebSuccessModal(null)}
                className="text-[#8C8895] hover:text-[#25232A] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl space-y-1 text-xs text-[#15803D]">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Subscription & Payment Verified by Django Authority
              </p>
              <p className="text-[#166534]">
                A cryptographically secure launch session token was created (valid for 15 minutes). The web application has been opened in a new tab.
              </p>
            </div>

            <div className="bg-[#FAF9FB] p-3 rounded-xl border border-[#E8E6EB] text-xs space-y-2">
              <div className="flex justify-between text-[#6E6B75]">
                <span>Customer:</span>
                <span className="font-medium text-[#25232A]">{currentUser?.name || 'Customer'} ({currentUser?.email || ''})</span>
              </div>
              <div className="flex justify-between text-[#6E6B75]">
                <span>Subscription:</span>
                <span className="font-mono text-[#714B67]">{webSuccessModal.sub.number}</span>
              </div>
              <div className="flex justify-between text-[#6E6B75]">
                <span>Entitlement Tier:</span>
                <span className="font-semibold text-[#25232A]">{webSuccessModal.entitlements?.tier || 'Professional'}</span>
              </div>
              <div className="pt-2 border-t border-[#E8E6EB]">
                <span className="text-[#8C8895] block mb-1">Launch URL:</span>
                <div className="font-mono text-[11px] bg-white p-2 rounded-lg border border-[#E8E6EB] truncate text-[#714B67]">
                  {webSuccessModal.launchUrl}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="secondary" 
                size="md" 
                onClick={() => setWebSuccessModal(null)}
              >
                Close
              </Button>
              <Button 
                variant="primary" 
                size="md" 
                icon={ExternalLink}
                onClick={() => window.open(webSuccessModal.launchUrl, '_blank', 'noopener,noreferrer')}
              >
                Reopen Web App
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
