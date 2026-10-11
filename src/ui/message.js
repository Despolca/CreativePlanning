/* Chế độ xem kế hoạch trong luồng: Render văn bản an toàn, tiếp nhận năm mục theme và báo cáo chiều cao. */
import {CHANNEL,THEME_KEYS,acceptsMessage} from '../bridge/protocol.js?v=0.5.0';
import { appearanceIcon, generationIcon, setIcon } from './icons.js?v=0.5.0';
appearanceIcon(document.querySelector('#appearance'));
setIcon(document.querySelector('#resume'),'reply');
document.querySelector('#resume').addEventListener('click',event=>{event.preventDefault();event.stopPropagation();document.querySelector('#resume').disabled=true;parent.postMessage({channel:CHANNEL,type:'resume'},location.origin);});
const details=document.querySelector('details');
const resize=()=>parent.postMessage({channel:CHANNEL,type:'height',payload:document.body.scrollHeight+4},location.origin);
window.addEventListener('message',event=>{
    if(!acceptsMessage(event,parent,location.origin))return;
    const {type,payload}=event.data;
    const theme=type==='plan'?payload.theme:type==='theme'?payload:null;
    if(theme)for(const key of THEME_KEYS)if(typeof theme[key]==='string'&&theme[key])document.documentElement.style.setProperty(key,theme[key]);
    if(type==='appearance'||type==='plan'){const mode=type==='plan'?payload.appearance||'auto':payload;document.documentElement.dataset.appearance=mode;appearanceIcon(document.querySelector('#appearance'),mode);}
    if(type==='plan') {
        const record=payload.record;
        document.querySelector('#resume').disabled=record.phase!=='awaiting';
        generationIcon(document.querySelector('#cancel'),['waiting','preparing','streaming'].includes(record.phase));
        document.querySelector('#cancel').disabled=!['waiting','preparing','streaming','awaiting'].includes(record.phase);
        const labels={awaiting:'Chờ tạo văn bản chính',waiting:'Chờ kế hoạch bắt đầu',preparing:'Đang chuẩn bị dữ liệu',streaming:'Đang tạo',error:'Tạo thất bại',cancelled:'Đã dừng',skipped:'Lượt này không tạo kế hoạch'};
        document.querySelector('#phase').textContent=record.phase?`· ${labels[record.phase]||record.phase}`:'';
        document.querySelector('pre').textContent=record.phase
            ? [record.text,record.error?`Lỗi: ${record.error}`:!record.text?labels[record.phase]:''].filter(Boolean).join('\n\n')
            : `${record.openTag}\n${record.text}\n${record.closeTag}`;
        document.querySelector('#stale').textContent=record.stale?'· Kế hoạch lịch sử (Văn bản chính đã chỉnh sửa)':'';
    }
    requestAnimationFrame(resize);
});
details.addEventListener('toggle',resize);new ResizeObserver(resize).observe(document.body);

document.querySelector('#cancel').addEventListener('click',event=>{event.preventDefault();event.stopPropagation();parent.postMessage({channel:CHANNEL,type:'cancel'},location.origin);});

document.querySelector('#appearance').addEventListener('click',event=>{event.preventDefault();event.stopPropagation();parent.postMessage({channel:CHANNEL,type:'appearance'},location.origin);});