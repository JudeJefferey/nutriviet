import { describe, expect, it } from "vitest";
import { calcBMI, calcBMR } from "./body";

describe("calcBMR (Mifflin-St Jeor)", () => {
  it("Ca A — nam 20t, 170cm, 65kg: 650 + 1062.5 − 100 + 5 = 1617.5", () => {
    expect(calcBMR("nam", 65, 170, 20)).toBeCloseTo(1617.5, 6);
  });

  it("Ca B — nữ 22t, 160cm, 55kg: 550 + 1000 − 110 − 161 = 1279", () => {
    expect(calcBMR("nu", 55, 160, 22)).toBeCloseTo(1279, 6);
  });

  it("Ca C — nữ 30t, 150cm, 45kg: 450 + 937.5 − 150 − 161 = 1076.5", () => {
    expect(calcBMR("nu", 45, 150, 30)).toBeCloseTo(1076.5, 6);
  });

  it("nam và nữ cùng số đo chênh nhau đúng 166 kcal (5 − (−161))", () => {
    expect(
      calcBMR("nam", 60, 165, 25) - calcBMR("nu", 60, 165, 25),
    ).toBeCloseTo(166, 6);
  });

  it("báo lỗi khi dữ liệu không hợp lệ", () => {
    expect(() => calcBMR("nam", 0, 170, 20)).toThrow(RangeError);
    expect(() => calcBMR("nam", 65, -1, 20)).toThrow(RangeError);
    expect(() => calcBMR("nam", 65, 170, NaN)).toThrow(RangeError);
  });
});

describe("calcBMI", () => {
  it("45kg, 150cm → 45 / 1.5² = 20", () => {
    expect(calcBMI(45, 150)).toBeCloseTo(20, 6);
  });
  it("46kg, 160cm → 17.97", () => {
    expect(calcBMI(46, 160)).toBeCloseTo(17.97, 2);
  });
  it("báo lỗi khi chiều cao bằng 0", () => {
    expect(() => calcBMI(50, 0)).toThrow(RangeError);
  });
});
