import type { NextConfig } from "next";

// Khi chạy "npm run xuat-html": xuất app thành thư mục HTML tĩnh (out/) để mở không cần máy chủ
const xuatHtml = process.env.NUTRIVIET_XUAT_HTML === "1";

const nextConfig: NextConfig = {
  ...(xuatHtml ? { output: "export" as const, trailingSlash: true } : {}),
  // Hai tính năng này cần máy chủ → tắt khi xuất HTML tĩnh
  cacheComponents: !xuatHtml,
  partialPrefetching: !xuatHtml,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
