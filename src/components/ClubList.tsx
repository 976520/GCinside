"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const PIN_STORAGE_KEY = "pinned_clubs";
const MAX_PINS = 3;

interface Club {
  id: number;
  name: string;
  description: string;
  grade1Capacity: number;
  grade23Capacity: number;
  isOpen: boolean;
  openAt: string | null;
  _count: { enrollments: number };
  gradeEnrollments: { grade1: number; grade23: number };
}

function formatKST(utcStr: string): string {
  return new Date(utcStr).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClubList({
  isLoggedIn,
  userGrade,
}: {
  isLoggedIn: boolean;
  userGrade?: number | null;
}) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [pinnedIds, setPinnedIds] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(PIN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

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

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const togglePin = (clubId: number) => {
    setPinnedIds((prev) => {
      let next: number[];
      if (prev.includes(clubId)) {
        next = prev.filter((id) => id !== clubId);
      } else {
        if (prev.length >= MAX_PINS) {
          toast.error(`핀은 최대 ${MAX_PINS}개까지만 가능합니다.`);
          return prev;
        }
        next = [...prev, clubId];
      }
      localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

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
            ? {
                ...c,
                _count: { enrollments: c._count.enrollments + 1 },
                gradeEnrollments: {
                  ...c.gradeEnrollments,
                  ...(userGrade === 1 && { grade1: c.gradeEnrollments.grade1 + 1 }),
                  ...((userGrade === 2 || userGrade === 3) && {
                    grade23: c.gradeEnrollments.grade23 + 1,
                  }),
                },
              }
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
              <Skeleton className="mt-1 h-4 w-64" />
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
        <CardContent className="text-muted-foreground py-12 text-center">
          등록된 동아리가 없습니다.
        </CardContent>
      </Card>
    );
  }

  const sortedClubs = [
    ...clubs.filter((c) => pinnedIds.includes(c.id)),
    ...clubs.filter((c) => !pinnedIds.includes(c.id)),
  ];

  return (
    <div className="grid gap-4">
      {sortedClubs.map((club) => {
        const isEnrolled = enrolledIds.has(club.id);
        const isClosed = !club.isOpen;
        const isNotOpenYet = !!club.openAt && now < new Date(club.openAt);
        const isPinned = pinnedIds.includes(club.id);

        const gradeCount =
          userGrade === 1
            ? club.gradeEnrollments.grade1
            : userGrade === 2 || userGrade === 3
              ? club.gradeEnrollments.grade23
              : null;

        const gradeCapacity =
          userGrade === 1
            ? club.grade1Capacity
            : userGrade === 2 || userGrade === 3
              ? club.grade23Capacity
              : null;

        const isGradeFull =
          gradeCapacity !== null &&
          gradeCapacity > 0 &&
          gradeCount !== null &&
          gradeCount >= gradeCapacity;
        const isGradeNotAllowed = gradeCapacity === 0;

        const disabled =
          isClosed ||
          isNotOpenYet ||
          isEnrolled ||
          isGradeFull ||
          isGradeNotAllowed ||
          pending === club.id;

        const buttonLabel =
          pending === club.id
            ? "처리중..."
            : isEnrolled
              ? "신청완료"
              : isClosed
                ? "비활성"
                : isNotOpenYet
                  ? "신청 전"
                  : isGradeNotAllowed
                    ? "신청불가"
                    : isGradeFull
                      ? "마감"
                      : "신청하기";

        const grades = [
          {
            label: "1학년",
            count: club.gradeEnrollments.grade1,
            capacity: club.grade1Capacity,
            isMyGrade: userGrade === 1,
          },
          {
            label: "2·3학년",
            count: club.gradeEnrollments.grade23,
            capacity: club.grade23Capacity,
            isMyGrade: userGrade === 2 || userGrade === 3,
          },
        ];

        return (
          <Card key={club.id} className={isPinned ? "border-primary/50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {club.name}
                    {isClosed && <Badge variant="secondary">비활성</Badge>}
                    {isNotOpenYet && <Badge variant="outline">신청 전</Badge>}
                    {isEnrolled && <Badge>신청완료</Badge>}
                  </CardTitle>
                  <CardDescription>{club.description}</CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => togglePin(club.id)}
                    className={`rounded-md p-1.5 transition-colors ${
                      isPinned ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={isPinned ? "핀 해제" : "상단 고정"}
                  >
                    <Pin className="h-4 w-4" fill={isPinned ? "currentColor" : "none"} />
                  </button>
                  <Button
                    size="sm"
                    variant={isEnrolled ? "secondary" : disabled ? "outline" : "default"}
                    disabled={disabled}
                    onClick={() => handleEnroll(club.id)}
                  >
                    {buttonLabel}
                  </Button>
                </div>
              </div>
              {club.openAt && (
                <p className="text-muted-foreground text-xs">
                  {isNotOpenYet
                    ? `신청 오픈: ${formatKST(club.openAt)}`
                    : `오픈됨: ${formatKST(club.openAt)}`}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {grades.map(({ label, count, capacity, isMyGrade }) => {
                  if (capacity === 0) return null;
                  const pct = Math.round((count / capacity) * 100);
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span
                        className={`w-12 shrink-0 text-xs ${isMyGrade ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                      >
                        {label}
                      </span>
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span
                        className={`shrink-0 text-xs tabular-nums ${isMyGrade ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                      >
                        {count} / {capacity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
