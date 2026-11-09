import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Calendar, Calculator, ShieldAlert } from 'lucide-react';
import { getEmployees } from '../../utils/dbHelpers';
import { formatCurrency, getEmployeeDisplayName } from '../../utils/formatters';

export const PayrollModal = ({
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
    basic_salary: '',
    allowances: '0',
    bonus: '0',
    deductions: '0',
    payment_date: new Date().toISOString().split('T')[0],
    payment_status: 'Pending',
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
          console.error('Error fetching employees for payroll:', err);
        }
      };
      fetchStaff();
    }
  }, [isOpen, passedEmployees]);

  useEffect(() => {
    if (record) {
      setFormData({
        employee_id: record.employee_id ? String(record.employee_id) : '',
        basic_salary: record.basic_salary !== null ? String(record.basic_salary) : '0',
        allowances: record.allowances !== null ? String(record.allowances) : '0',
        bonus: record.bonus !== null ? String(record.bonus) : '0',
        deductions: record.deductions !== null ? String(record.deductions) : '0',
        payment_date: record.payment_date || new Date().toISOString().split('T')[0],
        payment_status: record.payment_status || 'Pending',
      });
    } else {
      setFormData({
        employee_id: '',
        basic_salary: '',
        allowances: '0',
        bonus: '0',
        deductions: '0',
        payment_date: new Date().toISOString().split('T')[0],
        payment_status: 'Pending',
      });
    }
    setFieldErrors({});
    if (clearError) clearError();
  }, [record, isOpen, clearError]);

  // When employee is selected in create mode, auto-fill their basic salary
  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = employees.find((x) => String(x.id) === empId);
    setFormData((prev) => ({
      ...prev,
      employee_id: empId,
      basic_salary: emp && emp.salary ? String(emp.salary) : prev.basic_salary || '0',
    }));
    if (fieldErrors.employee_id) {
      setFieldErrors((prev) => ({ ...prev, employee_id: '' }));
    }
  };

  // Live calculation of net pay
  const basicNum = parseFloat(formData.basic_salary) || 0;
  const allowNum = parseFloat(formData.allowances) || 0;
  const bonusNum = parseFloat(formData.bonus) || 0;
  const deductNum = parseFloat(formData.deductions) || 0;
  const calculatedNet = basicNum + allowNum + bonusNum - deductNum;

  const validate = () => {
    const errors = {};
    if (!formData.employee_id) {
      errors.employee_id = 'Please select an employee';
    }
    if (!formData.basic_salary || isNaN(Number(formData.basic_salary))) {
      errors.basic_salary = 'Valid basic salary is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={record ? 'Edit Payroll Record' : 'Process Employee Payroll'}
      subtitle="Calculate earnings, allowances, deductions and finalize net compensation"
      size="lg"
      showClose={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-bold">Payroll Processing Notice</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Select Employee"
            value={formData.employee_id}
            onChange={handleEmployeeChange}
            error={fieldErrors.employee_id}
            required
            disabled={!!record}
            placeholder="Choose employee..."
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {getEmployeeDisplayName(emp)} - Base: {formatCurrency(emp.salary)}
              </option>
            ))}
          </Select>

          <Input
            label="Payment Date"
            type="date"
            icon={Calendar}
            value={formData.payment_date}
            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Basic Salary (PKR)"
            type="number"
            step="1"
            placeholder="80000"
            value={formData.basic_salary}
            onChange={(e) => {
              setFormData({ ...formData, basic_salary: e.target.value });
              if (fieldErrors.basic_salary) setFieldErrors({ ...fieldErrors, basic_salary: '' });
            }}
            error={fieldErrors.basic_salary}
            required
          />

          <Input
            label="Allowances (PKR)"
            type="number"
            step="1"
            placeholder="15000"
            value={formData.allowances}
            onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Performance Bonus (PKR)"
            type="number"
            step="1"
            placeholder="5000"
            value={formData.bonus}
            onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
          />

          <Input
            label="Total Deductions (PKR) [Tax, Provident Fund]"
            type="number"
            step="1"
            placeholder="4000"
            value={formData.deductions}
            onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
          />
        </div>

        <Select
          label="Payment Status"
          value={formData.payment_status}
          onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
          options={[
            { value: 'Pending', label: 'Pending Processing' },
            { value: 'Processing', label: 'Processing' },
            { value: 'Paid', label: 'Paid / Transferred' },
          ]}
        />

        {/* Real-time Net Pay Calculation Summary Box */}
        <div className="rounded-2xl bg-gradient-to-r from-[#2D3250] to-[#424769] p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#FFB17A] flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> Real-time Calculation
            </span>
            <span className="text-xs text-gray-300">
              Basic + Allowances + Bonus - Deductions
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-sm font-medium text-gray-200">Net Payable Amount:</span>
            <span className="text-2xl font-black text-[#FFB17A]">
              {formatCurrency(calculatedNet)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" loading={loading} className="font-bold">
            {record ? 'Save Payroll Changes' : 'Generate Payroll Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

