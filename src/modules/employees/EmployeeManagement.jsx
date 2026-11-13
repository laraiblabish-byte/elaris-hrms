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
  Building2,
  Phone,
  RefreshCw,
  AlertCircle,
  Award,
  Lock,
  ShieldCheck,
  UserCheck,
  ArrowRight,
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
import { useAuth } from '../../context/AuthContext';

export const EmployeeManagement = ({ setActiveTab }) => {
  const { role: userRole, isHR, isDeptHead, isSuperAdmin, isEmployee, currentEmployee, user } = useAuth();

  // Only standard employees cannot add employees; Department Heads, HR, and Admin can all add employees
  const isEmployeeRole = Boolean(isEmployee || userRole === 'Employee');
  const canManageEmployees = !isEmployeeRole;

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
    if (!canManageEmployees) {
      showToast('Permission Denied: Standard employees cannot add employees. Department Heads and HR departments are authorized.', 'error');
      return;
    }
    setSelectedEmployee(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    if (!canManageEmployees) {
      showToast('Permission Denied: Standard employees cannot edit employee profiles.', 'error');
      return;
    }
    setSelectedEmployee(emp);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (formData) => {
    try {
      setActionLoading(true);
      setModalError(null);

      // Only standard employees cannot add employees; Head, HR, Admin can all add
      if (!selectedEmployee && !canManageEmployees) {
        throw new Error('Permission Denied: Standard employees cannot add employees. Department Heads and HR departments are authorized.');
      }
      if (selectedEmployee && !canManageEmployees) {
        throw new Error('Permission Denied: Standard employees cannot edit employee records.');
      }

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
      const msg = err.message || 'Failed to save employee to database';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteId) return;
    if (!canManageEmployees) {
      showToast('Permission Denied: Standard employees cannot delete employee accounts.', 'error');
      setDeleteId(null);
      return;
    }
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

  // Department counts
  const deptCounts = departments.map((dept) => {
    const deptName = dept.department_name || dept.name || '';
    const count = employees.filter(
      (e) => (e.department || '').toLowerCase().trim() === deptName.toLowerCase().trim()
    ).length;
    return {
      name: deptName,
      count,
      percentage: employees.length > 0 ? Math.round((count / employees.length) * 100) : 0,
    };
  });

  const myDeptName = (currentEmployee?.department || '').toLowerCase().trim();
  const myDeptStaffCount = employees.filter(
    (e) => (e.department || '').toLowerCase().trim() === myDeptName
  ).length;

  const tierCounts = {
    Executive: employees.filter((e) => (e.role_tier || '').toLowerCase() === 'executive').length,
    Senior: employees.filter((e) => (e.role_tier || '').toLowerCase() === 'senior').length,
    'Mid-Level': employees.filter((e) => (e.role_tier || 'mid-level').toLowerCase() === 'mid-level').length,
    Junior: employees.filter((e) => (e.role_tier || '').toLowerCase() === 'junior').length,
  };

  if (loading) {
    return <LoadingSpinner message="Loading employee workforce data..." size="lg" />;
  }

  // ==============================================================================
  // 1. STANDARD EMPLOYEE VIEW: NUMBERS OF EMPLOYEES ONLY (NO INDIVIDUAL DETAIL TABLE)
  // ==============================================================================
  if (isEmployeeRole) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#2D3250] text-[#FFB17A]">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-[#2D3250]">Workforce Numbers & Headcount</h1>
            </div>
            <p className="text-xs font-medium text-[#676F9D] mt-1">
              Active company workforce statistics, team counts, and departmental headcount
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
              <Lock className="w-3.5 h-3.5 text-amber-600" /> Headcount Numbers Only
            </span>
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={loadData}
              title="Refresh numbers"
              className="border-gray-200 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Primary Headcount Numbers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
                Total Employees
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-[#2D3250]">
              {employees.length}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Total company workforce</p>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
                Departments
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-[#2D3250]">
              {departments.length}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Operational divisions</p>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
                My Team Size
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-emerald-700">
              {myDeptStaffCount}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 truncate">
              In {currentEmployee?.department || 'My Department'}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
                Experience Tiers
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-[#2D3250]">
              4
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Corporate grade tiers</p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="rounded-2xl bg-blue-50/70 border border-blue-200/80 p-4 text-xs text-blue-900 flex items-start sm:items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <span className="font-bold">Workforce Privacy Active: </span>
            <span>
              Standard employee accounts have access to overall headcount figures and departmental numbers. Individual staff profiles, contacts, and personal employment files are restricted to HR Management and Department Heads.
            </span>
          </div>
        </div>

        {/* Department Numbers Breakdown Grid */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#2D3250] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FFB17A]" />
                Headcount by Department
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Staff distribution and numbers across active business units
              </p>
            </div>
            <span className="text-xs font-bold text-[#676F9D]">
              {departments.length} Units
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deptCounts.map((dept, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-100 bg-[#f8fafc] hover:bg-gray-50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#2D3250] truncate">
                    {dept.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#2D3250] text-[#FFB17A]">
                    {dept.count} Staff
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FFB17A] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(dept.percentage, 5)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Headcount Share</span>
                  <span className="font-semibold text-gray-700">{dept.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seniority & Role Tier Numbers */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-xs p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-[#2D3250] flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Workforce Seniority Breakdown
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Staff counts by organizational experience tier
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 text-center">
              <span className="text-[11px] font-bold uppercase text-purple-700">Executive Tier</span>
              <div className="text-2xl font-black text-purple-900 mt-1">{tierCounts.Executive}</div>
              <span className="text-[10px] text-purple-600 font-medium">Leadership Staff</span>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center">
              <span className="text-[11px] font-bold uppercase text-indigo-700">Senior Tier</span>
              <div className="text-2xl font-black text-indigo-900 mt-1">{tierCounts.Senior}</div>
              <span className="text-[10px] text-indigo-600 font-medium">Senior Personnel</span>
            </div>
            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 text-center">
              <span className="text-[11px] font-bold uppercase text-sky-700">Mid-Level Tier</span>
              <div className="text-2xl font-black text-sky-900 mt-1">{tierCounts['Mid-Level']}</div>
              <span className="text-[10px] text-sky-600 font-medium">Core Engineers & Staff</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-[11px] font-bold uppercase text-emerald-700">Junior Tier</span>
              <div className="text-2xl font-black text-emerald-900 mt-1">{tierCounts.Junior}</div>
              <span className="text-[10px] text-emerald-600 font-medium">Associates & Interns</span>
            </div>
          </div>
        </div>

        {/* Quick Nav Action Cards for Employee Portal */}
        {setActiveTab && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('profile')}
              className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-[#FFB17A] shadow-xs text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#2D3250]">My Profile & Info</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#FFB17A] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Review your designation, employee ID & contact</p>
            </button>

            <button
              onClick={() => setActiveTab('benefits')}
              className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-[#FFB17A] shadow-xs text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#2D3250]">My Benefits & Leaves</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#FFB17A] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Check remaining leaves, health & policy perks</p>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-[#FFB17A] shadow-xs text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#2D3250]">My Attendance</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#FFB17A] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Clock in/out & view your personal attendance logs</p>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==============================================================================
  // 2. MANAGEMENT VIEW: HEADS & HR (FULL TABLE, CRUD, & DIRECTORY)
  // ==============================================================================
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.full_name && emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(emp.id).includes(searchTerm);

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

      {/* Headcount Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
              Total Employees
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#2D3250]">
            {employees.length}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">Total organization workforce</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
              Departments
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#2D3250]">
            {departments.length}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">Active business divisions</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
              {currentEmployee?.department || 'My Department'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {myDeptStaffCount} <span className="text-xs font-semibold text-gray-500">Staff</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">Team members in department</p>
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
        {filteredEmployees.length === 0 ? (
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
                  <th className="px-6 py-4">Benefit Tier</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Salary (PKR)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredEmployees.map((emp) => {
                  const displayName = getEmployeeDisplayName(emp);
                  const isExec = (emp.role_tier || '').toLowerCase() === 'executive';
                  const isSr = (emp.role_tier || '').toLowerCase() === 'senior';
                  const isJr = (emp.role_tier || '').toLowerCase() === 'junior';
                  const tierStyle = isExec
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : isSr
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    : isJr
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-sky-100 text-sky-800 border-sky-200';

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
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${tierStyle}`}>
                          <Award className="w-3 h-3" />
                          {emp.role_tier || 'Mid-Level'}
                        </span>
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
                          {setActiveTab && (
                            <button
                              onClick={() => setActiveTab('benefits')}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Inspect Benefits & Leaves Portal"
                            >
                              <Award className="w-4 h-4" />
                            </button>
                          )}
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
        canViewSalary={true}
        onEdit={(emp) => handleOpenEditModal(emp)}
        onViewBenefits={setActiveTab ? () => setActiveTab('benefits') : null}
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
