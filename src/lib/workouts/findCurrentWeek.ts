/**
 * Find the week that contains today by matching month/day.
 * Handles data where the year may differ from the current year (e.g. seed data).
 *
 * Weeks must be sorted by weekStartDate ascending.
 * Returns the matching weekStartDate, or null if no weeks are provided.
 */
export function findCurrentWeekStart(
  weeks: { weekStartDate: Date }[]
): Date | null {
  if (weeks.length === 0) return null;

  const now = new Date();
  const year = now.getFullYear();
  const todayNorm = new Date(year, now.getMonth(), now.getDate()).getTime();

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    if (!week) continue;

    const startNorm = new Date(
      year,
      week.weekStartDate.getMonth(),
      week.weekStartDate.getDate()
    ).getTime();

    const nextWeek = weeks[i + 1];
    const nextNorm = nextWeek
      ? new Date(
          year,
          nextWeek.weekStartDate.getMonth(),
          nextWeek.weekStartDate.getDate()
        ).getTime()
      : Infinity;

    if (todayNorm >= startNorm && todayNorm < nextNorm) {
      return week.weekStartDate;
    }
  }

  return null;
}
