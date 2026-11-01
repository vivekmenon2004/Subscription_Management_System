import React, { useState } from 'react';
import { 
  Users, UserPlus, ShieldCheck, ShieldAlert, CheckCircle2, 
  XCircle, Lock, Mail, User, Shield, AlertTriangle, KeyRound
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';

export function StaffManagementPage({ setActiveTab }) {
  const { staffMembers, addStaffMember, toggleStaffStatus, activeRole, switchRole } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Password validation per AUTH-2: 9+ chars, 1 uppercase, 1 lowercase, 1 special char
  const hasMinLength = password.length >= 9;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setErrorNotice('');

    if (!name.trim()) {
      setErrorNotice('Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorNotice('A valid email address is required.');
      return;
    }
    if (!isPasswordValid) {
      setErrorNotice('Password does not meet the PRD AUTH-2 complexity requirements.');
      return;
    }

    try {
      const created = await addStaffMember({ name, email, password, role });
      setSuccessNotice(`Staff member ${created.name} (${created.email}) provisioned successfully.`);
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('staff');
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err) {
      setErrorNotice(err.message || 'Failed to create staff member.');
    }
  };

  // If active user is not Admin, render 403 Forbidden per PRD Section 2.1
  if (activeRole !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6 text-center pb-24">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
            <span>HTTP 403 · Permission Denied</span>
          </div>
          <h2 className="text-2xl font-bold text-[#25232A]">Admin Access Required</h2>
          <p className="text-sm text-[#6E6B75] max-w-lg mx-auto leading-relaxed">
            Per <strong>PRD Section 2.1 Permission Matrix</strong> and <strong>AUTH-5</strong>, only an 
            <strong> Admin</strong> can create, manage, or view staff accounts. Staff members are strictly restricted 
            from managing system users.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E6EB] shadow-card text-left text-xs space-y-3">
          <p className="font-semibold text-[#25232A] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#714B67]" />
            PRD Acceptance Criteria Enforced:
          </p>
          <div className="p-3 bg-[#FAF9FB] rounded-xl border border-[#E8E6EB] font-mono text-[11px] text-[#714B67]">
            Given a logged-in staff user, when they call the create-staff endpoint, then they get 403; an admin succeeds.
          </div>
          <div className="flex justify-center pt-2">
            <Button 
              variant="primary" 
              size="md" 
              icon={ShieldCheck} 
              onClick={() => switchRole('admin')}
            >
              Switch to Admin Role to View Staff
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const staffCount = staffMembers.filter(s => s.role === 'staff').length;
  const adminCount = staffMembers.filter(s => s.role === 'admin').length;
  const activeCount = staffMembers.filter(s => s.is_active).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FDF2F8] border border-[#FBCFE8] text-[#714B67] text-[11px] font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Exclusive Capability (PRD 2.1)
          </div>
          <h2 className="text-xl font-bold text-[#25232A]">Staff & Team Management</h2>
          <p className="text-xs text-[#6E6B75] mt-0.5">
            Provision internal staff accounts, toggle credentials, and enforce role boundaries.
          </p>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          icon={UserPlus} 
          onClick={() => setShowAddModal(true)}
        >
          Add Staff Member
        </Button>
      </div>

      {successNotice && (
        <div className="p-3.5 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-medium flex items-center justify-between border border-[#BBF7D0]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice('')} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E8E6EB] shadow-card">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span>Total Team Accounts</span>
            <Users className="w-4 h-4 text-[#714B67]" />
          </div>
          <p className="text-2xl font-black text-[#25232A] mt-2 tabular-nums">{staffMembers.length}</p>
          <p className="text-[11px] text-[#6E6B75] mt-1">{activeCount} active in system</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8E6EB] shadow-card">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span>Internal Staff</span>
            <User className="w-4 h-4 text-[#A64D87]" />
          </div>
          <p className="text-2xl font-black text-[#A64D87] mt-2 tabular-nums">{staffCount}</p>
          <p className="text-[11px] text-[#6E6B75] mt-1">Quotations, billing & operations</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8E6EB] shadow-card">
          <div className="flex justify-between items-center text-[#6E6B75] text-xs">
            <span>System Admins</span>
            <Shield className="w-4 h-4 text-[#714B67]" />
          </div>
          <p className="text-2xl font-black text-[#714B67] mt-2 tabular-nums">{adminCount}</p>
          <p className="text-[11px] text-[#6E6B75] mt-1">Full access & configuration</p>
        </div>
      </div>

      {/* Staff Accounts Table */}
      <div className="bg-white rounded-2xl border border-[#E8E6EB] shadow-card overflow-hidden">
        <div className="p-4 border-b border-[#E8E6EB] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#25232A]">Active Staff Accounts</h3>
          <span className="text-xs text-[#6E6B75]">Enforced via Django `StaffViewSet` (`IsAdmin`)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FB] text-[#6E6B75] border-b border-[#E8E6EB]">
              <tr>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Created</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6EB]">
              {staffMembers.map(staff => (
                <tr key={staff.id} className="hover:bg-[#FAF9FB]/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EAE8ED] flex items-center justify-center font-bold text-[#714B67]">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#25232A]">{staff.name}</p>
                        <p className="text-[#6E6B75] text-[11px]">{staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      staff.role === 'admin' 
                        ? 'bg-[#FDF2F8] text-[#714B67] border border-[#FBCFE8]' 
                        : 'bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]'
                    }`}>
                      {staff.role === 'admin' ? 'System Admin' : 'Internal Staff'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      staff.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {staff.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#6E6B75]">
                    {staff.created_at || '2026-10-31'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {staff.id !== 1 ? (
                      <button
                        onClick={() => toggleStaffStatus(staff.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          staff.is_active 
                            ? 'text-amber-700 border-amber-200 hover:bg-amber-50' 
                            : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {staff.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#8C8895] italic">Primary Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRD Permission Matrix Reference Card */}
      <div className="bg-white rounded-2xl border border-[#E8E6EB] p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#714B67]" />
            <h3 className="font-bold text-sm text-[#25232A]">PRD Section 2.1 Role & Permission Matrix Reference</h3>
          </div>
          <span className="text-[11px] text-[#6E6B75] bg-[#F7F6F8] px-2.5 py-0.5 rounded-md border border-[#E8E6EB]">
            Enforced in Django backend & React frontend
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#E8E6EB] rounded-xl overflow-hidden">
            <thead className="bg-[#FAF9FB] text-[#6E6B75] border-b border-[#E8E6EB]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Capability</th>
                <th className="py-2.5 px-3 font-semibold text-center text-[#714B67]">Admin</th>
                <th className="py-2.5 px-3 font-semibold text-center text-[#A64D87]">Staff</th>
                <th className="py-2.5 px-3 font-semibold text-center">Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6EB]">
              <tr>
                <td className="py-2 px-3 font-medium text-[#25232A]">Manage staff accounts</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-red-600 font-medium">No (403)</td>
                <td className="py-2 px-3 text-center text-[#6E6B75]">No</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-[#25232A]">Manage products, variants, plans, taxes</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-amber-700 font-semibold bg-amber-50/50">Read only</td>
                <td className="py-2 px-3 text-center text-[#6E6B75]">No</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-[#25232A]">Create discount rules</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-amber-700 font-semibold bg-amber-50/50">Read only</td>
                <td className="py-2 px-3 text-center text-[#6E6B75]">No</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-[#25232A]">Manage quotation templates</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-blue-700 font-semibold bg-blue-50/50">Use only</td>
                <td className="py-2 px-3 text-center text-[#6E6B75]">No</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-[#25232A]">Create & edit subscriptions</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-[#6E6B75]">No</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-[#25232A]">Generate, confirm, cancel, send invoices</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-[#6E6B75]">View / Download Own</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-[#25232A]">Record payments</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-[#6E6B75]">No</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-[#25232A]">Void payment (PAY-6 Reversal)</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-red-600 font-medium">No</td>
                <td className="py-2 px-3 text-center text-[#6E6B75]">No</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-[#25232A]">Automated daily billing engine trigger</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-bold">Yes</td>
                <td className="py-2 px-3 text-center text-red-600 font-medium">No (Celery Job)</td>
                <td className="py-2 px-3 text-center text-[#6E6B75]">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-elevated border border-[#E8E6EB] p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-[#25232A]">Provision Internal Staff Account</h3>
                <p className="text-xs text-[#6E6B75] mt-0.5">Admin-only action (PRD AUTH-5 / Acceptance Criteria)</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#8C8895] hover:text-[#25232A] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {errorNotice && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#25232A] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Nair"
                  className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#25232A] mb-1">Company Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. priya@brightloop.io"
                  className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#25232A] mb-1">Role Assignment</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  <option value="staff">Internal Staff (Quotations, Invoices, Subscriptions, Payments)</option>
                  <option value="admin">System Admin (Full catalog, taxes, discounts, staff accounts)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-[#25232A]">Temporary Password (AUTH-2)</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter strong password (9+ chars, A-Z, a-z, special)"
                  className="w-full px-3 py-2 rounded-xl border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />

                {/* Live AUTH-2 Checklist */}
                <div className="p-3 bg-[#FAF9FB] rounded-xl border border-[#E8E6EB] space-y-1 text-[11px]">
                  <p className="font-semibold text-[#6E6B75] mb-1">PRD Password Complexity Rules:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      {hasMinLength ? '✓' : '○'} 9+ Characters
                    </span>
                    <span className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      {hasUpper ? '✓' : '○'} 1 Uppercase Letter
                    </span>
                    <span className={`flex items-center gap-1 ${hasLower ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      {hasLower ? '✓' : '○'} 1 Lowercase Letter
                    </span>
                    <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      {hasSpecial ? '✓' : '○'} 1 Special Character
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E6EB]">
                <Button variant="secondary" size="md" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit" disabled={!isPasswordValid}>
                  Save & Provision Staff
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
