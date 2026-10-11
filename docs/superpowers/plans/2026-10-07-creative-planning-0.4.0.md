# Kế hoạch Sáng tác 0.4.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thực hiện các scheme API, preset và worldbook độc lập theo 3 bản thiết kế giao diện của người dùng, cùng với việc hiển thị kế hoạch có thể gập lại bên trong luồng chat (in-chat).

**Architecture:** Host (máy chủ) chịu trách nhiệm đọc dữ liệu SillyTavern, tham chiếu key, liên kết yêu cầu và tin nhắn, iframe chỉ lo phần giao diện. Xây dựng yêu cầu kế hoạch dựa trên snapshot (bản chụp) nguồn đã bị đóng băng, sử dụng ghi đè preset riêng tư, trạng thái quét worldbook và môi trường macro; yêu cầu văn bản chính (body) giữ nguyên cấu hình gốc, chỉ thêm vào phần kế hoạch đã qua xác thực.

**Tech Stack:** JavaScript ES modules thuần (native), HTML/CSS, postMessage, Node test runner; SillyTavern 1.18.0; các script hồi quy (regression scripts) Playwright browser hiện có.

**Spec:** `docs/design/0.4.0-design.md` (Người dùng đã xác nhận; vui lòng đọc cùng với kế hoạch này trước khi triển khai).

## Global Constraints

- Tên plugin là "Kế hoạch Sáng tác" (Creative Planning), thiết lập namespace là `czgh_external_planner`, không đưa vào Jev hay các dependency runtime mới.
- Không được phép thực hiện việc lựa chọn độc lập bằng cách chuyển đổi tạm thời preset gốc, worldbook, API hiện tại hoặc key đang hoạt động (active key).
- Danh sách trắng (whitelist) 5 theme: `--SmartThemeBorderColor`, `--SmartThemeBlurTintColor`, `--SmartThemeBodyColor`, `--mainFontFamily`, `--monoFontFamily`.
- Các file chức năng nằm trong `src`, phần đầu của tất cả các file phải ghi rõ tác dụng; JS sử dụng import/export; code test chỉ đặt trong `tests`, không đi vào chuỗi load plugin.
- Bật worldbook có nghĩa là tham gia vào quá trình quét ngữ nghĩa gốc, không đồng nghĩa với việc gửi trực tiếp toàn bộ các mục. Các plugin tương thích chỉ đọc phần dữ liệu tiêm (inject) vào của chúng trong lượt này, không kích hoạt tạo (generation) bổ sung.
- Thẻ (tag) kế hoạch tuân theo preset kế hoạch; giữ nguyên các hành vi: dừng khi thất bại, hủy bỏ, tạo lại (regenerate) và tham chiếu key độc lập.
- Scheme không được ghi ngược lại (write back) vào trình chỉnh sửa cập nhật preset, preset gốc hay worldbook; việc hiển thị trong luồng chat không được sửa đổi `mes` của tin nhắn.
- Preset riêng tư, lịch sử chat và key sẽ không được commit. Quá trình phát triển chỉ xác minh trên CZGHCS, không cập nhật lên CZGH nếu chưa nhận được chỉ thị phát hành chính thức.

## Review Focus

1. Nguồn bị xóa/cập nhật sau khi mở bảng điều khiển (panel): Khớp theo ID ổn định, báo cáo các ghi đè (overrides) bị mất hiệu lực, không áp dụng nhầm cho các mục cùng tên (Task 1, 3).
2. Yêu cầu cũ trả về sau khi đã bị hủy, chuyển đổi chat trong lúc đang tạo: Vứt bỏ kết quả cũ, không tiêm hoặc liên kết vào chat mới (Task 5, 6).
3. Plugin chưa được đánh dấu (unchecked) nhưng vẫn bị macro tham chiếu: Không được vượt rào (bypass) công tắc hoặc sửa đổi các biến macro chia sẻ (Task 2).
4. Gắn (mount) worldbook lặp lại, đệ quy (recursive) và dính (sticky) xếp chồng: Loại bỏ trùng lặp (deduplicate) và chỉ cập nhật trạng thái riêng tư ở phía kế hoạch (Task 4).
5. Lưu API thất bại hoặc tin nhắn/văn bản model có chứa mã độc: Không làm mất scheme cũ, không làm lộ key, không thực thi HTML (Task 1, 6, 7).

