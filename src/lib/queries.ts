import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const TAGS = {
  users: "users",
  enrollments: "enrollments",
} as const;

export const getCachedUserProfile = unstable_cache(
  async (userId: number) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        role: true,
        studentNumber: true,
        grade: true,
        classNum: true,
        number: true,
        major: true,
      },
    }),
  ["user-profile"],
  { tags: [TAGS.users] }
);

export const getCachedEnrollments = unstable_cache(
  async (userId: number) =>
    prisma.enrollment.findMany({
      where: { userId },
      include: { club: { select: { name: true, description: true } } },
      orderBy: { enrolledAt: "asc" },
    }),
  ["user-enrollments"],
  { tags: [TAGS.enrollments] }
);
