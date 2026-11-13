import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
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
import { BenefitsManagement } from './modules/benefits/BenefitsManagement';
import { PayrollManagement } from './modules/payroll/PayrollManagement';
import { PayslipManagement } from './modules/payslips/PayslipManagement';
import { UserProfile } from './modules/profile/UserProfile';

function AppContent() {
  const { user, loading, isEmployee } = useAuth();
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

      {activeTab === 'benefits' && (
        <BenefitsManagement />
      )}

      {activeTab === 'employees' && (
        <EmployeeManagement setActiveTab={setActiveTab} />
      )}

      {activeTab === 'departments' && (
        <DepartmentManagement />
      )}

      {activeTab === 'attendance' && (
        <AttendanceManagement />
      )}

      {activeTab === 'leaves' && (
        <LeaveManagement setActiveTab={setActiveTab} />
      )}

      {/* Guard for Payroll */}
      {isEmployee && activeTab === 'payroll' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-500 max-w-md text-sm mb-6">
            Company-wide payroll processing is restricted to HR and Finance administration. You can inspect and download your personal salary vouchers in Payslips.
          </p>
          <button
            onClick={() => setActiveTab('payslips')}
            className="px-5 py-2.5 rounded-xl bg-[#2D3250] text-white font-medium text-sm hover:bg-[#424769] transition-colors cursor-pointer shadow-xs"
          >
            Go to My Payslips
          </button>
        </div>
      )}

      {!isEmployee && activeTab === 'payroll' && (
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
