# SPEC.md — Đặc tả MVP NutriViet

## 1. Tóm tắt

Web app giúp người dùng (trọng tâm: **sinh viên muốn ăn lành mạnh với ngân sách thấp**) nhận thực đơn 7 ngày bằng món Việt, ghi lại bữa ăn hằng ngày và được AI giải thích lựa chọn. Số liệu do engine rule-based tính; AI chỉ chọn món và giải thích.

## 2. Hồ sơ người dùng (onboarding nhiều bước)

Mỗi bước một màn hình, có thanh tiến độ, có nút quay lại.

| Bước | Thu thập |
|---|---|
| 1. Sàng lọc an toàn | Tuổi; đang mang thai / cho con bú (có/không); bệnh nền (chọn nhiều: tiểu đường, gout, huyết áp cao, bệnh thận, không có); "Bạn có đang được theo dõi về vấn đề ăn uống không?" (có/không/không muốn trả lời) |
| 2. Cơ thể | Giới tính sinh học (để tính BMR), chiều cao (cm), cân nặng (kg) |
| 3. Vận động | Tính chất công việc (ngồi nhiều / đứng, đi lại nhiều / lao động chân tay); có chơi thể thao không → nếu có: môn, số buổi/tuần, phút/buổi, cường độ (nhẹ / vừa / nặng) |
| 4. Mục tiêu | Giảm mỡ / Tăng cơ / Duy trì / Ăn lành mạnh hơn. Nếu giảm mỡ hoặc tăng cơ: cân mục tiêu + thời hạn (tuần) |
| 5. Thói quen ăn | Dị ứng (chọn nhiều); ăn chay / không ăn thịt heo; món không thích (tìm trong DB); ngân sách mỗi bữa (VNĐ); thời gian nấu tối đa; số bữa/ngày (3 hoặc 4); chủ yếu ăn ngoài hay nấu nhà |
| 6. Kết quả | BMR, TDEE, calo mục tiêu, macro + mục "Vì sao ra con số này?" giải thích từng bước tính bằng lời dễ hiểu |

Hồ sơ lưu trong `localStorage`. Có trang "Hồ sơ" để sửa lại và tính lại.

## 3. Engine tính toán (`lib/engine/`, hằng số ở `lib/config.ts`)

Các hằng số dưới đây là **giá trị mặc định ước lượng**, nhóm có thể chỉnh trong config.

**BMR — Mifflin-St Jeor**
- Nam: `10 × kg + 6.25 × cm − 5 × tuổi + 5`
- Nữ: `10 × kg + 6.25 × cm − 5 × tuổi − 161`

**TDEE** = `BMR × hệ số công việc + calo tập trung bình/ngày`
- Hệ số công việc: ngồi nhiều 1.2 · đứng/đi lại 1.35 · lao động chân tay 1.5
- Calo tập/ngày = `(MET − 1) × kg × (giờ tập mỗi tuần) / 7`, với MET: nhẹ 3.5 · vừa 5 · nặng 8 (trừ 1 để không tính trùng phần năng lượng nghỉ đã có trong BMR)

**Calo mục tiêu**
- Giảm mỡ: TDEE × (1 − 15%) — cho phép chỉnh trong khoảng 10–20%
- Tăng cơ: TDEE × (1 + 8%) — khoảng 5–10%
- Duy trì / Ăn lành mạnh: TDEE
- **Mức sàn:** không thấp hơn `max(BMR, 1200 với nữ / 1500 với nam)`

**Macro**
- Protein (g/kg): duy trì/lành mạnh 1.2 · giảm mỡ 1.6 · tăng cơ 1.8 · có chơi thể thao +0.2
- Chất béo: 25% tổng calo
- Carb: phần calo còn lại
- Quy đổi: protein & carb 4 kcal/g, chất béo 9 kcal/g

**Kiểm tra mục tiêu cân nặng**
- Giảm: tốc độ > 1% cân nặng/tuần → báo "chưa an toàn", tự đề xuất thời hạn mới đạt mức ≤ 1%/tuần
- Tăng: tốc độ > 0.5%/tuần → đề xuất kéo dài thời hạn
- BMI ở cân mục tiêu < 18.5 → không nhận mục tiêu, giải thích nhẹ nhàng

Viết test Vitest cho mọi hàm, gồm vài ca tính tay để đối chiếu.

## 4. An toàn (ưu tiên cao nhất)

**Tầng 1 — Khóa chế độ giảm/tăng cân, chỉ cho "Ăn cân bằng" + khuyên gặp chuyên gia:**
dưới 18 tuổi · mang thai / cho con bú · bệnh thận · trả lời "có" ở câu hỏi về vấn đề ăn uống · BMI hiện tại < 18.5 mà chọn giảm mỡ.

**Tầng 2 — Cho dùng nhưng lọc món + luôn hiện ghi chú "Đây là gợi ý chung, không thay thế chỉ định của bác sĩ":**
- Tiểu đường: loại món tag `nhieu_duong`, ưu tiên `gi_thap`
- Gout: loại món tag `nhieu_purine`
- Huyết áp cao: loại món tag `nhieu_muoi`

**Tầng 3 — Tùy biến lối sống:** dị ứng (loại món có allergen, kể cả allergen ẩn như nước mắm, mắm tôm, đậu phộng), chay, không thịt heo, ngân sách, thời gian nấu.

