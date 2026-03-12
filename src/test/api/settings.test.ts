import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    settings: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

import { GET, PATCH } from "@/app/api/settings/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const adminSession = { role: "ADMIN", userId: 1 };
const studentSession = { role: "STUDENT", userId: 2 };

const mockSettings = {
  id: 1,
  openAt: null,
  enrollmentEnabled: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/settings", () => {
  it("설정 반환", async () => {
    (prisma.settings.upsert as Mock).mockResolvedValue(mockSettings);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(1);
  });

  it("설정 없으면 기본값 생성 (upsert 호출)", async () => {
    (prisma.settings.upsert as Mock).mockResolvedValue(mockSettings);

    await GET();

    expect(prisma.settings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, create: { id: 1 } })
    );
  });
});

describe("PATCH /api/settings", () => {
  it("비어드민 → 403", async () => {
    (getSession as Mock).mockResolvedValue(studentSession);

    const req = new NextRequest("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ openAt: null }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);

    expect(res.status).toBe(403);
    expect(prisma.settings.upsert).not.toHaveBeenCalled();
  });

  it("openAt 저장", async () => {
    (getSession as Mock).mockResolvedValue(adminSession);
    const openAtDate = new Date("2026-04-01T00:00:00.000Z");
    (prisma.settings.upsert as Mock).mockResolvedValue({ ...mockSettings, openAt: openAtDate });

    const req = new NextRequest("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ openAt: "2026-04-01T00:00:00.000Z" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.settings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ openAt: expect.any(Date) }),
      })
    );
    expect(body.openAt).toBeTruthy();
  });

  it("openAt null → openAt 초기화", async () => {
    (getSession as Mock).mockResolvedValue(adminSession);
    (prisma.settings.upsert as Mock).mockResolvedValue(mockSettings);

    const req = new NextRequest("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ openAt: null }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    expect(prisma.settings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ openAt: null }),
      })
    );
  });
});
