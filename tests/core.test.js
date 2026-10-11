import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { defaults, resolvePlanningTags, migrateSettings, extractPlan, planningMessages, writingMessages, eligibleRequest, unresolvedBaiBaiMacros, validateSettings } from '../src/planning/core.js';

const config = { ...defaults, openTag: '<Abstract>', closeTag: '</Abstract>', apiUrl: 'https://example.org/v1', model: 'planner' };

test('collaborative defaults migrate both previous instructions without overriding custom text',()=>{
    const backup=JSON.parse(readFileSync(new URL('../docs/prompt-backups/0.4.0-dev.20.json',import.meta.url),'utf8'));
    assert.ok(backup.planningMessage.includes(backup.plannerInstruction));
    assert.ok(backup.writingMessage.includes(backup.writerInstruction));
    const updated=migrateSettings({plannerInstruction:backup.plannerInstruction,writerInstruction:backup.writerInstruction});
    assert.equal(updated.plannerInstruction,defaults.plannerInstruction);
    assert.equal(updated.writerInstruction,defaults.writerInstruction);
    assert.match(updated.plannerInstruction,/Viết hợp tác theo từng giai đoạn/);
    assert.match(updated.writerInstruction,/Đồng nghiệp kế hoạch/);
    const custom=migrateSettings({plannerInstruction:'Kế hoạch của tôi',writerInstruction:'Văn bản chính của tôi'});
    assert.equal(custom.plannerInstruction,'Kế hoạch của tôi');assert.equal(custom.writerInstruction,'Văn bản chính của tôi');
    const message=planningMessages([],{...config,...updated}).at(-1).content;
    assert.doesNotMatch(message,/Kết quả chỉ được chứa duy nhất một khối hoàn chỉnh|Kết thúc ngay sau tag đóng/);
    assert.match(message,/Sắp xếp lượt này:/);
});

