import { describe, expect, it } from "vitest";
import type { NgayThucDon } from "./menu";
import {
  buaKeTiep,
  congNgay,
  duoiMucSanNhieuNgay,
  giamBuChoNgay,
  khoaNgay,
  macroMucTieuNgay,
  phanChenh,
  tongNgay,
  type MonDaAn,
  type NhatKy,
} from "./tracking";

/** Tạo một lần ghi món với số kcal cho trước */
let dem = 0;
function an(
  kcal: number,
  bua: MonDaAn["bua"] = "trua",
  ngoaiKeHoach = false,
): MonDaAn {
  return {
    id: String(dem++),
    monId: "x",
    khauPhan: "vua",
    bua,
    ngoaiKeHoach,
    dinhDuong: { kcal, protein: 10, carb: 20, fat: 5 },
  };
}
const ngay = (...kcal: number[]) => ({ mon: kcal.map((k) => an(k)), nuoc: 0 });

describe("ngày tháng", () => {
  it("khoaNgay theo giờ máy", () =>
    expect(khoaNgay(new Date(2026, 10, 1))).toBe("2026-11-01"));
  it("congNgay qua tháng / qua năm", () => {
    expect(congNgay("2026-11-01", -1)).toBe("2026-10-31");
    expect(congNgay("2026-12-31", 1)).toBe("2027-01-01");
    expect(congNgay("2024-02-28", 1)).toBe("2024-02-29"); // năm nhuận
  });
});

describe("tongNgay / phanChenh", () => {
  it("cộng đúng", () => {
    expect(tongNgay(ngay(500, 700, 810))).toEqual({
      kcal: 2010,
      protein: 30,
      carb: 60,
      fat: 15,
    });
    expect(tongNgay(undefined).kcal).toBe(0);
  });
  it("chỉ tính phần dư, ăn ít hơn thì bằng 0", () => {
    expect(phanChenh(2010, 1650)).toBe(360);
    expect(phanChenh(1500, 1650)).toBe(0);
  });
});

describe("giamBuChoNgay — 'Lỡ ăn rồi'", () => {
  it("Ca tính tay 1: dư 360 kcal → mỗi ngày 120, giới hạn 10% = 165 → giảm 120", () => {
    // mục tiêu 1650, mức sàn 1200 (giới hạn mức sàn = 450, không chặn)
    const nk: NhatKy = { "2026-11-01": ngay(500, 700, 810) }; // 2010 kcal
    const r = giamBuChoNgay({
      nhatKy: nk,
      ngay: "2026-11-02",
      mucTieuGoc: 1650,
      mucSan: 1200,
      dangCanhBao: false,
    });
    expect(r.giam).toBe(120);
    expect(r.mucTieuNgay).toBe(1530);
    expect(r.biGioiHan).toBe(false);
  });

  it("phần bù kéo dài đúng 3 ngày, ngày thứ 4 hết", () => {
    const nk: NhatKy = { "2026-11-01": ngay(2010) };
    const tham = {
      nhatKy: nk,
      mucTieuGoc: 1650,
      mucSan: 1200,
      dangCanhBao: false,
    };
    expect(giamBuChoNgay({ ...tham, ngay: "2026-11-02" }).giam).toBe(120);
    expect(giamBuChoNgay({ ...tham, ngay: "2026-11-04" }).giam).toBe(120);
    expect(giamBuChoNgay({ ...tham, ngay: "2026-11-05" }).giam).toBe(0);
    expect(giamBuChoNgay({ ...tham, ngay: "2026-11-01" }).giam).toBe(0); // không bù cho chính hôm đó
  });

  it("Ca tính tay 2: dư 900 → 300/ngày nhưng tối đa 10% của 1650 = 165", () => {
    const nk: NhatKy = { "2026-11-01": ngay(2550) };
    const r = giamBuChoNgay({
      nhatKy: nk,
      ngay: "2026-11-02",
      mucTieuGoc: 1650,
      mucSan: 1200,
      dangCanhBao: false,
    });
    expect(r.giam).toBe(165);
    expect(r.biGioiHan).toBe(true);
  });

  it("Ca tính tay 3: mức sàn chặn — mục tiêu 1650, sàn 1618 → chỉ giảm được 32", () => {
    const nk: NhatKy = { "2026-11-01": ngay(2010) };
    const r = giamBuChoNgay({
      nhatKy: nk,
      ngay: "2026-11-02",
      mucTieuGoc: 1650,
      mucSan: 1618,
      dangCanhBao: false,
    });
    expect(r.giam).toBe(32);
    expect(r.mucTieuNgay).toBe(1618); // không xuống dưới mức sàn
  });

  it("mục tiêu đang bằng mức sàn → không giảm gì", () => {
    const nk: NhatKy = { "2026-11-01": ngay(1800) };
    expect(
      giamBuChoNgay({
        nhatKy: nk,
        ngay: "2026-11-02",
        mucTieuGoc: 1200,
        mucSan: 1200,
        dangCanhBao: false,
      }).giam,
    ).toBe(0);
  });

  it("nhiều ngày dư chồng lên nhau → cộng lại nhưng vẫn giữ giới hạn 10%", () => {
    const nk: NhatKy = {
      "2026-11-01": ngay(1950),
      "2026-11-02": ngay(1950),
      "2026-11-03": ngay(1950),
    }; // mỗi ngày dư 300
    const r = giamBuChoNgay({
      nhatKy: nk,
      ngay: "2026-11-04",
      mucTieuGoc: 1650,
      mucSan: 1200,
      dangCanhBao: false,
    });
    expect(r.chiTiet).toHaveLength(3); // 3 × 100 = 300
    expect(r.giam).toBe(165);
  });

  it("đang có cảnh báo dưới mức sàn → KHÔNG giảm (không siết thêm)", () => {
    const nk: NhatKy = { "2026-11-01": ngay(2550) };
    const r = giamBuChoNgay({
      nhatKy: nk,
      ngay: "2026-11-02",
      mucTieuGoc: 1650,
      mucSan: 1200,
      dangCanhBao: true,
    });
    expect(r.giam).toBe(0);
    expect(r.mucTieuNgay).toBe(1650);
  });

  it("macro ngày: bớt phần giảm vào tinh bột (120 kcal ÷ 4 = 30 g)", () => {
    expect(
      macroMucTieuNgay({ proteinG: 104, fatG: 46, carbG: 205 }, 120),
    ).toEqual({ proteinG: 104, fatG: 46, carbG: 175 });
  });
});

