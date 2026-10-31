import React from 'react';
import { Search } from 'lucide-react';

export function SearchField({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-[#8C8895] absolute left-3 pointer-events-none" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#EAE8ED]/70 hover:bg-[#EAE8ED] focus:bg-white text-sm text-[#25232A] placeholder-[#8C8895] pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-[#714B67] focus:outline-none transition-colors"
      />
    </div>
  );
}
