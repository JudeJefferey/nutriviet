/**
 * Xuất NutriViet thành thư mục HTML tĩnh: out/
 *
 * Bản HTML không có máy chủ nên tạm tách thư mục app/api (3 API gọi AI) ra trong lúc xuất,
 * xuất xong trả lại nguyên vẹn. Trong bản HTML, các nút AI tự dùng phương án dự phòng.
 *
 * Chạy: npm run xuat-html
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, renameSync } from "node:fs";
import path from "node:path";

const goc = process.cwd();
const api = path.join(goc, "app", "api");
const tam = path.join(goc, ".api-tam-khi-xuat-html");

if (existsSync(tam)) {
  console.error(
    "Thư mục .api-tam-khi-xuat-html còn sót từ lần trước. Hãy chuyển nó về app/api rồi chạy lại.",
  );
  process.exit(1);
}

renameSync(api, tam);
try {
  execSync("npx next build", {
    stdio: "inherit",
    env: { ...process.env, NUTRIVIET_XUAT_HTML: "1" },
  });
} finally {
  renameSync(tam, api); // luôn trả lại app/api, kể cả khi xuất lỗi
}

// Kèm file mở nhanh và hướng dẫn vào thư mục out/
cpSync(path.join(goc, "scripts", "mo-html"), path.join(goc, "out"), {
  recursive: true,
});
console.log("\nXong! Thư mục HTML nằm ở: out/  (xem out/HUONG-DAN.txt)");
