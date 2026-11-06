import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      className = '',
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#424769] mb-1.5"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#676F9D]">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            required={required}
            className={`block w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-[#2D3250] placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFB17A] focus:border-[#424769] ${
              Icon ? 'pl-9' : ''
            } ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-gray-200 hover:border-[#676F9D]/50'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

