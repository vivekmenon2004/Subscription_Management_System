import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  apiRequest,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  saveAuthTokens
} from '../services/api';

const DataContext = createContext(null);

export const PRESET_USERS = {
  admin: {
    id: 1,
    name: 'Admin User',
    email: 'admin@brightloop.io',
    role: 'admin',
    customer_profile: null
  },
  staff: {
    id: 2,
    name: 'Sarah Jenkins',
    email: 'staff@brightloop.io',
    role: 'staff',
    customer_profile: null
  },
  customer: {
    id: 3,
    name: 'Rahul Sharma',
    email: 'customer@acmecorp.com',
    role: 'customer',
    customer_profile: {
      company_name: 'Acme Corp Pvt Ltd',
      phone: '+91 98765 43210',
      billing_address: '42 Brigade Road, Bangalore 560001',
      tax_id: 'GSTIN29AAACA9876Q1Z0'
    }
  }
};

// Initial state matching our seeded backend
const INITIAL_TAXES = [
  { id: 1, name: 'GST 18%', rate: '18.00', is_inclusive: false, is_active: true },
  { id: 2, name: 'GST 5%', rate: '5.00', is_inclusive: false, is_active: true }
];

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Brightloop Cloud ERP',
    type: 'Software',
    sales_price: '1000.00',
    cost_price: '400.00',
    notes: 'Core enterprise resource planning module',
    description: 'Enterprise Cloud Resource Planning suite with comprehensive invoicing, ledger, and inventory.',
    icon_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=128&q=80',
    web_url: 'http://localhost:5173/app/cloud-erp',
    desktop_download_url: 'https://downloads.brightloop.io/releases/brightloop-desktop-setup-v2.4.exe',
    app_protocol: 'brightloop',
    is_available: true,
    is_access_enabled: true,
    entitlements: { features: ['general_ledger', 'invoice_management', 'inventory_tracking', 'export_pdf'], max_users: 10 },
    default_tax: 1,
    default_tax_name: 'GST 18%',
    default_tax_rate: '18.00',
    margin: '600.00',
    has_cost_warning: false,
    is_active: true,
    variants: [
      { id: 1, attribute: 'Brand', value: 'Odoo', extra_price: '560.00', effective_unit_price: '1560.00' },
      { id: 2, attribute: 'Brand', value: 'Standard', extra_price: '0.00', effective_unit_price: '1000.00' }
    ]
  },
  {
    id: 2,
    name: '24/7 Priority Support SLA',
    type: 'Service',
    sales_price: '3000.00',
    cost_price: '1200.00',
    notes: '1-hour SLA response time guarantee',
    description: '24/7 dedicated enterprise technical support with guaranteed 1-hour SLA response.',
    icon_url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=128&q=80',
    web_url: 'http://localhost:5173/app/support-portal',
    desktop_download_url: '',
    app_protocol: '',
    is_available: true,
    is_access_enabled: true,
    entitlements: { features: ['ticket_priority', 'phone_support', 'sla_guarantee'] },
    default_tax: 1,
    default_tax_name: 'GST 18%',
    default_tax_rate: '18.00',
    margin: '1800.00',
    has_cost_warning: false,
    is_active: true,
    variants: []
  },
  {
    id: 3,
    name: 'AI Insights & Forecasts',
    type: 'Add-on',
    sales_price: '1500.00',
    cost_price: '500.00',
    notes: 'Automated predictive forecasting module',
    description: 'AI-driven forecasting and cashflow predictions for recurring revenue businesses.',
    icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
    web_url: 'http://localhost:5173/app/ai-forecasts',
    desktop_download_url: 'https://downloads.brightloop.io/releases/brightloop-desktop-setup-v2.4.exe',
    app_protocol: 'brightloop',
    is_available: true,
    is_access_enabled: true,
    entitlements: { features: ['ai_prediction', 'cashflow_charting', 'anomaly_detection'] },
    default_tax: 1,
    default_tax_name: 'GST 18%',
    default_tax_rate: '18.00',
    margin: '1000.00',
    has_cost_warning: false,
    is_active: true,
    variants: []
  }
];

const INITIAL_PLANS = [
  {
    id: 1,
    name: 'Standard Monthly Plan',
    price: '4999.00',
    billing_period: 'monthly',
    min_quantity: 1,
    available_from: '2026-01-01',
    auto_close: false,
    closable: true,
    pausable: true,
    renewable: true,
    is_active: true
  },
  {
    id: 2,
    name: 'Enterprise Annual Plan',
    price: '49999.00',
    billing_period: 'yearly',
    min_quantity: 1,
    available_from: '2026-01-01',
    auto_close: false,
    closable: true,
    pausable: true,
    renewable: true,
    is_active: true
  }
];

const INITIAL_DISCOUNTS = [
  {
    id: 1,
    name: 'Early Bird 10% Off',
    type: 'percentage',
    value: '10.00',
    min_purchase: '1000.00',
    min_quantity: 1,
    usage_limit: 50,
    times_used: 2,
    scope: 'all',
    is_active: true,
    is_eligible_now: true
  }
];

const INITIAL_TEMPLATES = [
  {
    id: 1,
    name: 'Standard ERP + SLA Template',
    validity_days: 30,
    plan: 1,
    plan_name: 'Standard Monthly Plan',
    is_active: true,
    lines: [
      { id: 1, product: 1, product_name: 'Brightloop Cloud ERP', variant: 1, variant_name: 'Odoo', quantity: 1 },
      { id: 2, product: 2, product_name: '24/7 Priority Support SLA', variant: null, variant_name: null, quantity: 1 }
    ]
  }
];

