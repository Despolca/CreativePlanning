/* Dịch vụ host của scheme API: Bên ngoài chỉ có quyền đọc, lưu trữ lâu dài bản sao scheme riêng, cấm thay đổi key đang hoạt động. */
import { applySchemeOperation, migrateSchemes } from '../planning/schemes.js?v=0.5.0';

export function createApiSchemes(host) {
    let queue = Promise.resolve();
    const serial = action => { const result = queue.then(action); queue = result.catch(() => {}); return result; };
    const localId = id => {
        if (typeof id !== 'string' || !id.startsWith('local:')) throw new Error('Kết nối hiện tại và scheme bên ngoài chỉ có quyền đọc, vui lòng tạo mới scheme cục bộ.');
        return id.slice(6);
    };
    const read = () => migrateSchemes(host.read());
    const release = async (ref, state) => {
        if (ref && !state.schemes.api.some(p => p.payload.keyRef === ref)) await host.vault?.remove(ref);
    };
    return {
        async list() {
            return [{ id: 'current', name: 'Kết nối hiện tại của SillyTavern', origin: 'current', additional:structuredClone(host.currentAdditional?.()||{}) }, ...host.external().map(p => ({ id: `external:${p.id}`, name: p.name, origin: 'external', additional:structuredClone(p.additional||{}), model: p.model, apiUrl: p.connection?.custom_url || '' })), ...read().schemes.api.map(p => ({ id: `local:${p.id}`, name: p.name, origin: 'local', additional:structuredClone(p.payload.additional||{}), model: p.payload.model, apiUrl: p.payload.connection?.custom_url || p.payload.apiUrl || '', hasKey: !!(p.payload.secretId || p.payload.keyRef) }))];
        },
        async resolve(selection) {
            let config;
            if (selection === 'current') config = await host.current();
            else if (selection?.startsWith('external:')) config = host.external().find(p => p.id === selection.slice(9));
            else config = read().schemes.api.find(p => p.id === localId(selection))?.payload;
            if (!config) throw new Error('Scheme API đã bị xóa hoặc kết nối hiện tại không khả dụng.');
            return structuredClone(config);
        },
        save({ id, name, config, key }) {
            return serial(async () => {
                if (id) localId(id);
                const state = read();
                const next = applySchemeOperation(state, { kind: 'api', operation: id ? 'overwrite' : 'create', id: id ? localId(id) : undefined, name, payload: config });
                const saved = id ? next.schemes.api.find(p => p.id === localId(id)) : next.schemes.api.at(-1);
                const oldRef = id ? state.schemes.api.find(p => p.id === localId(id))?.payload.keyRef : null;
                let newRef;
                if (key) {
                    if (!host.vault) throw new Error('Kho lưu trữ key cục bộ không khả dụng.');
                    newRef = await host.vault.put(key);
                    saved.payload.keyRef = newRef;
                    delete saved.payload.secretId;
                }
                next.apiSelection = `local:${saved.id}`;
                try { await host.write(next); }
                catch (error) { if (newRef) await host.vault.remove(newRef); throw error; }
                await release(oldRef, next);
                return structuredClone(saved);
            });
        },
        remove(id) {
            return serial(async () => {
                const previous = read();
                const oldRef = previous.schemes.api.find(p => p.id === localId(id))?.payload.keyRef;
                const next = applySchemeOperation(previous, { kind: 'api', operation: 'delete', id: localId(id) });
                if (next.apiSelection === id) next.apiSelection = '';
                await host.write(next);
                await release(oldRef, next);
            });
        },
        async models(config) {
            if (!host.models) throw new Error('Kết nối hiện tại không hỗ trợ lấy danh sách model, có thể nhập thủ công.');
            return host.models(structuredClone(config));
        },
    };
}