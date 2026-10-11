/* Các control giao diện cơ bản: node văn bản an toàn, nút biểu tượng, field, phân nhóm và dialog cục bộ. */
import { setIcon } from './icons.js?v=0.5.0';
export function el(tag, className = '', text = '') { const node = document.createElement(tag); node.className = className; node.textContent = text; return node; }
export function button(label, action, icon) {
    const node = el('button', icon ? 'icon' : '', icon || label); node.type = 'button'; node.title = label; node.setAttribute('aria-label', label); node.addEventListener('click', action); if(icon==='↥')setIcon(node,'edit');if(icon==='⌫'){setIcon(node,'trash');node.classList.add('danger-icon');}return node;
}
export function select(label, options, value, change) {
    const node = el('select'); node.setAttribute('aria-label', label);
    for (const option of options) { const item = el('option', '', option.name); item.value = option.id; node.append(item); }
    node.value = value; node.addEventListener('change', () => change(node.value)); return node;
}
export function field(label, value, change, type = 'text') {
    const wrap = el('label', 'field'), caption = el('span', '', label), node = el('input');
    node.type = type; node.value = value ?? ''; node.setAttribute('aria-label', label);
    node.autocomplete = type === 'password' ? 'new-password' : 'off';
    node.addEventListener('change', () => change(type === 'number' ? Number(node.value) : node.value)); wrap.append(caption, node); return wrap;
}
export function check(label, checked, change, partial = false) {
    const wrap = el('label', 'check'), node = el('input'); node.type = 'checkbox'; node.checked = !!checked; node.indeterminate = !!partial; node.setAttribute('aria-label', label);
    node.addEventListener('change', () => change(node.checked)); wrap.append(node, el('span', '', label)); return wrap;
}
export function toggleSwitch(label, checked, change, partial = false) {
    const node = el('button', 'toggle-switch');
    node.type = 'button';
    node.setAttribute('role', 'switch');
    node.setAttribute('aria-label', label);
    node.setAttribute('aria-checked', String(!!checked));
    node.dataset.partial = String(partial);
    node.title = partial ? `${label} (Đã bật một phần)` : label;
    node.append(el('span', 'switch-track'));
    node.addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation(); change(!checked);
    });
    return node;
}
export function section(title, content, collapsed = false) {
    const wrap = el('details', 'card'); wrap.open = !collapsed; wrap.append(el('summary', '', title), content); return wrap;
}
export function detail(title, content) {
    const dialog = el('dialog', 'detail-dialog'), header = el('header'); header.append(el('h2','',title),button('Đóng chi tiết',()=>dialog.close(),'×'));
    dialog.append(header,el('pre','entry-content',content || 'Entry này không có nội dung văn bản.')); document.body.append(dialog); dialog.addEventListener('close',()=>dialog.remove()); dialog.showModal();
}
export async function ask(title, initial, destructive = false, confirmLabel = '') {
    return new Promise(resolve => {
        const dialog=el('dialog','confirm-dialog'), heading=el('h2','',title), actions=el('div','dialog-actions');
        const input=el('input');input.value=initial || '';input.setAttribute('aria-label','Tên scheme');input.maxLength=100;
        let value=null;
        actions.append(button('Hủy',()=>dialog.close()),button(confirmLabel||(destructive?'Xóa':'Lưu'),()=>{if(!destructive&&!input.value.trim())return;value=destructive?true:input.value.trim();dialog.close();}));
        dialog.append(heading);if(!destructive)dialog.append(input);dialog.append(actions);document.body.append(dialog);
        dialog.addEventListener('close',()=>{dialog.remove();resolve(value);});dialog.showModal();if(!destructive)input.focus();
    });
}