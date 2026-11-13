import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Calendar, Clock, User, CheckCircle2, AlertCircle, ShieldAlert, Lock, UserCheck } from 'lucide-react';
import { getEmployees } from '../../utils/dbHelpers';
import { getEmployeeDisplayName, normalizeDate, getTodayDateString, formatTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export const AttendanceModal = ({
  isOpen,
  onClose,
  onSave,
  record,
  loading,
  error,
  clearError,
  employees: passedEmployees = [],
  currentEmployee: passedCurrentEmployee,
  existingRecords = [],
}) => {
  const { currentEmployee: authEmployee, user } = useAuth();

  const [employees, setEmployees] = useState(passedEmployees || []);
  const [fieldErrors, setFieldErrors] = useState({});

  // Resolve the active logged-in employee record (all accounts strictly fill for themselves)
  const activeEmployee =
    passedCurrentEmployee ||
    authEmployee ||
    employees.find(
      (e) => (e.email || '').toLowerCase().trim() === (user?.email || '').toLowerCase().trim()
    );

  const [formData, setFormData] = useState({
    employee_id: activeEmployee?.id || '',
    attendance_date: getTodayDateString(),
    status: 'Present',
    check_in: '09:00',
    check_out: '17:00',
  });

  const targetEmpId = String(activeEmployee?.id || formData.employee_id || '');
  const selectedDateNorm = normalizeDate(formData.attendance_date);
  const isDuplicateForDate =
    !record &&
    existingRecords.some((r) => {
      const rEmpId = String(r.employee_id || '');
      const rDateNorm = normalizeDate(r.attendance_date || r.date);
      return rEmpId === targetEmpId && rDateNorm === selectedDateNorm;
    });

  useEffect(() => {
    if (passedEmployees && passedEmployees.length > 0) {
      setEmployees(passedEmployees);
    } else if (isOpen) {
      const fetchStaff = async () => {
        try {
          const list = await getEmployees();
          setEmployees(list || []);
        } catch (err) {
          console.error('Error fetching staff for attendance:', err);
        }
      };
      fetchStaff();
    }
  }, [isOpen, passedEmployees]);

  useEffect(() => {
    const empId = record?.employee_id ? String(record.employee_id) : (activeEmployee?.id || '');
    if (record) {
      setFormData({
        employee_id: empId,
        attendance_date: normalizeDate(record.attendance_date || record.date) || getTodayDateString(),
        status: record.status || 'Present',
        check_in: record.check_in || '',
        check_out: record.check_out || '',
      });
    } else {
      setFormData({
        employee_id: empId,
        attendance_date: getTodayDateString(),
        status: 'Present',
        check_in: '09:00',
        check_out: '17:00',
      });
    }
    setFieldErrors({});
    if (clearError) clearError();
  }, [record, isOpen, activeEmployee]);

  const validate = () => {
    const errors = {};
    const empId = activeEmployee?.id || formData.employee_id;
    if (!empId) {
      errors.employee_id = 'No verified employee profile found for your account. Please log in with a valid account.';
    }
    if (!formData.attendance_date) {
      errors.attendance_date = 'Date is required';
    } else if (isDuplicateForDate) {
      errors.attendance_date = 'Attendance has already been marked for this date. Only one attendance record per day is permitted.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (clearError) clearError();
    if (!validate()) return;
    const finalEmpId = activeEmployee?.id || formData.employee_id;
    onSave({
      ...formData,
      employee_id: finalEmpId,
      check_in: formatTime(formData.check_in),
      check_out: formData.check_out ? formatTime(formData.check_out) : '',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={record ? 'Edit Personal Attendance' : 'Log Personal Attendance'}
      subtitle="Personal attendance recording is strictly bound to your authenticated account"
      size="md"
      showClose={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Inline Error Display */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-bold">Database Error</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Locked Personal Applicant Account Card (All accounts only fill for themselves) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#424769] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#FFB17A]" />
              Account Holder
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Personal Form Only
            </span>
          </label>

          {activeEmployee ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-[#2D3250] text-[#FFB17A] flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {(activeEmployee.full_name || activeEmployee.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#2D3250] truncate">
                      {getEmployeeDisplayName(activeEmployee)}
                    </p>
                    <span className="text-[10px] font-semibold bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                      {activeEmployee.role_tier || 'Mid-Level'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {activeEmployee.designation || 'Staff'} &bull; {activeEmployee.department || 'General'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  <UserCheck className="w-3.5 h-3.5" /> Authenticated
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Identifying employee profile for your account ({user?.email || 'current user'})...</span>
            </div>
          )}

          {fieldErrors.employee_id && (
            <p className="mt-1 text-xs text-rose-500 font-semibold">{fieldErrors.employee_id}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Attendance Date"
            type="date"
            icon={Calendar}
            value={formData.attendance_date}
            onChange={(e) => {
              setFormData({ ...formData, attendance_date: e.target.value });
              if (fieldErrors.attendance_date) setFieldErrors({ ...fieldErrors, attendance_date: '' });
            }}
            error={fieldErrors.attendance_date}
            required
          />

          <Select
            label="Attendance Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'Present', label: 'Present' },
              { value: 'Late', label: 'Late' },
              { value: 'Half Day', label: 'Half Day' },
              { value: 'On Leave', label: 'On Leave' },
              { value: 'Absent', label: 'Absent' },
            ]}
          />
        </div>

        {isDuplicateForDate && (
          <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Daily Attendance Rule Enforced</p>
              <p className="mt-0.5 leading-relaxed">
                Attendance for <strong>{formData.attendance_date}</strong> has already been marked for this employee. Each employee can only mark attendance once per day.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Check In Time (12-Hour System)"
            type="time"
            icon={Clock}
            value={formData.check_in}
            onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
            helperText={formData.check_in ? `12-Hour Time: ${formatTime(formData.check_in)}` : ''}
          />

          <Input
            label="Check Out Time (12-Hour System)"
            type="time"
            icon={Clock}
            value={formData.check_out}
            onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
            helperText={formData.check_out ? `12-Hour Time: ${formatTime(formData.check_out)}` : ''}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" loading={loading} disabled={isDuplicateForDate} className="font-bold">
            {record ? 'Save Changes' : 'Log Attendance'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
