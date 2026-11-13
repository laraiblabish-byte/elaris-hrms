import React, { useState, useEffect } from 'react';
import {
  CalendarOff,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Calendar,
  AlertCircle,
  UserCheck,
  ShieldCheck,
  Building2,
  ArrowRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { LeaveModal } from './LeaveModal';
import {
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveByDeptHead,
  approveLeaveFinal,
  rejectLeave,
  deleteLeaveRequest,
  getDepartments,
  getEmployees,
} from '../../utils/dbHelpers';
import { formatDate, getEmployeeDisplayName, calculateLeaveDays } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const LeaveManagement = ({ setActiveTab }) => {
  const { user, profile, role: userRole, isHR, isDeptHead, isSuperAdmin, currentEmployee } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Tabs
  const [workflowTab, setWorkflowTab] = useState('all'); // 'all' | 'stage1' | 'stage2' | 'approved' | 'rejected'
  const [deptFilter, setDeptFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [modalError, setModalError] = useState(null);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [leaveList, deptList, empList] = await Promise.all([
        getLeaveRequests(),
        getDepartments(),
        getEmployees(),
      ]);
      setLeaves(leaveList || []);
      setDepartments(deptList || []);
      setEmployees(empList || []);
    } catch (err) {
      showToast(err.message || 'Error loading leave records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveLeave = async (formData) => {
    try {
      setActionLoading(true);
      setModalError(null);

      // Enforce: only the person's account can fill and submit their leave request
      let effectiveEmpId = currentEmployee?.id || formData.employee_id;
      if (!effectiveEmpId && user?.email) {
        const found = employees.find(
          (e) => (e.email || '').toLowerCase().trim() === user.email.toLowerCase().trim()
        );
        if (found) effectiveEmpId = found.id;
      }
      if (!effectiveEmpId) {
        throw new Error('Could not identify your employee profile. You can only apply from your own verified employee account.');
      }
      if (effectiveEmpId && formData.employee_id && String(formData.employee_id) !== String(effectiveEmpId)) {
        throw new Error('Permission Denied: You cannot submit leave requests for another account. Only the person account can fill the form.');
      }

      await createLeaveRequest({
        ...formData,
        employee_id: effectiveEmpId,
      });
      showToast('Leave request submitted successfully (Stage 1: Dept Head Review)', 'success');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      const errMsg = err.message || 'Failed to submit leave request';
      setModalError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Determine if the current account is authorized as Department Head
  // Head approval strictly on Department Head account
  const isHeadAccount =
    userRole === 'Department Head' ||
    (userRole || '').toLowerCase().includes('head') ||
    (currentEmployee && departments.some((d) => String(d.head_employee_id) === String(currentEmployee.id))) ||
    (currentEmployee?.designation && currentEmployee.designation.toLowerCase().includes('head'));

  // Determine if the current account is authorized as HR Management
  // HR approval strictly on HR account
  const isHRAccount =
    userRole === 'HR Admin' ||
    userRole === 'HR Manager' ||
    userRole === 'Admin' ||
    (userRole || '').toLowerCase().includes('hr') ||
    ((userRole || '').toLowerCase().includes('admin') && !isHeadAccount);

  // Helper to identify if applicant is a Department Head
  // Strictly respects rule: Department Head is ONLY approved by HR!
  const isApplicantDeptHead = (leave) => {
    if (!leave) return false;
    const emp = leave.employees || employees.find((e) => String(e.id) === String(leave.employee_id));
    const desig = (emp?.designation || '').toLowerCase();
    const isHeadDesig = desig.includes('head') || desig.includes('director') || desig.includes('chief');
    const isHeadOfAnyDept = departments.some((d) => String(d.head_employee_id) === String(leave.employee_id));
    const isHeadRole = (leave.user_role || emp?.role || '').toLowerCase().includes('head');
    return Boolean(isHeadDesig || isHeadOfAnyDept || isHeadRole);
  };

  // Check if current user can approve Stage 1 (Department Head Review)
  // Rules:
  // 1. Department Head applicants are ONLY approved by HR (they cannot be approved by a Dept Head, nor self-approved)
  // 2. Department Heads can only approve employees in their own department
  const canApproveHead = (leave) => {
    if (!isHeadAccount) return false;
    if (!leave) return true;
    if (currentEmployee?.id && String(leave.employee_id) === String(currentEmployee.id)) return false;
    if (isApplicantDeptHead(leave)) return false;
    if (!isSuperAdmin && !isHRAccount && currentEmployee?.department) {
      const emp = leave.employees || employees.find((e) => String(e.id) === String(leave.employee_id));
      const empDept = emp?.department || '';
      if (empDept && currentEmployee.department.toLowerCase() !== empDept.toLowerCase()) {
        return false;
      }
    }
    return true;
  };

  // Check if current user can approve Stage 2 (Final HR Approval)
  // HR approves regular leaves after Stage 1, AND approves Department Head requests directly!
  const canApproveHR = (leave) => {
    if (!isHRAccount) return false;
    if (leave) {
      if (leave.head_rejected || leave.status === 'Rejected') return false;
      if (!isApplicantDeptHead(leave) && !leave.head_approved) return false;
    }
    return true;
  };

  // Stage 1: Department Head Approval (head approval on head account)
  const handleDeptHeadApprove = async (id) => {
    if (!isHeadAccount) {
      showToast('Permission Denied: Head approval can only be performed on a Department Head account.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      await approveLeaveByDeptHead(id);
      showToast('Stage 1 Approved by Department Head! Forwarded to HR for Final Approval.', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to approve as Department Head', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Stage 2: Final HR / Management Approval (hr approval on hr account)
  const handleFinalApprove = async (id) => {
    if (!isHRAccount) {
      showToast('Permission Denied: HR approval can only be performed on an HR account.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      await approveLeaveFinal(id);
      showToast('Stage 2 Final HR Approval Granted! Request is now Fully Approved.', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to grant final approval', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Rejection by either approver
  const handleReject = async (id, roleName) => {
    if (roleName === 'Dept Head' && !isHeadAccount) {
      showToast('Permission Denied: Head rejection can only be performed on a Department Head account.', 'error');
      return;
    }
    if (roleName === 'HR Admin' && !isHRAccount) {
      showToast('Permission Denied: HR rejection can only be performed on an HR account.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      await rejectLeave(id, roleName);
      showToast(`Leave request rejected by ${roleName}`, 'info');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to reject leave request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLeave = async () => {
    if (!deleteId) return;
    try {
      setActionLoading(true);
      await deleteLeaveRequest(deleteId);
      showToast('Leave request deleted successfully', 'success');
      setDeleteId(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete leave request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Workflow counts (strictly isolated to employee's own requests if logged in as employee)
  const isEmployeeRole = userRole === 'Employee' && !isSuperAdmin && !isHeadAccount && !isHRAccount;
  const scopedLeaves = isEmployeeRole
    ? leaves.filter((l) => {
        const empId = currentEmployee?.id;
        const userEmail = (user?.email || '').toLowerCase().trim();
        const lEmpId = l.employee_id ? String(l.employee_id) : '';
        const lEmail = (l.employees?.email || '').toLowerCase().trim();

        if (empId && lEmpId === String(empId)) return true;
        if (userEmail && lEmail === userEmail) return true;
        return false;
      })
    : leaves;

  // Stage 1: Pending Dept Head Review (only for regular employees; Department Heads are only approved by HR!)
  const stage1Leaves = scopedLeaves.filter(
    (l) => l.status === 'Pending' && !l.head_approved && !l.head_rejected && !isApplicantDeptHead(l)
  );

  // Stage 2: Pending Final HR Approval
  // Strictly respects rule: Department Head is ONLY approved by HR!
  // Includes requests endorsed by Dept Head, plus Department Head applications directly
  const stage2Leaves = scopedLeaves.filter(
    (l) =>
      l.status === 'Pending' &&
      !l.head_rejected &&
      l.status !== 'Rejected' &&
      !l.final_approved &&
      (Boolean(l.head_approved) || isApplicantDeptHead(l))
  );

  // Fully Approved: head_approved and final_approved are true, or status === 'Approved'
  const fullyApprovedLeaves = scopedLeaves.filter(
    (l) => l.status === 'Approved'
  );

  // Rejected
  const rejectedLeaves = scopedLeaves.filter((l) => l.status === 'Rejected');

  // Filter list based on selected tab and filters
  const filteredLeaves = scopedLeaves.filter((l) => {
    const emp = l.employees || employees.find((e) => String(e.id) === String(l.employee_id));
    const empName = getEmployeeDisplayName(emp).toLowerCase();
    const empDept = (emp?.department || '').toLowerCase();

    const matchesSearch =
      empName.includes(searchTerm.toLowerCase()) ||
      (l.reason && l.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = deptFilter
      ? empDept === deptFilter.toLowerCase()
      : true;

    const matchesType = typeFilter ? l.leave_type === typeFilter : true;

    // Workflow tab filtering
    let matchesTab = true;
    if (workflowTab === 'stage1') {
      matchesTab = l.status === 'Pending' && !l.head_approved && !l.head_rejected && !isApplicantDeptHead(l);
    } else if (workflowTab === 'stage2') {
      matchesTab =
        l.status === 'Pending' &&
        !l.head_rejected &&
        l.status !== 'Rejected' &&
        !l.final_approved &&
        (Boolean(l.head_approved) || isApplicantDeptHead(l));
    } else if (workflowTab === 'approved') {
      matchesTab = l.status === 'Approved';
    } else if (workflowTab === 'rejected') {
      matchesTab = l.status === 'Rejected';
    }

    return matchesSearch && matchesDept && matchesType && matchesTab;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D3250] flex items-center gap-2">
            <CalendarOff className="w-6 h-6 text-[#FFB17A]" />
            Two-Level Leave Approval Workflow
          </h1>
          <p className="text-xs text-[#676F9D] mt-0.5">
            Stage 1: Department Head Review &bull; Stage 2: Final HR / Executive Approval
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
            title="Refresh requests"
          >
            Refresh
          </Button>
          <Button
            variant="accent"
            size="md"
            icon={Plus}
            onClick={() => {
              setModalError(null);
              setIsModalOpen(true);
            }}
            className="font-bold shadow-md"
          >
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* Account Authority Status Banner */}
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border shadow-xs transition-all bg-white border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
            isHeadAccount && !isHRAccount
              ? 'bg-amber-100 text-amber-700'
              : isHRAccount && !isHeadAccount
              ? 'bg-blue-100 text-blue-700'
              : 'bg-[#2D3250] text-[#FFB17A]'
          }`}>
            {isHeadAccount && !isHRAccount ? (
              <UserCheck className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2D3250]">
                Active Approval Authority:
              </span>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                isHeadAccount && !isHRAccount
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : isHRAccount && !isHeadAccount
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : isSuperAdmin
                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {isHeadAccount && !isHRAccount
                  ? 'Department Head Account'
                  : isHRAccount && !isHeadAccount
                  ? 'HR Administrator Account'
                  : isSuperAdmin
                  ? 'Super Administrator'
                  : `${userRole} Account`}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {isHeadAccount && !isHRAccount
                ? 'Authorized for Stage 1 (Department Head Approvals). Stage 2 is processed on HR accounts.'
                : isHRAccount && !isHeadAccount
                ? 'Authorized for Stage 2 (Final HR Approvals). Stage 1 must be endorsed by Department Heads.'
                : isSuperAdmin
                ? 'Executive authority for Stage 1 (Department Head) and Stage 2 (Final HR).'
                : 'Standard employee account. Track status and submission history.'}
            </p>
          </div>
        </div>

        {setActiveTab && (
          <Button
            variant="outline"
            size="sm"
            icon={Award}
            onClick={() => setActiveTab('benefits')}
            className="text-xs font-bold shrink-0"
          >
            Benefits & Quotas
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setWorkflowTab('stage1')}
          className={`cursor-pointer transition-all rounded-2xl bg-white p-5 border shadow-sm ${
            workflowTab === 'stage1' ? 'border-[#FFB17A] ring-2 ring-[#FFB17A]/30' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
              Stage 1: Dept Head
            </span>
            <UserCheck className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#2D3250]">
            {stage1Leaves.length}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">
            Requires Dept Head Account
          </p>
        </div>

        <div
          onClick={() => setWorkflowTab('stage2')}
          className={`cursor-pointer transition-all rounded-2xl bg-white p-5 border shadow-sm ${
            workflowTab === 'stage2' ? 'border-[#424769] ring-2 ring-[#424769]/30' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
              Stage 2: Final HR
            </span>
            <ShieldCheck className="w-5 h-5 text-[#676F9D]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#2D3250]">
            {stage2Leaves.length}
          </div>
          <p className="text-[11px] text-[#424769] font-medium mt-0.5">
            Requires HR Account
          </p>
        </div>

        <div
          onClick={() => setWorkflowTab('approved')}
          className={`cursor-pointer transition-all rounded-2xl bg-white p-5 border shadow-sm ${
            workflowTab === 'approved' ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
              Fully Approved
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#2D3250]">
            {fullyApprovedLeaves.length}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Two-level sign-off completed
          </p>
        </div>

        <div
          onClick={() => setWorkflowTab('rejected')}
          className={`cursor-pointer transition-all rounded-2xl bg-white p-5 border shadow-sm ${
            workflowTab === 'rejected' ? 'border-rose-400 ring-2 ring-rose-200' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
              Rejected
            </span>
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#2D3250]">
            {rejectedLeaves.length}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">
            Declined requests
          </p>
        </div>
      </div>

      {/* Workflow Tabs Navigation */}
      <div className="border-b border-gray-200 flex flex-wrap gap-2 text-xs font-bold">
        <button
          onClick={() => setWorkflowTab('all')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 ${
            workflowTab === 'all'
              ? 'border-[#2D3250] text-[#2D3250]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          All Applications ({leaves.length})
        </button>
        <button
          onClick={() => setWorkflowTab('stage1')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            workflowTab === 'stage1'
              ? 'border-[#FFB17A] text-[#2D3250]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
          Stage 1: Dept Head Review ({stage1Leaves.length})
        </button>
        <button
          onClick={() => setWorkflowTab('stage2')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            workflowTab === 'stage2'
              ? 'border-[#424769] text-[#2D3250]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-[#676F9D]"></span>
          Stage 2: Final HR Approval ({stage2Leaves.length})
        </button>
        <button
          onClick={() => setWorkflowTab('approved')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 ${
            workflowTab === 'approved'
              ? 'border-emerald-500 text-emerald-700'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Fully Approved ({fullyApprovedLeaves.length})
        </button>
        <button
          onClick={() => setWorkflowTab('rejected')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 ${
            workflowTab === 'rejected'
              ? 'border-rose-500 text-rose-700'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Rejected ({rejectedLeaves.length})
        </button>
      </div>

      {/* Search & Department Filters */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#676F9D]" />
          <input
            type="text"
            placeholder="Search applicant or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] pl-9 pr-4 py-2 text-sm text-[#2D3250] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Department Filter for Dept Heads and Admins */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => {
              const name = d.department_name || d.name;
              return (
                <option key={d.id} value={name}>
                  {name}
                </option>
              );
            })}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
          >
            <option value="">All Leave Types</option>
            <option value="Annual Leave">Annual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Maternity Leave">Maternity Leave</option>
            <option value="Unpaid Leave">Unpaid Leave</option>
          </select>

          {(searchTerm || deptFilter || typeFilter || workflowTab !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDeptFilter('');
                setTypeFilter('');
                setWorkflowTab('all');
              }}
              className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}

          <span className="text-xs font-semibold text-[#676F9D]">
            Showing {filteredLeaves.length}
          </span>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading leave applications..." />
        ) : filteredLeaves.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-[#676F9D]">
              <CalendarOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#2D3250]">No Leave Requests Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {workflowTab === 'stage1'
                ? 'No requests are currently awaiting Department Head approval.'
                : workflowTab === 'stage2'
                ? 'No requests are currently awaiting Final HR approval.'
                : 'No employee leave records match your current criteria.'}
            </p>
            {workflowTab === 'all' && (
              <Button
                variant="accent"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setModalError(null);
                  setIsModalOpen(true);
                }}
              >
                Submit First Request
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#676F9D] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Applicant & Dept</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Dates & Duration</th>
                  <th className="px-6 py-4">Workflow Status</th>
                  <th className="px-6 py-4">Reason / Notes</th>
                  <th className="px-6 py-4 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredLeaves.map((leave) => {
                  const emp = leave.employees || employees.find((e) => String(e.id) === String(leave.employee_id));
                  const empName = getEmployeeDisplayName(emp);
                  const isHeadApproved = Boolean(leave.head_approved);
                  const isFinalApproved = Boolean(leave.final_approved);
                  const isRejected = leave.status === 'Rejected';
                  const isHeadRejected = isRejected && (!isHeadApproved || Boolean(leave.head_rejected) || leave.rejected_by === 'Dept Head' || leave.rejected_at_stage === 'Stage 1');
                  const isHRRejected = isRejected && !isHeadRejected;
                  const isApplicantHead = isApplicantDeptHead(leave);

                  return (
                    <tr key={leave.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2D3250] text-white font-bold text-xs">
                            {empName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#2D3250] text-sm leading-snug">
                              {empName}
                            </p>
                            <p className="text-[11px] text-gray-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-[#676F9D]" />
                              {emp?.department || 'General Staff'} &bull; Staff #{leave.employee_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant="accent" size="sm">
                          {leave.leave_type}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 font-medium text-[#424769] whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#FFB17A]" />
                            <span className="font-bold text-[#2D3250]">
                              {formatDate(leave.start_date)} &ndash; {formatDate(leave.end_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#2D3250] text-[#FFB17A]">
                              <Clock className="w-3 h-3 text-[#FFB17A]" />
                              {calculateLeaveDays(leave.start_date, leave.end_date)} {calculateLeaveDays(leave.start_date, leave.end_date) === 1 ? 'Day' : 'Days'} Duration
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Two-Level Visual Workflow Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {isHeadRejected ? (
                            <div>
                              <Badge variant="danger" size="sm">
                                Rejected by Dept Head
                              </Badge>
                              <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                                Terminated &bull; Does not proceed to Stage 2 HR
                              </p>
                            </div>
                          ) : isHRRejected ? (
                            <Badge variant="danger" size="sm">
                              Rejected by HR (Stage 2)
                            </Badge>
                          ) : isFinalApproved ? (
                            <Badge variant="success" size="sm" className="font-bold">
                              Fully Approved
                            </Badge>
                          ) : isApplicantHead && leave.status === 'Pending' ? (
                            <div>
                              <Badge variant="info" size="sm" className="font-bold">
                                Pending HR Approval
                              </Badge>
                              <p className="text-[10px] font-semibold text-blue-600 mt-0.5">
                                Department Head &bull; Only Approved by HR
                              </p>
                            </div>
                          ) : isHeadApproved ? (
                            <Badge variant="info" size="sm">
                              Pending Final HR Approval
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              Pending Dept Head Review
                            </Badge>
                          )}

                          {/* Stepper Pill */}
                          {isApplicantHead ? (
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                              <span
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold"
                                title="Department Head requests bypass Stage 1 and are only approved by HR"
                              >
                                1. Head: Bypassed
                              </span>
                              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
                              <span
                                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                                  isFinalApproved
                                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                                    : isHRRejected
                                    ? 'bg-rose-50 text-rose-700 font-bold'
                                    : 'bg-amber-50 text-amber-700 font-bold'
                                }`}
                              >
                                2. HR: {isFinalApproved ? 'Approved' : isHRRejected ? 'Rejected' : 'Pending Review'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                              <span
                                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                                  isHeadApproved
                                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                                    : isHeadRejected
                                    ? 'bg-rose-50 text-rose-700 font-bold'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                1. Head: {isHeadApproved ? 'Approved' : isHeadRejected ? 'Rejected' : 'Pending'}
                              </span>
                              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
                              <span
                                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                                  isHeadRejected
                                    ? 'bg-gray-100 text-gray-400 line-through'
                                    : isFinalApproved
                                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                                    : isHRRejected
                                    ? 'bg-rose-50 text-rose-700 font-bold'
                                    : isHeadApproved
                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                                title={isHeadRejected ? 'Department Head rejected this request. It did not proceed to Stage 2 (HR Final Approval).' : ''}
                              >
                                2. HR: {isHeadRejected ? 'Stopped' : isFinalApproved ? 'Approved' : isHRRejected ? 'Rejected' : 'Pending'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600 max-w-xs">
                        <p className="truncate" title={leave.reason || 'No notes'}>
                          {leave.reason || '-'}
                        </p>
                      </td>

                      {/* Approval Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Case A: Applicant is Department Head (Only approved by HR!) */}
                          {leave.status === 'Pending' && isApplicantHead && !isHeadRejected && (
                            canApproveHR(leave) ? (
                              <>
                                <button
                                  onClick={() => handleFinalApprove(leave.id)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
                                  title="Approve Department Head Leave Application (Only HR can approve)"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  HR Approve Head
                                </button>
                                <button
                                  onClick={() => handleReject(leave.id, 'HR Admin')}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[11px] transition-colors cursor-pointer"
                                  title="Reject Department Head Application"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold"
                                title="Department Head applications are only approved by HR"
                              >
                                <ShieldCheck className="w-3 h-3 text-blue-600" /> Dept Head &bull; Only Approved by HR
                              </span>
                            )
                          )}

                          {/* Case B: Regular Staff - Stage 1: Department Head Approval Button */}
                          {leave.status === 'Pending' && !isApplicantHead && !isHeadApproved && !isHeadRejected && (
                            canApproveHead(leave) ? (
                              <>
                                <button
                                  onClick={() => handleDeptHeadApprove(leave.id)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
                                  title="Department Head Approval (Stage 1)"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Dept Head Approve
                                </button>
                                <button
                                  onClick={() => handleReject(leave.id, 'Dept Head')}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[11px] transition-colors cursor-pointer"
                                  title="Reject Application (Terminates Request at Stage 1)"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold" title="Stage 1 requires Department Head account approval">
                                <UserCheck className="w-3 h-3 text-amber-600" /> Awaiting Head Approval
                              </span>
                            )
                          )}

                          {/* Case C: Regular Staff - Stage 2: Final HR Approval Button (Visible only after Stage 1 approved) */}
                          {leave.status === 'Pending' && !isApplicantHead && isHeadApproved && !isFinalApproved && !isHeadRejected && (
                            canApproveHR(leave) ? (
                              <>
                                <button
                                  onClick={() => handleFinalApprove(leave.id)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
                                  title="Final HR Approval (Stage 2 - Fully Approve)"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Grant Final Approval
                                </button>
                                <button
                                  onClick={() => handleReject(leave.id, 'HR Admin')}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[11px] transition-colors cursor-pointer"
                                  title="Reject Application"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold" title="Stage 2 requires HR Administrator account approval">
                                <ShieldCheck className="w-3 h-3 text-blue-600" /> Awaiting HR Approval
                              </span>
                            )
                          )}

                          {/* Fully Approved Status Badge */}
                          {leave.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                            </span>
                          )}

                          {/* Rejected Status Badge */}
                          {leave.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                              <XCircle className="w-3 h-3 text-rose-600" /> {isHeadRejected ? 'Rejected by Head' : 'Rejected by HR'}
                            </span>
                          )}

                          {/* Delete Button (HR Admin or Super Admin only) */}
                          {(isHRAccount || isSuperAdmin) && (
                            <button
                              onClick={() => setDeleteId(leave.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Delete Request"
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

      {/* Submission Modal */}
      <LeaveModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalError(null);
        }}
        onSave={handleSaveLeave}
        loading={actionLoading}
        error={modalError}
        clearError={() => setModalError(null)}
        employees={employees}
        currentEmployee={currentEmployee}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteLeave}
        title="Delete Leave Application"
        message="Are you sure you want to permanently remove this leave application?"
        confirmText="Yes, Delete"
        loading={actionLoading}
      />
    </div>
  );
};