const INITIAL_SUBSCRIPTIONS = [
  {
    id: 1,
    number: 'SUB-000001',
    customer: 3,
    customer_details: PRESET_USERS.customer,
    plan: 1,
    plan_details: INITIAL_PLANS[0],
    status: 'Active',
    start_date: '2026-09-01',
    expiry_date: '2027-06-30',
    next_billing_date: '2026-10-31',
    payment_terms: '30_days',
    is_paused: false,
    closed_reason: '',
    total_recurring_amount: '4560.00',
    is_expired: false,
    lines: [
      { id: 1, product: 1, product_name: 'Brightloop Cloud ERP', variant: 1, variant_name: 'Odoo', quantity: 1, unit_price: '1560.00', tax_rate: '18.00', tax_name: 'GST 18%', amount: '1560.00' },
      { id: 2, product: 2, product_name: '24/7 Priority Support SLA', variant: null, variant_name: null, quantity: 1, unit_price: '3000.00', tax_rate: '18.00', tax_name: 'GST 18%', amount: '3000.00' }
    ]
  },
  {
    id: 2,
    number: 'SUB-000002',
    customer: 3,
    customer_details: PRESET_USERS.customer,
    plan: 2,
    plan_details: INITIAL_PLANS[1],
    status: 'Active',
    start_date: '2026-08-01',
    expiry_date: '2027-08-01',
    next_billing_date: '2027-08-01',
    payment_terms: '15_days',
    is_paused: false,
    closed_reason: '',
    total_recurring_amount: '5000.00',
    is_expired: false,
    lines: [
      { id: 3, product: 1, product_name: 'Brightloop Cloud ERP', variant: 2, variant_name: 'Standard', quantity: 5, unit_price: '1000.00', tax_rate: '18.00', tax_name: 'GST 18%', amount: '5000.00' }
    ]
  },
  {
    id: 3,
    number: 'SUB-000003',
    customer: 3,
    customer_details: PRESET_USERS.customer,
    plan: 1,
    plan_details: INITIAL_PLANS[0],
    status: 'Quotation',
    start_date: '2026-10-31',
    expiry_date: '2026-11-30',
    next_billing_date: '2026-10-31',
    payment_terms: '30_days',
    is_paused: false,
    closed_reason: '',
    total_recurring_amount: '3000.00',
    is_expired: false,
    lines: [
      { id: 4, product: 3, product_name: 'AI Insights & Forecasts', variant: null, variant_name: null, quantity: 2, unit_price: '1500.00', tax_rate: '18.00', tax_name: 'GST 18%', amount: '3000.00' }
    ]
  }
];

const INITIAL_INVOICES = [
  {
    id: 1,
    number: 'INV-2026-000001',
    subscription: 1,
    subscription_number: 'SUB-000001',
    plan_name: 'Standard Monthly Plan',
    customer: 3,
    customer_name: 'Rahul Sharma',
    customer_email: 'customer@acmecorp.com',
    status: 'Paid',
    period_start: '2026-09-01',
    period_end: '2026-10-01',
    issue_date: '2026-09-01',
    due_date: '2026-10-01',
    subtotal: '4560.00',
    discount_total: '456.00',
    tax_total: '738.72',
    total: '4842.72',
    amount_paid: '4842.72',
    outstanding_balance: '0.00',
    is_overdue: false,
    days_overdue: 0,
    lines: [
      { id: 1, product_name: 'Brightloop Cloud ERP (Odoo)', quantity: 1, unit_price: '1560.00', discount: '156.00', tax_rate: '18.00', tax_amount: '252.72', amount: '1656.72' },
      { id: 2, product_name: '24/7 Priority Support SLA', quantity: 1, unit_price: '3000.00', discount: '300.00', tax_rate: '18.00', tax_amount: '486.00', amount: '3186.00' }
    ]
  },
  {
    id: 2,
    number: 'INV-2026-000002',
    subscription: 1,
    subscription_number: 'SUB-000001',
    plan_name: 'Standard Monthly Plan',
    customer: 3,
    customer_name: 'Rahul Sharma',
    customer_email: 'customer@acmecorp.com',
    status: 'Paid',
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    issue_date: '2026-10-01',
    due_date: '2026-11-25',
    subtotal: '4560.00',
    discount_total: '0.00',
    tax_total: '820.80',
    total: '5380.80',
    amount_paid: '5380.80',
    outstanding_balance: '0.00',
    is_overdue: false,
    days_overdue: 0,
    lines: [
      { id: 3, product_name: 'Brightloop Cloud ERP (Odoo)', quantity: 1, unit_price: '1560.00', discount: '0.00', tax_rate: '18.00', tax_amount: '280.80', amount: '1840.80' },
      { id: 4, product_name: '24/7 Priority Support SLA', quantity: 1, unit_price: '3000.00', discount: '0.00', tax_rate: '18.00', tax_amount: '540.00', amount: '3540.00' }
    ]
  }
];

const INITIAL_PAYMENTS = [
  {
    id: 1,
    invoice: 1,
    invoice_number: 'INV-2026-000001',
    customer_name: 'Rahul Sharma',
    method: 'bank_transfer',
    amount: '4842.72',
    payment_date: '2026-09-15',
    note: 'Bank wire ref #HDFC998231',
    recorded_by_name: 'Sarah Jenkins',
    is_void: false
  },
  {
    id: 2,
    invoice: 2,
    invoice_number: 'INV-2026-000002',
    customer_name: 'Rahul Sharma',
    method: 'upi',
    amount: '1000.00',
    payment_date: '2026-10-20',
    note: 'Initial partial payment via UPI',
    recorded_by_name: 'Sarah Jenkins',
    is_void: false
  }
];

