"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function utcToKstInput(utcStr: string | null): string {
  if (!utcStr) return "";
  const kst = new Date(new Date(utcStr).getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 16);
}

function kstInputToUtc(kstStr: string): string | null {
  if (!kstStr) return null;
  return new Date(kstStr + ":00+09:00").toISOString();
}

export default function AdminSettings() {
  const [openAt, setOpenAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setOpenAt(utcToKstInput(data.openAt)));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openAt: kstInputToUtc(openAt) }),
    });
    if (res.ok) {
      toast.success("저장되었습니다.");
    } else {
      toast.error("저장 실패");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">신청 오픈 시간 (공통)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="globalOpenAt" className="text-muted-foreground text-xs font-normal">
              KST 기준 · 미설정 시 즉시 오픈
            </Label>
            <Input
              id="globalOpenAt"
              type="datetime-local"
              value={openAt}
              onChange={(e) => setOpenAt(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
          {openAt && (
            <Button variant="outline" onClick={() => setOpenAt("")} disabled={saving}>
              초기화
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
