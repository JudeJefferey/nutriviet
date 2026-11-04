"use client";
/**
 * Onboarding: 5 bước nhập + bước 6 là trang Kết quả.
 * Hồ sơ cũ (nếu có) được điền sẵn để "Sửa hồ sơ".
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Buoc1,
  Buoc2,
  Buoc3,
  Buoc4,
  Buoc5,
} from "@/components/onboarding/CacBuoc";
import {
  DangTai,
  KhungTrang,
  NutChinh,
  NutPhu,
  ThanhTienDo,
} from "@/components/ui";
import {
  DRAFT_TRONG,
  SO_BUOC_NHAP,
  chuanHoaMucTieu,
  draftThanhHoSo,
  hoSoThanhDraft,
  kiemTraBuoc,
  type Draft,
  type HoSo,
  type LoiBuoc,
} from "@/lib/profile";
import { KHOA_THUC_DON, coThucDonDaDoi, luuHoSo } from "@/lib/storage";
import { useHoSo, useKhoa } from "@/lib/useHoSo";

const TONG_BUOC = SO_BUOC_NHAP + 1; // + bước Kết quả
const CAC_BUOC = [Buoc1, Buoc2, Buoc3, Buoc4, Buoc5];

export default function TrangOnboarding() {
  const { daTai, hoSo } = useHoSo();
  // Chỉ dựng form khi đã đọc xong localStorage (tránh lệch giữa server và trình duyệt)
  if (!daTai) return <DangTai />;
  return <FormOnboarding hoSoCu={hoSo} />;
}

function FormOnboarding({ hoSoCu }: { hoSoCu: HoSo | null }) {
  const router = useRouter();
  const [buoc, setBuoc] = useState(1);
  const [d, setD] = useState<Draft>(() =>
    hoSoCu ? hoSoThanhDraft(hoSoCu) : DRAFT_TRONG,
  );
  const [loi, setLoi] = useState<LoiBuoc>({});
  // Đang sửa hồ sơ mà đã có thực đơn đổi món → nhắc ở bước cuối
  const rawThucDon = useKhoa(KHOA_THUC_DON) ?? null;
  const coMonDaDoi = hoSoCu ? coThucDonDaDoi(rawThucDon, hoSoCu) : false;

  const sua = (thayDoi: Partial<Draft>) =>
    setD((cu) => ({ ...cu, ...thayDoi }));

  function chuyenBuoc(moi: number) {
    setLoi({});
    // Vào bước 4: áp luật an toàn lên lựa chọn mục tiêu
    if (moi === 4) setD((cu) => chuanHoaMucTieu(cu));
    setBuoc(moi);
    window.scrollTo({ top: 0 });
  }

  function tiep() {
    const loiMoi = kiemTraBuoc(buoc, d);
    if (Object.keys(loiMoi).length > 0) {
      setLoi(loiMoi);
      return;
    }
    if (buoc < SO_BUOC_NHAP) {
      chuyenBuoc(buoc + 1);
      return;
    }
    // Bước cuối: lưu hồ sơ rồi sang trang Kết quả
    const hoSo = draftThanhHoSo(d);
    if (!hoSo) {
      // Phòng trường hợp bước trước bị sửa thành sai: quay về bước đầu tiên còn lỗi
      for (let b = 1; b <= SO_BUOC_NHAP; b++) {
        const l = kiemTraBuoc(b, d);
        if (Object.keys(l).length > 0) {
          chuyenBuoc(b);
          setLoi(l);
          return;
        }
      }
      return;
    }
    luuHoSo(hoSo);
    router.push("/ket-qua");
  }

  const NoiDung = CAC_BUOC[buoc - 1];

  return (
    <KhungTrang>
      <div className="flex items-center gap-3">
        {buoc > 1 ? (
          <button
            type="button"
            onClick={() => chuyenBuoc(buoc - 1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-gray-600"
            aria-label="Quay lại"
          >
            ←
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push(hoSoCu ? "/ket-qua" : "/")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-gray-600"
            aria-label="Quay lại"
          >
            ←
          </button>
        )}
        <ThanhTienDo buoc={buoc} tong={TONG_BUOC} />
      </div>

      <NoiDung d={d} sua={sua} loi={loi} />

      {buoc === SO_BUOC_NHAP && coMonDaDoi && (
        <p className="text-sm text-amber-700">
          Nếu bạn thay đổi thông tin, thực đơn sẽ được tạo lại và các món bạn đã
          đổi sẽ quay về gợi ý ban đầu.
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <NutChinh onClick={tiep}>
          {buoc < SO_BUOC_NHAP ? "Tiếp" : "Xem kết quả"}
        </NutChinh>
        {buoc > 1 && (
          <NutPhu onClick={() => chuyenBuoc(buoc - 1)}>Quay lại</NutPhu>
        )}
      </div>
    </KhungTrang>
  );
}
