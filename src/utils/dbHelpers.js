import { supabase } from '../supabaseClient';
import { PREDEFINED_DEPARTMENTS } from './constants';

// Active department table tracker
let activeDeptTable = 'Departments Table';

// ================= LOCAL STORAGE KEYS FOR BULLETPROOF DUAL-SYNC =================
const STORAGE_CUSTOM_DEPTS = 'elaris_custom_departments';
const STORAGE_DELETED_DEPTS = 'elaris_deleted_departments';

const STORAGE_CUSTOM_EMPLOYEES = 'elaris_custom_employees';
const STORAGE_DELETED_EMPLOYEES = 'elaris_deleted_employees';

const STORAGE_CUSTOM_ATTENDANCE = 'elaris_custom_attendance';
const STORAGE_DELETED_ATTENDANCE = 'elaris_deleted_attendance';

const STORAGE_CUSTOM_LEAVES = 'elaris_custom_leaves';
const STORAGE_DELETED_LEAVES = 'elaris_deleted_leaves';

const STORAGE_CUSTOM_PAYROLL = 'elaris_custom_payroll';
const STORAGE_DELETED_PAYROLL = 'elaris_deleted_payroll';

const STORAGE_CUSTOM_PAYSLIPS = 'elaris_custom_payslips';
const STORAGE_DELETED_PAYSLIPS = 'elaris_deleted_payslips';

const STORAGE_CUSTOM_ROLE_BENEFITS = 'elaris_custom_role_benefits';

// Predefined Corporate Role Benefits & Policies
export const DEFAULT_ROLE_BENEFITS = [
  {
    id: 1,
    role_key: 'Executive',
    role_name: 'Executive & Leadership Tier',
    annual_leaves: 30,
    sick_leaves: 15,
    casual_leaves: 10,
    emergency_leaves: 5,
    health_insurance: '$100,000 Global Premium Health Coverage (Full Employee, Spouse, Children & Parents Covered with 100% Inpatient/Outpatient/Dental/Vision)',
    wellness_stipend: '$150 / month ($1,800/yr) Premium Gym, Spa & Mental Wellness Allowance',
    learning_budget: '$3,000 / year Executive Leadership Coaching, Global Conferences & Certifications',
    remote_work_policy: '100% Remote / Hybrid Flexibility — Work from anywhere in the world',
    bonus_percentage: '25% - 35% of Annual Salary Executive Performance Bonus',
    travel_allowance: 'Executive Vehicle, Fuel Subsidy & Fully Reimbursed Business Travel',
    equipment_stipend: 'MacBook Pro M3 Max / High-End Workstation + Dual 4K Displays ($3,500 budget)',
    retirement_match: '10% Company 401(k) / Provident Fund Matching',
    additional_perks: [
      'ESOP Stock Options & Equity Grants',
      'First-Class Travel Lounge Access',
      'Annual VIP Full-Body Executive Health Checkup',
      'Unlimited Technical & Business Book Stipend',
      'Personal Executive Assistant Support',
      'Flexible Sabbatical Leave Eligibility',
    ],
    description: 'Top-tier comprehensive benefit suite for C-Suite, Vice Presidents, Directors, and Department Heads.',
  },
  {
    id: 2,
    role_key: 'Senior',
    role_name: 'Senior Level Tier',
    annual_leaves: 25,
    sick_leaves: 12,
    casual_leaves: 8,
    emergency_leaves: 4,
    health_insurance: '$50,000 Comprehensive Health Coverage (Employee + Immediate Family Covered, 90% Inpatient/Outpatient + Dental & Optical)',
    wellness_stipend: '$100 / month ($1,200/yr) Gym, Sports & Wellness Reimbursement',
    learning_budget: '$1,800 / year Professional Certifications, Courses (AWS, GCP, PMP) & Tech Summits',
    remote_work_policy: 'Up to 12 WFH Days / Month (Flexible Hybrid Schedule)',
    bonus_percentage: '15% - 20% of Annual Salary Performance Bonus',
    travel_allowance: '$250 / month Commute, Fuel & Client Meeting Travel Allowance',
    equipment_stipend: 'MacBook Pro M3 / Dell XPS 15 + 27-inch 4K Monitor ($2,200 hardware refresh every 2 years)',
    retirement_match: '7% Company Provident Fund / 401(k) Matching',
    additional_perks: [
      'Annual Ergonomic Home-Office Setup Stipend ($500)',
      'Tech Conference Sponsorship',
      'Annual Preventive Health Screening',
      'Priority Project Leadership & Tech Mentorship',
      'Paid Industry Certification Exam Fees',
    ],
    description: 'Premium benefits package for Senior Engineers, Tech Leads, Senior Designers, and Team Managers.',
  },
  {
    id: 3,
    role_key: 'Mid-Level',
    role_name: 'Mid-Level Specialist Tier',
    annual_leaves: 20,
    sick_leaves: 10,
    casual_leaves: 6,
    emergency_leaves: 3,
    health_insurance: '$25,000 Standard Health Insurance (Employee + Spouse Covered, 80% Inpatient/Outpatient)',
    wellness_stipend: '$60 / month ($720/yr) Fitness Club & Wellness Allowance',
    learning_budget: '$1,000 / year Online Courses & Skill Development (Coursera, Udemy, O’Reilly)',
    remote_work_policy: 'Up to 6 WFH Days / Month (Standard Hybrid Schedule)',
    bonus_percentage: '10% - 12% Annual Target Performance Bonus',
    travel_allowance: '$150 / month Public Transit & Commute Subsidy',
    equipment_stipend: 'MacBook Air M3 / Lenovo ThinkPad Professional ($1,500 standard setup)',
    retirement_match: '5% Company Provident Fund / 401(k) Matching',
    additional_perks: [
      'High-Speed Internet Monthly Reimbursement',
      'Team Lunch & Learning Stipends',
      'Annual Preventive Health Checkup',
      'Flexible Core Working Hours',
    ],
    description: 'Standard balanced benefits package for Software Engineers, UI/UX Designers, QA Specialists, and HR Officers.',
  },
  {
    id: 4,
    role_key: 'Junior',
    role_name: 'Junior & Entry-Level Tier',
    annual_leaves: 15,
    sick_leaves: 8,
    casual_leaves: 4,
    emergency_leaves: 2,
    health_insurance: '$12,000 Essential Hospitalization & Basic Outpatient Health Insurance (Employee Covered)',
    wellness_stipend: '$35 / month ($420/yr) Gym & Fitness Pass Discount',
    learning_budget: '$500 / year Learning Subscription & Technical Bootcamps',
    remote_work_policy: 'Up to 2 WFH Days / Month (Focus on in-office mentorship & peer pairing)',
    bonus_percentage: '5% - 7% Annual Performance & Learning Milestone Bonus',
    travel_allowance: '$80 / month Shared Transit & Commute Pass',
    equipment_stipend: 'Company-issued Standard Laptop (Dell Latitude / MacBook Air 13")',
    retirement_match: '3% Company Provident Fund / 401(k) Matching',
    additional_perks: [
      'Dedicated Senior Mentor Pairing',
      'Unlimited Premium Coffee & Snack Bar',
      'Annual Company Retreat & Sports Day',
      'Career Growth Acceleration Roadmap',
    ],
    description: 'Growth-focused baseline package designed for Junior Engineers, Associates, Interns, and Trainees.',
  },
];