## File và Data Contracts

Giữ nguyên entry point mỏng `index.js` và entry point host `src/host/index.js`. Các module mới thêm dưới đây mỗi cái sẽ đảm nhận một trách nhiệm riêng:

| File | Trách nhiệm |
| --- | --- |
| `src/planning/schemes.js` | 3 loại scheme cục bộ, di chuyển (migration), ghi đè ID ổn định |
| `src/host/sources.js` | Đọc snapshot nguồn và thông tin capability của SillyTavern 1.18.0 |
| `src/planning/compatibility.js` | Registry cho bộ điều hợp tiêm (injection adapter) của BaiBaiBook/GouHua |
| `src/planning/macros.js` | Cách ly môi trường macro và các phụ thuộc macro của plugin |
| `src/planning/presets.js` | Thứ tự thực thi preset, chia nhóm và công tắc cục bộ |
| `src/planning/world-info.js` | Trạng thái và quét worldbook riêng tư |
| `src/planning/context.js` | Lắp ráp các messages kế hoạch độc lập từ snapshot nguồn |
| `src/host/api-schemes.js` | Kết nối hiện tại/chỉ đọc bên ngoài/scheme riêng và lưu trữ key |
| `src/host/message-plans.js` | Liên kết render và tính bền vững (persistence) của kế hoạch cho mỗi tin nhắn, mỗi swipe |
| `src/ui/views.js`, `src/ui/components.js` | Bố cục 3 trang, chi tiết, bộ chọn (selector), control biểu tượng |
| `src/ui/message.html`, `src/ui/message.js`, `src/ui/message.css` | Hiển thị văn bản iframe độc lập trong luồng chat |

Sửa đổi `src/host/planner.js`, `src/planning/core.js`, `src/planning/profiles.js` để kết nối quy trình mới; sửa đổi `src/bridge/protocol.js` và 3 file UI hiện có để chứa lệnh và trạng thái giao diện. Tên các bài test được liệt kê trong từng Task.

Sử dụng JSDoc để ghi lại các type chia sẻ sau (định nghĩa đặt tại `schemes.js`/`sources.js`, tránh đưa vào bước biên dịch):
- `Message = {role:string, content:string|Array}`, giữ nguyên nội dung đa phương thức (multimodal) của lịch sử gốc.
- `Overrides = Record<string, boolean>`; Key của preset là identifier, key của worldbook là sự kết hợp không gây nhầm lẫn giữa tên sách và uid.
- `Scheme = {id,name,kind:'api'|'preset'|'world',payload,updatedAt}`; API payload chỉ chứa tham chiếu key, không chứa plaintext.
- `Selection = {presetId,promptOverrides,groupOverrides,bookOverrides,entryOverrides,extraBooks,compatibilityIds}`.
- `Snapshot = {id,chatId,character,history,userInput,presets,books,bindings,injections,macroEnvironment,capabilities}`; Host chuẩn hóa (normalize), deep copy và đóng băng (freeze), không chứa API key.
- `ScanResult = {entries,nextState,diagnostics}`; `ContextResult = {messages,sourceManifest,diagnostics,nextWorldState}`.
- `PlanRecord = {version:1,requestId,chatId,swipeId,text,openTag,closeTag,createdAt,bodyFingerprint}`.
- Yêu cầu RPC `{channel,type:'request',requestId,method,payload}`; Phản hồi `{channel,type:'response',requestId,ok,result?,error?}`. Xác minh same-origin và source được giữ nguyên; key chỉ được truyền một chiều trong yêu cầu lưu, gói trả về trạng thái chỉ chứa `hasKey`/tham chiếu.

## Task 1: Scheme Persistence và Cách ly API

**Files:** Tạo mới `src/planning/schemes.js`, `src/host/api-schemes.js`, `tests/schemes.test.js`, `tests/api-schemes.test.js`; sửa đổi `src/planning/profiles.js`, `src/planning/core.js`.

