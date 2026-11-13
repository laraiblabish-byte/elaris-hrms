import { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  Award,
  HeartPulse,
  Briefcase,
  Calendar,
  Plus,
  X,
} from 'lucide-react';

export const EditPolicyModal = ({ isOpen, onClose, policy, onSave, loading }) => {
  const [formData, setFormData] = useState({
    role_key: '',
    role_name: '',
    annual_leaves: 20,
    sick_leaves: 10,
    casual_leaves: 6,
    emergency_leaves: 3,
    health_insurance: '',
    wellness_stipend: '',
    learning_budget: '',
    remote_work_policy: '',
    bonus_percentage: '',
    travel_allowance: '',
    equipment_stipend: '',
    retirement_match: '',
    description: '',
    additional_perks: [],
  });

  const [newPerkInput, setNewPerkInput] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (policy) {
      setFormData({
        role_key: policy.role_key || '',
        role_name: policy.role_name || '',
        annual_leaves: Number(policy.annual_leaves) || 0,
        sick_leaves: Number(policy.sick_leaves) || 0,
        casual_leaves: Number(policy.casual_leaves) || 0,
        emergency_leaves: Number(policy.emergency_leaves) || 0,
        health_insurance: policy.health_insurance || '',
        wellness_stipend: policy.wellness_stipend || '',
        learning_budget: policy.learning_budget || '',
        remote_work_policy: policy.remote_work_policy || '',
        bonus_percentage: policy.bonus_percentage || '',
        travel_allowance: policy.travel_allowance || '',
        equipment_stipend: policy.equipment_stipend || '',
        retirement_match: policy.retirement_match || '',
        description: policy.description || '',
        additional_perks: Array.isArray(policy.additional_perks) ? [...policy.additional_perks] : [],
      });
      setErrors({});
      setNewPerkInput('');
    }
  }, [policy, isOpen]);

  const handleAddPerk = (e) => {
    e?.preventDefault();
    const trimmed = newPerkInput.trim();
    if (!trimmed) return;
    if (!formData.additional_perks.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        additional_perks: [...prev.additional_perks, trimmed],
      }));
    }
    setNewPerkInput('');
  };

  const handleRemovePerk = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      additional_perks: prev.additional_perks.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.role_name.trim()) errs.role_name = 'Role tier name is required';
    if (formData.annual_leaves < 0) errs.annual_leaves = 'Must be non-negative';
    if (formData.sick_leaves < 0) errs.sick_leaves = 'Must be non-negative';
    if (formData.casual_leaves < 0) errs.casual_leaves = 'Must be non-negative';
    if (formData.emergency_leaves < 0) errs.emergency_leaves = 'Must be non-negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
      title={`Configure Benefits: ${formData.role_name || formData.role_key}`}
      subtitle="Changes directly update leave quotas and benefit allowances for all employees in this tier"
      size="lg"
      showClose={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tier Name & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tier Display Name"
            value={formData.role_name}
            onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
            placeholder="e.g. Senior Level Tier"
            error={errors.role_name}
            required
            icon={Award}
          />
          <div>
            <label className="block text-xs font-semibold text-[#2D3250] mb-1.5">
              Tier Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Benefits package for Senior Engineers & Tech Leads"
              className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2 text-sm text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
            />
          </div>
        </div>

        {/* Section 1: Leave Quotas (Allotted Annual Days) */}
        <div className="rounded-2xl bg-amber-50/50 border border-amber-200/70 p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#2D3250] font-bold text-sm">
            <Calendar className="w-4 h-4 text-[#FFB17A]" />
            <span>Annual Paid Leave Quotas (Days per Year)</span>
          </div>
          <p className="text-xs text-gray-500">
            Define the number of paid days allotted annually for employees in this role tier.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <Input
              label="Annual Leave"
              type="number"
              min="0"
              max="90"
              value={formData.annual_leaves}
              onChange={(e) => setFormData({ ...formData, annual_leaves: e.target.value })}
              error={errors.annual_leaves}
              required
            />
            <Input
              label="Sick Leave"
              type="number"
              min="0"
              max="90"
              value={formData.sick_leaves}
              onChange={(e) => setFormData({ ...formData, sick_leaves: e.target.value })}
              error={errors.sick_leaves}
              required
            />
            <Input
              label="Casual Leave"
              type="number"
              min="0"
              max="90"
              value={formData.casual_leaves}
              onChange={(e) => setFormData({ ...formData, casual_leaves: e.target.value })}
              error={errors.casual_leaves}
              required
            />
            <Input
              label="Emergency Leave"
              type="number"
              min="0"
              max="90"
              value={formData.emergency_leaves}
              onChange={(e) => setFormData({ ...formData, emergency_leaves: e.target.value })}
              error={errors.emergency_leaves}
              required
            />
          </div>
          <div className="text-right text-xs font-bold text-[#424769] pt-1">
            Total Allotted Leave Pool:{' '}
            <span className="text-[#2D3250] text-sm font-extrabold">
              {(Number(formData.annual_leaves) || 0) +
                (Number(formData.sick_leaves) || 0) +
                (Number(formData.casual_leaves) || 0) +
                (Number(formData.emergency_leaves) || 0)}{' '}
              Days / Year
            </span>
          </div>
        </div>

        {/* Section 2: Healthcare, Wellness & Learning */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#676F9D] flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
            Healthcare, Wellness & Education Allowances
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#2D3250] mb-1">
                Medical & Health Insurance Coverage
              </label>
              <textarea
                rows={2}
                value={formData.health_insurance}
                onChange={(e) => setFormData({ ...formData, health_insurance: e.target.value })}
                placeholder="e.g. $50,000 Comprehensive Coverage (Employee + Dependents, 90% Inpatient/Outpatient + Dental & Optical)"
                className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2 text-xs text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#2D3250] mb-1">
                  Wellness & Gym Stipend
                </label>
                <input
                  type="text"
                  value={formData.wellness_stipend}
                  onChange={(e) => setFormData({ ...formData, wellness_stipend: e.target.value })}
                  placeholder="e.g. $100 / month ($1,200/yr) Gym & Fitness"
                  className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2 text-xs text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D3250] mb-1">
                  Learning & Professional Development Budget
                </label>
                <input
                  type="text"
                  value={formData.learning_budget}
                  onChange={(e) => setFormData({ ...formData, learning_budget: e.target.value })}
                  placeholder="e.g. $1,800 / year Certifications & Courses"
                  className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2 text-xs text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Remote Work, Bonuses & Allowances */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#676F9D] flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#FFB17A]" />
            Work Flexibility, Bonuses & Hardware
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2D3250] mb-1">
                Remote Work / WFH Policy
              </label>
              <input
                type="text"
                value={formData.remote_work_policy}
                onChange={(e) => setFormData({ ...formData, remote_work_policy: e.target.value })}
                placeholder="e.g. Up to 12 WFH Days / Month (Flexible Hybrid)"
                className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2 text-xs text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D3250] mb-1">
                Annual Performance Bonus Eligibility
              </label>
              <input
                type="text"
                value={formData.bonus_percentage}
                onChange={(e) => setFormData({ ...formData, bonus_percentage: e.target.value })}
                placeholder="e.g. 15% - 20% of Annual Salary"
                className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2 text-xs text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D3250] mb-1">
                Commute & Travel Allowance
              </label>
              <input
                type="text"
                value={formData.travel_allowance}
                onChange={(e) => setFormData({ ...formData, travel_allowance: e.target.value })}
                placeholder="e.g. $250 / month Fuel & Commute Allowance"
                className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2 text-xs text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D3250] mb-1">
                Hardware & Tech Equipment Stipend
              </label>
              <input
                type="text"
                value={formData.equipment_stipend}
                onChange={(e) => setFormData({ ...formData, equipment_stipend: e.target.value })}
                placeholder="e.g. MacBook Pro M3 + 4K Display ($2,200 setup)"
                className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2 text-xs text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#2D3250] mb-1">
                Retirement & Provident Fund Company Match
              </label>
              <input
                type="text"
                value={formData.retirement_match}
                onChange={(e) => setFormData({ ...formData, retirement_match: e.target.value })}
                placeholder="e.g. 7% Company Provident Fund / 401(k) Match"
                className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2 text-xs text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Custom Perk Badges */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#676F9D]">
            Additional Corporate Perks & Badges
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPerkInput}
              onChange={(e) => setNewPerkInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPerk();
                }
              }}
              placeholder="Type perk and click Add (e.g. 'Free Coffee & Snacks', 'ESOP Stock Options')"
              className="flex-1 rounded-xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2 text-xs text-[#2D3250] focus:outline-none focus:ring-2 focus:ring-[#FFB17A]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleAddPerk}
            >
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {formData.additional_perks.map((perk, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold"
              >
                <span>{perk}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePerk(idx)}
                  className="text-indigo-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {formData.additional_perks.length === 0 && (
              <p className="text-xs text-gray-400 italic">No custom perks added yet.</p>
            )}
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            loading={loading}
            className="font-bold bg-[#FFB17A] text-[#2D3250] hover:bg-[#fca05f] shadow-md shadow-[#FFB17A]/25"
          >
            Save Policy Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
