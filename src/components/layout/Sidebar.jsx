import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarOff,
  Banknote,
  FileText,
  UserCheck,
  User,
  LogOut,
  X,
  Sparkles,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'benefits', label: 'Benefits & Portal', icon: Award },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'leaves', label: 'Leave Requests', icon: CalendarOff },
  { id: 'payroll', label: 'Payroll', icon: Banknote },
  { id: 'payslips', label: 'Payslips', icon: FileText },
  { id: 'profile', label: 'My Profile', icon: UserCheck },
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogoutClick }) => {
  const { user, profile, isHR, isEmployee, role: userRole } = useAuth();

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (setIsOpen) setIsOpen(false);
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayRole = userRole || profile?.role || user?.user_metadata?.role || (isHR ? 'HR Specialist' : 'Employee');
  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    (user?.id ? localStorage.getItem(`elaris_avatar_${user.id}`) : null) ||
    (user?.email ? localStorage.getItem(`elaris_avatar_${user.email}`) : null) ||
    '';

  const filteredNavItems = navigationItems.filter((item) => {
    if (isEmployee) {
      if (item.id === 'payroll') {
        return false;
      }
    }
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#2D3250]/70 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#2D3250] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-[#424769]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB17A] to-[#fca05f] text-[#2D3250] shadow-md shadow-[#FFB17A]/20">
              <Sparkles className="h-6 w-6 font-bold" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white leading-tight">
                Elaris<span className="text-[#FFB17A]">Solutions</span>
              </h1>
              <p className="text-[11px] font-medium tracking-wide uppercase text-[#676F9D]">
                HRMS & Payroll Suite
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-[#424769] hover:text-white lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#676F9D]">
            Main Menu
          </p>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#FFB17A] text-[#2D3250] shadow-md shadow-[#FFB17A]/25 translate-x-1 font-bold'
                    : 'text-gray-300 hover:bg-[#424769] hover:text-white'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive ? 'text-[#2D3250]' : 'text-[#676F9D] group-hover:text-[#FFB17A]'
                  }`}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && (
                  <span className="h-2 w-2 rounded-full bg-[#2D3250]" />
                )}
              </button>
            );
          })}
        </div>

        {/* User profile & Logout footer */}
        <div className="border-t border-[#424769] p-4 bg-[#2D3250]/80">
          <div
            onClick={() => handleSelectTab('profile')}
            className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#424769] cursor-pointer"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-10 w-10 shrink-0 rounded-xl object-cover border border-[#676F9D]/50 shadow-xs"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#424769] text-[#FFB17A] border border-[#676F9D]/50 font-bold text-sm">
                <User className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-bold text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-[#676F9D]">
                {displayRole}
              </p>
            </div>
          </div>

          <button
            onClick={onLogoutClick}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

