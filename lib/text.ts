/** Bỏ dấu tiếng Việt để tìm "com tam" vẫn ra "Cơm tấm" */
export function boDau(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