**Interfaces:** `migrateSchemes(settings)` trả về bản sao cài đặt sau khi di chuyển (migration); `applySchemeOperation(state,{kind,operation,id,name,payload})` trả về trạng thái mới. `createApiSchemes(host)` trả về `list()`, `save({id?,name,config,key?})`, `remove(id)`, `resolve(selection)`, `models(config)`; Tiêm toàn bộ host I/O, resolve trả về cấu hình yêu cầu, tuyệt đối không ghi vào kết nối hoạt động toàn cục.

- [ ] Viết test: Di chuyển cấu hình thủ công cũ; scheme bên ngoài ném lỗi khi ghi đè/xóa; CRUD cục bộ không làm thay đổi đối tượng đầu vào; trạng thái cũ giữ nguyên sau khi lưu thất bại; không có key plaintext trong cài đặt thông thường; mất tham chiếu phải có lỗi rõ ràng.
- [ ] Chạy `node --test tests/schemes.test.js tests/api-schemes.test.js`, xác nhận việc thiếu implementation sẽ dẫn đến thất bại.
- [ ] Đối chiếu các secrets của phiên bản cố định với đường dẫn yêu cầu kết nối hiện tại, ghi chép lại nguồn/giấy phép/capability tại `docs/design/0.4.0-compatibility.md`; triển khai các interface nói trên. Key mới bắt buộc phải chứng minh được là có thể lưu trữ ở trạng thái không hoạt động (inactive); nếu không có capability này, hãy dừng đường dẫn lưu đó và báo cáo hạn chế, không dùng cách chuyển đổi rồi khôi phục lại.
- [ ] Chạy lại 2 bài test này và `tests/profiles.test.js`, kỳ vọng tất cả đều pass, secret đang hoạt động gốc và profiles bên ngoài khi deep compare không đổi.
- [ ] Chỉ stage source code, code test và nhật ký tương thích của task này, commit `feat: isolate creative planning schemes and API profiles`.

## Task 2: Source Snapshot, Tương thích Plugin và Cách ly Macro

**Files:** Tạo mới `src/host/sources.js`, `src/planning/compatibility.js`, `src/planning/macros.js`, `tests/sources.test.js`, `tests/macros.test.js`; cập nhật nhật ký tương thích.

**Interfaces:** `captureSources(host,{signal}) -> Promise<Snapshot>`; `selectInjections(snapshot,compatibilityIds) -> {items,diagnostics}`; `expandMacros(text,{snapshot,compatibilityIds,variables}) -> {text,variables,diagnostics}`. `variables` là bản sao riêng tư; các macro không thể mở rộng an toàn sẽ trả về chẩn đoán chặn (blocking diagnostic).

- [ ] Viết test: Bản sao đóng băng tách biệt với tham chiếu host; loại bỏ trùng lặp 5 loại slot đã biết của BaiBaiBook; GouHua chỉ nhận các slot thực tế đã được tiêm; dữ liệu chưa đánh dấu không lọt vào kết quả; macro của plugin chưa đánh dấu không được bypass bộ lọc; việc ghi biến sẽ không ảnh hưởng đến host.
- [ ] Chạy `node --test tests/sources.test.js tests/macros.test.js`, kỳ vọng thất bại trước.
- [ ] Đối chiếu trình tự lắp ráp nguồn của 1.18.0 và mã nguồn của hai plugin để kiểm tra tập hợp slot/macro hoàn chỉnh, triển khai interface và registry. Không thể khôi phục nguồn bằng cách xóa nội dung từ chuỗi cuối cùng đã bị trộn lẫn; không gọi các method tạo của plugin. Ghi lại các macro không được hỗ trợ và nguyên nhân gây chặn.
- [ ] Chạy lại test, xác minh việc giữ nguyên nội dung, role, position, depth, cũng như việc hủy bỏ sẽ ngắt quá trình đọc snapshot.
- [ ] Commit `feat: capture isolated sources and compatible plugin injections`.

## Task 3: Lựa chọn Preset Độc lập và Chia nhóm BaiBaiBook

