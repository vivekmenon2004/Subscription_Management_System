import React, { useState } from 'react';
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
import { StaffManagementPage } from './pages/StaffManagementPage';
import { ReportsPage } from './pages/ReportsPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { DemoProductPage } from './pages/DemoProductPage';

function MainApp() {
  const navigate = useNavigate();
  const { currentUser, signOut } = useData();
  const [activeTab, setActiveTab] = useState(() => (
    currentUser?.role === 'customer' ? 'portal' : 'dashboard'
  ));
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
      <Navbar
        setActiveTab={setActiveTab}
        onLogout={async () => {
          await signOut();
          navigate('/login', { replace: true });
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            setActiveTab={setActiveTab}
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

        {activeTab === 'staff' && (
          <StaffManagementPage setActiveTab={setActiveTab} />
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

function AuthenticatedApp() {
  const { authReady, isAuthenticated, isDemo } = useData();
  if (!authReady) {
    return <main className="p-8 text-center" role="status">Restoring your session…</main>;
  }
  if (!isAuthenticated && !isDemo) return <Navigate to="/login" replace />;
  return <MainApp />;
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/app" element={<AuthenticatedApp />} />
          <Route path="/demo" element={<DemoProductPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
