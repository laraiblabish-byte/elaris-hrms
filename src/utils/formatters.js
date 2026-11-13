// Format currency in Pakistani Rupees (PKR) e.g. Rs. 80,000
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rs. 0';
  const num = Number(amount);
  const formatted = num.toLocaleString('en-PK', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `Rs. ${formatted}`;
};

// Normalize any date value (Date object, ISO string, SQL date/timestamp) to YYYY-MM-DD
export const normalizeDate = (val) => {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const str = String(val).trim();
  const datePart = str.split('T')[0].split(' ')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {}
  return datePart || str;
};

// Get today's local date string formatted as YYYY-MM-DD
export const getTodayDateString = () => {
  return normalizeDate(new Date());
};

// Check if a date string/timestamp represents "today" in either local or UTC time
export const isToday = (val) => {
  if (!val) return false;
  const norm = normalizeDate(val);
  if (!norm) return false;

  const now = new Date();
  const localToday = normalizeDate(now);
  const utcToday = now.toISOString().split('T')[0];

  return norm === localToday || norm === utcToday;
};

// Format date nicely (e.g. Nov 05, 2026)
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

// Get date offset by days from today formatted as YYYY-MM-DD
export const getDateOffset = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + Number(offsetDays));
  return normalizeDate(d);
};

// Calculate inclusive day count between two date strings (YYYY-MM-DD)
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

// Format time in 12-hour AM/PM type system (e.g. 09:30 AM, 05:00 PM)
export const formatTime = (timeString) => {
  if (!timeString) return '-';
  const str = String(timeString).trim();
  if (!str) return '-';

  // Check if it already has AM/PM
  const match12 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)$/i);
  if (match12) {
    const hh = String(parseInt(match12[1], 10)).padStart(2, '0');
    const mm = match12[2];
    const ampm = match12[3].toUpperCase();
    return `${hh}:${mm} ${ampm}`;
  }

  // Handle HH:MM or HH:MM:SS 24-hour string (e.g. "09:00", "17:00")
  if (str.includes(':')) {
    const parts = str.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = (parts[1] || '00').substring(0, 2);
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }
  } catch {}

  return str;
};

// Display employee identifier or full name nicely
export const getEmployeeDisplayName = (emp) => {
  if (!emp) return 'Unknown Employee';
  if (emp.full_name) return emp.full_name;
  if (emp.name) return emp.name;
  if (emp.email) {
    const username = emp.email.split('@')[0];
    // Capitalize first letter of parts
    return username
      .split(/[._-]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return `Employee #${emp.id || ''}`;
};

