/**
 * Đọc / ghi file CSV số liệu món (data/mon-an.csv) ⇄ data/dishes.json.
 *
 * Nhóm sửa số liệu trong Excel / Google Sheets, rồi chạy `npm run nhap-mon`.
 * File này KIỂM TRA KỸ trước khi cho ghi: sai bất kỳ dòng nào → báo lỗi, không ghi gì.
 *
 * Lưu ý kỹ thuật: file này không import gì (trừ kiểu dữ liệu) để chạy được trực tiếp bằng Node.
 */
import type { Bua, KhauPhan, Mon } from "./engine/dishes";

// ─────────────────────────────────────────────
// Cột của file CSV (thứ tự cột trong file không quan trọng)
// ─────────────────────────────────────────────
export const COT = [
  "id",
  "ten_mon",
  "bua",
  "kcal",
  "dam_g",
  "tinh_bot_g",
  "beo_g",
  "he_so_it",
  "he_so_vua",
  "he_so_nhieu",
  "gia_vnd",
  "phut_nau",
  "an_ngoai",
  "che_do",
  "di_ung",
  "nhan_suc_khoe",
  "nhan_phong_cach",
  "nguyen_lieu",
  "nguon_so_lieu",
  "verified",
] as const;
type TenCot = (typeof COT)[number];

/** Trong một ô có nhiều giá trị (vd nhiều bữa, nhiều nguyên liệu) thì ngăn cách bằng dấu | */
export const NGAN_DANH_SACH = "|";

const CAC_BUA: Bua[] = ["sang", "trua", "toi", "phu"];
const CHE_DO = ["chay", "khong_heo"];
const NHAN_SUC_KHOE = ["nhieu_duong", "gi_thap", "nhieu_purine", "nhieu_muoi"];
const NHAN_PHONG_CACH = ["high_protein", "tiet_kiem", "nhanh_15p"];

/** Nguyên liệu có chữ này mà quên khai chất gây dị ứng tương ứng → báo lỗi (an toàn) */
const DI_UNG_AN: { chu: string[]; ma: string }[] = [
  { chu: ["nước mắm"], ma: "nuoc_mam" },
  { chu: ["mắm tôm", "mắm ruốc"], ma: "mam_tom" },
  { chu: ["đậu phộng", "lạc rang"], ma: "dau_phong" },
];

// ─────────────────────────────────────────────
// Đọc CSV
// ─────────────────────────────────────────────

/** Excel tiếng Việt thường lưu CSV bằng dấu ; — tự nhận ra dấu phân cách từ dòng tiêu đề */
function nhanDauPhanCach(dongDau: string): "," | ";" {
  return (dongDau.match(/;/g)?.length ?? 0) > (dongDau.match(/,/g)?.length ?? 0)
    ? ";"
    : ",";
}

/** Tách CSV thành bảng (hiểu ô có ngoặc kép, dấu phẩy và xuống dòng bên trong ô) */
export function docCsv(text: string): {
  bang: string[][];
  dauPhanCach: "," | ";";
} {
  const sach = text.replace(/^﻿/, ""); // bỏ BOM Excel thêm vào đầu file
  const dauPhanCach = nhanDauPhanCach(sach.split(/\r?\n/)[0] ?? "");
  const bang: string[][] = [];
  let dong: string[] = [];
  let o = "";
  let trongNgoac = false;
  for (let i = 0; i < sach.length; i++) {
    const c = sach[i];
    if (trongNgoac) {
      if (c === '"' && sach[i + 1] === '"') {
        o += '"';
        i++;
      } else if (c === '"') trongNgoac = false;
      else o += c;
    } else if (c === '"') trongNgoac = true;
    else if (c === dauPhanCach) {
      dong.push(o);
      o = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && sach[i + 1] === "\n") i++;
      dong.push(o);
      bang.push(dong);
      dong = [];
      o = "";
    } else o += c;
  }
  if (o !== "" || dong.length > 0) {
    dong.push(o);
    bang.push(dong);
  }
  // bỏ các dòng trống hoàn toàn
  return {
    bang: bang.filter((d) => d.some((x) => x.trim() !== "")),
    dauPhanCach,
  };
}

