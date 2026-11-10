// 只放置事件；合成与压限由项目共享引擎完成。声音起点均由 B(n) 决定。
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { B, DUR } from "../assets/js/beats.js";
const here=dirname(fileURLToPath(import.meta.url)), repo=resolve(here,"../../../..");
const bgm=resolve(here,"../assets/audio/bgm.m4a"), dt=.025, sr=44100;
const buf=execFileSync("ffmpeg",["-v","error","-i",bgm,"-ac","1","-ar",String(sr),"-f","f32le","-"],{maxBuffer:1<<28});
const pcm=new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)), size=Math.round(sr*dt), env=[];
for(let i=0;i<pcm.length;i+=size){let pk=0;for(let j=i;j<Math.min(pcm.length,i+size);j++)pk=Math.max(pk,Math.abs(pcm[j]));env.push(pk);}
const limitAt=t=>{const i=Math.floor(t/dt),peak=Math.max(env[i-1]||0,env[i]||0,env[i+1]||0);return Math.max(.045,Math.min(.32,.84-peak));};
const fx=await createSfxEngine({dur:DUR,repo,out:resolve(here,"../assets/audio/sfx.m4a"),peakLimit:.32,master:1.25,tail:.3,limitAt});
const notes=[349.23,415.30,466.16,523.25,622.25];
const bell=notes.map(f=>fx.bell(f,1.2));
const put=(snd,n,g,tag,pan=0)=>fx.place(snd,B(n),g,{tag,pan});
for(const [n,i] of [[2,0],[10,2],[26,1],[58,3],[98,2],[114,0],[146,1],[170,2],[186,3],[210,4],[234,1],[266,0],[274,3],[298,2],[306,4],[328,3]]) put(bell[i],n,.095,"chapter",0);
for(const n of [18,34,42,50,66,74,82,90,106,122,130,138,154,162,178,194,202,218,226,242,250,258,282,290,314]) put(fx.knock,n,.095,"wood",(n%3-1)*.3);
for(const n of [30,32,92,94,204,206,208,276,278,292,294]) put(fx.tick,n,.055,"detail",(n%4-1.5)*.25);
for(const [n,f,seed] of [[38,349.23,1],[62,415.30,2],[86,466.16,3],[158,523.25,4],[222,415.30,5],[286,349.23,6],[310,523.25,7]]) put(fx.pluck(f,seed).snd,n,.065,"pluck");
const result=await fx.finalize();
console.log(`拟音 ${result.events} 事件；峰值 ${result.pkAfter.toFixed(4)}；五秒窗口 ${result.bins.join(",")}`);
