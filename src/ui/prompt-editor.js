/* Chỉnh sửa bản nháp prompt: Hủy sẽ không ghi lại, khôi phục mặc định cần hoàn thành rồi mới lưu, nếu thất bại sẽ giữ lại bản nháp. */
import { el, button } from './components.js?v=0.5.0';
export function editPrompt({title,value,defaultValue,description,save}) {
    const dialog=el('dialog','detail-dialog prompt-editor');
    dialog.setAttribute('aria-label',`Chỉnh sửa ${title}`);
    const header=el('header');header.append(el('h2','',`Chỉnh sửa ${title}`),button('Đóng chỉnh sửa',()=>dialog.close(),'×'));
    const input=el('textarea','prompt-text');input.value=value;input.setAttribute('aria-label','Nội dung prompt');input.spellcheck=false;input.maxLength=60000;
    const error=el('p','error');error.setAttribute('role','alert');
    const actions=el('div','dialog-actions prompt-actions');
    const reset=button('Khôi phục mặc định',()=>{input.value=defaultValue;error.textContent='';input.focus();});
    const cancel=button('Hủy',()=>dialog.close());
    const done=button('Hoàn thành',async()=>{
        done.disabled=true;reset.disabled=true;cancel.disabled=true;input.disabled=true;
        try {const result=await save(input.value);if(!result)throw Error('Không thể lưu, vui lòng thử lại.');dialog.close();}
        catch(e){error.textContent=e.message;}
        finally{done.disabled=false;reset.disabled=false;cancel.disabled=false;input.disabled=false;}
    });done.classList.add('primary');
    actions.append(reset,cancel,done);
    dialog.append(header,el('p','hint',description),input,error,actions);
    dialog.addEventListener('cancel',event=>{if(done.disabled)event.preventDefault();});
    header.querySelector('button').addEventListener('click',event=>{if(done.disabled)event.stopImmediatePropagation();},true);
    dialog.addEventListener('close',()=>dialog.remove());
    document.body.append(dialog);dialog.showModal();input.focus();
}