// Default sample staff members covering all tiers: Executive, Senior, Mid-Level, Junior
export const DEFAULT_SAMPLE_EMPLOYEES = [
  { id: 1, full_name: 'Ahmed Khan', name: 'Ahmed Khan', email: 'ahmed.khan@elaris.com', phone: '+92 300 1234567', department: 'Software Development', designation: 'Senior Software Engineer', role_tier: 'Senior', salary: 180000 },
  { id: 2, full_name: 'Fatima Ali', name: 'Fatima Ali', email: 'fatima.ali@elaris.com', phone: '+92 321 7654321', department: 'HR', designation: 'HR Manager', role_tier: 'Senior', salary: 150000 },
  { id: 3, full_name: 'Zainab Tariq', name: 'Zainab Tariq', email: 'zainab.tariq@elaris.com', phone: '+92 333 9876543', department: 'UI/UX Design', designation: 'Senior UI/UX Designer', role_tier: 'Senior', salary: 140000 },
  { id: 4, full_name: 'Bilal Hassan', name: 'Bilal Hassan', email: 'bilal.hassan@elaris.com', phone: '+92 345 5432109', department: 'Quality Assurance', designation: 'QA Lead', role_tier: 'Senior', salary: 130000 },
  { id: 5, full_name: 'Hamza Malik', name: 'Hamza Malik', email: 'hamza.malik@elaris.com', phone: '+92 301 2345678', department: 'Software Development', designation: 'Software Engineer', role_tier: 'Mid-Level', salary: 95000 },
  { id: 6, full_name: 'Ayesha Noor', name: 'Ayesha Noor', email: 'ayesha.noor@elaris.com', phone: '+92 312 9876543', department: 'Software Development', designation: 'Junior Software Engineer', role_tier: 'Junior', salary: 55000 },
  { id: 7, full_name: 'Dr. Tariq Mehmood', name: 'Dr. Tariq Mehmood', email: 'tariq.mehmood@elaris.com', phone: '+92 322 1122334', department: 'Software Development', designation: 'Director of Software Engineering', role_tier: 'Executive', salary: 320000 },
];

export const DEFAULT_SAMPLE_LEAVES = [
  {
    id: 101,
    employee_id: 1,
    leave_type: 'Annual Leave',
    start_date: '2026-10-12',
    end_date: '2026-10-15',
    reason: 'Family vacation in northern valleys',
    status: 'Approved',
    head_approved: true,
    final_approved: true,
    created_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 102,
    employee_id: 1,
    leave_type: 'Sick Leave',
    start_date: '2026-09-04',
    end_date: '2026-09-05',
    reason: 'Seasonal viral flu and recovery',
    status: 'Approved',
    head_approved: true,
    final_approved: true,
    created_at: '2026-09-03T08:30:00Z',
  },
  {
    id: 103,
    employee_id: 1,
    leave_type: 'Annual Leave',
    start_date: '2026-11-20',
    end_date: '2026-11-22',
    reason: 'Attending cousin wedding in Lahore',
    status: 'Pending',
    head_approved: true,
    final_approved: false,
    created_at: '2026-11-05T14:20:00Z',
  },
  {
    id: 104,
    employee_id: 1,
    leave_type: 'Casual Leave',
    start_date: '2026-08-10',
    end_date: '2026-08-11',
    reason: 'Personal urgent errand during quarterly deployment',
    status: 'Rejected',
    head_approved: false,
    final_approved: false,
    created_at: '2026-08-08T09:15:00Z',
  },
  {
    id: 105,
    employee_id: 6,
    leave_type: 'Sick Leave',
    start_date: '2026-10-20',
    end_date: '2026-10-21',
    reason: 'Doctor consultation & wisdom tooth procedure',
    status: 'Approved',
    head_approved: true,
    final_approved: true,
    created_at: '2026-10-19T11:00:00Z',
  },
  {
    id: 106,
    employee_id: 6,
    leave_type: 'Annual Leave',
    start_date: '2026-12-01',
    end_date: '2026-12-03',
    reason: 'Semester break travel',
    status: 'Pending',
    head_approved: false,
    final_approved: false,
    created_at: '2026-11-08T16:00:00Z',
  },
  {
    id: 107,
    employee_id: 5,
    leave_type: 'Annual Leave',
    start_date: '2026-10-05',
    end_date: '2026-10-07',
    reason: 'Personal recreation and family time',
    status: 'Approved',
    head_approved: true,
    final_approved: true,
    created_at: '2026-09-28T09:00:00Z',
  },
];

// ----------------- GENERIC STORAGE HELPERS -----------------
const getStorageList = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStorageItem = (key, item) => {
  try {
    const current = getStorageList(key);
    const updated = [item, ...current.filter((x) => String(x.id) !== String(item.id))];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn(`Storage save notice for ${key}:`, e);
  }
};

