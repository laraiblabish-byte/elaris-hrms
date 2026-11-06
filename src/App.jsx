import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// 10 Core Modules
import { Login } from './modules/auth/Login';
import { Signup } from './modules/auth/Signup';
import { Dashboard } from './modules/dashboard/Dashboard';
import { EmployeeManagement } from './modules/employees/EmployeeManagement';
import { DepartmentManagement } from './modules/departments/DepartmentManagement';
import { AttendanceManagement } from './modules/attendance/AttendanceManagement';
import { LeaveManagement } from './modules/leaves/LeaveManagement';
import { PayrollManagement } from './modules/payroll/PayrollManagement';
import { PayslipManagement } from './modules/payslips/PayslipManagement';
import { UserProfile } from './modules/profile/UserProfile';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [selectedPayrollForPayslip, setSelectedPayrollForPayslip] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2D3250]">
        <LoadingSpinner message="Connecting to Elaris HRMS..." size="lg" />
      </div>
    );
  }

  // Unauthenticated State: Show Login or Signup
  if (!user) {
    if (authView === 'signup') {
      return <Signup onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToSignup={() => setAuthView('signup')} />;
  }

  // Authenticated State: HRMS Layout + Modules
  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <Dashboard setActiveTab={setActiveTab} />
      )}

      {activeTab === 'employees' && (
        <EmployeeManagement />
      )}

      {activeTab === 'departments' && (
        <DepartmentManagement />
      )}

      {activeTab === 'attendance' && (
        <AttendanceManagement />
      )}

      {activeTab === 'leaves' && (
        <LeaveManagement />
      )}

      {activeTab === 'payroll' && (
        <PayrollManagement
          setActiveTab={setActiveTab}
          onSelectPayslipPayroll={(payroll) => setSelectedPayrollForPayslip(payroll)}
        />
      )}

      {activeTab === 'payslips' && (
        <PayslipManagement
          selectedPayrollForPayslip={selectedPayrollForPayslip}
          onClearSelectedPayroll={() => setSelectedPayrollForPayslip(null)}
        />
      )}

      {activeTab === 'profile' && (
        <UserProfile />
      )}
    </Layout>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
