import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import EnrollmentList from "@/components/EnrollmentList";

const MAJOR_LABELS: Record<string, string> = {
  SW_DEVELOPMENT: "소프트웨어개발",
  SMART_IOT: "스마트IOT",
  AI: "인공지능",
};

export default async function ProfilePage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      enrollments: {
        include: { club: true },
        orderBy: { enrolledAt: "asc" },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        <section>
          <h1 className="mb-4 text-2xl font-bold">My Profile</h1>
          <div className="bg-card space-y-4 rounded-xl border p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full text-lg font-semibold">
                {user.name.slice(0, 2)}
              </div>
              <div>
                <p className="text-lg font-semibold">{user.name}</p>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                {user.role === "ADMIN" && (
                  <Badge variant="default" className="mt-1">
                    관리자
                  </Badge>
                )}
              </div>
            </div>

            {(user.grade || user.classNum || user.number || user.major || user.studentNumber) && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-t pt-4 text-sm">
                {user.studentNumber && (
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs">학번</p>
                    <p className="font-medium">{user.studentNumber}</p>
                  </div>
                )}
                {user.grade && (
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs">학년</p>
                    <p className="font-medium">{user.grade}학년</p>
                  </div>
                )}
                {user.classNum && (
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs">반</p>
                    <p className="font-medium">{user.classNum}반</p>
                  </div>
                )}
                {user.number && (
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs">번호</p>
                    <p className="font-medium">{user.number}번</p>
                  </div>
                )}
                {user.major && (
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs">학과</p>
                    <p className="font-medium">{MAJOR_LABELS[user.major] ?? user.major}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">신청한 동아리</h2>
          <EnrollmentList
            initialEnrollments={user.enrollments.map((e) => ({
              id: e.id,
              club: { name: e.club.name, description: e.club.description },
            }))}
          />
        </section>
      </main>
    </>
  );
}
