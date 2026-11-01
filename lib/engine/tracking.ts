/**
 * Theo dõi ăn uống hằng ngày (SPEC mục 7 + phần "Theo dõi" ở mục 4).
 *
 * - "Lỡ ăn rồi": calo dư của một ngày (so với mục tiêu gốc) chia đều cho 3 ngày sau.
 *   Mỗi ngày chỉ giảm tối đa 10% và không xuống dưới mức sàn. Phần không bù hết thì bỏ qua.
 * - Luật quan tâm: 3 ngày liền (có ghi chép) dưới mức sàn → hiện thông điệp quan tâm
 *   và TẮT giảm bù (không siết thêm calo).
 */
import {
  GIAM_BU_TOI_DA_MOI_NGAY,
  KCAL_MOI_GAM,
  SO_NGAY_CHIA_BU,
  SO_NGAY_DUOI_SAN_CANH_BAO,
} from "@/lib/config";
import type { Bua, DinhDuong, KhauPhan } from "./dishes";
import type { MonDaChon, NgayThucDon } from "./menu";

export interface MonDaAn {
  id: string; // mã riêng của lần ghi (để xóa)
  monId: string;
  khauPhan: KhauPhan;
  bua: Bua;
  ngoaiKeHoach: boolean; // true = ghi qua nút "Lỡ ăn rồi"
  dinhDuong: DinhDuong; // số liệu do engine tính lúc ghi (món × khẩu phần)
}

export interface NhatKyNgay {
  mon: MonDaAn[];
  nuoc: number; // số ly
}

/** Nhật ký theo ngày, khóa dạng "YYYY-MM-DD" */
export type NhatKy = Record<string, NhatKyNgay>;

// ─────────────────────────────────────────────
// Ngày tháng (dùng khóa "YYYY-MM-DD" theo giờ máy người dùng)
// ─────────────────────────────────────────────
export function khoaNgay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const n = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${n}`;
}

/** Cộng/trừ số ngày vào khóa ngày: congNgay("2026-11-01", -1) = "2026-10-31" */
export function congNgay(khoa: string, soNgay: number): string {
  const [y, m, d] = khoa.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + soNgay));
  return t.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────
// Tổng một ngày
// ─────────────────────────────────────────────
export function tongNgay(ngay: NhatKyNgay | undefined): DinhDuong {
  return (ngay?.mon ?? []).reduce(
    (t, m) => ({
      kcal: t.kcal + m.dinhDuong.kcal,
      protein: t.protein + m.dinhDuong.protein,
      carb: t.carb + m.dinhDuong.carb,
      fat: t.fat + m.dinhDuong.fat,
    }),
    { kcal: 0, protein: 0, carb: 0, fat: 0 },
  );
}

/** Calo dư của một ngày = tổng đã ăn − mục tiêu gốc (âm thì tính 0) */
export function phanChenh(tongKcal: number, mucTieuGoc: number): number {
  return Math.max(0, tongKcal - mucTieuGoc);
}

// ─────────────────────────────────────────────
// Luật quan tâm: 3 ngày liền dưới mức sàn
// ─────────────────────────────────────────────
/**
 * Xét 3 ngày liền ngay trước hôm nay (không tính hôm nay vì chưa hết ngày).
 * Ngày không ghi gì → không tính (không ghi chưa chắc là không ăn).
 */
export function duoiMucSanNhieuNgay(nhatKy: NhatKy, homNay: string, mucSan: number): boolean {
  for (let k = 1; k <= SO_NGAY_DUOI_SAN_CANH_BAO; k++) {
    const ngay = nhatKy[congNgay(homNay, -k)];
    if (!ngay || ngay.mon.length === 0) return false;
    if (tongNgay(ngay).kcal >= mucSan) return false;
  }
  return true;
}

// ─────────────────────────────────────────────
// "Lỡ ăn rồi": giảm bù cho một ngày
// ─────────────────────────────────────────────
export interface KetQuaGiamBu {
  giam: number; // số kcal giảm trong ngày này
  mucTieuNgay: number; // mục tiêu sau khi giảm
  chiTiet: { tuNgay: string; du: number; phan: number }[]; // từ ngày nào, dư bao nhiêu, chia bao nhiêu
  biGioiHan: boolean; // true nếu bị chặn bởi mức 10% hoặc mức sàn
}

/**
 * Mức giảm cho ngày `ngay`:
 *   tổng = Σ (calo dư của mỗi ngày trong 3 ngày trước ÷ 3)
 *   giới hạn = min(10% mục tiêu gốc, mục tiêu gốc − mức sàn)
 *   giảm = min(tổng, giới hạn)
 * Đang có cảnh báo dưới mức sàn → không giảm (an toàn thắng).
 */
export function giamBuChoNgay(p: {
  nhatKy: NhatKy;
  ngay: string;
  mucTieuGoc: number;
  mucSan: number;
  dangCanhBao: boolean;
}): KetQuaGiamBu {
  const { nhatKy, ngay, mucTieuGoc, mucSan, dangCanhBao } = p;
  if (dangCanhBao) return { giam: 0, mucTieuNgay: mucTieuGoc, chiTiet: [], biGioiHan: false };

  const chiTiet: KetQuaGiamBu["chiTiet"] = [];
  for (let k = 1; k <= SO_NGAY_CHIA_BU; k++) {
    const tuNgay = congNgay(ngay, -k);
    const du = phanChenh(tongNgay(nhatKy[tuNgay]).kcal, mucTieuGoc);
    if (du > 0) chiTiet.push({ tuNgay, du, phan: du / SO_NGAY_CHIA_BU });
  }
  const tong = chiTiet.reduce((s, c) => s + c.phan, 0);
  const gioiHan = Math.min(mucTieuGoc * GIAM_BU_TOI_DA_MOI_NGAY, Math.max(0, mucTieuGoc - mucSan));
  const giam = Math.round(Math.min(tong, gioiHan));
  return { giam, mucTieuNgay: mucTieuGoc - giam, chiTiet, biGioiHan: tong > gioiHan };
}

/**
 * Macro mục tiêu của ngày khi có giảm bù: giữ nguyên đạm và béo, bớt phần giảm vào tinh bột
 * (giảm kcal ÷ 4 = số gam tinh bột bớt đi).
 */
export function macroMucTieuNgay(
  macro: { proteinG: number; fatG: number; carbG: number },
  giam: number,
): { proteinG: number; fatG: number; carbG: number } {
  return {
    proteinG: macro.proteinG,
    fatG: macro.fatG,
    carbG: Math.max(0, macro.carbG - Math.round(giam / KCAL_MOI_GAM.carb)),
  };
}

// ─────────────────────────────────────────────
// Gợi ý bữa kế tiếp
// ─────────────────────────────────────────────
/** Bữa đầu tiên trong thực đơn hôm nay mà người dùng chưa ghi (món "Lỡ ăn rồi" không tính là đã ăn bữa đó). */
export function buaKeTiep(ngayThucDon: NgayThucDon | undefined, daAn: MonDaAn[]): MonDaChon | null {
  if (!ngayThucDon) return null;
  const buaDaGhi = new Set(daAn.filter((m) => !m.ngoaiKeHoach).map((m) => m.bua));
  return ngayThucDon.bua.find((b) => !buaDaGhi.has(b.bua)) ?? null;
}
