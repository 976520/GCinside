import Header from "@/components/Header";
import AdminClubs from "@/components/admin/AdminClubs";
import AdminEnrollments from "@/components/admin/AdminEnrollments";

export default function AdminPage() {
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">관리 페이지</h1>
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">동아리 관리</h2>
            <AdminClubs />
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">신청 현황</h2>
            <AdminEnrollments />
          </section>
        </div>
      </main>
    </>
  );
}
