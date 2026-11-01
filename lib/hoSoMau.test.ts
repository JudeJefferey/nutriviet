import { describe, expect, it } from "vitest";
import { tinhKeHoach } from "@/lib/engine/plan";
import { taoThucDon } from "@/lib/engine/menu";
import { lyDoLoai } from "@/lib/engine/dishes";
import { DANH_SACH_MON, timMon } from "@/lib/monAn";
import { DANH_SACH_HO_SO_MAU } from "./hoSoMau";
import {
  anToanTuHoSo,
  boLocTuHoSo,
  hoSoThanhTinhToan,
  laHoSoHopLe,
} from "./profile";

describe("Hồ sơ mẫu", () => {
  it.each(DANH_SACH_HO_SO_MAU.map((m) => [m.ten, m] as const))(
    "%s hợp lệ và tính được",
    (_, m) => {
      expect(laHoSoHopLe(m.hoSo)).toBe(true);
      const k = tinhKeHoach(hoSoThanhTinhToan(m.hoSo));
      expect(k.caloMucTieu).toBeGreaterThanOrEqual(k.mucSan);
      if (k.kiemTraCanNang) expect(k.kiemTraCanNang.trangThai).toBe("ok"); // mục tiêu mẫu nằm trong tốc độ an toàn
    },
  );

  it("Giảm mỡ: nữ 20t 158cm 58kg → BMR 1.306,5 · TDEE 1.568 · mục tiêu 1.333", () => {
    const k = tinhKeHoach(hoSoThanhTinhToan(DANH_SACH_HO_SO_MAU[0].hoSo));
    expect([k.bmr, k.tdee, k.caloMucTieu]).toEqual([1307, 1568, 1333]);
  });

  it("Bóng đá: có calo tập (4 × 62 × 4,5 / 7 ≈ 159) và protein 2,0 g/kg", () => {
    const k = tinhKeHoach(hoSoThanhTinhToan(DANH_SACH_HO_SO_MAU[1].hoSo));
    expect(k.caloTap).toBe(159);
    expect(k.macro.proteinGPerKg).toBeCloseTo(2.0, 9);
  });

  it("Tiểu đường: tầng 2, không món nhiều đường nào trong thực đơn", () => {
    const h = DANH_SACH_HO_SO_MAU[2].hoSo;
    const at = anToanTuHoSo(h);
    expect(at.tang2).toBe(true);
    expect(at.canGhiChuBacSi).toBe(true);
    const k = tinhKeHoach(hoSoThanhTinhToan(h));
    const td = taoThucDon({
      mons: DANH_SACH_MON,
      boLoc: boLocTuHoSo(h),
      kcalMucTieu: k.caloMucTieu,
      soBua: h.soBua,
      phongCach: "can_bang",
      tagUuTien: at.tagUuTien,
      noiAn: h.noiAn,
    });
    td.ngay.forEach((n) =>
      n.bua.forEach((b) =>
        expect(timMon(b.monId)!.health_tags).not.toContain("nhieu_duong"),
      ),
    );
    td.ngay.forEach((n) =>
      n.bua.forEach((b) =>
        expect(lyDoLoai(timMon(b.monId)!, boLocTuHoSo(h))).toBeNull(),
      ),
    );
  });
});

describe("Hồ sơ mẫu — thực đơn đủ để demo", () => {
  it.each([
    ["giam-mo", 7],
    ["bong-da", 6],
    ["tieu-duong", 6],
  ] as const)("%s: ít nhất %i ngày đạt (Cân bằng)", (id, toiThieu) => {
    const h = DANH_SACH_HO_SO_MAU.find((m) => m.id === id)!.hoSo;
    const k = tinhKeHoach(hoSoThanhTinhToan(h));
    const td = taoThucDon({
      mons: DANH_SACH_MON,
      boLoc: boLocTuHoSo(h),
      kcalMucTieu: k.caloMucTieu,
      soBua: h.soBua,
      phongCach: "can_bang",
      tagUuTien: anToanTuHoSo(h).tagUuTien,
      noiAn: h.noiAn,
    });
    expect(td.ngay.filter((n) => n.dat).length).toBeGreaterThanOrEqual(
      toiThieu,
    );
  });
});
