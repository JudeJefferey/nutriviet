import { describe, expect, it } from "vitest";
import { layDiaChi, taoBoGioiHan } from "./gioiHan";

describe("giới hạn số lần gọi AI", () => {
  it("cho phép đúng 3 lần trong cửa sổ, lần thứ 4 bị chặn", () => {
    const choPhep = taoBoGioiHan(3, 1000);
    expect([0, 10, 20, 30].map((t) => choPhep("1.1.1.1", t))).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });
  it("qua hết cửa sổ thì được gọi lại", () => {
    const choPhep = taoBoGioiHan(1, 1000);
    expect(choPhep("a", 0)).toBe(true);
    expect(choPhep("a", 500)).toBe(false);
    expect(choPhep("a", 1001)).toBe(true);
  });
  it("mỗi địa chỉ đếm riêng", () => {
    const choPhep = taoBoGioiHan(1, 1000);
    expect(choPhep("a", 0)).toBe(true);
    expect(choPhep("b", 0)).toBe(true);
  });
  it("đọc địa chỉ từ header x-forwarded-for", () => {
    expect(
      layDiaChi(
        new Request("http://x", {
          headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1" },
        }),
      ),
    ).toBe("9.9.9.9");
    expect(layDiaChi(new Request("http://x"))).toBe("khong-ro");
  });
});
