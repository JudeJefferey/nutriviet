"use client";
/**
 * Trang "Hôm nay" (SPEC mục 7): calo & macro còn lại, nước, bữa kế tiếp, ghi món, "Lỡ ăn rồi".
 * Mọi con số do engine tính (lib/engine/tracking.ts). Màu trung tính, không phán xét.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GhiMon } from "@/components/GhiMon";
import {
  DangTai,
  HopGhiChu,
  KhungTrang,
  NutChinh,
  NutPhu,
} from "@/components/ui";
import {
  GHI_CHU_BAC_SI,
  GIAM_BU_TOI_DA_MOI_NGAY,
  MUC_TIEU_NUOC_LY,
  SO_NGAY_CHIA_BU,
} from "@/lib/config";
import type { Bua } from "@/lib/engine/dishes";
import { so } from "@/lib/engine/explain";
import {
  buaKeTiep,
  duoiMucSanNhieuNgay,
  giamBuChoNgay,
  khoaNgay,
  macroMucTieuNgay,
  phanChenh,
  tongNgay,
  type MonDaAn,
} from "@/lib/engine/tracking";
import { NHAN_BUA, NHAN_KHAU_PHAN, NHAN_THU } from "@/lib/labels";
import { timMon } from "@/lib/monAn";
import type { HoSo } from "@/lib/profile";
import { doiNuoc, themMonDaAn, xoaMonDaAn } from "@/lib/storage";
import { useCaiDat, useHoSo, useNhatKy } from "@/lib/useHoSo";
import { useThucDon } from "@/lib/useThucDon";

export default function TrangHomNay() {
  const { daTai, hoSo } = useHoSo();
  const router = useRouter();
  useEffect(() => {
    if (daTai && !hoSo) router.replace("/onboarding");
  }, [daTai, hoSo, router]);
  if (!daTai || !hoSo) return <DangTai />;
  return <HomNay hoSo={hoSo} />;
}

function HomNay({ hoSo }: { hoSo: HoSo }) {
  const { thucDon, keHoach, anToan } = useThucDon(hoSo);
  const nhatKy = useNhatKy();
  const { cheDoDonGian } = useCaiDat();
  const [moGhi, setMoGhi] = useState<null | "ghi" | "lo_an">(null);

  // Ngày hôm nay (theo giờ máy người dùng)
  const bayGio = new Date();
  const homNay = khoaNgay(bayGio);
  const thu = (bayGio.getDay() + 6) % 7; // 0 = Thứ 2
  const ngayNay = nhatKy[homNay] ?? { mon: [], nuoc: 0 };

  // Luật quan tâm & giảm bù (tính trong engine)
  const mucSan = keHoach.mucSan;
  const dangCanhBao = duoiMucSanNhieuNgay(nhatKy, homNay, mucSan);
  const bu = giamBuChoNgay({
    nhatKy,
    ngay: homNay,
    mucTieuGoc: keHoach.caloMucTieu,
    mucSan,
    dangCanhBao,
  });
  const macroNgay = macroMucTieuNgay(keHoach.macro, bu.giam);
  const daAn = tongNgay(ngayNay);
  const conLai = bu.mucTieuNgay - daAn.kcal;
  const duHomNay = phanChenh(daAn.kcal, keHoach.caloMucTieu);

  const anMacro = anToan.anGoiYMacro;
  const anSo = cheDoDonGian;
  const keTiep = buaKeTiep(thucDon.ngay[thu], ngayNay.mon);
  const cacBua = thucDon.caloBua.map((c) => c.bua);

  function luu(m: Omit<MonDaAn, "id">) {
    themMonDaAn(homNay, { ...m, id: taoMaGhi() });
    setMoGhi(null);
  }

  return (
    <KhungTrang>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hôm nay</h1>
        <p className="mt-1 text-sm text-gray-600">
          {NHAN_THU[thu]}, {bayGio.getDate()}/{bayGio.getMonth() + 1}
        </p>
      </div>

      {/* Luật quan tâm: 3 ngày liền dưới mức sàn — không khen, không siết thêm */}
      {dangCanhBao && (
        <HopGhiChu tieuDe="Mình hơi lo cho bạn một chút">
          <p>
            Mấy ngày gần đây bạn ăn ít hơn mức cơ thể cần. Cơ thể cần đủ năng
            lượng để khỏe và tập trung học tập. Hôm nay bạn cứ ăn đủ bữa nhé —
            mình sẽ không giảm thêm calo nào.
          </p>
          <p className="mt-2">
            Nếu đang có điều gì khiến việc ăn uống khó khăn, bạn có thể chia sẻ
            với người thân, bạn bè, hoặc trò chuyện với bác sĩ / chuyên gia dinh
            dưỡng.
          </p>
        </HopGhiChu>
      )}

      {/* Calo & macro còn lại — ẩn trong chế độ Đơn giản */}
      {!anSo && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {conLai >= 0 ? "Còn lại hôm nay" : "Hôm nay"}
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {conLai >= 0 ? (
                  <>
                    {so(conLai)}{" "}
                    <span className="text-base font-medium text-gray-500">
                      kcal
                    </span>
                  </>
                ) : (
                  <span className="text-xl">Đã đủ năng lượng</span>
                )}
              </p>
            </div>
            <p className="text-right text-sm text-gray-600">
              Đã ăn {so(daAn.kcal)}
              <br />/ {so(bu.mucTieuNgay)} kcal
            </p>
          </div>
          <ThanhTienDoTrungTinh giaTri={daAn.kcal} toiDa={bu.mucTieuNgay} />
          {bu.giam > 0 && (
            <p className="mt-2 text-xs text-gray-600">
              Mục tiêu hôm nay giảm nhẹ {so(bu.giam)} kcal để cân lại mấy ngày
              trước (mỗi ngày tối đa {so(GIAM_BU_TOI_DA_MOI_NGAY * 100)}% và
              không dưới mức sàn {so(mucSan)} kcal).
            </p>
          )}
          {conLai < 0 && (
            <p className="mt-2 text-sm text-gray-700">
              Hôm nay bạn ăn nhiều hơn dự kiến một chút — không sao cả.
              {!dangCanhBao &&
                ` Mình sẽ điều chỉnh nhẹ trong ${SO_NGAY_CHIA_BU} ngày tới.`}
            </p>
          )}

          {!anMacro && (
            <div className="mt-4 flex flex-col gap-2">
              <DongMacro
                ten="Chất đạm"
                da={daAn.protein}
                muc={macroNgay.proteinG}
              />
              <DongMacro ten="Chất béo" da={daAn.fat} muc={macroNgay.fatG} />
              <DongMacro ten="Tinh bột" da={daAn.carb} muc={macroNgay.carbG} />
            </div>
          )}
        </section>
      )}

      {anToan.canGhiChuBacSi && (
        <HopGhiChu kieu="luu_y">{GHI_CHU_BAC_SI}</HopGhiChu>
      )}

      {/* Bữa kế tiếp */}
      <section className="rounded-2xl bg-emerald-50 p-4">
        <p className="text-sm font-medium text-emerald-800">
          Bữa tới nên ăn gì?
        </p>
        {keTiep ? (
          <>
            <p className="mt-1 text-xs uppercase tracking-wide text-emerald-700">
              {NHAN_BUA[keTiep.bua]}
            </p>
            <Link
              href={`/mon/${keTiep.monId}?ngay=${thu}&bua=${thucDon.ngay[thu].bua.indexOf(keTiep)}`}
              className="block"
            >
              <p className="text-xl font-semibold text-gray-900">
                {timMon(keTiep.monId)?.name}
              </p>
              <p className="text-sm text-gray-600">
                Phần {NHAN_KHAU_PHAN[keTiep.khauPhan].toLowerCase()}
                {!anSo && ` · ${so(keTiep.dinhDuong.kcal)} kcal`}
              </p>
            </Link>
            <div className="mt-3">
              <NutChinh
                onClick={() =>
                  luu({
                    monId: keTiep.monId,
                    khauPhan: keTiep.khauPhan,
                    bua: keTiep.bua,
                    ngoaiKeHoach: false,
                    dinhDuong: keTiep.dinhDuong,
                  })
                }
              >
                Mình đã ăn món này
              </NutChinh>
            </div>
          </>
        ) : thucDon.ngay[thu].bua.length === 0 ? (
          <p className="mt-1 text-sm text-gray-700">
            Hôm nay thực đơn chưa đủ món phù hợp với bộ lọc của bạn. Bạn vẫn có
            thể ghi món đã ăn ở dưới.
          </p>
        ) : (
          <p className="mt-1 text-sm text-gray-700">
            Bạn đã ghi đủ các bữa trong kế hoạch hôm nay.
          </p>
        )}
      </section>

      {/* Ghi món / Lỡ ăn rồi */}
      {moGhi ? (
        <GhiMon
          loAn={moGhi === "lo_an"}
          cacBua={cacBua}
          buaMacDinh={keTiep?.bua ?? cacBua[0]}
          anSo={anSo}
          onLuu={luu}
          onHuy={() => setMoGhi(null)}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <NutPhu onClick={() => setMoGhi("ghi")}>Ghi món đã ăn</NutPhu>
          <NutPhu onClick={() => setMoGhi("lo_an")}>Lỡ ăn rồi</NutPhu>
        </div>
      )}

      {duHomNay > 0 && !dangCanhBao && !anSo && (
        <p className="-mt-2 text-xs text-gray-600">
          Phần nhiều hơn {so(duHomNay)} kcal sẽ được chia nhẹ cho{" "}
          {SO_NGAY_CHIA_BU} ngày tới (mỗi ngày tối đa{" "}
          {so(GIAM_BU_TOI_DA_MOI_NGAY * 100)}%, không dưới mức sàn).
        </p>
      )}

      {/* Nước */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Nước</p>
            <p className="text-sm text-gray-600" aria-live="polite">
              {ngayNay.nuoc} / {MUC_TIEU_NUOC_LY} ly
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => doiNuoc(homNay, -1)}
              aria-label="Bớt 1 ly"
              className="h-11 w-11 rounded-full border-2 border-gray-200 text-lg text-gray-700"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => doiNuoc(homNay, 1)}
              className="h-11 rounded-full bg-sky-600 px-4 font-semibold text-white"
            >
              +1 ly
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-1" aria-hidden>
          {Array.from({ length: MUC_TIEU_NUOC_LY }, (_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${i < ngayNay.nuoc ? "bg-sky-500" : "bg-gray-200"}`}
            />
          ))}
        </div>
      </section>

      {/* Món đã ghi hôm nay */}
      <section>
        <h2 className="mb-2 font-semibold text-gray-900">Đã ghi hôm nay</h2>
        {ngayNay.mon.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa ghi món nào.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ngayNay.mon.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {timMon(m.monId)?.name ?? m.monId}
                  </p>
                  <p className="text-xs text-gray-600">
                    {NHAN_BUA[m.bua as Bua]} · phần{" "}
                    {NHAN_KHAU_PHAN[m.khauPhan].toLowerCase()}
                    {!anSo && ` · ${so(m.dinhDuong.kcal)} kcal`}
                    {m.ngoaiKeHoach && " · ngoài kế hoạch"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => xoaMonDaAn(homNay, m.id)}
                  className="text-sm text-gray-500 underline"
                  aria-label={`Xóa ${timMon(m.monId)?.name ?? "món"}`}
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </KhungTrang>
  );
}

/** Mã riêng cho mỗi lần ghi món (để xóa đúng món) — chỉ gọi khi người dùng bấm Lưu */
function taoMaGhi(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Thanh tiến độ màu trung tính: ăn nhiều hơn mục tiêu thì thanh chỉ đầy, không đổi sang màu cảnh báo */
function ThanhTienDoTrungTinh({
  giaTri,
  toiDa,
}: {
  giaTri: number;
  toiDa: number;
}) {
  const phanTram = toiDa > 0 ? Math.min(100, (giaTri / toiDa) * 100) : 0;
  return (
    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full bg-emerald-400"
        style={{ width: `${phanTram}%` }}
      />
    </div>
  );
}

function DongMacro({ ten, da, muc }: { ten: string; da: number; muc: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{ten}</span>
        <span className="text-gray-600">
          {so(da)} / {so(muc)} g
        </span>
      </div>
      <ThanhTienDoTrungTinh giaTri={da} toiDa={muc} />
    </div>
  );
}
