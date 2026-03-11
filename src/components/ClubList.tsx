"use client";

import { useEffect, useState } from "react";

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
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, enrollRes] = await Promise.all([
        fetch("/api/clubs"),
        isLoggedIn ? fetch("/api/enrollments") : Promise.resolve(null),
      ]);
      const clubsData = await clubsRes.json();
      setClubs(clubsData);

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
    setMessage(null);

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
      setMessage({ type: "ok", text: "신청이 완료되었습니다!" });
    } else {
      setMessage({ type: "err", text: data.error ?? "오류가 발생했습니다." });
    }

    setPending(null);
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === "ok"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="grid gap-4">
        {clubs.map((club) => {
          const isFull = club._count.enrollments >= club.maxCapacity;
          const isEnrolled = enrolledIds.has(club.id);
          const isClosed = !club.isOpen;

          return (
            <div
              key={club.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-gray-900">{club.name}</h2>
                  {isClosed && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      마감
                    </span>
                  )}
                  {isEnrolled && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      신청완료
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3">{club.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isFull ? "bg-red-400" : "bg-blue-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          (club._count.enrollments / club.maxCapacity) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    {club._count.enrollments} / {club.maxCapacity}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleEnroll(club.id)}
                disabled={isFull || isEnrolled || isClosed || pending === club.id}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isEnrolled
                    ? "bg-blue-50 text-blue-600 cursor-default"
                    : isFull || isClosed
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
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
              </button>
            </div>
          );
        })}
        {clubs.length === 0 && (
          <p className="text-center text-gray-400 py-12">등록된 동아리가 없습니다.</p>
        )}
      </div>
    </>
  );
}
