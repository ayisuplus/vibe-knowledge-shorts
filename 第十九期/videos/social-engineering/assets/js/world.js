import { B, ERA, BEAT } from "./beats.js";
import { C, text, line } from "./rig.js";

// 画布每一帧都从空白开始；状态仅由 t 计算，跳帧不会留下上一段的元素。
export function build() {
  const canvas=document.getElementById("cv"), ctx=canvas.getContext("2d");
  const hud=document.getElementById("hud");
  hud.innerHTML='<div class="watermark">VIBE 知识大赏</div><div class="era"></div><div class="mark"></div><div class="note"></div>';
  const era=hud.querySelector(".era"), mark=hud.querySelector(".mark"), note=hud.querySelector(".note");
  function begin(t) {
    const dpr=window.devicePixelRatio||1, w=Math.round(1920*dpr), h=Math.round(1080*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";
    const pulse=.5+.5*Math.sin(t*.22), glow=ctx.createRadialGradient(900+28*Math.sin(t*.13),440,50,900,440,850);
    glow.addColorStop(0,`rgba(216,142,91,${.12+.025*pulse})`);glow.addColorStop(1,"rgba(216,142,91,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,1920,900);
    // 延续 B 样张的暖色幕布；缓慢摆动只依赖当前 t。
    const sway=12*Math.sin(t*.18);ctx.fillStyle="#8b4831b8";
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(430+sway,0);ctx.bezierCurveTo(364+sway,167,238,260,0,337);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(1920,0);ctx.lineTo(1490-sway,0);ctx.bezierCurveTo(1556-sway,167,1682,260,1920,337);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#d2a58222";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(90,866);ctx.lineTo(1830,866);ctx.stroke();
    for(let i=0;i<20;i++){const x=110+(i*307)%1700+9*Math.sin(t*.16+i), y=150+(i*137)%560+8*Math.sin(t*.23+i*1.7), a=.13+.11*(.5+.5*Math.sin(t*.5+i));ctx.fillStyle=`rgba(232,189,145,${a})`;ctx.beginPath();ctx.arc(x,y,1.4+(i%3)*.45,0,Math.PI*2);ctx.fill();}
    let label=ERA[0][1];for(const [start,s] of ERA)if(t>=start)label=s;era.textContent=label;
    const n=t/BEAT;mark.textContent=n<26||n>=234&&n<298?"情节示意":n<114?"模型示意":n<298?"资料示意":"模型 / 情节示意";
    note.textContent="";
  }
  function setNote(s){note.textContent=s||"";}
  return {canvas,ctx,begin,setNote};
}