**Theo dõi trong quá trình dùng:** nếu nhật ký cho thấy 3 ngày liền dưới mức sàn calo → hiện thông điệp quan tâm, không siết thêm calo, gợi ý nói chuyện với người thân hoặc chuyên gia. Không bao giờ khen hay thưởng việc ăn ít.

Khi ăn ngoài, ghi rõ app không đảm bảo món không bị lẫn chất gây dị ứng.

## 5. Database món ăn (`data/dishes.json`)

```json
{
  "id": "com-tam-suon",
  "name": "Cơm tấm sườn",
  "meal": ["trua", "toi"],
  "per_serving_vua": { "kcal": 0, "protein": 0, "carb": 0, "fat": 0 },
  "portion_factor": { "it": 0.7, "vua": 1.0, "nhieu": 1.3 },
  "price_vnd": 35000,
  "cook_minutes": 0,
  "eat_out": true,
  "diet": [],
  "allergens": ["nuoc_mam"],
  "health_tags": ["nhieu_muoi"],
  "style_tags": [],
  "ingredients": ["cơm tấm", "sườn heo nướng", "đồ chua", "nước mắm"],
  "verified": false
}
```

- `meal`: `sang` / `trua` / `toi` / `phu`
- `diet`: `chay`, `khong_heo`
- `health_tags`: `nhieu_duong`, `gi_thap`, `nhieu_purine`, `nhieu_muoi`
- `style_tags`: `high_protein`, `tiet_kiem`, `nhanh_15p`
- Claude Code tạo **10–15 món mẫu** đủ các bữa, có món chay, để demo chạy được. Số liệu mẫu để `verified: false`; nhóm sẽ thay bằng số liệu đã kiểm tra.

## 6. Tạo thực đơn 7 ngày (rule-based)

1. Chia calo theo bữa: 3 bữa → sáng 30% · trưa 35% · tối 35%; 4 bữa → 25% · 35% · 30% · phụ 10%.
2. Lọc món theo luật an toàn, dị ứng, chế độ ăn, món ghét, ngân sách, thời gian nấu.
3. Với mỗi bữa, chọn món + khẩu phần (ít/vừa/nhiều) sao cho gần calo của bữa nhất.
4. Một món không lặp quá 2 lần/tuần.
5. Ba phong cách: **Cân bằng** · **High-protein** (ưu tiên `high_protein`, protein +0.4 g/kg) · **Tiết kiệm** (ưu tiên giá thấp).
6. Tổng ngày phải nằm trong ±10% calo mục tiêu; nếu không đạt, báo rõ "không đủ món phù hợp" thay vì ép.

Bấm vào món: xem nguyên liệu, dinh dưỡng theo khẩu phần, nút **Đổi món** (đưa 3 món thay thế cùng bữa, cùng bộ lọc, calo gần nhất).

## 7. Trang "Hôm nay" (dashboard)

- Calo & macro còn lại trong ngày (thanh tiến độ, màu trung tính)
- Nước: bấm +1 ly, mục tiêu mặc định 8 ly
- Gợi ý bữa kế tiếp theo kế hoạch
- Ghi món đã ăn: tìm trong DB, chọn khẩu phần ít/vừa/nhiều
- Nút **"Lỡ ăn rồi"**: ghi món ngoài kế hoạch; phần calo chênh được chia đều cho 3 ngày tới, mỗi ngày giảm tối đa 10% và không xuống dưới mức sàn
- Chế độ **"Đơn giản"** (bật trong Hồ sơ): ẩn số liệu, chỉ hiện "bữa tới nên ăn gì"

## 8. Tính năng AI (giai đoạn sau, server-side)

1. **Nhập món bằng chat:** "trưa ăn cơm tấm sườn hơi nhiều" → AI trả JSON `{ meal, dish_id | null, portion }`. Code khớp với DB; nếu `dish_id` null hoặc không tồn tại → hiện 3 món gần tên nhất để người dùng chọn. AI không tạo số liệu dinh dưỡng.
2. **"Vì sao chọn món này?":** gửi hồ sơ tóm tắt + món + số liệu do engine tính, AI viết 2–3 câu giải thích.
3. **Chọn món đa dạng:** engine gửi danh sách món ứng viên hợp lệ cho từng bữa, AI chọn để thực đơn phong phú; code kiểm tra lại kết quả (món có trong danh sách, tổng calo đạt điều kiện ở mục 6). Nếu AI lỗi → dùng kết quả rule-based.

System prompt cho AI phải nêu: chỉ dùng món trong danh sách được cung cấp, không đưa lời khuyên y khoa, không cổ vũ ăn kiêng khắt khe, trả lời tiếng Việt.

## 9. Ngoài phạm vi MVP

Tài khoản đăng nhập, database server, chat tư vấn tự do, điều chỉnh calo hằng tuần theo cân nặng, game/streak/huy hiệu, nhập InBody/xét nghiệm, chế độ keto/halal, chế độ vận động viên chuyên sâu theo môn, nhận diện món qua ảnh, danh sách đi chợ. Những mục này trình bày trong báo cáo như "định hướng phát triển".

## 10. Giai đoạn xây dựng

1. Khung dự án + engine + test
2. Onboarding + trang kết quả
3. Database món + thực đơn 7 ngày + đổi món
4. Trang Hôm nay + ghi món + "Lỡ ăn rồi"
5. Tính năng AI
6. Hoàn thiện giao diện, dữ liệu demo, deploy Vercel
