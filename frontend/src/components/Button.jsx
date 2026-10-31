import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'inverted' | 'outlined' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon: Icon,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2 text-sm rounded-xl gap-2",
    lg: "px-5 py-2.5 text-base rounded-2xl gap-2.5"
  };

  const variantStyles = {
    primary: "bg-[#714B67] hover:bg-[#5E3B55] text-white shadow-sm active:bg-[#4D2E45]",
    secondary: "bg-[#EAE8ED] hover:bg-[#DDD9E1] text-[#25232A] active:bg-[#D0CCD5]",
    inverted: "bg-[#25232A] hover:bg-[#18161D] text-white shadow-sm active:bg-[#0E0D10]",
    outlined: "border border-[#D7D4DC] hover:bg-[#F2F0F4] text-[#25232A] active:bg-[#EAE7EE] bg-transparent",
    danger: "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm active:bg-[#991B1B]"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4"} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  variant = 'secondary', // 'primary' | 'secondary' | 'tertiary' | 'danger' | 'square-edit'
  size = 'md',
  label,
  className = '',
  onClick,
  ...props
}) {
  const sizeStyles = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base"
  };

  const variantStyles = {
    primary: "bg-[#714B67] hover:bg-[#5E3B55] text-white rounded-full",
    secondary: "bg-[#A64D87] hover:bg-[#8F3C72] text-white rounded-full",
    tertiary: "bg-[#25232A] hover:bg-[#151419] text-white rounded-full",
    danger: "bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-full",
    'square-edit': "bg-[#4A4753] hover:bg-[#393740] text-white rounded-xl"
  };

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
    </button>
  );
}
