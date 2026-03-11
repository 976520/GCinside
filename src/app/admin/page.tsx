import Header from "@/components/Header";
import AdminClubs from "@/components/admin/AdminClubs";
import AdminEnrollments from "@/components/admin/AdminEnrollments";
import { Separator } from "@/components/ui/separator";

export default function AdminPage() {
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Admin page</h1>
        <div className="space-y-10">
          <section>
            <AdminClubs />
          </section>
          <Separator />
          <section>
            <h2 className="text-lg font-semibold mb-4">신청 현황</h2>
            <AdminEnrollments />
          </section>
        </div>
      </main>
    </>
  );
}
