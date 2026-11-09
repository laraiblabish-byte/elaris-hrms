import { supabase } from '../supabaseClient';
import { PREDEFINED_DEPARTMENTS } from './constants';

// Active department table tracker ('Departments Table' or 'departments')
let activeDeptTable = 'Departments Table';

/**
 * Detect the correct departments table name in Supabase
 */
export const detectDepartmentTable = async () => {
  const candidateTables = ['Departments Table', 'departments'];
  for (const table of candidateTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (!error) {
        activeDeptTable = table;
        return table;
      }
    } catch {
      // Continue to next candidate
    }
  }
  return activeDeptTable;
};

// ==============================================================================
// 1. DEPARTMENT OPERATIONS
// ==============================================================================

/**
 * Fetch all departments from Supabase
 */
export const getDepartments = async () => {
  await detectDepartmentTable();

  let data = null;
  let fetchError = null;

  // Try fetching with head employee join
  try {
    const res = await supabase
      .from(activeDeptTable)
      .select('*, head:head_employee_id(*)')
      .order('id', { ascending: true });

    if (!res.error && res.data) {
      data = res.data;
    } else {
      fetchError = res.error;
    }
  } catch (err) {
    fetchError = err;
  }

  // Fallback: fetch without relational join if join fails
  if (!data) {
    try {
      const resSimple = await supabase
        .from(activeDeptTable)
        .select('*')
        .order('id', { ascending: true });

      if (!resSimple.error && resSimple.data) {
        data = resSimple.data;
        fetchError = null;
      } else if (resSimple.error) {
        fetchError = resSimple.error;
      }
    } catch (err) {
      fetchError = err;
    }
  }

  if (fetchError && (!data || data.length === 0)) {
    console.warn(`Departments query note (${activeDeptTable}):`, fetchError.message || fetchError);
  }

  const rows = data || [];

  return rows.map((d) => ({
    ...d,
    department_name: d.department_name || d.name || 'Department',
    name: d.name || d.department_name || 'Department',
    head_employee_id: d.head_employee_id || null,
  }));
};

/**
 * Seed the 14 predefined organizational departments into Supabase
 */
export const seedPredefinedDepartments = async () => {
  await detectDepartmentTable();
  const existing = await getDepartments();
  const existingNames = new Set(
    existing.map((d) => (d.department_name || d.name || '').trim().toLowerCase())
  );

  const missing = PREDEFINED_DEPARTMENTS.filter(
    (p) => !existingNames.has(p.name.trim().toLowerCase())
  );

  if (missing.length === 0) {
    return { count: 0, message: 'All 14 predefined departments already exist in your database.' };
  }

  const rows = missing.map((d) => ({
    department_name: d.name,
    description: d.description,
  }));

  const { data, error } = await supabase.from(activeDeptTable).insert(rows).select();

  if (error) {
    throw new Error(`Failed to seed departments into "${activeDeptTable}": ${error.message}`);
  }

  return { count: data ? data.length : rows.length, message: `Successfully added ${rows.length} departments to Supabase.` };
};

/**
 * Create a new department in Supabase
 */
export const createDepartment = async (deptData) => {
  await detectDepartmentTable();
  const name = (deptData.department_name || deptData.name || '').trim();
  const desc = deptData.description ? deptData.description.trim() : null;
  const headId = deptData.head_employee_id ? Number(deptData.head_employee_id) : null;

  if (!name) throw new Error('Department name is required');

  const payload = {
    department_name: name,
    description: desc,
    ...(headId && !isNaN(headId) ? { head_employee_id: headId } : {}),
  };

  let res = await supabase.from(activeDeptTable).insert([payload]).select();

  // If head_employee_id column is missing in DB schema, retry without it
  if (res.error && res.error.message?.includes('head_employee_id')) {
    res = await supabase
      .from(activeDeptTable)
      .insert([{ department_name: name, description: desc }])
      .select();
  }

  // If department_name column is missing, retry with 'name' column
  if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('department_name'))) {
    res = await supabase
      .from(activeDeptTable)
      .insert([{ name: name, description: desc }])
      .select();
  }

  if (res.error) {
    throw new Error(`Failed to create department: ${res.error.message} (${res.error.code || ''})`);
  }

  return res.data;
};

