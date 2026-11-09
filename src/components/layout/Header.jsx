import React from 'react';
import { Menu, ShieldCheck, Activity } from 'lucide-react';
import { navigationItems } from './Sidebar';

export const Header = ({ activeTab, onMenuClick, onProfileClick: _onProfileClick }) => {
  const currentItem = navigationItems.find((item) => item.id === activeTab);

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-200/80 bg-white/90 px-4 sm:px-8 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-[#424769] hover:bg-gray-100 lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[#2D3250]">
              {currentItem?.label || 'Dashboard'}
            </h2>
          </div>
          <p className="text-xs text-[#676F9D]">
            Elaris Solutions Management Console
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* System Online Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <Activity className="h-3.5 w-3.5 text-emerald-600" />
          <span>System Online</span>
        </div>

        {/* Security badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-[#676F9D]/30 bg-[#676F9D]/10 px-3 py-1.5 text-xs font-medium text-[#424769]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#424769]" />
          <span>Secure Workspace</span>
        </div>
      </div>
    </header>
  );
};

