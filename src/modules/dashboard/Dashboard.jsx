import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  CalendarCheck,
  CalendarOff,
  Banknote,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle,
  XCircle,
  Award,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  getEmployees,
  getDepartments,
  getAttendanceRecords,
  getLeaveRequests,
  getPayrollRecords,
  updateLeaveStatus,
} from '../../utils/dbHelpers';
import { formatCurrency, formatDate, getEmployeeDisplayName } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const Dashboard = ({ setActiveTab }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    presentToday: 0,
    pendingLeaves: 0,
    totalPayrollAmount: 0,
  });

  const [recentAttendance, setRecentAttendance] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);

  const { showToast } = useToast();
  const { profile, user, role: userRole, isEmployee, currentEmployee, isHR, isDeptHead, isSuperAdmin } = useAuth();
  const isEmployeeRole = Boolean(isEmployee || userRole === 'Employee');
  const canManageHR = Boolean(isHR || isSuperAdmin || isDeptHead || userRole === 'Department Head' || userRole === 'HR Admin' || userRole === 'HR Manager');

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [emps, depts, atts, leaves, payrolls] = await Promise.allSettled([
        getEmployees(),
        getDepartments(),
        getAttendanceRecords(),
        getLeaveRequests(),
        getPayrollRecords(),
      ]);

      const employeeList = emps.status === 'fulfilled' ? emps.value : [];
      const deptList = depts.status === 'fulfilled' ? depts.value : [];
      const attList = atts.status === 'fulfilled' ? atts.value : [];
      const leaveList = leaves.status === 'fulfilled' ? leaves.value : [];
      const payrollList = payrolls.status === 'fulfilled' ? payrolls.value : [];

      // Calculate personal records if logged in as standard employee
      const userEmail = (user?.email || '').toLowerCase().trim();
      const empId = currentEmployee?.id;

      const myAttList = attList.filter((a) => {
        if (empId && String(a.employee_id) === String(empId)) return true;
        if (userEmail && (a.employees?.email || '').toLowerCase().trim() === userEmail) return true;
        return false;
      });

      const myLeaveList = leaveList.filter((l) => {
        if (empId && String(l.employee_id) === String(empId)) return true;
        if (userEmail && (l.employees?.email || '').toLowerCase().trim() === userEmail) return true;
        return false;
      });

      // Calculate Present today
      const todayStr = new Date().toISOString().split('T')[0];
      const presentCount = attList.filter(
        (a) => a.attendance_date === todayStr && a.status === 'Present'
      ).length;

      // Pending leaves
      const pendingCount = leaveList.filter((l) => l.status === 'Pending').length;

      // Total payroll net salary
      const payrollTotal = payrollList.reduce((acc, curr) => acc + (Number(curr.net_salary) || 0), 0);

      // Personal indicators
      const myTodayAtt = myAttList.find((a) => a.attendance_date === todayStr);
      const myPendingCount = myLeaveList.filter((l) => l.status === 'Pending').length;

      setStats({
        totalEmployees: employeeList.length,
        totalDepartments: deptList.length,
        presentToday: isEmployeeRole ? (myTodayAtt ? myTodayAtt.status : 'Not Clocked In') : presentCount,
        pendingLeaves: isEmployeeRole ? myPendingCount : pendingCount,
        totalPayrollAmount: payrollTotal,
      });

      setRecentAttendance(isEmployeeRole ? myAttList.slice(0, 5) : attList.slice(0, 5));
      setRecentLeaves(isEmployeeRole ? myLeaveList.slice(0, 5) : leaveList.slice(0, 5));
      setDepartments(deptList);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentEmployee, user]);

  const handleApproveLeave = async (id) => {
    if (!canManageHR) return;
    try {
      await updateLeaveStatus(id, 'Approved');
      showToast('Leave request approved', 'success');
      loadDashboardData();
    } catch (err) {
      showToast(err.message || 'Error updating leave', 'error');
    }
  };

  const handleRejectLeave = async (id) => {
    if (!canManageHR) return;
    try {
      await updateLeaveStatus(id, 'Rejected');
      showToast('Leave request rejected', 'info');
      loadDashboardData();
    } catch (err) {
      showToast(err.message || 'Error updating leave', 'error');
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || (isEmployeeRole ? 'Team Member' : 'Administrator');

  if (loading) {
    return <LoadingSpinner message="Loading Elaris HRMS Dashboard..." size="lg" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2D3250] via-[#424769] to-[#2D3250] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
          <Sparkles className="h-72 w-72" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFB17A]/20 border border-[#FFB17A]/40 px-3 py-1 text-xs font-semibold text-[#FFB17A]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isEmployeeRole ? 'Elaris Employee Portal' : 'HRMS Intelligence Center'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-gray-300 leading-relaxed">
              {isEmployeeRole
                ? 'Welcome to your employee workspace. Check in your daily attendance, apply for leaves, and inspect your corporate role benefits.'
                : 'Here is your workforce summary, active departments, real-time attendance, and payroll operations.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isEmployeeRole ? (
              <>
                <Button
                  variant="accent"
                  size="md"
                  icon={CalendarCheck}
                  onClick={() => setActiveTab('attendance')}
                  className="font-bold shadow-md bg-[#FFB17A] text-[#2D3250] hover:bg-[#fca05f]"
                >
                  Log Attendance
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  icon={CalendarOff}
                  onClick={() => setActiveTab('leaves')}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  Request Leave
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  icon={Award}
                  onClick={() => setActiveTab('benefits')}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  My Benefits
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="accent"
                  size="md"
                  icon={Plus}
                  onClick={() => setActiveTab('employees')}
                  className="font-bold shadow-md bg-[#FFB17A] text-[#2D3250] hover:bg-[#fca05f]"
                >
                  Add Employee
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setActiveTab('payroll')}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  Process Payroll
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Workforce"
          value={stats.totalEmployees}
          icon={Users}
          accentColor="#676F9D"
          description={isEmployeeRole ? 'Company workforce' : 'Active personnel'}
          onClick={() => setActiveTab('employees')}
        />

        <StatCard
          title="Departments"
          value={stats.totalDepartments}
          icon={Building2}
          accentColor="#424769"
          description="Operational units"
          onClick={() => setActiveTab('departments')}
        />

        <StatCard
          title={isEmployeeRole ? 'My Today Status' : 'Present Today'}
          value={stats.presentToday}
          icon={CalendarCheck}
          accentColor="#FFB17A"
          description={isEmployeeRole ? 'Daily attendance' : `Of ${stats.totalEmployees} total staff`}
          onClick={() => setActiveTab('attendance')}
        />

        <StatCard
          title={isEmployeeRole ? 'My Pending Leaves' : 'Pending Leaves'}
          value={stats.pendingLeaves}
          icon={CalendarOff}
          accentColor="#e11d48"
          description={isEmployeeRole ? 'Applications in review' : 'Awaiting approval'}
          onClick={() => setActiveTab('leaves')}
        />
      </div>

      {/* Secondary Metric Bar */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        {isEmployeeRole ? (
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#676F9D]">
                My Benefits & Personal Payslips
              </p>
              <p className="text-base font-bold text-[#2D3250]">
                Access verified monthly salary vouchers & role benefits
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#676F9D]">
                Total Processed Payroll (PKR)
              </p>
              <p className="text-2xl font-black text-[#2D3250]">
                {formatCurrency(stats.totalPayrollAmount)}
              </p>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveTab('payslips')}
          className="text-xs"
        >
          {isEmployeeRole ? 'Open My Payslips' : 'View All Payslips'}
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* Content Split: Recent Attendance & Pending Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Attendance */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <div>
              <h2 className="text-base font-bold text-[#2D3250] flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#FFB17A]" />
                {isEmployeeRole ? 'My Recent Attendance' : 'Recent Attendance Logs'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEmployeeRole ? 'Your personal check-in records' : 'Latest check-in activity recorded'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs font-semibold text-[#424769] hover:text-[#FFB17A] flex items-center gap-1 cursor-pointer"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentAttendance.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                {isEmployeeRole ? 'No personal attendance records found.' : 'No attendance records logged yet.'}
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#676F9D]">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Check In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {recentAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-[#2D3250]">
                        {getEmployeeDisplayName(record.employees || currentEmployee)}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500">
                        {formatDate(record.attendance_date)}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          variant={
                            record.status === 'Present'
                              ? 'success'
                              : record.status === 'Absent'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {record.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 font-mono">
                        {record.check_in || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <div>
              <h2 className="text-base font-bold text-[#2D3250] flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-rose-500" />
                {isEmployeeRole ? 'My Leave Applications' : 'Leave Applications'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEmployeeRole ? 'Your recent submitted leave requests' : 'Staff requests requiring administrative decision'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('leaves')}
              className="text-xs font-semibold text-[#424769] hover:text-[#FFB17A] flex items-center gap-1 cursor-pointer"
            >
              {isEmployeeRole ? 'View all' : 'Manage all'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {recentLeaves.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                {isEmployeeRole ? 'No personal leave requests submitted.' : 'No leave requests found.'}
              </div>
            ) : (
              recentLeaves.map((leave) => (
                <div key={leave.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#2D3250]">
                        {getEmployeeDisplayName(leave.employees || currentEmployee)}
                      </span>
                      <Badge variant="accent" size="sm">
                        {leave.leave_type}
                      </Badge>
                      <Badge
                        variant={
                          leave.status === 'Approved'
                            ? 'success'
                            : leave.status === 'Rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {leave.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                    </p>
                    {leave.reason && (
                      <p className="text-xs text-gray-600 italic">
                        "{leave.reason}"
                      </p>
                    )}
                  </div>

                  {canManageHR && leave.status === 'Pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveLeave(leave.id)}
                        className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Approve Leave"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRejectLeave(leave.id)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Reject Leave"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
