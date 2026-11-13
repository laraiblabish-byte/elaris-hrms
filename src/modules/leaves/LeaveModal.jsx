import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Calendar, User, FileText, ShieldAlert, Lock, UserCheck, AlertCircle, Clock } from 'lucide-react';
import { getEmployees } from '../../utils/dbHelpers';
import { getEmployeeDisplayName, getTodayDateString, calculateLeaveDays } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export const LeaveModal = ({
  isOpen,
  onClose,
  onSave,
  loading,
  error,
  clearError,
  employees: passedEmployees = [],
  currentEmployee: passedCurrentEmployee,
}) => {
  const { currentEmployee: authEmployee, user } = useAuth();

  const [employees, setEmployees] = useState(passedEmployees || []);
  const [fieldErrors, setFieldErrors] = useState({});

  // Resolve the active logged-in employee record (locked to this account only)
  const activeEmployee =
    passedCurrentEmployee ||
    authEmployee ||
    employees.find(
      (e) => (e.email || '').toLowerCase().trim() === (user?.email || '').toLowerCase().trim()
    );

  const isApplicantDeptHead = Boolean(
    (activeEmployee?.designation && (activeEmployee.designation.toLowerCase().includes('head') || activeEmployee.designation.toLowerCase().includes('director') || activeEmployee.designation.toLowerCase().includes('chief'))) ||
    (user?.user_metadata?.role && user.user_metadata.role.toLowerCase().includes('head'))
  );

  const [formData, setFormData] = useState({
    employee_id: activeEmployee?.id || '',
    leave_type: 'Annual Leave',
    start_date: getTodayDateString(),
    end_date: getTodayDateString(),
    reason: '',
    status: 'Pending',
    head_approved: false,
    final_approved: false,
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
          console.error('Error fetching staff for leave form:', err);
        }
      };
      fetchStaff();
    }
  }, [isOpen, passedEmployees]);

  useEffect(() => {
    if (isOpen) {
      const empId = activeEmployee?.id || '';
      setFormData({
        employee_id: empId,
        leave_type: 'Annual Leave',
        start_date: getTodayDateString(),
        end_date: getTodayDateString(),
        reason: '',
        status: 'Pending',
        head_approved: false,
        final_approved: false,
      });
      setFieldErrors({});
      if (clearError) clearError();
    }
  }, [isOpen, activeEmployee]);

  const validate = () => {
    const errors = {};
    const empId = activeEmployee?.id || formData.employee_id;
    if (!empId) {
      errors.employee_id = 'No verified employee profile found for your account. Please log in with a valid account.';
    }
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    }
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      errors.end_date = 'End date cannot be prior to start date';
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
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Leave Request"
      subtitle="Leave requests are strictly locked to your employee account (Stage 1: Dept Head Review)"
      size="md"
      showClose={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Inline Error Notice */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-bold">Leave Submission Error</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Locked Applicant Account Card (Other accounts cannot fill for someone else) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#424769] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#FFB17A]" />
              Applicant Account
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Locked to Your Account
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

        <Select
          label="Leave Category"
          value={formData.leave_type}
          onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
          options={[
            { value: 'Annual Leave', label: 'Annual / Paid Vacation' },
            { value: 'Sick Leave', label: 'Sick / Medical Leave' },
            { value: 'Casual Leave', label: 'Casual / Personal Leave' },
            { value: 'Maternity Leave', label: 'Maternity / Paternity Leave' },
            { value: 'Unpaid Leave', label: 'Unpaid Leave of Absence' },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            icon={Calendar}
            value={formData.start_date}
            onChange={(e) => {
              const newStart = e.target.value;
              const newEnd = formData.end_date && formData.end_date < newStart ? newStart : formData.end_date;
              setFormData({ ...formData, start_date: newStart, end_date: newEnd });
              if (fieldErrors.start_date) setFieldErrors({ ...fieldErrors, start_date: '', end_date: '' });
            }}
            error={fieldErrors.start_date}
            required
          />

          <Input
            label="End Date"
            type="date"
            icon={Calendar}
            value={formData.end_date}
            onChange={(e) => {
              setFormData({ ...formData, end_date: e.target.value });
              if (fieldErrors.end_date) setFieldErrors({ ...fieldErrors, end_date: '' });
            }}
            error={fieldErrors.end_date}
            required
          />
        </div>

        {/* Live Duration Calculation Badge */}
        <div className="rounded-xl bg-[#2D3250]/5 border border-gray-200/80 p-3 flex items-center justify-between">
          <span className="text-xs text-[#424769] font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#FFB17A]" />
            Requested Leave Duration:
          </span>
          <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-[#2D3250] text-[#FFB17A] shadow-xs">
            {calculateLeaveDays(formData.start_date, formData.end_date)} {calculateLeaveDays(formData.start_date, formData.end_date) === 1 ? 'Day' : 'Days'} Duration
          </span>
        </div>

        <div className="w-full">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#424769] mb-1.5">
            Reason / Notes
          </label>
          <textarea
            rows="3"
            placeholder="Explain reason for requested time off..."
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="block w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-[#2D3250] placeholder-gray-400 focus:border-[#424769] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
          />
        </div>

        <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-900 flex items-start gap-2">
          <span className="font-bold text-amber-700">Approval Workflow:</span>
          <span>
            {isApplicantDeptHead ? (
              <>
                As a <strong>Department Head</strong>, your leave application is routed directly to <strong>HR Management</strong> and is <strong>only approved by HR</strong> (Stage 1 review is bypassed).
              </>
            ) : (
              <>
                Upon submission, this request enters <strong>Stage 1 (Department Head Approval)</strong>. Once endorsed by the Department Head, it advances to <strong>Stage 2 (Final HR Approval)</strong>.
              </>
            )}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" loading={loading} className="font-bold">
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};
