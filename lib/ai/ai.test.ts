import { describe, expect, it } from "vitest";
import { SO_LAN_TOI_DA_MOI_TUAN } from "@/lib/config";
import { lyDoLoai, type BoLoc } from "@/lib/engine/dishes";
import { taoThucDon, trongKhoangCho, ungVienTheoBua } from "@/lib/engine/menu";
import { DANH_SACH_MON, timMon } from "@/lib/monAn";
import type { GoiAI } from "./client";
import {
  giaiThichDuPhong,
  kiemTraGiaiThich,
  laySoTrongCau,
  monGanTen,
  nhapMonDuPhong,
  soDuocPhep,
} from "./kiemTra";
import { SYSTEM_PROMPT, promptChonMon, promptGiaiThich } from "./prompts";
import {
  docYeuCauChonMon,
  docYeuCauGiaiThich,
  docYeuCauNhapMon,
  xuLyChonMon,
  xuLyGiaiThich,
  xuLyNhapMon,
  type YeuCauChonMon,
} from "./xuLy";

/** AI giả lập: luôn trả về chuỗi cho trước (hoặc null = lỗi mạng / chưa có key) */
const aiTra =
  (chu: string | null): GoiAI =>
  async () =>
    chu;

const ycNhap = {
  cauNhap: "trưa ăn cơm tấm sườn hơi nhiều",
  cacBua: ["sang", "trua", "toi"] as const,
  buaMacDinh: "trua" as const,
};

describe("System prompt — đúng ràng buộc SPEC mục 8", () => {
  it("nêu đủ 4 ràng buộc", () => {
    expect(SYSTEM_PROMPT).toContain("Chỉ dùng các món có trong danh sách");
    expect(SYSTEM_PROMPT).toContain("Không đưa lời khuyên y khoa");
    expect(SYSTEM_PROMPT).toContain("Không cổ vũ ăn kiêng khắt khe");
    expect(SYSTEM_PROMPT).toContain("tiếng Việt");
  });
});

describe("Tính năng 1 — nhập món bằng chat", () => {
  const yc = docYeuCauNhapMon(ycNhap)!;

  it("AI trả đúng → dùng kết quả AI", async () => {
    const kq = await xuLyNhapMon(
      yc,
      aiTra('{"meal":"trua","dish_id":"com-tam-suon","portion":"nhieu"}'),
    );
    expect(kq).toMatchObject({
      nguon: "ai",
      monId: "com-tam-suon",
      bua: "trua",
      khauPhan: "nhieu",
    });
  });

  it("AI bịa món không có trong database → monId null, hiện 3 món gần tên nhất", async () => {
    const kq = await xuLyNhapMon(
      yc,
      aiTra('{"meal":"trua","dish_id":"bun-cha-ha-noi","portion":"vua"}'),
    );
    expect(kq.monId).toBeNull();
    expect(kq.goiY[0]).toBe("com-tam-suon");
    expect(kq.goiY.length).toBeLessThanOrEqual(3);
  });

  it("AI trả bữa/khẩu phần lạ → sửa về giá trị an toàn", async () => {
    const kq = await xuLyNhapMon(
      yc,
      aiTra('{"meal":"khuya","dish_id":"pho-bo","portion":"cuc-nhieu"}'),
    );
    expect(kq).toMatchObject({
      nguon: "ai",
      monId: "pho-bo",
      bua: "trua",
      khauPhan: "vua",
    });
  });

  it("AI lỗi / JSON hỏng → dự phòng rule-based vẫn hiểu câu", async () => {
    for (const hong of [null, "không phải json", "[1,2]"]) {
      const kq = await xuLyNhapMon(yc, aiTra(hong));
      expect(kq).toMatchObject({
        nguon: "du_phong",
        monId: "com-tam-suon",
        bua: "trua",
        khauPhan: "nhieu",
      });
    }
  });

  it("dự phòng: 'sáng ăn ít phở' và chữ không dấu", () => {
    const ctx = {
      cacBua: ["sang", "trua", "toi"] as ("sang" | "trua" | "toi")[],
      buaMacDinh: "toi" as const,
      mons: DANH_SACH_MON,
    };
    expect(
      nhapMonDuPhong({ ...ctx, cauNhap: "sáng ăn ít phở bò" }),
    ).toMatchObject({ monId: "pho-bo", bua: "sang", khauPhan: "it" });
    expect(
      nhapMonDuPhong({ ...ctx, cauNhap: "an bun thit nuong" }),
    ).toMatchObject({ monId: "bun-thit-nuong", bua: "toi", khauPhan: "vua" });
    // "thịt" không được hiểu nhầm thành "ít"
    expect(nhapMonDuPhong({ ...ctx, cauNhap: "bún thịt nướng" }).khauPhan).toBe(
      "vua",
    );
  });

  it("dự phòng: không chắc món → không tự chọn, chỉ gợi ý", () => {
    const kq = nhapMonDuPhong({
      cauNhap: "ăn cơm",
      cacBua: ["trua"],
      buaMacDinh: "trua",
      mons: DANH_SACH_MON,
    });
    expect(kq.monId).toBeNull();
    expect(kq.goiY.length).toBe(3);
  });

  it("monGanTen không có từ nào trùng → rỗng", () => {
    expect(monGanTen("pizza", DANH_SACH_MON)).toEqual([]);
  });

  it("chặn đầu vào xấu: rỗng, quá dài, bữa lạ", () => {
    expect(docYeuCauNhapMon({ ...ycNhap, cauNhap: "   " })).toBeNull();
    expect(
      docYeuCauNhapMon({ ...ycNhap, cauNhap: "a".repeat(201) }),
    ).toBeNull();
    expect(docYeuCauNhapMon({ ...ycNhap, cacBua: ["khuya"] })).toBeNull();
    expect(docYeuCauNhapMon(null)).toBeNull();
  });
});

