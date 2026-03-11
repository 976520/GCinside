"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["clubs"],
    queryFn: () => fetch("/api/clubs").then((r) => r.json()),
    staleTime: 30_000,
  });

  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ["admin-enrollments", selectedClub],
    queryFn: () => {
      const url = selectedClub
        ? `/api/admin/enrollments?clubId=${selectedClub}`
        : "/api/admin/enrollments";
      return fetch(url).then((r) => r.json());
    },
    staleTime: 10_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (enrollment: Enrollment) =>
      fetch(`/api/enrollments/${enrollment.id}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error();
        return enrollment;
      }),
    onSuccess: (enrollment) => {
      toast.success(`${enrollment.user.name}님의 신청이 취소되었습니다.`);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
    onError: () => toast.error("취소에 실패했습니다."),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={selectedClub || "all"}
          onValueChange={(v) => setSelectedClub(v === "all" ? "" : (v ?? ""))}
        >
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
        <span className="text-muted-foreground text-sm">{enrollments.length}명</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
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
                      <TableCell className="text-right">
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
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
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
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              아니오
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              취소하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
