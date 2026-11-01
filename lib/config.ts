/**
 * lib/config.ts — NƠI DUY NHẤT chứa mọi hằng số dinh dưỡng & an toàn.
 *
 * Đây là các giá trị MẶC ĐỊNH ƯỚC LƯỢNG theo SPEC.md (mục 3 và 4).
 * Nhóm có thể chỉnh trực tiếp ở đây; engine sẽ tự dùng giá trị mới.
 */

// ─────────────────────────────────────────────
// BMR — công thức Mifflin-St Jeor
// BMR = 10 × kg + 6.25 × cm − 5 × tuổi + hằng số giới tính
// ─────────────────────────────────────────────
export const BMR = {
  HE_SO_CAN_NANG: 10, // nhân với cân nặng (kg)
  HE_SO_CHIEU_CAO: 6.25, // nhân với chiều cao (cm)
  HE_SO_TUOI: 5, // nhân với tuổi rồi TRỪ đi
  HANG_SO_NAM: 5, // nam: +5
  HANG_SO_NU: -161, // nữ: −161
} as const;

// ─────────────────────────────────────────────
// Hệ số công việc (nhân với BMR để ra năng lượng hằng ngày chưa tính tập)
// ─────────────────────────────────────────────
export const HE_SO_CONG_VIEC = {
  ngoi_nhieu: 1.2, // làm văn phòng, học nhiều, ít đi lại
  dung_di_lai: 1.35, // đứng bán hàng, đi lại nhiều
  lao_dong_chan_tay: 1.5, // bốc vác, xây dựng, công việc nặng
} as const;

// ─────────────────────────────────────────────
// MET theo cường độ tập (mức tiêu hao so với lúc nghỉ)
// Calo tập/ngày = (MET − 1) × kg × (giờ tập mỗi tuần) / 7
// Trừ 1 vì phần năng lượng lúc nghỉ đã nằm trong BMR, tránh tính trùng.
// ─────────────────────────────────────────────
export const MET_THEO_CUONG_DO = {
  nhe: 3.5, // đi bộ nhanh, yoga nhẹ
  vua: 5, // đá bóng phong trào, đạp xe vừa
  nang: 8, // chạy nhanh, tập cường độ cao
} as const;
export const MET_NGHI = 1; // phần năng lượng lúc nghỉ được trừ ra

// ─────────────────────────────────────────────
// Điều chỉnh calo theo mục tiêu (tỉ lệ so với TDEE)
// ─────────────────────────────────────────────
export const DIEU_CHINH_CALO = {
  giam_mo: { macDinh: 0.15, toiThieu: 0.1, toiDa: 0.2 }, // cắt 15% (cho chỉnh 10–20%)
  tang_co: { macDinh: 0.08, toiThieu: 0.05, toiDa: 0.1 }, // thêm 8% (cho chỉnh 5–10%)
} as const;

// ─────────────────────────────────────────────
// Mức sàn calo: calo mục tiêu KHÔNG BAO GIỜ thấp hơn max(BMR, mức tối thiểu theo giới)
// Áp dụng cho MỌI mục tiêu (nhóm đã thống nhất).
// ─────────────────────────────────────────────
export const MUC_SAN_CALO = {
  nu: 1200,
  nam: 1500,
} as const;

// ─────────────────────────────────────────────
// Macro
// ─────────────────────────────────────────────
// Protein theo g/kg cân nặng
export const PROTEIN_G_PER_KG = {
  duy_tri: 1.2,
  an_lanh_manh: 1.2,
  giam_mo: 1.6,
  tang_co: 1.8,
} as const;
export const PROTEIN_THEM_KHI_CHOI_THE_THAO = 0.2; // +0.2 g/kg nếu có chơi thể thao

export const TI_LE_CHAT_BEO = 0.25; // chất béo = 25% tổng calo; carb = phần còn lại

// Quy đổi năng lượng
export const KCAL_MOI_GAM = {
  protein: 4,
  carb: 4,
  fat: 9,
} as const;

// ─────────────────────────────────────────────
// Kiểm tra mục tiêu cân nặng
// Tốc độ tính theo % CÂN NẶNG HIỆN TẠI mỗi tuần.
// ─────────────────────────────────────────────
export const TOC_DO_TOI_DA_MOI_TUAN = {
  giam: 0.01, // giảm tối đa 1% cân nặng/tuần
  tang: 0.005, // tăng tối đa 0.5% cân nặng/tuần
} as const;

// ─────────────────────────────────────────────
// An toàn (SPEC mục 4)
// ─────────────────────────────────────────────
export const BMI_TOI_THIEU = 18.5; // dưới mức này là thiếu cân
export const TUOI_TOI_THIEU = 18; // dưới 18 tuổi → tầng 1

// Tầng 2: bệnh nền → tag món cần loại / ưu tiên
export const LOC_THEO_BENH = {
  tieu_duong: { loai: ["nhieu_duong"], uuTien: ["gi_thap"] },
  gout: { loai: ["nhieu_purine"], uuTien: [] },
  huyet_ap_cao: { loai: ["nhieu_muoi"], uuTien: [] },
} as const;

export const GHI_CHU_BAC_SI =
  "Đây là gợi ý chung, không thay thế chỉ định của bác sĩ.";

// ─────────────────────────────────────────────
// Onboarding (SPEC mục 2)
// ─────────────────────────────────────────────

// Danh sách dị ứng ở bước 5. Mã (ma) phải trùng với trường "allergens" trong data/dishes.json.
// Gồm cả "allergen ẩn" hay có sẵn trong món Việt: nước mắm, mắm tôm, đậu phộng.
export const DANH_SACH_DI_UNG = [
  { ma: "dau_phong", ten: "Đậu phộng" },
  { ma: "hai_san_vo", ten: "Tôm, cua (hải sản có vỏ)" },
  { ma: "ca", ten: "Cá" },
  { ma: "trung", ten: "Trứng" },
  { ma: "sua", ten: "Sữa" },
  { ma: "dau_nanh", ten: "Đậu nành" },
  { ma: "gluten", ten: "Lúa mì (gluten)" },
  { ma: "nuoc_mam", ten: "Nước mắm" },
  { ma: "mam_tom", ten: "Mắm tôm" },
] as const;

// Giới hạn nhập liệu hợp lý — ngoài khoảng này app nhờ người dùng kiểm tra lại
export const GIOI_HAN_NHAP = {
  tuoi: { min: 13, max: 100 },
  chieuCaoCm: { min: 120, max: 220 },
  canNangKg: { min: 30, max: 250 },
  soTuan: { min: 1, max: 104 }, // tối đa 2 năm
  soBuoiMoiTuan: { min: 1, max: 14 },
  phutMoiBuoi: { min: 10, max: 300 },
  nganSachMoiBuaVnd: { min: 10000, max: 500000 },
} as const;

// Lựa chọn thời gian nấu tối đa (phút) ở bước 5
export const THOI_GIAN_NAU_LUA_CHON = [15, 30, 60, 120] as const;

// Ngân sách mặc định gợi ý mỗi bữa (VNĐ) — mức phổ biến của sinh viên
export const NGAN_SACH_MAC_DINH_VND = 35000;
