import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Edit,
  LogIn,
  LogOut,
  Lock,
  UserCheck,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AttendanceModal } from './AttendanceModal';
import {
  getAttendanceRecords,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployees,
} from '../../utils/dbHelpers';
import { formatDate, formatTime, getEmployeeDisplayName, normalizeDate, getTodayDateString, isToday } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const AttendanceManagement = () => {
  const { role: userRole, isHR, isDeptHead, isSuperAdmin, isEmployee, currentEmployee, user } = useAuth();
  const isEmployeeRole = Boolean(isEmployee || userRole === 'Employee');
  const canViewAllAttendance = Boolean(isHR || isSuperAdmin || isDeptHead || userRole === 'Department Head');

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
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
      const [attList, empList] = await Promise.all([
        getAttendanceRecords(),
        getEmployees(),
      ]);
      setRecords(attList || []);
      setEmployees(empList || []);
    } catch (err) {
      showToast(err.message || 'Error loading attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAttendance = async (formData) => {
    try {
      setActionLoading(true);
      setModalError(null);

      // Enforce: all accounts can only fill the personal attendance form for themselves
      let effectiveEmpId = currentEmployee?.id || formData.employee_id;
      if (!effectiveEmpId && user?.email) {
        const found = employees.find(
          (e) => (e.email || '').toLowerCase().trim() === user.email.toLowerCase().trim()
        );
        if (found) effectiveEmpId = found.id;
      }
      if (!effectiveEmpId) {
        throw new Error('Could not identify your employee profile. You can only record personal attendance from your authenticated account.');
      }
      if (!selectedRecord && currentEmployee && formData.employee_id && String(formData.employee_id) !== String(currentEmployee.id)) {
        const targetEmp = employees.find((e) => String(e.id) === String(formData.employee_id));
        if (targetEmp && (targetEmp.email || '').toLowerCase().trim() !== (user?.email || '').toLowerCase().trim()) {
          throw new Error('Permission Denied: All accounts can only fill their own personal attendance form.');
        }
      }

      if (selectedRecord) {
        if (!canViewAllAttendance && currentEmployee && String(selectedRecord.employee_id) !== String(currentEmployee.id)) {
          throw new Error('Permission Denied: You cannot modify attendance records of other accounts.');
        }
        await updateAttendance(selectedRecord.id, formData);
        showToast('Attendance log updated in database', 'success');
      } else {
        // Enforce: only one attendance mark per day per employee
        const targetDate = normalizeDate(formData.attendance_date) || getTodayDateString();
        const alreadyExists = records.some((r) => {
          const rDate = normalizeDate(r.attendance_date || r.date);
          return String(r.employee_id) === String(effectiveEmpId) && rDate === targetDate;
        });
        if (alreadyExists) {
          throw new Error(`Attendance for this employee has already been marked on ${targetDate}. Only one attendance mark per day is permitted.`);
        }

        await createAttendance({
          ...formData,
          employee_id: effectiveEmpId,
        });
        showToast('Personal attendance recorded in database', 'success');
      }
      setIsModalOpen(false);
      setSelectedRecord(null);
      await loadData();
    } catch (err) {
      const msg = err.message || 'Failed to save attendance';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAttendance = async () => {
    if (!deleteId) return;
    if (!canViewAllAttendance) {
      showToast('Permission Denied: Standard employees cannot delete attendance records.', 'error');
      setDeleteId(null);
      return;
    }
    try {
      setActionLoading(true);
      await deleteAttendance(deleteId);
      showToast('Attendance record deleted', 'success');
      setDeleteId(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete record', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Clock Out helper
  const handleQuickClockOut = async (record) => {
    try {
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
      });
      await updateAttendance(record.id, {
        status: record.status,
        attendance_date: record.attendance_date,
        check_in: record.check_in,
        check_out: currentTime,
      });
      showToast('Checked out at ' + currentTime, 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Clock out error', 'error');
    }
  };

  // Only Head or HR can see who is on or attendance. Standard employees only see their own attendance records!
  const userEmail = (user?.email || '').toLowerCase().trim();
  const matchedEmpFromList = employees.find(
    (e) => (e.email || '').toLowerCase().trim() === userEmail
  );
  const effectiveUserId = currentEmployee?.id || matchedEmpFromList?.id;

  const scopedRecords = !canViewAllAttendance
    ? records.filter((rec) => {
        const empId = currentEmployee?.id;
        const recEmpId = rec.employee_id ? String(rec.employee_id) : '';
        const recEmail = (rec.employees?.email || rec.email || '').toLowerCase().trim();
        if (effectiveUserId && recEmpId === String(effectiveUserId)) return true;
        if (currentEmployee?.id && recEmpId === String(currentEmployee.id)) return true;

        if (empId && recEmpId === String(empId)) return true;
        if (userEmail && recEmail === userEmail) return true;
        const emp = rec.employees || employees.find((e) => String(e.id) === recEmpId);
        const empEmail = (emp?.email || rec.email || '').toLowerCase().trim();
        if (userEmail && empEmail === userEmail) return true;

        return false;
      })
    : records;

  // Today statistics
  const localToday = getTodayDateString();
  const todayRecords = scopedRecords.filter((r) => isToday(r.attendance_date || r.date || r.created_at));
  const myTodayRecord = scopedRecords.find((rec) => {
    const cleanDate = normalizeDate(rec.attendance_date || rec.date || rec.created_at);
    return isToday(cleanDate) && String(rec.employee_id) === String(effectiveUserId);
  });
  const presentToday = todayRecords.filter((r) => (r.status || '').trim().toLowerCase() === 'present').length;
  const lateToday = todayRecords.filter((r) => (r.status || '').trim().toLowerCase() === 'late').length;
  const absentToday = todayRecords.filter((r) => (r.status || '').trim().toLowerCase() === 'absent').length;

  // Filtered table data
  const filteredRecords = scopedRecords.filter((rec) => {
    const emp = rec.employees || employees.find((e) => String(e.id) === String(rec.employee_id));
    const empName = getEmployeeDisplayName(emp).toLowerCase();
    const matchesSearch =
      empName.includes(searchTerm.toLowerCase()) ||
      (emp?.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const cleanDate = normalizeDate(rec.attendance_date || rec.date);
    const matchesDate = selectedDate ? cleanDate === selectedDate : true;
    const matchesStatus = statusFilter ? (rec.status || '').trim().toLowerCase() === statusFilter.toLowerCase() : true;

    return matchesSearch && matchesDate && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D3250] flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#FFB17A]" />
            Attendance Management
          </h1>
          <p className="text-xs text-[#676F9D] mt-0.5">
            {canViewAllAttendance
              ? 'Monitor organization clock-in activity, presence, and punctuality'
              : 'Log and monitor your personal attendance history'}
          </p>
        </div>

        <div className="flex items-center gap-3 no-print">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
            title="Print attendance report"
          >
            Print Sheet
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
            title="Refresh logs"
          >
            Refresh
          </Button>
          {!canViewAllAttendance && myTodayRecord ? (
            <Button
              variant="accent"
              size="md"
              icon={CheckCircle2}
              onClick={() => {
                showToast(`Today's attendance is already marked (${myTodayRecord.status}). Only 1 attendance mark per day is permitted.`, 'info');
              }}
              className="font-bold shadow-md cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              title="Today's attendance has already been logged"
            >
              Today Marked ({myTodayRecord.status})
            </Button>
          ) : (
            <Button
              variant="accent"
              size="md"
              icon={Plus}
              onClick={() => {
                setSelectedRecord(null);
                setIsModalOpen(true);
              }}
              className="font-bold shadow-md cursor-pointer"
            >
              Log Personal Attendance
            </Button>
          )}
        </div>
      </div>

      {/* Scope Banner for Standard Employees */}
      {!canViewAllAttendance && (
        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-xs text-amber-900 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Personal Attendance Portal:</strong> You can only log and view your personal attendance. Organization-wide attendance is monitored by Department Heads and HR departments.
            </span>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full shrink-0">
            Personal Mode
          </span>
        </div>
      )}

      {/* Single Daily Attendance Status Notice */}
      {myTodayRecord && (
        <div className="rounded-2xl bg-emerald-50/90 border border-emerald-200/90 p-4 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs no-print animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                Today's Attendance Recorded
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  1 Daily Mark Rule Active
                </span>
              </p>
              <p className="text-emerald-700 text-xs mt-0.5">
                Marked as <strong>{myTodayRecord.status}</strong> &bull; Check-in at <strong>{formatTime(myTodayRecord.check_in)}</strong> {myTodayRecord.check_out ? (
                  <span>&bull; Checked-out at <strong>{formatTime(myTodayRecord.check_out)}</strong> (Shift Completed)</span>
                ) : (
                  <span>&bull; <em>Active shift in progress</em></span>
                )}
              </p>
            </div>
          </div>
          {!myTodayRecord.check_out && (
            <Button
              variant="outline"
              size="sm"
              icon={LogOut}
              onClick={() => handleQuickClockOut(myTodayRecord)}
              className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100 shrink-0 font-bold"
            >
              Quick Clock Out
            </Button>
          )}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Present Today"
          value={presentToday}
          icon={CheckCircle2}
          accentColor="#10b981"
          description={`Logged today (${localToday})`}
        />
        <StatCard
          title="Late Arrivals"
          value={lateToday}
          icon={Clock}
          accentColor="#f59e0b"
          description="Marked as Late"
        />
        <StatCard
          title="Absent Count"
          value={absentToday}
          icon={XCircle}
          accentColor="#ef4444"
          description="Not present"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#676F9D]" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] pl-9 pr-4 py-2 text-sm text-[#2D3250] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Half Day">Half Day</option>
            <option value="On Leave">On Leave</option>
            <option value="Absent">Absent</option>
          </select>

          {(selectedDate || statusFilter || searchTerm) && (
            <button
              onClick={() => {
                setSelectedDate('');
                setStatusFilter('');
                setSearchTerm('');
              }}
              className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}

          <span className="text-xs font-semibold text-[#676F9D]">
            {filteredRecords.length} entries
          </span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Retrieving attendance history..." />
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-[#676F9D]">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#2D3250]">No Attendance Logs Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm || selectedDate || statusFilter
                ? 'No records match the active criteria.'
                : 'Start logging daily presence and shift hours for employees.'}
            </p>
            {!searchTerm && !selectedDate && !statusFilter && (
              <Button
                variant="accent"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setSelectedRecord(null);
                  setIsModalOpen(true);
                }}
              >
                Log Attendance
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#676F9D] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Check In</th>
                  <th className="px-6 py-4">Check Out</th>
                  <th className="px-6 py-4 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredRecords.map((rec) => {
                  const emp = rec.employees || employees.find((e) => String(e.id) === String(rec.employee_id));
                  const empName = getEmployeeDisplayName(emp);
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/70 transition-colors">
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
                              {emp?.department || 'Staff'} &bull; Staff ID #{rec.employee_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#424769]">
                        {formatDate(rec.attendance_date)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            rec.status === 'Present'
                              ? 'success'
                              : rec.status === 'Absent'
                              ? 'danger'
                              : rec.status === 'Late'
                              ? 'warning'
                              : 'accent'
                          }
                          size="sm"
                        >
                          {rec.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-600">
                        {formatTime(rec.check_in)}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-600">
                        {rec.check_out ? (
                          <span>{formatTime(rec.check_out)}</span>
                        ) : (
                          <button
                            onClick={() => handleQuickClockOut(rec)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FFB17A] hover:text-[#fca05f] cursor-pointer no-print"
                          >
                            <LogOut className="w-3 h-3" />
                            Clock Out
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right no-print">
                        <div className="flex items-center justify-end gap-1">
                          {canViewAllAttendance && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRecord(rec);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 text-[#424769] hover:text-[#FFB17A] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Record"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteId(rec.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Log"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
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

      {/* Log Modal */}
      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecord(null);
          setModalError(null);
        }}
        onSave={handleSaveAttendance}
        record={selectedRecord}
        loading={actionLoading}
        error={modalError}
        clearError={() => setModalError(null)}
        employees={employees}
        currentEmployee={currentEmployee}
        existingRecords={records}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteAttendance}
        title="Delete Attendance Record"
        message="Are you sure you want to delete this attendance log?"
        confirmText="Yes, Delete"
        loading={actionLoading}
      />
    </div>
  );
};
