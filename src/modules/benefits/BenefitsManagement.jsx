import { useState, useEffect } from 'react';
import {
  Award,
  RefreshCw,
  Sliders,
  UserCheck,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmployeePortalView } from './EmployeePortalView';
import { HRBenefitsPolicyManager } from './HRBenefitsPolicyManager';
import { LeaveModal } from '../leaves/LeaveModal';
import {
  getEmployees,
  getLeaveRequests,
  getRoleBenefits,
  saveRoleBenefit,
  resetRoleBenefitsToDefault,
  calculateEmployeeLeavesSummary,
  detectRoleTier,
  createLeaveRequest,
} from '../../utils/dbHelpers';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const BenefitsManagement = () => {
  const { user, profile, isHR, isEmployee, currentEmployee } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [policies, setPolicies] = useState([]);

  // Selected employee for the portal view
  const [selectedEmployee, setSelectedEmployee] = useState(currentEmployee || null);

  // Active sub-tab in Benefits module: 'portal' | 'hr-policy'
  const [activeSubTab, setActiveSubTab] = useState('portal');

  // Leave Modal state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveModalError, setLeaveModalError] = useState(null);

  const isHRUser = Boolean(isHR);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [empList, leaveList, policyList] = await Promise.all([
        getEmployees(),
        getLeaveRequests(),
        getRoleBenefits(),
      ]);

      const safeEmps = empList || [];
      const safeLeaves = leaveList || [];
      const safePolicies = policyList || [];

      const userLeaves = isEmployee && currentEmployee
        ? safeLeaves.filter((l) => String(l.employee_id) === String(currentEmployee.id))
        : safeLeaves;

      setEmployees(isEmployee && currentEmployee ? [currentEmployee] : safeEmps);
      setLeaves(userLeaves);
      setPolicies(safePolicies);

      if (isEmployee && currentEmployee) {
        setSelectedEmployee(currentEmployee);
      } else {
        // Match current logged in user to an employee record by email
        const userEmail = (user?.email || '').toLowerCase().trim();
        let matchedEmp = safeEmps.find((e) => (e.email || '').toLowerCase().trim() === userEmail);

        // If no exact email match, select existing or first employee
        if (!matchedEmp && safeEmps.length > 0) {
          matchedEmp = selectedEmployee
            ? safeEmps.find((e) => String(e.id) === String(selectedEmployee.id)) || safeEmps[0]
            : safeEmps[0];
        }

        if (matchedEmp) {
          setSelectedEmployee(matchedEmp);
        }
      }
    } catch (err) {
      console.error('Benefits management load error:', err);
      showToast('Error loading benefits data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user, isEmployee, currentEmployee]);

  // Find the policy matching the selected employee's role tier
  const resolvedTier = selectedEmployee
    ? detectRoleTier(selectedEmployee)
    : 'Mid-Level';

  const matchingPolicy =
    policies.find((p) => p.role_key.toLowerCase() === resolvedTier.toLowerCase()) ||
    policies.find((p) => p.role_key === 'Mid-Level') ||
    policies[0] ||
    {};

  // Calculate summary metrics for the selected employee
  const summary = selectedEmployee
    ? calculateEmployeeLeavesSummary(selectedEmployee.id, leaves, matchingPolicy)
    : null;

  // Handle HR saving a role policy
  const handleUpdatePolicy = async (roleKey, updatedData) => {
    try {
      setActionLoading(true);
      await saveRoleBenefit(roleKey, updatedData);
      showToast(`Benefits and leave quotas for ${roleKey} Tier updated successfully!`, 'success');
      // Reload policies
      const updatedPolicies = await getRoleBenefits();
      setPolicies(updatedPolicies);
    } catch (err) {
      showToast(err.message || 'Failed to update role policy', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle resetting policies to defaults
  const handleResetDefaults = async () => {
    try {
      setActionLoading(true);
      const defaults = await resetRoleBenefitsToDefault();
      setPolicies(defaults);
      showToast('Role benefit policies restored to company default presets', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to reset policies', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle applying for leave from employee portal
  const handleSaveLeave = async (formData) => {
    try {
      setActionLoading(true);
      setLeaveModalError(null);
      await createLeaveRequest({
        ...formData,
        employee_id: formData.employee_id || selectedEmployee?.id,
      });
      showToast('Leave request submitted successfully!', 'success');
      setIsLeaveModalOpen(false);
      // Reload leaves
      const updatedLeaves = await getLeaveRequests();
      setLeaves(updatedLeaves);
    } catch (err) {
      setLeaveModalError(err.message || 'Failed to submit leave request');
      showToast(err.message || 'Failed to submit leave request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Employee Portal & Benefits..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2D3250] flex items-center gap-2.5">
            <Award className="w-7 h-7 text-[#FFB17A]" />
            Employee Benefits & Leave Quota Portal
          </h1>
          <p className="text-xs text-[#676F9D] mt-0.5">
            Tier-based compensation benefits, leave allowances, and personal leave history
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadAllData}
            title="Refresh benefits"
          >
            Refresh
          </Button>

          {/* Sub-tab Switcher: Employee Portal vs HR Benefits Manager */}
          <div className="flex items-center rounded-2xl bg-[#2D3250] p-1 text-xs font-bold text-white shadow-sm">
            <button
              onClick={() => setActiveSubTab('portal')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'portal'
                  ? 'bg-[#FFB17A] text-[#2D3250] shadow-md shadow-[#FFB17A]/25 font-black'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Employee Portal</span>
            </button>

            {isHRUser && (
              <button
                onClick={() => setActiveSubTab('hr-policy')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  activeSubTab === 'hr-policy'
                    ? 'bg-[#FFB17A] text-[#2D3250] shadow-md shadow-[#FFB17A]/25 font-black'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>HR Policy Manager</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: Employee Portal View */}
      {activeSubTab === 'portal' && (
        <EmployeePortalView
          employee={selectedEmployee}
          allEmployees={employees}
          onSelectEmployee={(emp) => setSelectedEmployee(emp)}
          summary={summary}
          policy={matchingPolicy}
          isHRUser={isHRUser}
          onApplyLeave={() => {
            setLeaveModalError(null);
            setIsLeaveModalOpen(true);
          }}
        />
      )}

      {/* Tab 2: HR Policy Manager View */}
      {activeSubTab === 'hr-policy' && isHRUser && (
        <HRBenefitsPolicyManager
          policies={policies}
          employees={employees}
          onUpdatePolicy={handleUpdatePolicy}
          onResetDefaults={handleResetDefaults}
          loading={actionLoading}
        />
      )}

      {/* Apply Leave Modal */}
      {isLeaveModalOpen && (
        <LeaveModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          onSave={handleSaveLeave}
          loading={actionLoading}
          error={leaveModalError}
          clearError={() => setLeaveModalError(null)}
          employees={employees}
          defaultEmployeeId={selectedEmployee?.id}
        />
      )}
    </div>
  );
};
