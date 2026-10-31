import React from 'react';

export function ProgressBar({ value = 0, max = 100, variant = 'primary', height = 'h-1.5', className = '' }) {
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100));

  const variantFills = {
    primary: "bg-[#714B67]",
    secondary: "bg-[#A64D87]",
    tertiary: "bg-[#25232A]",
    success: "bg-[#16A34A]",
    danger: "bg-[#DC2626]"
  };

  return (
    <div className={`w-full bg-[#EAE8ED] rounded-full overflow-hidden ${height} ${className}`}>
      <div
        className={`${variantFills[variant]} h-full rounded-full transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
