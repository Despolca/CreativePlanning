import test from 'node:test';
import assert from 'node:assert/strict';
import { expandMacros } from '../src/planning/macros.js';
import { selectInjections } from '../src/planning/compatibility.js';
test('isolated variables expand without writing back and unchecked memory macros are excluded',()=>{
    const snapshot={macroEnvironment:{user:'Người chơi',char:'Nhân vật',bbs:{vars:{'Hảo cảm':5},state:{time:'Buổi sáng'}}},injections:{baibai_book_memory_history:{value:'Chuyện cũ',position:1,depth:2},sp_outline_step:{value:'Đại cương',position:1,depth:3},foreign:{value:'Khác'}}};
    const variables={local:{a:'Giá trị gốc'},global:{}};
    const result=expandMacros('{{setvar::a::Giá trị mới}}{{getvar::a}} {{user}} {{bbsVars}}',{snapshot,compatibilityIds:[],variables});
    assert.equal(result.text,'Giá trị mới Người chơi ');
    assert.equal(variables.local.a,'Giá trị gốc');
    assert.equal(result.variables.local.a,'Giá trị mới');
    assert.ok(result.diagnostics.some(d=>d.code==='excluded-macro'));
    assert.equal(expandMacros('{{bbsVar::Hảo cảm}}',{snapshot,compatibilityIds:['baibai'],variables}).text,'5');
    assert.deepEqual(selectInjections(snapshot,['seven-days']).items.map(x=>x.key),['sp_outline_step']);
    assert.equal(selectInjections(snapshot,['baibai']).items[0].depth,2);
    assert.equal(expandMacros('{{unknown::x}}',{snapshot,compatibilityIds:[],variables}).text,'{{unknown::x}}');
});
test('variable values may contain literal single braces and nested macros',()=>{
    const result=expandMacros('{{setvar::panel::<date>{YYYY/MM/DD}</date> {{user}}}}{{getvar::panel}}',{snapshot:{macroEnvironment:{user:'Người chơi'}},variables:{local:{},global:{}}});
    assert.equal(result.text,'<date>{YYYY/MM/DD}</date> Người chơi');
    assert.equal(result.diagnostics.filter(d=>d.blocking).length,0);
});

test('template placeholders in the reported message remain literal without blocking',()=>{
 const text='{{Mô tả ngắn gọn về hình ảnh/video/nội dung chia sẻ}} {{Macro}} {{Macro}} {{Không}}';
 const result=expandMacros(text,{snapshot:{macroEnvironment:{}}});
 assert.equal(result.text,text);assert.equal(result.diagnostics.some(d=>d.blocking),false);
});