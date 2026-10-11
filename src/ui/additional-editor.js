/* Trình chỉnh sửa tham số bổ sung: Sửa đổi bản nháp, lưu lại bằng cách tạo mới hoặc ghi đè scheme API. */
import {el,button} from './components.js?v=0.5.0';
export function editAdditional(value,onSave){
 const dialog=el('dialog','detail-dialog prompt-editor');dialog.setAttribute('aria-label','Tham số bổ sung');dialog.append(el('h2','','Tham số bổ sung'));
 const fields={};
 for(const [key,label,hint] of [['custom_include_body','Bao gồm tham số body','top_k: 20'],['custom_exclude_body','Loại trừ tham số body','- frequency_penalty'],['custom_include_headers','Bao gồm header yêu cầu','X-Custom-Header: value']]){
  const wrap=el('label','additional-field');wrap.append(el('span','',label));const input=el('textarea');input.value=value?.[key]||'';input.placeholder=hint;input.rows=4;input.maxLength=60000;input.setAttribute('aria-label',label);wrap.append(input);dialog.append(wrap);fields[key]=input;
 }
 dialog.append(el('p','hint','Sử dụng định dạng YAML. Sau khi hoàn thành, vui lòng tạo mới hoặc ghi đè scheme API để lưu.'));
 const actions=el('div','dialog-actions');actions.append(button('Hủy',()=>dialog.close()),button('Hoàn thành',()=>{onSave(Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,input.value])));dialog.close();}));dialog.append(actions);
 dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
}