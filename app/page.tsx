"use client";
/** Trang chủ: chưa có hồ sơ → nút "Bắt đầu"; đã có hồ sơ → chuyển sang trang Thực đơn. */
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DangTai, KhungTrang, NutLienKet } from "@/components/ui";
import { useHoSo } from "@/lib/useHoSo";

export default function TrangChu() {
  const { daTai, hoSo } = useHoSo();
  const router = useRouter();
  useEffect(() => {
    if (daTai && hoSo) router.replace("/thuc-don");
  }, [daTai, hoSo, router]);

  if (!daTai || hoSo) return <DangTai />;

  return (
    <KhungTrang>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-4xl font-bold text-emerald-700">NutriViet</h1>
        <p className="text-gray-600">
          Thực đơn món Việt lành mạnh, vừa túi tiền sinh viên. Trả lời vài câu hỏi để mình tính lượng ăn phù hợp cho bạn.
        </p>
        <p className="text-xs text-gray-500">Mất khoảng 2 phút · Thông tin chỉ lưu trên máy của bạn</p>
      </div>
      <NutLienKet href="/onboarding">Bắt đầu</NutLienKet>
    </KhungTrang>
  );
}