describe("Tính năng 2 — Vì sao chọn món này?", () => {
  const ycGT = {
    monId: "com-ga-luoc",
    khauPhan: "vua",
    bua: "trua",
    kcalBua: 578,
    phongCach: "high_protein",
    tagUuTien: [],
    tenMucTieu: "Giảm mỡ",
  };
  const yc = docYeuCauGiaiThich(ycGT)!;

  it("lấy số trong câu theo kiểu Việt Nam", () => {
    expect(laySoTrongCau("khoảng 1.650 kcal và 30.000 đ")).toEqual([
      [1650, 1.65],
      [30000, 30],
    ]);
  });

  it("AI chỉ nhắc đúng số đã cho → nhận", async () => {
    const kq = await xuLyGiaiThich(
      yc,
      aiTra(
        "Cơm gà luộc khoảng 520 kcal, gần mức 578 kcal của bữa trưa. Món nhiều đạm (35 g).",
      ),
    );
    expect(kq.nguon).toBe("ai");
  });

  it("AI bịa số (vd 700 kcal) → bỏ, dùng lời giải thích dự phòng", async () => {
    const kq = await xuLyGiaiThich(
      yc,
      aiTra("Món này chỉ 700 kcal nên rất tốt."),
    );
    expect(kq.nguon).toBe("du_phong");
    expect(kq.cau).toContain("520 kcal");
  });

  it("AI trả quá dài hoặc lỗi → dự phòng", async () => {
    expect((await xuLyGiaiThich(yc, aiTra("a".repeat(700)))).nguon).toBe(
      "du_phong",
    );
    expect((await xuLyGiaiThich(yc, aiTra(null))).nguon).toBe("du_phong");
  });

  it("dự phòng nói đúng phong cách và chỉ số đường huyết", () => {
    const t = {
      mon: timMon("goi-ga-bap-cai")!,
      khauPhan: "vua" as const,
      bua: "toi" as const,
      kcalBua: 578,
      phongCach: "high_protein" as const,
      tagUuTien: ["gi_thap"],
    };
    const cau = giaiThichDuPhong(t);
    expect(cau).toContain("nhiều đạm");
    expect(cau).toContain("đường huyết thấp");
    expect(kiemTraGiaiThich(cau, soDuocPhep(t))).toBe(cau); // câu dự phòng cũng qua được kiểm tra số
  });

  it("prompt không chứa tuổi, cân nặng, tên bệnh", () => {
    const t = {
      mon: timMon("com-ga-luoc")!,
      khauPhan: "vua" as const,
      bua: "trua" as const,
      kcalBua: 578,
      phongCach: "can_bang" as const,
      tagUuTien: ["gi_thap"],
    };
    const p = promptGiaiThich(t, "Ăn lành mạnh hơn");
    expect(p).not.toMatch(
      /tuổi|cân nặng|chiều cao|tiểu đường|gout|huyết áp|thận/i,
    );
  });

  it("chặn món không có thật / số vô lý", () => {
    expect(docYeuCauGiaiThich({ ...ycGT, monId: "khong-co" })).toBeNull();
    expect(docYeuCauGiaiThich({ ...ycGT, kcalBua: -5 })).toBeNull();
  });
});