describe("duoiMucSanNhieuNgay — luật quan tâm", () => {
  const homNay = "2026-11-05";
  it("3 ngày liền (có ghi) dưới mức sàn → true", () => {
    const nk: NhatKy = {
      "2026-11-02": ngay(900),
      "2026-11-03": ngay(1000),
      "2026-11-04": ngay(800),
    };
    expect(duoiMucSanNhieuNgay(nk, homNay, 1200)).toBe(true);
  });
  it("chỉ 2 ngày → false", () => {
    const nk: NhatKy = { "2026-11-03": ngay(1000), "2026-11-04": ngay(800) };
    expect(duoiMucSanNhieuNgay(nk, homNay, 1200)).toBe(false);
  });
  it("có 1 ngày không ghi gì xen giữa → không tính, false", () => {
    const nk: NhatKy = {
      "2026-11-02": ngay(900),
      "2026-11-03": { mon: [], nuoc: 5 },
      "2026-11-04": ngay(800),
    };
    expect(duoiMucSanNhieuNgay(nk, homNay, 1200)).toBe(false);
  });
  it("có 1 ngày ăn đủ → false", () => {
    const nk: NhatKy = {
      "2026-11-02": ngay(900),
      "2026-11-03": ngay(1300),
      "2026-11-04": ngay(800),
    };
    expect(duoiMucSanNhieuNgay(nk, homNay, 1200)).toBe(false);
  });
  it("hôm nay ăn ít không bị tính (chưa hết ngày)", () => {
    const nk: NhatKy = {
      "2026-11-03": ngay(900),
      "2026-11-04": ngay(900),
      "2026-11-05": ngay(300),
    };
    expect(duoiMucSanNhieuNgay(nk, homNay, 1200)).toBe(false);
  });
});

describe("buaKeTiep", () => {
  const ngayTD: NgayThucDon = {
    bua: (["sang", "trua", "toi"] as const).map((b) => ({
      bua: b,
      monId: "m-" + b,
      khauPhan: "vua",
      dinhDuong: { kcal: 500, protein: 0, carb: 0, fat: 0 },
      gia: 0,
    })),
    tong: { kcal: 1500, protein: 0, carb: 0, fat: 0, gia: 0 },
    dat: true,
    buaThieuMon: null,
  };
  it("chưa ghi gì → bữa sáng", () =>
    expect(buaKeTiep(ngayTD, [])?.bua).toBe("sang"));
  it("đã ghi sáng → bữa trưa", () =>
    expect(buaKeTiep(ngayTD, [an(400, "sang")])?.bua).toBe("trua"));
  it("món 'Lỡ ăn rồi' không tính là đã ăn bữa đó", () =>
    expect(buaKeTiep(ngayTD, [an(300, "sang", true)])?.bua).toBe("sang"));
  it("đã ghi đủ → null; không có thực đơn → null", () => {
    expect(
      buaKeTiep(ngayTD, [an(1, "sang"), an(1, "trua"), an(1, "toi")]),
    ).toBeNull();
    expect(buaKeTiep(undefined, [])).toBeNull();
  });
});
