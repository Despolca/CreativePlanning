/* Đọc scheme API và xây dựng request độc lập; không sửa đổi kết nối hoạt động của SillyTavern. */
const STORE = 'preset_compare_api_manager';
function profiles(settings) {
    const store = settings[STORE];
    if (!store) return [];
    if (store.version !== 1 || !Array.isArray(store.profiles)) throw new Error('Định dạng scheme API của trình chỉnh sửa cập nhật Preset không được hỗ trợ, vui lòng làm mới hoặc cập nhật plugin.');
    return store.profiles;
}
export function listProfiles(settings) {
    return profiles(settings).map(p => ({ id: p.id, name: p.name, apiUrl: p.connection?.custom_url || '', model: p.model }));
}
export function resolveProfile(settings, id) {
    const matches = profiles(settings).filter(p => p.id === id);
    if (matches.length !== 1) throw new Error('Scheme API đã chọn đã bị xóa hoặc định danh bị trùng lặp, vui lòng chọn lại.');
    const p = structuredClone(matches[0]);
    if (p.source !== 'custom' || !p.model || !p.secretId || !p.connection?.custom_url) throw new Error('Scheme thiếu địa chỉ API tương thích hợp lệ, model hoặc tham chiếu key.');
    return p;
}
export function profileRequest(profile, messages, maxTokens, parseYaml) {
    if (profile.source !== 'custom' || !(profile.secretId || profile.keyRef) || !profile.model) throw new Error('Scheme API thiếu model hoặc tham chiếu key.');
    if(profile.additional!=null&&(typeof profile.additional!=='object'||Array.isArray(profile.additional)))throw new Error('Cấu trúc tham số bổ sung không hợp lệ.');
    const body = { chat_completion_source: 'custom', custom_url: profile.connection.custom_url,
        secret_id: profile.keyRef ? `czgh-local:${profile.keyRef}` : profile.secretId, model: profile.model, messages: structuredClone(messages), stream: false, max_tokens: Number(maxTokens) };
    const protectedFields = new Set(['messages', 'model', 'stream', 'max_tokens', 'max_completion_tokens', 'prompt', 'tools', 'tool_choice', 'functions', 'function_call', 'n', 'secret_id', 'chat_completion_source', 'custom_url', 'reverse_proxy', 'proxy_password', '__proto__', 'constructor', 'prototype']);
    for (const field of ['custom_include_body', 'custom_exclude_body', 'custom_include_headers']) {
        const raw = profile.additional?.[field];
        if(raw!==undefined&&typeof raw!=='string')throw new Error('Tham số bổ sung phải là văn bản YAML.');
        if (!raw?.trim()) continue;
        let parsed;
        try { parsed = parseYaml(raw); } catch { throw new Error('Không thể phân tích cú pháp tham số bổ sung của scheme API, vui lòng kiểm tra trong tham số bổ sung.'); }
        const excluded = field === 'custom_exclude_body';
        if (!parsed || typeof parsed !== 'object' || (excluded ? !Array.isArray(parsed) : Array.isArray(parsed))) throw new Error('Cấu trúc tham số bổ sung của scheme API không hợp lệ.');
        const keys = excluded ? parsed : Object.keys(parsed);
        if (keys.some(k => typeof k !== 'string' || protectedFields.has(k) || field === 'custom_include_headers' && /authorization|api[-_]key|cookie|host/i.test(k))) {
            throw new Error('Tham số bổ sung của scheme đã ghi đè tin nhắn kế hoạch, model, hạn mức đầu ra hoặc xác thực, vui lòng điều chỉnh rồi thử lại.');
        }
        body[field] = raw;
    }
    return body;
}

export function authorizeLocalRequest(body, key, parseYaml) {
    if (typeof key !== 'string' || !key.trim() || /[\r\n]/.test(key)) throw new Error('Key cục bộ không khả dụng.');
    const headers = body.custom_include_headers ? parseYaml(body.custom_include_headers) : {};
    return { ...body, custom_include_headers: JSON.stringify({ ...headers, Authorization: `Bearer ${key.trim()}` }) };
}