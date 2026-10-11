/* Bộ điều hợp tương thích template: Đóng băng các biến của trợ lý SillyTavern; tùy chọn gọi plugin template EJS đã cài đặt, không thực thi ghi ngược MVU. */
export async function captureHelperVariables(snapshot, context, helper, generationType) {
    const scopes = new Set([...JSON.stringify(snapshot).matchAll(/(?:get|format)_(message|chat|character|preset|global)_variable::/gi)].map(m => m[1].toLowerCase()));
    snapshot.helperVariables = {};
    if (!scopes.size || typeof helper?.getVariables !== 'function') return;
    const chat = context.chat || [];
    let end = chat.length;
    if (generationType === 'swipe' && !chat.at(-1)?.is_user) end--;
    let messageId = -1;
    for (let i = end - 1; i >= 0; i--) if (chat[i]?.variables?.[chat[i].swipe_id ?? 0]) { messageId = i; break; }
    for (const type of scopes) {
        if (type === 'message' && messageId < 0) { snapshot.helperVariables[type] = {}; continue; }
        const options = type === 'message' ? { type, message_id: messageId } : { type };
        snapshot.helperVariables[type] = structuredClone(await helper.getVariables(options));
    }
}
export function createTemplateRenderer({ enabled, api, signal }) {
    let context;
    return async text => {
        signal?.throwIfAborted();
        if (/^\s*@@(?:if|else|end|activate|generate)\b/m.test(text)) throw Error('Dữ liệu hiện tại chứa lệnh kích hoạt worldbook của template chưa được tương thích (@@). Vui lòng tắt các mục liên quan rồi thử lại; sẽ không gửi nguyên văn lệnh này cho model.');
        if (!enabled || !text.includes('<%')) return text;
        if (typeof api?.prepareContext !== 'function' || typeof api?.evalTemplate !== 'function') throw Error('Tương thích template EJS đã được bật, nhưng không phát hiện thấy giao diện công khai của ST-Prompt-Template.');
        context ??= await api.prepareContext();
        signal?.throwIfAborted();
        const result = String(await api.evalTemplate(text, context));
        signal?.throwIfAborted();
        return result;
    };
}