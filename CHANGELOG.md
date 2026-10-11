# Lịch sử Cập nhật

## 0.5.0 · 2026-10-11

- Phát hành lên kho lưu trữ chính thức Zyzyzy-Dev/CZGH, thống nhất entry point (điểm vào) chạy, bộ đệm tài nguyên (resource cache) và phiên bản manifest thành 0.5.0.
- Bao gồm các scheme API/preset/worldbook kế hoạch độc lập, hiển thị dạng stream và trong luồng chat (in-chat), tự động hoặc thủ công tiếp tục văn bản chính (body), tùy chỉnh prompt, xem trước ngữ cảnh (context preview) và thu phóng cửa sổ.
- Tích hợp bản sửa lỗi: bỏ qua các dữ liệu bổ sung (extra data) không liên quan của tin nhắn khi đang chờ thủ công.
- Bổ sung hình ảnh hướng dẫn sử dụng và bài đăng phát hành trên Discord; phạm vi tương thích và các hạn chế đã biết xem tại file README.

## 0.4.0-dev.29

- Khi chờ văn bản chính thủ công, chỉ so sánh danh tính chat, thứ tự luồng (floor order), vai trò/tên của tin nhắn, văn bản chính và swipe hiện tại; việc các plugin khác cập nhật dữ liệu bổ sung của tin nhắn sẽ không còn bị đánh giá nhầm là có sự thay đổi trong chat nữa.
- Viết lại README, lịch sử phát triển cũ được chuyển sang file này.

Dưới đây là lịch sử phát triển cũ, các hành vi hiện tại vui lòng lấy README làm chuẩn.

### 0.4.0-dev.9 Sửa lỗi Tương tác

Công tắc nhóm chỉ kiểm soát việc đọc, không ghi đè hàng loạt các công tắc bên trong nhóm. Worldbook sẽ hiển thị tên sách trước, mở rộng ra mới xem các mục (entries). Menu scheme preset/worldbook được thêm nguồn SillyTavern hiện tại (chỉ đọc), sau khi xác nhận sẽ tải một bản sao độc lập, nếu hủy sẽ không thay đổi cài đặt. Các mục bị chuyển đổi hàng loạt do lỗi ở phiên bản trước có thể được khôi phục bằng cách tải nguồn SillyTavern hiện tại.

### Kế hoạch dạng Stream và Vị trí hiển thị

"Tạo kế hoạch dạng Stream" trong trang Cài đặt có thể bật/tắt và lưu lại, mặc định tắt. Văn bản stream sẽ cập nhật theo thời gian thực trên bản xem trước của bảng điều khiển (panel), chỉ khi nhận được cờ kết thúc (end marker) hoàn chỉnh và vượt qua kiểm tra thẻ (tag validation) thì mới được tiêm vào yêu cầu văn bản chính. Khi bật "Hiển thị kế hoạch dưới tin nhắn người dùng", sau khi gửi tin nhắn người dùng, có thể mở rộng thẻ (card) trong luồng chat để xem trạng thái chờ, dữ liệu stream tăng dần và thông báo lỗi; một số kế hoạch và lỗi chỉ được giữ lại ở trang hiện tại, làm mới (refresh) sẽ không khôi phục. Kế hoạch đã hoàn thành được hiển thị dưới luồng người dùng tương ứng; sau khi văn bản chính hoàn thành, lịch sử kế hoạch vẫn được lưu theo swipe phản hồi, khi chuyển đổi phản hồi sẽ hiển thị phiên bản tương ứng, không ghi đè lên mes của người dùng hay AI.

### 0.4.0-dev.9 Xem trước trong luồng thời gian thực

Thẻ (card) trong luồng chat xuất hiện cùng với tin nhắn người dùng, giữ trạng thái mở rộng và cập nhật nội dung khi tạo dạng stream, hiển thị lỗi khi thất bại, các kế hoạch chưa hoàn thành sẽ không được tiêm vào văn bản chính hoặc ghi vào lịch sử. Cài đặt kế hoạch dạng stream chỉ kiểm soát API độc lập, không ghi đè các tham số stream, model hay tham số lấy mẫu (sampling) của văn bản chính; trạng thái sau khi kế hoạch hoàn tất sẽ hiển thị cờ (flag) stream của yêu cầu văn bản chính. Việc bật cờ này không đảm bảo trạm trung chuyển (proxy) sẽ chuyển tiếp từng khối (chunk-by-chunk), vẫn cần kiểm tra hành vi đệm (buffer) thông qua chuỗi thời gian phản hồi mạng thực tế.

