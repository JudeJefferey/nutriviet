/**
 * Tạo file data/mon-an.csv từ data/dishes.json (để nhóm mở bằng Excel / Google Sheets).
 * Chạy: npm run xuat-csv
 */
import { readFileSync, writeFileSync } from "node:fs";
import { monThanhCsv } from "../lib/nhapMon.ts";

const mons = JSON.parse(readFileSync("data/dishes.json", "utf8"));
writeFileSync("data/mon-an.csv", monThanhCsv(mons));
console.log(`Đã tạo data/mon-an.csv với ${mons.length} món.`);
