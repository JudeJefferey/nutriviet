/**
 * Lời nhắn (prompt) gửi cho AI. Chỉ gửi thông tin tối thiểu:
 * mục tiêu, phong cách, calo bữa, tên món, nhãn ưu tiên — KHÔNG gửi tuổi, cân nặng, chiều cao, tên bệnh.
 */
import type { Bua, Mon } from "@/lib/engine/dishes";
import { dinhDuongKhauPhan } from "@/lib/engine/dishes";
import { NHAN_BUA, NHAN_KHAU_PHAN, NHAN_PHONG_CACH } from "@/lib/labels";
import type { ThongTinGiaiThich } from "./kiemTra";

/** System prompt chung — đúng các ràng buộc ở SPEC mục 8 */
export const SYSTEM_PROMPT = `Bạn là trợ lý của NutriViet, ứng dụng gợi ý thực đơn món Việt cho sinh viên.
Quy tắc bắt buộc:
- Chỉ dùng các món có trong danh sách được cung cấp. Không bao giờ nhắc tới hay gợi ý món ngoài danh sách.
- Không tự đưa ra con số dinh dưỡng (calo, gam, %...). Chỉ được nhắc lại đúng các con số đã được cung cấp.
- Không đưa lời khuyên y khoa, không chẩn đoán, không nói về thuốc hay điều trị.
- Không cổ vũ ăn kiêng khắt khe, nhịn ăn hay ăn quá ít. Không khen việc ăn ít.
- Giọng thân thiện, nhẹ nhàng, không phán xét.
- Luôn trả lời bằng tiếng Việt.`;

const NHAN_TAG_UU_TIEN: Record<string, string> = {
  gi_thap: "ưu tiên món có chỉ số đường huyết thấp",
};

// ───────────── Tính năng 1: nhập món bằng chat ─────────────
export function promptNhapMon(
  cauNhap: string,
  cacBua: Bua[],
  mons: Mon[],
): string {
  return [
    "Người dùng mô tả món họ vừa ăn. Hãy xác định bữa, món và khẩu phần.",
    "",
    "Danh sách món (id: tên):",
    ...mons.map((m) => `- ${m.id}: ${m.name}`),
    "",
    `Các bữa: ${cacBua.map((b) => `${b} (${NHAN_BUA[b]})`).join(", ")}`,
    "Khẩu phần: it (ít), vua (vừa), nhieu (nhiều). Không nói rõ thì chọn vua.",
    "Nếu món không có trong danh sách hoặc không chắc chắn, đặt dish_id là null.",
    "",
    `Câu của người dùng: """${cauNhap}"""`,
  ].join("\n");
}

export function schemaNhapMon(cacBua: Bua[], mons: Mon[]) {
  return {
    type: "object",
    properties: {
      meal: { type: "string", enum: cacBua },
      dish_id: {
        anyOf: [
          { type: "string", enum: mons.map((m) => m.id) },
          { type: "null" },
        ],
      },
      portion: { type: "string", enum: ["it", "vua", "nhieu"] },
    },
    required: ["meal", "dish_id", "portion"],
    additionalProperties: false,
  };
}

// ───────────── Tính năng 2: "Vì sao chọn món này?" ─────────────
export function promptGiaiThich(
  t: ThongTinGiaiThich,
  tenMucTieu: string,
): string {
  const d = dinhDuongKhauPhan(t.mon, t.khauPhan);
  return [
    "Viết 2–3 câu ngắn giải thích vì sao món dưới đây được chọn cho bữa này của người dùng.",
    "Chỉ dùng thông tin bên dưới. Nếu nhắc con số, chỉ dùng đúng các con số đã cho.",
    "Không dùng gạch đầu dòng, không chào hỏi.",
    "",
    `Mục tiêu của người dùng: ${tenMucTieu}`,
    `Phong cách thực đơn: ${NHAN_PHONG_CACH[t.phongCach]}`,
    ...t.tagUuTien.map((x) => `Lưu ý: ${NHAN_TAG_UU_TIEN[x] ?? x}`),
    `Bữa: ${NHAN_BUA[t.bua]} — calo mục tiêu của bữa: ${t.kcalBua} kcal`,
    `Món: ${t.mon.name}, phần ${NHAN_KHAU_PHAN[t.khauPhan].toLowerCase()}`,
    `Số liệu do ứng dụng tính: ${d.kcal} kcal, đạm ${d.protein} g, tinh bột ${d.carb} g, béo ${d.fat} g, giá khoảng ${t.mon.price_vnd} đồng`,
    `Nguyên liệu: ${t.mon.ingredients.join(", ")}`,
    `Nhãn của món: ${[...t.mon.style_tags, ...t.mon.health_tags, ...t.mon.diet].join(", ") || "không có"}`,
  ].join("\n");
}

// ───────────── Tính năng 3: chọn món đa dạng ─────────────
export function promptChonMon(
  ungVien: { bua: Bua; kcal: number; mon: Mon[] }[],
  phongCach: "can_bang" | "high_protein" | "tiet_kiem",
): string {
  return [
    "Hãy chọn món cho thực đơn 7 ngày (Thứ 2 → Chủ nhật) sao cho phong phú, đa dạng.",
    "Quy tắc:",
    "- Mỗi ngày là một danh sách id món, đúng thứ tự các bữa bên dưới.",
    "- Mỗi bữa chỉ được chọn món trong danh sách của chính bữa đó.",
    "- Một món tối đa 2 lần trong cả tuần, và không lặp lại trong cùng một ngày.",
    "- Ưu tiên món có calo phần vừa gần với calo mục tiêu của bữa (ứng dụng sẽ tự chỉnh khẩu phần).",
    `- Phong cách: ${NHAN_PHONG_CACH[phongCach]}${
      phongCach === "high_protein"
        ? " (ưu tiên món nhiều đạm)"
        : phongCach === "tiet_kiem"
          ? " (ưu tiên món rẻ)"
          : ""
    }.`,
    "",
    ...ungVien.flatMap((u, i) => [
      `Bữa ${i + 1} — ${NHAN_BUA[u.bua]} (mục tiêu khoảng ${u.kcal} kcal):`,
      ...u.mon.map(
        (m) =>
          `- ${m.id}: ${m.name} · phần vừa ${m.per_serving_vua.kcal} kcal · ${m.price_vnd} đ${
            m.style_tags.length ? ` · ${m.style_tags.join(", ")}` : ""
          }`,
      ),
      "",
    ]),
  ].join("\n");
}

export function schemaChonMon(ungVien: { mon: Mon[] }[]) {
  const tatCaId = [...new Set(ungVien.flatMap((u) => u.mon.map((m) => m.id)))];
  return {
    type: "object",
    properties: {
      ngay: {
        type: "array",
        items: {
          type: "object",
          properties: {
            mon: { type: "array", items: { type: "string", enum: tatCaId } },
          },
          required: ["mon"],
          additionalProperties: false,
        },
      },
    },
    required: ["ngay"],
    additionalProperties: false,
  };
}