/**
 * Update an existing department in Supabase
 */
export const updateDepartment = async (id, deptData) => {
  await detectDepartmentTable();
  const numericId = Number(id);
  const targetId = isNaN(numericId) ? id : numericId;
  const nameVal = (deptData.department_name || deptData.name || '').trim();
  const descVal = deptData.description !== undefined ? (deptData.description ? deptData.description.trim() : null) : undefined;
  const headId = deptData.head_employee_id !== undefined ? (deptData.head_employee_id ? Number(deptData.head_employee_id) : null) : undefined;

  const payload = {};
  if (nameVal) payload.department_name = nameVal;
  if (descVal !== undefined) payload.description = descVal;
  if (headId !== undefined) payload.head_employee_id = headId;

  let res = await supabase.from(activeDeptTable).update(payload).eq('id', targetId).select();

  // If head_employee_id column is missing in DB schema, retry without it
  if (res.error && res.error.message?.includes('head_employee_id')) {
    delete payload.head_employee_id;
    res = await supabase.from(activeDeptTable).update(payload).eq('id', targetId).select();
  }

  // If department_name column is missing, retry with 'name' column
  if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('department_name'))) {
    const altPayload = { ...payload };
    delete altPayload.department_name;
    if (nameVal) altPayload.name = nameVal;
    res = await supabase.from(activeDeptTable).update(altPayload).eq('id', targetId).select();
  }

  if (res.error) {
    throw new Error(`Failed to update department: ${res.error.message}`);
  }

  return res.data;
};

/**
 * Assign an employee as Department Head
 */
export const assignDepartmentHead = async (departmentId, headEmployeeId) => {
  return await updateDepartment(departmentId, {
    head_employee_id: headEmployeeId ? Number(headEmployeeId) : null,
  });
};

/**
 * Delete a department in Supabase
 */
export const deleteDepartment = async (id) => {
  await detectDepartmentTable();
  const numericId = Number(id);
  const targetId = isNaN(numericId) ? id : numericId;

  // Unlink employees assigned to this department
  try {
    await supabase.from('employees').update({ department_id: null }).eq('department_id', targetId);
  } catch (err) {
    console.warn('Unlink employees on department delete notice:', err);
  }

  const { error } = await supabase.from(activeDeptTable).delete().eq('id', targetId);

  if (error) {
    throw new Error(`Failed to delete department: ${error.message}`);
  }

  return true;
};


// ==============================================================================
// 2. EMPLOYEE OPERATIONS
// ==============================================================================

/**
 * Fetch all employees from Supabase.
 * Strictly uses real records from database. NO fake data.
 */
export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.warn('Employees query error from Supabase:', error.message);
    throw new Error(`Failed to load employees from Supabase: ${error.message}`);
  }

  // Normalize column aliases (full_name vs name)
  return (data || []).map((emp) => ({
    ...emp,
    full_name: emp.full_name || emp.name || '',
    name: emp.name || emp.full_name || '',
    salary: emp.salary !== null && emp.salary !== undefined ? Number(emp.salary) : 0,
  }));
};

/**
 * Create a new employee in Supabase
 */
