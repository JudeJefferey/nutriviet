"use client";
/**
 * Trang "Lịch sử": xem lại các ngày trước (chỉ xem, không sửa).
 * Không so "đạt / không đạt" với mục tiêu, không tô màu cảnh báo — giữ nguyên tắc không phán xét.
 * Chế độ Đơn giản hoặc tầng 1 → ẩn mọi con số calo.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DangTai, KhungTrang } from "@/components/ui";
import { SO_NGAY_BIEU_DO, SO_NGAY_LICH_SU } from "@/lib/config";
import type { Bua } from "@/lib/engine/dishes";
import { so } from "@/lib/engine/explain";
import {
  caloCacNgayGanNhat,
  khoaNgay,
  lichSuNgay,
} from "@/lib/engine/tracking";
import {
  NHAN_BUA,
  NHAN_KHAU_PHAN,
  NHAN_THU,
  NHAN_THU_NGAN,
} from "@/lib/labels";
import { timMon } from "@/lib/monAn";
import type { HoSo } from "@/lib/profile";
import { useAnSoLieu, useHoSo, useHomNay, useNhatKy } from "@/lib/useHoSo";

/** "2026-11-03" → Date theo giờ máy */
function thanhNgay(khoa: string): Date {
  const [y, m, d] = khoa.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const thuCua = (khoa: string) => (thanhNgay(khoa).getDay() + 6) % 7; // 0 = Thứ 2
const nhanNgay = (khoa: string) => {
  const d = thanhNgay(khoa);
  return `${NHAN_THU[thuCua(khoa)]}, ${d.getDate()}/${d.getMonth() + 1}`;
};

export default function TrangLichSu() {
  const { daTai, hoSo } = useHoSo();
  const router = useRouter();
  useEffect(() => {
    if (daTai && !hoSo) router.replace("/onboarding");
  }, [daTai, hoSo, router]);
  if (!daTai || !hoSo) return <DangTai />;
  return <LichSu hoSo={hoSo} />;
}

function LichSu({ hoSo }: { hoSo: HoSo }) {
  const nhatKy = useNhatKy();
  const { anSo } = useAnSoLieu(hoSo);
  const homNay = useHomNay() || khoaNgay(new Date());
  const cacNgay = lichSuNgay(nhatKy, homNay, SO_NGAY_LICH_SU);
  const bieuDo = caloCacNgayGanNhat(nhatKy, homNay, SO_NGAY_BIEU_DO);
  const caoNhat = Math.max(1, ...bieuDo.map((x) => x.kcal));

  return (
    <KhungTrang>
      <Link
        href="/hom-nay"
        className="-mb-2 inline-flex min-h-11 items-center self-start text-sm text-gray-600"
      >
        ← Hôm nay
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Các ngày trước</h1>
        <p className="mt-1 text-sm text-gray-600">
          Xem lại những gì bạn đã ghi trong {SO_NGAY_LICH_SU} ngày gần đây.
        </p>
      </div>

      {/* Biểu đồ cột 7 ngày — màu trung tính, không so với mục tiêu */}
      {!anSo && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-gray-900">
            Calo đã ghi {SO_NGAY_BIEU_DO} ngày gần nhất
          </h2>
          <div
            className="flex h-32 items-end gap-2"
            role="img"
            aria-label="Biểu đồ calo đã ghi theo ngày"
          >
            {bieuDo.map((x) => (
              <div
                key={x.ngay}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10px] text-gray-500">
                  {x.coGhi ? so(x.kcal) : ""}
                </span>
                <div
                  className={`w-full rounded-t-md ${x.coGhi ? "bg-emerald-400" : "bg-gray-100"}`}
                  style={{
                    height: `${x.coGhi ? Math.max(4, (x.kcal / caoNhat) * 88) : 4}px`,
                  }}
                />
                <span
                  className={`text-xs ${x.ngay === homNay ? "font-semibold text-gray-900" : "text-gray-500"}`}
                >
                  {x.ngay === homNay ? "Nay" : NHAN_THU_NGAN[thuCua(x.ngay)]}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Ngày không ghi món hiện cột xám — không ghi chưa chắc là không ăn.
          </p>
        </section>
      )}

      {cacNgay.length === 0 ? (
        <p className="text-sm text-gray-500">
          Chưa có ghi chép nào ở các ngày trước. Những gì bạn ghi ở trang Hôm
          nay sẽ hiện ở đây từ ngày mai.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {cacNgay.map((n) => (
            <li key={n.ngay}>
              <details className="rounded-2xl border border-gray-200 bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="shrink-0 font-semibold whitespace-nowrap text-gray-900">
                    {nhanNgay(n.ngay)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {!anSo && n.mon.length > 0 && `${so(n.tong.kcal)} kcal · `}
                    {n.mon.length} món · {n.nuoc} ly nước
                  </span>
                </summary>
                {n.mon.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
                    {n.mon.map((m) => (
                      <li key={m.id} className="text-sm">
                        <span className="font-medium text-gray-900">
                          {timMon(m.monId)?.name ?? m.monId}
                        </span>
                        <span className="block text-xs text-gray-600">
                          {NHAN_BUA[m.bua as Bua]} · phần{" "}
                          {NHAN_KHAU_PHAN[m.khauPhan].toLowerCase()}
                          {!anSo && ` · ${so(m.dinhDuong.kcal)} kcal`}
                          {m.ngoaiKeHoach && " · ngoài kế hoạch"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-500">
                    Ngày này chỉ ghi nước.
                  </p>
                )}
              </details>
            </li>
          ))}
        </ul>
      )}
    </KhungTrang>
  );
}
