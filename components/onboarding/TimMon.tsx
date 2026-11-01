"use client";
/**
 * Ô tìm món không thích trong database món (data/dishes.json).
 * Giai đoạn 2: database còn trống nên chỉ hiện lời nhắc; Giai đoạn 3 có món sẽ tự hoạt động.
 */
import { useState } from "react";
import danhSachMon from "@/data/dishes.json";

type MonTomTat = { id: string; name: string };
const MON = danhSachMon as MonTomTat[];

/** Bỏ dấu tiếng Việt để tìm "com tam" vẫn ra "Cơm tấm" */
function boDau(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

export function TimMonKhongThich({
  daChon,
  onDoi,
}: {
  daChon: string[];
  onDoi: (ids: string[]) => void;
}) {
  const [tuKhoa, setTuKhoa] = useState("");

  if (MON.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Danh sách món đang được nhóm chuẩn bị. Bạn có thể bỏ qua mục này và quay lại chọn sau trong trang Hồ sơ.
      </p>
    );
  }

  const ketQua =
    tuKhoa.trim() === ""
      ? []
      : MON.filter((m) => boDau(m.name).includes(boDau(tuKhoa)) && !daChon.includes(m.id)).slice(0, 6);

  return (
    <div className="flex flex-col gap-2">
      {daChon.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {daChon.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onDoi(daChon.filter((x) => x !== id))}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
              aria-label={`Bỏ ${MON.find((m) => m.id === id)?.name ?? id}`}
            >
              {MON.find((m) => m.id === id)?.name ?? id} ✕
            </button>
          ))}
        </div>
      )}
      <input
        type="search"
        value={tuKhoa}
        onChange={(e) => setTuKhoa(e.target.value)}
        placeholder="Gõ tên món, vd: cơm tấm"
        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500"
      />
      {ketQua.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => {
            onDoi([...daChon, m.id]);
            setTuKhoa("");
          }}
          className="rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
        >
          + {m.name}
        </button>
      ))}
    </div>
  );
}
