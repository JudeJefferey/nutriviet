/**
 * Giới hạn số lần gọi AI theo địa chỉ mạng (IP), kiểu "cửa sổ trượt":
 * đếm số lần gọi trong 10 phút gần nhất, quá 20 lần thì tạm không gọi AI.
 *
 * Lưu ý: bộ đếm nằm trong bộ nhớ của máy chủ. Trên Vercel, mỗi máy chủ đếm riêng
 * và bộ đếm mất khi máy chủ tắt — đủ để chặn bấm liên tục, không phải chặn tuyệt đối.
 */
import { AI_GIOI_HAN_CUA_SO_MS, AI_GIOI_HAN_SO_LAN } from "@/lib/config";

const SO_DIA_CHI_TOI_DA = 5000; // tránh bộ đếm phình quá lớn

export function taoBoGioiHan(
  soLan = AI_GIOI_HAN_SO_LAN,
  cuaSoMs = AI_GIOI_HAN_CUA_SO_MS,
) {
  const lichSu = new Map<string, number[]>();
  /** true = được gọi AI (và tính 1 lần), false = đã vượt giới hạn */
  return function choPhep(
    diaChi: string,
    bayGio: number = Date.now(),
  ): boolean {
    if (lichSu.size > SO_DIA_CHI_TOI_DA) lichSu.clear();
    const gan = (lichSu.get(diaChi) ?? []).filter((t) => bayGio - t < cuaSoMs);
    if (gan.length >= soLan) {
      lichSu.set(diaChi, gan);
      return false;
    }
    gan.push(bayGio);
    lichSu.set(diaChi, gan);
    return true;
  };
}

/** Bộ giới hạn dùng chung cho cả 3 tính năng AI */
export const choPhepGoiAI = taoBoGioiHan();

/** Lấy địa chỉ mạng của người gọi từ header (Vercel gắn sẵn x-forwarded-for) */
export function layDiaChi(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "khong-ro"
  );
}
