/** Đọc database món (data/dishes.json) với đúng kiểu dữ liệu. */
import duLieu from "@/data/dishes.json";
import type { Mon } from "@/lib/engine/dishes";

export const DANH_SACH_MON = duLieu as Mon[];

export function timMon(id: string): Mon | undefined {
  return DANH_SACH_MON.find((m) => m.id === id);
}
