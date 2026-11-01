/**
 * Gọi Anthropic API — CHỈ dùng ở phía máy chủ (app/api/...). Key không bao giờ gửi xuống trình duyệt.
 *
 * Mọi lỗi (chưa có key, mạng, hết giờ, AI từ chối, trả lời bị cắt) đều trả về null
 * → nơi gọi sẽ dùng phương án dự phòng không cần AI.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  AI_MAX_TOKENS,
  AI_MODEL_MAC_DINH,
  AI_SO_LAN_THU_LAI,
  AI_THOI_GIAN_CHO_MS,
} from "@/lib/config";
import { SYSTEM_PROMPT } from "./prompts";

/** Hàm gọi AI: nhận nội dung + (tùy chọn) khuôn JSON, trả về chữ AI viết hoặc null. Test sẽ thay bằng hàm giả. */
export type GoiAI = (p: {
  noiDung: string;
  khuonJSON?: Record<string, unknown>;
}) => Promise<string | null>;

// Các model hỗ trợ "fallback phía máy chủ": khi bị từ chối, Anthropic tự chuyển sang model khác để trả lời
const MODEL_HO_TRO_FALLBACK = [
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-fable-5-1",
  "claude-sonnet-5-5",
];

export function coKeyAI(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export const goiAnthropic: GoiAI = async ({ noiDung, khuonJSON }) => {
  if (!coKeyAI()) return null; // chưa có key → dự phòng
  const model = process.env.ANTHROPIC_MODEL || AI_MODEL_MAC_DINH;
  const client = new Anthropic({
    timeout: AI_THOI_GIAN_CHO_MS,
    maxRetries: AI_SO_LAN_THU_LAI,
  });
  const coFallback = MODEL_HO_TRO_FALLBACK.includes(model);

  try {
    const res = await client.beta.messages.create({
      model,
      max_tokens: AI_MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: noiDung }],
      output_config: {
        effort: "low", // việc đơn giản → trả lời nhanh, rẻ
        ...(khuonJSON
          ? { format: { type: "json_schema" as const, schema: khuonJSON } }
          : {}),
      },
      ...(coFallback
        ? {
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default" as const,
          }
        : {}),
    });
    // AI từ chối hoặc trả lời bị cắt giữa chừng → không dùng
    if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens")
      return null;
    const chu = res.content
      .filter(
        (b): b is Extract<typeof b, { type: "text" }> => b.type === "text",
      )
      .map((b) => b.text)
      .join("")
      .trim();
    return chu || null;
  } catch (loi) {
    // Ghi log phía máy chủ để nhóm dễ tìm lỗi; người dùng chỉ thấy phương án dự phòng
    if (loi instanceof Anthropic.AuthenticationError)
      console.error("[AI] API key không hợp lệ");
    else if (loi instanceof Anthropic.RateLimitError)
      console.error("[AI] Bị giới hạn số lần gọi");
    else if (loi instanceof Anthropic.APIError)
      console.error(`[AI] Lỗi API ${loi.status}: ${loi.message}`);
    else console.error("[AI] Lỗi khi gọi AI:", loi);
    return null;
  }
};
