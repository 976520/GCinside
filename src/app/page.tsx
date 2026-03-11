import Header from "@/components/Header";
import ClubList from "@/components/ClubList";
import { getSession } from "@/lib/session";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  const { error } = await searchParams;

  const errorMessages: Record<string, string> = {
    invalid_state: "보안 검증에 실패했습니다. 다시 시도해주세요.",
    missing_code: "인증 코드가 없습니다. 다시 시도해주세요.",
    auth_failed: "로그인에 실패했습니다. 다시 시도해주세요.",
    forbidden: "접근 권한이 없습니다.",
  };

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errorMessages[error] ?? "오류가 발생했습니다."}
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">동아리 목록</h1>
        <p className="text-gray-500 text-sm mb-6">
          원하는 동아리를 선택해 선착순으로 신청하세요.
        </p>
        <ClubList isLoggedIn={!!session.userId} />
      </main>
    </>
  );
}
