import React from 'react';

export function StatusBadge({ status, isPaused = false, isOverdue = false, daysOverdue = 0, className = '' }) {
  if (isOverdue) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
        Overdue ({daysOverdue}d)
      </span>
    );
  }

  if (isPaused) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] ${className}`}>
        Paused
      </span>
    );
  }

  const styles = {
    // Subscriptions & Invoices
    Draft: "bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]",
    Quotation: "bg-[#FDF2F8] text-[#A64D87] border border-[#FCE7F3]",
    Confirmed: "bg-[#F5EEF3] text-[#714B67] border border-[#E8DCE5]",
    Active: "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]",
    Paid: "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]",
    Closed: "bg-[#EAE8ED] text-[#4A4753] border border-[#DDD9E2]",
    Cancelled: "bg-[#EAE8ED] text-[#4A4753] border border-[#DDD9E2]",
  };

  const currentStyle = styles[status] || "bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStyle} ${className}`}>
      {status}
    </span>
  );
}
