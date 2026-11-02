"use client";
/**
 * Hook React đọc dữ liệu từ localStorage.
 * - Trên server (lúc dựng HTML sẵn) chưa có localStorage → daTai = false, giao diện hiện "Đang tải…".
 * - Trên trình duyệt → đọc dữ liệu và tự cập nhật mỗi khi dữ liệu được lưu lại.
 */
import { useMemo, useSyncExternalStore } from "react";
import { khoaNgay } from "@/lib/engine/tracking";
import { anToanTuHoSo, type HoSo } from "@/lib/profile";
import {
  KHOA_CAI_DAT,
  KHOA_HO_SO,
  KHOA_NHAT_KY,
  docRaw,
  phanTichCaiDat,
  phanTichHoSo,
  phanTichNhatKy,
  theoDoiThayDoi,
} from "@/lib/storage";

const CHUA_TAI = "__chua_tai__";

/** Chuỗi thô của một khóa localStorage; undefined = chưa tải xong (đang ở server). */
export function useKhoa(khoa: string): string | null | undefined {
  const raw = useSyncExternalStore(
    theoDoiThayDoi,
    () => docRaw(khoa),
    () => CHUA_TAI,
  );
  return raw === CHUA_TAI ? undefined : raw;
}

export function useHoSo() {
  const raw = useKhoa(KHOA_HO_SO);
  return useMemo(() => {
    if (raw === undefined) return { daTai: false as const, hoSo: null };
    return { daTai: true as const, hoSo: phanTichHoSo(raw) };
  }, [raw]);
}

/** Nhật ký ăn uống (tự cập nhật khi ghi món, thêm nước...) */
export function useNhatKy() {
  const raw = useKhoa(KHOA_NHAT_KY);
  return useMemo(() => phanTichNhatKy(raw ?? null), [raw]);
}

/** Cài đặt (chế độ Đơn giản) */
export function useCaiDat() {
  const raw = useKhoa(KHOA_CAI_DAT);
  return useMemo(() => phanTichCaiDat(raw ?? null), [raw]);
}

/**
 * Có ẩn số liệu calo/dinh dưỡng không?
 *  - Người dùng tự bật chế độ Đơn giản, HOẶC
 *  - Hồ sơ thuộc tầng 1 an toàn (luôn ẩn, không tắt được)
 */
export function useAnSoLieu(hoSo: HoSo | null) {
  const { cheDoDonGian } = useCaiDat();
  const doAnToan = hoSo ? anToanTuHoSo(hoSo).anSoLieu : false;
  return { anSo: cheDoDonGian || doAnToan, doAnToan };
}

/** Đăng ký kiểm tra lại ngày: mỗi phút, và khi người dùng quay lại tab / cửa sổ */
function theoDoiNgay(callback: () => void): () => void {
  const id = window.setInterval(callback, 60_000);
  document.addEventListener("visibilitychange", callback);
  window.addEventListener("focus", callback);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", callback);
    window.removeEventListener("focus", callback);
  };
}

/**
 * Khóa ngày hôm nay ("YYYY-MM-DD") theo giờ máy — tự đổi khi qua nửa đêm,
 * kể cả khi trang Hôm nay vẫn đang mở.
 */
export function useHomNay(): string {
  return useSyncExternalStore(
    theoDoiNgay,
    () => khoaNgay(new Date()),
    () => "",
  );
}
