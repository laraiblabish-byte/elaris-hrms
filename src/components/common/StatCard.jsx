import React from 'react';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  description,
  accentColor = '#FFB17A',
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:border-[#676F9D]/40' : ''
      } ${className}`}
    >
      {/* Top accent highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#676F9D]">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-[#2D3250]">
            {value}
          </h3>
        </div>
        {Icon && (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${accentColor}1A`,
              color: '#2D3250',
            }}
          >
            <Icon className="h-6 w-6 text-[#2D3250]" />
          </div>
        )}
      </div>

      {(trend || description) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-semibold ${
                trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend}
            </span>
          )}
          {trendLabel && <span className="text-gray-400">{trendLabel}</span>}
          {description && <span className="text-gray-500">{description}</span>}
        </div>
      )}
    </div>
  );
};