test('auto tags follow each request, preserve case and ignore unrelated content/history', () => {
    for (const tag of ['Abstract', 'Think', 'think', 'Kế hoạch Sáng tác', 'ScenePlan']) {
        const messages = [{ role: 'system', content: `Thứ tự tạo: <${tag}>→Chuẩn bị viết→</${tag}>→<content>Văn bản chính</content>→<status>Thanh trạng thái</status>` },
            { role: 'assistant', content: '<Old>Chuỗi suy nghĩ</Old>' }, { role: 'user', content: 'Kế hoạch sử dụng tag <Fake>' }];
        assert.deepEqual(resolvePlanningTags(messages, defaults), { openTag: `<${tag}>`, closeTag: `</${tag}>` });
    }
});
test('explicit start on next line and split closing directives are recognized', () => {
    assert.deepEqual(resolvePlanningTags([{ role: 'system', content: 'Bây giờ bắt đầu suy nghĩ, viết ra tag suy nghĩ:\n<Think>\nNội dung' }], defaults), { openTag: '<Think>', closeTag: '</Think>' });
    assert.equal(resolvePlanningTags([{ role: 'system', content: 'Sau khi xác nhận định dạng trả lời xong thì đóng </Abstract> hiện tại, ngay sau đó xuất ra <content> văn bản chính.' }, { role: 'system', content: '<Abstract>Chuẩn bị viết</Abstract>' }], defaults).openTag, '<Abstract>');
});
test('ambiguous, missing and forbidden tags stop; manual override is explicit', () => {
    for (const content of ['<Think>Kế hoạch</Think>\n<Abstract>Chuẩn bị viết</Abstract>', 'Văn bản chính sử dụng <content>kế hoạch</content>', 'Cấm sử dụng tag chuỗi suy nghĩ <Old>.', 'Không có tag kế hoạch']) {
        assert.throws(() => resolvePlanningTags([{ role: 'system', content }], defaults));
    }
    assert.deepEqual(resolvePlanningTags([], { ...defaults, tagMode: 'manual', openTag: '[P]', closeTag: '[/P]' }), { openTag: '[P]', closeTag: '[/P]' });
});
test('upgrade migrates old default to auto and preserves user custom tags', () => {
    assert.equal(migrateSettings({ openTag: '<Abstract>', closeTag: '</Abstract>' }).tagMode, 'auto');
    assert.equal(migrateSettings({ openTag: '<Custom>', closeTag: '</Custom>' }).tagMode, 'manual');
    assert.equal(migrateSettings({ tagMode: 'manual', openTag: '<Abstract>', closeTag: '</Abstract>' }).tagMode, 'manual');
});
test('both stages preserve expanded memory, worldbook, history and multimodal input without mutation', () => {
    const original = [{ role: 'system', content: 'Worldbook\nKý ức BaiBaiBook: Đã mở rộng' }, { role: 'user', content: [{ type: 'text', text: 'Đầu vào của người dùng lượt này' }, { type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } }] }];
    const snapshot = structuredClone(original);
    const planner = planningMessages(original, config);
    const writer = writingMessages(original, 'Sắp xếp lượt này', config);
    assert.deepEqual(planner.slice(0, -1), snapshot);
    assert.deepEqual(writer.slice(0, -1), snapshot);
    planner[0].content = 'changed';
    assert.deepEqual(original, snapshot);
    assert.match(writer.at(-1).content, /Văn bản chính và các thành phẩm khác do Preset yêu cầu/);
    assert.match(writer.at(-1).content, /Các thành phẩm do Preset gốc yêu cầu tạo vẫn tạo như bình thường/);
});
test('exact adapter edits instructions but never history/user input', () => {
    const messages = ['system', 'developer', 'user', 'assistant'].map(role => ({ role, content: 'Xuất ra kế hoạch trước; sau đó tạo thanh trạng thái' }));
    const out = writingMessages(messages, 'Kế hoạch', { ...config, rules: JSON.stringify([{ find: 'Xuất ra kế hoạch trước', replace: 'Kế hoạch đã hoàn thành' }]) });
    assert.match(out[0].content, /Kế hoạch đã hoàn thành; sau đó tạo thanh trạng thái/);
    assert.match(out[1].content, /Kế hoạch đã hoàn thành/);
    assert.equal(out[2].content, messages[2].content);
    assert.equal(out[3].content, messages[3].content);
});
test('custom delimiters work without regex assumptions', () => {
    assert.equal(extractPlan(' [plan+]Nội dung[/plan+] ', { ...config, openTag: '[plan+]', closeTag: '[/plan+]' }, 'stop'), 'Nội dung');
});
test('incomplete, nested, empty or truncated plans cannot be injected', () => {
    for (const text of ['', '<Abstract>x', '<Abstract></Abstract>', '<Abstract>x<Abstract>y</Abstract>']) {
        assert.throws(() => extractPlan(text, config, 'stop'));
    }
    assert.throws(() => extractPlan('<Abstract>Giao diện hoàn chỉnh</Abstract>', config, 'length'));
});
test('quiet, impersonation, continuation and tool rounds never invoke planner', () => {
    const messages = [{ role: 'user', content: 'test' }];
    for (const type of ['quiet', 'impersonate', 'continue']) assert.equal(eligibleRequest({ type, messages }), false);
    for (const type of [undefined, 'normal', 'regenerate', 'swipe']) assert.equal(eligibleRequest({ type, messages }), true);
    assert.equal(eligibleRequest({ messages: [{ role: 'tool', content: 'x' }] }), false);
});
test('detect unresolved BaiBai macros including parameterized form', () => {
    for (const content of ['{{bbsVars}}', '{{bbsSnapshot::42::after}}']) assert.equal(unresolvedBaiBaiMacros([{ content }]), true);
    assert.equal(unresolvedBaiBaiMacros([{ content: 'Ký ức BaiBaiBook đã mở rộng' }]), false);
});
test('invalid settings fail before a request', () => {
    validateSettings(config);
    for (const change of [{ apiUrl: 'file:///tmp/a' }, { apiUrl: 'https://key:secret@example.org' }, { maxTokens: -1 }, { rules: '[{"find":"","replace":""}]' }, { openTag: '</Abstract>' }]) {
        assert.throws(() => validateSettings({ ...config, ...change }));
    }
});


