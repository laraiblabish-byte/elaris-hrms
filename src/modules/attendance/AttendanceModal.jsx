import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Calendar, Clock, ShieldAlert } from 'lucide-react';
import { getEmployees } from '../../utils/dbHelpers';
import { getEmployeeDisplayName } from '../../utils/formatters';

export const AttendanceModal = ({
  isOpen,
  onClose,
  onSave,
  record,
  loading,
  error,
  clearError,
  employees: passedEmployees = [],
}) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    status: 'Present',
    check_in: '09:00',
    check_out: '17:00',
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
          console.error('Error fetching staff for attendance:', err);
        }
      };
      fetchStaff();
    }
  }, [isOpen, passedEmployees]);

  useEffect(() => {
    if (record) {
      setFormData({
        employee_id: record.employee_id ? String(record.employee_id) : '',
        attendance_date: record.attendance_date || new Date().toISOString().split('T')[0],
        status: record.status || 'Present',
        check_in: record.check_in || '',
        check_out: record.check_out || '',
      });
    } else {
      setFormData({
        employee_id: '',
        attendance_date: new Date().toISOString().split('T')[0],
        status: 'Present',
        check_in: '09:00',
        check_out: '17:00',
      });
    }
    setFieldErrors({});
    if (clearError) clearError();
  }, [record, isOpen]);

  const validate = () => {
    const errors = {};
    if (!formData.employee_id) {
      errors.employee_id = 'Please select an employee';
    }
    if (!formData.attendance_date) {
      errors.attendance_date = 'Date is required';
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
      title={record ? 'Edit Attendance Log' : 'Log Staff Attendance'}
      subtitle="Record presence, check-in, and check-out timestamps in database"
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

        <Select
          label="Select Employee"
          value={formData.employee_id}
          onChange={(e) => {
            setFormData({ ...formData, employee_id: e.target.value });
            if (fieldErrors.employee_id) setFieldErrors({ ...fieldErrors, employee_id: '' });
          }}
          error={fieldErrors.employee_id}
          required
          disabled={!!record}
          placeholder="Choose staff member..."
        >
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {getEmployeeDisplayName(emp)} ({emp.designation || emp.department || 'Staff'})
            </option>
          ))}
        </Select>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Check In Time"
            type="time"
            icon={Clock}
            value={formData.check_in}
            onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
          />

          <Input
            label="Check Out Time"
            type="time"
            icon={Clock}
            value={formData.check_out}
            onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" loading={loading} className="font-bold">
            {record ? 'Save Changes' : 'Log Attendance'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
