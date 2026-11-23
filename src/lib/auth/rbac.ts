import type { RoleCode } from "@prisma/client";
import { AuthError, type SessionUser } from "./types";

export function hasRole(user: SessionUser | null, role: RoleCode): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

export function hasAnyRole(user: SessionUser | null, roles: readonly RoleCode[]): boolean {
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
}

export function assertAnyRole(user: SessionUser | null, roles: readonly RoleCode[]): asserts user is SessionUser {
  if (!user) {
    throw new AuthError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนดำเนินการ");
  }
  if (!hasAnyRole(user, roles)) {
    throw new AuthError("FORBIDDEN", `สิทธิ์ไม่เพียงพอ (ต้องมีบทบาท: ${roles.join(", ")})`);
  }
}

export function canActOnBrand(user: SessionUser | null, brandId: string): boolean {
  if (!user) return false;
  if (user.roles.includes("ADMIN")) return true;
  const nonImportRoles = user.roles.filter((r) => r !== "IMPORT");
  if (nonImportRoles.length > 0) return true;
  return user.ownedBrandIds.includes(brandId);
}

export function isAllowedCorporateEmail(email: string, allowedDomain = "chg.co.th"): boolean {
  const normalized = email.trim().toLowerCase();
  const domain = allowedDomain.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex <= 0) return false;
  return normalized.slice(atIndex + 1) === domain;
}
