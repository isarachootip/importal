import { prisma } from "@/lib/db/prisma";
import { isDevAuthEnabled } from "@/lib/env";

export async function getDevUsersForShell() {
  if (!isDevAuthEnabled()) return [];
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { email: "asc" },
    include: { roles: { select: { role: true } } },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    thaiName: u.thaiName,
    nickname: u.nickname,
    roles: u.roles.map((r) => r.role),
  }));
}
