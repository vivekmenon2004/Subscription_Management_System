import React, { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { PillNav } from './components/PillNav';
import { InvoiceModal } from './components/InvoiceModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { SubscriptionModal } from './components/SubscriptionModal';

import { DashboardPage } from './pages/DashboardPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { CatalogPage } from './pages/CatalogPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { TaxesDiscountsPage } from './pages/TaxesDiscountsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [showNewSubModal, setShowNewSubModal] = useState(false);

  const handleOpenInvoice = (inv) => {
    setActiveInvoice(inv);
  };

  const handleRecordPayment = (inv) => {
    setPaymentInvoice(inv);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F8] flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            setActiveTab={setActiveTab}
            onOpenInvoice={handleOpenInvoice}
            onRecordPayment={handleRecordPayment}
            onOpenNewSub={() => setShowNewSubModal(true)}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionsPage
            onOpenNewSub={() => setShowNewSubModal(true)}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesPage
            onOpenInvoice={handleOpenInvoice}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsPage />
        )}

        {activeTab === 'catalog' && (
          <CatalogPage />
        )}

        {activeTab === 'quotations' && (
          <QuotationsPage
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'taxes_discounts' && (
          <TaxesDiscountsPage />
        )}

        {activeTab === 'reports' && (
          <ReportsPage />
        )}

        {activeTab === 'portal' && (
          <CustomerPortalPage
            onOpenInvoice={handleOpenInvoice}
          />
        )}
      </main>

      {/* Iconic Floating Pill Navigation from Design.jpeg */}
      <PillNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Interactive Modals */}
      {activeInvoice && (
        <InvoiceModal
          invoice={activeInvoice}
          onClose={() => setActiveInvoice(null)}
          onRecordPayment={handleRecordPayment}
        />
      )}

      {paymentInvoice && (
        <RecordPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
        />
      )}

      {showNewSubModal && (
        <SubscriptionModal
          onClose={() => setShowNewSubModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <MainApp />
    </DataProvider>
  );
}
