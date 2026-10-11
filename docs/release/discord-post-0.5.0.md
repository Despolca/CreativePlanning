# ✎ Kế hoạch Sáng tác 0.5.0 | SillyTavern Extension

Muốn để một model làm kế hoạch viết trước, sau đó giao cho một model khác viết văn bản chính (body)? "Kế hoạch Sáng tác" (Creative Planning) đã tách biệt hai giai đoạn này:

**Gửi tin nhắn → Tạo kế hoạch → Tự động hoặc thủ công tiếp tục văn bản chính.**

## Có thể làm gì?
- **Cấu hình kế hoạch độc lập**: Kế hoạch sử dụng API, model, preset và công tắc worldbook của riêng nó, không sửa đổi cấu hình văn bản chính của SillyTavern.
- **Lưu scheme**: Scheme preset, worldbook và API có thể được lưu và chuyển đổi; hỗ trợ tính năng chia nhóm preset của BaiBaiBook, tắt nhóm vẫn giữ nguyên công tắc của các mục bên trong nhóm.
- **Xem kế hoạch theo thời gian thực**: Có thể bật đầu ra dạng stream, xem tiến độ kế hoạch và lỗi ngay bên dưới tin nhắn mới nhất của người dùng.
- **Kiểm soát thời điểm tạo văn bản chính**: Mặc định sẽ tự động tiếp tục sau khi kế hoạch hoàn tất; cũng có thể tắt tự động văn bản chính, kiểm tra kế hoạch xong rồi mới nhấp vào nút bong bóng để tạo văn bản chính.
- **Xem ngữ cảnh gửi đi**: Nút con mắt mở cửa sổ xem trước, hỗ trợ hiển thị dự kiến token đầu vào và hợp nhất các tin nhắn cùng loại.
- **Điều chỉnh prompt và giao diện**: Prompt kế hoạch tích hợp sẵn, prompt tiêm vào văn bản chính có thể chỉnh sửa và khôi phục mặc định; hỗ trợ giao diện ban ngày / ban đêm / tự động (auto), thu phóng cửa sổ.

## Cài đặt
Trong "Extensions → Install Extension" của SillyTavern, dán:
https://github.com/Despolca/CreativePlanning

Sau khi cài đặt, hãy làm mới (refresh) trang, mở "Kế hoạch Sáng tác" từ menu cây đũa phép. Cấu hình API kế hoạch, preset và worldbook trước, sau đó mới bật "Kích hoạt Kế hoạch Sáng tác". Chỉ sau khi tạo mới / ghi đè scheme API thì interface và các tham số bổ sung mới được lưu.

## Xem qua trước khi sử dụng
- Việc lên kế hoạch sẽ gọi thêm API một lần, làm tăng thời gian chờ và lượng sử dụng interface tương ứng.
- Phạm vi chủ yếu là chat văn bản với một nhân vật đơn; chat nhóm, tệp đính kèm (attachments), một số vị trí worldbook và macro chưa được hỗ trợ hoàn toàn. Phạm vi tương thích MVU/EJS vui lòng xem README.
- Plugin có thể kiểm tra thẻ (tag) kế hoạch, nhưng không thể đảm bảo model không bỏ sót bước nào, cũng không đảm bảo văn bản chính sẽ thực thi mọi yêu cầu.
- Khi chờ thủ công, SillyTavern có thể vẫn hiển thị trạng thái đang tạo (generating), nhưng API văn bản chính vẫn chưa được gọi; nhấp vào "Tạo phản hồi văn bản chính" thì mới tiếp tục.
- Đóng bảng điều khiển (panel) sẽ không làm dừng quá trình tạo. Trong giai đoạn kế hoạch thì dùng nút dừng của plugin; sau khi văn bản chính bắt đầu thì dùng nút dừng của SillyTavern.
- Key mới điền được lưu trong trình duyệt hiện tại, sau khi đổi trình duyệt hoặc xóa dữ liệu trang web có thể sẽ cần phải điền lại. Không bật đồng thời bản thử nghiệm CZGHCS và bản chính thức.

📖 Hướng dẫn sử dụng và phạm vi tương thích: https://github.com/Despolca/CreativePlanning#readme
🐛 Báo cáo vấn đề: https://github.com/Despolca/CreativePlanning/issues

Chào mừng các bạn gửi phản hồi về trải nghiệm sử dụng. Khi báo cáo vấn đề, vui lòng đính kèm phiên bản SillyTavern / Plugin, các bước tái hiện (reproduction steps) và thông báo lỗi đã được che thông tin nhạy cảm (desensitized); đừng dán API Key lên nhé.