/* Nhận diện thẻ kế hoạch, xây dựng prompt, kiểm tra kết quả và di chuyển cấu hình. */
export const defaults = Object.freeze({
    autoReply: true,
    enabled: false,
    stream: false,
    templateCompat: false,
    apiUrl: '',
    model: '',
    profileId: '',
    maxTokens: 6000,
    timeoutSeconds: 180,
    tagMode: 'auto',
    openTag: '',
    closeTag: '',
    rules: '[]',
    plannerInstruction: 'Bạn đang tham gia vào một quá trình hợp tác viết theo từng giai đoạn. Lượt này do bạn hoàn thành phần chuẩn bị viết và kế hoạch sáng tác theo yêu cầu của preset hiện tại, sau đó đồng nghiệp viết văn bản sẽ kết hợp dữ liệu gốc và kế hoạch của bạn để hoàn thành văn bản chính cùng các thành phẩm khác theo yêu cầu. Vui lòng tiếp tục sử dụng danh tính, ngôn ngữ và phong cách sáng tác do preset chỉ định.',
    writerInstruction: 'Đồng nghiệp lập kế hoạch của bạn đã hoàn thành bước chuẩn bị viết cho lượt này, dưới đây là kế hoạch sáng tác để bạn tiếp tục sử dụng. Vui lòng kết hợp ngữ cảnh gốc, thông tin mới nhất từ người dùng và preset hiện tại để tiếp tục hoàn thành văn bản chính cùng các thành phẩm khác theo yêu cầu của preset, không cần xuất lại khối kế hoạch.',
});


