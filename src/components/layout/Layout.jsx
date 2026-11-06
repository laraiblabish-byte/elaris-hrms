import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Layout = ({ activeTab, setActiveTab, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      showToast('Signed out successfully', 'info');
    } catch (err) {
      showToast(err.message || 'Error signing out', 'error');
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#2D3250]">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-72">
        <Header
          activeTab={activeTab}
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={() => setActiveTab('profile')}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Logout confirmation modal */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out Confirmation"
        message="Are you sure you want to end your current session?"
        cancelText="Close"
        confirmText="Sign Out"
        variant="danger"
        icon={LogOut}
        iconBg="bg-rose-50"
        iconColor="text-rose-600"
        loading={loggingOut}
      />
    </div>
  );
};

