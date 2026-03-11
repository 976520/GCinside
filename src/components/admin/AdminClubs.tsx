"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Club {
  id: number;
  name: string;
  description: string;
  grade1Capacity: number;
  grade23Capacity: number;
  isOpen: boolean;
  gradeEnrollments: { grade1: number; grade23: number };
  _count: { enrollments: number };
}

const emptyForm = {
  name: "",
  description: "",
  grade1Capacity: 0,
  grade23Capacity: 0,
  isOpen: true,
};

export default function AdminClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);

  const fetchClubs = async () => {
    const res = await fetch("/api/clubs");
    setClubs(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchClubs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description,
      grade1Capacity: form.grade1Capacity,
      grade23Capacity: form.grade23Capacity,
      isOpen: form.isOpen,
    };

    const res =
      editId !== null
        ? await fetch(`/api/clubs/${editId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/clubs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

    if (res.ok) {
      toast.success(editId !== null ? "동아리가 수정되었습니다." : "동아리가 추가되었습니다.");
      setForm(emptyForm);
      setEditId(null);
      fetchClubs();
    } else {
      const data = await res.json();
      toast.error("저장 실패", { description: data.error });
    }

    setSubmitting(false);
  };

  const handleEdit = (club: Club) => {
    setEditId(club.id);
    setForm({
      name: club.name,
      description: club.description,
      grade1Capacity: club.grade1Capacity,
      grade23Capacity: club.grade23Capacity,
      isOpen: club.isOpen,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/clubs/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`"${deleteTarget.name}" 동아리가 삭제되었습니다.`);
      fetchClubs();
    } else {
      toast.error("삭제에 실패했습니다.");
    }
    setDeleteTarget(null);
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {editId !== null ? "동아리 수정" : "동아리 추가"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">동아리명</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                required
                rows={3}
                className="resize-none"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-2 block">학년별 정원</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="grade1Capacity"
                    className="text-muted-foreground text-xs font-normal"
                  >
                    1학년 정원
                  </Label>
                  <Input
                    id="grade1Capacity"
                    type="number"
                    min={0}
                    required
                    value={form.grade1Capacity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, grade1Capacity: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="grade23Capacity"
                    className="text-muted-foreground text-xs font-normal"
                  >
                    2·3학년 정원
                  </Label>
                  <Input
                    id="grade23Capacity"
                    type="number"
                    min={0}
                    required
                    value={form.grade23Capacity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, grade23Capacity: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">
                0으로 설정하면 해당 학년은 신청 불가
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isOpen"
                checked={form.isOpen}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isOpen: !!v }))}
              />
              <Label htmlFor="isOpen" className="cursor-pointer font-normal">
                오픈 시간 관계없이 즉시 신청 가능
              </Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "저장 중..." : editId !== null ? "저장" : "추가"}
              </Button>
              {editId !== null && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  취소
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>동아리명</TableHead>
                  <TableHead>1학년</TableHead>
                  <TableHead>2·3학년</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell className="font-medium">{club.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {club.grade1Capacity > 0
                        ? `${club.gradeEnrollments.grade1} / ${club.grade1Capacity}`
                        : "불가"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {club.grade23Capacity > 0
                        ? `${club.gradeEnrollments.grade23} / ${club.grade23Capacity}`
                        : "불가"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={club.isOpen ? "default" : "secondary"}>
                        {club.isOpen ? "활성" : "대기"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(club)}>
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(club)}
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {clubs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      등록된 창체동아리가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>동아리 삭제</DialogTitle>
            <DialogDescription>
              <strong>&quot;{deleteTarget?.name}&quot;</strong> 동아리를 삭제하면 모든 신청 내역도
              함께 삭제됩니다. 계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
