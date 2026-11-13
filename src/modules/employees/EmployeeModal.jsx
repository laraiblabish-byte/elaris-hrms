import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { Mail, Phone, Briefcase, Building2, User, ShieldAlert, Sparkles, AlertCircle, Award } from 'lucide-react';
import { getDepartments, detectRoleTier } from '../../utils/dbHelpers';
import { getDesignationsForDepartment, ALL_DESIGNATIONS, DEPARTMENT_DESIGNATIONS, PREDEFINED_DEPARTMENTS } from '../../utils/constants';

export const EmployeeModal = ({ isOpen, onClose, onSave, employee, loading, error, clearError }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    department_id: '',
    designation: '',
    role_tier: 'Mid-Level',
    salary: '',
  });

  const [departments, setDepartments] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const list = await getDepartments();
        setDepartments(list || []);
      } catch (err) {
        console.error('Error fetching departments for employee form:', err);
      }
    };
    if (isOpen) {
      fetchDepts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (employee) {
      setFormData({
        full_name: employee.full_name || employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        department_id: employee.department_id ? String(employee.department_id) : '',
        designation: employee.designation || '',
        role_tier: employee.role_tier || detectRoleTier(employee),
        salary: employee.salary !== null && employee.salary !== undefined ? String(employee.salary) : '',
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        department: '',
        department_id: '',
        designation: '',
        role_tier: 'Mid-Level',
        salary: '',
      });
    }
    setFieldErrors({});
    if (clearError) clearError();
  }, [employee, isOpen]);

  // Dynamic designations based on selected department
  const availableDesignations = formData.department
    ? getDesignationsForDepartment(formData.department)
    : ALL_DESIGNATIONS;

  const handleDepartmentChange = (selectedDeptName) => {
    const foundDept = departments.find(
      (d) => (d.department_name || d.name)?.trim().toLowerCase() === selectedDeptName?.trim().toLowerCase()
    );

    const relevantDesignations = getDesignationsForDepartment(selectedDeptName);

    setFormData((prev) => {
      // Keep existing designation if valid for the new department or if prev was empty
      const shouldKeep = prev.designation && relevantDesignations.includes(prev.designation);
      return {
        ...prev,
        department: selectedDeptName,
        department_id: foundDept ? String(foundDept.id) : '',
        designation: shouldKeep ? prev.designation : '',
      };
    });

    if (fieldErrors.department) {
      setFieldErrors((prev) => ({ ...prev, department: '' }));
    }
  };

  const handleDesignationChange = (selectedRole) => {
    let autoDeptName = formData.department;
    let autoDeptId = formData.department_id;

    // If department is not yet chosen, automatically match the department from the designation map!
    if (!autoDeptName && selectedRole) {
      for (const [dept, roles] of Object.entries(DEPARTMENT_DESIGNATIONS)) {
        if (roles.includes(selectedRole)) {
          autoDeptName = dept;
          const found = departments.find(
            (d) => (d.department_name || d.name)?.trim().toLowerCase() === dept.toLowerCase()
          );
          if (found) autoDeptId = String(found.id);
          break;
        }
      }
    }

    const suggestedTier = detectRoleTier({ designation: selectedRole, department: autoDeptName || formData.department });

    setFormData((prev) => ({
      ...prev,
      designation: selectedRole,
      department: autoDeptName || prev.department,
      department_id: autoDeptId || prev.department_id,
      role_tier: prev.role_tier && prev.role_tier !== 'Mid-Level' ? prev.role_tier : suggestedTier,
    }));

    if (fieldErrors.designation) {
      setFieldErrors((prev) => ({ ...prev, designation: '' }));
    }
    if (autoDeptName && fieldErrors.department) {
      setFieldErrors((prev) => ({ ...prev, department: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email (e.g. name@elaris.com)';
    }

    if (!formData.department) {
      errors.department = 'Please select a department';
    }

    if (!formData.designation) {
      errors.designation = 'Please select a job title / designation';
    }

    if (formData.salary && isNaN(Number(formData.salary))) {
      errors.salary = 'Base salary must be a valid number in PKR';
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

  // Helper to interpret Supabase error messages
  const getFriendlyError = (err) => {
    if (!err) return null;
    const code = err.code || '';
    const msg = err.message || '';

    if (code === '42501' || msg.includes('row-level security') || msg.includes('policy')) {
      return {
        title: 'Supabase RLS Policy Error (Code: 42501)',
        description: 'Row-level security (RLS) prevented this insert. Your Supabase table requires an active policy for authenticated users.',
        resolution: 'Run the provided "supabase_setup.sql" script in your Supabase SQL Editor to grant authenticated users access.',
        raw: msg,
      };
    }

    if (code === '23505' || msg.includes('duplicate key') || msg.includes('unique constraint')) {
      return {
        title: 'Duplicate Record Error (Code: 23505)',
        description: 'An employee with this email address already exists in the database.',
        resolution: 'Please use a unique email address or update the existing employee profile.',
        raw: msg,
      };
    }

    if (code === '23503' || msg.includes('foreign key')) {
      return {
        title: 'Foreign Key Constraint Error (Code: 23503)',
        description: 'The selected department ID was not found in the referenced table.',
        resolution: 'Select an existing department from the dropdown list.',
        raw: msg,
      };
    }

    return {
      title: code ? `Database Error (Code: ${code})` : 'Database Error',
      description: msg || 'An unexpected error occurred while communicating with Supabase.',
      resolution: err.hint || err.details || null,
      raw: msg,
    };
  };

  const friendlyErr = getFriendlyError(error);

  // Department options for SearchableSelect (uses fetched departments or predefined fallback)
  const availableDepts = departments.length > 0 ? departments : PREDEFINED_DEPARTMENTS;
  const deptOptions = availableDepts.map((d) => ({
    value: d.department_name || d.name,
    label: d.department_name || d.name,
    subtitle: d.description || undefined,
  }));

  // Designation options for SearchableSelect
  const designationOptions = availableDesignations.map((role) => ({
    value: role,
    label: role,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? 'Edit Employee Record' : 'Create New Employee'}
      subtitle="Enter organization credentials, department, designation, and salary in PKR"
      size="lg"
      showClose={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Supabase Error Alert Banner */}
        {friendlyErr && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{friendlyErr.title}</span>
            </div>
            <p className="leading-relaxed font-medium text-rose-800">
              {friendlyErr.description}
            </p>
            {friendlyErr.resolution && (
              <div className="rounded-lg bg-white/80 p-2.5 border border-rose-200 text-rose-700 text-[11px] leading-relaxed">
                <strong>Action:</strong> {friendlyErr.resolution}
              </div>
            )}
            {friendlyErr.raw && (
              <p className="text-[11px] text-rose-600 font-mono mt-1 pt-1 border-t border-rose-200/60">
                Raw message: {friendlyErr.raw}
              </p>
            )}
          </div>
        )}

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name / Display Name"
            placeholder="e.g. Muhammad Usman"
            icon={User}
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            helperText="Employee name or identifier"
          />

          <Input
            label="Work Email Address"
            type="email"
            placeholder="usman@elaris.com"
            icon={Mail}
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
            }}
            error={fieldErrors.email}
            required
            autoComplete="email"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Searchable Department Dropdown */}
          <SearchableSelect
            label="Department"
            icon={Building2}
            value={formData.department}
            onChange={handleDepartmentChange}
            options={deptOptions}
            placeholder="Choose department..."
            error={fieldErrors.department}
            required
            helperText="Select from predefined Elaris departments"
          />

          {/* Searchable Designation Dropdown (Filtered by Department) */}
          <SearchableSelect
            label="Designation / Role"
            icon={Briefcase}
            value={formData.designation}
            onChange={handleDesignationChange}
            options={designationOptions}
            placeholder={
              formData.department
                ? `Select ${formData.department} role...`
                : 'Choose designation...'
            }
            error={fieldErrors.designation}
            required
            helperText={
              formData.department
                ? `Showing ${availableDesignations.length} roles for ${formData.department}`
                : 'Select department first to narrow roles'
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+92 300 1234567"
            icon={Phone}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            helperText="Contact phone number"
          />

          <div>
            <label className="block text-xs font-semibold text-[#2D3250] mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#FFB17A]" />
              Benefits & Seniority Policy Tier
            </label>
            <select
              value={formData.role_tier || 'Mid-Level'}
              onChange={(e) => setFormData({ ...formData, role_tier: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2.5 text-xs font-bold text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
            >
              <option value="Executive">Executive Tier (30 Days Leaves & $100k Coverage)</option>
              <option value="Senior">Senior Tier (25 Days Leaves & $50k Coverage)</option>
              <option value="Mid-Level">Mid-Level Tier (20 Days Leaves & $25k Coverage)</option>
              <option value="Junior">Junior Tier (15 Days Leaves & $12k Coverage)</option>
            </select>
            <p className="mt-1 text-[11px] text-gray-400">
              Sets paid leave quotas, healthcare limit, and WFH/learning benefits
            </p>
          </div>
        </div>

        <div>
          <Input
            label="Base Monthly Salary (PKR)"
            type="number"
            step="1"
            placeholder="80000"
            value={formData.salary}
            onChange={(e) => {
              setFormData({ ...formData, salary: e.target.value });
              if (fieldErrors.salary) setFieldErrors({ ...fieldErrors, salary: '' });
            }}
            error={fieldErrors.salary}
            helperText={
              formData.salary
                ? `Displays as Rs. ${Number(formData.salary).toLocaleString('en-PK')}`
                : 'Amount in Pakistani Rupees (e.g. 80000)'
            }
          />
        </div>

        {/* Pinned action buttons */}
        <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3 z-20 rounded-b-2xl shadow-xs">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            loading={loading}
            className="px-6 py-2.5 font-bold text-sm bg-[#FFB17A] text-[#2D3250] hover:bg-[#fca05f] shadow-md shadow-[#FFB17A]/25 cursor-pointer"
          >
            {employee ? 'Save Changes' : 'Create Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
