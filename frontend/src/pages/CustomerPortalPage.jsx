import React, { useState } from 'react';
import { 
  User, CheckCircle, Pause, Play, RefreshCw, XCircle, 
  FileText, Download, Lock, Building, Phone, Mail, Check, AlertCircle 
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';

export function CustomerPortalPage({ onOpenInvoice }) {
  const { 
    currentUser, 
    subscriptions, 
    invoices, 
    payments,
    togglePauseSubscription, 
    renewSubscription, 
    closeSubscription 
  } = useData();

  // AUTH-6: Scoped to customer only
  const mySubscriptions = subscriptions.filter(s => s.customer === currentUser.id || currentUser.role !== 'customer');
  const myInvoices = invoices.filter(inv => inv.customer === currentUser.id || currentUser.role !== 'customer');
  const myPayments = payments.filter(p => p.customer_name === currentUser.name || currentUser.role !== 'customer');

  const [activeTab, setActiveTab] = useState('subs'); // 'subs' | 'invoices' | 'payments' | 'profile'

  // Profile Form state
  const [name, setName] = useState(currentUser.name);
  const [company, setCompany] = useState(currentUser.customer_profile?.company_name || '');
  const [phone, setPhone] = useState(currentUser.customer_profile?.phone || '');
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

  return (
    <div className="space-y-6 pb-20">
      {/* Customer Header */}
      <div className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#714B67] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#25232A]">{currentUser.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5EEF3] text-[#714B67] border border-[#E8DCE5]">
                Self-Service Portal
              </span>
            </div>
            <p className="text-xs text-[#6E6B75] mt-0.5">
              {currentUser.customer_profile?.company_name ? `${currentUser.customer_profile.company_name} · ` : ''}{currentUser.email}
            </p>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center gap-1.5 bg-[#F7F6F8] p-1 rounded-xl border border-[#E8E6EB] self-start sm:self-auto">
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

      {/* Tab 1: My Subscriptions */}
      {activeTab === 'subs' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#25232A]">Active & Past Subscriptions</h3>
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
        </div>
      )}

      {/* Tab 2: My Invoices & Payments */}
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

      {/* Tab 3: My Profile & Password (PORT-4 & AUTH-2) */}
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
    </div>
  );
}