const removeStorageItem = (key, id) => {
  try {
    const current = getStorageList(key);
    const filtered = current.filter((x) => String(x.id) !== String(id));
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {
    console.warn(`Storage remove notice for ${key}:`, e);
  }
};

const getDeletedSet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const addDeletedId = (key, id) => {
  if (!id) return;
  try {
    const set = getDeletedSet(key);
    set.add(String(id));
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn(`Storage delete tracking notice for ${key}:`, e);
  }
};

// ================= DEPARTMENT STORAGE HELPERS =================
const getCustomDepartments = () => getStorageList(STORAGE_CUSTOM_DEPTS);
const saveCustomDepartment = (dept) => saveStorageItem(STORAGE_CUSTOM_DEPTS, dept);
const removeCustomDepartment = (id, name) => {
  removeStorageItem(STORAGE_CUSTOM_DEPTS, id);
  if (name) {
    try {
      const current = getCustomDepartments();
      const filtered = current.filter(
        (d) => (d.department_name || d.name)?.trim().toLowerCase() !== name.trim().toLowerCase()
      );
      localStorage.setItem(STORAGE_CUSTOM_DEPTS, JSON.stringify(filtered));
    } catch (e) {}
  }
};
const getDeletedDepartmentNames = () => getDeletedSet(STORAGE_DELETED_DEPTS);
const addDeletedDepartmentName = (name) => {
  if (!name) return;
  try {
    const current = getDeletedDepartmentNames();
    current.add(name.trim().toLowerCase());
    localStorage.setItem(STORAGE_DELETED_DEPTS, JSON.stringify(Array.from(current)));
  } catch (e) {}
};

// ================= ATTENDANCE STORAGE HELPERS =================
const getCustomAttendance = () => getStorageList(STORAGE_CUSTOM_ATTENDANCE);
const saveCustomAttendance = (rec) => saveStorageItem(STORAGE_CUSTOM_ATTENDANCE, rec);
const removeCustomAttendance = (id) => removeStorageItem(STORAGE_CUSTOM_ATTENDANCE, id);
const getDeletedAttendanceIds = () => getDeletedSet(STORAGE_DELETED_ATTENDANCE);
const addDeletedAttendanceId = (id) => addDeletedId(STORAGE_DELETED_ATTENDANCE, id);

// ================= LEAVES STORAGE HELPERS =================
const getCustomLeaves = () => getStorageList(STORAGE_CUSTOM_LEAVES);
const saveCustomLeave = (rec) => saveStorageItem(STORAGE_CUSTOM_LEAVES, rec);
const removeCustomLeave = (id) => removeStorageItem(STORAGE_CUSTOM_LEAVES, id);
const getDeletedLeaveIds = () => getDeletedSet(STORAGE_DELETED_LEAVES);
const addDeletedLeaveId = (id) => addDeletedId(STORAGE_DELETED_LEAVES, id);

// ================= PAYROLL STORAGE HELPERS =================
const getCustomPayroll = () => getStorageList(STORAGE_CUSTOM_PAYROLL);
const saveCustomPayroll = (rec) => saveStorageItem(STORAGE_CUSTOM_PAYROLL, rec);
const removeCustomPayroll = (id) => removeStorageItem(STORAGE_CUSTOM_PAYROLL, id);
const getDeletedPayrollIds = () => getDeletedSet(STORAGE_DELETED_PAYROLL);
const addDeletedPayrollId = (id) => addDeletedId(STORAGE_DELETED_PAYROLL, id);

// ================= PAYSLIPS STORAGE HELPERS =================
const getCustomPayslips = () => getStorageList(STORAGE_CUSTOM_PAYSLIPS);
const saveCustomPayslip = (rec) => saveStorageItem(STORAGE_CUSTOM_PAYSLIPS, rec);
const removeCustomPayslip = (id) => removeStorageItem(STORAGE_CUSTOM_PAYSLIPS, id);
const getDeletedPayslipIds = () => getDeletedSet(STORAGE_DELETED_PAYSLIPS);
const addDeletedPayslipId = (id) => addDeletedId(STORAGE_DELETED_PAYSLIPS, id);

// ================= EMPLOYEE STORAGE HELPERS =================
const getCustomEmployees = () => getStorageList(STORAGE_CUSTOM_EMPLOYEES);
const saveCustomEmployee = (emp) => saveStorageItem(STORAGE_CUSTOM_EMPLOYEES, emp);
const removeCustomEmployee = (id) => removeStorageItem(STORAGE_CUSTOM_EMPLOYEES, id);
const getDeletedEmployeeIds = () => getDeletedSet(STORAGE_DELETED_EMPLOYEES);
const addDeletedEmployeeId = (id) => addDeletedId(STORAGE_DELETED_EMPLOYEES, id);


// ==============================================================================
// 1. DEPARTMENT OPERATIONS
// ==============================================================================

export const getDepartments = async () => {
  let fetchedData = [];
  const candidateTables = ['Departments Table', 'departments'];

  for (const table of candidateTables) {
    try {
      const resRel = await supabase
        .from(table)
        .select('*, head:head_employee_id(*)')
        .order('id', { ascending: true });

      if (!resRel.error && resRel.data && resRel.data.length > 0) {
        activeDeptTable = table;
        fetchedData = resRel.data;
        break;
      }

      const resSimple = await supabase
        .from(table)
        .select('*')
        .order('id', { ascending: true });

      if (!resSimple.error && resSimple.data && resSimple.data.length > 0) {
        activeDeptTable = table;
        fetchedData = resSimple.data;
        break;
      }
    } catch (e) {
      console.warn(`Query on ${table} note:`, e?.message || e);
    }
  }

  const normalizedFetched = fetchedData.map((d) => ({
    ...d,
    department_name: d.department_name || d.name || 'Department',
    name: d.name || d.department_name || 'Department',
  }));

  const customDepts = getCustomDepartments();
  const deletedSet = getDeletedDepartmentNames();

  const existingNames = new Set();
  const combinedList = [];

  normalizedFetched.forEach((d) => {
    const normName = (d.department_name || d.name || '').trim().toLowerCase();
    if (!deletedSet.has(normName) && !existingNames.has(normName)) {
      existingNames.add(normName);
      combinedList.push(d);
    }
  });

  customDepts.forEach((d) => {
    const normName = (d.department_name || d.name || '').trim().toLowerCase();
    if (!deletedSet.has(normName) && !existingNames.has(normName)) {
      existingNames.add(normName);
      combinedList.push(d);
    }
  });

  PREDEFINED_DEPARTMENTS.forEach((p, index) => {
    const pName = p.name.trim().toLowerCase();
    if (!existingNames.has(pName) && !deletedSet.has(pName)) {
      combinedList.push({
        id: `dept-${index + 1}`,
        department_name: p.name,
        name: p.name,
        description: p.description,
        is_predefined: true,
      });
      existingNames.add(pName);
    }
  });

  return combinedList;
};

export const seedPredefinedDepartments = async () => {
  const existing = await getDepartments();
  const existingNames = new Set(
    existing.map((d) => (d.department_name || d.name || '').trim().toLowerCase())
  );

  const missing = PREDEFINED_DEPARTMENTS.filter(
    (p) => !existingNames.has(p.name.trim().toLowerCase())
  );

  if (missing.length === 0) {
    return { count: 0, message: 'All 14 predefined departments already present in database' };
  }

  const rows = missing.map((d) => ({
    department_name: d.name,
    description: d.description,
  }));

  try {
    const res = await supabase.from(activeDeptTable).insert(rows).select();
    if (res.error) {
      rows.forEach((r, idx) => {
        saveCustomDepartment({
          id: `seeded-${idx + 1}-${Date.now()}`,
          department_name: r.department_name,
          name: r.department_name,
          description: r.description,
          is_predefined: true,
        });
      });
      return { count: rows.length, message: `Saved ${rows.length} departments locally (Sync notice: ${res.error.message})` };
    }
    return { count: res.data ? res.data.length : rows.length };
  } catch (err) {
    rows.forEach((r, idx) => {
      saveCustomDepartment({
        id: `seeded-${idx + 1}-${Date.now()}`,
        department_name: r.department_name,
        name: r.department_name,
        description: r.description,
        is_predefined: true,
      });
    });
    return { count: rows.length, message: `Saved ${rows.length} departments locally` };
  }
};

export const createDepartment = async (deptData) => {
  const name = (deptData.department_name || deptData.name || '').trim();
  const desc = deptData.description ? deptData.description.trim() : null;
  const headId = deptData.head_employee_id ? Number(deptData.head_employee_id) : null;

  if (!name) throw new Error('Department name is required');

  const newDept = {
    id: `local-dept-${Date.now()}`,
    department_name: name,
    name: name,
    description: desc,
    head_employee_id: headId,
  };

  saveCustomDepartment(newDept);

  try {
    const payload = {
      department_name: name,
      description: desc,
      ...(headId ? { head_employee_id: headId } : {}),
    };

    let res = await supabase.from(activeDeptTable).insert([payload]).select();

    if (res.error && res.error.message?.includes('head_employee_id')) {
      res = await supabase.from(activeDeptTable).insert([{ department_name: name, description: desc }]).select();
    }

    if (!res.error && res.data && res.data[0]) {
      const synced = { ...newDept, id: res.data[0].id };
      saveCustomDepartment(synced);
      return [synced];
    }
  } catch (err) {
    console.warn('Supabase department cloud insert notice:', err);
  }

  return [newDept];
};

export const updateDepartment = async (id, deptData) => {
  const numericId = Number(id);
  const targetId = isNaN(numericId) ? id : numericId;
  const nameVal = (deptData.department_name || deptData.name || '').trim();
  const descVal = deptData.description !== undefined ? (deptData.description ? deptData.description.trim() : null) : undefined;
  const headId = deptData.head_employee_id !== undefined ? (deptData.head_employee_id ? Number(deptData.head_employee_id) : null) : undefined;

  saveCustomDepartment({
    id: targetId,
    department_name: nameVal,
    name: nameVal,
    description: descVal,
    head_employee_id: headId,
  });

  if (!isNaN(numericId)) {
    try {
      const payload = {};
      if (nameVal) payload.department_name = nameVal;
      if (descVal !== undefined) payload.description = descVal;
      if (headId !== undefined) payload.head_employee_id = headId;

      let res = await supabase.from(activeDeptTable).update(payload).eq('id', targetId).select();
      if (res.error && res.error.message?.includes('head_employee_id')) {
        delete payload.head_employee_id;
        await supabase.from(activeDeptTable).update(payload).eq('id', targetId).select();
      }
    } catch (e) {
      console.warn('Supabase dept update notice:', e);
    }
  }

  return [{ id: targetId, department_name: nameVal, description: descVal }];
};

export const assignDepartmentHead = async (departmentId, headEmployeeId) => {
  return await updateDepartment(departmentId, {
    head_employee_id: headEmployeeId ? Number(headEmployeeId) : null,
  });
};

export const deleteDepartment = async (id, departmentName) => {
  const numericId = Number(id);
  const targetId = isNaN(numericId) ? id : numericId;

  if (departmentName) addDeletedDepartmentName(departmentName);
  removeCustomDepartment(targetId, departmentName);

  if (!isNaN(numericId)) {
    try {
      await supabase.from('employees').update({ department_id: null }).eq('department_id', numericId);
    } catch (e) {}

    try {
      await supabase.from(activeDeptTable).delete().eq('id', numericId);
    } catch (e) {
      console.warn('Supabase delete notice:', e);
    }
  }

  return true;
};


// Helper to intelligently detect an employee's role/seniority tier
export const detectRoleTier = (employee) => {
  if (!employee) return 'Mid-Level';
  if (employee.role_tier && ['Executive', 'Senior', 'Mid-Level', 'Junior'].includes(employee.role_tier)) {
    return employee.role_tier;
  }
  const designation = (employee.designation || employee.role || '').toLowerCase();

  if (
    designation.includes('director') ||
    designation.includes('vice president') ||
    designation.includes('vp') ||
    designation.includes('chief') ||
    designation.includes('head of') ||
    designation.includes('c-level') ||
    designation.includes('executive')
  ) {
    return 'Executive';
  }

  if (
    designation.includes('senior') ||
    designation.includes('lead') ||
    designation.includes('principal') ||
    designation.includes('architect') ||
    designation.includes('manager')
  ) {
    return 'Senior';
  }

  if (
    designation.includes('junior') ||
    designation.includes('associate') ||
    designation.includes('intern') ||
    designation.includes('trainee') ||
    designation.includes('assistant')
  ) {
    return 'Junior';
  }

  return 'Mid-Level';
};

// ==============================================================================
// 2. EMPLOYEE OPERATIONS
// ==============================================================================

export const getEmployees = async () => {
  let dbEmployees = [];
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      dbEmployees = data;
    }
  } catch (e) {
    console.warn('Employees query notice:', e);
  }

  const customEmployees = getCustomEmployees();
  const deletedSet = getDeletedEmployeeIds();

  const combined = [];
  const seenIds = new Set();
  const seenEmails = new Set();

  dbEmployees.forEach((emp) => {
    const idKey = String(emp.id);
    const emailKey = emp.email?.toLowerCase().trim();
    if (!deletedSet.has(idKey)) {
      seenIds.add(idKey);
      if (emailKey) seenEmails.add(emailKey);
      combined.push(emp);
    }
  });

  customEmployees.forEach((emp) => {
    const idKey = String(emp.id);
    const emailKey = emp.email?.toLowerCase().trim();
    if (!deletedSet.has(idKey) && !seenIds.has(idKey)) {
      seenIds.add(idKey);
      if (emailKey) seenEmails.add(emailKey);
      combined.push(emp);
    }
  });

  // If no employees exist anywhere, provide default sample staff so modules function immediately
  if (combined.length === 0) {
    DEFAULT_SAMPLE_EMPLOYEES.forEach((emp) => {
      const idKey = String(emp.id);
      if (!deletedSet.has(idKey)) {
        combined.push(emp);
      }
    });
  }

  // Ensure role_tier is present and consistent for every employee
  return combined.map((emp) => ({
    ...emp,
    role_tier: emp.role_tier || detectRoleTier(emp),
  }));
};

