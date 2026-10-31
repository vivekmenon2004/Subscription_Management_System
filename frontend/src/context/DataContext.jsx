import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

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
    status: 'Confirmed',
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    issue_date: '2026-10-01',
    due_date: '2026-10-25', // Overdue by 6 days!
    subtotal: '4560.00',
    discount_total: '0.00',
    tax_total: '820.80',
    total: '5380.80',
    amount_paid: '1000.00',
    outstanding_balance: '4380.80',
    is_overdue: true,
    days_overdue: 6,
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

export function DataProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(PRESET_USERS.admin);
  const [activeRole, setActiveRole] = useState('admin'); // 'admin' | 'staff' | 'customer'

  const [subscriptions, setSubscriptions] = useState(INITIAL_SUBSCRIPTIONS);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [taxes, setTaxes] = useState(INITIAL_TAXES);
  const [discounts, setDiscounts] = useState(INITIAL_DISCOUNTS);

  // Switch role helper
  const switchRole = (role) => {
    setActiveRole(role);
    setCurrentUser(PRESET_USERS[role] || PRESET_USERS.admin);
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

  const addSubscription = (newSub) => {
    const id = subscriptions.length + 1;
    const number = `SUB-${String(id).padStart(6, '0')}`;
    const subToAdd = {
      ...newSub,
      id,
      number,
      customer_details: PRESET_USERS.customer,
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
    // Generate invoice for all Active subscriptions whose next_billing_date is today or earlier
    const today = new Date().toISOString().split('T')[0];
    const generated = [];

    subscriptions.forEach(sub => {
      if (sub.status === 'Active' && !sub.is_paused) {
        const invId = invoices.length + generated.length + 1;
        const invNumber = `INV-2026-${String(invId).padStart(6, '0')}`;
        const subtotal = sub.total_recurring_amount;
        const taxRate = 18;
        const taxAmount = (Number(subtotal) * 0.18).toFixed(2);
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
            tax_amount: (Number(l.amount) * 0.18).toFixed(2),
            amount: (Number(l.amount) * 1.18).toFixed(2)
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

  const voidPayment = (paymentId) => {
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

  // Catalog Actions
  const addProduct = (prod) => {
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
    const id = plans.length + 1;
    setPlans([{ ...plan, id, is_active: true }, ...plans]);
  };

  const addQuotationTemplate = (tpl) => {
    const id = templates.length + 1;
    setTemplates([{ ...tpl, id, is_active: true }, ...templates]);
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

  return (
    <DataContext.Provider value={{
      currentUser,
      activeRole,
      switchRole,
      subscriptions,
      invoices,
      payments,
      products,
      plans,
      templates,
      taxes,
      discounts,
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
      voidPayment,
      addProduct,
      addPlan,
      addQuotationTemplate,
      createQuotationFromTemplate
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
