import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    enrollment: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

import { GET } from "@/app/api/admin/enrollments/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const adminSession = { role: "ADMIN", userId: 1 };
const studentSession = { role: "STUDENT", userId: 2 };

const mockEnrollments = [
  {
    id: 1,
    enrolledAt: new Date(),
    user: {
      id: 10,
      name: "홍길동",
      email: "hong@gsm.hs.kr",
      studentNumber: 10101,
      grade: 1,
      classNum: 1,
      number: 1,
      major: "SW",
    },
    club: { id: 1, name: "밴드부" },
  },
  {
    id: 2,
    enrolledAt: new Date(),
    user: {
      id: 11,
      name: "김철수",
      email: "kim@gsm.hs.kr",
      studentNumber: 20201,
      grade: 2,
      classNum: 2,
      number: 1,
      major: "EB",
    },
    club: { id: 2, name: "사진부" },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/enrollments", () => {
  it("비어드민 → 403", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);

    const req = new NextRequest("http://localhost/api/admin/enrollments");
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(prisma.enrollment.findMany).not.toHaveBeenCalled();
  });

  it("전체 신청 목록 반환", async () => {
    (getSession as Mock).mockResolvedValue(adminSession);
    (prisma.enrollment.findMany as Mock).mockResolvedValue(mockEnrollments);

    const req = new NextRequest("http://localhost/api/admin/enrollments");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    );
  });

  it("clubId 쿼리로 필터링", async () => {
    (getSession as Mock).mockResolvedValue(adminSession);
    (prisma.enrollment.findMany as Mock).mockResolvedValue([mockEnrollments[0]]);

    const req = new NextRequest("http://localhost/api/admin/enrollments?clubId=1");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clubId: 1 } })
    );
  });

  it("신청 없을 때 빈 배열 반환", async () => {
    (getSession as Mock).mockResolvedValue(adminSession);
    (prisma.enrollment.findMany as Mock).mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/admin/enrollments");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("사용자 상세 정보 포함 여부 확인", async () => {
    (getSession as Mock).mockResolvedValue(adminSession);
    (prisma.enrollment.findMany as Mock).mockResolvedValue([mockEnrollments[0]]);

    const req = new NextRequest("http://localhost/api/admin/enrollments");
    const res = await GET(req);
    const [enrollment] = await res.json();

    expect(enrollment.user).toMatchObject({
      name: "홍길동",
      email: "hong@gsm.hs.kr",
      studentNumber: 10101,
      grade: 1,
    });
    expect(enrollment.club.name).toBe("밴드부");
  });
});
