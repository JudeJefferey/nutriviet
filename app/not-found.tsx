/** Trang 404 bằng tiếng Việt */
import { KhungTrang, NutLienKet } from "@/components/ui";

export default function KhongTimThay() {
  return (
    <KhungTrang>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Không tìm thấy trang này
        </h1>
        <p className="text-gray-600">
          Có thể đường dẫn đã thay đổi. Bạn quay về trang chính nhé.
        </p>
      </div>
      <NutLienKet href="/">Về trang chính</NutLienKet>
    </KhungTrang>
  );
}
