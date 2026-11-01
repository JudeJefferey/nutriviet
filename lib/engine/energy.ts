/**
 * Năng lượng tiêu hao: calo tập, TDEE, calo mục tiêu (có mức sàn).
 */
import {
  DIEU_CHINH_CALO,
  HE_SO_CONG_VIEC,
  MET_NGHI,
  MET_THEO_CUONG_DO,
  MUC_SAN_CALO,
} from "@/lib/config";
import type { CongViec, GioiTinh, MucTieu, TheThao } from "./types";
import { assertNonNegative, assertPositive } from "./validate";

/**
 * Calo tập trung bình mỗi ngày.
 *   = (MET − 1) × kg × (giờ tập mỗi tuần) / 7
 * Không chơi thể thao (theThao = null) → 0.
 */
export function calcExerciseKcalPerDay(
  canNangKg: number,
  theThao: TheThao | null,
): number {
  assertPositive(canNangKg, "cân nặng");
  if (!theThao) return 0;
  assertNonNegative(theThao.soBuoiMoiTuan, "số buổi/tuần");
  assertNonNegative(theThao.phutMoiBuoi, "phút/buổi");

  const met = MET_THEO_CUONG_DO[theThao.cuongDo];
  const gioMoiTuan = (theThao.soBuoiMoiTuan * theThao.phutMoiBuoi) / 60;
  return ((met - MET_NGHI) * canNangKg * gioMoiTuan) / 7;
}

/** TDEE (tổng năng lượng tiêu hao mỗi ngày) = BMR × hệ số công việc + calo tập/ngày */
export function calcTDEE(
  bmr: number,
  congViec: CongViec,
  caloTapMoiNgay: number,
): number {
  assertPositive(bmr, "BMR");
  assertNonNegative(caloTapMoiNgay, "calo tập");
  return bmr * HE_SO_CONG_VIEC[congViec] + caloTapMoiNgay;
}

/** Mức sàn calo = max(BMR, 1200 với nữ / 1500 với nam) */
export function calcCalorieFloor(gioiTinh: GioiTinh, bmr: number): number {
  return Math.max(bmr, MUC_SAN_CALO[gioiTinh]);
}

export interface TargetCaloriesResult {
  kcal: number; // calo mục tiêu cuối cùng (đã áp mức sàn)
  kcalTruocMucSan: number; // calo trước khi áp mức sàn (để giải thích)
  mucSan: number;
  daNangLenMucSan: boolean; // true nếu calo bị nâng lên bằng mức sàn
  tiLeDieuChinh: number; // tỉ lệ thực tế đã dùng: âm = cắt, dương = thêm, 0 = giữ nguyên
}

/**
 * Calo mục tiêu.
 *   Giảm mỡ : TDEE × (1 − %cắt), %cắt mặc định 15%, giới hạn 10–20%
 *   Tăng cơ : TDEE × (1 + %thêm), %thêm mặc định 8%, giới hạn 5–10%
 *   Duy trì / Ăn lành mạnh: TDEE
 * Sau đó LUÔN áp mức sàn (an toàn thắng mục tiêu).
 *
 * @param tiLeTuyChon tỉ lệ người dùng tự chỉnh (vd 0.18). Ngoài khoảng cho phép → kẹp về biên.
 */
export function calcTargetCalories(params: {
  tdee: number;
  bmr: number;
  gioiTinh: GioiTinh;
  mucTieu: MucTieu;
  tiLeTuyChon?: number;
}): TargetCaloriesResult {
  const { tdee, bmr, gioiTinh, mucTieu, tiLeTuyChon } = params;
  assertPositive(tdee, "TDEE");
  assertPositive(bmr, "BMR");

  let tiLeDieuChinh = 0;
  if (mucTieu === "giam_mo") {
    tiLeDieuChinh = -kepTiLe(tiLeTuyChon, DIEU_CHINH_CALO.giam_mo);
  } else if (mucTieu === "tang_co") {
    tiLeDieuChinh = kepTiLe(tiLeTuyChon, DIEU_CHINH_CALO.tang_co);
  }

  const kcalTruocMucSan = tdee * (1 + tiLeDieuChinh);
  const mucSan = calcCalorieFloor(gioiTinh, bmr);
  const daNangLenMucSan = kcalTruocMucSan < mucSan;

  return {
    kcal: daNangLenMucSan ? mucSan : kcalTruocMucSan,
    kcalTruocMucSan,
    mucSan,
    daNangLenMucSan,
    tiLeDieuChinh,
  };
}

/** Lấy tỉ lệ người dùng chọn (hoặc mặc định), kẹp trong [tối thiểu, tối đa]. */
function kepTiLe(
  tiLe: number | undefined,
  gioiHan: { macDinh: number; toiThieu: number; toiDa: number },
): number {
  if (tiLe === undefined || !Number.isFinite(tiLe)) return gioiHan.macDinh;
  return Math.min(gioiHan.toiDa, Math.max(gioiHan.toiThieu, tiLe));
}
