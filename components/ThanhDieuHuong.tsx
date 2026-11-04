"use client";
/** Thanh điều hướng dưới đáy màn hình (ẩn ở trang chủ và lúc đang làm onboarding). */
import Link from "next/link";
import { usePathname } from "next/navigation";

const MUC = [
  { href: "/hom-nay", nhan: "Hôm nay", bieuTuong: "☀️" },
  { href: "/thuc-don", nhan: "Thực đơn", bieuTuong: "🍱" },
  { href: "/ket-qua", nhan: "Kết quả", bieuTuong: "📊" },
  { href: "/ho-so", nhan: "Hồ sơ", bieuTuong: "👤" },
];

export function ThanhDieuHuong() {
  const duongDan = usePathname();
  if (duongDan === "/" || duongDan.startsWith("/onboarding")) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md md:max-w-4xl">
        {MUC.map((m) => {
          const dangO =
            duongDan.startsWith(m.href) ||
            (m.href === "/thuc-don" && duongDan.startsWith("/mon")) ||
            (m.href === "/hom-nay" && duongDan.startsWith("/lich-su"));
          return (
            <li key={m.href} className="flex-1">
              <Link
                href={m.href}
                className={`flex flex-col items-center py-2 text-xs ${dangO ? "font-semibold text-emerald-700" : "text-gray-500"}`}
                aria-current={dangO ? "page" : undefined}
              >
                <span className="text-lg" aria-hidden>
                  {m.bieuTuong}
                </span>
                {m.nhan}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
