/* Đọc phản hồi SSE của kế hoạch: Tích lũy văn bản phân mảnh qua mạng, sau khi kết thúc hoàn toàn mới giao cho kế hoạch kiểm tra, không tiêm thành phẩm chưa hoàn thiện. */
export async function readPlanResponse(response, onText = () => {}, signal) {
    const jsonChoice = result => {
        if (result.error || !result.choices?.[0]) throw new Error('API kế hoạch trả về lỗi hoặc định dạng không được hỗ trợ.');
        return result.choices[0];
    };
    if (!response.body?.getReader) return jsonChoice(await response.json());
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let buffer = '', text = '', finish = null, mode = null, complete = false;
    const consume = event => {
        const payload = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n').trim();
        if (!payload) return;
        if (payload === '[DONE]') { complete = true; return; }
        let result;
        try { result = JSON.parse(payload); } catch { throw new Error('Định dạng phản hồi stream của kế hoạch bị lỗi.'); }
        if (result.error) throw new Error('API stream của kế hoạch trả về lỗi.');
        const choice = result.choices?.[0];
        if (typeof choice?.delta?.content === 'string') { text += choice.delta.content; onText(text); }
        if (choice?.finish_reason) finish = choice.finish_reason;
    };
    try {
        while (true) {
            signal?.throwIfAborted();
            const { value, done } = await reader.read();
            buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
            // ST proxies and providers can forward SSE under application/json/text/plain.
            // Inspect a buffered prefix without losing bytes or waiting for the full response.
            if (!mode) {
                buffer = buffer.trimStart();
                if (/^[{[]/.test(buffer)) mode = 'json';
                else if (/^(?:data:|event:|id:|retry:|:)/.test(buffer)) mode = 'sse';
                else if (done || buffer.length > 512) throw new Error('Phản hồi API kế hoạch không phải là JSON hoặc SSE có thể nhận diện được.');
            }
            if (mode !== 'sse') { if (done) break; else continue; }
            buffer = buffer.replace(/\r\n/g, '\n');
            let end;
            while ((end = buffer.indexOf('\n\n')) >= 0) { consume(buffer.slice(0,end)); buffer = buffer.slice(end+2); }
            if (done || complete) break;
        }
        if (mode === 'json') {
            signal?.throwIfAborted();
            let result;
            try { result = JSON.parse(buffer); } catch { throw new Error('API kế hoạch trả về JSON không hoàn chỉnh hoặc không hợp lệ.'); }
            return jsonChoice(result);
        }
        if (buffer.trim()) consume(buffer);
        signal?.throwIfAborted();
        if (!finish) throw new Error('Phản hồi stream của kế hoạch bị ngắt đột ngột, chưa tiêm vào văn bản chính.');
        return { message: { content: text }, finish_reason: finish };
    } finally { await reader.cancel().catch(()=>{}); reader.releaseLock(); }
}