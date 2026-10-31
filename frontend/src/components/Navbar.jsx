import React from 'react';
import { Layers, ShieldCheck, UserCheck, User, LogOut } from 'lucide-react';
import { useData } from '../context/DataContext';

export function Navbar({ setActiveTab, onLogout }) {
  const { currentUser, activeRole, isDemo, switchRole } = useData();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E6EB] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#714B67] flex items-center justify-center text-white shadow-sm">
            <Layers className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-semibold text-base text-[#25232A] leading-tight">Brightloop</h1>
            <p className="text-[11px] text-[#6E6B75] -mt-0.5">Subscription Platform</p>
          </div>
        </div>

        {/* Role Switcher & User info */}
        <div className="flex items-center gap-3">
          {/* Quick role selector */}
          {isDemo && <div className="flex items-center bg-[#F3F2F5] p-1 rounded-xl border border-[#E8E6EB]">
            <button
              onClick={() => {
                switchRole('admin');
                setActiveTab('dashboard');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${activeRole === 'admin' ? 'bg-[#714B67] text-white shadow-sm' : 'text-[#6E6B75] hover:text-[#25232A]'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Admin
            </button>
            <button
              onClick={() => {
                switchRole('staff');
                if (activeTab === 'staff') {
                  setActiveTab('dashboard');
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${activeRole === 'staff' ? 'bg-[#714B67] text-white shadow-sm' : 'text-[#6E6B75] hover:text-[#25232A]'}`}
            >
              <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Staff
            </button>
            <button
              onClick={() => {
                switchRole('customer');
                setActiveTab('portal');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${activeRole === 'customer' ? 'bg-[#714B67] text-white shadow-sm' : 'text-[#6E6B75] hover:text-[#25232A]'}`}
            >
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              Customer Portal
            </button>
          </div>}

          {/* User profile avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E8E6EB]">
            <div className="w-8 h-8 rounded-full bg-[#EAE8ED] flex items-center justify-center text-[#714B67] font-semibold text-xs border border-[#DDD9E2]">
              {(currentUser?.name || 'Customer').charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-[#25232A] leading-none">{currentUser?.name || 'Customer'}</p>
              <p className="text-[10px] text-[#6E6B75] capitalize mt-0.5">{activeRole || currentUser?.role || 'Customer'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#6E6B75] transition-colors hover:bg-[#F3F2F5] hover:text-[#714B67] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#714B67]"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
