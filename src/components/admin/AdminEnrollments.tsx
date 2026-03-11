"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Enrollment {
  id: number;
  enrolledAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    studentNumber: number | null;
    grade: number | null;
    classNum: number | null;
    number: number | null;
    major: string | null;
  };
  club: { id: number; name: string };
}

interface Club {
  id: number;
  name: string;
}

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<Enrollment | null>(null);
  const [editDate, setEditDate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);

  const fetchEnrollments = async (clubId?: string) => {
    setLoading(true);
    const url = clubId ? `/api/admin/enrollments?clubId=${clubId}` : "/api/admin/enrollments";
    const res = await fetch(url);
    setEnrollments(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    const fetchClubs = async () => {
      const res = await fetch("/api/clubs");
      setClubs(await res.json());
    };
    fetchClubs();
    fetchEnrollments();
  }, []);

  const handleClubFilter = (value: string | null) => {
    const clubId = !value || value === "all" ? "" : value;
    setSelectedClub(clubId);
    fetchEnrollments(clubId || undefined);
  };

  const handleEditOpen = (e: Enrollment) => {
    setEditTarget(e);
    const d = new Date(e.enrolledAt);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditDate(local);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    const res = await fetch(`/api/enrollments/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrolledAt: new Date(editDate).toISOString() }),
    });
    if (res.ok) {
      toast.success("신청 시간이 수정되었습니다.");
      setEditTarget(null);
      fetchEnrollments(selectedClub || undefined);
    } else {
      toast.error("수정에 실패했습니다.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/enrollments/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`${deleteTarget.user.name}님의 신청이 취소되었습니다.`);
      fetchEnrollments(selectedClub || undefined);
    } else {
      toast.error("취소에 실패했습니다.");
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedClub || "all"} onValueChange={handleClubFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="동아리 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {clubs.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{enrollments.length}명</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학생</TableHead>
                    <TableHead>학번</TableHead>
                    <TableHead>동아리</TableHead>
                    <TableHead>신청 시간</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.user.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.user.studentNumber ?? "-"}
                      </TableCell>
                      <TableCell>{e.club.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(e.enrolledAt).toLocaleString("ko-KR")}
                      </TableCell>
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditOpen(e)}
                        >
                          시간 수정
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(e)}
                        >
                          취소
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {enrollments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        신청 내역이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신청 시간 수정</DialogTitle>
            <DialogDescription>
              {editTarget?.user.name}님의 <strong>{editTarget?.club.name}</strong> 신청 시간을 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="editDate">신청 시간</Label>
            <Input
              id="editDate"
              type="datetime-local"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>취소</Button>
            <Button onClick={handleEditSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신청 취소</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.user.name}</strong>님의{" "}
              <strong>{deleteTarget?.club.name}</strong> 신청을 취소하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>아니오</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>취소하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
