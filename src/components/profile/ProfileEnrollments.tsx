import { prisma } from "@/lib/prisma";
import EnrollmentList from "@/components/EnrollmentList";

export default async function ProfileEnrollments({ userId }: { userId: number }) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: { club: { select: { name: true, description: true } } },
    orderBy: { enrolledAt: "asc" },
  });

  return (
    <EnrollmentList
      initialEnrollments={enrollments.map((e) => ({
        id: e.id,
        club: { name: e.club.name, description: e.club.description },
      }))}
    />
  );
}