export const createEmployee = async (employeeData) => {
  let resolvedDeptId = employeeData.department_id ? Number(employeeData.department_id) : null;

  // If department name was provided without department_id, look up the ID
  if ((!resolvedDeptId || isNaN(resolvedDeptId)) && employeeData.department) {
    try {
      await detectDepartmentTable();
      const { data: deptMatch } = await supabase
        .from(activeDeptTable)
        .select('id')
        .ilike('department_name', employeeData.department.trim())
        .maybeSingle();

      if (deptMatch && deptMatch.id) {
        resolvedDeptId = Number(deptMatch.id);
      }
    } catch {
      // Continue without department_id
    }
  }

  const fullNameStr = (employeeData.full_name || employeeData.name || '').trim();
  if (!fullNameStr) {
    throw new Error('Employee full name is required');
  }
  if (!employeeData.email || !employeeData.email.trim()) {
    throw new Error('Employee email address is required');
  }

  const payload = {
    email: employeeData.email.trim(),
    phone: employeeData.phone?.trim() || null,
    department: employeeData.department?.trim() || null,
    department_id: resolvedDeptId && !isNaN(resolvedDeptId) ? resolvedDeptId : null,
    designation: employeeData.designation?.trim() || null,
    salary: employeeData.salary ? Number(employeeData.salary) : 0,
  };

  // Attempt insert with full_name first, then fallback to name if column differs
  let res = await supabase.from('employees').insert([{ ...payload, full_name: fullNameStr }]).select();

  if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('full_name'))) {
    res = await supabase.from('employees').insert([{ ...payload, name: fullNameStr }]).select();
  }

  // If department_id fails because column or foreign key is absent, retry without it
  if (res.error && res.error.message?.includes('department_id')) {
    delete payload.department_id;
    res = await supabase.from('employees').insert([{ ...payload, full_name: fullNameStr }]).select();
    if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('full_name'))) {
      res = await supabase.from('employees').insert([{ ...payload, name: fullNameStr }]).select();
    }
  }

  if (res.error) {
    if (res.error.code === '23505' || res.error.message?.includes('unique constraint') || res.error.message?.includes('duplicate key')) {
      throw new Error(`An employee with email "${employeeData.email}" already exists.`);
    }
    throw new Error(`Failed to create employee in database: ${res.error.message}`);
  }

  return res.data;
};

/**
 * Update an employee in Supabase
 */
export const updateEmployee = async (id, employeeData) => {
  const numericId = Number(id);
  const targetId = isNaN(numericId) ? id : numericId;
  const fullNameStr = (employeeData.full_name || employeeData.name || '').trim();

  const payload = {
    email: employeeData.email?.trim(),
    phone: employeeData.phone?.trim() || null,
    department: employeeData.department?.trim() || null,
    department_id: employeeData.department_id ? Number(employeeData.department_id) : null,
    designation: employeeData.designation?.trim() || null,
    salary: employeeData.salary ? Number(employeeData.salary) : 0,
  };

  let res = await supabase.from('employees').update({ ...payload, full_name: fullNameStr }).eq('id', targetId).select();

  if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('full_name'))) {
    res = await supabase.from('employees').update({ ...payload, name: fullNameStr }).eq('id', targetId).select();
  }

  if (res.error && res.error.message?.includes('department_id')) {
    delete payload.department_id;
    res = await supabase.from('employees').update({ ...payload, full_name: fullNameStr }).eq('id', targetId).select();
    if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('full_name'))) {
      res = await supabase.from('employees').update({ ...payload, name: fullNameStr }).eq('id', targetId).select();
    }
  }

  if (res.error) {
    throw new Error(`Failed to update employee in database: ${res.error.message}`);
  }

  return res.data;
};

/**
 * Delete an employee from Supabase and cascade dependent records
 */
export const deleteEmployee = async (id) => {
  const numericId = Number(id);
  const targetId = isNaN(numericId) ? id : numericId;

  // Cascade dependent records
  try {
    await supabase.from('attendance').delete().eq('employee_id', targetId);
    await supabase.from('leaves').delete().eq('employee_id', targetId);
    await supabase.from('payslips').delete().eq('employee_id', targetId);
    await supabase.from('payroll').delete().eq('employee_id', targetId);
    await supabase.from('Departments Table').update({ head_employee_id: null }).eq('head_employee_id', targetId);
    await supabase.from('departments').update({ head_employee_id: null }).eq('head_employee_id', targetId);
  } catch (cascadeErr) {
    console.warn('Cascade delete note:', cascadeErr);
  }

  const { error } = await supabase.from('employees').delete().eq('id', targetId);

  if (error) {
    throw new Error(`Failed to delete employee from database: ${error.message}`);
  }

  return true;
};


// ==============================================================================
// 3. ATTENDANCE OPERATIONS
// ==============================================================================

/**
 * Fetch attendance logs from Supabase
 */
