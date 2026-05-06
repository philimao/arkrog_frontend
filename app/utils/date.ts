/**
 * 本地化日期+时间字符串（zh-CN，24h）。空/0/NaN 返回 em-dash。
 */
export function formatDateTime(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("zh-CN", { hour12: false });
}

/**
 * Formats a date in YYYY-MM-DD format for use with HTML date inputs,
 * preserving the local timezone (unlike toISOString which uses UTC)
 * @param date Date object or timestamp to format
 * @returns string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | number): string {
  const d = date instanceof Date ? date : new Date(date);

  // Get year, month, and day in local timezone
  const year = d.getFullYear();
  // getMonth() is 0-indexed, so add 1 and pad with leading zero if needed
  const month = String(d.getMonth() + 1).padStart(2, "0");
  // pad with leading zero if needed
  const day = String(d.getDate()).padStart(2, "0");

  // Format as YYYY-MM-DD
  return `${year}-${month}-${day}`;
}

/**
 * Checks if two dates represent the same calendar day (same year, month, and day)
 * @param date1 First date to compare
 * @param date2 Second date to compare
 * @returns boolean indicating if the dates are the same day
 * @todo 如果用户重新新建了非同名stage，在编辑相同日程的game时，会串到先新建的game上
 */
export function isSameDay(date1: Date | number, date2: Date | number): boolean {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  return d1.toDateString() === d2.toDateString();
}

export function generateDateArray(startMs: number, endMs: number): Date[] {
  // Validate inputs
  if (!startMs || !endMs || isNaN(startMs) || isNaN(endMs)) {
    return []; // Return empty array for invalid inputs
  }

  const startDate = new Date(startMs);
  const endDate = new Date(endMs);

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return []; // Return empty array for invalid dates
  }

  // Ensure startDate is before endDate
  if (startDate > endDate) {
    return []; // Return empty array if start date is after end date
  }

  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  // Safety mechanism to prevent infinite loops
  const maxDays = 90; // Maximum 90 days
  let dayCount = 0;

  while (currentDate <= endDate && dayCount < maxDays) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
    dayCount++;
  }

  return dates;
}