### 0.4.0-dev.10 Phạm vi Kế hoạch và Tạo lại

Hướng dẫn (prompt) kế hoạch yêu cầu xuất đầy đủ theo các bước và câu hỏi phụ đã được kích hoạt của preset hiện tại, không thêm mới phần tóm tắt, báo cáo kiểm tra hay tuyên bố kết thúc. Các câu ví dụ, đoạn viết trước, xác nhận định dạng và tính toán trạng thái do preset yêu cầu rõ ràng vẫn thuộc về kế hoạch; phần văn bản chính nằm ngoài kế hoạch và thành phẩm thanh trạng thái (status bar) sẽ không được xuất ở giai đoạn này. Các hướng dẫn mặc định cũ được tự động di chuyển (migrate), các hướng dẫn tùy chỉnh của người dùng được giữ nguyên; thẻ khối (block tags) tiếp tục tuân theo preset. Trình xác thực định dạng có thể chặn nội dung nằm ngoài thẻ và các trường hợp bị cắt đứt rõ ràng, nhưng không có nghĩa là nó đã tự động xác minh rằng tất cả các bước ngôn ngữ tự nhiên đều đã được trả lời.

Gửi tin nhắn, tạo lại (regenerate) và tạo swipe mới đều gọi lại API kế hoạch; chỉ khi chuyển đổi để xem các swipe đã có sẵn thì mới hiển thị kế hoạch tương ứng, không gửi yêu cầu bổ sung. Việc tạo swipe sẽ loại trừ phản hồi đang chờ thay thế rồi mới tính toán các macro lịch sử; việc tạo lại sử dụng lịch sử mà SillyTavern đã xóa phản hồi cũ, không xóa lặp lại. Việc tiêm ký ức của các plugin cũ vẫn đến từ các interface công khai của chúng, plugin này sẽ không tự ý khôi phục (rollback) trạng thái ký ức của các plugin khác.

### 0.4.0-dev.11 Workbench và Thao tác trong luồng

Scheme Preset/Worldbook hiển thị trống khi chưa được chọn, scheme đã chọn và công tắc độc lập hiện tại được lưu cùng với cài đặt, khôi phục sau khi làm mới. Sau khi sửa đổi sẽ giữ nguyên tên scheme, và hiển thị "Thay đổi chưa được lưu" (Unsaved changes) dưới thanh scheme; sau khi ghi đè sẽ hiển thị "Thay đổi đã được lưu" (Changes saved). Nguồn SillyTavern hiện tại chỉ có thể được tải hoặc lưu thành (save as) scheme mới, không thể ghi đè/xóa. Tự động đọc dữ liệu mới nhất khi tải, ghi đè và mở bảng điều khiển, loại bỏ nút làm mới thủ công.

Ở trên cùng từ trái sang phải là Dừng lượt này, Xem trước kế hoạch, Cài đặt, Giao diện (Appearance), Đóng. Xem trước kế hoạch được chuyển thành một trang riêng; bên phải tiêu đề luồng người dùng cũng có thể dừng các kế hoạch đang chờ hoặc đang tạo. Lắng nghe việc gửi tin nhắn, render luồng người dùng và chèn DOM luồng, để thẻ (card) không bị phụ thuộc vào chữ cái đầu tiên trả về từ API. Đã sử dụng API giả lập để xác minh 2 lượt liên tiếp: đầu vào mới nhất được đưa vào kế hoạch lượt thứ hai, kế hoạch mới liên kết với luồng người dùng mới nhất, bản ghi của lượt trước được giữ lại; nếu hủy trong quá trình stream thì sẽ không tiêm các kết quả một phần (partial results).

