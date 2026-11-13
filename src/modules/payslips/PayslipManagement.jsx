import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Eye,
  Printer,
  Trash2,
  RefreshCw,
  Sparkles,
  Download,
  Calendar,
  Building2,
  DollarSign,
  Plus,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PayslipModal } from './PayslipModal';
import {
  getPayslipRecords,
  deletePayslipRecord,
  getPayrollRecords,
  createPayslipRecord,
  getEmployees,
} from '../../utils/dbHelpers';
import { formatCurrency, formatDate, getEmployeeDisplayName } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Lock } from 'lucide-react';

export const PayslipManagement = ({ selectedPayrollForPayslip, onClearSelectedPayroll }) => {
  const { role: userRole, isEmployee, currentEmployee, user } = useAuth();
  const isEmployeeRole = Boolean(isEmployee || userRole === 'Employee');

  const [payslips, setPayslips] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [activePayslipData, setActivePayslipData] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [slipList, payrollList, empList] = await Promise.all([
        getPayslipRecords(),
        getPayrollRecords(),
        getEmployees(),
      ]);
      setPayslips(slipList || []);
      setPayrolls(payrollList || []);
      setEmployees(empList || []);
    } catch (err) {
      showToast(err.message || 'Error loading payslip records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // If redirected from PayrollManagement with a selected payroll
  useEffect(() => {
    if (selectedPayrollForPayslip) {
      setActivePayslipData({
        employee: selectedPayrollForPayslip.employees,
        payroll: selectedPayrollForPayslip,
        payslipId: `AUTO-${selectedPayrollForPayslip.id}`,
        generatedDate: new Date().toISOString(),
      });
      if (onClearSelectedPayroll) onClearSelectedPayroll();
    }
  }, [selectedPayrollForPayslip, onClearSelectedPayroll]);

  const handleDeletePayslip = async () => {
    if (!deleteItem) return;
    if (isEmployeeRole) {
      showToast('Permission Denied: Standard employees cannot delete payslip records.', 'error');
      setDeleteItem(null);
      return;
    }
    try {
      setActionLoading(true);
      const slipId = deleteItem.slip?.id || (String(deleteItem.id).startsWith('slip-') ? deleteItem.id : null);
      const payrollId = deleteItem.payroll?.id || (!String(deleteItem.id).startsWith('slip-') ? deleteItem.id : null);
      await deletePayslipRecord(slipId, payrollId);
      showToast('Payslip voucher deleted successfully', 'success');
      setDeleteItem(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete payslip', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open viewer for a payslip record
  const handleOpenPayslip = (slip) => {
    setActivePayslipData({
      employee: slip.employees,
      payroll: slip.payroll,
      payslipId: slip.id,
      generatedDate: slip.created_at,
    });
  };

  // Generate / View for any payroll record directly
  const handleGenerateFromPayroll = async (pay) => {
    // Check if payslip record already exists
    let existing = payslips.find((s) => s.payroll_id === pay.id);
    let slipId = existing?.id;

    if (!existing) {
      try {
        const created = await createPayslipRecord({
          employee_id: pay.employee_id,
          payroll_id: pay.id,
          file_url: null,
        });
        if (created && created[0]) {
          slipId = created[0].id;
        }
        await loadData();
      } catch (e) {
        console.warn('Could not register payslip record row:', e);
      }
    }

    const emp = pay.employees || employees.find((e) => String(e.id) === String(pay.employee_id));
    setActivePayslipData({
      employee: emp,
      payroll: pay,
      payslipId: slipId || `PAY-${pay.id}`,
      generatedDate: new Date().toISOString(),
    });
  };

  // Combine payslips and payroll items for display
  // If a payroll item doesn't have a payslips table row yet, we still display it so HR can generate payslip instantly!
  const combinedItems = payrolls.map((pay) => {
    const slip = payslips.find((s) => s.payroll_id === pay.id);
    const emp = pay.employees || employees.find((e) => String(e.id) === String(pay.employee_id));
    return {
      payroll: pay,
      slip: slip || null,
      employee: emp,
      id: slip?.id || `payroll-${pay.id}`,
      isGenerated: !!slip,
    };
  });

  const filteredItems = combinedItems.filter((item) => {
    // Standard employees can only see their personal payslip not see other
    if (isEmployeeRole && currentEmployee) {
      const isSelf =
        String(item.employee?.id) === String(currentEmployee.id) ||
        (item.employee?.email && user?.email && item.employee.email.toLowerCase().trim() === user.email.toLowerCase().trim());
      if (!isSelf) return false;
    }

    const empName = getEmployeeDisplayName(item.employee).toLowerCase();
    const matchesSearch =
      empName.includes(searchTerm.toLowerCase()) ||
      (item.employee?.email && item.employee.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.employee?.department && item.employee.department.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D3250] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#FFB17A]" />
            Payslip Management
          </h1>
          <p className="text-xs text-[#676F9D] mt-0.5">
            {isEmployeeRole
              ? 'View, download, and print your personal salary vouchers and tax receipts'
              : 'View, generate, print, and export official salary vouchers and PDF payslips'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
            title="Refresh list"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Scope Banner for Standard Employees */}
      {isEmployeeRole && (
        <div className="rounded-2xl bg-blue-50/70 border border-blue-200/80 p-3.5 text-xs text-blue-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Personal Payslips Portal:</strong> You can only inspect and download your authenticated salary vouchers.
            </span>
          </div>
          <span className="text-[11px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-full shrink-0">
            Personal Mode
          </span>
        </div>
      )}

      {/* Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#676F9D]" />
          <input
            type="text"
            placeholder="Search payslips by employee name or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] pl-9 pr-4 py-2 text-sm text-[#2D3250] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
          />
        </div>
        <span className="text-xs font-semibold text-[#676F9D]">
          {filteredItems.length} available payslips
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading payslips archive..." />
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-[#676F9D]">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#2D3250]">No Payslips Available</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Payslips are generated from processed payroll records. Go to Payroll Management to process employee compensations first.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#676F9D] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Pay Period / Date</th>
                  <th className="px-6 py-4">Basic Pay</th>
                  <th className="px-6 py-4">Net Salary</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Payslip Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredItems.map((item) => {
                  const empName = getEmployeeDisplayName(item.employee);
                  const pay = item.payroll;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2D3250] text-white font-bold text-xs">
                            {empName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#2D3250] text-sm leading-snug">
                              {empName}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {item.employee?.department || 'Staff'} &bull; ID #{pay.employee_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {formatDate(pay.payment_date)}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-700">
                        {formatCurrency(pay.basic_salary)}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#2D3250] font-mono text-sm">
                        {formatCurrency(pay.net_salary)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            pay.payment_status === 'Paid'
                              ? 'success'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {pay.payment_status || 'Paid'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="accent"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleGenerateFromPayroll(pay)}
                            className="text-xs font-bold"
                          >
                            View / Print
                          </Button>
                          {!isEmployeeRole && (
                            <button
                              onClick={() => setDeleteItem(item)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Payslip Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payslip Viewer & Print Modal */}
      <PayslipModal
        isOpen={!!activePayslipData}
        onClose={() => setActivePayslipData(null)}
        payslipData={activePayslipData}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeletePayslip}
        title="Delete Payslip Voucher"
        message={`Are you sure you want to remove the payslip voucher for ${getEmployeeDisplayName(deleteItem?.employee)}? This will permanently delete the voucher record.`}
        cancelText="Close"
        confirmText="Yes, Delete"
        loading={actionLoading}
      />
    </div>
  );
};

