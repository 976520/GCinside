"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface Club {
  id: number;
  name: string;
  description: string;
  maxCapacity: number;
  isOpen: boolean;
  _count: { enrollments: number };
}

export default function ClubList({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, enrollRes] = await Promise.all([
        fetch("/api/clubs"),
        isLoggedIn ? fetch("/api/enrollments") : Promise.resolve(null),
      ]);
      setClubs(await clubsRes.json());
      if (enrollRes?.ok) {
        const enrollData = await enrollRes.json();
        setEnrolledIds(new Set(enrollData.map((e: { clubId: number }) => e.clubId)));
      }
      setLoading(false);
    };
    fetchData();
  }, [isLoggedIn]);

  const handleEnroll = async (clubId: number) => {
    if (!isLoggedIn) {
      window.location.href = "/api/auth/login";
      return;
    }

    setPending(clubId);

    const res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubId }),
    });

    const data = await res.json();

    if (res.ok) {
      setEnrolledIds((prev) => new Set([...prev, clubId]));
      setClubs((prev) =>
        prev.map((c) =>
          c.id === clubId
            ? { ...c, _count: { enrollments: c._count.enrollments + 1 } }
            : c
        )
      );
      toast.success("신청 완료!", { description: "동아리 신청이 완료되었습니다." });
    } else {
      toast.error("신청 실패", { description: data.error ?? "오류가 발생했습니다." });
    }

    setPending(null);
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          등록된 동아리가 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {clubs.map((club) => {
        const isFull = club._count.enrollments >= club.maxCapacity;
        const isEnrolled = enrolledIds.has(club.id);
        const isClosed = !club.isOpen;
        const pct = Math.round((club._count.enrollments / club.maxCapacity) * 100);

        return (
          <Card key={club.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {club.name}
                    {isClosed && <Badge variant="secondary">마감</Badge>}
                    {isEnrolled && <Badge>신청완료</Badge>}
                  </CardTitle>
                  <CardDescription>{club.description}</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant={isEnrolled ? "secondary" : isFull || isClosed ? "outline" : "default"}
                  disabled={isFull || isEnrolled || isClosed || pending === club.id}
                  onClick={() => handleEnroll(club.id)}
                  className="shrink-0"
                >
                  {pending === club.id
                    ? "처리중..."
                    : isEnrolled
                    ? "신청완료"
                    : isFull
                    ? "마감"
                    : isClosed
                    ? "비활성"
                    : "신청하기"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Progress value={pct} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground shrink-0">
                  {club._count.enrollments} / {club.maxCapacity}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
