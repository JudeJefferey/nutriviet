/**
 * Các kiểu dữ liệu dùng chung cho engine.
 * Dùng mã không dấu (vd "giam_mo") để code ổn định; chữ hiển thị tiếng Việt sẽ nằm ở giao diện.
 */

export type GioiTinh = "nam" | "nu";

export type CongViec = "ngoi_nhieu" | "dung_di_lai" | "lao_dong_chan_tay";

export type CuongDo = "nhe" | "vua" | "nang";

/** Mục tiêu. "an_lanh_manh" = "Ăn lành mạnh hơn" — cũng là chế độ "Ăn cân bằng" của tầng 1. */
export type MucTieu = "giam_mo" | "tang_co" | "duy_tri" | "an_lanh_manh";

/** Bệnh nền (mảng rỗng = "Không có"). */
export type BenhNen = "tieu_duong" | "gout" | "huyet_ap_cao" | "benh_than";

/** Câu "Bạn có đang được theo dõi về vấn đề ăn uống không?" */
export type TraLoiVanDeAnUong = "co" | "khong" | "khong_muon_tra_loi";

export interface TheThao {
  soBuoiMoiTuan: number;
  phutMoiBuoi: number;
  cuongDo: CuongDo;
}
