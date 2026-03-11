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

const emptyForm = { name: "", description: "", maxCapacity: 0, isOpen: true };

export default function AdminClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClubs = async () => {
    const res = await fetch("/api/clubs");
    setClubs(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchClubs(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId !== null) {
      await fetch(`/api/clubs/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm(emptyForm);
    setEditId(null);
    fetchClubs();
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

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/clubs/${id}`, { method: "DELETE" });
    fetchClubs();
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  return (
    <div className="space-y-6">
      {/* 폼 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
      >
        <h3 className="font-medium text-gray-800">
          {editId !== null ? "동아리 수정" : "동아리 추가"}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">동아리명</label>
            <input
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">최대 정원</label>
            <input
              required
              type="number"
              min={1}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.maxCapacity || ""}
              onChange={(e) => setForm((f) => ({ ...f, maxCapacity: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">설명</label>
          <textarea
            required
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isOpen"
            checked={form.isOpen}
            onChange={(e) => setForm((f) => ({ ...f, isOpen: e.target.checked }))}
          />
          <label htmlFor="isOpen" className="text-sm text-gray-600">신청 활성화</label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            {editId !== null ? "저장" : "추가"}
          </button>
          {editId !== null && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {/* 목록 */}
      {loading ? (
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">동아리명</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">신청/정원</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clubs.map((club) => (
                <tr key={club.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{club.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {club._count.enrollments} / {club.maxCapacity}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        club.isOpen
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {club.isOpen ? "활성" : "마감"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(club)}
                      className="text-blue-600 hover:underline text-xs mr-3"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(club.id)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {clubs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    등록된 동아리가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
