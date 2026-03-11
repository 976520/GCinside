"use client";

import { useEffect, useState } from "react";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = async (clubId?: string) => {
    const url = clubId
      ? `/api/admin/enrollments?clubId=${clubId}`
      : "/api/admin/enrollments";
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

  const handleClubFilter = (clubId: string) => {
    setSelectedClub(clubId);
    fetchEnrollments(clubId || undefined);
  };

  const handleEditStart = (e: Enrollment) => {
    setEditingId(e.id);
    // datetime-local 형식으로 변환
    const d = new Date(e.enrolledAt);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditDate(local);
  };

  const handleEditSave = async (id: number) => {
    await fetch(`/api/enrollments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrolledAt: new Date(editDate).toISOString() }),
    });
    setEditingId(null);
    fetchEnrollments(selectedClub || undefined);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("신청을 취소하시겠습니까?")) return;
    await fetch(`/api/enrollments/${id}`, { method: "DELETE" });
    fetchEnrollments(selectedClub || undefined);
  };

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500">동아리 필터:</label>
        <select
          value={selectedClub}
          onChange={(e) => handleClubFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">전체</option>
          {clubs.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">{enrollments.length}명</span>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">학생</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">학번</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">동아리</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">신청 시간</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{e.user.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {e.user.studentNumber ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.club.name}</td>
                    <td className="px-4 py-3">
                      {editingId === e.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            value={editDate}
                            onChange={(ev) => setEditDate(ev.target.value)}
                            className="border border-gray-200 rounded px-2 py-1 text-xs"
                          />
                          <button
                            onClick={() => handleEditSave(e.id)}
                            className="text-blue-600 text-xs hover:underline"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 text-xs hover:underline"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">
                          {new Date(e.enrolledAt).toLocaleString("ko-KR")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {editingId !== e.id && (
                        <>
                          <button
                            onClick={() => handleEditStart(e)}
                            className="text-blue-600 hover:underline text-xs mr-3"
                          >
                            시간 수정
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="text-red-500 hover:underline text-xs"
                          >
                            취소
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {enrollments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      신청 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
