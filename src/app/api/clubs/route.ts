import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// 동아리 목록 조회
export async function GET() {
  const clubs = await prisma.club.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { enrollments: true } },
    },
  });

  return NextResponse.json(clubs);
}

// 동아리 생성 (어드민 전용)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, maxCapacity, isOpen } = body;

  if (!name || !description || !maxCapacity) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const club = await prisma.club.create({
    data: {
      name: String(name),
      description: String(description),
      maxCapacity: Number(maxCapacity),
      isOpen: isOpen ?? true,
    },
  });

  return NextResponse.json(club, { status: 201 });
}
