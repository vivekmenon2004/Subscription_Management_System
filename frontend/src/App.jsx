import React, { useState, useEffect } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { PillNav } from './components/PillNav';
import { InvoiceModal } from './components/InvoiceModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AuthPage } from './pages/AuthPage';

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
  const navigate = useNavigate();
  const { activeRole } = useData();
  const [activeTab, setActiveTab] = useState(activeRole === 'customer' ? 'portal' : 'dashboard');
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [showNewSubModal, setShowNewSubModal] = useState(false);

  useEffect(() => {
    if (activeRole === 'customer' && activeTab !== 'portal') {
      setActiveTab('portal');
    }
  }, [activeRole, activeTab]);

  const handleOpenInvoice = (inv) => {
    setActiveInvoice(inv);
  };

  const handleRecordPayment = (inv) => {
    setPaymentInvoice(inv);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F8] flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => navigate('/login')} />

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
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/app" element={<MainApp />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
