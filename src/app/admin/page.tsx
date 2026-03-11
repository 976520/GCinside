import Header from "@/components/Header";
import AdminClubs from "@/components/admin/AdminClubs";
import AdminEnrollments from "@/components/admin/AdminEnrollments";
import AdminSettings from "@/components/admin/AdminSettings";
import { Separator } from "@/components/ui/separator";

export default function AdminPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-8 text-2xl font-bold">Admin page</h1>
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-lg font-semibold">전체 설정</h2>
            <AdminSettings />
          </section>
          <Separator />
          <section>
            <AdminClubs />
          </section>
          <Separator />
          <section>
            <h2 className="mb-4 text-lg font-semibold">신청 현황</h2>
            <AdminEnrollments />
          </section>
        </div>
      </main>
    </>
  );
}
