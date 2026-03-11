import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// 전체 신청 목록 조회 (어드민 전용)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");

  const enrollments = await prisma.enrollment.findMany({
    where: clubId ? { clubId: Number(clubId) } : undefined,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          studentNumber: true,
          grade: true,
          classNum: true,
          number: true,
          major: true,
        },
      },
      club: { select: { id: true, name: true } },
    },
    orderBy: { enrolledAt: "asc" },
  });

  return NextResponse.json(enrollments);
}
