/**
 * Đọc/ghi localStorage. Dữ liệu sức khỏe CHỈ nằm trên máy người dùng, không gửi đi đâu.
 *
 * Có "đăng ký theo dõi" (subscribe) để các trang tự cập nhật khi hồ sơ thay đổi.
 */
import { laHoSoHopLe, type HoSo } from "@/lib/profile";

export const KHOA_HO_SO = "nutriviet.hoSo";
const SU_KIEN_THAY_DOI = "nutriviet:storage";

/** Kho lưu trữ tối thiểu — trong trình duyệt là window.localStorage, trong test là bản giả. */
export interface KhoLuuTru {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function khoMacDinh(): KhoLuuTru | null {
  if (typeof window === "undefined") return null; // đang chạy trên server
  try {
    return window.localStorage;
  } catch {
    return null; // trình duyệt chặn localStorage (vd chế độ riêng tư)
  }
}

/** Đọc hồ sơ. Không có hoặc dữ liệu hỏng → null (coi như chưa có hồ sơ). */
export function docHoSo(kho: KhoLuuTru | null = khoMacDinh()): HoSo | null {
  return phanTichHoSo(kho?.getItem(KHOA_HO_SO) ?? null);
}

export function phanTichHoSo(raw: string | null): HoSo | null {
  if (!raw) return null;
  try {
    const x: unknown = JSON.parse(raw);
    return laHoSoHopLe(x) ? x : null;
  } catch {
    return null;
  }
}

export function luuHoSo(hoSo: HoSo, kho: KhoLuuTru | null = khoMacDinh()): void {
  if (!kho) return;
  kho.setItem(KHOA_HO_SO, JSON.stringify(hoSo));
  baoThayDoi();
}

export function xoaHoSo(kho: KhoLuuTru | null = khoMacDinh()): void {
  if (!kho) return;
  kho.removeItem(KHOA_HO_SO);
  baoThayDoi();
}

function baoThayDoi() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SU_KIEN_THAY_DOI));
}

/** Đăng ký nhận thông báo khi dữ liệu thay đổi (cùng tab hoặc tab khác). Trả về hàm hủy. */
export function theoDoiThayDoi(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SU_KIEN_THAY_DOI, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SU_KIEN_THAY_DOI, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Đọc chuỗi thô (dùng cho hook React để so sánh thay đổi). */
export function docHoSoRaw(kho: KhoLuuTru | null = khoMacDinh()): string | null {
  return kho?.getItem(KHOA_HO_SO) ?? null;
}
