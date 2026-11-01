"use client";
/** Trang Thực đơn 7 ngày: chọn phong cách, chọn ngày, xem các bữa (SPEC mục 6). */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GhiChuDiUngAnNgoai } from "@/components/onboarding/CacBuoc";
import { DangTai, HopGhiChu, KhungTrang } from "@/components/ui";
import { GHI_CHU_BAC_SI } from "@/lib/config";
import { demLyDoLoai, type LyDoLoai } from "@/lib/engine/dishes";
import { so } from "@/lib/engine/explain";
import { GOI_Y_NOI_BO_LOC, NHAN_BUA, NHAN_KHAU_PHAN, NHAN_PHONG_CACH, NHAN_THU, NHAN_THU_NGAN } from "@/lib/labels";
import { DANH_SACH_MON, timMon } from "@/lib/monAn";
import type { HoSo } from "@/lib/profile";
import { luuPhongCach, xoaThucDonPhongCach } from "@/lib/storage";
import { useHoSo } from "@/lib/useHoSo";
import { useThucDon } from "@/lib/useThucDon";

export default function TrangThucDon() {
  const { daTai, hoSo } = useHoSo();
  const router = useRouter();
  useEffect(() => {
    if (daTai && !hoSo) router.replace("/onboarding");
  }, [daTai, hoSo, router]);
  if (!daTai || !hoSo) return <DangTai />;
  return (
    <Suspense fallback={<DangTai />}>
      <ThucDon hoSo={hoSo} />
    </Suspense>
  );
}

/** Thứ trong tuần hôm nay: 0 = Thứ 2 … 6 = Chủ nhật */
function homNay() {
  return (new Date().getDay() + 6) % 7;
}

