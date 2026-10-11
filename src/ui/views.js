/* Chế độ xem ba trang workbench: Cài đặt, công tắc Preset, công tắc Worldbook và chi tiết nguồn; tất cả thao tác giao cho host. */
import { el, button, field, check, toggleSwitch, select, section, detail, ask } from './components.js?v=0.5.0';
import { entryKey } from '../planning/world-info.js?v=0.5.0';
import { schemeSelectionState } from '../planning/schemes.js?v=0.5.0';
import { promptDefaults } from '../planning/core.js?v=0.5.0';
import { editAdditional } from './additional-editor.js?v=0.5.0';
import { editPrompt } from './prompt-editor.js?v=0.5.0';
export function renderView(root, state, ui, act) {
    const s=state.settings, selection=s.selection;
    root.replaceChildren();
    const toolbar=(kind)=>{
        const bar=el('div','scheme-bar');bar.append(el('span','muted','Scheme'));
        const nativeName=kind==='preset'?'Preset hiện tại của SillyTavern':'Worldbook hiện tại của SillyTavern';
        const tracked=schemeSelectionState(s,kind), selected=tracked.id;
        const options=[{id:'',name:''},{id:'@current',name:nativeName},...s.schemes[kind]];
        const chooser=select(`Scheme ${kind==='preset'?'Preset':'Worldbook'}`,options,selected,async id=>{
            if(id==='@current'){
                if(await ask(`Có tải ${nativeName} không? Sẽ thay thế các lựa chọn độc lập trên trang này, không sửa đổi cấu hình gốc của SillyTavern.`,'',true,'Tải'))await act('scheme.loadCurrent',{kind});
                else renderView(root,state,ui,act);
            }else if(id)await act('scheme.save',{kind,applyId:id});
        });
        chooser.options[0].disabled=true;chooser.options[0].hidden=true;bar.append(chooser);
        bar.append(button('Tạo mới scheme',async()=>{const name=await ask('Tạo mới scheme','');if(name)await act('scheme.save',{kind,name});},'+'));
        const overwrite=button('Ghi đè scheme',async()=>{const item=options.find(x=>x.id===selected);if(!item?.id)return;const name=await ask('Ghi đè scheme',item.name);if(name)await act('scheme.save',{kind,id:item.id,name});},'↥');overwrite.disabled=!s.schemes[kind].some(x=>x.id===selected);if(overwrite.disabled)overwrite.title='Vui lòng chọn scheme đã lưu trước; không thể ghi đè nguồn hiện tại của SillyTavern';bar.append(overwrite);
        const remove=button('Xóa scheme',async()=>{if(await ask('Xóa scheme đã chọn?','',true)){await act('scheme.remove',{kind,id:selected});}},'⌫');remove.disabled=!s.schemes[kind].some(x=>x.id===selected);if(remove.disabled)remove.title='Vui lòng chọn scheme đã lưu trước; không thể xóa nguồn hiện tại của SillyTavern';bar.append(remove);return bar;
    };
    const saveHint=kind=>{const x=schemeSelectionState(s,kind);const hint=el('p','save-hint',x.dirty?'Thay đổi chưa được lưu':x.id?'Đã lưu thay đổi':'');hint.setAttribute('role','status');if(!x.id&&x.dirty)hint.append(el('span','save-help',' · Nhấp + để tạo scheme mới'));return hint;};
    const change=(key,id,value)=>act('selection.update',{[key]:{...selection[key],[id]:value}});
    const row=(label,content,checked,toggle)=>{const node=el('div','entry-row');const open=button('Xem '+label,()=>detail(label,content));open.textContent=label;open.className='entry-open';node.append(open,toggleSwitch(label,checked,toggle));node.addEventListener('click',event=>{if(event.target===node)detail(label,content);});return node;};
    if(ui.page==='settings'){
        root.append(check('Bật Kế hoạch Sáng tác',s.enabled,v=>act('settings.update',{enabled:v})));
        const api=el('div','section-body');
        const profile=state.profiles.find(p=>p.id===s.apiSelection);
        const apiOptions=profile?state.profiles:[{id:s.apiSelection||'',name:'Scheme cũ không khả dụng, vui lòng chọn lại',origin:'missing'},...state.profiles];
        const draft=ui.apiDraft;
        const bar=el('div','scheme-bar');bar.append(el('span','muted','Scheme'),select('Scheme API',apiOptions.map(p=>({...p,name:`${p.origin==='local'?'Cục bộ · ':''}${p.name}`})),s.apiSelection,async value=>{ui.apiDraft={};await act('settings.update',{apiSelection:value});}));
        const save=async overwrite=>{const name=await ask(overwrite?'Ghi đè scheme API':'Tạo mới scheme API',overwrite?profile?.name:'');if(name)await act('api.save',{id:overwrite?s.apiSelection:undefined,sourceId:s.apiSelection,name,apiUrl:draft.apiUrl,model:draft.model,key:draft.key,additional:draft.additional});};
        bar.append(button('Tạo mới scheme API',()=>save(false),'+'));
        const over=button('Ghi đè scheme API',()=>save(true),'↥');over.disabled=profile?.origin!=='local';bar.append(over);
        const del=button('Xóa scheme API',async()=>{if(await ask('Xóa scheme API này?','',true))await act('api.remove',{id:s.apiSelection});},'⌫');del.disabled=profile?.origin!=='local';bar.append(del);api.append(bar);
        api.append(field('URL',draft.apiUrl??profile?.apiUrl,v=>draft.apiUrl=v));
        const key=field('Key',draft.key||'',v=>draft.key=v,'password');key.querySelector('input').placeholder=profile?.hasKey?'Đã lưu, để trống để giữ lại key cũ':'Nhập key mới';key.append(button('Hiển thị hoặc ẩn key',()=>{const input=key.querySelector('input');input.type=input.type==='password'?'text':'password';},'◉'));api.append(key);
        const model=field('Model',draft.model??profile?.model,v=>draft.model=v);model.querySelector('input').setAttribute('list','model-list');model.append(button('Lấy danh sách model',async()=>{ui.models=await act('api.models',{},false);renderView(root,state,ui,act);}));api.append(model);
        const list=el('datalist');list.id='model-list';for(const name of ui.models||[]){const o=el('option');o.value=name;list.append(o);}api.append(list);
        const numbers=el('div','two-fields');numbers.append(field('Đầu ra tối đa',s.maxTokens,v=>act('settings.update',{maxTokens:v}),'number'),field('Số giây timeout',s.timeoutSeconds,v=>act('settings.update',{timeoutSeconds:v}),'number'));numbers.classList.add('api-limits');numbers.append(button('Tham số bổ sung',()=>editAdditional(draft.additional??profile?.additional,value=>{draft.additional=value;})));api.append(numbers);

        api.append(check('Stream kế hoạch',s.stream,v=>act('settings.update',{stream:v})));root.append(section('Cài đặt chung',api));
        const compatibility=el('div','section-body');
        for(const [category,label] of [['memory','Plugin bộ nhớ'],['plot','Plugin kế hoạch cốt truyện']]){compatibility.append(el('h3','',label));for(const plugin of state.compatibility.filter(p=>p.category===category)){const line=el('div','plugin-row');line.append(check(plugin.name,selection.compatibilityIds.includes(plugin.id),v=>act('selection.update',{compatibilityIds:v?[...selection.compatibilityIds,plugin.id]:selection.compatibilityIds.filter(x=>x!==plugin.id)})),el('small','muted',plugin.status));compatibility.append(line);}}
        root.append(section('Tương thích plugin',compatibility));
        const syntax=el('div','section-body');
        syntax.append(check('Tương thích template EJS (ST-Prompt-Template)',s.templateCompat,v=>act('settings.update',{templateCompat:v})),el('p','hint','Thực thi EJS theo plugin template đã cài đặt; script trong template có thể sửa đổi biến. Không tự động thực thi ghi lại (writeback) sau khi tạo MVU.'));
        root.append(section('Cú pháp prompt',syntax,true));
        const display=el('div','section-body');display.append(check('Hiển thị kế hoạch dưới tin nhắn người dùng',s.displayPlan,v=>act('settings.update',{displayPlan:v})));root.append(section('Cài đặt hiển thị',display));
        const advanced=el('div','section-body');advanced.append(check('Tự động tạo văn bản chính sau khi hoàn thành kế hoạch',s.autoReply,v=>act('settings.update',{autoReply:v})));advanced.append(select('Tag kế hoạch',[{id:'auto',name:'Tự động theo tag của Preset'},{id:'manual',name:'Chỉ định tag thủ công'}],s.tagMode,v=>act('settings.update',{tagMode:v})));
        if(s.tagMode==='manual')advanced.append(field('Tag mở',s.openTag,v=>act('settings.update',{openTag:v})),field('Tag đóng',s.closeTag,v=>act('settings.update',{closeTag:v})));
        advanced.append(el('h3','','Cài đặt prompt tích hợp'));
        for(const [key,title,description] of [
            ['plannerPrompt','Prompt tích hợp của plugin','Hướng dẫn đầy đủ gửi đến API kế hoạch. Yêu cầu tag kế hoạch của Preset hiện tại sẽ được plugin tự động thêm vào, không cần điền macro. Sau khi sửa đổi, nhấp hoàn thành để lưu; khôi phục mặc định chỉ thay thế bản nháp hiện tại.'],
            ['writerPrompt','Prompt chèn vào ngữ cảnh văn bản chính','Hướng dẫn đầy đủ được chèn vào ngữ cảnh văn bản chính cùng với kế hoạch. Kế hoạch thực tế và các tag mở/đóng được plugin tự động thêm vào, không cần dán thủ công. Sau khi sửa đổi, nhấp hoàn thành để lưu; khôi phục mặc định chỉ thay thế bản nháp hiện tại.'],
        ]) {
            const value=s[key]??promptDefaults[key];
            const row=button(`Chỉnh sửa ${title}`,()=>editPrompt({title,value,defaultValue:promptDefaults[key],description,save:text=>act('settings.update',{[key]:text})}));
            row.className='prompt-setting';row.replaceChildren(el('span','prompt-name',title),el('small',value===promptDefaults[key]?'prompt-badge':'prompt-badge custom',value===promptDefaults[key]?'Mặc định':'Đã tùy chỉnh'));
            const icon=button('Chỉnh sửa',()=>{},'↥').querySelector('svg');if(icon)row.append(icon);
            advanced.append(row);
        }
        const advancedCard=section('Cài đặt nâng cao',advanced,ui.advancedCollapsed??true);
        advancedCard.addEventListener('toggle',()=>{ui.advancedCollapsed=!advancedCard.open;});root.append(advancedCard);
    } else if(ui.page==='preset') {
        const bar=toolbar('preset');const chooser=el('div','preset-choice');chooser.append(el('span','muted','Chọn Preset'),select('Chọn Preset',state.presets.map(id=>({id,name:id})),selection.presetId||state.preset?.id,id=>act('selection.update',{presetId:id,promptOverrides:{},groupOverrides:{}})));bar.append(chooser);root.append(bar,saveHint('preset'));
        for(const item of state.preset?.display||[]){if(item.type==='prompt'){const entry=item.entry;root.append(row(entry.name||entry.identifier,entry.content,entry.enabled,v=>change('promptOverrides',entry.identifier,v)));continue;}const group=item.group;const content=el('div','section-body');const groupToggle=toggleSwitch('Bật '+group.name,group.enabled,value=>change('groupOverrides',group.id,value));for(const entry of group.entries)content.append(row(entry.name||entry.identifier,entry.content,entry.enabled,v=>change('promptOverrides',entry.identifier,v)));const card=section(group.name,content,ui.collapsed?.[group.id]??group.collapsed);card.classList.add('switch-card');const summary=card.querySelector('summary');summary.replaceChildren(el('span','group-title',group.name),groupToggle);card.addEventListener('toggle',()=>{(ui.collapsed??={})[group.id]=!card.open;});root.append(card);}
    } else {
        root.append(toolbar('world'),saveHint('world'));
        const bindings=[['Worldbook toàn cục',state.bindings.global],['Worldbook nhân vật',state.bindings.character],['Worldbook chat',state.bindings.chat],['Worldbook nhân vật người dùng',state.bindings.persona],['Worldbook được bật bởi plugin',selection.extraBooks]];
        for(const [label,names] of bindings){if(!names?.length&& !['Worldbook toàn cục','Worldbook nhân vật','Worldbook được bật bởi plugin'].includes(label))continue;const content=el('div','section-body');
            if(!names?.length)content.append(el('p','hint','Chưa mount Worldbook nào'));
            for(const name of names||[]){const book=el('details','book');book.open=ui.openBooks?.[name]??false;book.addEventListener('toggle',()=>{(ui.openBooks??={})[name]=book.open;});const heading=el('summary','book-heading');heading.append(el('span','',name),toggleSwitch(name,selection.bookOverrides[name]!==false,v=>change('bookOverrides',name,v)));book.append(heading);for(const [uid,entry] of Object.entries(state.books[name]?.entries||{})){const key=entryKey(name,entry.uid??uid);book.append(row(entry.comment||`Entry ${uid}`,entry.content,selection.entryOverrides[key]??!entry.disable,v=>change('entryOverrides',key,v)));}content.append(book);}
            root.append(section(label,content));}
        const add=button('Thêm Worldbook',()=>{
            const dialog=el('dialog','detail-dialog');dialog.append(el('h2','','Thêm Worldbook'));const search=el('input');search.placeholder='Tìm kiếm Worldbook';search.setAttribute('aria-label','Tìm kiếm Worldbook');const list=el('div','book-picker');
            const draw=()=>{list.replaceChildren();for(const name of state.bookNames.filter(n=>n.toLowerCase().includes(search.value.toLowerCase()))){const selected=selection.extraBooks.includes(name);list.append(check(name,selected,async v=>{await act('selection.update',{extraBooks:v?[...selection.extraBooks,name]:selection.extraBooks.filter(x=>x!==name)});dialog.close();}));}};
            search.addEventListener('input',draw);dialog.append(search,list,button('Hoàn thành',()=>dialog.close()));document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());draw();dialog.showModal();
        });add.className='primary add-book';root.append(add);
    }
    if(state.error)root.append(el('p','error',state.error));
}