/* Chế độ xem bản sao Preset: Thực thi theo prompt_order, phân nhóm BaiBaiBook chỉ kiểm soát hiển thị và công tắc nhóm riêng tư. */
export function resolvePreset(snapshot, selection = {}) {
    const id = selection.presetId || snapshot.currentPreset;
    const preset = snapshot.presets[id];
    if (!preset) throw new Error('Preset đã chọn không còn tồn tại, vui lòng chọn lại.');
    const diagnostics = [];
    const orders = preset.prompt_order || [];
    const order = orders.find(x => Number(x.character_id) === 100001)?.order || orders.find(x => Number(x.character_id) === 100000)?.order;
    if (!Array.isArray(order)) throw new Error('Preset này không có prompt_order có thể nhận diện, không thể suy đoán thứ tự thực thi.');
    const metadata = preset.extensions?.baibaiToolkit?.presetPromptGroups || {};
    const definitions = [...(metadata.groups || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    const groups = definitions.map(g => ({ ...structuredClone(g), enabled: selection.groupOverrides?.[g.id] ?? g.enabled ?? true, entries: [] }));
    const ungrouped = { id: '', name: 'Chưa phân nhóm', enabled: true, entries: [] };
    const entries = new Map((preset.prompts || []).map(x => [x.identifier, x]));
    const execution = [];
    const display = [], displayedGroups = new Set();
    for (const item of order) {
        const source = entries.get(item.identifier);
        if (!source) { diagnostics.push({code:'missing-prompt',message:`Thứ tự Preset tham chiếu đến mục không tồn tại ${item.identifier}.`,blocking:true}); continue; }
        const groupId = metadata.prompts?.[item.identifier]?.groupId;
        const group = groups.find(g => g.id === groupId) || ungrouped;
        const entry = { ...structuredClone(source), enabled: selection.promptOverrides?.[item.identifier] ?? item.enabled ?? false, groupId: group.id };
        group.entries.push(entry);
        if (!group.id) display.push({ type: 'prompt', entry });
        else if (!displayedGroups.has(group.id)) {
            displayedGroups.add(group.id);
            display.push({ type: 'group', group });
        }
        if (entry.enabled && group.enabled) execution.push(entry);
    }
    for (const key of Object.keys(selection.promptOverrides || {})) if (!entries.has(key)) diagnostics.push({code:'missing-entry',message:`Mục scheme cũ ${key} đã bị xóa, không còn áp dụng công tắc nữa.`});
    if (ungrouped.entries.length) groups.push(ungrouped);
    for (const group of groups) { group.checked = group.enabled && group.entries.every(e => e.enabled); group.partial = group.enabled && !group.checked && group.entries.some(e => e.enabled); }
    return { id, execution, groups, display, diagnostics };
}