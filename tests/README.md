# Thử nghiệm

Thư mục này chỉ được sử dụng để xác minh trong quá trình phát triển, sẽ không được tải thông qua entry point của plugin.

- `npm test`: Unit test Node không cần mạng và test bộ điều khiển kế hoạch.
- `npm run check`: Kiểm tra cú pháp JS.
- `node tests/browser-check.mjs`: Test hồi quy (regression test) trên trình duyệt cục bộ. Cần có Playwright và trình duyệt khả dụng; có thể chỉ định đường dẫn module Playwright đã có thông qua `PLAYWRIGHT_MODULE_PATH`, và chỉ định trình duyệt đã có thông qua `BROWSER_EXECUTABLE`. Tùy chọn `SCREENSHOT_DIR` để lưu ảnh chụp màn hình desktop và màn hình hẹp.

Test trên trình duyệt sẽ khởi động một dịch vụ HTTP cục bộ tạm thời và một phiên trình duyệt độc lập, sử dụng ngữ cảnh SillyTavern mô phỏng và scheme API giả lập, không kết nối với API thực và không sử dụng cấu hình trình duyệt hàng ngày.