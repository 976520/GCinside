import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// 동아리 단건 조회
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id: Number(id) },
    include: {
      _count: { select: { enrollments: true } },
    },
  });

  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(club);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, description, grade1Capacity, grade23Capacity, isOpen, openAt } = body;

  const club = await prisma.club.update({
    where: { id: Number(id) },
    data: {
      ...(name !== undefined && { name: String(name) }),
      ...(description !== undefined && { description: String(description) }),
      ...(grade1Capacity !== undefined && { grade1Capacity: Number(grade1Capacity) }),
      ...(grade23Capacity !== undefined && { grade23Capacity: Number(grade23Capacity) }),
      ...(isOpen !== undefined && { isOpen: Boolean(isOpen) }),
      ...(openAt !== undefined && { openAt: openAt ? new Date(openAt) : null }),
    },
  });

  return NextResponse.json(club);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.club.delete({ where: { id: Number(id) } });

  return NextResponse.json({ ok: true });
}
