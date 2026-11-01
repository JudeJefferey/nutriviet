import { describe, expect, it } from "vitest";
import { tinhKeHoach, type HoSoTinhToan } from "./plan";

const coBan = {
  mangThaiChoConBu: false,
  benhNen: [],
  vanDeAnUong: "khong",
} satisfies Partial<HoSoTinhToan>;

describe("tinhKeHoach — chạy trọn quy trình, số đã làm tròn", () => {
  it("Ca A — nam 20t, 170cm, 65kg, ngồi nhiều, giảm mỡ", () => {
    const k = tinhKeHoach({
      ...coBan, tuoi: 20, gioiTinh: "nam", canNangKg: 65, chieuCaoCm: 170,
      congViec: "ngoi_nhieu", theThao: null, mucTieu: "giam_mo", canMucTieuKg: 60, soTuan: 12,
    });
    expect(k.bmr).toBe(1618);
    expect(k.tdee).toBe(1941);
    expect(k.caloMucTieu).toBe(1650);
    expect(k.macro).toMatchObject({ proteinG: 104, fatG: 46, carbG: 205 });
    expect(k.kiemTraCanNang?.trangThai).toBe("ok"); // 5kg/12 tuần = 0.64%/tuần
  });

  it("Ca B — nữ 22t, 160cm, 55kg, đứng/đi lại, đá bóng 3×60' vừa, tăng cơ", () => {
    const k = tinhKeHoach({
      ...coBan, tuoi: 22, gioiTinh: "nu", canNangKg: 55, chieuCaoCm: 160,
      congViec: "dung_di_lai", theThao: { soBuoiMoiTuan: 3, phutMoiBuoi: 60, cuongDo: "vua" },
      mucTieu: "tang_co", canMucTieuKg: 58, soTuan: 20,
    });
    expect(k.bmr).toBe(1279);
    expect(k.caloTap).toBe(94);
    expect(k.tdee).toBe(1821);
    expect(k.caloMucTieu).toBe(1967);
    expect(k.macro).toMatchObject({ proteinG: 110, fatG: 55, carbG: 259 });
  });

  it("Ca C — nữ 30t, 150cm, 45kg, giảm mỡ → bị nâng lên mức sàn 1200", () => {
    const k = tinhKeHoach({
      ...coBan, tuoi: 30, gioiTinh: "nu", canNangKg: 45, chieuCaoCm: 150,
      congViec: "ngoi_nhieu", theThao: null, mucTieu: "giam_mo", canMucTieuKg: 43, soTuan: 10,
    });
    expect(k.bmr).toBe(1077); // 1076.5 làm tròn
    expect(k.tdee).toBe(1292);
    expect(k.caloTruocMucSan).toBe(1098);
    expect(k.caloMucTieu).toBe(1200);
    expect(k.daNangLenMucSan).toBe(true);
  });

  it("tầng 1 (17 tuổi chọn giảm mỡ) → engine tự ép về 'Ăn cân bằng', calo = TDEE", () => {
    const k = tinhKeHoach({
      ...coBan, tuoi: 17, gioiTinh: "nam", canNangKg: 65, chieuCaoCm: 170,
      congViec: "ngoi_nhieu", theThao: null, mucTieu: "giam_mo", canMucTieuKg: 55, soTuan: 4,
    });
    expect(k.an_toan.tang1).toBe(true);
    expect(k.mucTieuApDung).toBe("an_lanh_manh");
    expect(k.caloMucTieu).toBe(k.tdee);
    expect(k.kiemTraCanNang).toBeNull(); // không xét cân mục tiêu khi đã bị khóa
  });

  it("mục tiêu duy trì → không kiểm tra cân mục tiêu", () => {
    const k = tinhKeHoach({
      ...coBan, tuoi: 25, gioiTinh: "nu", canNangKg: 55, chieuCaoCm: 160,
      congViec: "ngoi_nhieu", theThao: null, mucTieu: "duy_tri",
    });
    expect(k.kiemTraCanNang).toBeNull();
    expect(k.caloMucTieu).toBe(k.tdee);
  });
});
