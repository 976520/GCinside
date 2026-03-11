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
  maxCapacity: number;
  isOpen: boolean;
  _count: { enrollments: number };
}

const emptyForm = { name: "", description: "", maxCapacity: 0, isOpen: true };

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

  useEffect(() => { fetchClubs(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = editId !== null
      ? await fetch(`/api/clubs/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/clubs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
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
      maxCapacity: club.maxCapacity,
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
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="maxCapacity">최대 정원</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min={1}
                  required
                  value={form.maxCapacity || ""}
                  onChange={(e) => setForm((f) => ({ ...f, maxCapacity: Number(e.target.value) }))}
                />
              </div>
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="isOpen"
                checked={form.isOpen}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isOpen: !!v }))}
              />
              <Label htmlFor="isOpen" className="font-normal cursor-pointer">
                신청 활성화
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
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>동아리명</TableHead>
                  <TableHead>신청 / 정원</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell className="font-medium">{club.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {club._count.enrollments} / {club.maxCapacity}
                    </TableCell>
                    <TableCell>
                      <Badge variant={club.isOpen ? "default" : "secondary"}>
                        {club.isOpen ? "활성" : "마감"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(club)}
                      >
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
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
              <strong>"{deleteTarget?.name}"</strong> 동아리를 삭제하면 모든 신청 내역도 함께 삭제됩니다.
              계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
