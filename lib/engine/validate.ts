/** Kiểm tra dữ liệu đầu vào: báo lỗi sớm nếu số không hợp lệ (âm, bằng 0, không phải số). */
export function assertPositive(value: number, ten: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`Giá trị ${ten} không hợp lệ: ${value}`);
  }
}

export function assertNonNegative(value: number, ten: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`Giá trị ${ten} không hợp lệ: ${value}`);
  }
}

/** Sai số nhỏ để so sánh số thực (tránh lỗi kiểu 0.1 + 0.2 = 0.30000000000000004). */
export const EPSILON = 1e-9;
