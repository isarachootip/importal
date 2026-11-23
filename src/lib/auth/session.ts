import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { isDevAuthEnabled } from "@/lib/env";
import type { SessionUser } from "./types";

export const SESSION_COOKIE_NAME = "importal_dev_uid";

export async function getSessionUserById(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    include: {
      roles: { select: { role: true } },
      ownedBrands: { select: { id: true } },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    thaiName: user.thaiName,
    nickname: user.nickname,
    roles: user.roles.map((r) => r.role),
    ownedBrandIds: user.ownedBrands.map((b) => b.id),
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const uid = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (uid) {
    return getSessionUserById(uid);
  }

  if (isDevAuthEnabled()) {
    const defaultUser = await prisma.user.findUnique({
      where: { email: "naparat@chg.co.th" },
      select: { id: true },
    });
    if (defaultUser) {
      return getSessionUserById(defaultUser.id);
    }
  }

  return null;
}
