/**
 * POST /api/ai/chon-mon — chạy ở máy chủ, dùng ANTHROPIC_API_KEY (không bao giờ gửi xuống trình duyệt).
 * Lỗi, AI trả kết quả không hợp lệ, hoặc gọi quá nhiều lần → tự dùng phương án dự phòng không cần AI.
 */
import { goiAnthropic } from "@/lib/ai/client";
import { choPhepGoiAI, layDiaChi } from "@/lib/ai/gioiHan";
import { docYeuCauChonMon, xuLyChonMon } from "@/lib/ai/xuLy";

const khongGoiAI = async () => null; // vượt giới hạn → bỏ qua AI, dùng dự phòng

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const yc = docYeuCauChonMon(body);
  if (!yc)
    return Response.json(
      { loi: "Dữ liệu gửi lên chưa hợp lệ." },
      { status: 400 },
    );
  const goi = choPhepGoiAI(layDiaChi(request)) ? goiAnthropic : khongGoiAI;
  return Response.json(await xuLyChonMon(yc, goi));
}
