/**
 * Kiểm tra kết quả AI + phương án dự phòng không cần AI (hàm thuần, có test).
 *
 * Nguyên tắc: KHÔNG tin kết quả AI. Món phải có trong database, bữa/khẩu phần phải hợp lệ,
 * câu giải thích không được chứa con số nào ngoài số liệu engine đã tính.
 */
import { DO_DAI_GIAI_THICH_TOI_DA, SO_MON_GAN_TEN } from "@/lib/config";
import {
  dinhDuongKhauPhan,
  type Bua,
  type KhauPhan,
  type Mon,
} from "@/lib/engine/dishes";
import { so } from "@/lib/engine/explain";
import { NHAN_BUA, NHAN_KHAU_PHAN } from "@/lib/labels";
import { boDau } from "@/lib/text";

/** Đọc JSON an toàn: lỗi → null */
export function docJSON(text: string | null): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function tachTu(s: string): string[] {
  return boDau(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// ─────────────────────────────────────────────
// Tìm món gần tên nhất (dùng khi AI không nhận ra món, và cho phương án dự phòng)
// ─────────────────────────────────────────────
/**
 * Điểm = tỉ lệ số từ trong tên món xuất hiện trong câu người dùng (0 → 1).
 * Ví dụ "trưa ăn cơm tấm sườn" với "Cơm tấm sườn" → 3/3 = 1.
 */
export function diemTenMon(cauNhap: string, mon: Mon): number {
  const tuCau = new Set(tachTu(cauNhap));
  const tuTen = tachTu(mon.name);
  if (tuTen.length === 0) return 0;
  return tuTen.filter((t) => tuCau.has(t)).length / tuTen.length;
}

export function monGanTen(
  cauNhap: string,
  mons: Mon[],
  soLuong = SO_MON_GAN_TEN,
): Mon[] {
  return mons
    .map((m) => ({ m, d: diemTenMon(cauNhap, m) }))
    .filter((x) => x.d > 0)
    .sort((a, b) => b.d - a.d || a.m.id.localeCompare(b.m.id))
    .slice(0, soLuong)
    .map((x) => x.m);
}

// ─────────────────────────────────────────────
// Tính năng 1: nhập món bằng chat
// ─────────────────────────────────────────────
export interface KetQuaNhapMon {
  monId: string | null; // null → người dùng chọn trong goiY
  bua: Bua;
  khauPhan: KhauPhan;
  goiY: Mon[]; // 3 món gần tên nhất
}

const CAC_KP: KhauPhan[] = ["it", "vua", "nhieu"];

/** Kiểm tra JSON AI trả về { meal, dish_id, portion } — sai chỗ nào thì sửa về giá trị an toàn. */
export function kiemTraNhapMon(
  raw: unknown,
  ctx: { cauNhap: string; cacBua: Bua[]; buaMacDinh: Bua; mons: Mon[] },
): KetQuaNhapMon | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as { meal?: unknown; dish_id?: unknown; portion?: unknown };
  if (!("dish_id" in r) || !("meal" in r) || !("portion" in r)) return null; // thiếu trường → không dùng
  const mon =
    typeof r.dish_id === "string"
      ? ctx.mons.find((m) => m.id === r.dish_id)
      : undefined;
  return {
    monId: mon?.id ?? null, // món không có trong database → coi như AI không nhận ra
    bua: ctx.cacBua.includes(r.meal as Bua) ? (r.meal as Bua) : ctx.buaMacDinh,
    khauPhan: CAC_KP.includes(r.portion as KhauPhan)
      ? (r.portion as KhauPhan)
      : "vua",
    goiY: monGanTen(ctx.cauNhap, ctx.mons),
  };
}

/** Phương án dự phòng không cần AI: tìm từ khóa bữa, khẩu phần và so khớp tên món. */
export function nhapMonDuPhong(ctx: {
  cauNhap: string;
  cacBua: Bua[];
  buaMacDinh: Bua;
  mons: Mon[];
}): KetQuaNhapMon {
  const tu = tachTu(ctx.cauNhap);
  const co = (...x: string[]) => x.some((t) => tu.includes(t));

  let bua: Bua = ctx.buaMacDinh;
  if (co("sang")) bua = "sang";
  else if (co("trua")) bua = "trua";
  else if (co("toi")) bua = "toi";
  else if (co("phu", "xe", "vat")) bua = "phu";
  if (!ctx.cacBua.includes(bua)) bua = ctx.buaMacDinh;

  let khauPhan: KhauPhan = "vua";
  if (co("nhieu", "bu", "lon")) khauPhan = "nhieu";
  else if (co("it", "nho")) khauPhan = "it";

  const goiY = monGanTen(ctx.cauNhap, ctx.mons);
  // Chỉ tự chọn món khi khớp đủ mọi từ trong tên món
  const chacChan =
    goiY[0] && diemTenMon(ctx.cauNhap, goiY[0]) === 1 ? goiY[0].id : null;
  return { monId: chacChan, bua, khauPhan, goiY };
}

// ─────────────────────────────────────────────
// Tính năng 2: "Vì sao chọn món này?"
// ─────────────────────────────────────────────
export interface ThongTinGiaiThich {
  mon: Mon;
  khauPhan: KhauPhan;
  bua: Bua;
  kcalBua: number; // calo mục tiêu của bữa (engine tính)
  phongCach: "can_bang" | "high_protein" | "tiet_kiem";
  tagUuTien: string[]; // vd ["gi_thap"]
}

/** Các con số AI ĐƯỢC PHÉP nhắc tới = số liệu engine đã tính và gửi đi. */
export function soDuocPhep(t: ThongTinGiaiThich): number[] {
  const d = dinhDuongKhauPhan(t.mon, t.khauPhan);
  return [d.kcal, d.protein, d.carb, d.fat, t.kcalBua, t.mon.price_vnd];
}

/** Lấy mọi con số trong câu, hiểu được "1.650", "1,6", "35.000 đ" */
export function laySoTrongCau(text: string): number[][] {
  const ketQua: number[][] = [];
  for (const m of text.matchAll(/\d+(?:[.,]\d+)*/g)) {
    const raw = m[0];
    // Một con số có thể hiểu theo 3 cách: bỏ hết dấu ngăn cách ("1.650" = 1650),
    // dấu phẩy là thập phân kiểu Việt ("1,6" = 1.6), dấu chấm là thập phân kiểu Anh ("1.65" = 1.65)
    const cach = new Set<number>([
      Number(raw.replace(/[.,]/g, "")),
      Number(raw.replace(/\./g, "").replace(",", ".")),
      Number(raw.replace(/,/g, "")),
    ]);
    ketQua.push([...cach].filter(Number.isFinite));
  }
  return ketQua;
}

/** Câu giải thích hợp lệ: không rỗng, không quá dài, và mọi con số đều nằm trong danh sách được phép. */
export function kiemTraGiaiThich(
  text: string | null,
  duocPhep: number[],
): string | null {
  if (!text) return null;
  const cau = text.trim();
  if (cau.length === 0 || cau.length > DO_DAI_GIAI_THICH_TOI_DA) return null;
  const hopLe = laySoTrongCau(cau).every((cach) =>
    cach.some((x) => duocPhep.includes(x)),
  );
  return hopLe ? cau : null;
}

/** Lời giải thích dự phòng — ghép từ số liệu engine, không cần AI. */
export function giaiThichDuPhong(t: ThongTinGiaiThich): string {
  const d = dinhDuongKhauPhan(t.mon, t.khauPhan);
  let cau =
    `${t.mon.name} phần ${NHAN_KHAU_PHAN[t.khauPhan].toLowerCase()} khoảng ${so(d.kcal)} kcal, ` +
    `gần với mức ${so(t.kcalBua)} kcal dành cho ${NHAN_BUA[t.bua].toLowerCase()} của bạn.`;
  if (
    t.phongCach === "high_protein" &&
    t.mon.style_tags.includes("high_protein")
  )
    cau += " Món có nhiều đạm, hợp với phong cách High-protein.";
  else if (t.phongCach === "tiet_kiem")
    cau += ` Giá khoảng ${so(t.mon.price_vnd)} đ, hợp với phong cách Tiết kiệm.`;
  if (t.tagUuTien.includes("gi_thap") && t.mon.health_tags.includes("gi_thap"))
    cau += " Món có chỉ số đường huyết thấp, phù hợp gợi ý ăn uống của bạn.";
  else cau += " Món cũng phù hợp với bộ lọc ăn uống bạn đã chọn.";
  return cau;
}