Các lệnh (instructions) tích hợp sử dụng các quy tắc chung để phân biệt giữa việc đọc/triệu hồi (recall) dữ liệu và tạo thành phẩm, không thêm ngoại lệ cho các cách diễn đạt như "không xuất thanh trạng thái" của các preset cụ thể; chỉ thực thi các bước do preset đã kích hoạt yêu cầu, không thêm lệnh triệu hồi bổ sung.

Biểu tượng sử dụng SVG riêng của plugin: Ghi đè là chỉnh sửa tài liệu, Xóa là thùng rác, Cài đặt là bánh răng. Bảng điều khiển chính và trong luồng chat sử dụng chung một cài đặt giao diện liên tục (persistent), mặt trời/mặt trăng/chiếc lá tương ứng tượng trưng cho ban ngày (light)/ban đêm (dark)/tự động (auto); nút giao diện trong luồng chat nằm ở bên trái nút dừng.

### 0.4.0-dev.12 Tương tác Biểu tượng

Trong quá trình tạo sẽ hiển thị hai thanh dọc kèm hiệu ứng chuyển động thở (breathing animation), khôi phục thành hình vuông sau khi dừng; nếu cài đặt ưu tiên giảm hiệu ứng động thì sẽ không phát hoạt ảnh. Nhấp lại vào nút con mắt để đóng xem trước, loại bỏ nút quay lại của trang xem trước. Bánh răng được vẽ lại, biểu tượng ghi đè và xóa của scheme đã lưu được tăng độ tương phản. Khi không chọn scheme nào, việc sửa đổi mục (entry) sẽ không tự động tạo mới, mà sẽ nhắc nhở sử dụng dấu + để lưu; chỉ các scheme tự tạo đã lưu mới có thể bị ghi đè hoặc xóa.

### 0.4.0-dev.13 Chẩn đoán Yêu cầu và Cách ly việc Hủy

Nút dừng kế hoạch và dừng văn bản chính được tách biệt: dừng ở giai đoạn chờ/đang tạo kế hoạch sẽ đồng thời hủy các yêu cầu văn bản chính chưa được gửi đi; sau khi kế hoạch hoàn tất, cổng dừng của plugin sẽ không dừng văn bản chính, văn bản chính sử dụng chức năng dừng gốc của SillyTavern. Khi thử lại ngay lập tức sau khi hủy hoặc chuyển đổi chat, các yêu cầu cũ đến muộn không được phép dừng lượt mới hoặc ghi đè lên kết quả của nó.

Trong luồng chat chỉ render kế hoạch tương ứng với tin nhắn người dùng mới nhất, các bản cập nhật stream được hợp nhất và gửi đi khoảng mỗi 60ms, các luồng lịch sử không còn tạo iframe nữa; các bản ghi extra của chat hiện tại không tự động bị xóa. Trang xem trước con mắt cung cấp "Kết quả tạo / Ngữ cảnh gửi đi", ngữ cảnh lấy các messages thực tế được gửi đến backend của SillyTavern, hiển thị theo vai trò và thứ tự ban đầu, đồng thời liệt kê nguồn, model, cài đặt stream và hạn mức đầu ra. Các trường header xác thực, key sẽ không đưa vào chẩn đoán; chỉ lưu giữ yêu cầu gần nhất trong bộ nhớ của trang, chuyển đổi chat sẽ xóa đi, không ghi vào chat hoặc xuất ra file. Backend của SillyTavern có thể tiếp tục chuyển đổi yêu cầu, đây không phải là nhật ký gói tin nhận được cuối cùng của nhà cung cấp.

Tệp đính kèm bao gồm media/file upload tương ứng với extra.media, extra.image, extra.files hoặc extra.file của tin nhắn lịch sử; nếu chưa kết nối với trình chuyển đổi tệp đính kèm gốc thì sẽ dừng một cách rõ ràng. Thanh trạng thái bên trong văn bản chính dạng văn bản thuần túy (plain text) có thể được đọc trực tiếp như văn bản lịch sử, không thuộc dạng tệp đính kèm.

### 0.4.0-dev.14 Vị trí Worldbook và Mẫu Biến