**Files:** Tạo mới `src/planning/presets.js`, `tests/presets.test.js`.

**Interfaces:** `resolvePreset(snapshot,selection) -> {execution,groups,diagnostics}`; `execution` giữ nguyên thứ tự, marker và ngữ nghĩa vị trí của prompt_order; `groups` là phép chiếu UI, không quyết định ngược lại thứ tự thực thi.

- [ ] Viết test: Khi mảng prompts bị xáo trộn thì việc thực thi vẫn theo prompt_order; đọc `extensions.baibaiToolkit.presetPromptGroups`; kết hợp chính xác giữa vô hiệu hóa nhóm và ghi đè mục; không làm mất các mục không thuộc nhóm; ID bị xóa/tạo lại không bị áp dụng ghi đè cùng tên; đối tượng preset gốc không thay đổi.
- [ ] Chạy `node --test tests/presets.test.js`, kỳ vọng thất bại trước.
- [ ] Triển khai `resolvePreset`, phân biệt thứ tự nhóm trực quan và thứ tự thực thi, trả về văn bản chính chỉ đọc của mục và trạng thái chọn tất cả/chọn một phần của nhóm; sử dụng bộ lưu trữ scheme cục bộ của Task 1.
- [ ] Chạy lại test, kỳ vọng tất cả đều pass.
- [ ] Commit `feat: add independent preset switches and native groups`.

## Task 4: Quét Riêng tư của Worldbook

**Files:** Tạo mới `src/planning/world-info.js`, `tests/world-info.test.js`, `tests/fixtures/world-info-cases.js`; cập nhật nhật ký tương thích.

**Interfaces:** `scanWorldInfo({snapshot,selection,previousState,tokenize,random,now}) -> Promise<ScanResult>`; Tiêm phép tính token bên ngoài, nguồn ngẫu nhiên và thời gian có thể xác định được; `nextState` chỉ dùng cho trạng thái phía kế hoạch của chat hiện tại.

- [ ] Viết các test case cho luôn bật (constant), từ khóa chính/phụ / logic lựa chọn, không trúng (miss), đệ quy, ranh giới xác suất, độ sâu/vị trí, ngân sách, thời gian hồi/độ dính; thêm assertion (xác nhận) cho việc loại bỏ trùng lặp khi gắn cùng một sách từ nhiều nguồn và ghi đè công tắc cục bộ.
- [ ] Chạy `node --test tests/world-info.test.js`, kỳ vọng thất bại trước.
- [ ] Đối chiếu với implementation quét của 1.18.0, ưu tiên trích xuất các logic thuần có thể cách ly, ghi lại trạng thái/giấy phép cần thiết và các khác biệt về hành vi; triển khai interface, không sửa đổi trường disable của sách gốc hay trạng thái tính thời gian gốc. Các trường không thể hỗ trợ tương đương bắt buộc phải chặn quá trình tạo bị ảnh hưởng và nhắc nhở cụ thể, không được im lặng bỏ qua.
- [ ] Chạy các test case xác định (deterministic), và đối chiếu với kết quả quét gốc trong host tương thích; xác minh planning `nextState` thay đổi nhưng native state khi deep compare không đổi.
- [ ] Commit `feat: scan selected world books with private state`.

## Task 5: Kết nối Vòng đời Yêu cầu Kế hoạch Hoàn chỉnh

**Files:** Tạo mới `src/planning/context.js`, `tests/context.test.js`; sửa đổi `src/host/planner.js`, `src/planning/core.js`, `tests/runtime.test.js`.

**Interfaces:** `buildPlanningContext({snapshot,selection,worldState,tokenize,random,now}) -> Promise<ContextResult>`; planner thêm callback `onPlanReady(record)`, giao kết quả đã được xác minh cho Task 6; tạo xác minh kết hợp giữa `requestId` và `chatId` để lọc các kết quả quá hạn.

