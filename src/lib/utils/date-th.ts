const BANGKOK_TZ = "Asia/Bangkok";

function getParts(date: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: BANGKOK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const map: Record<string, string> = {};
  for (const p of formatter.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return map;
}

export function formatDateShort(input: Date | string | null | undefined): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "—";
  const p = getParts(date);
  return `${p.day}/${p.month}/${(p.year ?? "").slice(-2)}`;
}

export function formatDateTimeTh(input: Date | string | null | undefined): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "—";
  const p = getParts(date);
  return `${p.day}/${p.month}/${(p.year ?? "").slice(-2)} ${p.hour}:${p.minute}`;
}

export function toBangkokDateKey(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const p = getParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}
