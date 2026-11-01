/**
 * Đọc/ghi localStorage. Dữ liệu sức khỏe CHỈ nằm trên máy người dùng, không gửi đi đâu.
 *
 * Có "đăng ký theo dõi" (subscribe) để các trang tự cập nhật khi hồ sơ thay đổi.
 */
import type { PhongCach, ThucDonTuan } from "@/lib/engine/menu";
import { timMon } from "@/lib/monAn";
import { laHoSoHopLe, type HoSo } from "@/lib/profile";

export const KHOA_HO_SO = "nutriviet.hoSo";
export const KHOA_THUC_DON = "nutriviet.thucDon";
export const KHOA_PHONG_CACH = "nutriviet.phongCach";
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

/** Đọc chuỗi thô của một khóa (dùng cho hook React để so sánh thay đổi). */
export function docRaw(khoa: string, kho: KhoLuuTru | null = khoMacDinh()): string | null {
  return kho?.getItem(khoa) ?? null;
}

// ─────────────────────────────────────────────
// Thực đơn 7 ngày (Giai đoạn 3)
// Lưu kèm "dấu vân tay" của hồ sơ: hồ sơ đổi → thực đơn cũ không dùng nữa, tạo lại tự động.
// ─────────────────────────────────────────────
interface ThucDonDaLuu {
  phienBan: 1;
  dauHoSo: string; // JSON hồ sơ lúc tạo thực đơn
  theoPhongCach: Partial<Record<PhongCach, ThucDonTuan>>;
}

function dauHoSo(h: HoSo): string {
  return JSON.stringify(h);
}

export function phanTichThucDonDaLuu(raw: string | null, hoSo: HoSo): ThucDonDaLuu | null {
  if (!raw) return null;
  try {
    const x = JSON.parse(raw) as ThucDonDaLuu;
    if (x?.phienBan !== 1 || x.dauHoSo !== dauHoSo(hoSo) || typeof x.theoPhongCach !== "object") return null;
    return x;
  } catch {
    return null;
  }
}

/** Thực đơn đã lưu (đã đổi món) của một phong cách — null nếu chưa có / hồ sơ đã đổi / dữ liệu hỏng. */
export function layThucDonDaLuu(raw: string | null, hoSo: HoSo, phongCach: PhongCach): ThucDonTuan | null {
  const t = phanTichThucDonDaLuu(raw, hoSo)?.theoPhongCach[phongCach];
  if (!t || !Array.isArray(t.ngay) || t.ngay.length !== 7) return null;
  // Món phải còn trong database (phòng khi nhóm sửa dishes.json)
  const conDuMon = t.ngay.every((n) => Array.isArray(n.bua) && n.bua.every((b) => timMon(b.monId)));
  return conDuMon ? t : null;
}

export function luuThucDon(hoSo: HoSo, thucDon: ThucDonTuan, kho: KhoLuuTru | null = khoMacDinh()): void {
  if (!kho) return;
  const cu = phanTichThucDonDaLuu(kho.getItem(KHOA_THUC_DON), hoSo);
  const moi: ThucDonDaLuu = {
    phienBan: 1,
    dauHoSo: dauHoSo(hoSo),
    theoPhongCach: { ...(cu?.theoPhongCach ?? {}), [thucDon.phongCach]: thucDon },
  };
  kho.setItem(KHOA_THUC_DON, JSON.stringify(moi));
  baoThayDoi();
}

/** Bỏ các lần đổi món của một phong cách → quay về thực đơn gốc do thuật toán tạo. */
export function xoaThucDonPhongCach(hoSo: HoSo, phongCach: PhongCach, kho: KhoLuuTru | null = khoMacDinh()): void {
  if (!kho) return;
  const cu = phanTichThucDonDaLuu(kho.getItem(KHOA_THUC_DON), hoSo);
  if (!cu) return;
  delete cu.theoPhongCach[phongCach];
  kho.setItem(KHOA_THUC_DON, JSON.stringify(cu));
  baoThayDoi();
}

export function luuPhongCach(p: PhongCach, kho: KhoLuuTru | null = khoMacDinh()): void {
  if (!kho) return;
  kho.setItem(KHOA_PHONG_CACH, p);
  baoThayDoi();
}
