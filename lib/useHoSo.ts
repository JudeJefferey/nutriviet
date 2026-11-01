"use client";
/**
 * Hook React đọc dữ liệu từ localStorage.
 * - Trên server (lúc dựng HTML sẵn) chưa có localStorage → daTai = false, giao diện hiện "Đang tải…".
 * - Trên trình duyệt → đọc dữ liệu và tự cập nhật mỗi khi dữ liệu được lưu lại.
 */
import { useMemo, useSyncExternalStore } from "react";
import { KHOA_HO_SO, docRaw, phanTichHoSo, theoDoiThayDoi } from "@/lib/storage";

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