export const createEmployee = async (employeeData) => {
  let resolvedDeptId = employeeData.department_id ? Number(employeeData.department_id) : null;

  if ((!resolvedDeptId || isNaN(resolvedDeptId)) && employeeData.department) {
    try {
      const { data: deptMatch } = await supabase
        .from(activeDeptTable)
        .select('id')
        .ilike('department_name', employeeData.department.trim())
        .maybeSingle();

      if (deptMatch && deptMatch.id) {
        resolvedDeptId = Number(deptMatch.id);
      }
    } catch (e) {}
  }

  const fullNameStr = (employeeData.full_name || employeeData.name || '').trim();
  const resolvedRoleTier = employeeData.role_tier || detectRoleTier({
    designation: employeeData.designation,
    department: employeeData.department,
  });

  const localRecord = {
    id: `local-emp-${Date.now()}`,
    full_name: fullNameStr,
    name: fullNameStr,
    email: employeeData.email.trim(),
    phone: employeeData.phone?.trim() || null,
    department: employeeData.department?.trim() || null,
    department_id: resolvedDeptId && !isNaN(resolvedDeptId) ? resolvedDeptId : null,
    designation: employeeData.designation?.trim() || null,
    role_tier: resolvedRoleTier,
    salary: employeeData.salary ? Number(employeeData.salary) : 0,
    created_at: new Date().toISOString(),
  };

  saveCustomEmployee(localRecord);

  // Attempt Supabase insert
  try {
    const payload = {
      email: localRecord.email,
      phone: localRecord.phone,
      department: localRecord.department,
      department_id: localRecord.department_id,
      designation: localRecord.designation,
      role_tier: localRecord.role_tier,
      salary: localRecord.salary,
    };

    let res = null;
    if (fullNameStr) {
      res = await supabase.from('employees').insert([{ ...payload, full_name: fullNameStr }]).select();
      if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('role_tier'))) {
        const fallbackNoTier = { ...payload };
        delete fallbackNoTier.role_tier;
        res = await supabase.from('employees').insert([{ ...fallbackNoTier, full_name: fullNameStr }]).select();
      }
      if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('full_name'))) {
        res = await supabase.from('employees').insert([{ ...payload, name: fullNameStr }]).select();
      }
    }

    if (!res || res.error) {
      res = await supabase.from('employees').insert([payload]).select();
    }

    if (!res.error && res.data && res.data[0]) {
      const synced = { ...localRecord, id: res.data[0].id };
      saveCustomEmployee(synced);
      return [synced];
    }
  } catch (e) {
    console.warn('Supabase employee insert notice:', e);
  }

  return [localRecord];
};