Hỗ trợ vị trí trước/sau Author's Note (Ghi chú tác giả) và trước/sau tin nhắn ví dụ, đèn xanh dương (luôn bật) và đèn xanh lá (từ khóa) tiếp tục đi qua các quy tắc quét gốc. Author's Note được tái tạo theo cài đặt chat ban đầu và ghi chú của nhân vật, tuân thủ khoảng cách (interval), vị trí, độ sâu (depth) và vai trò (role), tránh lẫn lộn với worldbook đã được tiêm ở giai đoạn văn bản chính; khi tắt Author's Note hoặc chưa đến lượt giãn cách, hai vị trí này sẽ không được tiêm vào. Worldbook ví dụ được phân tích cú pháp theo định dạng ví dụ của SillyTavern (Tên nhân vật: / Tên người dùng:) và theo sát các cờ ví dụ đã được kích hoạt.

Tự động đọc snapshot biến cần thiết cho các macro get/format_message/chat/character/preset/global_variable của trợ lý SillyTavern, hỗ trợ đường dẫn dấu chấm (dot path) và chỉ mục mảng/ngoặc kép đơn giản; đối tượng bị xóa các trường nội bộ $, format sử dụng YAML. Khi tạo lại swipe, sẽ tránh các biến của phản hồi đang chờ thay thế. Chỉ đọc biến, không gọi MVU parseMessage/replaceMvuData.

Cài đặt → Tương thích plugin: Thêm mới tính tương thích với EJS Template, mặc định tắt; sau khi bật, sẽ sử dụng interface công khai prepareContext/evalTemplate của ST-Prompt-Template đã cài đặt, render tin nhắn sau khi lắp ráp (assembly) và trước khi tính toán ngân sách (budget calculation). Script template chạy trong môi trường của plugin này, có thể sinh ra tác dụng phụ (side effects) của chính nó, không phải là sandbox chỉ đọc (read-only). Chưa tương thích với lệnh kích hoạt worldbook @@, các mục kích hoạt động của template và tất cả các macro của bên thứ ba; các lệnh kích hoạt không được hỗ trợ khi bị nhận diện sẽ báo lỗi rõ ràng. Không có mẫu thẻ MVU thực tế, bài kiểm tra giả lập interface của phiên bản này không có nghĩa là tất cả các thẻ biến đều đã được kiểm tra thực tế.

### 0.4.0-dev.15 Yêu cầu Viết dạng Tuyên ngôn

Prompt kế hoạch không còn giới hạn các bước ở dạng hỏi đáp: các hướng dẫn dạng tuyên ngôn, các mục bắt buộc/cấm, nhịp độ, độ dài, tỷ lệ và ràng buộc định dạng cũng phải được giữ lại dưới tiêu đề và số thứ tự của bước gốc, đồng thời giải thích cách thực hiện trong lượt này. Không được thay thế yêu cầu gốc bằng sắp xếp cốt truyện, hoặc chỉ dùng những xác nhận chung chung như "Đã rõ" (Acknowledged). Prompt văn bản chính nêu rõ rằng việc kế hoạch bỏ sót không làm mất đi các ràng buộc của preset gốc, cũng không thêm danh sách thực thi mới vào thành phẩm. Các prompt kế hoạch mặc định cũ tự động di chuyển, prompt tùy chỉnh được giữ nguyên.

Bản sửa lỗi này cải thiện phạm vi bao phủ lệnh (instruction coverage), không phải là trình xác thực tính toàn vẹn ngữ nghĩa (semantic integrity validator). Các bài kiểm tra tự động sẽ xác minh việc lắp ráp và di chuyển lệnh; việc model thực tế có thực thi đầy đủ hay không vẫn cần phải đối chiếu "Ngữ cảnh gửi đi" (Send Context) và văn bản được tạo ra.

### 0.4.0-dev.16 Giữ nguyên Hướng dẫn phi câu hỏi