// ─────────────────────────────────────────────
// CSV → danh sách món (có kiểm tra)
// ─────────────────────────────────────────────
export interface LoiNhap {
  dong: number; // số dòng trong file (dòng tiêu đề = 1)
  cot?: string;
  thongBao: string;
}

export interface CauHinhNhap {
  maDiUng: string[]; // mã dị ứng hợp lệ (lib/config.ts → DANH_SACH_DI_UNG)
  soMonToiThieu: number;
  soMonToiDa: number;
  lechKcalToiDa: number; // vd 0.1 = 10%
}

/** Đọc số: chấp nhận "4,5" (dấu phẩy thập phân kiểu Việt) và bỏ khoảng trắng */
function docSoThuc(chu: string): number {
  const s = chu.trim().replace(/\s/g, "").replace(",", ".");
  return s === "" || !/^-?\d+(\.\d+)?$/.test(s) ? NaN : Number(s);
}
/** Đọc tiền / số nguyên: "35.000" hay "35,000" đều là 35000 */
function docSoNguyen(chu: string): number {
  const s = chu.trim().replace(/[\s.,]/g, "");
  return s === "" || !/^\d+$/.test(s) ? NaN : Number(s);
}
function docDanhSach(chu: string): string[] {
  return chu
    .split(NGAN_DANH_SACH)
    .map((x) => x.trim())
    .filter(Boolean);
}
function docDungSai(chu: string): boolean | null {
  const s = chu.trim().toLowerCase();
  if (["true", "co", "có", "x", "1", "yes"].includes(s)) return true;
  if (["false", "khong", "không", "", "0", "no"].includes(s)) return false;
  return null;
}

