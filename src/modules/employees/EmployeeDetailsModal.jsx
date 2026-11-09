import React from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Mail, Phone, Briefcase, Building2, Banknote, Calendar, Hash, Edit3 } from 'lucide-react';
import { formatCurrency, formatDate, getEmployeeDisplayName } from '../../utils/formatters';

export const EmployeeDetailsModal = ({ isOpen, onClose, employee, onEdit }) => {
  if (!employee) return null;

  const displayName = getEmployeeDisplayName(employee);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Profile"
      subtitle={`Elaris ID: #${employee.id}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Profile Header snippet */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#2D3250] text-white">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB17A] to-[#fca05f] text-2xl font-black text-[#2D3250]">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-lg font-bold text-white truncate">{displayName}</h4>
            <p className="text-xs text-[#FFB17A] font-semibold">{employee.designation || 'Staff Member'}</p>
            <p className="text-xs text-gray-300 mt-0.5">{employee.department || 'Unassigned Department'}</p>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1">
            <span className="text-[#676F9D] flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-[#424769]" /> Email Address
            </span>
            <p className="font-semibold text-[#2D3250] text-sm break-all">{employee.email || '-'}</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1">
            <span className="text-[#676F9D] flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-[#424769]" /> Phone
            </span>
            <p className="font-semibold text-[#2D3250] text-sm">{employee.phone || 'Not recorded'}</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1">
            <span className="text-[#676F9D] flex items-center gap-1.5 font-medium">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Base Salary (PKR)
            </span>
            <p className="font-black text-emerald-700 text-sm">{formatCurrency(employee.salary)}</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1">
            <span className="text-[#676F9D] flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#424769]" /> Onboarded Date
            </span>
            <p className="font-semibold text-[#2D3250] text-sm">{formatDate(employee.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="accent"
            icon={Edit3}
            onClick={() => {
              onClose();
              if (onEdit) onEdit(employee);
            }}
          >
            Edit Employee
          </Button>
        </div>
      </div>
    </Modal>
  );
};

