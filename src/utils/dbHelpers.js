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

// 4 default sample staff members so unseeded or fresh databases immediately have directory records
export const DEFAULT_SAMPLE_EMPLOYEES = [
  { id: 1, full_name: 'Ahmed Khan', name: 'Ahmed Khan', email: 'ahmed.khan@elaris.com', phone: '+92 300 1234567', department: 'Software Development', designation: 'Senior Software Engineer', salary: 180000 },
  { id: 2, full_name: 'Fatima Ali', name: 'Fatima Ali', email: 'fatima.ali@elaris.com', phone: '+92 321 7654321', department: 'HR', designation: 'HR Manager', salary: 150000 },
  { id: 3, full_name: 'Zainab Tariq', name: 'Zainab Tariq', email: 'zainab.tariq@elaris.com', phone: '+92 333 9876543', department: 'UI/UX Design', designation: 'Senior UI/UX Designer', salary: 140000 },
  { id: 4, full_name: 'Bilal Hassan', name: 'Bilal Hassan', email: 'bilal.hassan@elaris.com', phone: '+92 345 5432109', department: 'Quality Assurance', designation: 'QA Lead', salary: 130000 },
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

  return combined;
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

  const localRecord = {
    id: `local-emp-${Date.now()}`,
    full_name: fullNameStr,
    name: fullNameStr,
    email: employeeData.email.trim(),
    phone: employeeData.phone?.trim() || null,
    department: employeeData.department?.trim() || null,
    department_id: resolvedDeptId && !isNaN(resolvedDeptId) ? resolvedDeptId : null,
    designation: employeeData.designation?.trim() || null,
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
      salary: localRecord.salary,
    };

    let res = null;
    if (fullNameStr) {
      res = await supabase.from('employees').insert([{ ...payload, full_name: fullNameStr }]).select();
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

  const updatedRecord = {
    id: targetId,
    full_name: fullNameStr,
    name: fullNameStr,
    email: employeeData.email.trim(),
    phone: employeeData.phone?.trim() || null,
    department: employeeData.department?.trim() || null,
    department_id: employeeData.department_id ? Number(employeeData.department_id) : null,
    designation: employeeData.designation?.trim() || null,
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
        salary: updatedRecord.salary,
      };

      let res = await supabase.from('employees').update({ ...payload, full_name: fullNameStr }).eq('id', targetId).select();
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

export { getDeletedPayslipIds, getDeletedPayrollIds };