export const updateEmployee = async (id, employeeData) => {
  const numericId = Number(id);
  const targetId = isNaN(numericId) ? id : numericId;
  const fullNameStr = (employeeData.full_name || employeeData.name || '').trim();
  const resolvedRoleTier = employeeData.role_tier || detectRoleTier({
    designation: employeeData.designation,
    department: employeeData.department,
  });

  const updatedRecord = {
    id: targetId,
    full_name: fullNameStr,
    name: fullNameStr,
    email: employeeData.email.trim(),
    phone: employeeData.phone?.trim() || null,
    department: employeeData.department?.trim() || null,
    department_id: employeeData.department_id ? Number(employeeData.department_id) : null,
    designation: employeeData.designation?.trim() || null,
    role_tier: resolvedRoleTier,
    salary: employeeData.salary ? Number(employeeData.salary) : 0,
  };

  saveCustomEmployee(updatedRecord);

  if (!isNaN(numericId)) {
    try {
      const payload = {
        email: updatedRecord.email,
        phone: updatedRecord.phone,
        department: updatedRecord.department,
        department_id: updatedRecord.department_id,
        designation: updatedRecord.designation,
        role_tier: updatedRecord.role_tier,
        salary: updatedRecord.salary,
      };

      let res = await supabase.from('employees').update({ ...payload, full_name: fullNameStr }).eq('id', targetId).select();
      if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('role_tier'))) {
        delete payload.role_tier;
        res = await supabase.from('employees').update({ ...payload, full_name: fullNameStr }).eq('id', targetId).select();
      }
      if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('full_name'))) {
        res = await supabase.from('employees').update({ ...payload, name: fullNameStr }).eq('id', targetId).select();
      }
      if (res && res.error) {
        await supabase.from('employees').update(payload).eq('id', targetId).select();
      }
    } catch (e) {
      console.warn('Supabase employee update notice:', e);
    }
  }

  return [updatedRecord];
};

export const deleteEmployee = async (id) => {
  const numericId = Number(id);
  const targetId = isNaN(numericId) ? id : numericId;

  addDeletedEmployeeId(targetId);
  removeCustomEmployee(targetId);

  // Unlink or cascade dependent records
  try {
    await supabase.from('attendance').delete().eq('employee_id', targetId);
  } catch (e) {}

  try {
    await supabase.from('leaves').delete().eq('employee_id', targetId);
  } catch (e) {}

  try {
    await supabase.from('payslips').delete().eq('employee_id', targetId);
  } catch (e) {}

  try {
    await supabase.from('payroll').delete().eq('employee_id', targetId);
  } catch (e) {}

  try {
    await supabase.from('Departments Table').update({ head_employee_id: null }).eq('head_employee_id', targetId);
    await supabase.from('departments').update({ head_employee_id: null }).eq('head_employee_id', targetId);
  } catch (e) {}

  if (!isNaN(numericId)) {
    try {
      await supabase.from('employees').delete().eq('id', targetId).select();
    } catch (e) {
      console.warn('Supabase employee delete notice:', e);
    }
  }

  return true;
};


// ==============================================================================
// 3. ATTENDANCE OPERATIONS
// ==============================================================================

export const getAttendanceRecords = async () => {
  let records = [];

  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, employees(*)')
      .order('attendance_date', { ascending: false });

    if (!error && data) {
      records = data;
    } else {
      const fallback = await supabase
        .from('attendance')
        .select('*')
        .order('attendance_date', { ascending: false });

      if (!fallback.error && fallback.data) {
        records = fallback.data;
      }
    }
  } catch (e) {
    console.warn('Supabase attendance fetch notice:', e);
  }

  const custom = getCustomAttendance();
  const deletedSet = getDeletedAttendanceIds();

  const combined = [];
  const seenIds = new Set();

  records.forEach((r) => {
    const idKey = String(r.id);
    if (!deletedSet.has(idKey)) {
      seenIds.add(idKey);
      combined.push({
        ...r,
        attendance_date: r.attendance_date || r.date,
      });
    }
  });

  custom.forEach((r) => {
    const idKey = String(r.id);
    if (!deletedSet.has(idKey) && !seenIds.has(idKey)) {
      seenIds.add(idKey);
      combined.push(r);
    }
  });

  return combined;
};

export const createAttendance = async (attendanceData) => {
  const rawId = attendanceData.employee_id;
  if (!rawId) {
    throw new Error('Please select an employee for attendance');
  }

  const numericId = Number(rawId);
  const resolvedEmpId = isNaN(numericId) ? rawId : numericId;

  const dateVal = attendanceData.attendance_date || new Date().toISOString().split('T')[0];
  const statusVal = attendanceData.status || 'Present';
  const inVal = attendanceData.check_in && attendanceData.check_in.trim() ? attendanceData.check_in.trim() : '09:00';
  const outVal = attendanceData.check_out && attendanceData.check_out.trim() ? attendanceData.check_out.trim() : '17:00';

  const localRecord = {
    id: Date.now(),
    employee_id: resolvedEmpId,
    attendance_date: dateVal,
    date: dateVal,
    status: statusVal,
    check_in: inVal,
    check_out: outVal,
    created_at: new Date().toISOString(),
  };

  saveCustomAttendance(localRecord);

  // Attempt Supabase cloud insertion
  try {
    const payload = {
      employee_id: resolvedEmpId,
      attendance_date: dateVal,
      status: statusVal,
      check_in: inVal,
      check_out: outVal,
    };

    let res = await supabase.from('attendance').insert([payload]).select();

    if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('check_in') || res.error.message?.includes('attendance_date'))) {
      const altPayload = {
        employee_id: resolvedEmpId,
        date: dateVal,
        status: statusVal,
      };
      res = await supabase.from('attendance').insert([altPayload]).select();
    }

    if (!res.error && res.data && res.data[0]) {
      const synced = { ...localRecord, id: res.data[0].id };
      saveCustomAttendance(synced);
      return [synced];
    }
  } catch (cloudErr) {
    console.warn('Supabase attendance cloud insert notice:', cloudErr);
  }

  return [localRecord];
};

export const updateAttendance = async (id, attendanceData) => {
  const targetId = id;
  const dateVal = attendanceData.attendance_date || attendanceData.date || new Date().toISOString().split('T')[0];
  const statusVal = attendanceData.status || 'Present';
  const inVal = attendanceData.check_in || '09:00';
  const outVal = attendanceData.check_out || '17:00';

  const updatedRecord = {
    id: targetId,
    employee_id: attendanceData.employee_id,
    attendance_date: dateVal,
    date: dateVal,
    status: statusVal,
    check_in: inVal,
    check_out: outVal,
  };

  saveCustomAttendance(updatedRecord);

  try {
    const payload = {
      status: statusVal,
      attendance_date: dateVal,
      check_in: inVal,
      check_out: outVal,
    };

    let res = await supabase.from('attendance').update(payload).eq('id', targetId).select();
    if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('check_in'))) {
      await supabase.from('attendance').update({ status: statusVal, attendance_date: dateVal }).eq('id', targetId).select();
    }
  } catch (e) {
    console.warn('Supabase attendance update notice:', e);
  }

  return [updatedRecord];
};

export const deleteAttendance = async (id) => {
  addDeletedAttendanceId(id);
  removeCustomAttendance(id);

  try {
    await supabase.from('attendance').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase attendance delete notice:', e);
  }

  return true;
};


// ==============================================================================
// 4. LEAVE OPERATIONS (TWO-LEVEL APPROVAL WORKFLOW)
// ==============================================================================

