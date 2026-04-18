import prisma from "../prisma/client";

export async function listOpdEligibleDoctors() {
  return prisma.opdEligibleDoctor.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, isActive: true, role: { select: { roleName: true } } },
      },
    },
  });
}

export async function listAllOpdEligibleDoctorRows() {
  return prisma.opdEligibleDoctor.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, isActive: true, role: { select: { roleName: true } } },
      },
    },
  });
}

export async function upsertOpdEligibleDoctor(userId: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    const err = new Error("USER_NOT_FOUND") as Error & { code?: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }
  return prisma.opdEligibleDoctor.upsert({
    where: { userId },
    create: { userId, isActive },
    update: { isActive },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, isActive: true, role: { select: { roleName: true } } },
      },
    },
  });
}

export async function removeOpdEligibleDoctor(userId: string) {
  try {
    await prisma.opdEligibleDoctor.delete({ where: { userId } });
  } catch {
    const err = new Error("NOT_FOUND") as Error & { code?: string };
    err.code = "NOT_FOUND";
    throw err;
  }
}

export async function assertUserIsActiveOpdDoctor(userId: string): Promise<void> {
  const row = await prisma.opdEligibleDoctor.findUnique({
    where: { userId },
    select: { isActive: true },
  });
  if (!row?.isActive) {
    const err = new Error("OPD_NOT_ELIGIBLE") as Error & { code?: string };
    err.code = "OPD_NOT_ELIGIBLE";
    throw err;
  }
}
