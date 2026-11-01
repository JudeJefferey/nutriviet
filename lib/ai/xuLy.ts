/**
 * Quy trình cho 3 tính năng AI: kiểm tra đầu vào → gọi AI → kiểm tra kết quả → (nếu hỏng) dự phòng.
 * Hàm gọi AI được truyền vào (`goi`) để test có thể dùng AI giả lập, không cần mạng hay key.
 */
import {
  DO_DAI_CAU_NHAP_TOI_DA,
  GIOI_HAN_NHAP,
  THOI_GIAN_NAU_LUA_CHON,
} from "@/lib/config";
import type { BoLoc, Bua, KhauPhan } from "@/lib/engine/dishes";
import {
  taoThucDon,
  dungThucDonTuLuaChon,
  ungVienTheoBua,
  type PhongCach,
  type ThucDonTuan,
} from "@/lib/engine/menu";
import { DANH_SACH_MON, timMon } from "@/lib/monAn";
import type { GoiAI } from "./client";
import {
  docJSON,
  giaiThichDuPhong,
  kiemTraGiaiThich,
  kiemTraNhapMon,
  nhapMonDuPhong,
  soDuocPhep,
  type ThongTinGiaiThich,
} from "./kiemTra";
import {
  promptChonMon,
  promptGiaiThich,
  promptNhapMon,
  schemaChonMon,
  schemaNhapMon,
} from "./prompts";

export type Nguon = "ai" | "du_phong";

const CAC_BUA: Bua[] = ["sang", "trua", "toi", "phu"];
const CAC_KP: KhauPhan[] = ["it", "vua", "nhieu"];
const CAC_PHONG_CACH: PhongCach[] = ["can_bang", "high_protein", "tiet_kiem"];
const laChuoi = (x: unknown): x is string => typeof x === "string";
const laMangChuoi = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every(laChuoi) && x.length <= 50;
const laSo = (x: unknown, min: number, max: number): x is number =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;

// ═════════════ Tính năng 1: nhập món bằng chat ═════════════
export interface YeuCauNhapMon {
  cauNhap: string;
  cacBua: Bua[];
  buaMacDinh: Bua;
}

/** Kiểm tra dữ liệu trình duyệt gửi lên (không tin dữ liệu từ ngoài) */
export function docYeuCauNhapMon(x: unknown): YeuCauNhapMon | null {
  const r = x as Partial<YeuCauNhapMon>;
  if (!r || !laChuoi(r.cauNhap)) return null;
  const cauNhap = r.cauNhap.trim();
  if (cauNhap.length === 0 || cauNhap.length > DO_DAI_CAU_NHAP_TOI_DA)
    return null;
  if (
    !Array.isArray(r.cacBua) ||
    r.cacBua.length === 0 ||
    !r.cacBua.every((b) => CAC_BUA.includes(b))
  )
    return null;
  if (
    !CAC_BUA.includes(r.buaMacDinh as Bua) ||
    !r.cacBua.includes(r.buaMacDinh as Bua)
  )
    return null;
  return { cauNhap, cacBua: r.cacBua, buaMacDinh: r.buaMacDinh as Bua };
}

export async function xuLyNhapMon(yc: YeuCauNhapMon, goi: GoiAI) {
  const ctx = { ...yc, mons: DANH_SACH_MON };
  const chu = await goi({
    noiDung: promptNhapMon(yc.cauNhap, yc.cacBua, DANH_SACH_MON),
    khuonJSON: schemaNhapMon(yc.cacBua, DANH_SACH_MON),
  });
  const tuAI = kiemTraNhapMon(docJSON(chu), ctx);
  const kq = tuAI ?? nhapMonDuPhong(ctx);
  return {
    nguon: (tuAI ? "ai" : "du_phong") as Nguon,
    monId: kq.monId,
    bua: kq.bua,
    khauPhan: kq.khauPhan,
    goiY: kq.goiY.map((m) => m.id),
  };
}

// ═════════════ Tính năng 2: "Vì sao chọn món này?" ═════════════
export interface YeuCauGiaiThich {
  monId: string;
  khauPhan: KhauPhan;
  bua: Bua;
  kcalBua: number;
  phongCach: PhongCach;
  tagUuTien: string[];
  tenMucTieu: string;
}