export const getAttendanceRecords = async () => {
  let records = [];
  let error = null;

  try {
    const res = await supabase
      .from('attendance')
      .select('*, employees(*)')
      .order('attendance_date', { ascending: false });

    if (!res.error && res.data) {
      records = res.data;
    } else {
      error = res.error;
    }
  } catch (err) {
    error = err;
  }

  // Fallback: fetch without relational join if join fails
  if (records.length === 0) {
    try {
      const resFallback = await supabase
        .from('attendance')
        .select('*')
        .order('id', { ascending: false });

      if (!resFallback.error && resFallback.data) {
        records = resFallback.data;
        error = null;

        // Perform in-memory join with employees
        try {
          const { data: emps } = await supabase.from('employees').select('*');
          if (emps) {
            const empMap = new Map(emps.map((e) => [String(e.id), e]));
            records = records.map((r) => ({
              ...r,
              employees: empMap.get(String(r.employee_id)) || null,
            }));
          }
        } catch {
          // Keep raw records
        }
      }
    } catch (fallbackErr) {
      error = fallbackErr;
    }
  }

  if (error && records.length === 0) {
    console.warn('Attendance query note:', error.message || error);
  }

  return records.map((r) => ({
    ...r,
    attendance_date: r.attendance_date || r.date || '',
    date: r.date || r.attendance_date || '',
  }));
};

/**
 * Log employee attendance in Supabase
 */
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

  const payload = {
    employee_id: resolvedEmpId,
    attendance_date: dateVal,
    status: statusVal,
    check_in: inVal,
    check_out: outVal,
  };

  let res = await supabase.from('attendance').insert([payload]).select();

  // Retry with 'date' column if attendance_date column is absent
  if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('attendance_date') || res.error.message?.includes('check_in'))) {
    const altPayload = {
      employee_id: resolvedEmpId,
      date: dateVal,
      status: statusVal,
    };
    res = await supabase.from('attendance').insert([altPayload]).select();
  }

  if (res.error) {
    throw new Error(`Failed to record attendance: ${res.error.message}`);
  }

  return res.data;
};

/**
 * Update an attendance record in Supabase
 */
export const updateAttendance = async (id, attendanceData) => {
  const dateVal = attendanceData.attendance_date || attendanceData.date || new Date().toISOString().split('T')[0];
  const statusVal = attendanceData.status || 'Present';
  const inVal = attendanceData.check_in || '09:00';
  const outVal = attendanceData.check_out || '17:00';

  const payload = {
    status: statusVal,
    attendance_date: dateVal,
    check_in: inVal,
    check_out: outVal,
  };

  let res = await supabase.from('attendance').update(payload).eq('id', id).select();

  if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('attendance_date') || res.error.message?.includes('check_in'))) {
    res = await supabase
      .from('attendance')
      .update({ status: statusVal, date: dateVal })
      .eq('id', id)
      .select();
  }

  if (res.error) {
    throw new Error(`Failed to update attendance: ${res.error.message}`);
  }

  return res.data;
};

/**
 * Delete an attendance record from Supabase
 */