- [ ] Viết test để bắt (capture) các yêu cầu độc lập: Chỉ những preset/sách/plugin được chọn mới lọt vào kế hoạch; giữ nguyên vai trò, đầu vào của người dùng, lịch sử và đa phương thức; yêu cầu gốc của văn bản chính giữ nguyên tiền tố (prefix), chỉ nối thêm phần kế hoạch và hướng dẫn; thẻ (tag) lấy từ preset kế hoạch; hủy bỏ/chuyển đổi chat/phản hồi đến muộn sẽ không kích hoạt onPlanReady.
- [ ] Chạy `node --test tests/context.test.js tests/runtime.test.js`, kỳ vọng các test case mới thêm vào sẽ thất bại.
- [ ] Sử dụng Task 2-4 để lắp ráp message, xử lý marker và dữ liệu theo vai trò/vị trí/độ sâu; gọi API resolve của Task 1. Chẩn đoán chặn sẽ được hiển thị trước khi gửi yêu cầu mạng và làm dừng việc tạo văn bản chính; sau khi kế hoạch thành công thì submit trạng thái quét riêng tư, thất bại thì không ghi.
- [ ] Chạy các test trên cùng `tests/core.test.js`, kỳ vọng pass; kiểm tra xem các lượt tiếp tục/quiet/tool có còn tuân thủ chiến lược lọc đã có hay không.
- [ ] Commit `feat: build planning requests from independent source selections`.

## Task 6: Hiển thị Kế hoạch cho Mỗi Luồng, Mỗi Swipe

**Files:** Tạo mới `src/host/message-plans.js`, `src/ui/message.html`, `src/ui/message.js`, `src/ui/message.css`, `tests/message-plans.test.js`; sửa đổi entry point host.

**Interfaces:** `createMessagePlans(host)` trả về `stage(record)`, `bind({requestId,messageId,swipeId})`, `render()`, `discard(requestId)`, `dispose()`; lưu vào `message.extra.czghCreativePlanning`, bên trong lưu PlanRecord theo swipe.

- [ ] Viết test: Chỉ văn bản chính thành công mới liên kết; thất bại/hủy bỏ sẽ không hiển thị kế hoạch của lần trước; chuyển đổi swipe và làm mới sẽ khôi phục bản ghi tương ứng; sau khi chỉnh sửa, nếu bodyFingerprint không khớp thì đánh dấu là lịch sử; sau khi tắt hiển thị thì dữ liệu vẫn còn; mes và lịch sử tạo sau đó không đổi.
- [ ] Chạy `node --test tests/message-plans.test.js`, kỳ vọng thất bại trước.
- [ ] Đối chiếu các sự kiện hoàn thành/vuốt (swipe)/chỉnh sửa thực tế, sau đó triển khai liên kết, tính bền vững (persistence) và dọn dẹp khi unmount; iframe dùng text node để hiển thị kế hoạch, mặc định gập, đồng bộ 5 theme; không chèn văn bản model vào srcdoc hoặc innerHTML.
- [ ] Chạy lại test và thêm assertion văn bản thuộc tính sự kiện/`<script>`, kỳ vọng chỉ hiển thị chữ.
- [ ] Commit `feat: render persistent planning panels per message swipe`.

## Task 7: Giao diện 3 trang, Tương tác và RPC

**Files:** Tạo mới `src/ui/views.js`, `src/ui/components.js`, `tests/bridge.test.js`; sửa đổi 3 file UI hiện có, entry point host, giao thức giao tiếp, `tests/browser-check.mjs`, `tests/isolation.test.js`.

**Interfaces:** Danh sách trắng cho RPC method là `state.read`, `settings.update`, `api.save`, `api.remove`, `api.models`, `scheme.save`, `scheme.remove`, `selection.update`, `sources.refresh`, `planner.cancel`, `ui.close`. payload được xác minh từng mục một trên host; UI không đọc trực tiếp parent DOM hoặc gọi ST.

