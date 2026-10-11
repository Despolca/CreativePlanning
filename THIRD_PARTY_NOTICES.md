# Mã nguồn Bên thứ ba

`src/planning/native-world-scan.js` bao gồm các triển khai về bộ đệm (buffer), bộ đếm thời gian (timer), quét (scan) và lựa chọn nhóm worldbook từ SillyTavern 1.18.0, bản quyền thuộc về các SillyTavern contributors, sử dụng giấy phép GNU Affero General Public License v3.0, xem toàn văn tại `LICENSE-SillyTavern-AGPL-3.0.txt`.

Nguồn: https://github.com/SillyTavern/SillyTavern/blob/1.18.0/public/scripts/world-info.js

Các sửa đổi của dự án này vào ngày 07-10-2026: Các hàm được đóng gói thành phạm vi từ vựng (lexical scope) độc lập cho mỗi lần gọi; các phụ thuộc máy chủ (host dependencies) được chuyển thành tiêm rõ ràng (explicit injection); không phân phối (dispatch) các sự kiện quét toàn cục của SillyTavern, không cập nhật metadata gốc; tắt nhật ký (logs), có thể tiêm nguồn ngẫu nhiên (random source); macro và nguồn được xử lý ở một lớp tương thích (adapter layer) độc lập. Việc phân phối kết hợp (combined distribution) bao gồm module này phải tuân thủ AGPL-3.0 và cung cấp mã nguồn tương ứng. Kho lưu trữ này cung cấp mã nguồn có thể chỉnh sửa tương ứng.