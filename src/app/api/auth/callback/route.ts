import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeCodeForToken, fetchUserInfo, isAdminEmail } from "@/lib/oauth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const session = await getSession();

  // CSRF 검증
  if (!state || state !== session.oauthState) {
    return NextResponse.redirect(new URL("/?error=invalid_state", req.url));
  }

  if (!code || !session.codeVerifier) {
    return NextResponse.redirect(new URL("/?error=missing_code", req.url));
  }

  try {
    // 토큰 교환
    const tokens = await exchangeCodeForToken(code, session.codeVerifier);

    // 유저 정보 조회
    const oauthUser = await fetchUserInfo(tokens.access_token);

    // DB에 upsert
    const role = isAdminEmail(oauthUser.email) ? "ADMIN" : "STUDENT";

    const user = await prisma.user.upsert({
      where: { oauthId: oauthUser.id },
      update: {
        email: oauthUser.email,
        name: oauthUser.student?.name ?? oauthUser.email,
        studentNumber: oauthUser.student?.studentNumber ?? null,
        grade: oauthUser.student?.grade ?? null,
        classNum: oauthUser.student?.classNum ?? null,
        number: oauthUser.student?.number ?? null,
        major: oauthUser.student?.major ?? null,
        role,
        refreshToken: tokens.refresh_token ?? null,
      },
      create: {
        oauthId: oauthUser.id,
        email: oauthUser.email,
        name: oauthUser.student?.name ?? oauthUser.email,
        studentNumber: oauthUser.student?.studentNumber ?? null,
        grade: oauthUser.student?.grade ?? null,
        classNum: oauthUser.student?.classNum ?? null,
        number: oauthUser.student?.number ?? null,
        major: oauthUser.student?.major ?? null,
        role,
        refreshToken: tokens.refresh_token ?? null,
      },
    });

    session.userId = user.id;
    session.email = user.email;
    session.name = user.name;
    session.role = user.role;
    session.grade = user.grade ?? null;
    session.codeVerifier = undefined;
    session.oauthState = undefined;
    await session.save();

    return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin" : "/", req.url));
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/?error=auth_failed", req.url));
  }
}