describe("Tính năng 3 — chọn món đa dạng", () => {
  const boLoc: BoLoc = {
    tagLoai: [],
    diUng: [],
    cheDoAn: "khong_kieng",
    monKhongThich: [],
    nganSachMoiBuaVnd: 50000,
    thoiGianNauToiDa: 60,
  };
  const yc: YeuCauChonMon = docYeuCauChonMon({
    boLoc,
    kcalMucTieu: 1650,
    soBua: 3,
    phongCach: "can_bang",
    tagUuTien: [],
    noiAn: null,
  })!;
  const tc = { ...yc, mons: DANH_SACH_MON };
  const goc = taoThucDon(tc);
  // Câu trả lời "AI" hợp lệ: dùng đúng các món của thực đơn rule-based nhưng đổi thứ tự ngày
  const hopLe = {
    ngay: [...goc.ngay]
      .reverse()
      .map((n) => ({ mon: n.bua.map((b) => b.monId) })),
  };

  it("AI chọn hợp lệ → engine tự tính khẩu phần, mọi ngày đạt ±10%", async () => {
    const kq = await xuLyChonMon(yc, aiTra(JSON.stringify(hopLe)));
    expect(kq.nguon).toBe("ai");
    expect(kq.thucDon.nguon).toBe("ai");
    kq.thucDon.ngay.forEach((n) =>
      expect(trongKhoangCho(n.tong.kcal, 1650)).toBe(true),
    );
  });

  it("AI chọn món ngoài danh sách (vi phạm bộ lọc) → dùng thuật toán", async () => {
    const b2 = { ...boLoc, diUng: ["nuoc_mam"] };
    const yc2 = { ...yc, boLoc: b2 };
    const sai = {
      ngay: Array.from({ length: 7 }, () => ({
        mon: ["pho-bo", "com-tam-suon", "com-ga-luoc"],
      })),
    };
    const kq = await xuLyChonMon(yc2, aiTra(JSON.stringify(sai)));
    expect(kq.nguon).toBe("du_phong");
    kq.thucDon.ngay.forEach((n) =>
      n.bua.forEach((m) => expect(lyDoLoai(timMon(m.monId)!, b2)).toBeNull()),
    );
  });

  it("AI lặp món quá 2 lần/tuần → dùng thuật toán", async () => {
    const lap = {
      ngay: Array.from({ length: 7 }, () => ({ mon: hopLe.ngay[0].mon })),
    };
    expect((await xuLyChonMon(yc, aiTra(JSON.stringify(lap)))).nguon).toBe(
      "du_phong",
    );
  });

  it("AI trùng món trong một ngày / sai số ngày / JSON hỏng → dùng thuật toán", async () => {
    const trung = {
      ngay: hopLe.ngay.map((n, i) =>
        i === 0 ? { mon: [n.mon[1], n.mon[1], n.mon[2]] } : n,
      ),
    };
    expect((await xuLyChonMon(yc, aiTra(JSON.stringify(trung)))).nguon).toBe(
      "du_phong",
    );
    expect(
      (
        await xuLyChonMon(
          yc,
          aiTra(JSON.stringify({ ngay: hopLe.ngay.slice(0, 6) })),
        )
      ).nguon,
    ).toBe("du_phong");
    expect((await xuLyChonMon(yc, aiTra("{"))).nguon).toBe("du_phong");
    expect((await xuLyChonMon(yc, aiTra(null))).nguon).toBe("du_phong");
  });

  it("thực đơn dự phòng = đúng thực đơn rule-based", async () => {
    const kq = await xuLyChonMon(yc, aiTra(null));
    expect(kq.thucDon.ngay).toEqual(goc.ngay);
  });

  it("kết quả AI không món nào quá 2 lần/tuần", async () => {
    const kq = await xuLyChonMon(yc, aiTra(JSON.stringify(hopLe)));
    const dem = new Map<string, number>();
    kq.thucDon.ngay.forEach((n) =>
      n.bua.forEach((b) => dem.set(b.monId, (dem.get(b.monId) ?? 0) + 1)),
    );
    for (const v of dem.values())
      expect(v).toBeLessThanOrEqual(SO_LAN_TOI_DA_MOI_TUAN);
  });

  it("prompt chỉ chứa món đã qua bộ lọc", () => {
    const b2 = { ...boLoc, diUng: ["nuoc_mam"] };
    const p = promptChonMon(ungVienTheoBua({ ...tc, boLoc: b2 }), "can_bang");
    expect(p).not.toContain("com-tam-suon");
    expect(p).toContain("banh-mi-trung");
  });

  it("chặn đầu vào xấu", () => {
    expect(docYeuCauChonMon({ ...yc, soBua: 5 })).toBeNull();
    expect(
      docYeuCauChonMon({ ...yc, boLoc: { ...boLoc, nganSachMoiBuaVnd: 1 } }),
    ).toBeNull();
    expect(docYeuCauChonMon({ ...yc, kcalMucTieu: 99999 })).toBeNull();
  });
});
