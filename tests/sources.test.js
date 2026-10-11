import test from 'node:test';
import assert from 'node:assert/strict';
import { captureSources } from '../src/host/sources.js';
test('source capture clones inputs, includes auxiliary/chat books and rejects a switched chat',async()=>{
    const ctx={chatId:'chat',characterId:0,characters:[{avatar:'c.png',name:'Nhân vật',data:{extensions:{world:'primary'}}}],chat:[{is_user:true,mes:'hello'}],chatMetadata:{world_info:'chatbook'},extensionPrompts:{foreign:{value:'secret',filter:()=>true}},name1:'Người chơi',name2:'Nhân vật'};
    const world={world_names:['primary','aux','global','chatbook'],selected_world_info:['global'],world_info:{charLore:[{name:'c',extraBooks:['aux']}]},getWorldInfoSettings:()=>({}),loadWorldInfo:async()=>({entries:{}})};
    const manager={getPresetList:()=>({presets:[{prompts:[],prompt_order:[]}],preset_names:{P:0}}),getSelectedPresetName:()=> 'P'};
    const host={context:()=>ctx,world,manager,openai:{oai_settings:{prompts:[],prompt_order:[],active:true}},powerUser:{}};
    const s=await captureSources(host,{});
    assert.deepEqual(s.bindings,{global:['global'],character:['primary','aux'],chat:['chatbook'],persona:[]});
    assert.equal(s.history[0].content,'hello');
    assert.ok(Object.isFrozen(s));
    assert.equal(s.presets.P.active,true);
    assert.equal(s.macroEnvironment.lastusermessage,'hello');
    ctx.maxContext=2048;ctx.chatCompletionSettings={openai_max_context:32000};
    assert.equal((await captureSources(host,{})).maxContext,32000);
    ctx.chat[0].mes='changed'; assert.equal(s.history[0].content,'hello');
    world.loadWorldInfo=async()=>{ctx.chatId='another';return{entries:{}};};
    await assert.rejects(captureSources(host,{}),/chat/i);
});


test('swipe excludes replaced response before history macros, regenerate uses already-trimmed host history',async()=>{
    const ctx={chatId:'c',chat:[{mes:'Phản hồi trước đó'},{is_user:true,mes:'Đầu vào lượt này'},{mes:'Phản hồi thay thế cũ',extra:{image:'old'}}],chatMetadata:{}};
    const host={context:()=>ctx,manager:{getPresetList:()=>({}),getSelectedPresetName:()=>''},world:{loadWorldInfo:async()=>({entries:{}})},openai:{},powerUser:{}};
    const swipe=await captureSources(host,{generationType:'swipe'});
    assert.deepEqual(swipe.history.map(m=>m.content),['Phản hồi trước đó','Đầu vào lượt này']);
    assert.equal(swipe.userInput,'Đầu vào lượt này');assert.equal(swipe.macroEnvironment.lastmessage,'Đầu vào lượt này');
    assert.equal(swipe.macroEnvironment.lastcharmessage,'Phản hồi trước đó');assert.equal(swipe.capabilities.media,false);
    assert.equal(ctx.chat.length,3);
    ctx.chat[1].extra={files:[{name:'Tệp đính kèm.txt'}]};
    assert.equal((await captureSources(host,{generationType:'swipe'})).capabilities.media,true);
    delete ctx.chat[1].extra;
    ctx.chat.pop();
    assert.deepEqual((await captureSources(host,{generationType:'regenerate'})).history,swipe.history);
    // ST already removes the replaced reply, even if the preceding message is another assistant.
    ctx.chat=[{mes:'Phản hồi trước đó được giữ lại'}];
    assert.equal((await captureSources(host,{generationType:'regenerate'})).history.length,1);
});