"use client";
/**
 * Hook React đọc hồ sơ từ localStorage.
 * - Trên server (lúc dựng HTML sẵn) chưa có localStorage → daTai = false, giao diện hiện "Đang tải…".
 * - Trên trình duyệt → đọc hồ sơ và tự cập nhật mỗi khi hồ sơ được lưu lại.
 */
import { useMemo, useSyncExternalStore } from "react";
import { docHoSoRaw, phanTichHoSo, theoDoiThayDoi } from "@/lib/storage";

const CHUA_TAI = "__chua_tai__";

export function useHoSo() {
  const raw = useSyncExternalStore(
    theoDoiThayDoi,
    () => docHoSoRaw(),
    () => CHUA_TAI,
  );
  return useMemo(() => {
    if (raw === CHUA_TAI) return { daTai: false as const, hoSo: null };
    return { daTai: true as const, hoSo: phanTichHoSo(raw) };
  }, [raw]);
}
