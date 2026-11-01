import { describe, expect, it } from "vitest";
import {
  calcCalorieFloor,
  calcExerciseKcalPerDay,
  calcTargetCalories,
  calcTDEE,
} from "./energy";

describe("calcExerciseKcalPerDay", () => {
  it("không chơi thể thao → 0", () => {
    expect(calcExerciseKcalPerDay(65, null)).toBe(0);
  });

  it("Ca B — 55kg, 3 buổi × 60 phút, vừa (MET 5): (5−1) × 55 × 3 / 7 = 94.29", () => {
    const v = calcExerciseKcalPerDay(55, { soBuoiMoiTuan: 3, phutMoiBuoi: 60, cuongDo: "vua" });
    expect(v).toBeCloseTo(660 / 7, 6);
  });

  it("70kg, 2 buổi × 45 phút, nặng (MET 8): 7 × 70 × 1.5 / 7 = 105", () => {
    const v = calcExerciseKcalPerDay(70, { soBuoiMoiTuan: 2, phutMoiBuoi: 45, cuongDo: "nang" });
    expect(v).toBeCloseTo(105, 6);
  });

  it("nhẹ (MET 3.5): 60kg, 7 buổi × 30 phút → 2.5 × 60 × 3.5 / 7 = 75", () => {
    const v = calcExerciseKcalPerDay(60, { soBuoiMoiTuan: 7, phutMoiBuoi: 30, cuongDo: "nhe" });
    expect(v).toBeCloseTo(75, 6);
  });

  it("báo lỗi khi số buổi âm", () => {
    expect(() =>
      calcExerciseKcalPerDay(60, { soBuoiMoiTuan: -1, phutMoiBuoi: 30, cuongDo: "nhe" }),
    ).toThrow(RangeError);
  });
});

describe("calcTDEE", () => {
  it("Ca A — 1617.5 × 1.2 + 0 = 1941", () => {
    expect(calcTDEE(1617.5, "ngoi_nhieu", 0)).toBeCloseTo(1941, 6);
  });
  it("Ca B — 1279 × 1.35 + 94.29 = 1820.94", () => {
    expect(calcTDEE(1279, "dung_di_lai", 660 / 7)).toBeCloseTo(1820.94, 2);
  });
  it("lao động chân tay: 1500 × 1.5 = 2250", () => {
    expect(calcTDEE(1500, "lao_dong_chan_tay", 0)).toBeCloseTo(2250, 6);
  });
});

describe("calcCalorieFloor", () => {
  it("nữ BMR thấp → 1200", () => expect(calcCalorieFloor("nu", 1076.5)).toBe(1200));
  it("nam BMR thấp → 1500", () => expect(calcCalorieFloor("nam", 1400)).toBe(1500));
  it("BMR cao hơn mức tối thiểu → lấy BMR", () =>
    expect(calcCalorieFloor("nam", 1617.5)).toBe(1617.5));
});

describe("calcTargetCalories", () => {
  it("Ca A — giảm mỡ: 1941 × 0.85 = 1649.85, trên mức sàn 1617.5", () => {
    const r = calcTargetCalories({ tdee: 1941, bmr: 1617.5, gioiTinh: "nam", mucTieu: "giam_mo" });
    expect(r.kcal).toBeCloseTo(1649.85, 6);
    expect(r.daNangLenMucSan).toBe(false);
    expect(r.tiLeDieuChinh).toBeCloseTo(-0.15, 9);
  });

  it("Ca B — tăng cơ: 1820.94 × 1.08 = 1966.6", () => {
    const r = calcTargetCalories({ tdee: 1820.94, bmr: 1279, gioiTinh: "nu", mucTieu: "tang_co" });
    expect(r.kcal).toBeCloseTo(1966.6, 1);
  });

  it("Ca C — giảm mỡ bị nâng lên mức sàn: 1291.8 × 0.85 = 1098 < 1200 → 1200", () => {
    const r = calcTargetCalories({ tdee: 1291.8, bmr: 1076.5, gioiTinh: "nu", mucTieu: "giam_mo" });
    expect(r.kcal).toBe(1200);
    expect(r.kcalTruocMucSan).toBeCloseTo(1098.03, 2);
    expect(r.daNangLenMucSan).toBe(true);
  });

  it("duy trì / ăn lành mạnh = TDEE", () => {
    for (const mucTieu of ["duy_tri", "an_lanh_manh"] as const) {
      const r = calcTargetCalories({ tdee: 2000, bmr: 1600, gioiTinh: "nam", mucTieu });
      expect(r.kcal).toBe(2000);
      expect(r.tiLeDieuChinh).toBe(0);
    }
  });

  it("mức sàn áp dụng cả khi duy trì (TDEE < 1200)", () => {
    const r = calcTargetCalories({ tdee: 1140, bmr: 950, gioiTinh: "nu", mucTieu: "duy_tri" });
    expect(r.kcal).toBe(1200);
    expect(r.daNangLenMucSan).toBe(true);
  });

  it("tỉ lệ tự chỉnh hợp lệ được dùng (giảm 18%)", () => {
    const r = calcTargetCalories({
      tdee: 2000, bmr: 1500, gioiTinh: "nam", mucTieu: "giam_mo", tiLeTuyChon: 0.18,
    });
    expect(r.kcal).toBeCloseTo(1640, 6);
  });

  it("tỉ lệ giảm ngoài khoảng bị kẹp về 10–20%", () => {
    const cao = calcTargetCalories({
      tdee: 2500, bmr: 1500, gioiTinh: "nam", mucTieu: "giam_mo", tiLeTuyChon: 0.4,
    });
    expect(cao.tiLeDieuChinh).toBeCloseTo(-0.2, 9);
    expect(cao.kcal).toBeCloseTo(2000, 6);
    const thap = calcTargetCalories({
      tdee: 2500, bmr: 1500, gioiTinh: "nam", mucTieu: "giam_mo", tiLeTuyChon: 0.02,
    });
    expect(thap.tiLeDieuChinh).toBeCloseTo(-0.1, 9);
  });

  it("tỉ lệ tăng ngoài khoảng bị kẹp về 5–10%", () => {
    const cao = calcTargetCalories({
      tdee: 2000, bmr: 1500, gioiTinh: "nam", mucTieu: "tang_co", tiLeTuyChon: 0.3,
    });
    expect(cao.kcal).toBeCloseTo(2200, 6);
    const thap = calcTargetCalories({
      tdee: 2000, bmr: 1500, gioiTinh: "nam", mucTieu: "tang_co", tiLeTuyChon: 0.01,
    });
    expect(thap.kcal).toBeCloseTo(2100, 6);
  });
});
