import { describe, expect, it } from "vitest";
import { DRAFT_TRONG, draftThanhHoSo, type Draft } from "./profile";
import { KHOA_HO_SO, docHoSo, luuHoSo, xoaHoSo, type KhoLuuTru } from "./storage";

/** localStorage giả để test (chạy trong Node không có trình duyệt) */
function taoKhoGia(): KhoLuuTru & { duLieu: Map<string, string> } {
  const duLieu = new Map<string, string>();
  return {
    duLieu,
    getItem: (k) => duLieu.get(k) ?? null,
    setItem: (k, v) => void duLieu.set(k, v),
    removeItem: (k) => void duLieu.delete(k),
  };
}

const draft: Draft = {
  ...DRAFT_TRONG,
  tuoi: "25", mangThaiChoConBu: false, khongCoBenh: true, vanDeAnUong: "khong",
  gioiTinh: "nu", chieuCaoCm: "160", canNangKg: "55", congViec: "ngoi_nhieu", coTheThao: false,
  mucTieu: "duy_tri", cheDoAn: "chay", thoiGianNauToiDa: 15, soBua: 4, noiAn: "nau_nha",
};

describe("storage", () => {
  it("lưu rồi đọc lại đúng hồ sơ", () => {
    const kho = taoKhoGia();
    const h = draftThanhHoSo(draft)!;
    luuHoSo(h, kho);
    expect(docHoSo(kho)).toEqual(h);
  });

  it("chưa có hồ sơ → null", () => {
    expect(docHoSo(taoKhoGia())).toBeNull();
  });

  it("dữ liệu hỏng → null (không làm sập app)", () => {
    const kho = taoKhoGia();
    kho.setItem(KHOA_HO_SO, "{không phải json");
    expect(docHoSo(kho)).toBeNull();
    kho.setItem(KHOA_HO_SO, JSON.stringify({ phienBan: 99 }));
    expect(docHoSo(kho)).toBeNull();
  });

  it("xóa hồ sơ", () => {
    const kho = taoKhoGia();
    luuHoSo(draftThanhHoSo(draft)!, kho);
    xoaHoSo(kho);
    expect(docHoSo(kho)).toBeNull();
  });

  it("không có kho (đang chạy trên server) → không lỗi", () => {
    expect(docHoSo(null)).toBeNull();
    expect(() => luuHoSo(draftThanhHoSo(draft)!, null)).not.toThrow();
  });
});
