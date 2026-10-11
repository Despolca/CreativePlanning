/* Bản sao xem trước ngữ cảnh: Việc hợp nhất hiển thị không làm thay đổi request, token chỉ là ước tính heuristic dựa trên ký tự. */
export function previewMessages(messages,compress=false){
 const result=[];
 for(const item of messages){const message=structuredClone(item),previous=result.at(-1);if(compress&&previous&&message.role===previous.role&&typeof message.content==='string'&&typeof previous.content==='string'&&Object.keys(message).every(k=>['role','content'].includes(k))&&Object.keys(previous).every(k=>['role','content'].includes(k)))previous.content+='\n\n'+message.content;else result.push(message);}
 return result;
}
export function estimateTokens(messages){
 return messages.reduce((sum,m)=>{const text=typeof m.content==='string'?m.content:JSON.stringify(m.content);const cjk=(text.match(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/gu)||[]).length;return sum+cjk+Math.ceil((text.length-cjk)/4)+4;},3);
}