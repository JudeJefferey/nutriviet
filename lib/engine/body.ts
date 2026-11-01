/**
 * Các phép tính về cơ thể: BMR, BMI.
 */
import { BMR } from "@/lib/config";
import type { GioiTinh } from "./types";
import { assertPositive } from "./validate";

/**
 * BMR (năng lượng cơ thể cần khi nghỉ hoàn toàn) — công thức Mifflin-St Jeor.
 *   Nam: 10 × kg + 6.25 × cm − 5 × tuổi + 5
 *   Nữ : 10 × kg + 6.25 × cm − 5 × tuổi − 161
 */
export function calcBMR(
  gioiTinh: GioiTinh,
  canNangKg: number,
  chieuCaoCm: number,
  tuoi: number,
): number {
  assertPositive(canNangKg, "cân nặng");
  assertPositive(chieuCaoCm, "chiều cao");
  assertPositive(tuoi, "tuổi");

  const hangSo = gioiTinh === "nam" ? BMR.HANG_SO_NAM : BMR.HANG_SO_NU;
  return (
    BMR.HE_SO_CAN_NANG * canNangKg +
    BMR.HE_SO_CHIEU_CAO * chieuCaoCm -
    BMR.HE_SO_TUOI * tuoi +
    hangSo
  );
}

/** BMI = kg / (m × m) */
export function calcBMI(canNangKg: number, chieuCaoCm: number): number {
  assertPositive(canNangKg, "cân nặng");
  assertPositive(chieuCaoCm, "chiều cao");
  const m = chieuCaoCm / 100;
  return canNangKg / (m * m);
}
