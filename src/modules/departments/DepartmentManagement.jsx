import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  RefreshCw,
  FolderTree,
  UserCheck,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DepartmentModal } from './DepartmentModal';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getEmployees,
  seedPredefinedDepartments,
} from '../../utils/dbHelpers';
import { getEmployeeDisplayName } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalError, setModalError] = useState(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deleteDept, setDeleteDept] = useState(null);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptList, empList] = await Promise.all([
        getDepartments(),
        getEmployees(),
      ]);
      setDepartments(deptList || []);
      setEmployees(empList || []);
    } catch (err) {
      showToast(err.message || 'Error loading department data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveDepartment = async (formData) => {
    try {
      setActionLoading(true);
      setModalError(null);
      if (selectedDept) {
        await updateDepartment(selectedDept.id, formData);
        showToast('Department updated successfully!', 'success');
      } else {
        await createDepartment(formData);
        showToast('Department added successfully!', 'success');
      }
      setIsModalOpen(false);
      setSelectedDept(null);
      await loadData();
    } catch (err) {
      const errMsg = err.message || 'Failed to save department';
      setModalError(errMsg);
      showToast(errMsg, 'error');
      // Even if cloud sync failed, refresh data because it was saved locally
      await loadData();
      // If it was an RLS warning, close modal after short delay so user can see it added
      if (errMsg.includes('42501') || errMsg.includes('locally')) {
        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedDept(null);
        }, 1200);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deleteDept) return;
    try {
      setActionLoading(true);
      const name = deleteDept.department_name || deleteDept.name || '';
      await deleteDepartment(deleteDept.id, name);
      showToast(`Department "${name}" deleted permanently`, 'success');
      setDeleteDept(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete department', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedDepartments = async () => {
    try {
      setActionLoading(true);
      const res = await seedPredefinedDepartments();
      showToast(
        res.count > 0
          ? `Successfully seeded ${res.count} predefined departments to Supabase!`
          : res.message || 'Departments populated.',
        'success'
      );
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to seed departments', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDepts = departments.filter((d) => {
    const name = d.department_name || d.name || '';
    const desc = d.description || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate staff count per department
  const getStaffCount = (dept) => {
    const dName = (dept.department_name || dept.name || '').toLowerCase();
    return employees.filter(
      (e) =>
        e.department_id === dept.id ||
        (e.department && e.department.toLowerCase() === dName)
    ).length;
  };

  // Find Department Head employee details
  const getDepartmentHeadInfo = (dept) => {
    if (dept.head) return dept.head;
    if (dept.head_employee_id) {
      return employees.find((e) => String(e.id) === String(dept.head_employee_id));
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D3250] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#FFB17A]" />
            Department Management
          </h1>
          <p className="text-xs text-[#676F9D] mt-0.5">
            Organize business branches, divisions, and team structures with assigned Department Heads
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={Building2}
            onClick={handleSeedDepartments}
            loading={actionLoading}
            title="Seed standard 14 organizational departments"
          >
            Seed 14 Departments
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
            title="Refresh list"
          >
            Refresh
          </Button>

          <Button
            variant="accent"
            size="md"
            icon={Plus}
            onClick={() => {
              setModalError(null);
              setSelectedDept(null);
              setIsModalOpen(true);
            }}
            className="font-bold shadow-md"
          >
            Add Department
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#676F9D]" />
          <input
            type="text"
            placeholder="Search departments by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] pl-9 pr-4 py-2 text-sm text-[#2D3250] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB17A] focus:border-[#424769]"
          />
        </div>
        <span className="text-xs font-semibold text-[#676F9D]">
          Total: {filteredDepts.length} departments
        </span>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Loading organizational units..." />
      ) : filteredDepts.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-gray-100 space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-[#676F9D]">
            <FolderTree className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#2D3250]">No Departments Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchTerm
              ? 'No department matched your query.'
              : 'Add your first organization department or populate standard departments into your database.'}
          </p>
          {!searchTerm && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="accent"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setModalError(null);
                  setSelectedDept(null);
                  setIsModalOpen(true);
                }}
              >
                Add Department
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepts.map((dept) => {
            const count = getStaffCount(dept);
            const headInfo = getDepartmentHeadInfo(dept);
            const deptDisplayName = dept.department_name || dept.name || 'Unnamed Department';

            return (
              <div
                key={dept.id}
                className="group relative rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#676F9D]/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2D3250] text-[#FFB17A] shadow-xs">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModalError(null);
                          setSelectedDept(dept);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-[#676F9D] hover:text-[#2D3250] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Department & Head"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteDept(dept)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#2D3250] group-hover:text-[#424769] transition-colors">
                    {deptDisplayName}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {dept.description || 'No department overview provided.'}
                  </p>

                  {/* Department Head Section */}
                  <div className="mt-4 pt-3 border-t border-gray-100/80">
                    <div className="flex items-center gap-2">
                      <UserCheck className={`w-4 h-4 shrink-0 ${headInfo ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <div className="text-xs truncate">
                        <span className="text-[10px] uppercase font-bold text-[#676F9D] block">
                          Department Head
                        </span>
                        {headInfo ? (
                          <span className="font-bold text-[#2D3250] truncate block">
                            {getEmployeeDisplayName(headInfo)}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setModalError(null);
                              setSelectedDept(dept);
                              setIsModalOpen(true);
                            }}
                            className="text-amber-600 hover:underline font-semibold cursor-pointer text-[11px]"
                          >
                            + Assign Department Head
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#424769]">
                    <Users className="w-3.5 h-3.5 text-[#FFB17A]" />
                    <span>{count} staff {count === 1 ? 'member' : 'members'}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">
                    ID #{dept.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDept(null);
          setModalError(null);
        }}
        onSave={handleSaveDepartment}
        department={selectedDept}
        loading={actionLoading}
        error={modalError}
        clearError={() => setModalError(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDept}
        onClose={() => setDeleteDept(null)}
        onConfirm={handleDeleteDepartment}
        title="Delete Department"
        message={`Are you sure you want to permanently delete the "${deleteDept?.department_name || deleteDept?.name || 'selected'}" department? It will be removed from your database and system.`}
        confirmText="Yes, Delete"
        loading={actionLoading}
      />
    </div>
  );
};