const previousPlanningGuidance = `Vui lòng hoàn thành việc bàn giao theo các bước và thứ tự kế hoạch sáng tác đã được bật của preset hiện tại, giữ nguyên tiêu đề, cấp độ và đánh số gốc:
1. Hướng dẫn dạng câu hỏi phải trả lời từng mục một;
2. Hướng dẫn dạng không phải câu hỏi bắt buộc phải lặp lại nguyên văn từng chữ một của hướng dẫn gốc trước, sau đó xuống dòng viết "Sắp xếp lượt này:" trong cùng một mục con để giải thích cách thực hiện. Nguyên văn và sắp xếp phải tách biệt, sắp xếp không được thay thế nguyên văn. Khi một mục con chứa cả hướng dẫn và câu hỏi, hướng dẫn bắt buộc phải được viết ra nguyên văn từng chữ một, câu hỏi xuống dòng trả lời riêng.
3. Nguyên văn hướng dẫn giữ nguyên cách dùng từ, từ phủ định, giá trị số và thẻ, không tóm tắt, không viết lại, không thay thế bằng giải thích thực hiện. Việc sắp xếp tuân theo đối tượng tác động, đơn vị, phạm vi, cường độ, điều kiện và quan hệ phủ định của yêu cầu gốc, đồng thời tham khảo định nghĩa cụ thể của các mục đã bật trong preset; không tự ý thêm các giá trị số hoặc quy tắc cứng nhắc.
4. Xử lý trọn vẹn từng bước và mục con, không dùng tóm tắt chung chung thay thế cho các bước tiếp theo. Các bước có điều kiện được xử lý theo điều kiện của preset; khi thiếu dữ liệu thì giải thích rõ là thiếu, phân biệt giữa sự thật đã xảy ra và sắp xếp dự định viết trong lượt này. Các nhiệm vụ rõ ràng như liệt kê, đọc thông tin, thu hồi, tính toán, câu ví dụ và đoạn viết trước vẫn phải được hoàn thành, không chỉ sao chép lệnh nhiệm vụ.
5. Các yêu cầu liên quan đến văn bản chính và thành phẩm bổ sung trong preset là yêu cầu bàn giao mà đồng nghiệp viết văn bản tiếp theo cần thực hiện, vui lòng giữ lại chính xác trong các bước kế hoạch tương ứng. Việc xác nhận định dạng được trả lời theo nguyên văn của bước đó, không dùng thẻ bọc ngoài kế hoạch của plugin này thay thế cho định dạng thành phẩm của văn bản chính. Văn bản chính và các thành phẩm khác sẽ do đồng nghiệp ở giai đoạn tiếp theo hoàn thành dựa trên kế hoạch bạn bàn giao trong lượt này.
6. Nội dung bàn giao giới hạn trong khối kế hoạch do preset chỉ định, không sao chép toàn bộ preset hoặc template thành phẩm ngoài khối, không thêm đánh giá bản thân, tóm tắt, báo cáo kiểm tra hoặc tuyên bố kết thúc không được preset yêu cầu.`;
const planningGuidance = `Vui lòng hoàn thành việc bàn giao theo các bước và thứ tự kế hoạch sáng tác đã bật của preset hiện tại, giữ nguyên tiêu đề, cấp độ và đánh số gốc:
1. Các bước hướng dẫn dạng câu hỏi cần được trả lời từng mục;
2. Hướng dẫn các bước mang tính trần thuật không phải câu hỏi bắt buộc phải viết lại nguyên văn từng chữ một của hướng dẫn trần thuật đó trước, sau đó xuống dòng viết "Sắp xếp lượt này:" trong cùng một mục con để giải thích cách thức thực hiện hướng dẫn đó trong văn bản chính của lượt này. Nguyên văn hướng dẫn trần thuật và sắp xếp phải tách biệt, sắp xếp không được thay thế nguyên văn hướng dẫn trần thuật.
- Khi một mục con chứa cả hướng dẫn trần thuật và hướng dẫn dạng câu hỏi, cần viết lại nguyên văn từng chữ một của hướng dẫn trần thuật trước, sau đó xuống dòng trả lời hướng dẫn dạng câu hỏi.
3. Nguyên văn hướng dẫn các bước mang tính trần thuật không phải câu hỏi phải giữ nguyên cách dùng từ, từ phủ định, giá trị số và thẻ, không tóm tắt, không viết lại, không thay thế bằng giải thích thực hiện. Sắp xếp được viết ở dòng mới phải tuân theo đối tượng tác động, đơn vị, phạm vi, cường độ, điều kiện và quan hệ phủ định của yêu cầu hướng dẫn trần thuật; không tự ý thêm quy tắc.
4. Các bước kế hoạch trong đầu vào và các bước trong đầu ra phải tương ứng một-một, giữ nguyên tiêu đề, thứ tự và mục con của từng bước, không gộp chung, đổi tên hoặc thay thế lẫn nhau vì chủ đề tương tự. Mỗi nhiệm vụ thu hồi, đọc, kiểm tra và tính toán đều phải viết ra kết quả cụ thể hoặc sắp xếp xử lý cho lượt này ngay dưới bước tương ứng; không được chỉ dùng các lời hứa hẹn như "đã kiểm tra", "thực hiện theo quy tắc", "tự động bảo trì dưới nền" để thay thế. Khi thiếu tài liệu, giải thích rõ thiếu gì ở mục con tương ứng; khi điều kiện không thỏa mãn, giải thích không áp dụng theo điều kiện gốc.
5. Các yêu cầu liên quan đến việc viết văn bản chính và thành phẩm bổ sung là yêu cầu bàn giao mà đồng nghiệp viết văn bản tiếp theo cần thực hiện, vui lòng giữ lại và viết ra chính xác trong các bước kế hoạch tương ứng, thuận tiện cho đồng nghiệp viết văn bản xem. Việc xác nhận định dạng được trả lời theo nguyên văn của bước đó, không dùng thẻ bọc ngoài kế hoạch của plugin này thay thế cho định dạng thành phẩm của văn bản chính. Văn bản chính và các thành phẩm khác sẽ do đồng nghiệp viết văn bản ở giai đoạn tiếp theo hoàn thành dựa trên kế hoạch bạn bàn giao trong lượt này.
6. Nội dung bàn giao giới hạn trong khối kế hoạch được chỉ định, không sao chép toàn bộ preset hoặc template thành phẩm ngoài khối, không thêm đánh giá bản thân, tóm tắt, báo cáo kiểm tra hoặc tuyên bố kết thúc không được yêu cầu.`;
const writingGuidance = `Đưa các sắp xếp trong kế hoạch vào việc sáng tác, đồng thời tiếp tục tuân thủ các yêu cầu cụ thể của preset gốc, bao gồm hướng dẫn mang tính tuyên bố, mục bắt buộc, mục cấm, nhịp độ, độ dài, tỷ lệ và định dạng. Kế hoạch thuộc về tài liệu hỗ trợ, không thay thế dữ liệu gốc; việc kế hoạch không lặp lại một yêu cầu nào đó không có nghĩa là yêu cầu đó mất hiệu lực, các thành phẩm mà preset gốc yêu cầu tạo ra vẫn tạo ra như bình thường, những gì không yêu cầu hoặc bị cấm thì không được thêm mới. Sắp xếp dự định viết không nên được coi là sự thật đã xảy ra; khi xung đột với thông tin đầu vào mới nhất của người dùng hoặc sự thật đã biết thì lấy dữ liệu gốc làm chuẩn. Không cần hiển thị thêm các giải thích thực hiện hoặc danh sách kiểm tra không được preset yêu cầu.`;
export const promptDefaults = Object.freeze({
    plannerPrompt: `${defaults.plannerInstruction}\n${planningGuidance}`,
    writerPrompt: `${defaults.writerInstruction}\n${writingGuidance}`,
});

