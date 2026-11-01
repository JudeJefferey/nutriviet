import type { Metadata, Viewport } from "next";
import { ThanhDieuHuong } from "@/components/ThanhDieuHuong";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriViet",
  description: "Lập thực đơn món Việt và theo dõi ăn uống",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <ThanhDieuHuong />
      </body>
    </html>
  );
}
