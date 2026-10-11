/* Bản sao yêu cầu kết nối hiện tại: Đóng băng tham chiếu key đang hoạt động, xóa công cụ văn bản chính và thiết lập nhiều ứng viên, ngăn chặn tham số bổ sung ghi đè dữ liệu. */
export function freezeCurrentRequest(data, secrets, parseYaml) {
    const secretKeys={custom:'api_key_custom',openai:'api_key_openai',openrouter:'api_key_openrouter',groq:'api_key_groq',deepseek:'api_key_deepseek'};
    const key=secretKeys[data.chat_completion_source];
    if(!key)throw Error('Định dạng trả về của kết nối hiện tại chưa được hỗ trợ, vui lòng chọn scheme API tương thích.');
    const request=structuredClone(data);
    const protectedFields=new Set(['messages','prompt','model','stream','max_tokens','max_completion_tokens','n','tools','tool_choice','functions','function_call','secret_id','chat_completion_source','custom_url','reverse_proxy','proxy_password']);
    for(const field of ['custom_include_body','custom_exclude_body'])if(request[field]?.trim()){
        const parsed=parseYaml(request[field]);
        if(!parsed||typeof parsed!=='object')throw Error('Cấu trúc tham số bổ sung của kết nối hiện tại không hợp lệ.');
        const keys=field==='custom_exclude_body'?(Array.isArray(parsed)?parsed:[]):Object.keys(parsed);
        if(field==='custom_exclude_body'&&!Array.isArray(parsed)||field==='custom_include_body'&&Array.isArray(parsed)||keys.some(k=>protectedFields.has(k)))throw Error('Tham số bổ sung của kết nối hiện tại sẽ ghi đè dữ liệu kế hoạch hoặc thiết lập đầu ra, vui lòng sử dụng scheme độc lập.');
    }
    request.secret_id=request.secret_id||secrets[key]?.find(item=>item.active)?.id||'czgh-no-active-secret';
    request.messages=[];request.stream=false;request.n=1;
    for(const field of ['tools','tool_choice','functions','function_call','max_completion_tokens'])delete request[field];
    return request;
}