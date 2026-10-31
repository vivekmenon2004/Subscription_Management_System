import React, { useState } from 'react';
import { Plus, Pause, Play, RefreshCw, XCircle, CheckCircle, FileText, Calendar, Check, Info } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button, IconButton } from '../components/Button';
import { SearchField } from '../components/SearchField';
import { StatusBadge } from '../components/StatusBadge';

export function SubscriptionsPage({ onOpenNewSub }) {
  const { 
    subscriptions, 
    confirmSubscription, 
    activateSubscription, 
    togglePauseSubscription, 
    renewSubscription, 
    closeSubscription,
    runDailyBillingJob
  } = useData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSub, setSelectedSub] = useState(null);
  const [closeReason, setCloseReason] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);

  const filterTabs = ['ALL', 'Active', 'Quotation', 'Confirmed', 'Paused', 'Closed'];

  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.number.toLowerCase().includes(search.toLowerCase()) ||
      sub.customer_details?.name?.toLowerCase().includes(search.toLowerCase()) ||
      sub.customer_details?.email?.toLowerCase().includes(search.toLowerCase()) ||
      sub.plan_details?.name?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'Paused') return sub.is_paused;
    return sub.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleClose = (sub) => {
    setSelectedSub(sub);
    setShowCloseModal(true);
  };

  const confirmClose = () => {
    if (selectedSub) {
      closeSubscription(selectedSub.id, closeReason || 'Closed early by staff');
      setShowCloseModal(false);
      setCloseReason('');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#25232A]">Subscriptions</h2>
          <p className="text-xs text-[#6E6B75] mt-0.5">Manage full customer subscription lifecycles, quotes, and billing terms.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="md" icon={Plus} onClick={onOpenNewSub}>
            New Subscription
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E8E6EB] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === tab
                  ? 'bg-[#714B67] text-white shadow-sm'
                  : 'bg-[#F7F6F8] text-[#6E6B75] hover:text-[#25232A] hover:bg-[#EAE8ED]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="w-full md:w-64">
          <SearchField value={search} onChange={setSearch} placeholder="Search by SUB#, customer, plan..." />
        </div>
      </div>

      {/* Subscriptions Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#E8E6EB] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FB] text-[#6E6B75] border-b border-[#E8E6EB]">
              <tr>
                <th className="py-3 px-4 font-semibold">Subscription #</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Plan & Period</th>
                <th className="py-3 px-4 font-semibold text-right">Recurring (₹)</th>
                <th className="py-3 px-4 font-semibold">Next Billing</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6EB]">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-[#6E6B75]">
                    No subscriptions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSubs.map(sub => (
                  <tr key={sub.id} className="hover:bg-[#FAF9FB]/60 transition-colors">
                    {/* Number */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#714B67]">
                      {sub.number}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#25232A]">{sub.customer_details?.name}</div>
                      <div className="text-[11px] text-[#6E6B75]">{sub.customer_details?.email}</div>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#25232A]">{sub.plan_details?.name}</div>
                      <div className="text-[11px] text-[#6E6B75] capitalize">{sub.plan_details?.billing_period} · Terms: {sub.payment_terms}</div>
                    </td>

                    {/* Recurring Amount */}
                    <td className="py-3.5 px-4 text-right font-bold text-[#25232A] tabular-nums">
                      ₹{sub.total_recurring_amount}
                    </td>

                    {/* Next Billing */}
                    <td className="py-3.5 px-4 text-[#6E6B75]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#8C8895]" />
                        <span>{sub.next_billing_date || 'N/A'}</span>
                      </div>
                      {sub.expiry_date && (
                        <div className="text-[10px] text-[#8C8895]">Exp: {sub.expiry_date}</div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={sub.status} isPaused={sub.is_paused} />
                    </td>

                    {/* State Machine Transition Actions (PRD 6.1) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {/* Quotation -> Confirmed */}
                        {sub.status === 'Quotation' && (
                          <Button variant="primary" size="sm" onClick={() => confirmSubscription(sub.id)}>
                            Confirm Quote
                          </Button>
                        )}

                        {/* Confirmed -> Active */}
                        {sub.status === 'Confirmed' && (
                          <Button variant="primary" size="sm" onClick={() => activateSubscription(sub.id)}>
                            Activate
                          </Button>
                        )}

                        {/* Active Controls */}
                        {sub.status === 'Active' && (
                          <>
                            {sub.plan_details?.pausable && (
                              <button
                                onClick={() => togglePauseSubscription(sub.id)}
                                title={sub.is_paused ? "Resume Subscription" : "Pause Subscription"}
                                className={`p-1.5 rounded-lg text-xs font-medium border ${
                                  sub.is_paused 
                                    ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]' 
                                    : 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                                }`}
                              >
                                {sub.is_paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                              </button>
                            )}

                            {sub.plan_details?.renewable && (
                              <button
                                onClick={() => renewSubscription(sub.id)}
                                title="Renew Subscription (extends expiry date)"
                                className="p-1.5 rounded-lg text-xs font-medium bg-[#EAE8ED] text-[#25232A] hover:bg-[#DDD9E1] border border-[#DDD9E2]"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {sub.plan_details?.closable && (
                              <button
                                onClick={() => handleClose(sub)}
                                title="Close Early"
                                className="p-1.5 rounded-lg text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2] border border-[#FECACA]"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}

                        {sub.status === 'Closed' && sub.closed_reason && (
                          <span className="text-[10px] text-[#8C8895] italic max-w-xs truncate" title={sub.closed_reason}>
                            {sub.closed_reason}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Close Subscription Modal */}
      {showCloseModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-elevated border border-[#E8E6EB] p-5 space-y-4">
            <h3 className="font-semibold text-base text-[#25232A]">Close Subscription {selectedSub.number}</h3>
            <p className="text-xs text-[#6E6B75]">
              Please record the reason for closing this subscription early. This action will stop future recurring billing.
            </p>
            <textarea
              rows="3"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation / Project completed..."
              className="w-full p-2.5 rounded-xl border border-[#D7D4DC] text-xs focus:border-[#714B67] focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowCloseModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={confirmClose}>
                Confirm Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
