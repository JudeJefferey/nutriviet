/**
 * tinhKeHoach — hàm tổng hợp: nhận hồ sơ người dùng, gọi lần lượt các hàm engine
 * và trả về kết quả ĐÃ LÀM TRÒN để hiển thị.
 *
 * Thứ tự: an toàn → BMR → calo tập → TDEE → calo mục tiêu (mức sàn) → macro → kiểm tra cân mục tiêu.
 */
import { calcBMI, calcBMR } from "./body";
import { calcExerciseKcalPerDay, calcTargetCalories, calcTDEE } from "./energy";
import { calcMacros } from "./macros";
import { getSafetyTier, type SafetyInput, type SafetyResult } from "./safety";
import type { CongViec, GioiTinh, MucTieu, TheThao } from "./types";
import { checkWeightGoal, type KetQuaMucTieuCan } from "./weightGoal";

export interface HoSoTinhToan extends SafetyInput {
  gioiTinh: GioiTinh;
  canNangKg: number;
  chieuCaoCm: number;
  congViec: CongViec;
  theThao: TheThao | null; // null = không chơi thể thao
  mucTieu: MucTieu;
  canMucTieuKg?: number; // chỉ dùng khi giảm mỡ / tăng cơ
  soTuan?: number;
  tiLeDieuChinh?: number; // % cắt/thêm người dùng tự chỉnh (vd 0.18)
}

export interface KeHoach {
  an_toan: SafetyResult;
  mucTieuNguoiDung: MucTieu;
  mucTieuApDung: MucTieu; // có thể khác nếu bị tầng 1 khóa
  bmi: number; // 1 chữ số thập phân
  bmr: number;
  caloTap: number;
  tdee: number;
  caloMucTieu: number;
  caloTruocMucSan: number;
  mucSan: number;
  daNangLenMucSan: boolean;
  tiLeDieuChinh: number;
  macro: { proteinG: number; fatG: number; carbG: number; proteinGPerKg: number };
  kiemTraCanNang: KetQuaMucTieuCan | null;
}

export function tinhKeHoach(hs: HoSoTinhToan): KeHoach {
  // 1. An toàn trước tiên: tầng 1 → ép về "Ăn cân bằng"
  const an_toan = getSafetyTier(hs, hs.mucTieu);
  const mucTieuApDung: MucTieu = an_toan.tang1 ? "an_lanh_manh" : hs.mucTieu;

  // 2–4. BMR, calo tập, TDEE
  const bmr = calcBMR(hs.gioiTinh, hs.canNangKg, hs.chieuCaoCm, hs.tuoi);
  const caloTap = calcExerciseKcalPerDay(hs.canNangKg, hs.theThao);
  const tdee = calcTDEE(bmr, hs.congViec, caloTap);

  // 5. Calo mục tiêu (luôn áp mức sàn)
  const target = calcTargetCalories({
    tdee,
    bmr,
    gioiTinh: hs.gioiTinh,
    mucTieu: mucTieuApDung,
    tiLeTuyChon: hs.tiLeDieuChinh,
  });

  // 6. Macro (tính trên số chưa làm tròn để chính xác)
  const coChoiTheThao = hs.theThao !== null && hs.theThao.soBuoiMoiTuan > 0;
  const m = calcMacros({
    kcal: target.kcal,
    canNangKg: hs.canNangKg,
    mucTieu: mucTieuApDung,
    coChoiTheThao,
  });

  // 7. Kiểm tra cân mục tiêu (chỉ khi giảm mỡ / tăng cơ còn được áp dụng)
  let kiemTraCanNang: KetQuaMucTieuCan | null = null;
  if (mucTieuApDung === "giam_mo" || mucTieuApDung === "tang_co") {
    kiemTraCanNang = checkWeightGoal({
      mucTieu: mucTieuApDung,
      canHienTaiKg: hs.canNangKg,
      canMucTieuKg: hs.canMucTieuKg ?? NaN,
      soTuan: hs.soTuan ?? NaN,
      chieuCaoCm: hs.chieuCaoCm,
    });
  }

  return {
    an_toan,
    mucTieuNguoiDung: hs.mucTieu,
    mucTieuApDung,
    bmi: Math.round(calcBMI(hs.canNangKg, hs.chieuCaoCm) * 10) / 10,
    bmr: Math.round(bmr),
    caloTap: Math.round(caloTap),
    tdee: Math.round(tdee),
    caloMucTieu: Math.round(target.kcal),
    caloTruocMucSan: Math.round(target.kcalTruocMucSan),
    mucSan: Math.round(target.mucSan),
    daNangLenMucSan: target.daNangLenMucSan,
    tiLeDieuChinh: target.tiLeDieuChinh,
    macro: {
      proteinG: Math.round(m.proteinG),
      fatG: Math.round(m.fatG),
      carbG: Math.round(m.carbG),
      proteinGPerKg: m.proteinGPerKg,
    },
    kiemTraCanNang,
  };
}