export const deleteAttendance = async (id) => {
  const { error } = await supabase.from('attendance').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete attendance record: ${error.message}`);
  }
  return true;
};


// ==============================================================================
// 4. LEAVE OPERATIONS (TWO-LEVEL APPROVAL WORKFLOW)
// ==============================================================================

/**
 * Fetch all leave applications from Supabase
 */
export const getLeaveRequests = async () => {
  let records = [];
  let error = null;

  try {
    const res = await supabase
      .from('leaves')
      .select('*, employees(*)')
      .order('created_at', { ascending: false });

    if (!res.error && res.data) {
      records = res.data;
    } else {
      error = res.error;
    }
  } catch (err) {
    error = err;
  }

  // Fallback: in-memory join if relational query is blocked
  if (records.length === 0) {
    try {
      const resFallback = await supabase
        .from('leaves')
        .select('*')
        .order('id', { ascending: false });

      if (!resFallback.error && resFallback.data) {
        records = resFallback.data;
        error = null;

        try {
          const { data: emps } = await supabase.from('employees').select('*');
          if (emps) {
            const empMap = new Map(emps.map((e) => [String(e.id), e]));
            records = records.map((r) => ({
              ...r,
              employees: empMap.get(String(r.employee_id)) || null,
            }));
          }
        } catch {
          // Keep raw records
        }
      }
    } catch (fallbackErr) {
      error = fallbackErr;
    }
  }

  if (error && records.length === 0) {
    console.warn('Leaves query note:', error.message || error);
  }

  return records;
};

/**
 * Submit a leave application in Supabase
 */
export const createLeaveRequest = async (leaveData) => {
  const rawId = leaveData.employee_id;
  if (!rawId) {
    throw new Error('Please select an applicant employee');
  }

  const numericId = Number(rawId);
  const resolvedEmpId = isNaN(numericId) ? rawId : numericId;

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

  // Retry without two-level approval columns if columns are missing
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

  if (res.error) {
    throw new Error(`Failed to submit leave application: ${res.error.message}`);
  }

  return res.data;
};

/**
 * Stage 1: Department Head Approval
 */
export const approveLeaveByDeptHead = async (id) => {
  let res = await supabase
    .from('leaves')
    .update({
      head_approved: true,
      status: 'Pending',
      head_action_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select();

  if (res.error && (res.error.message?.includes('head_approved') || res.error.code === 'PGRST204')) {
    res = await supabase.from('leaves').update({ status: 'Approved' }).eq('id', id).select();
  }

  if (res.error) {
    throw new Error(`Failed to approve leave: ${res.error.message}`);
  }

  return true;
};

/**
 * Stage 2: Final HR / Management Approval
 */
export const approveLeaveFinal = async (id) => {
  let res = await supabase
    .from('leaves')
    .update({
      head_approved: true,
      final_approved: true,
      status: 'Approved',
      final_action_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select();

  if (res.error && (res.error.message?.includes('final_approved') || res.error.code === 'PGRST204')) {
    res = await supabase.from('leaves').update({ status: 'Approved' }).eq('id', id).select();
  }

  if (res.error) {
    throw new Error(`Failed to grant final leave approval: ${res.error.message}`);
  }

  return true;
};

/**
 * Reject leave application
 */
export const rejectLeave = async (id) => {
  let res = await supabase
    .from('leaves')
    .update({
      head_approved: false,
      final_approved: false,
      status: 'Rejected',
    })
    .eq('id', id)
    .select();

  if (res.error && res.error.code === 'PGRST204') {
    res = await supabase.from('leaves').update({ status: 'Rejected' }).eq('id', id).select();
  }

  if (res.error) {
    throw new Error(`Failed to reject leave: ${res.error.message}`);
  }

  return true;
};

/**
 * Quick status update helper
 */
export const updateLeaveStatus = async (id, status) => {
  const { error } = await supabase.from('leaves').update({ status }).eq('id', id);
  if (error) {
    throw new Error(`Failed to update leave status: ${error.message}`);
  }
  return true;
};

/**
 * Delete leave application from Supabase
 */
export const deleteLeaveRequest = async (id) => {
  const { error } = await supabase.from('leaves').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete leave application: ${error.message}`);
  }
  return true;
};


// ==============================================================================
// 5. PAYROLL OPERATIONS
// ==============================================================================

/**
 * Fetch payroll records from Supabase
 */
export const getPayrollRecords = async () => {
  let records = [];
  let error = null;

  try {
    const res = await supabase
      .from('payroll')
      .select('*, employees(*)')
      .order('created_at', { ascending: false });

    if (!res.error && res.data) {
      records = res.data;
    } else {
      error = res.error;
    }
  } catch (err) {
    error = err;
  }

  // Fallback: in-memory join
  if (records.length === 0) {
    try {
      const resFallback = await supabase
        .from('payroll')
        .select('*')
        .order('id', { ascending: false });

      if (!resFallback.error && resFallback.data) {
        records = resFallback.data;
        error = null;

        try {
          const { data: emps } = await supabase.from('employees').select('*');
          if (emps) {
            const empMap = new Map(emps.map((e) => [String(e.id), e]));
            records = records.map((r) => ({
              ...r,
              employees: empMap.get(String(r.employee_id)) || null,
            }));
          }
        } catch {
          // Keep raw records
        }
      }
    } catch (fallbackErr) {
      error = fallbackErr;
    }
  }

  if (error && records.length === 0) {
    console.warn('Payroll query note:', error.message || error);
  }

  return records;
};

