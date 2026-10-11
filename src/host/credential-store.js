/* Kho lưu trữ key cục bộ của trình duyệt: Lưu trữ vĩnh viễn bằng IndexedDB, cấu hình chỉ tham chiếu ID ngẫu nhiên, không thao tác với active key của SillyTavern. */
import { createId } from '../bridge/id.js?v=0.5.0';
export function createCredentialStore(indexedDB = globalThis.indexedDB) {
    async function run(mode, action) {
        if (!indexedDB) throw new Error('Trình duyệt không hỗ trợ lưu trữ key cục bộ, vui lòng sử dụng scheme của trình chỉnh sửa đã có.');
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('czgh-creative-planning-credentials', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('credentials');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Không thể mở kho lưu trữ key cục bộ, vui lòng kiểm tra quyền dữ liệu trang web của trình duyệt.'));
        });
        try {
            return await new Promise((resolve, reject) => {
                const tx = db.transaction('credentials', mode);
                const request = action(tx.objectStore('credentials'));
                tx.oncomplete = () => resolve(request.result);
                tx.onabort = tx.onerror = () => reject(new Error('Lưu hoặc đọc key cục bộ thất bại, scheme chưa hoàn tất cập nhật.'));
            });
        } finally { db.close(); }
    }
    return {
        async put(value) {
            if (typeof value !== 'string' || !value.trim() || /[\r\n]/.test(value)) throw new Error('Vui lòng nhập key hợp lệ.');
            const id = createId();
            await run('readwrite', store => store.put(value.trim(), id));
            return id;
        },
        async get(id) {
            const value = await run('readonly', store => store.get(id));
            if (typeof value !== 'string' || !value) throw new Error('Trình duyệt này chưa lưu key của scheme này, vui lòng nhập lại và ghi đè scheme; không sử dụng active key của SillyTavern.');
            return value;
        },
        remove: id => run('readwrite', store => store.delete(id)),
    };
}