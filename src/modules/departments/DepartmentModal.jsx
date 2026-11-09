import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Building2, User, ShieldAlert } from 'lucide-react';
import { getEmployees } from '../../utils/dbHelpers';
import { getEmployeeDisplayName } from '../../utils/formatters';

export const DepartmentModal = ({ isOpen, onClose, onSave, department, loading, error, clearError }) => {
  const [formData, setFormData] = useState({
    department_name: '',
    description: '',
    head_employee_id: '',
  });

  const [employees, setEmployees] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staff = await getEmployees();
        setEmployees(staff || []);
      } catch (e) {
        console.warn('Failed to load staff for department head assignment:', e);
      }
    };
    if (isOpen) {
      fetchStaff();
    }
  }, [isOpen]);

  useEffect(() => {
    if (department) {
      setFormData({
        department_name: department.department_name || department.name || '',
        description: department.description || '',
        head_employee_id: department.head_employee_id ? String(department.head_employee_id) : '',
      });
    } else {
      setFormData({
        department_name: '',
        description: '',
        head_employee_id: '',
      });
    }
    setFieldErrors({});
    if (clearError) clearError();
  }, [department, isOpen]);

  const validate = () => {
    const errors = {};
    if (!formData.department_name || !formData.department_name.trim()) {
      errors.department_name = 'Please enter a department name';
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
      title={department ? 'Edit Department' : 'Create New Department'}
      subtitle="Define organizational unit details and assign a Department Head"
      size="md"
      showClose={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold">Database Notification</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <Input
          label="Department Name"
          placeholder="e.g. Software Development, Quality Assurance, HR, Sales"
          icon={Building2}
          value={formData.department_name}
          onChange={(e) => {
            setFormData({ ...formData, department_name: e.target.value });
            if (fieldErrors.department_name) setFieldErrors({ ...fieldErrors, department_name: '' });
          }}
          error={fieldErrors.department_name}
          required
          autoFocus
        />

        <Select
          label="Assigned Department Head"
          icon={User}
          value={formData.head_employee_id}
          onChange={(e) => setFormData({ ...formData, head_employee_id: e.target.value })}
          helperText="Designate a manager/lead to review leave applications for this department"
          placeholder="Select Department Head (optional)..."
        >
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {getEmployeeDisplayName(emp)} - {emp.designation || emp.department || 'Staff'}
            </option>
          ))}
        </Select>

        <div className="w-full">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#424769] mb-1.5">
            Department Scope / Description
          </label>
          <div className="relative rounded-lg shadow-sm">
            <textarea
              rows="3"
              placeholder="Brief description of department scope, responsibilities and objectives"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-[#2D3250] placeholder-gray-400 transition-colors focus:border-[#424769] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" loading={loading} className="font-bold">
            {department ? 'Save Department Changes' : 'Create Department'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
