"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function utcToKstInput(utcStr: string | null): string {
  if (!utcStr) return "";
  const kst = new Date(new Date(utcStr).getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 16);
}

function kstInputToUtc(kstStr: string): string | null {
  if (!kstStr) return null;
  return new Date(kstStr + ":00+09:00").toISOString();
}

function SettingsForm({ initialOpenAt }: { initialOpenAt: string }) {
  const [openAt, setOpenAt] = useState(initialOpenAt);

  const mutation = useMutation({
    mutationFn: (openAtUtc: string | null) =>
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openAt: openAtUtc }),
      }).then(async (res) => {
        if (!res.ok) throw new Error();
      }),
    onSuccess: () => toast.success("저장되었습니다."),
    onError: () => toast.error("저장 실패"),
  });

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="globalOpenAt" className="text-muted-foreground text-xs font-normal">
          KST 기준 · 미설정 시 즉시 오픈 · 동아리별 신청 활성화가 켜져 있으면 무시됨
        </Label>
        <Input
          id="globalOpenAt"
          type="datetime-local"
          value={openAt}
          onChange={(e) => setOpenAt(e.target.value)}
        />
      </div>
      <Button onClick={() => mutation.mutate(kstInputToUtc(openAt))} disabled={mutation.isPending}>
        {mutation.isPending ? "저장 중..." : "저장"}
      </Button>
      {openAt && (
        <Button
          variant="outline"
          onClick={() => {
            setOpenAt("");
            mutation.mutate(null);
          }}
          disabled={mutation.isPending}
        >
          초기화
        </Button>
      )}
    </div>
  );
}

export default function AdminSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
    staleTime: 60_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">신청 오픈 시간</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <SettingsForm
            key={settings?.openAt ?? "none"}
            initialOpenAt={utcToKstInput(settings?.openAt ?? null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
