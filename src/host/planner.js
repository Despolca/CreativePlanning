/* Trình điều khiển kế hoạch trang chính: Gọi API độc lập, lắng nghe quá trình tạo, duy trì trạng thái hủy; không thao tác UI DOM. */
import { readPlanResponse } from './stream.js?v=0.5.0';
import { createId } from '../bridge/id.js?v=0.5.0';
import { migrateSettings, resolvePlanningTags, validateSettings, planningMessages, writingMessages, extractPlan, eligibleRequest, unresolvedBaiBaiMacros } from '../planning/core.js?v=0.5.0';
import { resolveProfile, profileRequest } from '../planning/profiles.js?v=0.5.0';
export function createPlanner({ getContext, getRequestHeaders, stopGeneration, getYaml = () => null, onState = () => {}, prepare, onPlanReady = () => {}, onDiscard = () => {}, onProgress = () => {}, onDiagnostics = () => {} }) {
const state = {status: '', preview: ''};
const ID = 'czgh_external_planner';
const ctx = getContext;
let apiKey = ''; // Session only; never written to extension settings or logs.
let pending = null;
let diagnostics = null;
const statusNode = { set textContent(value) { state.status = value; onState({ ...state }); } };
const previewNode = { set value(value) { state.preview = value; onState({ ...state }); } };

let skipOnce = false;
const processed = new WeakSet();

function settings() { return ctx().extensionSettings[ID]; }
function status(text) { if (statusNode) statusNode.textContent = text; }
function chatIdentity() {
    const c = ctx();
    return JSON.stringify([c.chatId, c.characterId, c.groupId]);
}
// Compare only message structure and selected content; unrelated plugin metadata is not an edit.
function chatContentSnapshot() {
    return JSON.stringify((ctx().chat || []).map(message => ({
        user: !!message.is_user, system: !!message.is_system, name: message.name ?? '',
        mes: message.mes ?? '', content: message.content ?? null,
        swipe: message.swipe_id ?? 0,
        selectedSwipe: message.swipes?.[message.swipe_id ?? 0] ?? null,
    })));
}
function abortPending() {
    const run=pending;if(!run)return;pending=null;run.controller.abort();
    onDiscard(run.requestId);
    if(run.identity===chatIdentity()){
        onProgress({...run.record,phase:'cancelled',error:'Kế hoạch đã dừng, chưa tiêm vào văn bản chính.'});
        status('Kế hoạch đã dừng; yêu cầu văn bản chính đã bị hủy.');
    }
}

async function requestPlan(messages, config, key, signal, progress, requestReady) {
    let body;
    if (config.request) {
        body = { ...structuredClone(config.request), messages, stream: false, max_tokens: Number(config.maxTokens) };
        delete body.tools; delete body.tool_choice; delete body.functions; delete body.function_call;
    } else if (config.profile) {
        const yaml = getYaml();
        body = profileRequest(config.profile, messages, config.maxTokens, text => {
            if (yaml?.parse) return yaml.parse(text);
            return JSON.parse(text);
        });
        const keysResponse = await fetch('/api/secrets/read', { method: 'POST', headers: getRequestHeaders(), body: '{}', signal });
        if (!keysResponse.ok) throw new Error('Không thể đối chiếu tham chiếu key của scheme, vui lòng kiểm tra trình quản lý key của SillyTavern.');
        const keys = (await keysResponse.json()).api_key_custom;
        if (!Array.isArray(keys) || !keys.some(item => item.id === config.profile.secretId)) throw new Error('Key mà scheme tham chiếu đã không còn tồn tại; chưa sử dụng key khác.');
    } else {
        body = {
            chat_completion_source: 'custom',
            custom_url: config.apiUrl.replace(/\/+$/, '').replace(/\/chat\/completions$/, ''),
            custom_include_headers: key ? `Authorization: ${JSON.stringify(`Bearer ${key}`)}` : '',
            model: config.model, messages, stream: false, max_tokens: Number(config.maxTokens),
        };
    }
    body.stream = !!config.stream;
    signal.throwIfAborted();
    requestReady?.(body);
    // Use ST's own backend proxy, without invoking Generate or emitting chat events.
    const response = await fetch('/api/backends/chat-completions/generate', {
        method: 'POST', headers: getRequestHeaders(), signal,
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Yêu cầu API kế hoạch thất bại (HTTP ${response.status}).`);
    const choice = await readPlanResponse(response, text => { signal.throwIfAborted(); progress?.(text); }, signal);
    return extractPlan(choice.message?.content, config, choice.finish_reason);
}

async function onRequest(data) {
    if (!settings().enabled || !eligibleRequest(data) || processed.has(data)) return;
    processed.add(data);
    if (skipOnce) { skipOnce = false; status('Lần này đã bỏ qua kế hoạch bên ngoài, sử dụng preset gốc.'); return; }
    if (pending) {
        abortPending();
        stopGeneration();
        status('Phát hiện yêu cầu chồng chéo, đã dừng; vui lòng gửi lại.');
        return;
    }
    const config = structuredClone(settings());
    const original = structuredClone(data.messages);
    const run = { controller: new AbortController(), identity: chatIdentity(), requestId: createId() };
    pending = run;
    const record = { requestId: run.requestId, chatId: run.identity, expectedMessageId: data.type === 'swipe' ? (ctx().chat?.length || 1)-1 : (ctx().chat?.length || 0), text: '', phase: 'preparing', mainStream: data.stream };
    run.record=record;
    diagnostics=null;onDiagnostics(null);
    onProgress(record);
    const timer = setTimeout(() => run.controller.abort(), Number(config.timeoutSeconds) * 1000);
    previewNode.value = '';
    try {
        let contextMessages = original;
        let prepared;
        if (prepare) {
            prepared = await prepare({ data: structuredClone(data), config, signal: run.controller.signal });
            contextMessages = prepared.messages;
            config.request = prepared.request;
            config.profile = prepared.profile;
            config.apiUrl = prepared.apiUrl || prepared.request?.custom_url || prepared.profile?.connection?.custom_url || 'https://api.openai.com/v1';
            config.model = prepared.request?.model || prepared.profile?.model || prepared.model || config.model;
        } else if (config.profileId) {
            config.profile = resolveProfile(ctx().extensionSettings, config.profileId);
            config.apiUrl = config.profile.connection.custom_url;
            config.model = config.profile.model;
        }
        run.controller.signal.throwIfAborted();
        if(pending!==run||run.identity!==chatIdentity())throw new Error('Lượt này đã mất hiệu lực.');
        Object.assign(config, resolvePlanningTags(contextMessages, config));
        validateSettings(config);
        if (unresolvedBaiBaiMacros(contextMessages)) throw new Error('Phát hiện macro BaiBaiBook chưa được mở rộng, vui lòng kiểm tra cài đặt macro rồi thử lại.');
        status(`Đang tạo kế hoạch lượt này theo ${config.openTag}...${config.closeTag}; sau khi hoàn thành sẽ tự động tiếp tục văn bản chính...`);
        const plan = await requestPlan(planningMessages(contextMessages, config), config, apiKey, run.controller.signal, text => { if(pending!==run||run.identity!==chatIdentity())return;previewNode.value=text;record.text = text; record.phase = 'streaming'; onProgress(record); }, body=>{
            diagnostics={requestId:run.requestId,createdAt:new Date().toISOString(),model:body.model,stream:body.stream,maxTokens:body.max_tokens,sourceManifest:prepared?.sourceManifest||null,messages:structuredClone(body.messages)};
            onDiagnostics(diagnostics);
        });
        if (run.controller.signal.aborted || run.identity !== chatIdentity()) throw new Error('Lượt này đã bị hủy hoặc chat đã chuyển đổi.');
        clearTimeout(timer);
        if(config.autoReply===false){
            previewNode.value=`${config.openTag}\n${plan}\n${config.closeTag}`;
            record.text=plan;record.phase='awaiting';
            const chatSnapshot=chatContentSnapshot();
            await new Promise((resolve,reject)=>{
                const abort=()=>reject(new Error('Lượt này đã bị hủy.'));
                run.resume=()=>{run.controller.signal.removeEventListener('abort',abort);resolve();};
                run.controller.signal.addEventListener('abort',abort,{once:true});
                status('Kế hoạch đã hoàn thành, chờ nhấp vào "Tạo phản hồi văn bản chính".');onProgress(record);
            });
            run.controller.signal.throwIfAborted();
            if(pending!==run||run.identity!==chatIdentity()||chatContentSnapshot()!==chatSnapshot)throw Error('Nội dung chat đã thay đổi, vui lòng tạo lại kế hoạch.');
        }
        // Independent mode may not rewrite any original instruction via legacy replacement rules.
        data.messages = writingMessages(original, plan, prepare ? { ...config, rules: '[]' } : config);
        onPlanReady({ version: 1, requestId: run.requestId, chatId: run.identity, text: plan, openTag: config.openTag, closeTag: config.closeTag, createdAt: Date.now(), generationType: data.type || 'normal', expectedMessageId: data.type === 'swipe' ? (ctx().chat?.length || 1) - 1 : (ctx().chat?.length || 0), nextWorldState: prepared?.nextWorldState });
        previewNode.value = `${config.openTag}\n${plan}\n${config.closeTag}`;
        status(`Kế hoạch đã được tiêm (${plan.length} ký tự), đang tạo văn bản chính. Yêu cầu văn bản chính dạng stream: ${data.stream === true ? 'bật' : data.stream === false ? 'tắt' : 'chưa cung cấp'}.`);
    } catch (error) {
        if(pending!==run||run.identity!==chatIdentity())return;
        // ST's event emitter swallows thrown errors. Explicitly abort main generation.
        const wasAborted = run.controller.signal.aborted;
        onDiscard(run.requestId);
        stopGeneration();
        record.phase = wasAborted ? 'cancelled' : 'error'; record.error = wasAborted ? 'Kế hoạch đã dừng hoặc quá thời gian, chưa tiêm vào văn bản chính.' : error.message; onProgress(record);
        status(wasAborted
            ? 'Kế hoạch đã dừng hoặc quá thời gian; chưa tiêm. Có thể gửi lại, hoặc chọn bỏ qua vào lần sau.'
            : `${error.message} Văn bản chính đã dừng; có thể gửi lại hoặc chọn bỏ qua vào lần sau.`);
    } finally {
        clearTimeout(timer);
        if (pending === run) { pending = null; onState({...state}); }
    }
}


const c = ctx();
c.extensionSettings[ID] = migrateSettings(c.extensionSettings[ID]);
const event = c.eventTypes.CHAT_COMPLETION_SETTINGS_READY;
if (event) c.eventSource.on(event, onRequest);
else { settings().enabled = false; status('SillyTavern hiện tại thiếu sự kiện yêu cầu, plugin chưa được kích hoạt.'); }
c.eventSource.on(c.eventTypes.GENERATION_STOPPED, abortPending);
c.eventSource.on(c.eventTypes.CHAT_CHANGED, () => {
 if (pending) { abortPending(); stopGeneration(); }
 diagnostics=null;onDiagnostics(null);
 skipOnce = false; previewNode.value = ''; status('Đã chuyển đổi chat, kế hoạch đã bị xóa.');
});
return {
 getState: () => ({...state,awaitingReply:!!pending?.resume}),
 resume: () => {const run=pending;if(!run?.resume||run.identity!==chatIdentity())return false;const resume=run.resume;run.resume=null;resume();onState({...state,awaitingReply:false});return true;},
 getDiagnostics: () => diagnostics ? structuredClone(diagnostics) : null,
 isPlanning: () => !!pending && !pending.resume,
 setKey: value => { apiKey = value.trim(); },
 stop: () => { if(pending){abortPending();stopGeneration();} },
 settingsChanged: () => { if (!settings().enabled && pending) { abortPending(); stopGeneration(); } },
 skip: () => { skipOnce = !skipOnce; status(skipOnce ? 'Yêu cầu văn bản chính lần sau sẽ bỏ qua kế hoạch.' : 'Đã hoàn tác việc bỏ qua.'); },
};
}