export const getLeaveRequests = async () => {
  let records = [];

  try {
    const { data, error } = await supabase
      .from('leaves')
      .select('*, employees(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      records = data;
    } else {
      const fallback = await supabase
        .from('leaves')
        .select('*')
        .order('created_at', { ascending: false });

      if (!fallback.error && fallback.data) {
        records = fallback.data;
      }
    }
  } catch (e) {
    console.warn('Leaves fetch notice:', e);
  }

  const custom = getCustomLeaves();
  const deletedSet = getDeletedLeaveIds();

  const combined = [];
  const seenIds = new Set();

  records.forEach((r) => {
    const idKey = String(r.id);
    if (!deletedSet.has(idKey)) {
      seenIds.add(idKey);
      combined.push(r);
    }
  });

  custom.forEach((r) => {
    const idKey = String(r.id);
    if (!deletedSet.has(idKey) && !seenIds.has(idKey)) {
      seenIds.add(idKey);
      combined.push(r);
    }
  });

  // Provide initial leave records for sample staff if database is unseeded
  if (combined.length === 0) {
    DEFAULT_SAMPLE_LEAVES.forEach((l) => {
      const idKey = String(l.id);
      if (!deletedSet.has(idKey)) {
        combined.push(l);
      }
    });
  }

  return combined;
};

export const createLeaveRequest = async (leaveData) => {
  const rawId = leaveData.employee_id;
  if (!rawId) {
    throw new Error('Please select an applicant employee');
  }

  const numericId = Number(rawId);
  const resolvedEmpId = isNaN(numericId) ? rawId : numericId;

  const localRecord = {
    id: Date.now(),
    employee_id: resolvedEmpId,
    leave_type: leaveData.leave_type || 'Annual Leave',
    start_date: leaveData.start_date,
    end_date: leaveData.end_date,
    reason: leaveData.reason || null,
    status: 'Pending',
    head_approved: false,
    final_approved: false,
    created_at: new Date().toISOString(),
  };

  saveCustomLeave(localRecord);

  // Attempt Supabase insert
  try {
    const fullPayload = {
      employee_id: resolvedEmpId,
      leave_type: leaveData.leave_type || 'Annual Leave',
      start_date: leaveData.start_date,
      end_date: leaveData.end_date,
      reason: leaveData.reason || null,
      status: 'Pending',
      head_approved: false,
      final_approved: false,
    };

    let res = await supabase.from('leaves').insert([fullPayload]).select();

    if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('head_approved') || res.error.message?.includes('final_approved'))) {
      const basicPayload = {
        employee_id: resolvedEmpId,
        leave_type: leaveData.leave_type || 'Annual Leave',
        start_date: leaveData.start_date,
        end_date: leaveData.end_date,
        reason: leaveData.reason || null,
        status: 'Pending',
      };
      res = await supabase.from('leaves').insert([basicPayload]).select();
    }

    if (!res.error && res.data && res.data[0]) {
      const synced = { ...localRecord, id: res.data[0].id };
      saveCustomLeave(synced);
      return [synced];
    }
  } catch (cloudErr) {
    console.warn('Supabase leave cloud insert notice:', cloudErr);
  }

  return [localRecord];
};

export const approveLeaveByDeptHead = async (id) => {
  const current = getCustomLeaves();
  const found = current.find((l) => String(l.id) === String(id));
  if (found) {
    saveCustomLeave({ ...found, head_approved: true, status: 'Pending' });
  }

  try {
    let res = await supabase
      .from('leaves')
      .update({ head_approved: true, status: 'Pending' })
      .eq('id', id)
      .select();

    if (res.error && (res.error.message?.includes('head_approved') || res.error.code === 'PGRST204')) {
      await supabase.from('leaves').update({ status: 'Approved' }).eq('id', id).select();
    }
  } catch (e) {
    console.warn('Supabase dept head approve notice:', e);
  }

  return true;
};

export const approveLeaveFinal = async (id) => {
  const current = getCustomLeaves();
  const found = current.find((l) => String(l.id) === String(id));
  if (found) {
    saveCustomLeave({ ...found, head_approved: true, final_approved: true, status: 'Approved' });
  }

  try {
    let res = await supabase
      .from('leaves')
      .update({ head_approved: true, final_approved: true, status: 'Approved' })
      .eq('id', id)
      .select();

    if (res.error && (res.error.message?.includes('final_approved') || res.error.code === 'PGRST204')) {
      await supabase.from('leaves').update({ status: 'Approved' }).eq('id', id).select();
    }
  } catch (e) {
    console.warn('Supabase final approve notice:', e);
  }

  return true;
};

export const rejectLeave = async (id, rejectedByRole = 'Approver') => {
  const current = getCustomLeaves();
  const found = current.find((l) => String(l.id) === String(id));
  if (found) {
    saveCustomLeave({ ...found, head_approved: false, final_approved: false, status: 'Rejected' });
  }

  try {
    let res = await supabase
      .from('leaves')
      .update({ head_approved: false, final_approved: false, status: 'Rejected' })
      .eq('id', id)
      .select();

    if (res.error && res.error.code === 'PGRST204') {
      await supabase.from('leaves').update({ status: 'Rejected' }).eq('id', id).select();
    }
  } catch (e) {
    console.warn('Supabase reject leave notice:', e);
  }

  return true;
};

export const updateLeaveStatus = async (id, status) => {
  const current = getCustomLeaves();
  const found = current.find((l) => String(l.id) === String(id));
  if (found) {
    saveCustomLeave({ ...found, status });
  }

  try {
    await supabase.from('leaves').update({ status }).eq('id', id);
  } catch (e) {}

  return true;
};

export const deleteLeaveRequest = async (id) => {
  addDeletedLeaveId(id);
  removeCustomLeave(id);

  try {
    await supabase.from('leaves').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase delete leave notice:', e);
  }

  return true;
};


// ==============================================================================
// 5. PAYROLL OPERATIONS
// ==============================================================================

export const getPayrollRecords = async () => {
  let records = [];

  try {
    const { data, error } = await supabase
      .from('payroll')
      .select('*, employees(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      records = data;
    } else {
      const fallback = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false });
      if (!fallback.error && fallback.data) records = fallback.data;
    }
  } catch (e) {
    console.warn('Payroll fetch notice:', e);
  }

  const custom = getCustomPayroll();
  const deletedSet = getDeletedPayrollIds();

  const combined = [];
  const seenIds = new Set();

  records.forEach((r) => {
    const idKey = String(r.id);
    if (!deletedSet.has(idKey)) {
      seenIds.add(idKey);
      combined.push(r);
    }
  });

  custom.forEach((r) => {
    const idKey = String(r.id);
    if (!deletedSet.has(idKey) && !seenIds.has(idKey)) {
      seenIds.add(idKey);
      combined.push(r);
    }
  });

  return combined;
};

