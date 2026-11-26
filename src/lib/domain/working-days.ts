export const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."] as const;
export const TH_MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"] as const;

export const HOL_DEFAULT = [
  "2025-12-31", "2026-01-01", "2026-01-02", "2026-03-03", "2026-04-06",
  "2026-04-13", "2026-04-14", "2026-04-15", "2026-05-01", "2026-05-04",
  "2026-06-01", "2026-06-03", "2026-07-28", "2026-07-29", "2026-08-12",
  "2026-10-13", "2026-10-23", "2026-12-07", "2026-12-10", "2026-12-31",
  "2027-01-01", "2027-02-22", "2027-04-06", "2027-04-13", "2027-04-14",
  "2027-04-15", "2027-05-03", "2027-05-04", "2027-05-20", "2027-06-03",
  "2027-07-19", "2027-07-28", "2027-08-12", "2027-10-13", "2027-10-25",
  "2027-12-06", "2027-12-10", "2027-12-31",
] as const;

export function todayBangkok(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

export function timeBangkokHm(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

export function addCalendarDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function calendarDiff(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000);
}

export function isWorkingDay(iso: string, holidays: ReadonlySet<string>): boolean {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6 && !holidays.has(iso);
}

export function diffWorkingDays(a: string | null | undefined, b: string | null | undefined, holidays: ReadonlySet<string>): number {
  if (!a || !b || a === b) return 0;
  let count = 0;
  if (b > a) {
    let cur = a;
    while (cur < b) {
      cur = addCalendarDays(cur, 1);
      if (isWorkingDay(cur, holidays)) count++;
    }
  } else {
    let cur = b;
    while (cur < a) {
      cur = addCalendarDays(cur, 1);
      if (isWorkingDay(cur, holidays)) count--;
    }
  }
  return count;
}

export function addWorkingDays(iso: string, n: number, holidays: ReadonlySet<string>): string {
  if (n === 0) return iso;
  let cur = iso;
  let count = 0;
  const step = n > 0 ? 1 : -1;
  const target = Math.abs(n);
  while (count < target) {
    cur = addCalendarDays(cur, step);
    if (isWorkingDay(cur, holidays)) count++;
  }
  return cur;
}

export function fmtThaiDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const monthIdx = Number(m) - 1;
  return `${Number(d)} ${TH_MONTHS_SHORT[monthIdx] ?? m} ${y.slice(2)}`;
}
