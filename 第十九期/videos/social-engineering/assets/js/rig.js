// 本片的纸偶、道具和线条。每个函数只绘制当前状态，不维护时间或创建 DOM。
export const C = {
  paper: "#eadcc5", paperLight: "#f8ead3", ink: "#362923", muted: "#8f725e",
  cream: "#fff5e5", gold: "#d1a06c", lightGold: "#f0cc99", red: "#a9543a",
  rust: "#e09b7b", charcoal: "#211918", dark: "#141313", gray: "#bda48f",
};
export function group(ctx, alpha, fn) { if (alpha <= .002) return; ctx.save(); ctx.globalAlpha *= Math.max(0, Math.min(1, alpha)); fn(); ctx.restore(); }
export function round(ctx, x, y, w, h, r, fill, stroke, lw = 2) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
export function line(ctx, points, color = C.gold, width = 3, dash = []) {
  if (points.length < 2) return; ctx.save(); ctx.beginPath(); ctx.moveTo(...points[0]);
  points.slice(1).forEach(p => ctx.lineTo(...p)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.setLineDash(dash); ctx.stroke(); ctx.restore();
}
export function text(ctx, str, x, y, size = 35, color = C.cream, opts = {}) {
  ctx.save(); ctx.fillStyle = color; ctx.font = `${opts.weight || 700} ${size}px ${opts.serif ? 'NotoSerifSC' : 'NotoSC'}`;
  ctx.textAlign = opts.align || "left"; ctx.textBaseline = opts.baseline || "middle";
  if (Number.isFinite(opts.maxWidth)) ctx.fillText(str, x, y, opts.maxWidth); else ctx.fillText(str, x, y); ctx.restore();
}
export function paper(ctx, x, y, w, h, rotation = 0, alpha = 1) {
  group(ctx, alpha, () => { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rotation); x = -w / 2; y = -h / 2;
    ctx.shadowColor = "#080606bb"; ctx.shadowBlur = 35; ctx.shadowOffsetY = 19;
    round(ctx, x, y, w, h, 8, C.paper, "#f9e7ca", 2); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, w - 2, h - 2); ctx.clip(); ctx.strokeStyle = "#75563a12"; ctx.lineWidth = 1;
    for (let i = 9; i < h; i += 13) { ctx.beginPath(); ctx.moveTo(x, y + i); ctx.lineTo(x + w, y + i); ctx.stroke(); } ctx.restore();
  });
}
export function mask(ctx, x, y, s = 1, tilt = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s); ctx.shadowColor = "#0009"; ctx.shadowBlur = 36; ctx.shadowOffsetY = 26;
  ctx.beginPath(); ctx.moveTo(0,-192); ctx.bezierCurveTo(-145,-196,-217,-105,-211,0); ctx.bezierCurveTo(-203,126,-116,192,0,210); ctx.bezierCurveTo(116,192,203,126,211,0); ctx.bezierCurveTo(217,-105,145,-196,0,-192); ctx.closePath();
  const g = ctx.createLinearGradient(-210,-180,210,200); g.addColorStop(0,"#fff1d9"); g.addColorStop(1,"#b9987a"); ctx.fillStyle=g; ctx.fill(); ctx.strokeStyle="#f5d8b2"; ctx.lineWidth=3; ctx.stroke(); ctx.shadowColor="transparent";
  ctx.fillStyle="#382c29"; ctx.beginPath(); ctx.moveTo(-156,-46); ctx.quadraticCurveTo(-100,-89,-40,-45); ctx.quadraticCurveTo(-99,-12,-156,-46); ctx.fill();
  ctx.beginPath(); ctx.moveTo(40,-45); ctx.quadraticCurveTo(100,-89,156,-46); ctx.quadraticCurveTo(99,-12,40,-45); ctx.fill();
  ctx.strokeStyle="#b58f76"; ctx.lineWidth=7; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(0,-28); ctx.quadraticCurveTo(-11,26,-8,43); ctx.quadraticCurveTo(0,53,13,43); ctx.stroke();
  ctx.strokeStyle="#936d58"; ctx.lineWidth=10; ctx.beginPath(); ctx.moveTo(-74,90); ctx.quadraticCurveTo(0,130,74,90); ctx.stroke(); ctx.restore();
}
export function person(ctx, x, y, scale = 1, col = C.gray) {
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0,-80,33,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-60,42); ctx.quadraticCurveTo(-58,-34,-27,-38); ctx.lineTo(27,-38); ctx.quadraticCurveTo(58,-34,60,42); ctx.lineTo(66,94); ctx.lineTo(-66,94); ctx.closePath(); ctx.fill();
  line(ctx,[[-42,95],[-47,158]],col,17); line(ctx,[[42,95],[47,158]],col,17); ctx.restore();
}
export function key(ctx, x, y, scale = 1, rotation = 0) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rotation); ctx.scale(scale,scale); ctx.strokeStyle=C.lightGold; ctx.lineWidth=10; ctx.lineCap="round";
  ctx.beginPath(); ctx.arc(-44,0,23,0,Math.PI*2); ctx.moveTo(-20,0); ctx.lineTo(62,0); ctx.lineTo(62,18); ctx.moveTo(38,0); ctx.lineTo(38,13); ctx.stroke(); ctx.restore();
}
export function door(ctx, x, y, scale = 1, open = 0) {
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  round(ctx,-147,-218,294,436,12,"#251b19",C.gold,5); round(ctx,-130,-201,260,402,6,"#0f0d0d","#7e5949",2);
  ctx.save(); ctx.translate(-123,-194); const doorW = 246 * (1 - .68 * open); round(ctx,0,0,doorW,388,4,"#80513e","#d3a17c",3);
  ctx.strokeStyle="#bb8668"; ctx.lineWidth=2; ctx.strokeRect(20,22,Math.max(0,doorW-40),145); ctx.strokeRect(20,190,Math.max(0,doorW-40),173);
  ctx.fillStyle=C.lightGold; ctx.beginPath(); ctx.arc(Math.max(12,doorW-32),205,7,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.restore();
}
export function phone(ctx, x, y, s = 1, label = "来电") {
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.shadowColor="#0008";ctx.shadowBlur=24;ctx.shadowOffsetY=14;
  round(ctx,-114,-205,228,410,26,"#352520","#c89370",4);ctx.shadowColor="transparent";
  round(ctx,-93,-166,186,300,9,"#eadcc5",null);line(ctx,[[-26,-185],[26,-185]],"#d8ae8d",5);
  text(ctx,label,0,-98,28,C.ink,{align:"center"});ctx.fillStyle=C.red;ctx.beginPath();ctx.arc(0,27,46,0,Math.PI*2);ctx.fill();
  line(ctx,[[-19,15],[-10,33],[13,42],[23,32]],C.paperLight,8);ctx.restore();
}
// 历史段使用固定电话的抽象轮廓，避免把现代智能手机画进 1970 年代。
export function landline(ctx, x, y, s = 1) {
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.shadowColor="#0005";ctx.shadowBlur=15;ctx.shadowOffsetY=12;
  ctx.fillStyle="#654437";ctx.beginPath();ctx.moveTo(-150,82);ctx.lineTo(-122,-28);ctx.quadraticCurveTo(-114,-55,-80,-55);ctx.lineTo(80,-55);ctx.quadraticCurveTo(114,-55,122,-28);ctx.lineTo(150,82);ctx.quadraticCurveTo(150,100,130,100);ctx.lineTo(-130,100);ctx.quadraticCurveTo(-150,100,-150,82);ctx.closePath();ctx.fill();ctx.shadowColor="transparent";
  ctx.strokeStyle="#6e493a";ctx.lineWidth=32;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-157,-78);ctx.quadraticCurveTo(0,-150,157,-78);ctx.stroke();
  ctx.fillStyle="#eadcc5";ctx.beginPath();ctx.arc(0,25,53,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#a1745b";ctx.lineWidth=4;ctx.stroke();
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.fillStyle="#9f725b";ctx.beginPath();ctx.arc(31*Math.cos(a),25+31*Math.sin(a),5,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
export function envelope(ctx, x, y, w, h, color = C.paper) {
  ctx.save();ctx.translate(x,y);round(ctx,-w/2,-h/2,w,h,8,color,"#c8a887",3);
  line(ctx,[[-w/2+5,-h/2+6],[0,h*.09],[w/2-5,-h/2+6]],"#a47c60",3);
  line(ctx,[[-w/2+5,h/2-5],[-w*.11,0]],"#c3a185",2);line(ctx,[[w/2-5,h/2-5],[w*.11,0]],"#c3a185",2);ctx.restore();
}
export function parcel(ctx,x,y,s=1) {
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle="#b87952";ctx.beginPath();ctx.moveTo(-120,-45);ctx.lineTo(0,-100);ctx.lineTo(120,-45);ctx.lineTo(0,11);ctx.closePath();ctx.fill();
  ctx.fillStyle="#986045";ctx.beginPath();ctx.moveTo(-120,-45);ctx.lineTo(0,11);ctx.lineTo(0,142);ctx.lineTo(-120,87);ctx.closePath();ctx.fill();
  ctx.fillStyle="#ca8b62";ctx.beginPath();ctx.moveTo(120,-45);ctx.lineTo(0,11);ctx.lineTo(0,142);ctx.lineTo(120,87);ctx.closePath();ctx.fill();
  line(ctx,[[0,-100],[0,11],[0,142]],"#eed2ab",4);line(ctx,[[-120,-45],[0,11],[120,-45]],"#eed2ab",3);ctx.restore();
}
export function arrow(ctx, x1, y1, x2, y2, color = C.gold, width = 4, progress = 1) {
  const x=x1+(x2-x1)*progress,y=y1+(y2-y1)*progress; line(ctx,[[x1,y1],[x,y]],color,width);
  if(progress>.8){const a=Math.atan2(y2-y1,x2-x1),r=14;line(ctx,[[x-r*Math.cos(a-.55),y-r*Math.sin(a-.55)],[x,y],[x-r*Math.cos(a+.55),y-r*Math.sin(a+.55)]],color,width);}
}
export function stamp(ctx,x,y,label,scale=1) {
  ctx.save();ctx.translate(x,y);ctx.rotate(-.08);ctx.scale(scale,scale);round(ctx,-130,-38,260,76,2,"#442520e8",C.rust,3);text(ctx,label,0,0,31,"#f0b49a",{align:"center"});ctx.restore();
}
export function tag(ctx,x,y,label,light=false) {
  const width=Math.max(160, Array.from(label).length*35+50); round(ctx,x-width/2,y-28,width,56,28,light?"#e9d6be":"#382521",light?"#c18f71":"#ba8266",2);
  text(ctx,label,x,y,28,light?C.ink:C.paperLight,{align:"center"});
}
