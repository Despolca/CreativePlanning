import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateSettings, planningMessages, writingMessages } from '../src/planning/core.js';
import { cleanSettings } from '../src/bridge/protocol.js';

test('editable prompts include all instructions and replace them without hidden fixed rules',()=>{
    const initial=migrateSettings({});
    assert.match(initial.plannerPrompt,/6\. Nội dung bàn giao/);
    assert.match(initial.writerPrompt,/Kế hoạch không nhắc lại một yêu cầu nào đó không có nghĩa là yêu cầu đó mất hiệu lực/);
    const custom=migrateSettings({...initial,...cleanSettings({plannerPrompt:'Kế hoạch tùy chỉnh',writerPrompt:'Văn bản chính tùy chỉnh'})});
    const config={...custom,openTag:'<Think>',closeTag:'</Think>'};
    assert.equal(planningMessages([],config).at(-1).content,'Kế hoạch tùy chỉnh\nVui lòng đặt toàn bộ kế hoạch vào tag được chỉ định bởi Preset hiện tại: <Think>Nội dung kế hoạch</Think>.');
    assert.equal(writingMessages([],'Kế hoạch thử nghiệm',config).at(-1).content,'Văn bản chính tùy chỉnh\n\n[Kế hoạch Sáng tác lượt này]\n<Think>\nKế hoạch thử nghiệm\n</Think>');
    assert.equal(migrateSettings(custom).plannerPrompt,'Kế hoạch tùy chỉnh');
    const legacy=migrateSettings({plannerInstruction:'Phần mở đầu tùy chỉnh cũ',writerInstruction:'Phần mở đầu văn bản chính cũ'});
    assert.ok(legacy.plannerPrompt.startsWith('Phần mở đầu tùy chỉnh cũ\n'));
    assert.ok(legacy.writerPrompt.startsWith('Phần mở đầu văn bản chính cũ\n'));
});

test('empty editable prompts are preserved and RPC rejects non-string prompt fields',()=>{
    assert.deepEqual(cleanSettings({plannerPrompt:123,writerPrompt:[]}),{});
    const state=migrateSettings({...migrateSettings({}),plannerPrompt:'',writerPrompt:''});
    assert.equal(state.plannerPrompt,'');assert.equal(state.writerPrompt,'');
});

test('previous complete default upgrades while customized prompts remain intact',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {defaults,promptDefaults}=await import('../src/planning/core.js');
 const backup=await readFile(new URL('../docs/prompt-backups/dev27-planner-guidance.txt',import.meta.url),'utf8');
 const old=defaults.plannerInstruction+'\n'+backup.slice(backup.indexOf('`')+1,backup.lastIndexOf('`')).replace(/\r\n/g,'\n');
 assert.equal(migrateSettings({plannerPrompt:old}).plannerPrompt,promptDefaults.plannerPrompt);
 assert.equal(migrateSettings({plannerPrompt:old+' Tùy chỉnh'}).plannerPrompt,old+' Tùy chỉnh');
 assert.match(promptDefaults.plannerPrompt,/Không gộp, đổi tên hoặc thay thế lẫn nhau do chủ đề tương tự/);
});