- [ ] Thêm test thất bại: Từ chối nguồn giả mạo/phương thức không xác định; key không xuất hiện trong state.read; nút biểu tượng có thể thao tác bằng bàn phím; chuyển đổi 3 trang, chi tiết mục, tìm kiếm để thêm worldbook, đặt tên scheme và xác nhận xóa có thể hoạt động được; scheme bên ngoài không thể bị ghi đè hay xóa.
- [ ] Chạy `node --test tests/bridge.test.js tests/isolation.test.js` cùng script trình duyệt, xác nhận các assertion mới thêm sẽ thất bại trước.
- [ ] Triển khai các thẻ màu xanh nhạt nhỏ gọn, nút quay lại trong cài đặt, tab preset/worldbook, và công tắc sáng/tối độc lập theo p1/p2/p3; tương thích với checkbox chia thành 2 loại: ký ức/cốt truyện; hiển thị rõ ràng 3 loại worldbook và nguồn dành riêng cho chat; các control được kết nối vào Task 1-6, giữ nguyên trạng thái tạo/cổng hủy hiện có.
- [ ] Trình duyệt kiểm tra màn hình rộng và màn hình hẹp 390px, chụp ảnh màn hình rồi xem thực tế; xác minh việc cách ly hai chiều với CSS host độc hại, whitelist theme, văn bản chi tiết dài, trạng thái tải thất bại/dữ liệu trống/xóa scheme và iframe trong luồng chat.
- [ ] Commit `feat: redesign creative planning interface and controls`.

## Task 8: Nghiệm thu Tích hợp và Chuyển giao Kho lưu trữ Test

**Files:** Sửa đổi `README.md`, `tests/README.md`, `manifest.json`, `package.json`; Bổ sung các lỗ hổng (gap) thực tế trong `tests/runtime.test.js`, `tests/browser-check.mjs`; cập nhật nhật ký tương thích.

**Interfaces:** Entry point cài đặt không đổi; manifest và package đồng bộ phiên bản `0.4.0`; di chuyển vẫn giữ nguyên `czgh_external_planner`.

- [ ] Đối chiếu với thiết kế đã xác nhận để ghi lại kết quả nghiệm thu (acceptance) từng mục; nếu phát hiện lỗ hổng tích hợp, trước tiên hãy thêm test case hồi quy thất bại tương ứng, sau đó mới sửa implementation.
- [ ] Chạy `npm test`, `npm run check` trong kho lưu trữ; mở rộng phạm vi check ra toàn bộ JS trong `src`, yêu cầu tất cả đều pass.
- [ ] Đặt `PLAYWRIGHT_MODULE_PATH` trỏ đến gói playwright đã có trên máy cục bộ, `BROWSER_EXECUTABLE` là Edge rồi chạy `node tests/browser-check.mjs`; xác minh ảnh chụp màn hình và tương tác, yêu cầu pass.
- [ ] So sánh các yêu cầu kế hoạch/văn bản chính thực tế trong môi trường SillyTavern 1.18.0 có sẵn, kiểm tra xem kết nối hoạt động, key, công tắc preset/worldbook trước và sau có bị thay đổi không; khi không có môi trường thiết bị thực thì liệt kê rõ là chưa xác minh, không dùng mock test để thay thế kết luận trên thiết bị thực.
- [ ] Hoàn thành code review độc lập và sửa các vấn đề gây chặn; cập nhật tính năng trong README, cách nâng cấp, giới hạn capability rõ ràng và bằng chứng test, sau khi đồng bộ phiên bản thì commit.
- [ ] Kiểm tra diff, workspace và dữ liệu nhạy cảm; chỉ push các commit đã xác minh lên CZGHCS, báo cáo số commit và các điểm cần test trên thiết bị thực, giữ nguyên CZGH không thay đổi.

## Nhật ký Tự kiểm tra

Đã bao phủ phần hình ảnh 3 trang, 3 loại scheme, checkbox plugin và đường dẫn macro, ngữ nghĩa kích hoạt worldbook gốc, chia nhóm BaiBaiBook, hiển thị độc lập trong luồng chat và không làm ô nhiễm văn bản chính. 5 điểm Review Focus đều tương ứng với các task test; các interface phụ thuộc theo thứ tự snapshot → lựa chọn → quét/phân tích cú pháp → yêu cầu → liên kết tin nhắn. File này là kế hoạch triển khai, chưa đại diện cho việc bản 0.4.0 đã được triển khai hay test pass.