export const createPayrollRecord = async (payrollData) => {
  const rawId = payrollData.employee_id;
  if (!rawId) {
    throw new Error('Please select an employee for payroll');
  }

  const numericId = Number(rawId);
  const resolvedEmpId = isNaN(numericId) ? rawId : numericId;

  const basic = Number(payrollData.basic_salary) || 0;
  const allowances = Number(payrollData.allowances) || 0;
  const bonus = Number(payrollData.bonus) || 0;
  const deductions = Number(payrollData.deductions) || 0;
  const net = basic + allowances + bonus - deductions;
  const payDate = payrollData.payment_date || new Date().toISOString().split('T')[0];
  const payStatus = payrollData.payment_status || 'Pending';

  const localRecord = {
    id: Date.now(),
    employee_id: resolvedEmpId,
    basic_salary: basic,
    allowances: allowances,
    bonus: bonus,
    deductions: deductions,
    net_salary: net,
    payment_date: payDate,
    payment_status: payStatus,
    created_at: new Date().toISOString(),
  };

  saveCustomPayroll(localRecord);

  // Automatically register companion payslip entry
  saveCustomPayslip({
    id: `SLIP-${localRecord.id}`,
    payroll_id: localRecord.id,
    employee_id: resolvedEmpId,
    created_at: new Date().toISOString(),
  });

  // Attempt Supabase insert
  try {
    const payload = {
      employee_id: resolvedEmpId,
      basic_salary: basic,
      allowances: allowances,
      bonus: bonus,
      deductions: deductions,
      net_salary: net,
      payment_date: payDate,
      payment_status: payStatus,
    };

    let res = await supabase.from('payroll').insert([payload]).select();

    if (res.error && res.error.code === 'PGRST204') {
      const basicPayload = {
        employee_id: resolvedEmpId,
        basic_salary: basic,
        net_salary: net,
        payment_date: payDate,
      };
      res = await supabase.from('payroll').insert([basicPayload]).select();
    }

    if (!res.error && res.data && res.data[0]) {
      const synced = { ...localRecord, id: res.data[0].id };
      saveCustomPayroll(synced);
      return [synced];
    }
  } catch (cloudErr) {
    console.warn('Supabase payroll cloud insert notice:', cloudErr);
  }

  return [localRecord];
};

export const updatePayrollRecord = async (id, payrollData) => {
  const targetId = id;
  const basic = Number(payrollData.basic_salary) || 0;
  const allowances = Number(payrollData.allowances) || 0;
  const bonus = Number(payrollData.bonus) || 0;
  const deductions = Number(payrollData.deductions) || 0;
  const net = basic + allowances + bonus - deductions;
  const payDate = payrollData.payment_date;
  const payStatus = payrollData.payment_status;

  const updatedRecord = {
    id: targetId,
    employee_id: payrollData.employee_id,
    basic_salary: basic,
    allowances: allowances,
    bonus: bonus,
    deductions: deductions,
    net_salary: net,
    payment_date: payDate,
    payment_status: payStatus,
  };

  saveCustomPayroll(updatedRecord);

  try {
    const payload = {
      basic_salary: basic,
      allowances: allowances,
      bonus: bonus,
      deductions: deductions,
      net_salary: net,
      payment_date: payDate,
      payment_status: payStatus,
    };

    await supabase.from('payroll').update(payload).eq('id', targetId).select();
  } catch (e) {
    console.warn('Supabase payroll update notice:', e);
  }

  return [updatedRecord];
};

export const deletePayrollRecord = async (id) => {
  addDeletedPayrollId(id);
  removeCustomPayroll(id);

  try {
    await supabase.from('payslips').delete().eq('payroll_id', id);
  } catch (e) {}

  try {
    await supabase.from('payroll').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase payroll delete notice:', e);
  }

  return true;
};


// ==============================================================================
// 6. PAYSLIP OPERATIONS
// ==============================================================================

export const getPayslipRecords = async () => {
  let records = [];

  try {
    const { data, error } = await supabase
      .from('payslips')
      .select('*, employees(*), payroll(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      records = data;
    } else {
      const fallback = await supabase
        .from('payslips')
        .select('*')
        .order('created_at', { ascending: false });
      if (!fallback.error && fallback.data) records = fallback.data;
    }
  } catch (e) {
    console.warn('Payslips fetch notice:', e);
  }

  const custom = getCustomPayslips();
  const deletedSet = getDeletedPayslipIds();

  const combined = [];
  const seenIds = new Set();

  records.forEach((r) => {
    const idKey = String(r.id);
    if (!deletedSet.has(idKey)) {
      seenIds.add(idKey);
      combined.push(r);
    }
  });

  custom.forEach((r) => {
    const idKey = String(r.id);
    if (!deletedSet.has(idKey) && !seenIds.has(idKey)) {
      seenIds.add(idKey);
      combined.push(r);
    }
  });

  return combined;
};

export const createPayslipRecord = async (payslipData) => {
  const localRecord = {
    id: `slip-${Date.now()}`,
    employee_id: payslipData.employee_id,
    payroll_id: payslipData.payroll_id,
    file_url: payslipData.file_url || null,
    created_at: new Date().toISOString(),
  };

  saveCustomPayslip(localRecord);

  try {
    const payload = {
      employee_id: Number(payslipData.employee_id),
      payroll_id: Number(payslipData.payroll_id),
      file_url: payslipData.file_url || null,
    };

    const { data } = await supabase.from('payslips').insert([payload]).select();
    if (data && data[0]) {
      const synced = { ...localRecord, id: data[0].id };
      saveCustomPayslip(synced);
      return [synced];
    }
  } catch (e) {
    console.warn('Supabase payslip insert notice:', e);
  }

  return [localRecord];
};

export const deletePayslipRecord = async (id, payrollId = null) => {
  if (id) {
    addDeletedPayslipId(id);
    removeCustomPayslip(id);
  }
  if (payrollId) {
    addDeletedPayslipId(payrollId);
    addDeletedPayrollId(payrollId);
    removeCustomPayroll(payrollId);
  }

  try {
    if (id && !String(id).startsWith('slip-') && !String(id).startsWith('payroll-')) {
      await supabase.from('payslips').delete().eq('id', id);
    }
  } catch (e) {
    console.warn('Supabase payslip delete notice:', e);
  }

  try {
    if (payrollId && !String(payrollId).startsWith('local-')) {
      await supabase.from('payslips').delete().eq('payroll_id', payrollId);
      await supabase.from('payroll').delete().eq('id', payrollId);
    }
  } catch (e) {
    console.warn('Supabase payroll/payslip cascade delete notice:', e);
  }

  return true;
};

// ==============================================================================
// 7. ROLE BENEFITS & LEAVE POLICIES (Configurable by HR)
// ==============================================================================

export const getCustomRoleBenefits = () => {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_ROLE_BENEFITS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveCustomRoleBenefits = (policies) => {
  try {
    localStorage.setItem(STORAGE_CUSTOM_ROLE_BENEFITS, JSON.stringify(policies));
  } catch (e) {
    console.warn('Storage save notice for role benefits:', e);
  }
};

export const getRoleBenefits = async () => {
  let dbPolicies = [];
  try {
    const { data, error } = await supabase
      .from('role_benefits')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data && data.length > 0) {
      dbPolicies = data;
    }
  } catch (err) {
    console.warn('Supabase role_benefits query notice:', err);
  }

  // Dual sync with local storage
  const localSaved = getCustomRoleBenefits();

  // If cloud data exists, merge with any local customizations
  if (dbPolicies.length > 0) {
    if (localSaved && Array.isArray(localSaved) && localSaved.length > 0) {
      const merged = dbPolicies.map((dbP) => {
        const override = localSaved.find((lp) => lp.role_key === dbP.role_key);
        return override ? { ...dbP, ...override } : dbP;
      });
      return merged;
    }
    return dbPolicies;
  }

  // Fallback: localSaved or DEFAULT_ROLE_BENEFITS
  if (localSaved && Array.isArray(localSaved) && localSaved.length > 0) {
    return localSaved;
  }

  return DEFAULT_ROLE_BENEFITS;
};

