import Header from "@/components/Header";
import ClubList from "@/components/ClubList";
import ErrorToast from "@/components/ErrorToast";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  const { error } = await searchParams;

  let userGrade: number | null = null;
  if (session.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { grade: true },
    });
    userGrade = user?.grade ?? null;
  }

  return (
    <>
      <Header />
      <ErrorToast error={error} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-1">창체동아리 목록</h1>
        <p className="text-muted-foreground text-sm mb-6">
          원하는 창체동아리를 선택해 선착순으로 신청하세요.
        </p>
        <ClubList isLoggedIn={!!session.userId} userGrade={userGrade} />
      </main>
    </>
  );
}
