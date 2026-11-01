import { describe, expect, it } from "vitest";
import {
  giaiThichKeHoach,
  giaiThichMucTieuCan,
  giaiThichTang1,
  so,
} from "./explain";
import { tinhKeHoach, type HoSoTinhToan } from "./plan";
import { checkWeightGoal } from "./weightGoal";

const caA: HoSoTinhToan = {
  tuoi: 20, mangThaiChoConBu: false, benhNen: [], vanDeAnUong: "khong",
  gioiTinh: "nam", canNangKg: 65, chieuCaoCm: 170, congViec: "ngoi_nhieu",
  theThao: null, mucTieu: "giam_mo", canMucTieuKg: 60, soTuan: 12,
};

describe("so — định dạng số kiểu Việt Nam", () => {
  it("dấu chấm ngăn nghìn, dấu phẩy thập phân", () => {
    expect(so(1618)).toBe("1.618");
    expect(so(6.25, 2)).toBe("6,25");
    expect(so(1.2, 2)).toBe("1,2");
  });
});

describe("giaiThichKeHoach", () => {
  it("Ca A — đủ 8 bước, chứa đúng các con số đã tính", () => {
    const buoc = giaiThichKeHoach(caA, tinhKeHoach(caA));
    expect(buoc).toHaveLength(8);
    const text = buoc.map((b) => b.noiDung).join("\n");
    expect(text).toContain("10 × 65 kg + 6,25 × 170 cm − 5 × 20 tuổi + 5 = 1.617,5 kcal");
    expect(text).toContain("1.617,5 × 1,2 ≈ 1.941 kcal");
    expect(text).toContain("phần này bằng 0 kcal");
    expect(text).toContain("bớt 15% so với TDEE");
    expect(text).toContain("1.650 kcal");
    expect(text).toContain("1,6 × 65 kg ≈ 104 g");
    expect(text).toContain("≈ 46 g");
    expect(text).toContain("≈ 205 g");
    // Các số hiển thị cộng trừ lại phải khớp: 1.650 − 416 − 413 = 821
    expect(text).toContain("1.650 − 416 − 413 = 821 kcal");
    expect(text).toContain("1.941 + 0 ≈ 1.941 kcal");
  });

  it("nữ dùng hằng số − 161 và có giải thích calo tập", () => {
    const hs: HoSoTinhToan = {
      ...caA, gioiTinh: "nu", canNangKg: 55, chieuCaoCm: 160, tuoi: 22, congViec: "dung_di_lai",
      theThao: { soBuoiMoiTuan: 3, phutMoiBuoi: 60, cuongDo: "vua" }, mucTieu: "tang_co",
      canMucTieuKg: 58, soTuan: 20,
    };
    const text = giaiThichKeHoach(hs, tinhKeHoach(hs)).map((b) => b.noiDung).join("\n");
    expect(text).toContain("− 161 = 1.279 kcal");
    expect(text).toContain("(5 − 1) × 55 kg × 3 giờ ÷ 7 ≈ 94 kcal");
    expect(text).toContain("+ 0,2 g/kg vì bạn có chơi thể thao = 2 g/kg");
    expect(text).toContain("thêm 8% so với TDEE");
  });

  it("Ca C — có giải thích mức sàn", () => {
    const hs: HoSoTinhToan = {
      ...caA, gioiTinh: "nu", tuoi: 30, chieuCaoCm: 150, canNangKg: 45, canMucTieuKg: 43, soTuan: 10,
    };
    const text = giaiThichKeHoach(hs, tinhKeHoach(hs)).map((b) => b.noiDung).join("\n");
    expect(text).toContain("thấp hơn mức sàn, mình dùng 1.200 kcal");
  });

  it("tầng 1 — nói rõ đã áp dụng Ăn cân bằng vì an toàn", () => {
    const hs = { ...caA, tuoi: 17 };
    const text = giaiThichKeHoach(hs, tinhKeHoach(hs)).map((b) => b.noiDung).join("\n");
    expect(text).toContain('Vì lý do an toàn, mình áp dụng chế độ "Ăn cân bằng"');
  });
});

describe("giaiThichKeHoach — bệnh thận", () => {
  it("không đưa con số protein/béo/carb, thay bằng lời nhắn bác sĩ chỉ định", () => {
    const hs = { ...caA, benhNen: ["benh_than" as const] };
    const buoc = giaiThichKeHoach(hs, tinhKeHoach(hs));
    expect(buoc).toHaveLength(6);
    const text = buoc.map((b) => b.noiDung).join("\n");
    expect(text).toContain("lượng đạm phù hợp nên do bác sĩ chỉ định");
    expect(text).not.toMatch(/g\/kg/);
  });
});

describe("giaiThichTang1", () => {
  it("mỗi lý do có một câu giải thích", () => {
    const cau = giaiThichTang1(["duoi_18_tuoi", "benh_than"]);
    expect(cau).toHaveLength(2);
    expect(cau[1]).toContain("bệnh thận");
  });
});

describe("giaiThichMucTieuCan", () => {
  it("quá nhanh → nêu tốc độ và số tuần đề xuất", () => {
    const tt = { mucTieu: "giam_mo" as const, canHienTaiKg: 70, canMucTieuKg: 62, soTuan: 4 };
    const kq = checkWeightGoal({ ...tt, chieuCaoCm: 170 });
    const cau = giaiThichMucTieuCan(kq, tt)!;
    expect(cau).toContain("Giảm 8 kg trong 4 tuần");
    expect(cau).toContain("2,9% cân nặng mỗi tuần");
    expect(cau).toContain("12 tuần");
  });

  it("BMI thấp → gợi ý cân tối thiểu", () => {
    const tt = { mucTieu: "giam_mo" as const, canHienTaiKg: 52, canMucTieuKg: 46, soTuan: 30 };
    const cau = giaiThichMucTieuCan(checkWeightGoal({ ...tt, chieuCaoCm: 160 }), tt)!;
    expect(cau).toContain("47,4 kg trở lên");
  });

  it("an toàn → không có lời nhắc", () => {
    const tt = { mucTieu: "giam_mo" as const, canHienTaiKg: 70, canMucTieuKg: 65, soTuan: 10 };
    expect(giaiThichMucTieuCan(checkWeightGoal({ ...tt, chieuCaoCm: 170 }), tt)).toBeNull();
  });

  it("ngược chiều → nhắc nhẹ", () => {
    const tt = { mucTieu: "tang_co" as const, canHienTaiKg: 60, canMucTieuKg: 58, soTuan: 10 };
    expect(giaiThichMucTieuCan(checkWeightGoal({ ...tt, chieuCaoCm: 170 }), tt)).toContain(
      "cao hơn cân hiện tại",
    );
  });
});
