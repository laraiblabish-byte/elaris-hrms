import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Calendar, ShieldAlert } from 'lucide-react';
import { getEmployees } from '../../utils/dbHelpers';
import { getEmployeeDisplayName } from '../../utils/formatters';

export const LeaveModal = ({
  isOpen,
  onClose,
  onSave,
  loading,
  error,
  clearError,
  employees: passedEmployees = [],
}) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'Annual Leave',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'Pending',
    head_approved: false,
    final_approved: false,
  });

  const [employees, setEmployees] = useState(passedEmployees || []);
  const [fieldErrors, setFieldErrors] = useState({});

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
      setFormData({
        employee_id: '',
        leave_type: 'Annual Leave',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: '',
        status: 'Pending',
        head_approved: false,
        final_approved: false,
      });
      setFieldErrors({});
      if (clearError) clearError();
    }
  }, [isOpen]);

  const validate = () => {
    const errors = {};
    if (!formData.employee_id) {
      errors.employee_id = 'Please select an applicant employee';
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
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Leave Request"
      subtitle="Initializes Two-Level Approval Workflow (Stage 1: Dept Head Review)"
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

        <Select
          label="Select Employee (Applicant)"
          value={formData.employee_id}
          onChange={(e) => {
            setFormData({ ...formData, employee_id: e.target.value });
            if (fieldErrors.employee_id) setFieldErrors({ ...fieldErrors, employee_id: '' });
          }}
          error={fieldErrors.employee_id}
          required
          placeholder="Choose staff applicant..."
        >
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {getEmployeeDisplayName(emp)} ({emp.designation || emp.department || 'Staff'})
            </option>
          ))}
        </Select>

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
              setFormData({ ...formData, start_date: e.target.value });
              if (fieldErrors.start_date) setFieldErrors({ ...fieldErrors, start_date: '' });
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
            Upon submission, this request enters <strong>Stage 1 (Department Head Approval)</strong>. Once endorsed by the Department Head, it advances to <strong>Stage 2 (Final HR Approval)</strong>.
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
