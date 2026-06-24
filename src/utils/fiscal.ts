/**
 * Returns the fiscal month and year for a given date.
 * Custom 25-to-25 fiscal month cycle:
 * A transaction logged on the 24th stays in the current calendar month.
 * A transaction logged on the 25th instantly shifts to the next calendar month (representing the new budget cycle).
 */
export function getFiscalPeriod(dateStrOrObj: string | Date | number): { year: number; month: number; label: string } {
  const d = new Date(dateStrOrObj);
  if (isNaN(d.getTime())) {
    return { year: new Date().getFullYear(), month: new Date().getMonth() + 1, label: "Current Cycle" };
  }

  const day = d.getDate();
  let month = d.getMonth() + 1; // 1-indexed
  let year = d.getFullYear();

  if (day >= 25) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const label = `${monthNames[month - 1]} ${year}`;
  
  return { year, month, label };
}
