import React from 'react';
import { Home, Repeat, FileText, CreditCard, Package, Tags, BarChart3, User, FileSignature, Users } from 'lucide-react';
import { useData } from '../context/DataContext';

export function PillNav({ activeTab, setActiveTab }) {
  const { activeRole } = useData();

  const adminTabs = [
    { id: 'dashboard', label: 'Finance Cockpit', icon: Home },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'catalog', label: 'Catalog & Plans', icon: Package },
    { id: 'quotations', label: 'Quotations', icon: FileSignature },
    { id: 'taxes_discounts', label: 'Taxes & Discounts', icon: Tags },
    { id: 'staff', label: 'Staff Management (Admin Only)', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'portal', label: 'Customer Portal', icon: User },
  ];

  const staffTabs = [
    { id: 'dashboard', label: 'Staff Dashboard', icon: Home },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'catalog', label: 'Catalog (Read Only)', icon: Package },
    { id: 'quotations', label: 'Quotations (Use Only)', icon: FileSignature },
    { id: 'taxes_discounts', label: 'Taxes & Discounts (Read Only)', icon: Tags },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'portal', label: 'Customer Portal', icon: User },
  ];

  const customerTabs = [
    { id: 'portal', label: 'Marketplace & Discovery Home', icon: Home },
    { id: 'subscriptions', label: 'My Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'My Invoices', icon: FileText },
    { id: 'payments', label: 'Payment History', icon: CreditCard },
  ];

  const tabs = activeRole === 'admin' ? adminTabs : (activeRole === 'staff' ? staffTabs : customerTabs);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <nav
        aria-label="Primary Navigation"
        className="glass-nav flex items-center gap-1.5 p-1.5 rounded-full shadow-pill"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              title={tab.label}
              className={`glass-nav__item relative flex items-center justify-center transition-all duration-200 rounded-full ${
                isActive ? 'w-10 h-10 is-active' : 'w-9 h-9'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
