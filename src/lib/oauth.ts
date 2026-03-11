/**
 * Datagsm OAuth 2.0 + PKCE 헬퍼
 * https://oauth.data.hellogsm.kr
 */

const OAUTH_BASE = "https://oauth.data.hellogsm.kr";
const USERINFO_BASE = "https://oauth-userinfo.data.hellogsm.kr";

// ─── PKCE ────────────────────────────────────────────────────────────────────

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// ─── Authorization URL ───────────────────────────────────────────────────────

export async function buildAuthorizationUrl(
  codeVerifier: string,
  state: string
): Promise<string> {
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const params = new URLSearchParams({
    client_id: process.env.OAUTH_CLIENT_ID!,
    redirect_uri: process.env.OAUTH_REDIRECT_URI!,
    response_type: "code",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${OAUTH_BASE}/v1/oauth/authorize?${params.toString()}`;
}

// ─── Token Exchange ──────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const res = await fetch(`${OAUTH_BASE}/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: process.env.OAUTH_CLIENT_ID!,
      redirect_uri: process.env.OAUTH_REDIRECT_URI!,
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${err}`);
  }

  return res.json();
}

// ─── UserInfo ────────────────────────────────────────────────────────────────

export interface DatagsmUser {
  id: number;
  email: string;
  role: string;
  isStudent: boolean;
  student: {
    id: number;
    name: string;
    sex: "MAN" | "WOMAN";
    grade: number;
    classNum: number;
    number: number;
    studentNumber: number;
    major: string;
    dormitoryFloor: number;
    dormitoryRoom: number;
    role: string;
    isLeaveSchool: boolean;
  } | null;
}

export async function fetchUserInfo(accessToken: string): Promise<DatagsmUser> {
  const res = await fetch(`${USERINFO_BASE}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`UserInfo fetch failed: ${res.status}`);
  }

  return res.json();
}

// ─── Admin Check ─────────────────────────────────────────────────────────────

export function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}
