import { describe, expect, it } from "vitest";
import { formatDateShort, formatDateTimeTh, toBangkokDateKey } from "@/lib/utils/date-th";

describe("date-th formatting (Asia/Bangkok, dd/mm/yy)", () => {
  it("formats UTC dates as dd/mm/yy in Asia/Bangkok timezone", () => {
    // 2026-10-23T18:30:00Z is 2026-10-24 01:30 in Asia/Bangkok (+07:00)
    const lateUtc = new Date("2026-10-23T18:30:00.000Z");
    expect(formatDateShort(lateUtc)).toBe("24/10/26");
    expect(toBangkokDateKey(lateUtc)).toBe("2026-10-24");
  });

  it("formats calendar date-only strings cleanly as dd/mm/yy", () => {
    const dt = new Date("2026-11-05T00:00:00.000Z");
    expect(formatDateShort(dt)).toBe("05/11/26");
  });

  it("formats date-time as dd/mm/yy HH:mm in Asia/Bangkok", () => {
    const dt = new Date("2026-10-29T03:42:00.000Z"); // 10:42 Bangkok
    expect(formatDateTimeTh(dt)).toBe("29/10/26 10:42");
  });

  it("returns em-dash for null or undefined", () => {
    expect(formatDateShort(null)).toBe("—");
    expect(formatDateTimeTh(undefined)).toBe("—");
  });
});
