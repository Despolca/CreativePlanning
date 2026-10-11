import test from 'node:test';
import assert from 'node:assert/strict';
import { createMessagePlans } from '../src/host/message-plans.js';
test('live planning and errors render under user without persisting partial text',()=>{
    const messages=[{is_user:true,mes:'Nhập'}];let view;
    const service=createMessagePlans({chatId:()=> 'c',messages:()=>messages,display:()=>true,render:r=>view=r,save:()=>assert.fail('partial must not persist')});
    service.updateLive({chatId:'c',expectedMessageId:1,text:'',phase:'preparing'});
    assert.equal(view[0].messageId,0);
    service.updateLive({chatId:'c',expectedMessageId:1,text:'Kế hoạch một phần',phase:'streaming'});
    assert.equal(view[0].text,'Kế hoạch một phần');
    service.updateLive({chatId:'c',expectedMessageId:1,text:'Kế hoạch một phần',phase:'error',error:'Yêu cầu thất bại'});
    service.discard();assert.equal(view[0].error,'Yêu cầu thất bại');
    assert.equal(messages[0].extra,undefined);
    service.dispose();assert.deepEqual(view,[]);
});
test('plans persist per swipe without editing body and never bind a cancelled or foreign result',async()=>{
    const message={mes:'Văn bản chính',swipe_id:0,extra:{},swipe_info:[{extra:{}}]};let saved=0,chatId='c';
    const view=[];
    const service=createMessagePlans({chatId:()=>chatId,messages:()=>[{mes:'Người dùng nhập',is_user:true},message],save:async()=>saved++,display:()=>true,render:records=>view.push(records)});
    service.stage({version:1,requestId:'r',chatId:'c',text:'<script>bad</script>',openTag:'<Think>',closeTag:'</Think>'});
    await service.bind({requestId:'r',messageId:1,swipeId:0});
    assert.equal(view.at(-1)[0].messageId,0);assert.equal(message.mes,'Văn bản chính');assert.equal(saved,1);
    assert.equal(message.extra.czghCreativePlanning['0'].text,'<script>bad</script>');
    message.swipe_id=1;service.render();assert.equal(view.at(-1).length,0);
    message.swipe_id=0;message.mes='Đã chỉnh sửa';service.render();assert.equal(view.at(-1)[0].stale,true);
    service.stage({requestId:'x',chatId:'c',text:'Hủy'});service.discard('x');await service.bind({requestId:'x',messageId:1,swipeId:0});assert.equal(saved,1);
    service.stage({requestId:'z',chatId:'c',text:'Chat khác'});chatId='other';await service.bind({requestId:'z',messageId:1,swipeId:0});assert.equal(saved,1);
});


test('only latest user floor is rendered; new input removes older floor without deleting saved chat data',()=>{
    const messages=[{is_user:true,mes:'first'},{mes:'body',extra:{czghCreativePlanning:{0:{text:'old'}}}},{is_user:true,mes:'second'}];let view;
    const service=createMessagePlans({chatId:()=> 'c',messages:()=>messages,display:()=>true,save:async()=>{},render:r=>view=r});
    service.render();assert.deepEqual(view,[]);
    service.updateLive({chatId:'c',expectedMessageId:3,phase:'streaming',text:'latest'});
    assert.equal(view.length,1);assert.equal(view[0].messageId,2);assert.equal(view[0].text,'latest');
    assert.equal(messages[1].extra.czghCreativePlanning[0].text,'old');
});