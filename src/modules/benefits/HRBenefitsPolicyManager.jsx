import { useState } from 'react';
import {
  Award,
  HeartPulse,
  Laptop,
  Briefcase,
  Calendar,
  DollarSign,
  Edit3,
  RotateCcw,
  GraduationCap,
  Users,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EditPolicyModal } from './EditPolicyModal';

export const HRBenefitsPolicyManager = ({
  policies = [],
  employees = [],
  onUpdatePolicy,
  onResetDefaults,
  loading,
}) => {
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'table'

  const handleEditClick = (policy) => {
    setSelectedPolicy(policy);
    setIsEditModalOpen(true);
  };

  const handleSave = async (formData) => {
    await onUpdatePolicy(formData.role_key, formData);
    setIsEditModalOpen(false);
    setSelectedPolicy(null);
  };

  // Count employees in each tier
  const getEmployeeCountInTier = (roleKey) => {
    return employees.filter((e) => (e.role_tier || '').toLowerCase() === roleKey.toLowerCase()).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-[#2D3250] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FFB17A]" />
            HR Role-Based Benefits & Leave Quota Policies
          </h2>
          <p className="text-xs text-[#676F9D] mt-0.5">
            Grade Level – Specialist Tier refers to an employee's professional experience and seniority level within the organization. Configure tiered allowances for Senior, Junior, Mid-Level, and Executive personnel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-xl bg-gray-100 p-1 text-xs font-semibold text-gray-600">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'cards' ? 'bg-white text-[#2D3250] shadow-xs font-bold' : 'hover:text-[#2D3250]'
              }`}
            >
              Tier Cards
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'table' ? 'bg-white text-[#2D3250] shadow-xs font-bold' : 'hover:text-[#2D3250]'
              }`}
            >
              Comparison Table
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={() => setIsResetConfirmOpen(true)}
            className="border-gray-200 text-gray-600"
          >
            Reset Defaults
          </Button>
        </div>
      </div>

      {/* Cards View */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {policies.map((policy) => {
            const empCount = getEmployeeCountInTier(policy.role_key);
            const totalLeaves =
              (Number(policy.annual_leaves) || 0) +
              (Number(policy.sick_leaves) || 0) +
              (Number(policy.casual_leaves) || 0) +
              (Number(policy.emergency_leaves) || 0);

            // Tier themes
            const isExecutive = policy.role_key === 'Executive';
            const isSenior = policy.role_key === 'Senior';
            const isMid = policy.role_key === 'Mid-Level';

            const borderAccent = isExecutive
              ? 'border-purple-200'
              : isSenior
              ? 'border-indigo-200'
              : isMid
              ? 'border-sky-200'
              : 'border-emerald-200';

            const headerBg = isExecutive
              ? 'from-[#2D3250] to-[#424769]'
              : isSenior
              ? 'from-[#2D3250] to-[#3a4066]'
              : isMid
              ? 'from-[#3b4267] to-[#4c5482]'
              : 'from-[#424769] to-[#555d8f]';

            const tierBadgeColor = isExecutive
              ? 'bg-purple-100 text-purple-800 border-purple-200'
              : isSenior
              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
              : isMid
              ? 'bg-sky-100 text-sky-800 border-sky-200'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200';

            return (
              <div
                key={policy.role_key}
                className={`rounded-3xl bg-white shadow-sm border ${borderAccent} overflow-hidden flex flex-col justify-between transition-all hover:shadow-md`}
              >
                {/* Card Header Banner */}
                <div>
                  <div className={`bg-gradient-to-r ${headerBg} p-6 text-white relative`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${tierBadgeColor}`}>
                            {policy.role_key} Tier
                          </span>
                          <span className="text-xs text-gray-300 flex items-center gap-1 font-medium">
                            <Users className="w-3.5 h-3.5 text-[#FFB17A]" />
                            {empCount} Active {empCount === 1 ? 'Staff' : 'Staff'}
                          </span>
                        </div>
                        <h3 className="text-xl font-black tracking-tight">{policy.role_name}</h3>
                        <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                          {policy.description || 'Configured benefits and leave package.'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-2xl font-black text-[#FFB17A] leading-none block">
                          {totalLeaves}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-300">
                          Days Paid Leave
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-5 text-xs">
                    {/* Leave Quotas Grid */}
                    <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-amber-200/50 mb-2.5">
                        <span className="font-bold text-[#2D3250] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#FFB17A]" />
                          Leave Allowances Breakdown
                        </span>
                        <span className="font-extrabold text-[#2D3250] text-xs">
                          {totalLeaves} Days Total
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-white/80 rounded-xl p-2 border border-amber-100">
                          <span className="text-base font-black text-[#2D3250] block">
                            {policy.annual_leaves}
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold uppercase">Annual</span>
                        </div>
                        <div className="bg-white/80 rounded-xl p-2 border border-amber-100">
                          <span className="text-base font-black text-[#2D3250] block">
                            {policy.sick_leaves}
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold uppercase">Sick</span>
                        </div>
                        <div className="bg-white/80 rounded-xl p-2 border border-amber-100">
                          <span className="text-base font-black text-[#2D3250] block">
                            {policy.casual_leaves}
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold uppercase">Casual</span>
                        </div>
                        <div className="bg-white/80 rounded-xl p-2 border border-amber-100">
                          <span className="text-base font-black text-[#2D3250] block">
                            {policy.emergency_leaves}
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold uppercase">Emerg.</span>
                        </div>
                      </div>
                    </div>

                    {/* Benefit Attributes List */}
                    <div className="space-y-3 divide-y divide-gray-100">
                      {/* Health Insurance */}
                      <div className="pt-2 flex items-start gap-3">
                        <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                          <HeartPulse className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <span className="font-bold text-[#2D3250] block">Health Insurance</span>
                          <p className="text-gray-600 text-[11px] leading-relaxed line-clamp-2">
                            {policy.health_insurance || 'Standard coverage'}
                          </p>
                        </div>
                      </div>

                      {/* Learning & Development */}
                      <div className="pt-2.5 flex items-start gap-3">
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <span className="font-bold text-[#2D3250] block">Learning & Certifications</span>
                          <p className="text-gray-600 text-[11px] leading-relaxed">
                            {policy.learning_budget || 'Online learning portal'}
                          </p>
                        </div>
                      </div>

                      {/* Remote Work & Wellness */}
                      <div className="pt-2.5 flex items-start gap-3">
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <span className="font-bold text-[#2D3250] block">WFH / Remote Policy & Wellness</span>
                          <p className="text-gray-600 text-[11px] leading-relaxed">
                            {policy.remote_work_policy || 'Hybrid'} &bull; {policy.wellness_stipend || 'Gym allowance'}
                          </p>
                        </div>
                      </div>

                      {/* Bonus & Allowances */}
                      <div className="pt-2.5 flex items-start gap-3">
                        <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <span className="font-bold text-[#2D3250] block">Annual Bonus & Commute</span>
                          <p className="text-gray-600 text-[11px] leading-relaxed">
                            Bonus: {policy.bonus_percentage || 'Target bonus'} &bull; Commute: {policy.travel_allowance || 'Included'}
                          </p>
                        </div>
                      </div>

                      {/* Tech Hardware & 401k */}
                      <div className="pt-2.5 flex items-start gap-3">
                        <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <span className="font-bold text-[#2D3250] block">Hardware Setup & Provident Fund</span>
                          <p className="text-gray-600 text-[11px] leading-relaxed line-clamp-1">
                            {policy.equipment_stipend || 'Company laptop'} &bull; Match: {policy.retirement_match || 'Standard match'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Perks Pills */}
                    {Array.isArray(policy.additional_perks) && policy.additional_perks.length > 0 && (
                      <div className="pt-2">
                        <span className="font-bold text-[#676F9D] text-[10px] uppercase tracking-wider block mb-2">
                          Tier Privileges & Highlights
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {policy.additional_perks.map((perk, pIdx) => (
                            <span
                              key={pIdx}
                              className="px-2.5 py-1 rounded-md bg-gray-100 text-[#2D3250] text-[10px] font-semibold"
                            >
                              &bull; {perk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">
                    Role Key: <code className="font-mono text-[#2D3250] font-bold">{policy.role_key}</code>
                  </span>
                  <Button
                    variant="accent"
                    size="sm"
                    icon={Edit3}
                    onClick={() => handleEditClick(policy)}
                    className="font-bold bg-[#FFB17A] text-[#2D3250] hover:bg-[#fca05f] shadow-xs cursor-pointer"
                  >
                    Edit Tier Benefits
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Table View */}
      {activeTab === 'table' && (
        <div className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#2D3250] text-white">
                <tr>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider w-48">
                    Benefit Category
                  </th>
                  {policies.map((p) => (
                    <th key={p.role_key} className="px-6 py-4 font-bold text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-sm font-extrabold text-[#FFB17A]">{p.role_key}</span>
                          <span className="text-[11px] text-gray-300 font-normal">{p.role_name}</span>
                        </div>
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          title={`Edit ${p.role_key} Policy`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50/80 bg-amber-50/30">
                  <td className="px-6 py-3.5 font-bold text-[#2D3250]">Total Paid Leaves</td>
                  {policies.map((p) => {
                    const total =
                      (Number(p.annual_leaves) || 0) +
                      (Number(p.sick_leaves) || 0) +
                      (Number(p.casual_leaves) || 0) +
                      (Number(p.emergency_leaves) || 0);
                    return (
                      <td key={p.role_key} className="px-6 py-3.5 font-extrabold text-amber-900 text-sm">
                        {total} Days / Year
                      </td>
                    );
                  })}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3 font-semibold text-gray-600">Annual Leave Quota</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3 font-bold text-[#2D3250]">
                      {p.annual_leaves} Days
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3 font-semibold text-gray-600">Sick Leave Quota</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3 font-bold text-[#2D3250]">
                      {p.sick_leaves} Days
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3 font-semibold text-gray-600">Casual Leave Quota</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3 font-bold text-[#2D3250]">
                      {p.casual_leaves} Days
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3 font-semibold text-gray-600">Emergency Leave</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3 font-bold text-[#2D3250]">
                      {p.emergency_leaves} Days
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3.5 font-bold text-[#2D3250]">Health Insurance</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3.5 text-gray-700 leading-snug">
                      {p.health_insurance || '-'}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3.5 font-bold text-[#2D3250]">Learning Budget</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3.5 text-gray-700 font-medium">
                      {p.learning_budget || '-'}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3.5 font-bold text-[#2D3250]">Wellness & Gym</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3.5 text-gray-700">
                      {p.wellness_stipend || '-'}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3.5 font-bold text-[#2D3250]">Remote Work / WFH</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3.5 text-gray-700">
                      {p.remote_work_policy || '-'}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3.5 font-bold text-[#2D3250]">Performance Bonus</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3.5 text-emerald-700 font-bold">
                      {p.bonus_percentage || '-'}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3.5 font-bold text-[#2D3250]">Commute Allowance</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3.5 text-gray-700">
                      {p.travel_allowance || '-'}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3.5 font-bold text-[#2D3250]">Hardware Setup</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3.5 text-gray-700">
                      {p.equipment_stipend || '-'}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3.5 font-bold text-[#2D3250]">Retirement 401(k) Match</td>
                  {policies.map((p) => (
                    <td key={p.role_key} className="px-6 py-3.5 text-[#2D3250] font-semibold">
                      {p.retirement_match || '-'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedPolicy && (
        <EditPolicyModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPolicy(null);
          }}
          policy={selectedPolicy}
          onSave={handleSave}
          loading={loading}
        />
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={async () => {
          setIsResetConfirmOpen(false);
          await onResetDefaults();
        }}
        title="Reset Benefits Policies to Defaults"
        message="Are you sure you want to restore all role benefits, leave quotas, and insurance policies to the factory corporate presets?"
        confirmText="Reset to Defaults"
        variant="danger"
        icon={RotateCcw}
      />
    </div>
  );
};
