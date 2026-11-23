import { describe, expect, it } from "vitest";
import {
  addBusinessDays,
  addCalendarDays,
  diffBusinessDays,
  isBusinessDay,
  isWeekend,
} from "@/lib/domain/business-days";

const HOLIDAYS_2570 = new Set<string>([
  "2027-01-01", // Fri New Year
  "2027-04-06", // Tue Chakri
  "2027-04-13", // Tue Songkran
  "2027-04-14", // Wed Songkran
  "2027-05-03", // Mon Labor Day sub
  "2027-05-04", // Tue Coronation Day
]);

describe("business-days domain math", () => {
  it("detects weekends and company holidays accurately", () => {
    expect(isWeekend("2027-04-10")).toBe(true); // Saturday
    expect(isWeekend("2027-04-11")).toBe(true); // Sunday
    expect(isWeekend("2027-04-12")).toBe(false); // Monday
    expect(isBusinessDay("2027-04-12", HOLIDAYS_2570)).toBe(true);
    expect(isBusinessDay("2027-04-13", HOLIDAYS_2570)).toBe(false); // Songkran
  });

  it("adds business days skipping weekends and Songkran holidays", () => {
    // 2027-04-09 (Fri) + 3 business days:
    // skip Sat 10, Sun 11 -> Mon 12 (1), skip Tue 13 & Wed 14 (Songkran) -> Thu 15 (2) -> Fri 16 (3)
    expect(addBusinessDays("2027-04-09", 3, HOLIDAYS_2570)).toBe("2027-04-16");
  });

  it("handles consecutive May 3-4 holidays cleanly", () => {
    // 2027-04-30 (Fri) + 1 business day: skip Sat 1, Sun 2, Mon 3, Tue 4 -> Wed 2027-05-05
    expect(addBusinessDays("2027-04-30", 1, HOLIDAYS_2570)).toBe("2027-05-05");
  });

  it("returns start date when adding 0 business days", () => {
    expect(addBusinessDays("2027-04-09", 0, HOLIDAYS_2570)).toBe("2027-04-09");
  });

  it("adds calendar days for PO, Production, and Logistic stages", () => {
    expect(addCalendarDays("2026-11-25", 5)).toBe("2026-11-30");
    expect(addCalendarDays("2026-11-30", 55)).toBe("2027-01-24");
  });

  it("calculates positive and negative business day differences (delay detection)", () => {
    expect(diffBusinessDays("2027-04-09", "2027-04-16", HOLIDAYS_2570)).toBe(3);
    expect(diffBusinessDays("2027-04-16", "2027-04-09", HOLIDAYS_2570)).toBe(-3);
    expect(diffBusinessDays("2027-04-09", "2027-04-09", HOLIDAYS_2570)).toBe(0);
  });
});
