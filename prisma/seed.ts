import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

const seedEnvSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    SEED_ADMIN_EMAIL: z.email(),
    SEED_ADMIN_NAME: z.string().min(1),
    SEED_ADMIN_PASSWORD: z.string().min(12),
    SEED_USER_EMAIL: z.email().optional(),
    SEED_USER_NAME: z.string().min(1).optional(),
    SEED_USER_PASSWORD: z.string().min(12).optional(),
  })
  .superRefine((value, context) => {
    const userValues = [value.SEED_USER_EMAIL, value.SEED_USER_NAME, value.SEED_USER_PASSWORD];
    const providedCount = userValues.filter(Boolean).length;

    if (providedCount > 0 && providedCount < 3) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "If seeding a standard user, SEED_USER_EMAIL, SEED_USER_NAME, and SEED_USER_PASSWORD must all be provided.",
      });
    }
  });

async function main() {
  const env = seedEnvSchema.parse(process.env);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: env.DATABASE_URL,
    }),
  });

  try {
    const adminPasswordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);

    await prisma.user.upsert({
      where: { email: env.SEED_ADMIN_EMAIL },
      update: {
        name: env.SEED_ADMIN_NAME,
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
      create: {
        email: env.SEED_ADMIN_EMAIL,
        name: env.SEED_ADMIN_NAME,
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    if (env.SEED_USER_EMAIL && env.SEED_USER_NAME && env.SEED_USER_PASSWORD) {
      const userPasswordHash = await hashPassword(env.SEED_USER_PASSWORD);

      await prisma.user.upsert({
        where: { email: env.SEED_USER_EMAIL },
        update: {
          name: env.SEED_USER_NAME,
          passwordHash: userPasswordHash,
          role: UserRole.USER,
          isActive: true,
        },
        create: {
          email: env.SEED_USER_EMAIL,
          name: env.SEED_USER_NAME,
          passwordHash: userPasswordHash,
          role: UserRole.USER,
          isActive: true,
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
