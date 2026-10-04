import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {handler} from './index.mjs';
const endpoint='https://stickers.example/mcp';
let seq=0;
async function rpc(method,params){
 const req=new Request(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:++seq,method,params})});
 const res=await handler(req);assert.equal(res.status,200);return (await res.json()).result;
}
const init=await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'1'}});
assert.equal(init.protocolVersion,'2025-06-18');
assert.equal((await rpc('tools/list',{})).tools.length,2);
const cases=[['思考','cat-thinking'],['亲亲','puppy-kiss'],['想你','puppy-miss'],['摸头','puppy-pat'],['厉害','puppy-praise'],['遭受打击','cat-hit'],['小吃一惊','cat-surprise'],['宝宝','puppy-baby'],['玫瑰','puppy-flower'],['等下讲你又不高兴','cat-careful']];
for(const [query,wanted] of cases){const r=await rpc('tools/call',{name:'search_stickers',arguments:{query}});assert.equal(r.structuredContent.stickers[0]?.id,wanted,query);}
assert.equal((await rpc('tools/call',{name:'search_stickers',arguments:{query:'量子电动力学'}})).structuredContent.count,0);
assert.equal((await rpc('tools/call',{name:'search_stickers',arguments:{query:'思考',exclude_ids:['cat-thinking']}})).structuredContent.count,0);
assert.equal((await rpc('tools/call',{name:'search_stickers',arguments:{query:'猫',limit:0}})).isError,true);
assert.equal((await rpc('tools/call',{name:'get_sticker',arguments:{id:'../secret'}})).isError,true);
assert.equal((await rpc('tools/call',{name:'get_sticker',arguments:{id:'cat-thinking',include_image:'false'}})).isError,true);
const catalog=JSON.parse(readFileSync(new URL('./catalog.json',import.meta.url))).stickers;
for(const s of catalog){
 const r=await rpc('tools/call',{name:'get_sticker',arguments:{id:s.id}});
 assert.equal(r.content[1].type,'image');assert.ok(r.structuredContent.markdown.includes(r.structuredContent.url));
 const embedded=Buffer.from(r.content[1].data,'base64');
 const image=await handler(new Request(r.structuredContent.url));
 assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');
 const served=Buffer.from(await image.arrayBuffer());assert.deepEqual(served,embedded);
 assert.equal(createHash('sha256').update(served).digest('hex'),s.sha256);
 const cached=await handler(new Request(r.structuredContent.url,{headers:{'If-None-Match':`"${s.sha256}"`}}));assert.equal(cached.status,304);
}
assert.equal((await rpc('tools/call',{name:'get_sticker',arguments:{id:'cat-thinking',include_image:false}})).content.length,1);
const blocked=await handler(new Request(endpoint,{method:'POST',headers:{Origin:'https://evil.example'}}));assert.equal(blocked.status,403);
assert.equal((await handler(new Request(endpoint))).status,405);
const badVersion=await handler(new Request(endpoint,{method:'POST',headers:{'MCP-Protocol-Version':'unknown'}}));assert.equal(badVersion.status,400);
const notification=await handler(new Request(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})}));assert.equal(notification.status,202);
assert.equal(await notification.text(),'');
const malformed=await handler(new Request(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream'},body:'{'}));assert.equal(malformed.status,400);
assert.equal((await handler(new Request('https://stickers.example/stickers/not-real.png'))).status,404);
assert.equal((await handler(new Request('https://stickers.example/health'))).status,200);
console.log('PASS: MCP handshake, 10 semantic searches, exclusions, bounds, unknown ids, all 10 original image hashes, image/text outputs, cache, origin, version, malformed requests and notifications.');
