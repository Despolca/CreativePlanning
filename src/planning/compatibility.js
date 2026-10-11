/* Sổ đăng ký dữ liệu tương thích: Chỉ chọn các slot tiêm của lượt này thuộc về plugin một cách rõ ràng, giữ nguyên vị trí tiêm. */
export const adapters = Object.freeze([
    { id: 'baibai', name: 'BaiBaiBook', category: 'memory', slots: ['baibai_book_memory', 'baibai_book_memory_history', 'baibai_book_memory_state', 'baibai_book_time_tag', 'baibai_book_vector_recall'] },
    { id: 'seven-days', name: 'GouHua', category: 'plot', slots: ['sp_outline_step', 'sp_lines_latent', 'sp_ledger_remind'] },
]);
export function selectInjections(snapshot, compatibilityIds = []) {
    const items = [], diagnostics = [];
    for (const adapter of adapters) {
        if (!compatibilityIds.includes(adapter.id)) continue;
        for (const key of adapter.slots) {
            const value = snapshot.injections?.[key];
            if (value?.hasFilter && value?.value?.trim()) diagnostics.push({code:'filtered-injection',message:`Dữ liệu tiêm của ${adapter.name} có chứa bộ lọc động chưa được hỗ trợ.`,blocking:true});
            else if (value?.value?.trim() && value.position !== -1) items.push({ ...structuredClone(value), key, adapterId: adapter.id });
        }
        if (!items.some(x => x.adapterId === adapter.id)) diagnostics.push({ code: 'no-injection', message: `${adapter.name} lượt này tạm thời chưa có tiêm.` });
    }
    return { items, diagnostics };
}