export function docYeuCauGiaiThich(x: unknown): YeuCauGiaiThich | null {
  const r = x as Partial<YeuCauGiaiThich>;
  if (!r || !laChuoi(r.monId) || !timMon(r.monId)) return null;
  if (
    !CAC_KP.includes(r.khauPhan as KhauPhan) ||
    !CAC_BUA.includes(r.bua as Bua)
  )
    return null;
  if (
    !laSo(r.kcalBua, 50, 3000) ||
    !CAC_PHONG_CACH.includes(r.phongCach as PhongCach)
  )
    return null;
  if (
    !laMangChuoi(r.tagUuTien) ||
    !laChuoi(r.tenMucTieu) ||
    r.tenMucTieu.length > 50
  )
    return null;
  return r as YeuCauGiaiThich;
}

export async function xuLyGiaiThich(yc: YeuCauGiaiThich, goi: GoiAI) {
  const t: ThongTinGiaiThich = {
    mon: timMon(yc.monId)!, // số liệu món lấy lại từ database phía máy chủ, không tin trình duyệt
    khauPhan: yc.khauPhan,
    bua: yc.bua,
    kcalBua: Math.round(yc.kcalBua),
    phongCach: yc.phongCach,
    tagUuTien: yc.tagUuTien.filter((x) => x === "gi_thap"),
  };
  const chu = await goi({ noiDung: promptGiaiThich(t, yc.tenMucTieu) });
  const cau = kiemTraGiaiThich(chu, soDuocPhep(t));
  return cau
    ? { nguon: "ai" as Nguon, cau }
    : { nguon: "du_phong" as Nguon, cau: giaiThichDuPhong(t) };
}

// ═════════════ Tính năng 3: chọn món đa dạng ═════════════
export interface YeuCauChonMon {
  boLoc: BoLoc;
  kcalMucTieu: number;
  soBua: 3 | 4;
  phongCach: PhongCach;
  tagUuTien: string[];
  noiAn: "an_ngoai" | "nau_nha" | null;
}

export function docYeuCauChonMon(x: unknown): YeuCauChonMon | null {
  const r = x as Partial<YeuCauChonMon>;
  const b = r?.boLoc as Partial<BoLoc> | undefined;
  if (!r || !b) return null;
  if (
    !laMangChuoi(b.tagLoai) ||
    !laMangChuoi(b.diUng) ||
    !laMangChuoi(b.monKhongThich)
  )
    return null;
  if (!["khong_kieng", "chay", "khong_heo"].includes(b.cheDoAn as string))
    return null;
  const G = GIOI_HAN_NHAP.nganSachMoiBuaVnd;
  if (!laSo(b.nganSachMoiBuaVnd, G.min, G.max)) return null;
  if (
    !(THOI_GIAN_NAU_LUA_CHON as readonly number[]).includes(
      b.thoiGianNauToiDa as number,
    )
  )
    return null;
  if (!laSo(r.kcalMucTieu, 800, 5000) || (r.soBua !== 3 && r.soBua !== 4))
    return null;
  if (
    !CAC_PHONG_CACH.includes(r.phongCach as PhongCach) ||
    !laMangChuoi(r.tagUuTien)
  )
    return null;
  if (r.noiAn !== null && r.noiAn !== "an_ngoai" && r.noiAn !== "nau_nha")
    return null;
  return r as YeuCauChonMon;
}

export async function xuLyChonMon(
  yc: YeuCauChonMon,
  goi: GoiAI,
): Promise<{ nguon: Nguon; thucDon: ThucDonTuan }> {
  const tc = { ...yc, mons: DANH_SACH_MON };
  const ungVien = ungVienTheoBua(tc);
  // Không bữa nào được trống ứng viên — nếu trống thì AI cũng không làm được gì, dùng thuật toán
  if (ungVien.every((u) => u.mon.length > 0)) {
    const chu = await goi({
      noiDung: promptChonMon(ungVien, yc.phongCach),
      khuonJSON: schemaChonMon(ungVien),
    });
    const raw = docJSON(chu) as { ngay?: { mon?: unknown }[] } | null;
    const luaChon = Array.isArray(raw?.ngay)
      ? raw.ngay.map((n) => n?.mon)
      : null;
    const thucDon = dungThucDonTuLuaChon(luaChon, tc); // engine kiểm tra lại mọi luật
    if (thucDon) return { nguon: "ai", thucDon };
  }
  return {
    nguon: "du_phong",
    thucDon: { ...taoThucDon(tc), nguon: "thuat_toan" },
  };
}
