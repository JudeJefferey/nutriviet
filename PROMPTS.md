# Prompt cho Claude Code — dán lần lượt từng giai đoạn

Chuẩn bị: tạo thư mục dự án, bỏ `CLAUDE.md` và `SPEC.md` vào thư mục gốc, chạy `git init`, rồi mở Claude Code trong thư mục đó. Sau mỗi giai đoạn chạy được thì commit.

---

## Giai đoạn 1 — Khung dự án + engine

```
Đọc kỹ CLAUDE.md và SPEC.md. Chưa viết code.

Lập kế hoạch cho Giai đoạn 1: khởi tạo dự án Next.js + TypeScript + Tailwind + Vitest theo đúng cấu trúc thư mục trong CLAUDE.md, tạo lib/config.ts chứa mọi hằng số ở mục 3 của SPEC, và viết lib/engine/ gồm: tính BMR, TDEE (hệ số công việc + calo tập), calo mục tiêu có mức sàn, macro, kiểm tra mục tiêu cân nặng (tốc độ và BMI mục tiêu), và hàm xác định tầng an toàn (mục 4).

Liệt kê các hàm sẽ viết, input/output của từng hàm, và các ca test (có ít nhất 3 ca tính tay ghi rõ phép tính). Chờ mình duyệt.
```

## Giai đoạn 2 — Onboarding + trang kết quả

```
Giai đoạn 2 theo SPEC mục 2. Lập kế hoạch trước, chờ duyệt.

Làm onboarding 6 bước, mobile-first, có thanh tiến độ và nút quay lại, lưu hồ sơ vào localStorage qua lib/storage.ts. Bước 1 sàng lọc an toàn phải gọi hàm tầng an toàn: nếu thuộc tầng 1 thì ở bước 4 chỉ cho chọn "Ăn cân bằng" kèm lời giải thích nhẹ nhàng và khuyên gặp chuyên gia.

Trang kết quả hiển thị BMR, TDEE, calo mục tiêu, macro, và mục "Vì sao ra con số này?" giải thích từng bước bằng tiếng Việt dễ hiểu (text sinh từ code, chưa dùng AI). Nếu mục tiêu cân nặng không an toàn, hiển thị đề xuất thời hạn mới.
```

## Giai đoạn 3 — Database món + thực đơn 7 ngày

```
Giai đoạn 3 theo SPEC mục 5 và 6. Lập kế hoạch trước, chờ duyệt.

Tạo data/dishes.json với 12–15 món Việt mẫu theo đúng schema, đủ bữa sáng/trưa/tối/phụ, có ít nhất 3 món chay, đủ các tag để test bộ lọc. Đặt "verified": false cho tất cả.

Viết thuật toán tạo thực đơn 7 ngày (rule-based, có test), 3 phong cách, trang xem thực đơn theo ngày, trang chi tiết món, và nút Đổi món. Nếu không đủ món phù hợp, hiển thị thông báo rõ ràng thay vì ép.
```

## Giai đoạn 4 — Trang Hôm nay

```
Giai đoạn 4 theo SPEC mục 7 và phần "Theo dõi" ở mục 4. Lập kế hoạch trước, chờ duyệt.

Làm trang Hôm nay: calo/macro còn lại, đếm nước, gợi ý bữa kế tiếp, ghi món (tìm trong DB + chọn khẩu phần), nút "Lỡ ăn rồi" với logic chia bù theo SPEC, chế độ Đơn giản, và luật cảnh báo 3 ngày dưới mức sàn. Lưu nhật ký vào localStorage. Viết test cho logic chia bù và luật cảnh báo.
```

## Giai đoạn 5 — Tính năng AI

```
Giai đoạn 5 theo SPEC mục 8. Lập kế hoạch trước, chờ duyệt.

Cài @anthropic-ai/sdk, gọi API chỉ từ API route phía server, đọc ANTHROPIC_API_KEY và ANTHROPIC_MODEL từ .env.local, tạo .env.example (không có key thật) và đảm bảo .env.local nằm trong .gitignore.

Làm 3 tính năng: nhập món bằng chat (AI trả JSON, code kiểm tra với DB), "Vì sao chọn món này?", và chọn món đa dạng từ danh sách ứng viên có kiểm tra lại. Mọi lỗi hoặc kết quả không hợp lệ từ AI phải có phương án dự phòng bằng rule-based. Viết system prompt đúng các ràng buộc trong SPEC.
```

## Giai đoạn 6 — Hoàn thiện + deploy

```
Giai đoạn 6. Rà toàn bộ app: giao diện nhất quán trên điện thoại, chữ tiếng Việt tự nhiên, không còn lỗi build/test. Thêm nút "Dùng hồ sơ mẫu" để demo nhanh (3 hồ sơ: sinh viên muốn giảm mỡ, sinh viên chơi bóng đá muốn tăng cơ, người bị tiểu đường muốn ăn lành mạnh). Viết README ngắn: cách chạy, cách deploy lên Vercel, cấu trúc engine. Sau đó hướng dẫn mình từng bước deploy.
```

---

## Prompt dùng khi cần

- **Khi có lỗi:** `Đang bị lỗi sau: [dán lỗi]. Tìm nguyên nhân trước, giải thích cho mình, rồi mới sửa.`
- **Khi Claude Code làm quá phạm vi:** `Cái này ngoài SPEC. Quay lại đúng phạm vi MVP, bỏ phần [X].`
- **Khi cần hiểu code để thuyết trình:** `Giải thích file [tên file] cho một sinh viên năm nhất không học IT: nó làm gì, chạy theo thứ tự nào, ví dụ cụ thể.`
- **Khi nhóm gửi dữ liệu món đã kiểm tra:** `Đây là dữ liệu món đã kiểm tra: [dán]. Thay vào data/dishes.json, đặt verified: true, kiểm tra đúng schema và chạy lại test.`
