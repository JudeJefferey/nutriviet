/**
 * Đọc data/mon-an.csv → KIỂM TRA → ghi data/dishes.json.
 * Có lỗi ở bất kỳ dòng nào thì báo rõ dòng/cột và KHÔNG ghi gì (database không bao giờ bị hỏng).
 *
 * Chạy: npm run nhap-mon            (đọc data/mon-an.csv)
 *       npm run nhap-mon -- duong/dan/file.csv
 */
import { readFileSync, writeFileSync } from "node:fs";
import { DANH_SACH_DI_UNG, LECH_KCAL_TOI_DA, SO_MON_TOI_DA, SO_MON_TOI_THIEU } from "../lib/config.ts";
import { csvThanhMon } from "../lib/nhapMon.ts";

const duongDan = process.argv[2] ?? "data/mon-an.csv";
const { mons, loi } = csvThanhMon(readFileSync(duongDan, "utf8"), {
  maDiUng: DANH_SACH_DI_UNG.map((x) => x.ma),
  soMonToiThieu: SO_MON_TOI_THIEU,
  soMonToiDa: SO_MON_TOI_DA,
  lechKcalToiDa: LECH_KCAL_TOI_DA,
});

if (loi.length > 0) {
  console.error(`\nCó ${loi.length} lỗi trong ${duongDan} — chưa ghi gì vào data/dishes.json:\n`);
  for (const l of loi) console.error(`  • Dòng ${l.dong}${l.cot ? `, cột ${l.cot}` : ""}: ${l.thongBao}`);
  console.error("\nSửa các lỗi trên trong file CSV rồi chạy lại: npm run nhap-mon\n");
  process.exit(1);
}

writeFileSync("data/dishes.json", JSON.stringify(mons, null, 2) + "\n");
const daKiemTra = mons.filter((m) => m.verified).length;
console.log(`\nĐã ghi ${mons.length} món vào data/dishes.json (${daKiemTra} món đã kiểm tra, ${mons.length - daKiemTra} món còn ước lượng).`);
console.log("Tiếp theo: chạy  npm test  để kiểm tra thực đơn vẫn chạy đúng với số liệu mới.\n");
