/* Phân tích macro riêng tư: Biến cục bộ không ghi ngược lại SillyTavern; macro dữ liệu chưa được cấp quyền không được mở rộng; ngữ nghĩa không xác định sẽ chặn quá trình tạo. */
const safeKey = key => key && !['__proto__', 'constructor', 'prototype'].includes(key);
const print = value => value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value);
export function expandMacros(text, { snapshot, compatibilityIds = [], variables = { local: {}, global: {} }, serializeYaml }) {
    const state = structuredClone(variables), diagnostics = [];
    state.local ??= {}; state.global ??= {};
    const env = snapshot.macroEnvironment || {};
    const issue = (code, message, blocking = false) => diagnostics.push({ code, message, blocking });
    const pathValue = (value, path) => {
        for (const key of path.replace(/\[(?:["']([^"']+)["']|(\d+))\]/g, (_, quoted, index) => '.' + (quoted ?? index)).split('.')) {
            if (!safeKey(key)) return undefined;
            value = value != null && Object.hasOwn(Object(value), key) ? value[key] : undefined;
        }
        return value;
    };
    const replace = token => {
        const [raw, ...args] = token.split('::'); const name = raw.trim().toLowerCase();
        if (name.startsWith('//')) return '';
        if (name === 'trim') return '';
        if (name === 'newline') return '\n';
        if (name === 'noop') return '';
        const helper = /^(get|format)_(message|chat|character|preset|global)_variable$/.exec(name);
        if (helper) {
            if (!Object.hasOwn(snapshot.helperVariables || {}, helper[2])) { issue('helper-unavailable', `Không thể đọc biến ${helper[2]} của trợ lý SillyTavern, vui lòng kiểm tra xem trợ lý SillyTavern đã được tải chưa.`, true); return ''; }
            const strip = value => Array.isArray(value) ? value.map(strip) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith('$') && safeKey(key)).map(([key, child]) => [key, strip(child)])) : value;
            const value = strip(pathValue(snapshot.helperVariables[helper[2]], args.join('::')) ?? null);
            if (helper[1] === 'get' || typeof value === 'string') return typeof value === 'string' ? value : JSON.stringify(value);
            const yaml = serializeYaml?.(value);
            if (typeof yaml !== 'string') { issue('yaml-unavailable', 'Macro định dạng biến cần giao diện tuần tự hóa YAML.', true); return ''; }
            return yaml.trimEnd();
        }
        if (Object.hasOwn(env, name) && typeof env[name] !== 'object') return print(env[name]);
        if (/^(?:set|get|add|inc|dec)(?:global)?var$/.test(name)) {
            const map = name.includes('global') ? state.global : state.local;
            const key = args[0];
            if (!safeKey(key)) { issue('unsafe-variable', 'Tên biến không hợp lệ.', true); return ''; }
            if (name.startsWith('get')) return print(map[key]);
            if (name.startsWith('set')) map[key] = args.slice(1).join('::');
            else if (name.startsWith('add')) map[key] = Number.isFinite(Number(map[key] || 0)) && Number.isFinite(Number(args[1])) ? Number(map[key] || 0) + Number(args[1]) : print(map[key]) + (args[1] || '');
            else map[key] = Number(map[key] || 0) + (name.startsWith('inc') ? 1 : -1);
            return '';
        }
        if (name.startsWith('bbs')) {
            if (!compatibilityIds.includes('baibai')) { issue('excluded-macro', 'BaiBaiBook chưa được chọn, các macro liên quan đã bị loại trừ.'); return ''; }
            const cached = env.pluginMacros?.[token];
            if (cached !== undefined) return print(cached);
            const bbs = env.bbs;
            if (bbs && args.length === 0 && name === 'bbsvars') return print(bbs.vars);
            if (bbs && args.length === 0 && name === 'bbsstate') return print(bbs.state);
            if (bbs && args.length === 0 && name === 'bbssnapshot') return print(bbs);
            if (bbs && args.length === 1 && name === 'bbsvar') return print(pathValue(bbs.vars, args[0]));
            issue('macro-dependency', `Không thể đọc snapshot cần thiết cho macro BaiBaiBook ${raw}.`, true); return '';
        }
        issue('literal-placeholder', `Nội dung trong ngoặc nhọn kép chưa được nhận diện ${raw} đã được giữ nguyên.`);
        return `{{${token}}}`;
    };
    let evaluations = 0;
    function parse(input, depth = 0) {
        if (depth > 40 || evaluations > 10000) { issue('macro-limit', 'Số lần lồng nhau hoặc mở rộng macro vượt quá giới hạn.', true); return ''; }
        let result = '', cursor = 0;
        while (cursor < input.length) {
            const start = input.indexOf('{{', cursor);
            if (start < 0) { result += input.slice(cursor); break; }
            result += input.slice(cursor, start);
            let nesting = 1, end = start + 2;
            for (; end < input.length; end++) {
                if (input.startsWith('{{', end)) { nesting++; end++; }
                else if (input.startsWith('}}', end)) { if (--nesting === 0) break; end++; }
            }
            if (nesting) { issue('unresolved-macro', 'Tồn tại macro chưa được đóng.', true); return result; }
            const token = parse(input.slice(start + 2, end), depth + 1);
            evaluations++;
            let replacement = replace(token);
            if (/^format_(message|chat|character|preset|global)_variable::/i.test(token)) {
                const prefix = result.slice(result.lastIndexOf('\n') + 1);
                replacement = replacement.replaceAll('\n', '\n' + ' '.repeat(prefix.length));
            }
            result += replacement;
            cursor = end + 2;
        }
        return result;
    }
    const output = parse(String(text ?? ''));
    return { text: output, variables: state, diagnostics };
}