function ThucDon({ hoSo }: { hoSo: HoSo }) {
  const { phongCach, choPhep, anToan, boLoc, keHoach, thucDon, daDoiMon } = useThucDon(hoSo);
  // Ngày đang xem: lấy từ đường dẫn (?ngay=) khi quay lại từ trang món, mặc định là hôm nay
  const thamSo = useSearchParams();
  const [ngayChon, setNgayChon] = useState(() => {
    const n = Number(thamSo.get("ngay"));
    return thamSo.get("ngay") !== null && Number.isInteger(n) && n >= 0 && n < 7 ? n : homNay();
  });
  const ngay = thucDon.ngay[ngayChon];
  const anMacro = anToan.anGoiYMacro;

  // Gợi ý nới bộ lọc khi có ngày chưa đủ món: lấy lý do loại nhiều món nhất (trừ lý do an toàn)
  const soNgayThieu = thucDon.ngay.filter((n) => n.bua.length === 0).length;
  const dem = demLyDoLoai(DANH_SACH_MON, boLoc);
  const lyDoChinh = (Object.entries(dem) as [LyDoLoai, number][])
    .filter(([l]) => l !== "benh_nen")
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <KhungTrang>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thực đơn 7 ngày</h1>
        <p className="mt-1 text-sm text-gray-600">
          Mục tiêu {so(keHoach.caloMucTieu)} kcal/ngày · {hoSo.soBua} bữa
        </p>
      </div>

      {/* Phong cách */}
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Phong cách thực đơn">
        {(["can_bang", "high_protein", "tiet_kiem"] as const).map((p) =>
          choPhep.includes(p) ? (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={p === phongCach}
              onClick={() => luuPhongCach(p)}
              className={`rounded-xl border-2 px-2 py-2 text-sm font-medium ${
                p === phongCach ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              {NHAN_PHONG_CACH[p]}
            </button>
          ) : null,
        )}
      </div>
      {anMacro && (
        <p className="-mt-3 text-xs text-gray-500">
          Phong cách High-protein được ẩn vì lượng đạm cho bệnh thận nên do bác sĩ chỉ định.
        </p>
      )}

      {anToan.canGhiChuBacSi && <HopGhiChu kieu="luu_y">{GHI_CHU_BAC_SI}</HopGhiChu>}
      {hoSo.noiAn === "an_ngoai" && hoSo.diUng.length > 0 && <GhiChuDiUngAnNgoai />}

      {/* Chọn ngày */}
      <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Chọn ngày">
        {NHAN_THU_NGAN.map((t, i) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={i === ngayChon}
            aria-label={NHAN_THU[i]}
            onClick={() => setNgayChon(i)}
            className={`rounded-lg py-2 text-sm font-medium ${
              i === ngayChon ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"
            } ${thucDon.ngay[i].bua.length === 0 ? "opacity-60" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      <h2 className="-mb-2 font-semibold text-gray-900">{NHAN_THU[ngayChon]}</h2>

      {ngay.bua.length === 0 ? (
        <HopGhiChu tieuDe="Ngày này chưa đủ món phù hợp">
          <p>
            Với bộ lọc hiện tại{ngay.buaThieuMon ? ` (đặc biệt là ${NHAN_BUA[ngay.buaThieuMon].toLowerCase()})` : ""}, mình chưa
            tìm đủ món để tổng calo trong ngày gần với mục tiêu, nên mình không ép thực đơn.
          </p>
          {lyDoChinh && <p className="mt-2">{GOI_Y_NOI_BO_LOC[lyDoChinh]}</p>}
          <Link href="/onboarding" className="mt-2 inline-block font-semibold underline">
            Sửa hồ sơ
          </Link>
        </HopGhiChu>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {ngay.bua.map((b, i) => {
              const mon = timMon(b.monId)!;
              return (
                <li key={b.bua}>
                  <Link
                    href={`/mon/${b.monId}?ngay=${ngayChon}&bua=${i}`}
                    className="block rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">{NHAN_BUA[b.bua]}</p>
                    <p className="mt-0.5 text-lg font-semibold text-gray-900">{mon.name}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Phần {NHAN_KHAU_PHAN[b.khauPhan].toLowerCase()} · {so(b.dinhDuong.kcal)} kcal
                      {!anMacro && ` · ${so(b.dinhDuong.protein)} g đạm`} · {so(b.gia)} đ
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>

          <section className="rounded-2xl bg-gray-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng calo trong ngày</span>
              <span className="font-semibold text-gray-900">
                {so(ngay.tong.kcal)} / {so(keHoach.caloMucTieu)} kcal
              </span>
            </div>
            {!anMacro && (
              <div className="mt-1 flex justify-between">
                <span className="text-gray-600">Chất đạm</span>
                <span className="font-semibold text-gray-900">
                  {so(ngay.tong.protein)} / {so(keHoach.macro.proteinG)} g
                </span>
              </div>
            )}
            <div className="mt-1 flex justify-between">
              <span className="text-gray-600">Chi phí ước tính</span>
              <span className="font-semibold text-gray-900">{so(ngay.tong.gia)} đ</span>
            </div>
            {!ngay.dat && (
              <p className="mt-2 text-xs text-gray-600">
                Sau khi đổi món, tổng calo hôm nay đang lệch hơn 10% so với mục tiêu. Bạn có thể đổi thêm món khác cho cân hơn.
              </p>
            )}
          </section>
        </>
      )}

      {soNgayThieu > 0 && ngay.bua.length > 0 && (
        <p className="text-xs text-gray-500">
          Có {soNgayThieu} ngày trong tuần chưa đủ món phù hợp với bộ lọc của bạn.
        </p>
      )}

      {daDoiMon && (
        <button
          type="button"
          onClick={() => xoaThucDonPhongCach(hoSo, phongCach)}
          className="text-sm font-medium text-gray-600 underline"
        >
          Khôi phục thực đơn gợi ý ban đầu
        </button>
      )}

      <p className="text-xs text-gray-500">
        Bấm vào món để xem chi tiết hoặc đổi món. Số liệu dinh dưỡng đang được nhóm kiểm tra lại theo Bảng thành phần thực
        phẩm Việt Nam.
      </p>
    </KhungTrang>
  );
}
