"use client";
/** "Dùng hồ sơ mẫu" — nạp nhanh 1 trong 3 hồ sơ mẫu để demo. */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DANH_SACH_HO_SO_MAU } from "@/lib/hoSoMau";
import { luuHoSo } from "@/lib/storage";

export function ChonHoSoMau({
  coHoSo,
  onTruocKhiLuu,
}: {
  coHoSo: boolean;
  onTruocKhiLuu?: () => void;
}) {
  const router = useRouter();
  const [mo, setMo] = useState(false);

  if (!mo)
    return (
      <button
        type="button"
        onClick={() => setMo(true)}
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 active:bg-gray-50"
      >
        Dùng hồ sơ mẫu
      </button>
    );

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4">
      <h2 className="font-semibold text-gray-900">Chọn một hồ sơ mẫu</h2>
      {coHoSo && (
        <p className="text-sm text-gray-600">
          Hồ sơ hiện tại sẽ được thay bằng hồ sơ mẫu. Nhật ký ăn uống vẫn được
          giữ.
        </p>
      )}
      {DANH_SACH_HO_SO_MAU.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => {
            if (
              coHoSo &&
              !window.confirm(`Thay hồ sơ hiện tại bằng "${m.ten}"?`)
            )
              return;
            onTruocKhiLuu?.();
            luuHoSo(m.hoSo);
            router.push("/ket-qua");
          }}
          className="rounded-xl border-2 border-gray-200 px-4 py-3 text-left active:border-emerald-500"
        >
          <span className="block font-medium text-gray-900">{m.ten}</span>
          <span className="mt-0.5 block text-xs text-gray-600">{m.moTa}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => setMo(false)}
        className="mt-1 text-sm text-gray-600 underline"
      >
        Đóng
      </button>
    </section>
  );
}
