function parseUtcDateKey(dateKey: string): Date {
  const parts = dateKey.split("-").map(Number);
  const year = parts[0] ?? 1970;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isWeekend(dateKey: string): boolean {
  const day = parseUtcDateKey(dateKey).getUTCDay();
  return day === 0 || day === 6;
}

export function isBusinessDay(dateKey: string, holidaySet: ReadonlySet<string>): boolean {
  if (isWeekend(dateKey)) return false;
  return !holidaySet.has(dateKey);
}

export function addCalendarDays(startDateKey: string, calendarDays: number): string {
  const dt = parseUtcDateKey(startDateKey);
  dt.setUTCDate(dt.getUTCDate() + calendarDays);
  return formatUtcDateKey(dt);
}

export function addBusinessDays(
  startDateKey: string,
  businessDays: number,
  holidaySet: ReadonlySet<string>
): string {
  if (businessDays === 0) return startDateKey;
  const step = businessDays > 0 ? 1 : -1;
  let remaining = Math.abs(businessDays);
  let cursor = startDateKey;

  while (remaining > 0) {
    cursor = addCalendarDays(cursor, step);
    if (isBusinessDay(cursor, holidaySet)) {
      remaining -= 1;
    }
  }
  return cursor;
}

export function diffBusinessDays(
  fromDateKey: string,
  toDateKey: string,
  holidaySet: ReadonlySet<string>
): number {
  if (fromDateKey === toDateKey) return 0;
  const forward = toDateKey > fromDateKey;
  let cursor = forward ? fromDateKey : toDateKey;
  const target = forward ? toDateKey : fromDateKey;
  let count = 0;

  while (cursor < target) {
    cursor = addCalendarDays(cursor, 1);
    if (isBusinessDay(cursor, holidaySet)) {
      count += 1;
    }
  }
  return forward ? count : -count;
}
