import { describe, expect, it } from "vitest";
import { assertAnyRole, canActOnBrand, hasAnyRole, hasRole, isAllowedCorporateEmail } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/types";

const importUser: SessionUser = {
  id: "u-ging",
  email: "naparat@chg.co.th",
  name: "Naparat",
  thaiName: "K.กิ่ง (Naparat)",
  nickname: "K.กิ่ง",
  roles: ["IMPORT"],
  ownedBrandIds: ["b-kassa-home", "b-fugo"],
};

const adminUser: SessionUser = {
  id: "u-admin",
  email: "admin@chg.co.th",
  name: "Admin",
  thaiName: "ผู้ดูแลระบบ",
  nickname: "Admin",
  roles: ["ADMIN", "IMPORT"],
  ownedBrandIds: [],
};

describe("RBAC authorization helpers", () => {
  it("checks single and multiple role memberships", () => {
    expect(hasRole(importUser, "IMPORT")).toBe(true);
    expect(hasRole(importUser, "GM")).toBe(false);
    expect(hasAnyRole(adminUser, ["GM", "ADMIN"])).toBe(true);
    expect(hasAnyRole(null, ["IMPORT"])).toBe(false);
  });

  it("throws structured Forbidden error when role is missing", () => {
    expect(() => assertAnyRole(importUser, ["GM", "VP"])).toThrow(/FORBIDDEN/);
    expect(() => assertAnyRole(null, ["IMPORT"])).toThrow(/UNAUTHORIZED/);
    expect(() => assertAnyRole(importUser, ["IMPORT", "MER"])).not.toThrow();
  });

  it("enforces brand ownership for IMPORT role while allowing ADMIN and non-IMPORT approvers", () => {
    expect(canActOnBrand(importUser, "b-kassa-home")).toBe(true);
    expect(canActOnBrand(importUser, "b-workon")).toBe(false);
    expect(canActOnBrand(adminUser, "b-workon")).toBe(true);
    const gmUser: SessionUser = { ...importUser, id: "u-gm", roles: ["GM"], ownedBrandIds: [] };
    expect(canActOnBrand(gmUser, "b-workon")).toBe(true);
  });

  it("validates corporate email domain (@chg.co.th) case-insensitively", () => {
    expect(isAllowedCorporateEmail("BhChodok@chg.co.th", "chg.co.th")).toBe(true);
    expect(isAllowedCorporateEmail("user@CHG.CO.TH", "chg.co.th")).toBe(true);
    expect(isAllowedCorporateEmail("outsider@gmail.com", "chg.co.th")).toBe(false);
    expect(isAllowedCorporateEmail("fakechg.co.th@evil.com", "chg.co.th")).toBe(false);
  });
});
