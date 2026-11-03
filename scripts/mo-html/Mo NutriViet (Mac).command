#!/bin/bash
# Nhấp đúp file này để mở NutriViet trên Mac (dùng Python 3 có sẵn trên macOS).
cd "$(dirname "$0")"
( sleep 1; open "http://localhost:8123/" ) &
echo "NutriViet đang chạy tại http://localhost:8123 — đóng cửa sổ này để tắt."
python3 -m http.server 8123
