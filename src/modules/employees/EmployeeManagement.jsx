import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmployeeModal } from './EmployeeModal';
import { EmployeeDetailsModal } from './EmployeeDetailsModal';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
} from '../../utils/dbHelpers';
import { formatCurrency, getEmployeeDisplayName } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailsEmployee, setDetailsEmployee] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [empList, deptList] = await Promise.all([
        getEmployees(),
        getDepartments(),
      ]);
      setEmployees(empList || []);
      setDepartments(deptList || []);
    } catch (err) {
      showToast(err.message || 'Error loading employee data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedEmployee(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setSelectedEmployee(emp);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (formData) => {
    try {
      setActionLoading(true);
      setModalError(null);

      if (selectedEmployee) {
        await updateEmployee(selectedEmployee.id, formData);
        showToast('Employee updated successfully!', 'success');
      } else {
        await createEmployee(formData);
        showToast('New employee added successfully!', 'success');
      }

      setIsModalOpen(false);
      setSelectedEmployee(null);
      await loadData();
    } catch (err) {
      console.error('Employee save error:', err);
      setModalError(err);
      showToast(err.message || 'Failed to save employee to database', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteId) return;
    try {
      setActionLoading(true);
      await deleteEmployee(deleteId);
      showToast('Employee removed successfully', 'success');
      setDeleteId(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete employee', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.full_name && emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = selectedDeptFilter ? emp.department === selectedDeptFilter : true;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#2D3250] flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#FFB17A]" />
            Employee Management
          </h1>
          <p className="text-xs font-medium text-[#676F9D] mt-1">
            Manage organization directory, employee credentials, roles, and compensation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={loadData}
            title="Refresh list"
            className="border-gray-200"
          >
            Refresh
          </Button>
          <Button
            variant="accent"
            size="md"
            icon={Plus}
            onClick={handleOpenCreateModal}
            className="font-extrabold shadow-md shadow-[#FFB17A]/25 px-5 py-2.5 text-sm bg-[#FFB17A] text-[#2D3250] hover:bg-[#fca05f] cursor-pointer"
          >
            Create Employee
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#676F9D]" />
          <input
            type="text"
            placeholder="Search by name, email, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] pl-9 pr-4 py-2 text-sm text-[#2D3250] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB17A] focus:border-[#424769]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#676F9D]" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
          >
            <option value="">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.department_name}>
                {d.department_name}
              </option>
            ))}
          </select>
          <span className="text-xs font-semibold text-[#676F9D]">
            Showing {filteredEmployees.length} of {employees.length}
          </span>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Fetching personnel roster..." />
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-[#676F9D]">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#2D3250]">No Employees Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm || selectedDeptFilter
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'Get started by creating your first employee profile.'}
            </p>
            {!searchTerm && !selectedDeptFilter && (
              <Button
                variant="accent"
                size="md"
                icon={Plus}
                onClick={handleOpenCreateModal}
                className="font-bold shadow-md shadow-[#FFB17A]/25"
              >
                Create First Employee
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#676F9D] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Salary (PKR)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredEmployees.map((emp) => {
                  const displayName = getEmployeeDisplayName(emp);
                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2D3250] text-white font-bold text-xs">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#2D3250] text-sm leading-snug">
                              {displayName}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono">
                              ID: #{emp.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="default" size="sm">
                          {emp.department || 'Unassigned'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#424769]">
                        {emp.designation || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#676F9D]" />
                          <span>{emp.email}</span>
                        </div>
                        {emp.phone && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone className="w-3 h-3 text-[#676F9D]" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-700">
                        {formatCurrency(emp.salary)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailsEmployee(emp)}
                            className="p-1.5 text-[#676F9D] hover:text-[#2D3250] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 text-[#424769] hover:text-[#FFB17A] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Employee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(emp.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Employee"
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

      {/* Add / Edit Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
          setModalError(null);
        }}
        onSave={handleSaveEmployee}
        employee={selectedEmployee}
        loading={actionLoading}
        error={modalError}
        clearError={() => setModalError(null)}
      />

      {/* Employee Details Modal */}
      <EmployeeDetailsModal
        isOpen={!!detailsEmployee}
        onClose={() => setDetailsEmployee(null)}
        employee={detailsEmployee}
        onEdit={(emp) => handleOpenEditModal(emp)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteEmployee}
        title="Delete Employee"
        message="Are you sure you want to remove this employee from the system? Any associated attendance, leaves, and payroll records may also be affected."
        confirmText="Yes, Delete"
        loading={actionLoading}
      />
    </div>
  );
};
