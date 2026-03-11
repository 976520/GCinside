import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

import { GET } from "@/app/api/auth/me/route";
import { getSession } from "@/lib/session";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/auth/me", () => {
  it("비로그인 → user: null", async () => {
    (getSession as Mock).mockResolvedValue({});

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user).toBeNull();
  });

  it("로그인 상태 → 세션 정보 반환", async () => {
    (getSession as Mock).mockResolvedValue({
      userId: 1,
      email: "student@gsm.hs.kr",
      name: "홍길동",
      role: "STUDENT",
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user).toEqual({
      id: 1,
      email: "student@gsm.hs.kr",
      name: "홍길동",
      role: "STUDENT",
    });
  });

  it("어드민 로그인 → role: ADMIN 반환", async () => {
    (getSession as Mock).mockResolvedValue({
      userId: 99,
      email: "admin@gsm.hs.kr",
      name: "관리자",
      role: "ADMIN",
    });

    const res = await GET();
    const body = await res.json();

    expect(body.user.role).toBe("ADMIN");
  });
});