export function csvThanhMon(
  text: string,
  ch: CauHinhNhap,
): { mons: Mon[]; loi: LoiNhap[] } {
  const loi: LoiNhap[] = [];
  const { bang } = docCsv(text);
  if (bang.length === 0)
    return { mons: [], loi: [{ dong: 1, thongBao: "File trống." }] };

  const tieuDe = bang[0].map((x) => x.trim().toLowerCase());
  const thieu = COT.filter((c) => !tieuDe.includes(c));
  if (thieu.length > 0)
    return {
      mons: [],
      loi: [{ dong: 1, thongBao: `Thiếu cột: ${thieu.join(", ")}` }],
    };
  const viTri = Object.fromEntries(
    COT.map((c) => [c, tieuDe.indexOf(c)]),
  ) as Record<TenCot, number>;

  const mons: Mon[] = [];
  const daCoId = new Set<string>();

  bang.slice(1).forEach((hang, i) => {
    const dong = i + 2; // dòng trong file (tiêu đề là dòng 1)
    const o = (c: TenCot) => (hang[viTri[c]] ?? "").trim();
    const bao = (cot: TenCot | undefined, thongBao: string) =>
      loi.push({ dong, cot, thongBao });

    const id = o("id");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))
      bao(
        "id",
        `"${id}" không hợp lệ — chỉ dùng chữ thường không dấu, số và dấu gạch ngang (vd com-tam-suon)`,
      );
    else if (daCoId.has(id))
      bao("id", `"${id}" bị trùng với một dòng phía trên`);
    daCoId.add(id);

    const ten = o("ten_mon");
    if (!ten) bao("ten_mon", "Chưa có tên món");

    const bua = docDanhSach(o("bua"));
    if (bua.length === 0) bao("bua", "Chưa chọn bữa (sang | trua | toi | phu)");
    bua
      .filter((b) => !CAC_BUA.includes(b as Bua))
      .forEach((b) =>
        bao("bua", `Bữa "${b}" không hợp lệ (chỉ: sang, trua, toi, phu)`),
      );

    const kcal = docSoThuc(o("kcal"));
    const dam = docSoThuc(o("dam_g"));
    const tinhBot = docSoThuc(o("tinh_bot_g"));
    const beo = docSoThuc(o("beo_g"));
    if (!(kcal > 0)) bao("kcal", "kcal phải là số lớn hơn 0");
    for (const [cot, v] of [
      ["dam_g", dam],
      ["tinh_bot_g", tinhBot],
      ["beo_g", beo],
    ] as const)
      if (!(v >= 0)) bao(cot, "Phải là số không âm");
    // Kiểm tra chéo: 4×đạm + 4×tinh bột + 9×béo ≈ kcal (phát hiện gõ nhầm số)
    if (kcal > 0 && dam >= 0 && tinhBot >= 0 && beo >= 0) {
      const tinh = 4 * dam + 4 * tinhBot + 9 * beo;
      if (Math.abs(tinh - kcal) > kcal * ch.lechKcalToiDa)
        bao(
          "kcal",
          `4×${dam} + 4×${tinhBot} + 9×${beo} = ${Math.round(tinh)} kcal, lệch quá ${ch.lechKcalToiDa * 100}% so với ${kcal} kcal đã ghi — kiểm tra lại số`,
        );
    }

    const heSo = {
      it: docSoThuc(o("he_so_it")),
      vua: docSoThuc(o("he_so_vua")),
      nhieu: docSoThuc(o("he_so_nhieu")),
    };
    if (heSo.vua !== 1)
      bao(
        "he_so_vua",
        "Hệ số phần vừa phải bằng 1 (số liệu ghi theo phần vừa)",
      );
    if (!(heSo.it > 0 && heSo.it < 1))
      bao("he_so_it", "Hệ số phần ít phải nằm giữa 0 và 1 (vd 0,7)");
    if (!(heSo.nhieu > 1))
      bao("he_so_nhieu", "Hệ số phần nhiều phải lớn hơn 1 (vd 1,3)");

    const gia = docSoNguyen(o("gia_vnd"));
    if (!(gia > 0)) bao("gia_vnd", "Giá phải là số lớn hơn 0 (vd 35000)");
    const phut = docSoNguyen(o("phut_nau"));
    if (!(phut >= 0))
      bao("phut_nau", "Số phút nấu phải là số không âm (món mua ngoài ghi 0)");

    const anNgoai = docDungSai(o("an_ngoai"));
    if (anNgoai === null)
      bao("an_ngoai", 'Ghi "true" (thường mua ngoài) hoặc "false"');

    const cheDo = docDanhSach(o("che_do"));
    cheDo
      .filter((x) => !CHE_DO.includes(x))
      .forEach((x) =>
        bao("che_do", `"${x}" không hợp lệ (chỉ: chay, khong_heo)`),
      );
    const diUng = docDanhSach(o("di_ung"));
    diUng
      .filter((x) => !ch.maDiUng.includes(x))
      .forEach((x) =>
        bao(
          "di_ung",
          `Mã dị ứng "${x}" không có (chỉ: ${ch.maDiUng.join(", ")})`,
        ),
      );
    const nhanSK = docDanhSach(o("nhan_suc_khoe"));
    nhanSK
      .filter((x) => !NHAN_SUC_KHOE.includes(x))
      .forEach((x) =>
        bao(
          "nhan_suc_khoe",
          `"${x}" không hợp lệ (chỉ: ${NHAN_SUC_KHOE.join(", ")})`,
        ),
      );
    const nhanPC = docDanhSach(o("nhan_phong_cach"));
    nhanPC
      .filter((x) => !NHAN_PHONG_CACH.includes(x))
      .forEach((x) =>
        bao(
          "nhan_phong_cach",
          `"${x}" không hợp lệ (chỉ: ${NHAN_PHONG_CACH.join(", ")})`,
        ),
      );

    const nguyenLieu = docDanhSach(o("nguyen_lieu"));
    if (nguyenLieu.length === 0) bao("nguyen_lieu", "Chưa có nguyên liệu");
    // An toàn: nguyên liệu có nước mắm / mắm tôm / đậu phộng thì phải khai dị ứng
    const chuNL = nguyenLieu.join(" ").toLowerCase();
    for (const { chu, ma } of DI_UNG_AN)
      if (chu.some((x) => chuNL.includes(x)) && !diUng.includes(ma))
        bao(
          "di_ung",
          `Nguyên liệu có "${chu.find((x) => chuNL.includes(x))}" nhưng cột di_ung chưa có "${ma}"`,
        );

    const verified = docDungSai(o("verified"));
    const nguon = o("nguon_so_lieu");
    if (verified === null)
      bao("verified", 'Ghi "true" (đã kiểm tra) hoặc "false"');
    if (verified && !nguon)
      bao(
        "nguon_so_lieu",
        "Món đã kiểm tra (verified = true) phải ghi nguồn số liệu",
      );

    const mon: Mon = {
      id,
      name: ten,
      meal: bua as Bua[],
      per_serving_vua: { kcal, protein: dam, carb: tinhBot, fat: beo },
      portion_factor: heSo as Record<KhauPhan, number>,
      price_vnd: gia,
      cook_minutes: phut,
      eat_out: anNgoai === true,
      diet: cheDo as Mon["diet"],
      allergens: diUng,
      health_tags: nhanSK as Mon["health_tags"],
      style_tags: nhanPC as Mon["style_tags"],
      ingredients: nguyenLieu,
      verified: verified === true,
      ...(nguon ? { source: nguon } : {}),
    };
    mons.push(mon);
  });

  if (mons.length < ch.soMonToiThieu || mons.length > ch.soMonToiDa)
    loi.push({
      dong: 1,
      thongBao: `Có ${mons.length} món — SPEC mục 5 yêu cầu từ ${ch.soMonToiThieu} đến ${ch.soMonToiDa} món (đổi giới hạn ở lib/config.ts nếu nhóm đã thống nhất)`,
    });

  return { mons: loi.length ? [] : mons, loi };
}

