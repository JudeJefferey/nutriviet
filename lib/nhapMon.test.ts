import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DANH_SACH_DI_UNG,
  LECH_KCAL_TOI_DA,
  SO_MON_TOI_DA,
  SO_MON_TOI_THIEU,
} from "@/lib/config";
import { DANH_SACH_MON } from "@/lib/monAn";
import { csvThanhMon, docCsv, monThanhCsv } from "./nhapMon";

const ch = {
  maDiUng: DANH_SACH_DI_UNG.map((x) => x.ma),
  soMonToiThieu: SO_MON_TOI_THIEU,
  soMonToiDa: SO_MON_TOI_DA,
  lechKcalToiDa: LECH_KCAL_TOI_DA,
};
const csvGoc = monThanhCsv(DANH_SACH_MON);
/** Sửa một ô của món đầu tiên (dòng 2) trong CSV gốc */
function suaO(cot: string, giaTri: string, csv = csvGoc): string {
  const { bang } = docCsv(csv);
  const i = bang[0].indexOf(cot);
  bang[1][i] = giaTri;
  return bang
    .map((d) =>
      d
        .map((o) => (/[",|\n]/.test(o) ? `"${o.replace(/"/g, '""')}"` : o))
        .join(","),
    )
    .join("\n");
}

describe("docCsv", () => {
  it("hiểu ngoặc kép, dấu phẩy trong ô, BOM và xuống dòng Windows", () => {
    const { bang } = docCsv('﻿a,b\r\n"x, y","he said ""hi"""\r\n');
    expect(bang).toEqual([
      ["a", "b"],
      ["x, y", 'he said "hi"'],
    ]);
  });
  it("tự nhận dấu ; (Excel tiếng Việt)", () => {
    expect(docCsv("a;b\n1,5;2").bang).toEqual([
      ["a", "b"],
      ["1,5", "2"],
    ]);
  });
});

describe("csvThanhMon", () => {
  it("xuất ra CSV rồi nhập lại → đúng y dữ liệu hiện tại", () => {
    const { mons, loi } = csvThanhMon(csvGoc, ch);
    expect(loi).toEqual([]);
    expect(mons).toEqual(DANH_SACH_MON);
  });

  it("file data/mon-an.csv trong dự án khớp với data/dishes.json (nhớ chạy npm run nhap-mon sau khi sửa CSV)", () => {
    const { mons, loi } = csvThanhMon(
      readFileSync("data/mon-an.csv", "utf8"),
      ch,
    );
    expect(loi).toEqual([]);
    expect(mons).toEqual(DANH_SACH_MON);
  });

  it("file lưu từ Excel tiếng Việt (dấu ; và số thập phân dấu phẩy) vẫn đọc được", () => {
    const { bang } = docCsv(csvGoc);
    const csvChamPhay = bang
      .map((d) =>
        d
          .map((o) => (/^\d+\.\d+$/.test(o) ? o.replace(".", ",") : o))
          .map((o) => (/[";]/.test(o) ? `"${o}"` : o))
          .join(";"),
      )
      .join("\n");
    const { mons, loi } = csvThanhMon(csvChamPhay, ch);
    expect(loi).toEqual([]);
    expect(mons[0].portion_factor.it).toBe(0.7);
  });

  it("đánh dấu đã kiểm tra + ghi nguồn → verified true, có source", () => {
    const csv = suaO(
      "nguon_so_lieu",
      "BTPTP VN 2007",
      suaO("verified", "true"),
    );
    const { mons, loi } = csvThanhMon(csv, ch);
    expect(loi).toEqual([]);
    expect(mons[0]).toMatchObject({ verified: true, source: "BTPTP VN 2007" });
  });

  it.each([
    ["verified", "true", "nguon_so_lieu", "phải ghi nguồn số liệu"],
    ["kcal", "900", "kcal", "lệch quá 10%"],
    ["di_ung", "", "di_ung", 'cột di_ung chưa có "nuoc_mam"'],
    ["di_ung", "nuoc_mam|hai_san", "di_ung", 'Mã dị ứng "hai_san" không có'],
    ["bua", "khuya", "bua", 'Bữa "khuya" không hợp lệ'],
    ["he_so_vua", "1,1", "he_so_vua", "phải bằng 1"],
    ["gia_vnd", "rẻ", "gia_vnd", "Giá phải là số"],
    ["id", "Phở Bò", "id", "không hợp lệ"],
    ["id", "banh-mi-trung", "id", "bị trùng"],
    ["an_ngoai", "có lẽ", "an_ngoai", "true"],
  ])(
    "sai cột %s = %j → báo lỗi ở cột %s, không ghi gì",
    (cot, giaTri, cotLoi, chua) => {
      const { mons, loi } = csvThanhMon(suaO(cot, giaTri), ch);
      expect(mons).toEqual([]); // có lỗi thì không trả món nào → script không ghi
      const l = loi.find((x) => x.cot === cotLoi);
      expect(l?.dong).toBe(cot === "id" && giaTri === "banh-mi-trung" ? 3 : 2);
      expect(l?.thongBao).toContain(chua);
    },
  );

  it("thiếu cột → báo ngay", () => {
    const { loi } = csvThanhMon("id,ten_mon\nx,y", ch);
    expect(loi[0].thongBao).toContain("Thiếu cột");
  });

  it("quá số món SPEC cho phép → báo lỗi", () => {
    const { loi } = csvThanhMon(csvGoc, { ...ch, soMonToiDa: 10 });
    expect(loi.at(-1)?.thongBao).toContain("SPEC mục 5");
  });
});
