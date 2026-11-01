/**
 * 3 hồ sơ mẫu để demo nhanh (Giai đoạn 6). Số liệu là ví dụ minh họa, không phải người thật.
 */
import type { HoSo } from "@/lib/profile";

export interface HoSoMau {
  id: string;
  ten: string;
  moTa: string;
  hoSo: HoSo;
}

export const DANH_SACH_HO_SO_MAU: HoSoMau[] = [
  {
    id: "giam-mo",
    ten: "Sinh viên muốn giảm mỡ",
    moTa: "Nữ, 20 tuổi, 158 cm, 58 kg · muốn về 54 kg trong 12 tuần · hay ăn ngoài",
    hoSo: {
      phienBan: 1,
      tuoi: 20,
      mangThaiChoConBu: false,
      benhNen: [],
      vanDeAnUong: "khong",
      gioiTinh: "nu",
      chieuCaoCm: 158,
      canNangKg: 58,
      congViec: "ngoi_nhieu",
      theThao: null,
      mucTieu: "giam_mo",
      canMucTieuKg: 54,
      soTuan: 12,
      tiLeDieuChinh: null,
      diUng: [],
      cheDoAn: "khong_kieng",
      monKhongThich: [],
      nganSachMoiBuaVnd: 40000,
      thoiGianNauToiDa: 60,
      soBua: 3,
      noiAn: "an_ngoai",
    },
  },
  {
    id: "bong-da",
    ten: "Sinh viên chơi bóng đá muốn tăng cơ",
    moTa: "Nam, 20 tuổi, 172 cm, 62 kg · đá bóng 3 buổi/tuần · muốn lên 65 kg trong 16 tuần",
    hoSo: {
      phienBan: 1,
      tuoi: 20,
      mangThaiChoConBu: false,
      benhNen: [],
      vanDeAnUong: "khong",
      gioiTinh: "nam",
      chieuCaoCm: 172,
      canNangKg: 62,
      congViec: "ngoi_nhieu",
      theThao: {
        mon: "Bóng đá",
        soBuoiMoiTuan: 3,
        phutMoiBuoi: 90,
        cuongDo: "vua",
      },
      mucTieu: "tang_co",
      canMucTieuKg: 65,
      soTuan: 16,
      tiLeDieuChinh: null,
      diUng: [],
      cheDoAn: "khong_kieng",
      monKhongThich: [],
      nganSachMoiBuaVnd: 45000,
      thoiGianNauToiDa: 60,
      soBua: 4,
      noiAn: "an_ngoai",
    },
  },
  {
    id: "tieu-duong",
    ten: "Người tiểu đường muốn ăn lành mạnh",
    moTa: "Nữ, 45 tuổi, 155 cm, 60 kg · tiểu đường · nấu ăn ở nhà",
    hoSo: {
      phienBan: 1,
      tuoi: 45,
      mangThaiChoConBu: false,
      benhNen: ["tieu_duong"],
      vanDeAnUong: "khong",
      gioiTinh: "nu",
      chieuCaoCm: 155,
      canNangKg: 60,
      congViec: "dung_di_lai",
      theThao: null,
      mucTieu: "an_lanh_manh",
      canMucTieuKg: null,
      soTuan: null,
      tiLeDieuChinh: null,
      diUng: [],
      cheDoAn: "khong_kieng",
      monKhongThich: [],
      nganSachMoiBuaVnd: 40000,
      thoiGianNauToiDa: 60,
      soBua: 3,
      noiAn: "nau_nha",
    },
  },
];
