import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/session";

// 내 신청 목록 조회
export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.userId },
    include: { club: true },
    orderBy: { enrolledAt: "asc" },
  });

  return NextResponse.json(enrollments);
}

// 수강 신청 (선착순)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clubId } = await req.json();
  if (!clubId) {
    return NextResponse.json({ error: "clubId is required" }, { status: 400 });
  }

  try {
    // 트랜잭션으로 선착순 처리 (동시성 방지)
    const enrollment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const club = await tx.club.findUnique({
        where: { id: Number(clubId) },
        select: { id: true, maxCapacity: true, isOpen: true },
      });

      if (!club) throw new Error("CLUB_NOT_FOUND");
      if (!club.isOpen) throw new Error("CLUB_CLOSED");

      const count = await tx.enrollment.count({
        where: { clubId: Number(clubId) },
      });

      if (count >= club.maxCapacity) throw new Error("CLUB_FULL");

      return tx.enrollment.create({
        data: {
          userId: session.userId!,
          clubId: Number(clubId),
        },
        include: { club: true },
      });
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNKNOWN";

    if (message === "CLUB_NOT_FOUND")
      return NextResponse.json({ error: "동아리를 찾을 수 없습니다." }, { status: 404 });
    if (message === "CLUB_CLOSED")
      return NextResponse.json({ error: "신청이 마감된 동아리입니다." }, { status: 409 });
    if (message === "CLUB_FULL")
      return NextResponse.json({ error: "정원이 마감되었습니다." }, { status: 409 });

    // 중복 신청 (unique constraint)
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "이미 신청한 동아리입니다." }, { status: 409 });
    }

    console.error(err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
