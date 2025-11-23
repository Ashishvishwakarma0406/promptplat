// services/otpService.js
import prisma from "@/lib/prisma";

export async function upsertOtp(email, code) {
  return prisma.oTP.upsert({
    where: { email },
    update: { code, createdAt: new Date() },
    create: { email, code },
  });
}

export async function getOtpByEmail(email) {
  return prisma.oTP.findUnique({ where: { email } });
}

export async function deleteOtpByEmail(email) {
  return prisma.oTP.deleteMany({ where: { email } });
}
