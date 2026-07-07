const MONTH_INDEX = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function normalizeMonthName(value) { return value.slice(0, 3).toLowerCase(); }
function toMonthKey(date) { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); return year + '-' + month; }
const start = new Date('2026-01-01'); const end = new Date('2026-07-31');
const resolveYearForMonth = (monthIndex) => { if (start.getFullYear() === end.getFullYear()) return start.getFullYear(); return monthIndex >= start.getMonth() ? start.getFullYear() : end.getFullYear(); };
const getPointMonthKey = (label) => { 
  const directDate = new Date(label); 
  if (!Number.isNaN(directDate.getTime())) { return toMonthKey(directDate); } 
  const monthDayYearMatch = label.trim().match(/^([A-Za-z]{3,9})\s+\d{1,2}(?:,\s*(\d{4}))?$/); 
  if (monthDayYearMatch) { 
    const month = MONTH_INDEX[normalizeMonthName(monthDayYearMatch[1])]; 
    if (month !== undefined) { 
      const explicitYear = monthDayYearMatch[2] ? Number(monthDayYearMatch[2]) : resolveYearForMonth(month); 
      return explicitYear + '-' + String(month + 1).padStart(2, '0'); 
    } 
  } 
  const isoMonthMatch = label.trim().match(/^(\d{4})-(\d{2})(?:-\d{2})?$/); 
  if (isoMonthMatch) return isoMonthMatch[1] + '-' + isoMonthMatch[2]; 
  return null; 
};

console.log('Jul 2026 ->', getPointMonthKey('Jul 2026'));