// ─────────────────────────────────────────────
// Danh sách món → CSV (để tạo file mẫu từ dishes.json)
// ─────────────────────────────────────────────
function boc(o: string): string {
  return /[",;\n\r]/.test(o) ? `"${o.replace(/"/g, '""')}"` : o;
}

export function monThanhCsv(mons: Mon[]): string {
  const dong = mons.map((m) => {
    const gt: Record<TenCot, string> = {
      id: m.id,
      ten_mon: m.name,
      bua: m.meal.join(NGAN_DANH_SACH),
      kcal: String(m.per_serving_vua.kcal),
      dam_g: String(m.per_serving_vua.protein),
      tinh_bot_g: String(m.per_serving_vua.carb),
      beo_g: String(m.per_serving_vua.fat),
      he_so_it: String(m.portion_factor.it),
      he_so_vua: String(m.portion_factor.vua),
      he_so_nhieu: String(m.portion_factor.nhieu),
      gia_vnd: String(m.price_vnd),
      phut_nau: String(m.cook_minutes),
      an_ngoai: String(m.eat_out),
      che_do: m.diet.join(NGAN_DANH_SACH),
      di_ung: m.allergens.join(NGAN_DANH_SACH),
      nhan_suc_khoe: m.health_tags.join(NGAN_DANH_SACH),
      nhan_phong_cach: m.style_tags.join(NGAN_DANH_SACH),
      nguyen_lieu: m.ingredients.join(NGAN_DANH_SACH),
      nguon_so_lieu: m.source ?? "",
      verified: String(m.verified),
    };
    return COT.map((c) => boc(gt[c])).join(",");
  });
  // BOM ở đầu để Excel hiển thị đúng chữ tiếng Việt
  return "﻿" + [COT.join(","), ...dong].join("\r\n") + "\r\n";
}
