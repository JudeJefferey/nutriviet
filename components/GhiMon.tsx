"use client";
/**
 * Khung ghi món đã ăn: tìm món trong database → chọn bữa → chọn khẩu phần → Lưu.
 * Dùng cho cả "Ghi món đã ăn" và "Lỡ ăn rồi" (món ngoài kế hoạch).
 * Số liệu dinh dưỡng do engine tính (món × hệ số khẩu phần), người dùng không tự nhập số.
 */
import { useState } from "react";
import { NutChinh, NutPhu } from "@/components/ui";
import {
  CAC_KHAU_PHAN,
  dinhDuongKhauPhan,
  type Bua,
  type KhauPhan,
  type Mon,
} from "@/lib/engine/dishes";
import { so } from "@/lib/engine/explain";
import type { MonDaAn } from "@/lib/engine/tracking";
import { NHAN_BUA, NHAN_KHAU_PHAN } from "@/lib/labels";
import { DANH_SACH_MON } from "@/lib/monAn";
import { boDau } from "@/lib/text";

export function GhiMon({
  loAn,
  cacBua,
  buaMacDinh,
  anSo,
  onLuu,
  onHuy,
}: {
  loAn: boolean; // true = "Lỡ ăn rồi"
  cacBua: Bua[];
  buaMacDinh: Bua;
  anSo: boolean; // chế độ Đơn giản: ẩn calo
  onLuu: (m: Omit<MonDaAn, "id">) => void;
  onHuy: () => void;
}) {
  const [tuKhoa, setTuKhoa] = useState("");
  const [mon, setMon] = useState<Mon | null>(null);
  const [bua, setBua] = useState<Bua>(buaMacDinh);
  const [khauPhan, setKhauPhan] = useState<KhauPhan>("vua");

  const ketQua =
    tuKhoa.trim() === ""
      ? DANH_SACH_MON
      : DANH_SACH_MON.filter((m) => boDau(m.name).includes(boDau(tuKhoa)));

  return (
    <section className="flex flex-col gap-3 rounded-2xl border-2 border-emerald-200 bg-white p-4">
      <h2 className="font-semibold text-gray-900">
        {loAn ? "Lỡ ăn rồi — bạn đã ăn gì?" : "Ghi món đã ăn"}
      </h2>
      {loAn && (
        <p className="-mt-2 text-sm text-gray-600">
          Không sao cả, cứ ghi lại để mình điều chỉnh nhẹ nhàng cho bạn nhé.
        </p>
      )}

      {!mon ? (
        <>
          <input
            type="search"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm món, vd: pho bo"
            aria-label="Tìm món"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
          <ul className="flex max-h-64 flex-col overflow-y-auto">
            {ketQua.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setMon(m)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {m.name}
                </button>
              </li>
            ))}
            {ketQua.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">
                Chưa có món này trong danh sách.
              </li>
            )}
          </ul>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">{mon.name}</p>
            <button
              type="button"
              onClick={() => setMon(null)}
              className="text-sm text-gray-600 underline"
            >
              Chọn món khác
            </button>
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold text-gray-800">Bữa</p>
            <div className="flex flex-wrap gap-2">
              {cacBua.map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={b === bua}
                  onClick={() => setBua(b)}
                  className={`rounded-full border-2 px-3 py-1 text-sm ${
                    b === bua
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  {NHAN_BUA[b]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold text-gray-800">
              Khẩu phần
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CAC_KHAU_PHAN.map((kp) => (
                <button
                  key={kp}
                  type="button"
                  aria-pressed={kp === khauPhan}
                  onClick={() => setKhauPhan(kp)}
                  className={`rounded-xl border-2 px-2 py-2 text-sm ${
                    kp === khauPhan
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  <span className="block font-medium">
                    {NHAN_KHAU_PHAN[kp]}
                  </span>
                  {!anSo && (
                    <span className="text-xs text-gray-500">
                      {so(dinhDuongKhauPhan(mon, kp).kcal)} kcal
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <NutChinh
            onClick={() =>
              onLuu({
                monId: mon.id,
                khauPhan,
                bua,
                ngoaiKeHoach: loAn,
                dinhDuong: dinhDuongKhauPhan(mon, khauPhan),
              })
            }
          >
            Lưu
          </NutChinh>
        </>
      )}
      <NutPhu onClick={onHuy}>Đóng</NutPhu>
    </section>
  );
}