export const saveRoleBenefit = async (roleKey, updatedData) => {
  const allCurrent = await getRoleBenefits();
  const index = allCurrent.findIndex((p) => p.role_key === roleKey);

  const updatedPolicy = {
    ...(index >= 0 ? allCurrent[index] : {}),
    ...updatedData,
    role_key: roleKey,
    updated_at: new Date().toISOString(),
  };

  let newAll;
  if (index >= 0) {
    newAll = [...allCurrent];
    newAll[index] = updatedPolicy;
  } else {
    newAll = [...allCurrent, updatedPolicy];
  }

  saveCustomRoleBenefits(newAll);

  // Attempt Supabase upsert
  try {
    const payload = {
      role_key: updatedPolicy.role_key,
      role_name: updatedPolicy.role_name,
      annual_leaves: Number(updatedPolicy.annual_leaves) || 0,
      sick_leaves: Number(updatedPolicy.sick_leaves) || 0,
      casual_leaves: Number(updatedPolicy.casual_leaves) || 0,
      emergency_leaves: Number(updatedPolicy.emergency_leaves) || 0,
      health_insurance: updatedPolicy.health_insurance,
      wellness_stipend: updatedPolicy.wellness_stipend,
      learning_budget: updatedPolicy.learning_budget,
      remote_work_policy: updatedPolicy.remote_work_policy,
      bonus_percentage: updatedPolicy.bonus_percentage,
      travel_allowance: updatedPolicy.travel_allowance,
      equipment_stipend: updatedPolicy.equipment_stipend,
      retirement_match: updatedPolicy.retirement_match,
      additional_perks: updatedPolicy.additional_perks,
      description: updatedPolicy.description,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('role_benefits')
      .upsert(payload, { onConflict: 'role_key' })
      .select();

    if (!error && data && data[0]) {
      const synced = { ...updatedPolicy, id: data[0].id };
      const updatedIdx = newAll.findIndex((p) => p.role_key === roleKey);
      if (updatedIdx >= 0) {
        newAll[updatedIdx] = synced;
        saveCustomRoleBenefits(newAll);
      }
      return synced;
    }
  } catch (err) {
    console.warn('Supabase role_benefits upsert notice:', err);
  }

  return updatedPolicy;
};

export const resetRoleBenefitsToDefault = async () => {
  saveCustomRoleBenefits(DEFAULT_ROLE_BENEFITS);
  try {
    for (const pol of DEFAULT_ROLE_BENEFITS) {
      await supabase.from('role_benefits').upsert({
        role_key: pol.role_key,
        role_name: pol.role_name,
        annual_leaves: pol.annual_leaves,
        sick_leaves: pol.sick_leaves,
        casual_leaves: pol.casual_leaves,
        emergency_leaves: pol.emergency_leaves,
        health_insurance: pol.health_insurance,
        wellness_stipend: pol.wellness_stipend,
        learning_budget: pol.learning_budget,
        remote_work_policy: pol.remote_work_policy,
        bonus_percentage: pol.bonus_percentage,
        travel_allowance: pol.travel_allowance,
        equipment_stipend: pol.equipment_stipend,
        retirement_match: pol.retirement_match,
        additional_perks: pol.additional_perks,
        description: pol.description,
      }, { onConflict: 'role_key' });
    }
  } catch (e) {
    console.warn('Reset role benefits supabase warning:', e);
  }
  return DEFAULT_ROLE_BENEFITS;
};

// ==============================================================================
// 8. LEAVE CALCULATIONS & EMPLOYEE BENEFIT SUMMARY
// ==============================================================================

export const calculateLeaveDays = (startDate, endDate) => {
  if (!startDate) return 0;
  if (!endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return 1;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
};

export const calculateEmployeeLeavesSummary = (employeeId, allLeaves = [], rolePolicy = {}) => {
  const empIdStr = String(employeeId);
  const empLeaves = allLeaves.filter((l) => String(l.employee_id) === empIdStr);

  // Policy quotas
  const quotaAnnual = Number(rolePolicy?.annual_leaves) || 20;
  const quotaSick = Number(rolePolicy?.sick_leaves) || 10;
  const quotaCasual = Number(rolePolicy?.casual_leaves) || 6;
  const quotaEmergency = Number(rolePolicy?.emergency_leaves) || 3;
  const totalQuota = quotaAnnual + quotaSick + quotaCasual + quotaEmergency;

  // Breakdown of leaves
  let usedAnnual = 0;
  let usedSick = 0;
  let usedCasual = 0;
  let usedEmergency = 0;
  let usedOther = 0;

  const approvedLeaves = [];
  const pendingLeaves = [];
  const rejectedLeaves = [];

  empLeaves.forEach((leave) => {
    const days = calculateLeaveDays(leave.start_date, leave.end_date);
    const enrichedLeave = { ...leave, daysCount: days };

    if (leave.status === 'Approved') {
      approvedLeaves.push(enrichedLeave);
      const type = (leave.leave_type || '').toLowerCase();
      if (type.includes('annual')) usedAnnual += days;
      else if (type.includes('sick')) usedSick += days;
      else if (type.includes('casual')) usedCasual += days;
      else if (type.includes('emergency')) usedEmergency += days;
      else usedOther += days;
    } else if (leave.status === 'Pending') {
      pendingLeaves.push(enrichedLeave);
    } else if (leave.status === 'Rejected') {
      rejectedLeaves.push(enrichedLeave);
    }
  });

  const totalUsed = usedAnnual + usedSick + usedCasual + usedEmergency + usedOther;
  const remainingAnnual = Math.max(0, quotaAnnual - usedAnnual);
  const remainingSick = Math.max(0, quotaSick - usedSick);
  const remainingCasual = Math.max(0, quotaCasual - usedCasual);
  const remainingEmergency = Math.max(0, quotaEmergency - usedEmergency);
  const totalRemaining = Math.max(0, totalQuota - totalUsed);

  // Find last leave taken (most recent approved leave)
  const sortedApproved = [...approvedLeaves].sort(
    (a, b) => new Date(b.start_date || b.created_at) - new Date(a.start_date || a.created_at)
  );
  const lastApprovedLeave = sortedApproved[0] || null;

  let lastLeaveInfo = null;
  if (lastApprovedLeave) {
    const startDate = new Date(lastApprovedLeave.start_date);
    const today = new Date();
    const daysAgo = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    lastLeaveInfo = {
      ...lastApprovedLeave,
      daysAgo: daysAgo >= 0 ? daysAgo : 0,
    };
  }

  // All leaves sorted newest first
  const history = [...empLeaves].sort(
    (a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date)
  );

  return {
    quotas: {
      annual: quotaAnnual,
      sick: quotaSick,
      casual: quotaCasual,
      emergency: quotaEmergency,
      total: totalQuota,
    },
    used: {
      annual: usedAnnual,
      sick: usedSick,
      casual: usedCasual,
      emergency: usedEmergency,
      other: usedOther,
      total: totalUsed,
    },
    remaining: {
      annual: remainingAnnual,
      sick: remainingSick,
      casual: remainingCasual,
      emergency: remainingEmergency,
      total: totalRemaining,
    },
    counts: {
      total: empLeaves.length,
      approved: approvedLeaves.length,
      approvedDays: totalUsed,
      pending: pendingLeaves.length,
      pendingDays: pendingLeaves.reduce((acc, curr) => acc + (curr.daysCount || 1), 0),
      rejected: rejectedLeaves.length,
      rejectedDays: rejectedLeaves.reduce((acc, curr) => acc + (curr.daysCount || 1), 0),
    },
    lastLeave: lastLeaveInfo,
    history,
    approvedLeaves,
    pendingLeaves,
    rejectedLeaves,
  };
};

export { getDeletedPayslipIds, getDeletedPayrollIds };
