"use client";
/**
 * Chi tiết món + Đổi món.
 * Mở từ thực đơn (có ?ngay=&bua=) thì hiện nút "Đổi món" với 3 lựa chọn thay thế.
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DangTai, HopGhiChu, KhungTrang, NutPhu } from "@/components/ui";
import { DANH_SACH_DI_UNG } from "@/lib/config";
import { CAC_KHAU_PHAN, dinhDuongKhauPhan, type Mon } from "@/lib/engine/dishes";
import { so } from "@/lib/engine/explain";
import { doiMon, goiYDoiMon } from "@/lib/engine/menu";
import { NHAN_BUA, NHAN_KHAU_PHAN, NHAN_THU } from "@/lib/labels";
import { DANH_SACH_MON, timMon } from "@/lib/monAn";
import type { HoSo } from "@/lib/profile";
import { luuThucDon } from "@/lib/storage";
import { useHoSo } from "@/lib/useHoSo";
import { useThucDon } from "@/lib/useThucDon";

const NHAN_TAG: Record<string, string> = {
  chay: "Chay",
  khong_heo: "Không thịt heo",
  high_protein: "Nhiều đạm",
  tiet_kiem: "Tiết kiệm",
  nhanh_15p: "Nhanh 15 phút",
  gi_thap: "Chỉ số đường huyết thấp",
  nhieu_duong: "Nhiều đường",
  nhieu_purine: "Nhiều purine",
  nhieu_muoi: "Nhiều muối",
};

export function ChiTietMon({ id }: { id: string }) {
  const mon = timMon(id)!;
  const { daTai, hoSo } = useHoSo();
  if (!daTai) return <DangTai />;
  return (
    <KhungTrang>
      <QuayLai />
      <ThongTinMon mon={mon} />
      {hoSo && <DoiMon mon={mon} hoSo={hoSo} />}
    </KhungTrang>
  );
}

function QuayLai() {
  const ngay = useSearchParams().get("ngay");
  return (
    <Link href={ngay !== null ? `/thuc-don?ngay=${ngay}` : "/thuc-don"} className="-mb-2 text-sm text-gray-600">
      ← Thực đơn
    </Link>
  );
}

function ThongTinMon({ mon }: { mon: Mon }) {
  const tenDiUng = (ma: string) => DANH_SACH_DI_UNG.find((x) => x.ma === ma)?.ten ?? ma;
  const tags = [...mon.diet, ...mon.style_tags, ...mon.health_tags];
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{mon.name}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Khoảng {so(mon.price_vnd)} đ · {mon.eat_out ? "Thường mua ngoài" : `Nấu khoảng ${mon.cook_minutes} phút`}
        </p>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                {NHAN_TAG[t] ?? t}
              </span>
            ))}
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-gray-900">Nguyên liệu</h2>
        <p className="text-sm text-gray-700">{mon.ingredients.join(", ")}</p>
        {mon.allergens.length > 0 && (
          <p className="mt-2 text-sm text-gray-700">
            <span className="font-medium">Có thể chứa:</span> {mon.allergens.map(tenDiUng).join(", ")}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <h2 className="px-4 pt-4 font-semibold text-gray-900">Dinh dưỡng theo khẩu phần</h2>
        <table className="mt-2 w-full text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Phần</th>
              <th className="px-2 py-2 text-right font-medium">Calo</th>
              <th className="px-2 py-2 text-right font-medium">Đạm</th>
              <th className="px-2 py-2 text-right font-medium">Tinh bột</th>
              <th className="px-4 py-2 text-right font-medium">Béo</th>
            </tr>
          </thead>
          <tbody>
            {CAC_KHAU_PHAN.map((kp) => {
              const d = dinhDuongKhauPhan(mon, kp);
              return (
                <tr key={kp} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-700">{NHAN_KHAU_PHAN[kp]}</td>
                  <td className="px-2 py-2 text-right font-medium">{so(d.kcal)}</td>
                  <td className="px-2 py-2 text-right">{so(d.protein)} g</td>
                  <td className="px-2 py-2 text-right">{so(d.carb)} g</td>
                  <td className="px-4 py-2 text-right">{so(d.fat)} g</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!mon.verified && (
          <p className="px-4 py-3 text-xs text-gray-500">
            Số liệu ước lượng, đang được nhóm kiểm tra lại theo Bảng thành phần thực phẩm Việt Nam.
          </p>
        )}
      </section>
    </>
  );
}

function DoiMon({ mon, hoSo }: { mon: Mon; hoSo: HoSo }) {
  const params = useSearchParams();
  const router = useRouter();
  const { thucDon, boLoc } = useThucDon(hoSo);
  const [moRong, setMoRong] = useState(false);

  const ngayIdx = Number(params.get("ngay"));
  const buaIdx = Number(params.get("bua"));
  const o = thucDon.ngay[ngayIdx]?.bua[buaIdx];
  // Chỉ cho đổi khi đúng ô trong thực đơn đang chứa món này
  if (!o || o.monId !== mon.id) return null;

  const goiY = goiYDoiMon(thucDon, ngayIdx, buaIdx, DANH_SACH_MON, boLoc);

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        Trong thực đơn: {NHAN_BUA[o.bua].toLowerCase()} {NHAN_THU[ngayIdx]}, phần {NHAN_KHAU_PHAN[o.khauPhan].toLowerCase()} ·{" "}
        {so(o.dinhDuong.kcal)} kcal
      </p>
      {!moRong ? (
        <NutPhu onClick={() => setMoRong(true)}>Đổi món</NutPhu>
      ) : goiY.length === 0 ? (
        <HopGhiChu>Hiện chưa có món nào khác phù hợp với bộ lọc của bạn cho bữa này.</HopGhiChu>
      ) : (
        <>
          <h2 className="font-semibold text-gray-900">Chọn món thay thế</h2>
          <ul className="flex flex-col gap-2">
            {goiY.map((g) => (
              <li key={g.mon.id}>
                <button
                  type="button"
                  onClick={() => {
                    luuThucDon(hoSo, doiMon(thucDon, ngayIdx, buaIdx, g.mon, g.khauPhan));
                    router.push(`/thuc-don?ngay=${ngayIdx}`);
                  }}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left active:border-emerald-500"
                >
                  <span className="font-medium text-gray-900">{g.mon.name}</span>
                  <span className="mt-0.5 block text-sm text-gray-600">
                    Phần {NHAN_KHAU_PHAN[g.khauPhan].toLowerCase()} · {so(g.dinhDuong.kcal)} kcal · {so(g.mon.price_vnd)} đ
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {goiY.length < 3 && (
            <p className="text-xs text-gray-500">Chỉ còn {goiY.length} món phù hợp với bộ lọc của bạn cho bữa này.</p>
          )}
        </>
      )}
    </section>
  );
}
