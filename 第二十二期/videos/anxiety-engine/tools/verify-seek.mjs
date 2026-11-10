// 从前向后、从后向前跳到同一时间，验证画面不依赖上一帧。
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import http from "node:http";
import os from "node:os";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
const base=resolve(fileURLToPath(new URL("..",import.meta.url)));
const types={".html":"text/html",".js":"text/javascript",".css":"text/css",".ttf":"font/ttf",".m4a":"audio/mp4"};
const server=http.createServer((req,res)=>{const p=resolve(base,"."+decodeURIComponent(req.url.split("?")[0]));if(!p.startsWith(base)||!existsSync(p)){res.writeHead(404);return res.end();}res.writeHead(200,{"content-type":types[extname(p)]||"application/octet-stream"});res.end(readFileSync(p));}).listen(0);
const chromes=join(os.homedir(),".cache/puppeteer/chrome-headless-shell"),version=readdirSync(chromes).sort().pop();
const browser=await puppeteer.launch({executablePath:join(chromes,version,"chrome-headless-shell-win64/chrome-headless-shell.exe"),args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]});
try{
  const page=await browser.newPage();await page.setViewport({width:1920,height:1080});const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:"networkidle0"});
  await page.waitForFunction(()=>window.__timelines?.main?.duration()>0,{timeout:30000});await page.evaluate(()=>document.fonts.ready);
  const info=await page.evaluate(()=>({caps:window.CAPTIONS.length,dom:document.querySelectorAll(".caption").length,overflow:[...document.querySelectorAll(".caption")].filter(e=>e.scrollWidth>e.clientWidth).map(e=>e.textContent)}));
  if(info.caps!==39||info.dom!==38||info.overflow.length)throw Error(`字幕布局异常: ${JSON.stringify(info)}`);
  const digest=buf=>createHash("sha256").update(buf).digest("hex");
  let worstMax=0,worstChanged=0;
  for(const t of [3,8,12,16,21,25,30,36,41,47,52,58,63,68,73,77,81,86,92,97,103,108,112,116,120,124,128,133,138,142,146,151,156,161,165,170,174,177,179]){
    await page.evaluate(t=>{window.__timelines.main.seek(t,false);return 1;},t);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const first=await page.screenshot();const a=digest(first);
    await page.evaluate(t=>{window.__timelines.main.seek(Math.min(t+2.37,179),false);return 1;},t);
    await page.evaluate(t=>{window.__timelines.main.seek(t,false);return 1;},t);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const second=await page.screenshot();const b=digest(second);
    if(a!==b){
      const one=await sharp(first).removeAlpha().raw().toBuffer(),two=await sharp(second).removeAlpha().raw().toBuffer();
      let changed=0,max=0;for(let i=0;i<one.length;i+=3){let delta=0;for(let c=0;c<3;c++)delta=Math.max(delta,Math.abs(one[i+c]-two[i+c]));if(delta){changed++;max=Math.max(max,delta);}}
      worstMax=Math.max(worstMax,max);worstChanged=Math.max(worstChanged,changed);
      // GPU 文字抗锯齿可能产生少量 1–2/255 量化差；任何可见的画面差异都不能通过。
      if(max>2||changed>1920*1080*.0001){writeFileSync(resolve(base,`snapshots/seek-${t}-a.jpg`),first);writeFileSync(resolve(base,`snapshots/seek-${t}-b.jpg`),second);throw Error(`跳帧后不一致: ${t}s，变化 ${changed} 像素、最大差 ${max}/255`);}
    }
  }
  if(errors.length)throw Error(`页面错误: ${errors.join("; ")}`);
  console.log(`通过：39 个位置前后跳帧等效；最大量化差 ${worstMax}/255、最多 ${worstChanged} 像素；39 句字幕、38 条字幕层，无横向溢出。`);
}finally{await browser.close();server.close();}
