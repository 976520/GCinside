import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    enrollment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

import { GET, POST } from "@/app/api/enrollments/route";
import { DELETE } from "@/app/api/enrollments/[id]/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const studentSession = { role: "STUDENT", userId: 10 };
const adminSession = { role: "ADMIN", userId: 1 };

const mockClub = {
  id: 1,
  grade1Capacity: 5,
  grade23Capacity: 10,
  isOpen: false,
};

const mockSettings = {
  id: 1,
  openAt: null,
  enrollmentEnabled: false,
};

const mockUser = { grade: 1 };

const mockEnrollment = {
  id: 100,
  userId: 10,
  clubId: 1,
  enrolledAt: new Date(),
  club: mockClub,
};

function makeTx(overrides: Record<string, unknown> = {}) {
  return {
    club: { findUnique: vi.fn().mockResolvedValue(mockClub) },
    settings: { findUnique: vi.fn().mockResolvedValue(mockSettings) },
    user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
    enrollment: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue(mockEnrollment),
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/enrollments", () => {
  it("비로그인 → 401", async () => {
    (getSession as Mock).mockResolvedValue({});

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("본인 신청 목록 반환", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);
    (prisma.enrollment.findMany as Mock).mockResolvedValue([mockEnrollment]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(100);
    expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 10 } })
    );
  });
});

describe("POST /api/enrollments", () => {
  it("비로그인 → 401", async () => {
    (getSession as Mock).mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/enrollments", {
      method: "POST",
      body: JSON.stringify({ clubId: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("clubId 없음 → 400", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);

    const req = new NextRequest("http://localhost/api/enrollments", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("동아리 없음 → 404", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);
    const tx = makeTx({ club: { findUnique: vi.fn().mockResolvedValue(null) } });
    (prisma.$transaction as Mock).mockImplementation(
      (fn: (tx: ReturnType<typeof makeTx>) => unknown) => fn(tx)
    );

    const req = new NextRequest("http://localhost/api/enrollments", {
      method: "POST",
      body: JSON.stringify({ clubId: 999 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it("아직 오픈 전 (isOpen=false, openAt 미래) → 409", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);
    const futureSettings = { openAt: new Date(Date.now() + 3_600_000) };
    const tx = makeTx({
      club: { findUnique: vi.fn().mockResolvedValue({ ...mockClub, isOpen: false }) },
      settings: { findUnique: vi.fn().mockResolvedValue(futureSettings) },
    });
    (prisma.$transaction as Mock).mockImplementation(
      (fn: (tx: ReturnType<typeof makeTx>) => unknown) => fn(tx)
    );

    const req = new NextRequest("http://localhost/api/enrollments", {
      method: "POST",
      body: JSON.stringify({ clubId: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/신청 시간/);
  });

  it("isOpen=true → openAt 미래여도 신청 가능", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);
    const futureSettings = { openAt: new Date(Date.now() + 3_600_000) };
    const tx = makeTx({
      club: { findUnique: vi.fn().mockResolvedValue({ ...mockClub, isOpen: true }) },
      settings: { findUnique: vi.fn().mockResolvedValue(futureSettings) },
    });
    (prisma.$transaction as Mock).mockImplementation(
      (fn: (tx: ReturnType<typeof makeTx>) => unknown) => fn(tx)
    );

    const req = new NextRequest("http://localhost/api/enrollments", {
      method: "POST",
      body: JSON.stringify({ clubId: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it("학년 정보 없음 → 400", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);
    const tx = makeTx({ user: { findUnique: vi.fn().mockResolvedValue({ grade: null }) } });
    (prisma.$transaction as Mock).mockImplementation(
      (fn: (tx: ReturnType<typeof makeTx>) => unknown) => fn(tx)
    );

    const req = new NextRequest("http://localhost/api/enrollments", {
      method: "POST",
      body: JSON.stringify({ clubId: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/학년/);
  });

  it("해당 학년 신청 불가 (정원 0) → 409", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);
    const tx = makeTx({
      club: {
        findUnique: vi.fn().mockResolvedValue({ ...mockClub, grade1Capacity: 0 }),
      },
    });
    (prisma.$transaction as Mock).mockImplementation(
      (fn: (tx: ReturnType<typeof makeTx>) => unknown) => fn(tx)
    );

    const req = new NextRequest("http://localhost/api/enrollments", {
      method: "POST",
      body: JSON.stringify({ clubId: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/신청할 수 없는/);
  });

  it("학년 정원 마감 → 409", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);
    const tx = makeTx({
      enrollment: {
        count: vi.fn().mockResolvedValue(5),
        create: vi.fn(),
      },
    });
    (prisma.$transaction as Mock).mockImplementation(
      (fn: (tx: ReturnType<typeof makeTx>) => unknown) => fn(tx)
    );

    const req = new NextRequest("http://localhost/api/enrollments", {
      method: "POST",
      body: JSON.stringify({ clubId: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/정원/);
  });

  it("정상 신청 → 201", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);
    const tx = makeTx();
    (prisma.$transaction as Mock).mockImplementation(
      (fn: (tx: ReturnType<typeof makeTx>) => unknown) => fn(tx)
    );

    const req = new NextRequest("http://localhost/api/enrollments", {
      method: "POST",
      body: JSON.stringify({ clubId: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.clubId).toBe(1);
  });

  it("중복 신청 → 409", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);
    const error = new Error("Unique constraint failed on the fields: (`userId`,`clubId`)");
    (prisma.$transaction as Mock).mockRejectedValue(error);

    const req = new NextRequest("http://localhost/api/enrollments", {
      method: "POST",
      body: JSON.stringify({ clubId: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/이미 신청/);
  });
});

// ──────────────────────────────────────
// DELETE /api/enrollments/[id]
// ──────────────────────────────────────
describe("DELETE /api/enrollments/[id]", () => {
  it("비로그인 → 401", async () => {
    (getSession as Mock).mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/enrollments/100");
    const res = await DELETE(req, { params: Promise.resolve({ id: "100" }) });

    expect(res.status).toBe(401);
  });

  it("존재하지 않는 신청 → 404", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);
    (prisma.enrollment.findUnique as Mock).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/enrollments/999");
    const res = await DELETE(req, { params: Promise.resolve({ id: "999" }) });

    expect(res.status).toBe(404);
  });

  it("타인 신청을 학생이 삭제 → 403", async () => {
    (getSession as Mock).mockResolvedValue({ ...studentSession, userId: 99 });
    (prisma.enrollment.findUnique as Mock).mockResolvedValue({ ...mockEnrollment, userId: 10 });

    const req = new NextRequest("http://localhost/api/enrollments/100");
    const res = await DELETE(req, { params: Promise.resolve({ id: "100" }) });

    expect(res.status).toBe(403);
  });

  it("본인 신청 취소 → 200", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);
    (prisma.enrollment.findUnique as Mock).mockResolvedValue(mockEnrollment);
    (prisma.enrollment.delete as Mock).mockResolvedValue(mockEnrollment);

    const req = new NextRequest("http://localhost/api/enrollments/100");
    const res = await DELETE(req, { params: Promise.resolve({ id: "100" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("어드민은 타인 신청도 취소 가능", async () => {
    (getSession as Mock).mockResolvedValue(adminSession);
    (prisma.enrollment.findUnique as Mock).mockResolvedValue({ ...mockEnrollment, userId: 99 });
    (prisma.enrollment.delete as Mock).mockResolvedValue(mockEnrollment);

    const req = new NextRequest("http://localhost/api/enrollments/100");
    const res = await DELETE(req, { params: Promise.resolve({ id: "100" }) });

    expect(res.status).toBe(200);
  });
});
