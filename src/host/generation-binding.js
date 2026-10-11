/* Liên kết sự kiện tạo: Việc kết thúc stream có thể diễn ra sớm hơn việc nhận tin nhắn, tiến hành liên kết dựa theo yêu cầu, chat, số tầng và loại tạo. */
export function createGenerationBinding(host) {
    let staged;
    const discard=()=>{if(staged)host.discard(staged.requestId);staged=null;};
    return {
        stage(record){discard();staged=record;},
        started:discard,
        stopped:discard,
        ended(){ /* MESSAGE_RECEIVED follows GENERATION_ENDED in streaming finalization. */ },
        async received(id,type){
            if(!staged)return;
            if(staged.chatId!==host.identity()||host.isAborted?.()){discard();return;}
            if(!['normal','regenerate','swipe',undefined].includes(type)||id!==staged.expectedMessageId)return;
            const record=staged;staged=null;
            await host.bind(record,id);
        },
    };
}