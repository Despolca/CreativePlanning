/* Bộ điều hợp macro chỉ đọc công khai của BaiBaiBook: Chỉ vật chất hóa các macro được tham chiếu trực tiếp bởi dữ liệu đã chọn, không quét cơ sở dữ liệu riêng tư của plugin. */
import { resolvePreset } from '../planning/presets.js?v=0.5.0';
import { entryKey } from '../planning/world-info.js?v=0.5.0';
export async function materializePluginMacros(snapshot, selection, api) {
    const result=structuredClone(snapshot);result.macroEnvironment.pluginMacros={};
    if(!selection.compatibilityIds?.includes('baibai'))return result;
    const texts=resolvePreset(snapshot,selection).execution.map(e=>e.content||'');
    const books=new Set([...Object.values(snapshot.bindings).flat(),...(selection.extraBooks||[])]);
    for(const name of books)if(selection.bookOverrides?.[name]!==false)for(const [uid,e] of Object.entries(snapshot.books[name]?.entries||{}))if(selection.entryOverrides?.[entryKey(name,e.uid??uid)]??!e.disable)texts.push(e.content||'',...(e.key||[]),...(e.keysecondary||[]));
    const tokens=new Set(texts.flatMap(text=>[...text.matchAll(/{{\s*(bbs[^{}]*?)\s*}}/gi)].map(m=>m[1])));
    const numeric=value=>{if(value===undefined||value==='')return undefined;const n=Number(value);if(!Number.isInteger(n)||n<0)throw Error('Số tầng macro của BaiBaiBook phải là số nguyên không âm.');return n;};
    const options=(floor,at)=>{if(at!==undefined&&!['before','after',''].includes(at))throw Error('Thời điểm macro của BaiBaiBook phải là before hoặc after.');return {floor:numeric(floor),at:at||undefined};};
    for(const token of tokens){
        const [raw,...args]=token.split('::'),name=raw.trim().toLowerCase();let value;
        if(!api)throw Error('Preset đã tham chiếu macro của BaiBaiBook, nhưng không phát hiện thấy giao diện công khai của BaiBaiBook.');
        if(name==='bbsvar')value=await api.getVar(args[0],options(args[1],args[2]));
        else if(name==='bbssnapshot')value=await api.getSnapshot(options(args[0],args[1]));
        else if(name==='bbsvars')value=(await api.getSnapshot()).vars;
        else if(name==='bbsstate')value=(await api.getSnapshot()).state;
        else if(name==='bbshistory')value=(await api.getHistory({before:numeric(args[0])})).relativeText;
        else if(name==='bbsinjectedhistory')value=(await api.getInjectedHistory()).relativeText;
        else if(name==='bbsfloor')value=await api.getFloor(numeric(args[0]));
        else throw Error(`Chưa hỗ trợ macro của BaiBaiBook ${raw}.`);
        result.macroEnvironment.pluginMacros[token]=value==null?'':typeof value==='string'?value:JSON.stringify(value);
    }
    return result;
}