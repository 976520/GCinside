import Header from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfileLoading() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        <section>
          <h1 className="mb-4 text-2xl font-bold">My Profile</h1>
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">신청한 동아리</h2>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
