import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  Trash2,
  Edit,
  FileText,
  Calendar,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PayrollModal } from './PayrollModal';
import {
  getPayrollRecords,
  createPayrollRecord,
  updatePayrollRecord,
  deletePayrollRecord,
  createPayslipRecord,
  getEmployees,
} from '../../utils/dbHelpers';
import { formatCurrency, formatDate, getEmployeeDisplayName } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export const PayrollManagement = ({ setActiveTab, onSelectPayslipPayroll }) => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [modalError, setModalError] = useState(null);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, empList] = await Promise.all([
        getPayrollRecords(),
        getEmployees(),
      ]);
      setPayrolls(list || []);
      setEmployees(empList || []);
    } catch (err) {
      showToast(err.message || 'Error loading payroll records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePayroll = async (formData) => {
    try {
      setActionLoading(true);
      setModalError(null);
      if (selectedRecord) {
        await updatePayrollRecord(selectedRecord.id, formData);
        showToast('Payroll record updated successfully!', 'success');
      } else {
        const created = await createPayrollRecord(formData);
        showToast('Payroll processed successfully!', 'success');
        
        // Also auto-generate payslip entry in payslips table if created
        if (created && created[0]) {
          try {
            await createPayslipRecord({
              employee_id: formData.employee_id,
              payroll_id: created[0].id,
              file_url: null,
            });
          } catch (pe) {
            console.warn('Could not auto-register payslip record:', pe);
          }
        }
      }
      setIsModalOpen(false);
      setSelectedRecord(null);
      await loadData();
    } catch (err) {
      const errMsg = err.message || 'Failed to save payroll record';
      setModalError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async (record) => {
    try {
      setActionLoading(true);
      await updatePayrollRecord(record.id, {
        ...record,
        payment_status: 'Paid',
      });
      showToast(`Marked #${record.id} as Paid`, 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update payment status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePayroll = async () => {
    if (!deleteId) return;
    try {
      setActionLoading(true);
      await deletePayrollRecord(deleteId);
      showToast('Payroll record deleted', 'success');
      setDeleteId(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete payroll record', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Navigate to payslip view for this payroll
  const handleViewPayslip = (payroll) => {
    if (onSelectPayslipPayroll) {
      onSelectPayslipPayroll(payroll);
    }
    if (setActiveTab) {
      setActiveTab('payslips');
    }
  };

  // Stats
  const totalAmount = payrolls.reduce((acc, p) => acc + (Number(p.net_salary) || 0), 0);
  const paidAmount = payrolls
    .filter((p) => p.payment_status === 'Paid')
    .reduce((acc, p) => acc + (Number(p.net_salary) || 0), 0);
  const pendingAmount = payrolls
    .filter((p) => p.payment_status === 'Pending')
    .reduce((acc, p) => acc + (Number(p.net_salary) || 0), 0);

  // Filtered
  const filteredPayrolls = payrolls.filter((p) => {
    const emp = p.employees || employees.find((e) => String(e.id) === String(p.employee_id));
    const empName = getEmployeeDisplayName(emp).toLowerCase();
    const empEmail = (emp?.email || '').toLowerCase();
    const matchesSearch =
      empName.includes(searchTerm.toLowerCase()) ||
      empEmail.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? p.payment_status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D3250] flex items-center gap-2">
            <Banknote className="w-6 h-6 text-[#FFB17A]" />
            Payroll Management
          </h1>
          <p className="text-xs text-[#676F9D] mt-0.5">
            Administer salaries, allowances, deductions, and disbursement records in PKR
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
            title="Refresh records"
          >
            Refresh
          </Button>
          <Button
            variant="accent"
            size="md"
            icon={Plus}
            onClick={() => {
              setSelectedRecord(null);
              setIsModalOpen(true);
            }}
            className="font-bold shadow-md"
          >
            Process Payroll
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Payroll Disbursed (PKR)"
          value={formatCurrency(totalAmount)}
          icon={TrendingUp}
          accentColor="#2D3250"
          description="Net cumulative compensation"
        />
        <StatCard
          title="Settled & Paid (PKR)"
          value={formatCurrency(paidAmount)}
          icon={CheckCircle2}
          accentColor="#10b981"
          description="Completed disbursements"
        />
        <StatCard
          title="Pending Payments (PKR)"
          value={formatCurrency(pendingAmount)}
          icon={Clock}
          accentColor="#f59e0b"
          description="Awaiting disbursement"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#676F9D]" />
          <input
            type="text"
            placeholder="Search employee by name/email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] pl-9 pr-4 py-2 text-sm text-[#2D3250] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
          >
            <option value="">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
          </select>

          {(searchTerm || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}

          <span className="text-xs font-semibold text-[#676F9D]">
            Total: {filteredPayrolls.length} entries
          </span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Calculating and retrieving payroll records..." />
        ) : filteredPayrolls.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-[#676F9D]">
              <Banknote className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#2D3250]">No Payroll Records Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm || statusFilter
                ? 'No records match your active search.'
                : 'Process salary, allowances, and bonuses for your employees.'}
            </p>
            {!searchTerm && !statusFilter && (
              <Button
                variant="accent"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setSelectedRecord(null);
                  setIsModalOpen(true);
                }}
              >
                Process First Payroll
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#676F9D] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Basic Pay (PKR)</th>
                  <th className="px-6 py-4">Allowances + Bonus</th>
                  <th className="px-6 py-4">Deductions (PKR)</th>
                  <th className="px-6 py-4">Net Salary (PKR)</th>
                  <th className="px-6 py-4">Pay Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredPayrolls.map((record) => {
                  const emp = record.employees || employees.find((e) => String(e.id) === String(record.employee_id));
                  const empName = getEmployeeDisplayName(emp);
                  const allowances = Number(record.allowances) || 0;
                  const bonus = Number(record.bonus) || 0;
                  const totalAdditions = allowances + bonus;

                  return (
                    <tr key={record.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2D3250] text-white font-bold text-xs">
                            {empName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#2D3250] text-sm leading-snug">
                              {empName}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono">
                              {emp?.department || 'Staff'} &bull; ID #{record.employee_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-gray-700">
                        {formatCurrency(record.basic_salary)}
                      </td>
                      <td className="px-6 py-4 text-emerald-700 font-mono font-medium">
                        +{formatCurrency(totalAdditions)}
                      </td>
                      <td className="px-6 py-4 text-rose-600 font-mono font-medium">
                        -{formatCurrency(record.deductions)}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#2D3250] text-sm font-mono">
                        {formatCurrency(record.net_salary)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {formatDate(record.payment_date)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            record.payment_status === 'Paid'
                              ? 'success'
                              : record.payment_status === 'Processing'
                              ? 'info'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {record.payment_status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {record.payment_status !== 'Paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(record)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Mark as Paid"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => handleViewPayslip(record)}
                            className="p-1.5 text-[#676F9D] hover:text-[#2D3250] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Generate / View Payslip"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-[#424769] hover:text-[#FFB17A] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(record.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal */}
      <PayrollModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecord(null);
          setModalError(null);
        }}
        onSave={handleSavePayroll}
        record={selectedRecord}
        loading={actionLoading}
        error={modalError}
        clearError={() => setModalError(null)}
        employees={employees}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeletePayroll}
        title="Delete Payroll Record"
        message="Are you sure you want to delete this payroll record? This action will permanently remove the salary entry and any associated payslips."
        confirmText="Yes, Delete"
        loading={actionLoading}
      />
    </div>
  );
};