test('preset planning contract migrates previous defaults but preserves custom instructions',()=>{
    const old='Hoàn thành Kế hoạch Sáng tác công khai lượt này theo từng mục dựa trên các câu hỏi chuẩn bị viết đã được bật của Preset hiện tại. Giữ nguyên chủ đề, số thứ tự, căn cứ cụ thể và yêu cầu sáng tác; phân biệt rõ sự thật đã xảy ra và sắp xếp viết lượt này. Chỉ xuất ra kế hoạch, không tạo văn bản chính, thanh trạng thái, dấu thời gian hoặc các thành phẩm bổ sung khác.';
    assert.notEqual(migrateSettings({plannerInstruction:old}).plannerInstruction,old);
    assert.equal(migrateSettings({plannerInstruction:'Yêu cầu bổ sung của tôi'}).plannerInstruction,'Yêu cầu bổ sung của tôi');
    const message=planningMessages([],{...config,plannerInstruction:'Yêu cầu bổ sung của tôi'}).at(-1).content;
    assert.match(message,/Không thêm những gì không được yêu cầu/);
    assert.match(message,/Mỗi nhiệm vụ thu hồi, đọc, kiểm tra và hạch toán/);
    assert.doesNotMatch(message,/Không xuất ra văn bản chính, thanh trên, thanh trạng thái nằm ngoài khối kế hoạch/);
    assert.match(message,/Viết ra kết quả cụ thể hoặc sắp xếp xử lý lượt này/);
    assert.match(message,/Các bước kế hoạch và các bước trong đầu ra phải tương ứng một-một/);
    assert.match(message,/<Abstract>/);
});

test('declarative planning requirements migrate and remain binding on the writer',()=>{
    const previous='Hoàn thành toàn bộ nội dung chuẩn bị viết trong tag kế hoạch được chỉ định theo các mục đã bật của Preset hiện tại, giữ nguyên thứ tự, tiêu đề, số thứ tự và câu hỏi phụ ban đầu, phân biệt rõ sự thật đã xảy ra và sắp xếp viết lượt này.';
    const migrated=migrateSettings({plannerInstruction:previous});
    assert.match(migrated.plannerInstruction,/Viết hợp tác theo từng giai đoạn/);
    const source=[{role:'system',content:'## Hướng dẫn viết\nGiữ góc nhìn hạn chế\n## Tốc độ tiến triển\n1. Tiến triển chậm\n2. Đoạn văn ngắn\n3. Hội thoại chiếm ba phần mười\n4. Tránh lặp lại những gì?'}];
    const original=structuredClone(source);
    const plan=planningMessages(source,{...config,...migrated}).at(-1).content;
    assert.match(plan,/Các bước kế hoạch mang tính hướng dẫn dạng câu hỏi cần được trả lời từng mục/);
    assert.match(plan,/Tiêu đề, cấp độ và số thứ tự ban đầu/);
    assert.match(plan,/Viết ra nguyên văn của hướng dẫn mang tính trần thuật đó mà không sai một chữ/);
    assert.match(plan,/1\. Các bước kế hoạch mang tính hướng dẫn dạng câu hỏi cần được trả lời từng mục;\n2\. Hướng dẫn các bước mang tính trần thuật không phải dạng câu hỏi/);
    assert.doesNotMatch(plan,/Macro biến|Placeholder của macro|Có sử dụng macro hay không|Sau khi mở rộng/);
    assert.doesNotMatch(plan,/Không xuất ra thanh trạng thái/);
    assert.match(plan,/Sau đó xuống dòng để trả lời hướng dẫn dạng câu hỏi/);
    assert.match(plan,/Không tóm tắt, không viết lại, không thay thế bằng giải thích thực thi/);
    assert.match(plan,/Sắp xếp lượt này:/);
    assert.match(plan,/Nguyên văn hướng dẫn mang tính trần thuật và sắp xếp phải được tách biệt, sắp xếp không thể thay thế nguyên văn hướng dẫn mang tính trần thuật/);
    assert.match(plan,/Đối tượng tác động, đơn vị, phạm vi, cường độ, điều kiện và quan hệ phủ định/);
    assert.doesNotMatch(plan,/Không tự ý bổ sung phương án thực thi/);
    assert.match(plan,/Sắp xếp không thể thay thế nguyên văn hướng dẫn mang tính trần thuật/);
    const writer=writingMessages(source,'Sắp xếp lượt này',{...config,writerInstruction:'Yêu cầu văn bản chính tùy chỉnh'});
    assert.match(writer.at(-1).content,/Kế hoạch không nhắc lại một yêu cầu nào đó không có nghĩa là yêu cầu đó mất hiệu lực/);
    assert.match(writer.at(-1).content,/Yêu cầu văn bản chính tùy chỉnh/);
    assert.deepEqual(source,original);
});