export const INITIAL_CUSTOMERS = [
  {
    id: 3,
    name: 'Rahul Sharma',
    email: 'customer@acmecorp.com',
    company_name: 'Acme Corp Pvt Ltd',
    phone: '+91 98765 43210',
    billing_address: '42 Brigade Road, Bangalore 560001',
    tax_id: 'GSTIN29AAACA9876Q1Z0'
  },
  {
    id: 4,
    name: 'David Miller',
    email: 'david@nexustech.io',
    company_name: 'NexusTech Global Inc',
    phone: '+91 98111 22334',
    billing_address: '15 Electronic City, Bangalore 560100',
    tax_id: 'GSTIN29BBBCA1234P1Z2'
  },
  {
    id: 5,
    name: 'Ananya Roy',
    email: 'ananya@quantumscale.in',
    company_name: 'QuantumScale Technologies',
    phone: '+91 97444 55667',
    billing_address: '88 Cyber Gateway, Hyderabad 500081',
    tax_id: 'GSTIN36CCCCB4567M1Z4'
  }
];

const INITIAL_STAFF = [
  { id: 1, name: 'Admin User', email: 'admin@brightloop.io', role: 'admin', is_active: true, created_at: '2026-10-01' },
  { id: 2, name: 'Sarah Jenkins', email: 'staff@brightloop.io', role: 'staff', is_active: true, created_at: '2026-10-15' }
];

const INITIAL_AUDIT_LOGS = [
  {
    id: 1,
    actor_name: 'Sarah Jenkins',
    actor_email: 'staff@brightloop.io',
    actor_role: 'staff',
    entity_type: 'Subscription',
    entity_id: 'SUB-000003',
    action: 'InstantiatedQuote',
    before_after_json: { template: 'Enterprise ERP + Support', value: '₹3,000.00' },
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 2,
    actor_name: 'Sarah Jenkins',
    actor_email: 'staff@brightloop.io',
    actor_role: 'staff',
    entity_type: 'Payment',
    entity_id: 'INV-2026-000002',
    action: 'RecordedPayment',
    before_after_json: { amount: '1000.00', method: 'UPI' },
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: 3,
    actor_name: 'Admin User',
    actor_email: 'admin@brightloop.io',
    actor_role: 'admin',
    entity_type: 'BillingEngine',
    entity_id: 'JOB-BATCH-891',
    action: 'ExecutedBillingCycle',
    before_after_json: { invoices_created: 3, auto_batch: true },
    timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    id: 4,
    actor_name: 'Sarah Jenkins',
    actor_email: 'staff@brightloop.io',
    actor_role: 'staff',
    entity_type: 'Subscription',
    entity_id: 'SUB-000001',
    action: 'Activated',
    before_after_json: { customer: 'Rahul Sharma', plan: 'Standard Monthly' },
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 5,
    actor_name: 'Sarah Jenkins',
    actor_email: 'staff@brightloop.io',
    actor_role: 'staff',
    entity_type: 'Payment',
    entity_id: 'INV-2026-000001',
    action: 'RecordedPayment',
    before_after_json: { amount: '4842.72', method: 'Bank Transfer' },
    timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    id: 6,
    actor_name: 'Admin User',
    actor_email: 'admin@brightloop.io',
    actor_role: 'admin',
    entity_type: 'Staff',
    entity_id: 'USR-002',
    action: 'ProvisionedStaffAccount',
    before_after_json: { name: 'Sarah Jenkins', role: 'staff' },
    timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 7,
    actor_name: 'Admin User',
    actor_email: 'admin@brightloop.io',
    actor_role: 'admin',
    entity_type: 'TaxRule',
    entity_id: 'TAX-001',
    action: 'CreatedTaxRule',
    before_after_json: { name: 'GST 18%', rate: '18.00' },
    timestamp: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  }
];

