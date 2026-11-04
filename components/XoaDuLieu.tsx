"use client";
/** Nút "Xóa toàn bộ dữ liệu" — có bước xác nhận, xóa xong về trang chủ. Màu xám, không dùng màu đỏ. */
import { useState } from "react";
import { xoaToanBoDuLieu } from "@/lib/storage";

export function XoaDuLieu() {
  const [xacNhan, setXacNhan] = useState(false);

  if (!xacNhan)
    return (
      <button
        type="button"
        onClick={() => setXacNhan(true)}
        className="w-full rounded-xl px-4 py-3 text-sm font-medium text-gray-500 underline"
      >
        Xóa toàn bộ dữ liệu
      </button>
    );

  return (
    <section
      role="alertdialog"
      aria-label="Xác nhận xóa dữ liệu"
      className="flex flex-col gap-3 rounded-2xl border-2 border-gray-300 bg-gray-50 p-4"
    >
      <p className="text-sm text-gray-800">
        Thao tác này xóa hồ sơ, nhật ký ăn uống, thực đơn đã đổi và cài đặt{" "}
        <strong>trên máy này</strong>. Không thể hoàn tác.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setXacNhan(false)}
          className="min-h-11 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 font-semibold text-gray-700"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={() => {
            xoaToanBoDuLieu();
            // Tải lại hẳn trang chủ (không dùng router) để trang Hồ sơ không kịp
            // tự chuyển sang onboarding khi thấy hồ sơ vừa bị xóa
            window.location.replace("/");
          }}
          className="min-h-11 rounded-xl bg-gray-700 px-4 py-2 font-semibold text-white"
        >
          Xóa hết
        </button>
      </div>
    </section>
  );
}
