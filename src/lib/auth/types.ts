import type { RoleCode } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  thaiName: string | null;
  nickname: string | null;
  roles: RoleCode[];
  ownedBrandIds: string[];
}

export class AuthError extends Error {
  readonly code: "UNAUTHORIZED" | "FORBIDDEN";
  readonly status: 401 | 403;

  constructor(code: "UNAUTHORIZED" | "FORBIDDEN", message: string) {
    super(`${code}: ${message}`);
    this.name = "AuthError";
    this.code = code;
    this.status = code === "UNAUTHORIZED" ? 401 : 403;
  }
}
