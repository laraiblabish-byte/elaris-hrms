import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export const SearchableSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options into { value, label, subtitle }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return {
      value: String(opt.value),
      label: opt.label || String(opt.value),
      subtitle: opt.subtitle,
    };
  });

  // Find currently selected option
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.subtitle && opt.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      // Auto-focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#424769] mb-1.5">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`relative w-full rounded-lg border bg-white px-3.5 py-2.5 text-left text-sm text-[#2D3250] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFB17A] focus:border-[#424769] flex items-center justify-between cursor-pointer ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
              : isOpen
              ? 'border-[#424769] ring-2 ring-[#FFB17A]'
              : 'border-gray-200 hover:border-[#676F9D]/50'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {Icon && <Icon className="w-4 h-4 text-[#676F9D] shrink-0" />}
            <span className={selectedOption ? 'font-medium text-[#2D3250]' : 'text-gray-400'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {selectedOption && !disabled && (
              <span
                onClick={handleClear}
                className="p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-[#676F9D] transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu Popup */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-xl bg-white shadow-xl border border-gray-100 py-2 max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Box */}
            <div className="px-3 pb-2 pt-1 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-[#676F9D]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type to filter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg bg-[#f8fafc] pl-8 pr-3 py-1.5 text-xs text-[#2D3250] placeholder-gray-400 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FFB17A] focus:border-[#424769]"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400 italic">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full px-3.5 py-2 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#FFB17A]/15 text-[#2D3250] font-bold'
                          : 'text-[#424769] hover:bg-gray-50'
                      }`}
                    >
                      <div className="truncate">
                        <p className="font-semibold text-[#2D3250]">{opt.label}</p>
                        {opt.subtitle && (
                          <p className="text-[10px] text-gray-500 truncate">{opt.subtitle}</p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#2D3250] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
};