Các hướng dẫn dạng câu hỏi bên trong khối kế hoạch được trả lời từng mục một, các hướng dẫn phi câu hỏi và ràng buộc được giữ lại nguyên văn từng chữ sau khi mở rộng macro, giữ nguyên tiêu đề, cấp độ, số thứ tự, từ phủ định, giá trị số và thẻ, không còn viết lại thành phương án thực hiện nữa. Các mục con hỗn hợp sẽ giữ lại hướng dẫn gốc và trả lời các câu hỏi trong đó; các nhiệm vụ yêu cầu liệt kê, tính toán, triệu hồi hoặc viết trước một cách rõ ràng vẫn sẽ được thực thi. Quy tắc không hard-code lệnh cấm thanh trạng thái, không sao chép toàn bộ preset hay mẫu thành phẩm (finished product templates) bên ngoài khối kế hoạch. Quy tắc này thuộc về prompt của model, chưa phải là tính năng tự động kiểm tra tính nhất quán từng chữ (verbatim consistency auto-check).

### 0.4.0-dev.17 Việc nhắc lại không bị giới hạn bởi nguồn macro

Nêu rõ rằng hướng dẫn dạng câu hỏi phải trả lời từng mục, hướng dẫn phi câu hỏi thì nhắc lại trực tiếp. Văn bản viết trực tiếp trong mục preset sẽ được sao chép nguyên văn; khi liên quan đến macro biến thì sử dụng văn bản thực tế sau khi mở rộng. Việc có nhắc lại hay không không liên quan đến việc có sử dụng macro hay không, không thêm lệnh cấm thanh trạng thái đặc thù của preset người dùng nào đó vào prompt tích hợp.

### 0.4.0-dev.18 Tách biệt Yêu cầu gốc và Sắp xếp lượt này

