# CLAUDE.md — Luật chung của dự án

Đây là đồ án môn học (nhóm sinh viên DUE): web app lập thực đơn và theo dõi ăn uống có hỗ trợ AI, tên tạm **NutriViet**. Mục tiêu là một bản demo chạy được, gọn, dễ giải thích khi thuyết trình — không phải sản phẩm thương mại. Chi tiết tính năng nằm ở `SPEC.md`; đọc file đó trước khi làm bất kỳ tính năng nào.

## Nguyên tắc bất di bất dịch

1. **Số liệu do code tính, không do AI tính.** BMR, TDEE, calo mục tiêu, macro, khẩu phần đều là hàm TypeScript thuần trong `lib/engine/`, có test. AI không bao giờ tự đưa ra con số dinh dưỡng.
2. **AI chỉ chọn món có trong database** (`data/dishes.json`) và viết lời giải thích. Mọi kết quả AI trả về phải được code kiểm tra lại (món có tồn tại không, có vi phạm bộ lọc không) trước khi hiển thị.
3. **Luật an toàn luôn thắng mục tiêu người dùng.** Xem mục "An toàn" trong `SPEC.md`. Khi hai luật xung đột, chọn phương án an toàn hơn.
4. **Làm đúng phạm vi MVP trong `SPEC.md`.** Không tự thêm tính năng, thư viện hay trang ngoài spec. Nếu thấy cần, hỏi trước.
5. **Không bịa dữ liệu dinh dưỡng.** Món mẫu tự tạo phải có `"verified": false`. Nhóm sẽ kiểm tra lại số liệu theo Bảng thành phần thực phẩm Việt Nam.

## Công nghệ

- Next.js (App Router) + TypeScript + Tailwind CSS
- Lưu trữ: `localStorage` trên trình duyệt (không có tài khoản, không có backend database — dữ liệu sức khỏe nằm trên máy người dùng)
- AI: Anthropic API qua `@anthropic-ai/sdk`, **chỉ gọi từ API route phía server** (`app/api/...`). Key nằm trong `.env.local` (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`), không bao giờ lộ ra client, không commit.
- Test: Vitest cho toàn bộ `lib/engine/`
- Deploy: Vercel

## Cấu trúc thư mục

```
app/                 # các trang + API routes
components/          # UI dùng lại
lib/engine/          # công thức & thuật toán (hàm thuần, có test)
lib/config.ts        # MỌI hằng số (hệ số vận động, % cắt calo, ngưỡng an toàn...)
lib/storage.ts       # đọc/ghi localStorage
data/dishes.json     # database món Việt
```

Mọi hằng số dinh dưỡng phải nằm trong `lib/config.ts`, có comment giải thích, để nhóm dễ chỉnh và dễ trình bày.

## Giao diện

- Toàn bộ chữ trên giao diện bằng **tiếng Việt**, giọng thân thiện, không phán xét (ví dụ dùng "Lỡ ăn rồi", không dùng "Bạn đã vượt mức").
- Thiết kế **mobile-first** (người dùng chủ yếu xem trên điện thoại).
- Không dùng màu đỏ / ngôn từ cảnh báo cho việc ăn nhiều hơn kế hoạch.

## Cách làm việc

- Mỗi tính năng: **lập kế hoạch trước, chờ duyệt rồi mới code.**
- Làm từng bước nhỏ, chạy được rồi mới sang bước tiếp. Chạy `npm test` và `npm run build` trước khi báo xong.
- Viết code dễ đọc, có comment tiếng Việt ở các đoạn logic quan trọng — nhóm cần hiểu để trả lời giảng viên.
- Sau mỗi bước hoàn thành, tóm tắt ngắn: đã làm gì, file nào thay đổi, cách kiểm tra thử.
