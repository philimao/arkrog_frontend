export function generateDateArray(startMs: number, endMs: number): Date[] {
  const dates: Date[] = [];
  const startDate = new Date(startMs);
  const endDate = new Date(endMs);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}
