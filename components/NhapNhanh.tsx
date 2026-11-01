"use client";
/**
 * Ô "Nhập nhanh" — gõ câu tự nhiên, vd "trưa ăn cơm tấm sườn hơi nhiều".
 * Máy chủ nhờ AI hiểu câu (hoặc dùng cách dò từ khóa nếu AI lỗi), rồi hiện thẻ xác nhận.
 * Người dùng bấm Lưu mới ghi; calo do engine tính (món × khẩu phần), không phải AI.
 */
import { useState } from "react";
import { NutChinh } from "@/components/ui";
import { DO_DAI_CAU_NHAP_TOI_DA } from "@/lib/config";
import {
  CAC_KHAU_PHAN,
  dinhDuongKhauPhan,
  type Bua,
  type KhauPhan,
} from "@/lib/engine/dishes";
import { so } from "@/lib/engine/explain";
import type { MonDaAn } from "@/lib/engine/tracking";
import { NHAN_BUA, NHAN_KHAU_PHAN } from "@/lib/labels";
import { timMon } from "@/lib/monAn";

interface KetQua {
  nguon: "ai" | "du_phong";
  monId: string | null;
  bua: Bua;
  khauPhan: KhauPhan;
  goiY: string[];
}

export function NhapNhanh({
  cacBua,
  buaMacDinh,
  anSo,
  onLuu,
}: {
  cacBua: Bua[];
  buaMacDinh: Bua;
  anSo: boolean;
  onLuu: (m: Omit<MonDaAn, "id">) => void;
}) {
  const [cau, setCau] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQua | null>(null);

  async function gui() {
    if (!cau.trim()) return;
    setDangGui(true);
    setLoi(null);
    try {
      const res = await fetch("/api/ai/nhap-mon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cauNhap: cau, cacBua, buaMacDinh }),
      });
      if (!res.ok) throw new Error();
      setKq((await res.json()) as KetQua);
    } catch {
      setLoi(
        'Mình chưa xử lý được câu này. Bạn thử lại hoặc dùng nút "Ghi món đã ăn" nhé.',
      );
    } finally {
      setDangGui(false);
    }
  }

  const mon = kq?.monId ? timMon(kq.monId) : undefined;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <label htmlFor="nhap-nhanh" className="font-semibold text-gray-900">
        Nhập nhanh
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="nhap-nhanh"
          type="text"
          value={cau}
          maxLength={DO_DAI_CAU_NHAP_TOI_DA}
          onChange={(e) => setCau(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && gui()}
          placeholder="vd: trưa ăn cơm tấm sườn hơi nhiều"
          className="min-w-0 flex-1 rounded-xl border-2 border-gray-200 px-3 py-2 outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={gui}
          disabled={dangGui || !cau.trim()}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50"
        >
          {dangGui ? "…" : "Gửi"}
        </button>
      </div>
      {dangGui && (
        <p className="mt-2 text-sm text-gray-500">Đang hiểu câu của bạn…</p>
      )}
      {loi && <p className="mt-2 text-sm text-amber-700">{loi}</p>}

      {kq && (
        <div className="mt-3 flex flex-col gap-3 rounded-xl bg-gray-50 p-3">
          {mon ? (
            <p className="font-medium text-gray-900">{mon.name}</p>
          ) : (
            <div>
              <p className="text-sm text-gray-700">
                {kq.goiY.length > 0
                  ? "Mình chưa chắc món nào — có phải một trong các món này không?"
                  : 'Món này chưa có trong danh sách. Bạn dùng nút "Ghi món đã ăn" để tìm thủ công nhé.'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {kq.goiY.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setKq({ ...kq, monId: id })}
                    className="rounded-full border-2 border-gray-200 bg-white px-3 py-1 text-sm"
                  >
                    {timMon(id)?.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mon && (
            <>
              <div className="flex flex-wrap gap-2" aria-label="Bữa">
                {cacBua.map((b) => (
                  <button
                    key={b}
                    type="button"
                    aria-pressed={b === kq.bua}
                    onClick={() => setKq({ ...kq, bua: b })}
                    className={`rounded-full border-2 px-3 py-1 text-sm ${
                      b === kq.bua
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {NHAN_BUA[b]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2" aria-label="Khẩu phần">
                {CAC_KHAU_PHAN.map((kp) => (
                  <button
                    key={kp}
                    type="button"
                    aria-pressed={kp === kq.khauPhan}
                    onClick={() => setKq({ ...kq, khauPhan: kp })}
                    className={`rounded-xl border-2 px-2 py-1.5 text-sm ${
                      kp === kq.khauPhan
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {NHAN_KHAU_PHAN[kp]}
                    {!anSo && (
                      <span className="block text-xs text-gray-500">
                        {so(dinhDuongKhauPhan(mon, kp).kcal)} kcal
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <NutChinh
                onClick={() => {
                  onLuu({
                    monId: mon.id,
                    khauPhan: kq.khauPhan,
                    bua: kq.bua,
                    ngoaiKeHoach: false,
                    dinhDuong: dinhDuongKhauPhan(mon, kq.khauPhan),
                  });
                  setKq(null);
                  setCau("");
                }}
              >
                Lưu
              </NutChinh>
            </>
          )}
          <p className="text-xs text-gray-500">
            {kq.nguon === "ai"
              ? "Gợi ý bởi AI · đã kiểm tra với danh sách món"
              : "Gợi ý tự động"}
            {" · "}
            <button
              type="button"
              onClick={() => setKq(null)}
              className="underline"
            >
              Hủy
            </button>
          </p>
        </div>
      )}
    </section>
  );
}
