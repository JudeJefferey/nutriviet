/**
 * Trang chi tiết món (SPEC mục 6): nguyên liệu, dinh dưỡng theo khẩu phần, nút Đổi món.
 * Mỗi món có sẵn một trang tĩnh (tạo lúc build từ data/dishes.json).
 */
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChiTietMon } from "@/components/ChiTietMon";
import { DangTai } from "@/components/ui";
import { DANH_SACH_MON, timMon } from "@/lib/monAn";

export function generateStaticParams() {
  return DANH_SACH_MON.map((m) => ({ id: m.id }));
}

export default async function TrangMon({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!timMon(id)) notFound();
  return (
    <Suspense fallback={<DangTai />}>
      <ChiTietMon id={id} />
    </Suspense>
  );
}
