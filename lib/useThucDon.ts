"use client";
/**
 * Hook lấy thực đơn hiện tại cho hồ sơ:
 *  - Thực đơn gốc do thuật toán tạo (luôn giống nhau với cùng hồ sơ & phong cách)
 *  - Nếu người dùng đã "Đổi món" → dùng bản đã lưu (khi hồ sơ đổi, bản lưu tự bỏ đi)
 */
import { useMemo } from "react";
import { PROTEIN_THEM_HIGH_PROTEIN } from "@/lib/config";
import { taoThucDon, type PhongCach } from "@/lib/engine/menu";
import { tinhKeHoach } from "@/lib/engine/plan";
import { DANH_SACH_MON } from "@/lib/monAn";
import { anToanTuHoSo, boLocTuHoSo, hoSoThanhTinhToan, phongCachChoPhep, type HoSo } from "@/lib/profile";
import { KHOA_PHONG_CACH, KHOA_THUC_DON, layThucDonDaLuu } from "@/lib/storage";
import { useKhoa } from "@/lib/useHoSo";

export function useThucDon(hoSo: HoSo) {
  const rawThucDon = useKhoa(KHOA_THUC_DON) ?? null;
  const rawPhongCach = useKhoa(KHOA_PHONG_CACH) ?? null;

  return useMemo(() => {
    const choPhep = phongCachChoPhep(hoSo);
    const phongCach: PhongCach = choPhep.includes(rawPhongCach as PhongCach)
      ? (rawPhongCach as PhongCach)
      : "can_bang";
    const anToan = anToanTuHoSo(hoSo);
    const boLoc = boLocTuHoSo(hoSo);
    // Mục tiêu dinh dưỡng theo phong cách (High-protein: +0.4 g/kg protein)
    const keHoach = tinhKeHoach({
      ...hoSoThanhTinhToan(hoSo),
      proteinThemGPerKg: phongCach === "high_protein" ? PROTEIN_THEM_HIGH_PROTEIN : 0,
    });
    const thucDonGoc = taoThucDon({
      mons: DANH_SACH_MON,
      boLoc,
      kcalMucTieu: keHoach.caloMucTieu,
      soBua: hoSo.soBua,
      phongCach,
      tagUuTien: anToan.tagUuTien,
      noiAn: hoSo.noiAn,
    });
    const daLuu = layThucDonDaLuu(rawThucDon, hoSo, phongCach);
    return {
      phongCach,
      choPhep,
      anToan,
      boLoc,
      keHoach,
      thucDonGoc,
      thucDon: daLuu ?? thucDonGoc,
      daDoiMon: daLuu !== null,
    };
  }, [hoSo, rawThucDon, rawPhongCach]);
}
