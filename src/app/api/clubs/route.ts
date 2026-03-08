import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const clubs = await prisma.club.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      enrollments: {
        select: { user: { select: { grade: true } } },
      },
    },
  });

  return NextResponse.json(
    clubs.map(({ enrollments, ...club }) => ({
      ...club,
      _count: { enrollments: enrollments.length },
      gradeEnrollments: {
        grade1: enrollments.filter((e) => e.user.grade === 1).length,
        grade2: enrollments.filter((e) => e.user.grade === 2).length,
        grade3: enrollments.filter((e) => e.user.grade === 3).length,
      },
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, grade1Capacity, grade2Capacity, grade3Capacity, isOpen, openAt } = body;

  if (!name || !description) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const club = await prisma.club.create({
    data: {
      name: String(name),
      description: String(description),
      grade1Capacity: Number(grade1Capacity ?? 0),
      grade2Capacity: Number(grade2Capacity ?? 0),
      grade3Capacity: Number(grade3Capacity ?? 0),
      isOpen: isOpen ?? true,
      openAt: openAt ? new Date(openAt) : null,
    },
  });

  return NextResponse.json(club, { status: 201 });
}