// Conservative recognition of explicit format instructions, not past assistant output.
// Ambiguous/unsupported layouts require a manual override; never silently guess Abstract.
export function resolvePlanningTags(messages, settings) {
    if (settings.tagMode === 'manual') return { openTag: settings.openTag, closeTag: settings.closeTag };
    const candidates = new Map();
    const cue = /chuỗi tư duy|chuẩn bị viết|chuẩn bị sáng tác|kế hoạch|suy nghĩ|suy diễn|reasoning|planning|thinking/i;
    const forbidden = /^(?:content|body|status.*|bbs_.*|details|summary|div|span|p|script|style|system|user|assistant)$/i;
    for (const message of messages) {
        if (!['system', 'developer'].includes(message.role) || typeof message.content !== 'string') continue;
        const lines = message.content.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const tokens = [...line.matchAll(/<(\/?)([\p{L}_][\p{L}\p{N}_.:-]*)\s*>/gu)];
            for (let j = 0; j < tokens.length; j++) {
                const token = tokens[j];
                const name = token[2];
                if (forbidden.test(name)) continue;
                const before = line.slice(Math.max(0, token.index - 90), token.index);
                const after = line.slice(token.index + token[0].length, tokens[j + 1]?.index ?? token.index + token[0].length + 70);
                const previous = lines[i - 1] || '';
                // Never interpret an explicit ban, a legacy alternative or quoted negative example as selection.
                if (/(?:đừng|không được|cấm|không sử dụng|không còn|chứ không phải|không phải|bản cũ|thẻ cũ|ví dụ sai|do not|don't|instead of)[^。；;\n]*$/i.test(before)) continue;
                const close = tokens[j + 1];
                const enclosesCue = !token[1] && close?.[1] === '/' && close[2] === name && cue.test(after);
                const directive = cue.test(before) && /thẻ|bọc|đặt vào|xuất|đóng|định dạng|sử dụng|tag|wrap|output|close/i.test(before);
                const standalone = tokens.length === 1 && line.trim() === token[0] && cue.test(previous) && /thẻ|xuất|sử dụng|tag|output/i.test(previous);
                if (enclosesCue || directive || standalone) {
                    candidates.set(name, { openTag: `<${name}>`, closeTag: `</${name}>` });
                }
            }
        }
    }
    if (candidates.size === 1) return [...candidates.values()][0];
    if (candidates.size > 1) throw new Error(`Có nhiều thẻ kế hoạch khả thi trong preset: ${[...candidates.keys()].join(', ')}. Vui lòng chỉ định thủ công thẻ được sử dụng cho preset của lượt này trong phần mở rộng.`);
    throw new Error('Không thể nhận diện rõ ràng thẻ kế hoạch từ các lệnh đã có hiệu lực. Vui lòng chọn chỉ định thủ công trong phần mở rộng; sẽ không sử dụng thẻ mặc định cố định.');
}

export function migrateSettings(saved = {}) {
    const merged = { ...defaults, ...saved };
    if (saved.plannerInstruction === 'Hoàn thành kế hoạch sáng tác công khai của lượt này theo từng mục câu hỏi chuẩn bị viết đã được bật của preset hiện tại. Giữ nguyên chủ đề, đánh số, căn cứ cụ thể và yêu cầu sáng tác; phân biệt giữa sự thật đã xảy ra và sắp xếp dự định viết trong lượt này. Chỉ xuất kế hoạch, không tạo văn bản chính, thanh trạng thái, dấu thời gian hoặc các thành phẩm bổ sung khác.') merged.plannerInstruction = defaults.plannerInstruction;
    if (saved.plannerInstruction === 'Hoàn thành toàn bộ nội dung chuẩn bị viết trong thẻ kế hoạch được chỉ định theo các mục đã bật của preset hiện tại, giữ nguyên thứ tự, tiêu đề, đánh số và câu hỏi phụ gốc, phân biệt giữa sự thật đã xảy ra và sắp xếp dự định viết trong lượt này.') merged.plannerInstruction = defaults.plannerInstruction;
    if (saved.plannerInstruction === "Hoàn thành toàn bộ nội dung chuẩn bị viết trong thẻ kế hoạch được chỉ định theo các mục đã bật của preset hiện tại, giữ nguyên thứ tự, tiêu đề, đánh số, câu hỏi phụ và yêu cầu mang tính tuyên bố gốc, phân biệt giữa sự thật đã xảy ra và sắp xếp dự định viết trong lượt này.") merged.plannerInstruction = defaults.plannerInstruction;
    if (saved.writerInstruction === "Kế hoạch sáng tác cho lượt này đã được cung cấp bên dưới. Coi như các câu hỏi yêu cầu tạo, hiển thị hoặc trả lời lại kế hoạch trong preset đã được hoàn thành, không xuất lại khối kế hoạch. Bắt đầu từ thành phẩm thực tế sau kế hoạch, hoàn thành phản hồi của lượt này theo kế hoạch. Tiếp tục tuân thủ các yêu cầu về thiết lập nhân vật, văn phong, văn bản chính, thanh trên cùng, thanh trạng thái, dấu thời gian, tóm tắt và các nội dung bổ sung khác của preset gốc: những gì ban đầu yêu cầu tạo thì tạo như bình thường, những gì ban đầu không yêu cầu hoặc bị cấm thì không thêm mới. Sắp xếp dự định viết trong kế hoạch không phải là sự thật lịch sử đã xảy ra; khi xung đột với thông tin đầu vào mới nhất của người dùng hoặc sự thật đã biết thì lấy dữ liệu gốc làm chuẩn.") merged.writerInstruction = defaults.writerInstruction;
    if (saved.plannerInstruction === "Bạn đang tham gia vào một quá trình hợp tác viết theo từng giai đoạn. Lượt này do bạn hoàn thành phần chuẩn bị viết theo yêu cầu của preset hiện tại, sau đó đồng nghiệp viết văn bản sẽ kết hợp dữ liệu gốc và kế hoạch của bạn để hoàn thành văn bản chính cùng các thành phẩm khác theo yêu cầu. Vui lòng tiếp tục sử dụng danh tính, ngôn ngữ và phong cách sáng tác do preset chỉ định.") merged.plannerInstruction = defaults.plannerInstruction;
    if (!saved.tagMode) {
        // Preserve an explicit non-default override from 0.1.0; migrate its default to auto.
        merged.tagMode = saved.openTag && saved.closeTag
            && (saved.openTag !== '<Abstract>' || saved.closeTag !== '</Abstract>') ? 'manual' : 'auto';
        if (merged.tagMode === 'auto') { merged.openTag = ''; merged.closeTag = ''; }
    }
    if (typeof saved.plannerPrompt !== 'string') merged.plannerPrompt = `${merged.plannerInstruction}\n${planningGuidance}`;
    if (saved.plannerPrompt === `${defaults.plannerInstruction}\n${previousPlanningGuidance}`) merged.plannerPrompt = promptDefaults.plannerPrompt;
    if (typeof saved.writerPrompt !== 'string') merged.writerPrompt = `${merged.writerInstruction}\n${writingGuidance}`;
    return merged;
}

export function validateSettings(settings) {
    const url = new URL(settings.apiUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
        throw new Error('Địa chỉ API phải là địa chỉ cơ sở HTTP(S) không chứa thông tin xác thực hoặc tham số truy vấn.');
    }
    if (!settings.model.trim()) throw new Error('Vui lòng điền tên model kế hoạch.');
    if (!settings.openTag.trim() || !settings.closeTag.trim() || settings.openTag === settings.closeTag) {
        throw new Error('Vui lòng thiết lập thẻ bắt đầu và kết thúc kế hoạch khác nhau và không được để trống.');
    }
    for (const [field, min, max] of [['maxTokens', 256, 100000], ['timeoutSeconds', 10, 1800]]) {
        if (!Number.isInteger(Number(settings[field])) || Number(settings[field]) < min || Number(settings[field]) > max) {
            throw new Error(`${field} phải là số nguyên từ ${min} đến ${max}.`);
        }
    }
    parseRules(settings.rules);
}

// Exact, opt-in edits to instructions only. History and user input are never rewritten.
export function parseRules(raw) {
    const rules = JSON.parse(raw || '[]');
    if (!Array.isArray(rules) || rules.some(r => !r || typeof r.find !== 'string' || !r.find || typeof r.replace !== 'string')) {
        throw new Error('Quy tắc tương thích phải có dạng [{"find":"Nguyên văn","replace":"Văn bản thay thế"}].');
    }
    return rules;
}

export function planningMessages(messages, settings) {
    return [...structuredClone(messages), { role: 'system', content:
        `${settings.plannerPrompt ?? `${settings.plannerInstruction}\n${planningGuidance}`}
Vui lòng đặt toàn bộ kế hoạch vào thẻ được preset hiện tại chỉ định: ${settings.openTag}Nội dung kế hoạch${settings.closeTag}.` }];
}

export function extractPlan(text, settings, finishReason) {
    if (finishReason === 'length') throw new Error('Kế hoạch bị cắt ngang do vượt quá hạn mức đầu ra, vui lòng tăng hạn mức rồi thử lại.');
    if (typeof text !== 'string') throw new Error('API kế hoạch không trả về văn bản.');
    // Inline code quoting an exact delimiter is documentation, not a boundary.
    // Preserve offsets and original text; do not exempt arbitrary code blocks.
    let boundaries = text;
    for (const tag of [settings.openTag, settings.closeTag]) {
        const quoted = '`' + tag + '`';
        boundaries = boundaries.split(quoted).join(' '.repeat(quoted.length));
    }
    const start = boundaries.indexOf(settings.openTag);
    const end = boundaries.indexOf(settings.closeTag, start + settings.openTag.length);
    if (start < 0 || end < 0) {
        throw new Error('Không tìm thấy khối thẻ kế hoạch hoàn chỉnh; lượt này không tiêm.');
    }
    const plan = text.slice(start + settings.openTag.length, end).trim();
    const inner = boundaries.slice(start + settings.openTag.length, end);
    if (!plan || inner.includes(settings.openTag) || inner.includes(settings.closeTag)) throw new Error('Kế hoạch trống hoặc tồn tại thẻ lồng nhau lặp lại.');
    return plan;
}

export function writingMessages(messages, plan, settings) {
    const result = structuredClone(messages);
    const rules = parseRules(settings.rules);
    for (const message of result) {
        if (!['system', 'developer'].includes(message.role) || typeof message.content !== 'string') continue;
        for (const rule of rules) message.content = message.content.split(rule.find).join(rule.replace);
    }
    result.push({ role: 'system', content: `${settings.writerPrompt ?? `${settings.writerInstruction}\n${writingGuidance}`}\n\n[Kế hoạch sáng tác lượt này]\n${settings.openTag}\n${plan}\n${settings.closeTag}` });
    return result;
}

export function eligibleRequest(data) {
    return [undefined, 'normal', 'regenerate', 'swipe'].includes(data?.type)
        && Array.isArray(data?.messages) && data.messages.length > 0
        && !data.messages.some(m => m.role === 'tool' || m.tool_calls?.length);
}

export function unresolvedBaiBaiMacros(messages) {
    return /\{\{\s*bbs\w*(?:::|\s*\}\})/i.test(JSON.stringify(messages));
}