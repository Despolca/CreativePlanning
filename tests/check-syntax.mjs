// Kiểm tra cú pháp trong quá trình phát triển: duyệt toàn bộ JS trong src, không tham gia vào quá trình chạy của plugin.
import { readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
let count=0;
async function check(url){for(const item of await readdir(url,{withFileTypes:true})){const child=new URL(item.name+(item.isDirectory()?'/':''),url);if(item.isDirectory())await check(child);else if(item.name.endsWith('.js')){execFileSync(process.execPath,['--check',fileURLToPath(child)],{stdio:'pipe'});count++;}}}
execFileSync(process.execPath,['--check',fileURLToPath(new URL('../index.js',import.meta.url))]);
await check(new URL('../src/',import.meta.url));
console.log(`PASS syntax: entry and ${count} source modules`);