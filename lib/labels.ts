/**
 * Chữ tiếng Việt hiển thị cho các mã trong code.
 * Đổi chữ trên giao diện thì sửa ở đây.
 */
import type {
  BenhNen,
  CongViec,
  CuongDo,
  GioiTinh,
  MucTieu,
  TraLoiVanDeAnUong,
} from "@/lib/engine/types";

export const NHAN_GIOI_TINH: Record<GioiTinh, string> = { nam: "Nam", nu: "Nữ" };

export const NHAN_CONG_VIEC: Record<CongViec, string> = {
  ngoi_nhieu: "Ngồi nhiều",
  dung_di_lai: "Đứng, đi lại nhiều",
  lao_dong_chan_tay: "Lao động chân tay",
};

export const NHAN_CUONG_DO: Record<CuongDo, string> = {
  nhe: "Nhẹ",
  vua: "Vừa",
  nang: "Nặng",
};

export const NHAN_MUC_TIEU: Record<MucTieu, string> = {
  giam_mo: "Giảm mỡ",
  tang_co: "Tăng cơ",
  duy_tri: "Duy trì cân nặng",
  an_lanh_manh: "Ăn lành mạnh hơn",
};

/** Ở tầng 1, "Ăn lành mạnh hơn" được gọi là "Ăn cân bằng" (SPEC mục 4). */
export const NHAN_AN_CAN_BANG = "Ăn cân bằng";

export const NHAN_BENH_NEN: Record<BenhNen, string> = {
  tieu_duong: "Tiểu đường",
  gout: "Gout",
  huyet_ap_cao: "Huyết áp cao",
  benh_than: "Bệnh thận",
};

export const NHAN_VAN_DE_AN_UONG: Record<TraLoiVanDeAnUong, string> = {
  co: "Có",
  khong: "Không",
  khong_muon_tra_loi: "Không muốn trả lời",
};

export type CheDoAn = "khong_kieng" | "chay" | "khong_heo";
export const NHAN_CHE_DO_AN: Record<CheDoAn, string> = {
  khong_kieng: "Không kiêng",
  chay: "Ăn chay",
  khong_heo: "Không ăn thịt heo",
};

export type NoiAn = "an_ngoai" | "nau_nha";
export const NHAN_NOI_AN: Record<NoiAn, string> = {
  an_ngoai: "Chủ yếu ăn ngoài",
  nau_nha: "Chủ yếu nấu ở nhà",
};

export function nhanThoiGianNau(phut: number): string {
  if (phut >= 120) return "Thoải mái";
  if (phut >= 60) return `${phut / 60} tiếng`;
  return `${phut} phút`;
}