export function DataProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [authReady, setAuthReady] = useState(() => !getAccessToken());

  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [staffMembers, setStaffMembers] = useState(INITIAL_STAFF);
  const [subscriptions, setSubscriptions] = useState(INITIAL_SUBSCRIPTIONS);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [portalBillingError, setPortalBillingError] = useState('');
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [trendingPlans, setTrendingPlans] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [subscribedProducts, setSubscribedProducts] = useState({ active_products: [], inactive_products: [], total_count: 0 });
  const [customerPurchaseOrders, setCustomerPurchaseOrders] = useState([]);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);
  const [taxes, setTaxes] = useState(INITIAL_TAXES);
  const [discounts, setDiscounts] = useState(INITIAL_DISCOUNTS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [revenueReport, setRevenueReport] = useState(null);

  const unwrapList = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  // Real-time synchronization helper for customer data & discovery
  const refreshCustomerData = async (forcedRole = null) => {
    try {
      setIsDiscoveryLoading(true);
      const [trendingRes, productsRes] = await Promise.allSettled([
        apiRequest('/portal/plans/trending'),
        apiRequest('/portal/products')
      ]);

      if (trendingRes.status === 'fulfilled') {
        const list = trendingRes.value?.trending_plans || unwrapList(trendingRes.value);
        if (list.length > 0) setTrendingPlans(list);
      }
      if (productsRes.status === 'fulfilled') {
        const list = productsRes.value?.products || unwrapList(productsRes.value);
        if (list.length > 0) setCatalogProducts(list);
      }

      const token = getAccessToken();
      const role = forcedRole || activeRole || currentUser?.role;

      if (token) {
        if (role === 'admin' || role === 'staff') {
          const [
            subsRes,
            invsRes,
            paysRes,
            custsRes,
            prodsRes,
            plansRes,
            tplsRes,
            taxesRes,
            discsRes,
            staffRes,
            auditRes,
            revRes
          ] = await Promise.allSettled([
            apiRequest('/subscriptions'),
            apiRequest('/invoices'),
            apiRequest('/payments'),
            apiRequest('/customers'),
            apiRequest('/products'),
            apiRequest('/plans'),
            apiRequest('/quotation-templates'),
            apiRequest('/taxes'),
            apiRequest('/discounts'),
            apiRequest('/staff'),
            apiRequest('/audit-logs'),
            apiRequest('/reports/revenue')
          ]);

          if (subsRes.status === 'fulfilled') {
            const list = unwrapList(subsRes.value);
            if (list.length > 0 || role === 'admin') setSubscriptions(list);
          }
          if (invsRes.status === 'fulfilled') {
            const list = unwrapList(invsRes.value);
            if (list.length > 0 || role === 'admin') setInvoices(list);
          }
          if (paysRes.status === 'fulfilled') {
            const list = unwrapList(paysRes.value);
            if (list.length > 0 || role === 'admin') setPayments(list);
          }
          if (custsRes.status === 'fulfilled') {
            const list = unwrapList(custsRes.value);
            if (list.length > 0) setCustomers(list);
          }
          if (prodsRes.status === 'fulfilled') {
            const list = unwrapList(prodsRes.value);
            if (list.length > 0) setProducts(list);
          }
          if (plansRes.status === 'fulfilled') {
            const list = unwrapList(plansRes.value);
            if (list.length > 0) setPlans(list);
          }
          if (tplsRes.status === 'fulfilled') {
            const list = unwrapList(tplsRes.value);
            if (list.length > 0) setTemplates(list);
          }
          if (taxesRes.status === 'fulfilled') {
            const list = unwrapList(taxesRes.value);
            if (list.length > 0) setTaxes(list);
          }
          if (discsRes.status === 'fulfilled') {
            const list = unwrapList(discsRes.value);
            if (list.length > 0) setDiscounts(list);
          }
          if (staffRes.status === 'fulfilled') {
            const list = unwrapList(staffRes.value);
            if (list.length > 0) setStaffMembers(list);
          }
          if (auditRes?.status === 'fulfilled') {
            const list = unwrapList(auditRes.value);
            if (list.length > 0) setAuditLogs(list);
          }
          if (revRes?.status === 'fulfilled' && revRes.value) {
            setRevenueReport(revRes.value);
          }
        } else {
          const [subsRes, subProdsRes, invsRes, paysRes, ordersRes] = await Promise.allSettled([
            apiRequest('/portal/subscriptions'),
            apiRequest('/portal/subscribed-products'),
            apiRequest('/portal/invoices'),
            apiRequest('/portal/payments'),
            apiRequest('/portal/purchase/orders')
          ]);

          if (subsRes.status === 'fulfilled') {
            setSubscriptions(unwrapList(subsRes.value));
          }
          if (subProdsRes.status === 'fulfilled' && subProdsRes.value) {
            setSubscribedProducts(subProdsRes.value);
          }
          if (invsRes.status === 'fulfilled') {
            setInvoices(unwrapList(invsRes.value));
          }
          if (paysRes.status === 'fulfilled') {
            setPayments(unwrapList(paysRes.value));
          }
          if (ordersRes.status === 'fulfilled') {
            setCustomerPurchaseOrders(unwrapList(ordersRes.value));
          }
        }
      }
    } catch (err) {
      console.warn('[DataContext] Data sync failed, fallback to local store:', err);
    } finally {
      setIsDiscoveryLoading(false);
    }
  };

  useEffect(() => {
    if (!getAccessToken()) {
      refreshCustomerData();
      return undefined;
    }
    let active = true;
    apiRequest('/auth/me')
      .then(user => {
        if (!active) return;
        setCurrentUser(user);
        setActiveRole(user.role);
        setIsAuthenticated(true);
        refreshCustomerData(user.role);
      })
      .catch(() => clearAuthTokens())
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isDemo || currentUser?.role !== 'customer') return undefined;
    let active = true;
    Promise.all([
      apiRequest('/portal/invoices'),
      apiRequest('/portal/payments')
    ])
      .then(([invoiceResponse, paymentResponse]) => {
        if (!active) return;
        setInvoices(invoiceResponse.results || invoiceResponse);
        setPayments(paymentResponse.results || paymentResponse);
        setPortalBillingError('');
      })
      .catch(error => {
        if (!active) return;
        console.error('[Billing] Could not load customer invoices and payments:', error);
        setPortalBillingError('We could not load your billing records. Refresh the page or contact support.');
      });
    return () => {
      active = false;
    };
  }, [currentUser?.id, currentUser?.role, isAuthenticated, isDemo]);

  const acceptAuthentication = (response, rememberMe) => {
    if (!response.access || !response.refresh || !response.user) {
      throw new Error('The authentication server returned an incomplete session.');
    }
    saveAuthTokens(response, rememberMe);
    setCurrentUser(response.user);
    setActiveRole(response.user.role);
    setIsAuthenticated(true);
    setIsDemo(false);
    setAuthReady(true);
    refreshCustomerData(response.user.role);
  };

  const login = async ({ email, password, rememberMe = false }) => {
    const response = await apiRequest(
      '/auth/login',
      'POST',
      { email, password },
      { auth: false }
    );
    acceptAuthentication(response, rememberMe);
    return response.user;
  };

  const registerAccount = async ({ email, password, name, companyName, role }) => {
    const response = await apiRequest(
      '/auth/register',
      'POST',
      { email, password, name, company_name: companyName || '', role },
      { auth: false }
    );
    acceptAuthentication(response, false);
    return response.user;
  };

  const signOut = async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) {
        await apiRequest('/auth/logout', 'POST', { refresh });
      }
    } catch (error) {
      console.warn('[Auth] Server logout failed; clearing the local session:', error.message);
    } finally {
      clearAuthTokens();
      setCurrentUser(null);
      setActiveRole(null);
      setIsAuthenticated(false);
      setIsDemo(false);
      setAuthReady(true);
    }
  };

  // Switch role helper
  const switchRole = (role) => {
    setIsDemo(true);
    setActiveRole(role);
    setCurrentUser(PRESET_USERS[role] || PRESET_USERS.admin);
  };

  const startDemo = role => {
    clearAuthTokens();
    setActiveRole(role);
    setCurrentUser(PRESET_USERS[role] || PRESET_USERS.admin);
    setIsAuthenticated(false);
    setIsDemo(true);
    setAuthReady(true);
  };

  // Subscription Actions
  const confirmSubscription = (id) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: 'Confirmed' } : s));
  };

  const activateSubscription = (id) => {
    const today = new Date().toISOString().split('T')[0];
    setSubscriptions(prev => prev.map(s => s.id === id ? {
      ...s,
      status: 'Active',
      start_date: today,
      next_billing_date: today,
      is_paused: false
    } : s));
  };

  const togglePauseSubscription = (id) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, is_paused: !s.is_paused } : s));
  };

  const renewSubscription = (id) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const curExpiry = new Date(s.expiry_date || new Date());
      curExpiry.setMonth(curExpiry.getMonth() + 1);
      return {
        ...s,
        status: 'Active',
        is_paused: false,
        expiry_date: curExpiry.toISOString().split('T')[0]
      };
    }));
  };

  const closeSubscription = (id, reason = 'Closed by user') => {
    setSubscriptions(prev => prev.map(s => s.id === id ? {
      ...s,
      status: 'Closed',
      closed_reason: reason
    } : s));
  };

  const addCustomer = (customerData) => {
    const id = customers.length + 3;
    const newCust = {
      id,
      name: customerData.name,
      email: customerData.email.toLowerCase(),
      company_name: customerData.company_name || customerData.name,
      phone: customerData.phone || '',
      billing_address: customerData.billing_address || '',
      tax_id: customerData.tax_id || ''
    };
    setCustomers(prev => [...prev, newCust]);
    return newCust;
  };

  const addSubscription = (newSub) => {
    // PRD Section 2.1: Admin and Staff create subscriptions; Customers cannot.
    if (activeRole === 'customer') {
      throw new Error("Customers cannot create new subscriptions (PRD Section 2.1)");
    }
    const id = subscriptions.length + 1;
    const number = `SUB-${String(id).padStart(6, '0')}`;
    const selectedCust = customers.find(c => c.id === Number(newSub.customer)) || customers[0];
    const subToAdd = {
      ...newSub,
      id,
      number,
      customer: selectedCust.id,
      customer_details: {
        id: selectedCust.id,
        name: selectedCust.name,
        email: selectedCust.email,
        company_name: selectedCust.company_name,
        customer_profile: {
          company_name: selectedCust.company_name,
          phone: selectedCust.phone,
          billing_address: selectedCust.billing_address,
          tax_id: selectedCust.tax_id
        }
      },
      plan_details: plans.find(p => p.id === Number(newSub.plan)) || plans[0],
      created_at: new Date().toISOString()
    };
    setSubscriptions([subToAdd, ...subscriptions]);
    return subToAdd;
  };

  // Invoice Actions
  const confirmInvoice = (id) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'Confirmed' } : inv));
  };

  const cancelInvoice = (id) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'Cancelled' } : inv));
  };

  const runDailyBillingJob = () => {
    // PRD Section 2.1 & 4.6: Admin triggers system billing job
    if (activeRole !== 'admin') {
      console.warn("Unauthorized: Run Daily Billing Job is restricted to Admin.");
      return 0;
    }
    // Generate invoice for all Active subscriptions whose next_billing_date is today or earlier
    const today = new Date().toISOString().split('T')[0];
    const generated = [];

    subscriptions.forEach(sub => {
      if (sub.status === 'Active' && !sub.is_paused) {
        const invId = invoices.length + generated.length + 1;
        const invNumber = `INV-2026-${String(invId).padStart(6, '0')}`;
        const subtotal = sub.total_recurring_amount;
        const taxRate = 18;
        const taxAmount = (Number(subtotal) * taxRate / 100).toFixed(2);
        const total = (Number(subtotal) + Number(taxAmount)).toFixed(2);

        const newInv = {
          id: invId,
          number: invNumber,
          subscription: sub.id,
          subscription_number: sub.number,
          plan_name: sub.plan_details?.name || 'Standard Plan',
          customer: sub.customer,
          customer_name: sub.customer_details?.name || 'Customer',
          customer_email: sub.customer_details?.email || 'customer@example.com',
          status: 'Draft',
          period_start: today,
          period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          issue_date: today,
          due_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          subtotal,
          discount_total: '0.00',
          tax_total: taxAmount,
          total,
          amount_paid: '0.00',
          outstanding_balance: total,
          is_overdue: false,
          days_overdue: 0,
          lines: sub.lines.map(l => ({
            id: Math.random(),
            product_name: l.product_name,
            quantity: l.quantity,
            unit_price: l.unit_price,
            discount: '0.00',
            tax_rate: '18.00',
            tax_amount: (Number(l.amount) * taxRate / 100).toFixed(2),
            amount: (Number(l.amount) * (1 + taxRate / 100)).toFixed(2)
          }))
        };
        generated.push(newInv);
      }
    });

    if (generated.length > 0) {
      setInvoices([...generated, ...invoices]);
    }
    return generated.length;
  };

  // Payment Actions
  const recordLocalAuditLog = (action, entityType, entityId, details = {}) => {
    const actor = currentUser || { name: 'System', role: activeRole || 'staff', email: '' };
    const newEntry = {
      id: Date.now(),
      actor_name: actor.name,
      actor_email: actor.email,
      actor_role: actor.role || activeRole || 'staff',
      entity_type: entityType,
      entity_id: String(entityId),
      action,
      before_after_json: details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  const recordPayment = ({ invoiceId, method, amount, note }) => {
    const payAmt = Number(amount);
    const id = payments.length + 1;
    const inv = invoices.find(i => i.id === Number(invoiceId));
    if (!inv) return;

    const newPayment = {
      id,
      invoice: inv.id,
      invoice_number: inv.number,
      customer_name: inv.customer_name,
      method,
      amount: payAmt.toFixed(2),
      payment_date: new Date().toISOString().split('T')[0],
      note,
      recorded_by_name: currentUser.name,
      is_void: false
    };

    setPayments([newPayment, ...payments]);

    // Update invoice balance
    setInvoices(prev => prev.map(item => {
      if (item.id !== inv.id) return item;
      const newPaid = Number(item.amount_paid) + payAmt;
      const newBal = Math.max(0, Number(item.total) - newPaid).toFixed(2);
      const isPaid = Number(newBal) <= 0;
      return {
        ...item,
        amount_paid: newPaid.toFixed(2),
        outstanding_balance: newBal,
        status: isPaid ? 'Paid' : item.status,
        is_overdue: isPaid ? false : item.is_overdue
      };
    }));
  };

  const createRazorpayOrder = (invoiceId) => apiRequest(
    '/payments/razorpay/orders',
    'POST',
    { invoice_id: invoiceId }
  );

  const verifyRazorpayPayment = async (paymentResponse) => {
    const result = await apiRequest('/payments/razorpay/verify', 'POST', paymentResponse);
    setPayments(prev => [result.payment, ...prev.filter(payment => payment.id !== result.payment.id)]);
    setInvoices(prev => (
      prev.some(invoice => invoice.id === result.invoice.id)
        ? prev.map(invoice => (invoice.id === result.invoice.id ? result.invoice : invoice))
        : [result.invoice, ...prev]
    ));
    setPortalBillingError('');
    return result;
  };

  const voidPayment = (paymentId) => {
    // PAY-6: Only the admin can void a payment, which reopens the invoice balance and is audit-logged
    if (activeRole !== 'admin') {
      console.warn("Unauthorized: Only Admin can void payments (PRD PAY-6)");
      return;
    }
    const p = payments.find(x => x.id === paymentId);
    if (!p || p.is_void) return;

    setPayments(prev => prev.map(x => x.id === paymentId ? { ...x, is_void: true } : x));

    // Reopen invoice balance
    setInvoices(prev => prev.map(item => {
      if (item.id !== p.invoice) return item;
      const newPaid = Math.max(0, Number(item.amount_paid) - Number(p.amount));
      const newBal = Math.max(0, Number(item.total) - newPaid).toFixed(2);
      return {
        ...item,
        amount_paid: newPaid.toFixed(2),
        outstanding_balance: newBal,
        status: Number(newBal) > 0 ? 'Confirmed' : item.status
      };
    }));
  };

  // Staff Management (PRD AUTH-5: Only an Admin can manage staff members)
  const addStaffMember = async (staffData) => {
    if (activeRole !== 'admin') {
      throw new Error("Only an Admin can create staff accounts (PRD AUTH-5)");
    }
    const id = staffMembers.length + 1;
    const newStaff = {
      id,
      name: staffData.name,
      email: staffData.email.toLowerCase(),
      role: staffData.role || 'staff',
      is_active: true,
      created_at: new Date().toISOString().split('T')[0]
    };
    if (getAccessToken() && !isDemo) {
      try {
        const saved = await apiRequest('/staff', 'POST', {
          name: staffData.name,
          email: staffData.email.toLowerCase(),
          password: staffData.password,
          role: staffData.role || 'staff'
        });
        setStaffMembers(prev => [saved, ...prev]);
        return saved;
      } catch (err) {
        if (err.data?.email) {
          throw new Error(Array.isArray(err.data.email) ? err.data.email[0] : err.data.email);
        }
        if (err.data?.password) {
          throw new Error(Array.isArray(err.data.password) ? err.data.password[0] : err.data.password);
        }
        throw err;
      }
    }
    setStaffMembers(prev => [newStaff, ...prev]);
    return newStaff;
  };

  const toggleStaffStatus = async (id) => {
    if (activeRole !== 'admin') {
      throw new Error("Only an Admin can modify staff status (PRD 2.1)");
    }
    const target = staffMembers.find(s => s.id === id);
    const nextStatus = target ? !target.is_active : false;
    setStaffMembers(prev => prev.map(s => s.id === id ? { ...s, is_active: nextStatus } : s));
    if (getAccessToken() && !isDemo) {
      try {
        await apiRequest(`/staff/${id}`, 'PATCH', { is_active: nextStatus });
      } catch (err) {
        console.warn('API toggleStaffStatus failed:', err.message);
      }
    }
  };

  // Catalog Actions (PRD 2.1: Products/Plans/Taxes/Discounts are Admin-only)
  const addProduct = (prod) => {
    if (activeRole !== 'admin') {
      console.warn("Unauthorized: Only Admin can create products (PRD 2.1)");
      return;
    }
    const id = products.length + 1;
    const margin = (Number(prod.sales_price) - Number(prod.cost_price || 0)).toFixed(2);
    const newP = {
      ...prod,
      id,
      margin,
      has_cost_warning: Number(prod.cost_price) > Number(prod.sales_price),
      is_active: true,
      variants: prod.variants || []
    };
    setProducts([newP, ...products]);
  };

  const addPlan = (plan) => {
    if (activeRole !== 'admin') {
      console.warn("Unauthorized: Only Admin can create plans (PRD 2.1)");
      return;
    }
    const id = plans.length + 1;
    setPlans([{ ...plan, id, is_active: true }, ...plans]);
  };

  const addQuotationTemplate = (tpl) => {
    if (activeRole !== 'admin') {
      console.warn("Unauthorized: Only Admin can create quotation templates (PRD 2.1 & TPL-1)");
      return;
    }
    const id = templates.length + 1;
    setTemplates([{ ...tpl, id, is_active: true }, ...templates]);
  };

  const addTax = async (taxData) => {
    if (activeRole !== 'admin') {
      throw new Error("Only an Admin can configure taxes (PRD 4.7)");
    }
    const id = taxes.length + 1;
    const newTax = {
      id,
      name: taxData.name,
      rate: Number(taxData.rate).toFixed(2),
      is_inclusive: Boolean(taxData.is_inclusive),
      is_active: true
    };
    if (getAccessToken() && !isDemo) {
      try {
        const saved = await apiRequest('/taxes', 'POST', {
          name: newTax.name,
          rate: newTax.rate,
          is_inclusive: newTax.is_inclusive,
          is_active: true
        });
        setTaxes(prev => [...prev, saved]);
        return saved;
      } catch (err) {
        console.warn('API addTax failed, using fallback:', err.message);
      }
    }
    setTaxes(prev => [...prev, newTax]);
    return newTax;
  };

  const addDiscount = async (discData) => {
    if (activeRole !== 'admin') {
      throw new Error("Only an Admin can create discount rules (PRD 4.8)");
    }
    const id = discounts.length + 1;
    const newDisc = {
      id,
      name: discData.name,
      type: discData.type || 'percentage',
      value: Number(discData.value).toFixed(2),
      min_purchase: discData.min_purchase || '0.00',
      min_quantity: discData.min_quantity || 1,
      usage_limit: discData.usage_limit ? Number(discData.usage_limit) : null,
      times_used: 0,
      scope: discData.scope || 'all',
      start_date: discData.start_date || new Date().toISOString().split('T')[0],
      end_date: discData.end_date || null
    };
    if (getAccessToken() && !isDemo) {
      try {
        const saved = await apiRequest('/discounts', 'POST', {
          name: newDisc.name,
          type: newDisc.type,
          value: newDisc.value,
          min_purchase: newDisc.min_purchase,
          min_quantity: newDisc.min_quantity,
          usage_limit: newDisc.usage_limit,
          scope: newDisc.scope
        });
        setDiscounts(prev => [saved, ...prev]);
        return saved;
      } catch (err) {
        console.warn('API addDiscount failed, using fallback:', err.message);
      }
    }
    setDiscounts(prev => [newDisc, ...prev]);
    return newDisc;
  };

  const createQuotationFromTemplate = (templateId) => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    const planObj = plans.find(p => p.id === tpl.plan) || plans[0];
    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + tpl.validity_days);

    const lines = tpl.lines.map((l, idx) => {
      const prod = products.find(p => p.id === l.product);
      const unit_price = prod ? prod.sales_price : '1000.00';
      return {
        id: idx + 1,
        product: l.product,
        product_name: l.product_name,
        variant: l.variant,
        variant_name: l.variant_name,
        quantity: l.quantity,
        unit_price,
        tax_rate: '18.00',
        tax_name: 'GST 18%',
        amount: (Number(unit_price) * l.quantity).toFixed(2)
      };
    });

    const total_recurring_amount = lines.reduce((acc, cur) => acc + Number(cur.amount), 0).toFixed(2);

    return addSubscription({
      customer: 3,
      plan: planObj.id,
      status: 'Quotation',
      start_date: today.toISOString().split('T')[0],
      expiry_date: expiry.toISOString().split('T')[0],
      next_billing_date: today.toISOString().split('T')[0],
      payment_terms: '30_days',
      total_recurring_amount,
      lines
    });
  };

  // Product Access & Launch API Services
  const launchProductWeb = async (productId, subscriptionId = null) => {
    try {
      const res = await apiRequest(`/products/${productId}/launch/web`, 'POST', { subscription_id: subscriptionId });
      return res;
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      const prod = products.find(p => p.id === productId);
      const sub = subscriptions.find(s => s.id === subscriptionId) || subscriptions[0];
      if (sub && sub.status !== 'Active') {
        throw new Error(`Subscription ${sub.number} is in ${sub.status} status and does not permit access.`);
      }
      if (sub && sub.is_paused) {
        throw new Error(`Subscription ${sub.number} is currently paused.`);
      }
      return {
        status: 'success',
        launch_type: 'web',
        launch_url: `http://localhost:5173/demo?launch_token=mock-web-token-xyz&product_id=${productId}&subscription_id=${sub?.id || ''}&_offline=1`,
        token: 'mock-web-token-xyz',
        expires_in_seconds: 900,
        product: { id: productId, name: prod?.name },
        entitlements: prod?.entitlements || {}
      };
    }
  };

  const launchProductDesktop = async (productId, subscriptionId = null, codeChallenge = '') => {
    try {
      const res = await apiRequest(`/products/${productId}/launch/desktop`, 'POST', { 
        subscription_id: subscriptionId, 
        code_challenge: codeChallenge 
      });
      return res;
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      const prod = products.find(p => p.id === productId);
      const sub = subscriptions.find(s => s.id === subscriptionId) || subscriptions[0];
      if (sub && sub.status !== 'Active') {
        throw new Error(`Subscription ${sub.number} is in ${sub.status} status and does not permit access.`);
      }
      if (sub && sub.is_paused) {
        throw new Error(`Subscription ${sub.number} is currently paused.`);
      }
      const code = 'demo-code-' + Math.random().toString(36).substring(2, 10);
      const protocol = prod?.app_protocol || 'brightloop';
      return {
        status: 'success',
        launch_type: 'desktop',
        protocol_url: `${protocol}://launch?code=${code}&product_id=${productId}`,
        code,
        expires_in_seconds: 120,
        download_url: prod?.desktop_download_url,
        app_protocol: protocol,
        product: { id: productId, name: prod?.name },
        entitlements: prod?.entitlements || {}
      };
    }
  };

  const exchangeDesktopCode = async (code, codeVerifier = '', productId = null) => {
    return await apiRequest('/products/access/exchange-code', 'POST', {
      code,
      code_verifier: codeVerifier,
      product_id: productId
    });
  };

  const verifyWebToken = async (token, productId = null) => {
    return await apiRequest('/products/access/verify-token', 'POST', {
      token,
      product_id: productId
    });
  };

  const revokeProductSession = async (tokenOrSessionId) => {
    return await apiRequest('/products/access/revoke-session', 'POST', {
      token: tokenOrSessionId
    });
  };

  // Purchase & Subscription Checkout Workflow
  const getPurchaseQuote = useCallback(async ({ productId, planId, variantId = null, quantity = 1 }) => {
    try {
      return await apiRequest('/portal/purchase/quote', 'POST', {
        product_id: productId,
        plan_id: planId,
        variant_id: variantId,
        quantity
      });
    } catch (err) {
      if (!isDemo) throw err;
      // Local fallback calculation for offline or mock demo preview
      const prod = products.find(p => p.id === productId) || {};
      const plan = plans.find(p => p.id === planId) || {};
      const basePrice = Number(plan.price || prod.sales_price || 1000);
      const subtotal = (basePrice * quantity).toFixed(2);
      const taxAmount = (Number(subtotal) * 0.18).toFixed(2);
      const total = (Number(subtotal) + Number(taxAmount)).toFixed(2);
      return {
        product: { id: prod.id, name: prod.name, icon_url: prod.icon_url },
        plan: { id: plan.id, name: plan.name, billing_period: plan.billing_period },
        pricing: {
          quantity,
          unit_price: basePrice.toFixed(2),
          subtotal,
          discount: { applied: false, name: null, amount: '0.00' },
          tax: { name: 'GST 18%', rate: '18.00', amount: taxAmount },
          total_amount: total,
          currency: 'INR',
          currency_symbol: '₹'
        },
        customer_warning: { already_subscribed: false }
      };
    }
  }, [isDemo, products, plans]);

  const initiatePurchase = async ({ productId, planId, variantId = null, quantity = 1, paymentMethod = 'razorpay', idempotencyKey = null }) => {
    try {
      return await apiRequest('/portal/purchase/initiate', 'POST', {
        product_id: productId,
        plan_id: planId,
        variant_id: variantId,
        quantity,
        payment_method: paymentMethod,
        idempotency_key: idempotencyKey
      });
    } catch (err) {
      if (!isDemo) throw err;
      const orderId = Date.now();
      const orderNumber = `ORD-2026-${String(orderId).slice(-6)}`;
      return {
        order: { id: orderId, order_number: orderNumber, status: 'Pending', total_amount: '5898.82' },
        payment_checkout: { order_id: orderId, order_number: orderNumber, amount: '5898.82', currency: 'INR' }
      };
    }
  };

  const verifyPurchase = async ({
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  }) => {
    try {
      const result = await apiRequest('/portal/purchase/verify', 'POST', {
        order_id: orderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature
      });
      // Synchronize all customer subscriptions, products, invoices, and payments immediately
      await refreshCustomerData();
      return result;
    } catch (err) {
      if (!isDemo) throw err;
      // Local fallback for offline/demo simulation
      const today = new Date().toISOString().split('T')[0];
      const expiry = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
      const newSubId = subscriptions.length + 1;
      const subNumber = `SUB-${String(newSubId).padStart(6, '0')}`;
      const newInvId = invoices.length + 1;
      const invNumber = `INV-2026-${String(newInvId).padStart(6, '0')}`;

      const localSub = {
        id: newSubId,
        number: subNumber,
        customer: currentUser?.id || 3,
        status: 'Active',
        start_date: today,
        expiry_date: expiry,
        next_billing_date: expiry,
        payment_terms: 'immediate',
        is_paused: false,
        created_at: new Date().toISOString()
      };
      setSubscriptions(prev => [localSub, ...prev]);

      const localInv = {
        id: newInvId,
        number: invNumber,
        subscription: newSubId,
        subscription_number: subNumber,
        customer: currentUser?.id || 3,
        status: 'Paid',
        issue_date: today,
        due_date: today,
        total: '5898.82',
        amount_paid: '5898.82',
        outstanding_balance: '0.00'
      };
      setInvoices(prev => [localInv, ...prev]);

      return {
        status: 'success',
        message: 'Subscription created and activated successfully!',
        subscription: localSub,
        invoice: localInv,
        launch: {
          web_available: true,
          desktop_available: true,
          web_url: 'http://localhost:5173/demo'
        }
      };
    }
  };

  return (
    <DataContext.Provider value={{
      currentUser,
      activeRole,
      authReady,
      isAuthenticated,
      isDemo,
      login,
      registerAccount,
      signOut,
      startDemo,
      switchRole,
      customers,
      addCustomer,
      subscriptions,
      invoices,
      payments,
      portalBillingError,
      products,
      plans,
      templates,
      taxes,
      discounts,
      trendingPlans,
      catalogProducts,
      subscribedProducts,
      customerPurchaseOrders,
      isDiscoveryLoading,
      refreshCustomerData,
      getPurchaseQuote,
      initiatePurchase,
      verifyPurchase,
      staffMembers,
      addStaffMember,
      toggleStaffStatus,
      addTax,
      addDiscount,
      confirmSubscription,
      activateSubscription,
      togglePauseSubscription,
      renewSubscription,
      closeSubscription,
      addSubscription,
      confirmInvoice,
      cancelInvoice,
      runDailyBillingJob,
      recordPayment,
      createRazorpayOrder,
      verifyRazorpayPayment,
      voidPayment,
      addProduct,
      addPlan,
      addQuotationTemplate,
      createQuotationFromTemplate,
      launchProductWeb,
      launchProductDesktop,
      exchangeDesktopCode,
      verifyWebToken,
      revokeProductSession,
      auditLogs,
      revenueReport,
      recordLocalAuditLog
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