test('quoted delimiter references inside a plan do not close its outer block',()=>{
    const settings={...config,openTag:'<Think>',closeTag:'</Think>'};
    const content='Trích dẫn định dạng: `<Think>` và `</Think>`.\nNội dung tiếp theo';
    assert.equal(extractPlan('<Think>\n'+content+'\n</Think>',settings,'stop'),content);
    for(const text of ['`<Think>`x`</Think>`','<Think>x<Think>y</Think>'])assert.throws(()=>extractPlan(text,settings,'stop'));
    const custom={...config,openTag:'[plan+]',closeTag:'[/plan+]'};
    assert.equal(extractPlan('[plan+]Trích dẫn `[/plan+]`[/plan+]',custom,'stop'),'Trích dẫn `[/plan+]`');
    assert.match(planningMessages([],settings).at(-1).content,/Không sử dụng tag vòng ngoài kế hoạch của plugin này/);
});


test('extract first complete planning block and exclude all surrounding output from writer context',()=>{
    const settings={...config,openTag:'<Think>',closeTag:'</Think>'};
    const raw='Lời nói đầu\n<Think>\nYêu cầu nguyên văn\nTrích dẫn `</Think>`\nSắp xếp lượt này\n</Think>\nTự kiểm tra tiếng Anh output_reply\n<Think>Đoạn khác</Think>';
    const plan=extractPlan(raw,settings,'stop');
    assert.equal(plan,'Yêu cầu nguyên văn\nTrích dẫn `</Think>`\nSắp xếp lượt này');
    const injected=writingMessages([{role:'user',content:'Đầu vào lượt này'}],plan,settings).at(-1).content;
    assert.ok(injected.endsWith('<Think>\n'+plan+'\n</Think>'));
    assert.doesNotMatch(injected,/Lời nói đầu|Tự kiểm tra tiếng Anh|output_reply|Đoạn khác/);
    assert.equal(extractPlan('Lời nói đầu[plan+]Nội dung[/plan+]Đoạn vĩ thanh',{...settings,openTag:'[plan+]',closeTag:'[/plan+]'},'stop'),'Nội dung');
    assert.throws(()=>extractPlan('<Think>Nội dung</Think>Đoạn vĩ thanh',settings,'length'));
});


test('dev22 planning default upgrades to the approved six-part handoff',()=>{
    const backup=JSON.parse(readFileSync(new URL('../docs/prompt-backups/0.4.0-dev.22.json',import.meta.url),'utf8'));
    const updated=migrateSettings({plannerInstruction:backup.plannerInstruction});
    assert.match(updated.plannerInstruction,/Chuẩn bị viết và Kế hoạch Sáng tác/);
    assert.equal(updated.plannerInstruction,defaults.plannerInstruction);
    const message=planningMessages([],{...updated,openTag:'<ScenePlan>',closeTag:'</ScenePlan>'}).at(-1).content;
    assert.match(message,/6\. Nội dung bàn giao/);
    assert.ok(message.endsWith('<ScenePlan>Nội dung kế hoạch</ScenePlan>.'));
});