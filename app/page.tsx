"use client";
/** Trang chủ: chưa có hồ sơ → nút "Bắt đầu"; đã có hồ sơ → chuyển sang trang Hôm nay. */
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChonHoSoMau } from "@/components/ChonHoSoMau";
import { DangTai, KhungTrang, NutLienKet } from "@/components/ui";
import { useHoSo } from "@/lib/useHoSo";

export default function TrangChu() {
  const { daTai, hoSo } = useHoSo();
  const router = useRouter();
  // Người dùng vừa chọn hồ sơ mẫu → để nút đó tự chuyển sang trang Kết quả, trang chủ không chen vào
  const vuaChonMau = useRef(false);
  useEffect(() => {
    if (daTai && hoSo && !vuaChonMau.current) router.replace("/hom-nay");
  }, [daTai, hoSo, router]);

  if (!daTai || hoSo) return <DangTai />;

  return (
    <KhungTrang>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-4xl font-bold text-emerald-700">NutriViet</h1>
        <p className="text-gray-600">
          Thực đơn món Việt lành mạnh, vừa túi tiền sinh viên. Trả lời vài câu
          hỏi để mình tính lượng ăn phù hợp cho bạn.
        </p>
        <p className="text-xs text-gray-500">
          Mất khoảng 2 phút · Thông tin chỉ lưu trên máy của bạn
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <NutLienKet href="/onboarding">Bắt đầu</NutLienKet>
        <ChonHoSoMau
          coHoSo={false}
          onTruocKhiLuu={() => (vuaChonMau.current = true)}
        />
      </div>
    </KhungTrang>
  );
}
