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

// Format time (e.g. 09:30 AM)
export const formatTime = (timeString) => {
  if (!timeString) return '-';
  try {
    // Check if it's already HH:MM or HH:MM:SS
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return `${hours}:${minutes} ${ampm}`;
    }
    const d = new Date(timeString);
    if (isNaN(d.getTime())) return timeString;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timeString;
  }
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

