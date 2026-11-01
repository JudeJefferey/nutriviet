import { describe, expect, it } from "vitest";
import { calcMacros } from "./macros";

describe("calcMacros", () => {
  it("Ca A — 1649.85 kcal, 65kg, giảm mỡ, không thể thao", () => {
    const m = calcMacros({ kcal: 1649.85, canNangKg: 65, mucTieu: "giam_mo", coChoiTheThao: false });
    // Protein 1.6 × 65 = 104 g = 416 kcal
    expect(m.proteinG).toBeCloseTo(104, 6);
    expect(m.proteinKcal).toBeCloseTo(416, 6);
    // Béo 25% × 1649.85 = 412.46 kcal → 45.83 g
    expect(m.fatG).toBeCloseTo(45.83, 2);
    // Carb (1649.85 − 416 − 412.46) / 4 = 205.35 g
    expect(m.carbG).toBeCloseTo(205.35, 2);
  });

  it("Ca B — 1966.6 kcal, 55kg, tăng cơ, có thể thao (1.8 + 0.2 = 2.0 g/kg)", () => {
    const m = calcMacros({ kcal: 1966.6, canNangKg: 55, mucTieu: "tang_co", coChoiTheThao: true });
    expect(m.proteinGPerKg).toBeCloseTo(2.0, 9);
    expect(m.proteinG).toBeCloseTo(110, 6);
    expect(m.fatG).toBeCloseTo(54.63, 2); // 491.65 / 9
    expect(m.carbG).toBeCloseTo(258.74, 2); // (1966.6 − 440 − 491.65) / 4
  });

  it("duy trì dùng 1.2 g/kg", () => {
    const m = calcMacros({ kcal: 2000, canNangKg: 60, mucTieu: "duy_tri", coChoiTheThao: false });
    expect(m.proteinG).toBeCloseTo(72, 6);
  });

  it("tổng kcal 3 nhóm chất = calo mục tiêu", () => {
    const m = calcMacros({ kcal: 1800, canNangKg: 60, mucTieu: "an_lanh_manh", coChoiTheThao: true });
    expect(m.proteinKcal + m.fatKcal + m.carbKcal).toBeCloseTo(1800, 6);
  });

  it("carb không bao giờ âm", () => {
    const m = calcMacros({ kcal: 1200, canNangKg: 200, mucTieu: "tang_co", coChoiTheThao: true });
    expect(m.carbG).toBe(0);
  });
});
