import React, { forwardRef } from 'react';

export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      options = [],
      placeholder = 'Select an option',
      className = '',
      id,
      required,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#424769] mb-1.5"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          required={required}
          className={`block w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-[#2D3250] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFB17A] focus:border-[#424769] ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
              : 'border-gray-200 hover:border-[#676F9D]/50'
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

