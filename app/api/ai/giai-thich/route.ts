/**
 * POST /api/ai/giai-thich — chạy ở máy chủ, dùng ANTHROPIC_API_KEY (không bao giờ gửi xuống trình duyệt).
 * Lỗi hay AI trả kết quả không hợp lệ → tự dùng phương án dự phòng không cần AI.
 */
import { goiAnthropic } from "@/lib/ai/client";
import { docYeuCauGiaiThich, xuLyGiaiThich } from "@/lib/ai/xuLy";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const yc = docYeuCauGiaiThich(body);
  if (!yc)
    return Response.json(
      { loi: "Dữ liệu gửi lên chưa hợp lệ." },
      { status: 400 },
    );
  return Response.json(await xuLyGiaiThich(yc, goiAnthropic));
}
