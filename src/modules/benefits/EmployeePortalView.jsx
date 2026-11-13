import { useState } from 'react';
import {
  CalendarCheck,
  CalendarOff,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HeartPulse,
  Laptop,
  GraduationCap,
  Briefcase,
  DollarSign,
  Shield,
  Award,
  Sparkles,
  Plane,
  Building2,
  Mail,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatDate, getEmployeeDisplayName } from '../../utils/formatters';

export const EmployeePortalView = ({
  employee,
  allEmployees = [],
  onSelectEmployee,
  summary,
  policy,
  isHRUser,
  onApplyLeave,
}) => {
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'rejected'

  if (!employee) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center border border-gray-100 shadow-sm space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#2D3250]">No Employee Profile Selected</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Please select an employee profile to inspect leave quotas, remaining balances, and role benefits.
        </p>
      </div>
    );
  }

  const displayName = getEmployeeDisplayName(employee);
  const tierKey = policy?.role_key || employee.role_tier || 'Mid-Level';

  // Filter history
  const filteredHistory = (summary?.history || []).filter((item) => {
    if (historyFilter === 'approved') return item.status === 'Approved';
    if (historyFilter === 'pending') return item.status === 'Pending';
    if (historyFilter === 'rejected') return item.status === 'Rejected';
    return true;
  });

  // Calculate overall leave usage percentage
  const totalQuota = summary?.quotas?.total || 1;
  const totalUsed = summary?.used?.total || 0;
  const totalRemaining = summary?.remaining?.total || 0;

  // Tier color styling
  const isExecutive = tierKey === 'Executive';
  const isSenior = tierKey === 'Senior';
  const isJunior = tierKey === 'Junior';

  const tierBadgeClass = isExecutive
    ? 'bg-purple-100 text-purple-800 border-purple-200'
    : isSenior
    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
    : isJunior
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : 'bg-sky-100 text-sky-800 border-sky-200';

  return (
    <div className="space-y-6">
      {/* HR Multi-Employee Selector Banner (Visible if user is HR / Admin) */}
      {isHRUser && allEmployees.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#2D3250] text-[#FFB17A] flex items-center justify-center font-bold text-sm shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2D3250] uppercase tracking-wider block">
                HR Management Switcher
              </span>
              <p className="text-xs text-gray-600">
                Viewing benefits, leave balances, and request history for selected employee:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={employee.id}
              onChange={(e) => {
                const found = allEmployees.find((emp) => String(emp.id) === String(e.target.value));
                if (found) onSelectEmployee(found);
              }}
              className="w-full sm:w-72 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-bold text-[#2D3250] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
            >
              {allEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {getEmployeeDisplayName(emp)} &bull; {emp.designation || 'Staff'} ({emp.role_tier || 'Mid-Level'})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Hero Employee Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2D3250] via-[#424769] to-[#2D3250] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <Sparkles className="h-64 w-64" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB17A] to-[#fca05f] text-2xl font-black text-[#2D3250] shadow-xl shadow-[#FFB17A]/25">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{displayName}</h2>
                <span className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide border ${tierBadgeClass}`}>
                  {tierKey} Tier Policy
                </span>
              </div>
              <p className="text-xs font-semibold text-[#FFB17A] flex items-center justify-center sm:justify-start gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                {employee.designation || 'Specialist'} &bull; {employee.department || 'General Department'}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {employee.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  Staff ID: #{employee.id}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <Button
              variant="accent"
              icon={Plus}
              onClick={onApplyLeave}
              className="font-bold text-sm bg-[#FFB17A] text-[#2D3250] hover:bg-[#fca05f] shadow-lg shadow-[#FFB17A]/20 cursor-pointer"
            >
              Apply for Leave
            </Button>
            <span className="text-[11px] text-gray-300 text-center sm:text-right">
              Policy: <strong className="text-white">{policy?.role_name || `${tierKey} Benefits`}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Spotlight: When Employee Took Last Leave */}
      <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#2D3250]">Last Leave Taken Spotlight</h3>
              <p className="text-[11px] text-[#676F9D]">Most recent verified leave record on company file</p>
            </div>
          </div>

          {summary?.lastLeave ? (
            <Badge variant="success" size="sm">
              Approved Record
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              Full Balance Intact
            </Badge>
          )}
        </div>

        {summary?.lastLeave ? (
          <div className="rounded-2xl bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-transparent border border-indigo-100 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-[#2D3250] text-sm">
                  {summary.lastLeave.leave_type || 'Annual Leave'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                  {summary.lastLeave.daysCount} {summary.lastLeave.daysCount === 1 ? 'Day' : 'Days'} Duration
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  ({formatDate(summary.lastLeave.start_date)} &ndash; {formatDate(summary.lastLeave.end_date)})
                </span>
              </div>
              <p className="text-xs text-gray-600 italic">
                &ldquo;{summary.lastLeave.reason || 'Personal leave request'}&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-[#424769] shrink-0">
              <div className="rounded-xl bg-white px-3.5 py-2 border border-indigo-100 text-center shadow-xs">
                <span className="text-indigo-600 font-extrabold block text-sm">
                  {summary.lastLeave.daysAgo === 0
                    ? 'Today'
                    : summary.lastLeave.daysAgo === 1
                    ? 'Yesterday'
                    : `${summary.lastLeave.daysAgo} Days Ago`}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Leave Recency</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Fully Approved</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200 p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">
                No prior leaves taken yet
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                This employee has not utilized any paid leaves this cycle. Full 100% leave allowance is active and available.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Leave Balances Overview (Remaining vs Allotted) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-[#2D3250] flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#FFB17A]" />
              Leave Balances & Allowances ({tierKey} Tier)
            </h3>
            <p className="text-xs text-[#676F9D]">
              Remaining days available for withdrawal vs annual company policy quota
            </p>
          </div>

          <div className="text-right bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-xs font-bold text-[#424769]">
              Overall Available:{' '}
              <span className="text-emerald-700 font-extrabold text-sm">
                {totalRemaining} / {totalQuota} Days
              </span>
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              {totalUsed} Days Taken ({Math.round((totalUsed / totalQuota) * 100)}% utilized)
            </div>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Annual Leave */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
                Annual Leave
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {summary?.remaining?.annual} Remaining
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-black text-[#2D3250]">
                  {summary?.remaining?.annual}
                  <span className="text-xs font-normal text-gray-400"> / {summary?.quotas?.annual} Days</span>
                </span>
                <span className="text-[11px] font-bold text-gray-500">
                  {summary?.used?.annual} Used
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((summary?.used?.annual || 0) / (summary?.quotas?.annual || 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-400">Planned rest, travel & vacation</p>
          </div>

          {/* 2. Sick Leave */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
                Sick Leave
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {summary?.remaining?.sick} Remaining
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-black text-[#2D3250]">
                  {summary?.remaining?.sick}
                  <span className="text-xs font-normal text-gray-400"> / {summary?.quotas?.sick} Days</span>
                </span>
                <span className="text-[11px] font-bold text-gray-500">
                  {summary?.used?.sick} Used
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((summary?.used?.sick || 0) / (summary?.quotas?.sick || 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-400">Medical recovery & health rest</p>
          </div>

          {/* 3. Casual Leave */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
                Casual Leave
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                {summary?.remaining?.casual} Remaining
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-black text-[#2D3250]">
                  {summary?.remaining?.casual}
                  <span className="text-xs font-normal text-gray-400"> / {summary?.quotas?.casual} Days</span>
                </span>
                <span className="text-[11px] font-bold text-gray-500">
                  {summary?.used?.casual} Used
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((summary?.used?.casual || 0) / (summary?.quotas?.casual || 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-400">Short personal affairs & errands</p>
          </div>

          {/* 4. Emergency Leave */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D]">
                Emergency Leave
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {summary?.remaining?.emergency} Remaining
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-black text-[#2D3250]">
                  {summary?.remaining?.emergency}
                  <span className="text-xs font-normal text-gray-400"> / {summary?.quotas?.emergency} Days</span>
                </span>
                <span className="text-[11px] font-bold text-gray-500">
                  {summary?.used?.emergency} Used
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((summary?.used?.emergency || 0) / (summary?.quotas?.emergency || 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-400">Unforeseen personal emergencies</p>
          </div>
        </div>
      </div>

      {/* Leave Status Counters & History */}
      <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-[#2D3250] flex items-center gap-2">
              <CalendarOff className="w-5 h-5 text-[#FFB17A]" />
              Leave Applications & History
            </h3>
            <p className="text-xs text-[#676F9D]">
              Approved, pending review, and rejected applications for {displayName}
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {summary?.counts?.approved || 0} Approved ({summary?.counts?.approvedDays || 0} Days)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              {summary?.counts?.pending || 0} Pending
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
              <XCircle className="w-3.5 h-3.5" />
              {summary?.counts?.rejected || 0} Rejected
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2 text-xs">
          <button
            onClick={() => setHistoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              historyFilter === 'all'
                ? 'bg-[#2D3250] text-white'
                : 'text-gray-500 hover:text-[#2D3250] hover:bg-gray-100'
            }`}
          >
            All Requests ({summary?.history?.length || 0})
          </button>
          <button
            onClick={() => setHistoryFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              historyFilter === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Approved ({summary?.counts?.approved || 0})
          </button>
          <button
            onClick={() => setHistoryFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              historyFilter === 'pending'
                ? 'bg-amber-500 text-white'
                : 'text-gray-500 hover:text-amber-700 hover:bg-amber-50'
            }`}
          >
            Pending ({summary?.counts?.pending || 0})
          </button>
          <button
            onClick={() => setHistoryFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              historyFilter === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'text-gray-500 hover:text-rose-700 hover:bg-rose-50'
            }`}
          >
            Rejected ({summary?.counts?.rejected || 0})
          </button>
        </div>

        {/* History Table */}
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 bg-gray-50/60 rounded-2xl border border-gray-100">
            No leave records found matching the &quot;{historyFilter}&quot; filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-[#676F9D] uppercase tracking-wider text-[10px] font-bold border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Duration & Dates</th>
                  <th className="px-4 py-3">Days Count</th>
                  <th className="px-4 py-3">Workflow Status</th>
                  <th className="px-4 py-3">Reason / Details</th>
                  <th className="px-4 py-3 text-right">Applied On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredHistory.map((leave) => {
                  const isApproved = leave.status === 'Approved';
                  const isRejected = leave.status === 'Rejected';
                  const isHeadApproved = Boolean(leave.head_approved);

                  return (
                    <tr key={leave.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#2D3250]">
                        {leave.leave_type}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(leave.start_date)} &ndash; {formatDate(leave.end_date)}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-[#424769]">
                        {leave.daysCount || 1} {leave.daysCount === 1 ? 'Day' : 'Days'}
                      </td>
                      <td className="px-4 py-3">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Rejected
                          </span>
                        ) : isHeadApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px]">
                            <Clock className="w-3 h-3 text-sky-600" />
                            Stage 2: HR Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Stage 1: Dept Head
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {leave.reason || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {formatDate(leave.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Other Benefits & Role Privileges Showcase */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-[#2D3250] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FFB17A]" />
            Role Benefits & Corporate Allowances ({policy?.role_name || `${tierKey} Tier`})
          </h3>
          <p className="text-xs text-[#676F9D]">
            Corporate benefits and compensation privileges allocated specifically for this role tier
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Health Insurance */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#2D3250]">Medical & Health Insurance</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {policy?.health_insurance || '$25,000 Standard Health Insurance'}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block w-fit">
              Health Coverage
            </span>
          </div>

          {/* 2. Wellness Stipend */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#2D3250]">Wellness & Gym Stipend</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {policy?.wellness_stipend || '$60 / month Fitness & Gym pass'}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block w-fit">
              Fitness & Mind
            </span>
          </div>

          {/* 3. Learning & Development */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#2D3250]">Learning & Certifications</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {policy?.learning_budget || '$1,000 / year Online Courses'}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block w-fit">
              Professional Growth
            </span>
          </div>

          {/* 4. Remote Work Policy */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                <Laptop className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#2D3250]">Remote Work / WFH Flexibility</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {policy?.remote_work_policy || 'Up to 6 WFH Days / Month'}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md inline-block w-fit">
              Work Flexibility
            </span>
          </div>

          {/* 5. Performance Bonus */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#2D3250]">Performance Bonus Target</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {policy?.bonus_percentage || '10% Annual Performance Bonus'}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block w-fit">
              Annual Incentive
            </span>
          </div>

          {/* 6. Travel & Commute */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
                <Plane className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#2D3250]">Commute & Travel Allowance</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {policy?.travel_allowance || '$150 / month Public Transit Pass'}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md inline-block w-fit">
              Transportation
            </span>
          </div>

          {/* 7. Hardware & Equipment */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
                <Laptop className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#2D3250]">Hardware Setup Stipend</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {policy?.equipment_stipend || 'Company-issued workstation setup'}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block w-fit">
              Tech Hardware
            </span>
          </div>

          {/* 8. Retirement & 401(k) Match */}
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#2D3250]">Provident Fund / 401(k) Match</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {policy?.retirement_match || '5% Company Matching'}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md inline-block w-fit">
              Retirement
            </span>
          </div>
        </div>

        {/* Additional Perks Pills */}
        {Array.isArray(policy?.additional_perks) && policy.additional_perks.length > 0 && (
          <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#676F9D] block">
              Additional Privileges & Perks for {tierKey} Tier
            </span>
            <div className="flex flex-wrap gap-2">
              {policy.additional_perks.map((perk, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-[#2D3250]/5 border border-[#2D3250]/10 text-[#2D3250] text-xs font-semibold"
                >
                  &bull; {perk}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