/**
 * Create a payroll transaction in Supabase
 */
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

  // Retry with basic fields if allowances/bonus/deductions columns are missing
  if (res.error && res.error.code === 'PGRST204') {
    const basicPayload = {
      employee_id: resolvedEmpId,
      basic_salary: basic,
      net_salary: net,
      payment_date: payDate,
    };
    res = await supabase.from('payroll').insert([basicPayload]).select();
  }

  if (res.error) {
    throw new Error(`Failed to process payroll: ${res.error.message}`);
  }

  return res.data;
};

/**
 * Update a payroll record in Supabase
 */
export const updatePayrollRecord = async (id, payrollData) => {
  const basic = Number(payrollData.basic_salary) || 0;
  const allowances = Number(payrollData.allowances) || 0;
  const bonus = Number(payrollData.bonus) || 0;
  const deductions = Number(payrollData.deductions) || 0;
  const net = basic + allowances + bonus - deductions;
  const payDate = payrollData.payment_date;
  const payStatus = payrollData.payment_status;

  const payload = {
    basic_salary: basic,
    allowances: allowances,
    bonus: bonus,
    deductions: deductions,
    net_salary: net,
    ...(payDate ? { payment_date: payDate } : {}),
    ...(payStatus ? { payment_status: payStatus } : {}),
  };

  const { data, error } = await supabase.from('payroll').update(payload).eq('id', id).select();

  if (error) {
    throw new Error(`Failed to update payroll record: ${error.message}`);
  }

  return data;
};

/**
 * Delete a payroll record and cascade linked payslip from Supabase
 */
export const deletePayrollRecord = async (id) => {
  try {
    await supabase.from('payslips').delete().eq('payroll_id', id);
  } catch (e) {
    console.warn('Linked payslip deletion notice:', e);
  }

  const { error } = await supabase.from('payroll').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete payroll record: ${error.message}`);
  }

  return true;
};


// ==============================================================================
// 6. PAYSLIP OPERATIONS
// ==============================================================================

/**
 * Fetch all payslip vouchers from Supabase
 */
export const getPayslipRecords = async () => {
  let records = [];
  let error = null;

  try {
    const res = await supabase
      .from('payslips')
      .select('*, employees(*), payroll(*)')
      .order('created_at', { ascending: false });

    if (!res.error && res.data) {
      records = res.data;
    } else {
      error = res.error;
    }
  } catch (err) {
    error = err;
  }

  // Fallback: in-memory join
  if (records.length === 0) {
    try {
      const resFallback = await supabase
        .from('payslips')
        .select('*')
        .order('id', { ascending: false });

      if (!resFallback.error && resFallback.data) {
        records = resFallback.data;
        error = null;

        try {
          const [empsRes, payRes] = await Promise.all([
            supabase.from('employees').select('*'),
            supabase.from('payroll').select('*'),
          ]);

          const empMap = new Map((empsRes.data || []).map((e) => [String(e.id), e]));
          const payMap = new Map((payRes.data || []).map((p) => [String(p.id), p]));

          records = records.map((r) => ({
            ...r,
            employees: empMap.get(String(r.employee_id)) || null,
            payroll: payMap.get(String(r.payroll_id)) || null,
          }));
        } catch {
          // Keep raw records
        }
      }
    } catch (fallbackErr) {
      error = fallbackErr;
    }
  }

  if (error && records.length === 0) {
    console.warn('Payslips query note:', error.message || error);
  }

  return records;
};

/**
 * Create a payslip voucher entry in Supabase
 */
export const createPayslipRecord = async (payslipData) => {
  const payload = {
    employee_id: Number(payslipData.employee_id),
    payroll_id: Number(payslipData.payroll_id),
    file_url: payslipData.file_url || null,
  };

  const { data, error } = await supabase.from('payslips').insert([payload]).select();

  if (error) {
    throw new Error(`Failed to create payslip voucher: ${error.message}`);
  }

  return data;
};

/**
 * Delete a payslip record from Supabase
 */
export const deletePayslipRecord = async (id, payrollId = null) => {
  if (id) {
    const { error } = await supabase.from('payslips').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete payslip: ${error.message}`);
    }
  }

  if (payrollId) {
    try {
      await supabase.from('payslips').delete().eq('payroll_id', payrollId);
      await supabase.from('payroll').delete().eq('id', payrollId);
    } catch (e) {
      console.warn('Cascade payroll delete note:', e);
    }
  }

  return true;
};