Hướng dẫn phi câu hỏi trước tiên phải nhắc lại nguyên văn từng chữ, sau đó tạo một dòng mới "Sắp xếp lượt này:" (This round's arrangement) trong cùng mục con đó để giải thích cách thực thi. Việc sắp xếp không được thay thế văn bản gốc, không được thay đổi đối tượng tác động, đơn vị, phạm vi, cường độ, điều kiện hoặc quan hệ phủ định của ràng buộc; định nghĩa cụ thể tuân theo preset đã kích hoạt, không bịa ra các giá trị cứng. Hướng dẫn dạng câu hỏi vẫn trả lời từng mục. Đây là ràng buộc bằng prompt, chưa thêm tính năng tự động kiểm tra tính nhất quán ngữ nghĩa.

### 0.4.0-dev.19 Kiểm tra Tham chiếu Thẻ

Khắc phục sự cố khi sử dụng backtick để trích dẫn toàn bộ thẻ bắt đầu/kết thúc bên trong kế hoạch bị đánh giá nhầm là ranh giới khối; giữ nguyên việc chặn các khối lặp lại thực sự, lồng nhau, văn bản chính nằm ngoài thẻ và bị cắt đứt. Việc xác nhận định dạng phải trả lời theo đối tượng được chỉ định trong preset gốc, không thể dùng định dạng gói kế hoạch của plugin để thay thế yêu cầu định dạng thành phẩm của văn bản chính. Bản sửa lỗi này không có nghĩa là đã xác minh ngữ nghĩa về tính toàn vẹn của nội dung kế hoạch hay việc nhắc lại nguyên văn.

### 0.4.0-dev.20 Trích xuất Khối Kế hoạch

Văn bản trả về được phép có nội dung nằm ngoài khối; sẽ trích xuất khối hoàn chỉnh, không trống, không lồng nhau đầu tiên tương ứng với thẻ của preset hiện tại, ngữ cảnh văn bản chính chỉ tiêm kế hoạch đó cùng thẻ đóng mở của nó, không tiêm phần mở đầu, phần kết, tự kiểm tra hoặc các khối tiếp theo. Trích dẫn thẻ bằng backtick chính xác sẽ không được coi là ranh giới. Việc thiếu đóng thẻ, khối trống, lồng nhau thực sự và bị cắt đứt do API báo length vẫn sẽ làm dừng quá trình; quy tắc này thay thế cho việc từ chối toàn bộ văn bản đầu ra ngoài thẻ ở phiên bản cũ. Prompt tạo (generation prompt) vẫn hướng dẫn chỉ xuất kế hoạch, nhưng việc tiêm vào không phụ thuộc vào việc model hoàn toàn tuân thủ giới hạn đầu ra này. Việc trích xuất không thể bù đắp lại các yêu cầu bị bỏ sót trong kế hoạch.

### 0.4.0-dev.21 Prompt Phân công Hợp tác

Giai đoạn kế hoạch và văn bản chính chuyển sang sử dụng giải thích bàn giao hợp tác (collaborative handover), thay thế prompt bắt buộc đầu ra (forced output) cũ. Các câu hỏi được trả lời từng mục; các hướng dẫn phi câu hỏi trước tiên nhắc lại nguyên văn, sau đó cung cấp riêng sắp xếp của lượt này, giữ nguyên đối tượng tác động, giá trị số, điều kiện và quan hệ phủ định. Văn bản chính tiếp tục sử dụng yêu cầu thành phẩm của preset gốc, kế hoạch không thay thế tài liệu gốc. Các lệnh (instructions) kế hoạch/văn bản chính mặc định ban đầu được tự động di chuyển, các giá trị tùy chỉnh được giữ nguyên. Hành vi trích xuất thẻ không thay đổi.

Hai trường mặc định trước khi thay thế và toàn bộ kết quả lắp ráp (assembly) được sao lưu tại [docs/prompt-backups/0.4.0-dev.20.json](docs/prompt-backups/0.4.0-dev.20.json), chỉ bao gồm các prompt tích hợp, không bao gồm nội dung chat của người dùng hay key. Các bài kiểm tra tự động xác minh việc di chuyển và lắp ráp, không có nghĩa là model đã hoàn thành việc xác minh hiệu quả tạo thực tế.

### 0.4.0-dev.22 Đơn giản hóa Hướng dẫn Kế hoạch

Loại bỏ các giải thích macro biến hướng tới model, trực tiếp yêu cầu trả lời từng mục câu hỏi, hướng dẫn phi câu hỏi trước tiên nhắc lại nguyên văn từng chữ, sau đó viết riêng sắp xếp của lượt này, sắp xếp không thể thay thế văn bản gốc. Logic xử lý macro không thay đổi. Toàn bộ prompt trước khi thay thế được sao lưu tại docs/prompt-backups/0.4.0-dev.21.json; lần này chỉ xác minh việc lắp ráp prompt, không xác minh xem tỷ lệ bỏ sót mục của model thực tế có được cải thiện hay không.

### 0.4.0-dev.23 Sáu Quy tắc Bàn giao

Phân tách việc trả lời câu hỏi và nhắc lại nguyên văn hướng dẫn phi câu hỏi theo văn bản do người dùng cung cấp, nhấn mạnh việc không sai một chữ, văn bản gốc và sắp xếp lượt này phải ngắt dòng (newline); giữ nguyên các bước điều kiện, triệu hồi dữ liệu, xác nhận định dạng và thẻ kế hoạch động. Đoạn mở đầu mặc định cũ tự động di chuyển, các giá trị tùy chỉnh được giữ nguyên, prompt văn bản chính và hành vi trích xuất không thay đổi. Prompt trước khi thay thế được sao lưu tại docs/prompt-backups/0.4.0-dev.22.json. Chưa tiến hành kiểm tra hiệu quả tạo model thực tế.

### 0.4.0-dev.24 Cài đặt Chỉnh sửa Prompt

Khả năng tương thích EJS Template được chuyển vào phần "Cú pháp Prompt" (Prompt Syntax) gập gọn theo mặc định. Cài đặt nâng cao bổ sung hai mục "Prompt tích hợp của plugin" và "Prompt tiêm vào ngữ cảnh văn bản chính", hiển thị trạng thái mặc định/đã tùy chỉnh, có thể mở chỉnh sửa toàn văn, hủy hoặc hoàn tất lưu; "Khôi phục mặc định" trước tiên sẽ thay thế bản nháp, sau khi hoàn tất mới có hiệu lực. Làm mới trang sẽ giữ nguyên văn bản đã lưu. Prompt văn bản chính và prompt kế hoạch được khôi phục độc lập, không có nút chèn macro.

Phạm vi chỉnh sửa bao phủ toàn bộ hướng dẫn (bao gồm cả sáu quy tắc kế hoạch), sau khi lưu sẽ không đính kèm thêm các quy tắc cũ nữa. Yêu cầu thẻ kế hoạch động và khối kế hoạch thực tế vẫn do plugin đính kèm, cửa sổ chỉnh sửa có giải thích rõ ràng. Đoạn mở đầu tùy chỉnh cũ cùng với hướng dẫn cố định gốc được di chuyển thành văn bản toàn văn có thể chỉnh sửa; văn bản toàn văn hiện có sẽ không bị ghi đè bởi quá trình di chuyển mặc định. Có thể lưu văn bản trống, nhưng yêu cầu thẻ/khối kế hoạch vẫn được giữ lại. Cài đặt sau khi lưu sẽ được sử dụng cho yêu cầu mới tiếp theo, không ghi đè lên quá trình tạo (generation) đã bắt đầu.

### 0.4.0-dev.25

- Cài đặt API bổ sung tham số đính kèm YAML (bao gồm body, loại trừ body, request header), sau khi chỉnh sửa sẽ được lưu cùng với việc tạo mới/ghi đè scheme API; bảo vệ các trường tin nhắn kế hoạch, model, stream, hạn mức đầu ra và xác thực (authentication).
- Cài đặt nâng cao thêm "Tự động tạo văn bản chính sau khi hoàn tất kế hoạch", mặc định bật. Sau khi tắt, cùng một lượt tạo sẽ chờ nhả (release) thủ công, bảng điều khiển và trong luồng chat đều có nút "Tạo phản hồi văn bản chính". Trong khi chờ sẽ không gọi API văn bản chính, cũng không tính vào thời gian timeout của kế hoạch; SillyTavern vẫn có thể hiển thị trạng thái đang tạo. Dừng hoặc chuyển đổi chat sẽ làm mất hiệu lực kế hoạch đang chờ, sau khi nội dung chat thay đổi sẽ từ chối sử dụng kế hoạch cũ. Trạng thái chờ không được lưu qua các lần làm mới (refresh) trang.
- Nút chuyển đổi xem trước nằm cùng hàng với tiêu đề, hiển thị dự kiến token đầu vào (ước tính, không phải kết quả tính phí của interface); việc nén các tin nhắn cùng loại chỉ hợp nhất văn bản liền kề, cùng vai trò và không có thuộc tính bổ sung trong bản xem trước, không làm thay đổi yêu cầu.
- Xóa các giải thích dư thừa, sắp xếp gọn gàng đầu ra tối đa, timeout và các tham số bổ sung, "Tạo kế hoạch dạng Stream" đổi tên thành "Kế hoạch đầu ra dạng Stream".

### 0.4.0-dev.26

- Góc dưới bên phải bảng điều khiển thêm tay cầm (handle) kéo để thu phóng, kích thước bị giới hạn trong viewport (khung nhìn), đóng trang này rồi mở lại vẫn giữ nguyên kích thước; sau khi làm mới sẽ khôi phục kích thước ban đầu. Hỗ trợ kéo bằng cảm ứng (touch drag) và điều chỉnh bằng phím điều hướng sau khi trỏ (focus) vào tay cầm.
- Nhấp vào vùng tối (mask) bên ngoài bảng điều khiển để đóng giao diện, không làm dừng kế hoạch hoặc văn bản chính; kéo thu phóng, nhấp vào bên trong bảng điều khiển sẽ không bị đóng nhầm.

### 0.4.0-dev.27

- Danh sách thả xuống của scheme API loại bỏ tiền tố "Trình chỉnh sửa · " của các scheme bên ngoài, hiển thị trực tiếp tên scheme gốc.

### 0.4.0-dev.28

- Prompt kế hoạch mặc định được thay thế bằng sáu yêu cầu bàn giao do người dùng xác nhận; các cài đặt khớp hoàn toàn với giá trị mặc định cũ sẽ tự động nâng cấp, nội dung tùy chỉnh được giữ nguyên. "Khôi phục mặc định" sẽ sử dụng phiên bản mới, prompt tiêm vào văn bản chính không thay đổi. Phiên bản cũ được lưu tại docs/prompt-backups/dev27-planner-guidance.txt.