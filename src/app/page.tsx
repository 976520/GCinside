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
  const [userResult, settings] = await Promise.all([
    session.userId
      ? prisma.user.findUnique({ where: { id: session.userId }, select: { grade: true } })
      : Promise.resolve(null),
    prisma.settings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} }),
  ]);
  if (session.userId) {
    userGrade = userResult?.grade ?? null;
  }

  const globalOpenAt = settings.openAt ? settings.openAt.toISOString() : null;

  return (
    <>
      <Header />
      <ErrorToast error={error} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-1 text-2xl font-bold">창체동아리 목록</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          원하는 창체동아리를 선택해 선착순으로 신청하세요.
        </p>
        <ClubList isLoggedIn={!!session.userId} userGrade={userGrade} globalOpenAt={globalOpenAt} />
      </main>
    </>
  );
}
