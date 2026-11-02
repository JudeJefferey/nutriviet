/**
 * Test trình duyệt (end-to-end): mở app thật bằng Chromium cỡ điện thoại và bấm như người dùng.
 * Chạy: npm run build && npm run test:e2e
 * Lần đầu trên máy mới cần cài trình duyệt: npx playwright install chromium
 */
import { defineConfig, devices } from "@playwright/test";

const CONG = 3210;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${CONG}`,
    ...devices["Pixel 7"], // màn hình điện thoại (mobile-first)
    // Máy có sẵn Chromium ở /opt/pw-browsers (môi trường đám mây) thì dùng luôn
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    // Chạy bản đã build, KHÔNG có API key → kiểm tra luôn đường dự phòng của AI
    command: `npx next start -p ${CONG}`,
    port: CONG,
    reuseExistingServer: false,
    env: { ANTHROPIC_API_KEY: "" },
  },
});
