// 六段画面全部由当前拍数 n 推导；不创建或残留跨段 DOM。
import { BEAT } from "./beats.js";
import { ramp, mix } from "./lib.js";
import { C, group, round, line, text, paper, mask, person, key, door, phone, landline, envelope, parcel, arrow, stamp, tag } from "./rig.js";

const E=(n,a,d=1.2)=>ramp(n,a,d);
const active=(n,a,b)=>n>=a&&n<b;
const fade=(n,a,b)=>E(n,a,.8)*(1-E(n,b-.8,.8));

function opening(ctx,n,t,w){
  if(!active(n,0,26))return;
  w.setNote(n<18?"情节示意：一通自称快递客服的来电":"模型示意：信任与权限");
  group(ctx,fade(n,0,26),()=>{
    const drift=8*Math.sin(t*.5), appear=E(n,1,2);
    line(ctx,[[573,58],[573,225+drift]],"#d1a06c88",3);line(ctx,[[694,58],[694,225+drift]],"#d1a06c88",3);
    group(ctx,appear,()=>mask(ctx,635,450+drift,1.05,.025*Math.sin(t*.45)));
    const q=E(n,4,2);group(ctx,q,()=>{
      paper(ctx,1105,230,545,455,.025);text(ctx,"来电中的角色 · 情节示意",1153,292,29,C.muted);
      if(n<18){text(ctx,"“我是",1153,390,68,C.ink,{serif:true});text(ctx,"快递客服。”",1153,480,68,C.ink,{serif:true});text(ctx,"身份仍需独立核验",1155,600,30,C.muted);}
      else {text(ctx,"一扇门",1153,370,72,C.ink,{serif:true});text(ctx,"与一把钥匙",1153,462,65,C.ink,{serif:true});text(ctx,"它们代表权限与信任",1155,588,30,C.muted);}
    });
    group(ctx,E(n,10,1),()=>stamp(ctx,850,671,"身份待核",.96));
    if(n>=18)group(ctx,E(n,18,1),()=>key(ctx,1460,570,.72,-.1));
  });
}

function mechanism(ctx,n,t,w){
  if(!active(n,26,114))return;
  w.setNote(n<42?"模型示意：不同资源需要不同权限":n<66?"模型示意：协作依赖信任与核验":n<98?"模型示意：请求、身份与行动":"模型示意：利用交互，影响行动");
  group(ctx,fade(n,26,114),()=>{
    const sway=3*Math.sin(t*.45), k=E(n,26,2), guard=E(n,42,2), attacker=E(n,66,2), move=E(n,82,5);
    group(ctx,k,()=>{
      door(ctx,1030,430,.91,n>=82?E(n,82,6)*.7:0);
      tag(ctx,1030,181,"权限边界");
      const labels=["信息","账户","资金"];
      for(let i=0;i<3;i++){const a=E(n,27+i*1.6,2);group(ctx,a,()=>{round(ctx,1306,238+i*130,300,100,9,"#eadcc5","#f9e7ca",2);text(ctx,labels[i],1456,288+i*130,39,C.ink,{align:"center"});});}
      text(ctx,"受保护的资源",1456,670,30,C.gray,{align:"center"});
    });
    group(ctx,guard,()=>{
      person(ctx,722,441+sway,1.03,C.paper);text(ctx,"有权限的人",722,666,30,C.paperLight,{align:"center"});
      const keyX=mix(795,934,move);key(ctx,keyX,433+sway,.55,-.06);
      if(n>=50&&n<74){tag(ctx,584,259,n<58?"身份与规则":"信任 + 核验",true);arrow(ctx,605,291,665,355,C.gold,3,E(n,50,2));}
    });
    group(ctx,attacker,()=>{
      person(ctx,300,453-sway,.92,C.red);text(ctx,"未获授权者",300,667,30,C.rust,{align:"center"});
      if(n>=74){paper(ctx,415,260,240,125,-.04);text(ctx,"身份 / 理由",535,320,29,C.ink,{align:"center"});arrow(ctx,420,400,620,400,C.rust,5,E(n,74,5));}
    });
    if(n>=90){group(ctx,E(n,90,2),()=>{
      line(ctx,[[362,576],[590,576],[830,576],[935,535]],C.rust,4,[12,10]);
      const x=mix(372,878,Math.min(1,(n-90)/9));round(ctx,x-52,555,104,42,5,C.paperLight);text(ctx,"请求",x,576,22,C.ink,{align:"center"});
    });}
  });
}

function history(ctx,n,t,w){
  if(!active(n,114,170))return;
  w.setNote(n<122?"词义区分：早期社会管理 ≠ 信息安全用法":n<138?"1973 年采访记载 · 历史研究转述":n<146?"1978 年相关案例 · 依据当时报导":n<162?"1995 · USENIX · 经授权的测试":"经许可测试与非法攻击不同");
  group(ctx,fade(n,114,170),()=>{
    paper(ctx,300,193,1320,500,-.006);
    line(ctx,[[385,295],[1535,295]],"#b89575",2);
    if(n<122){
      text(ctx,"19 世纪末 — 20 世纪初",390,255,30,C.muted);
      text(ctx,"社会与组织管理",390,387,69,C.ink,{serif:true});
      text(ctx,"早期的另一种语境",390,493,36,C.muted);
      for(let i=0;i<4;i++)group(ctx,E(n,114+i*.8,1.5),()=>person(ctx,1120+i*85,475,.38,i%2?"#bd8c6d":"#8c6450"));
      line(ctx,[[1070,562],[1450,562]],"#b18c71",3);
    } else if(n<138){
      text(ctx,"20 世纪 · 电话黑客文化",390,255,30,C.muted);
      text(ctx,"借助交谈，获取协助",390,378,61,C.ink,{serif:true});
      text(ctx,"1973 年采访记载 · 示意",390,486,32,C.muted);
      group(ctx,E(n,122,1.5),()=>landline(ctx,1260,470,1.0));
      if(n>=130){round(ctx,955,450,176,75,10,"#d4baa0");text(ctx,"请求协助",1043,488,27,C.ink,{align:"center"});arrow(ctx,1135,485,1187,485,C.red,3,E(n,130,2));}
    } else if(n<146){
      text(ctx,"1978 · 相关案例",390,255,32,C.muted);
      text(ctx,"冒用身份，电话转账",390,389,62,C.ink,{serif:true});
      text(ctx,"依据同期报道 · 图为示意",390,495,31,C.muted);
      landline(ctx,1270,455,.85);round(ctx,1020,525,168,76,6,"#bb8c6e");text(ctx,"身份",1104,563,30,C.paperLight,{align:"center"});arrow(ctx,1190,563,1230,540,C.red,3,E(n,138,2));
    } else {
      text(ctx,"USENIX SECURITY · 1995",390,255,32,C.muted);
      text(ctx,"SOCIAL ENGINEERING",390,375,51,C.ink,{serif:true});
      text(ctx,"信息安全中的早期研究记录",390,467,36,C.muted);
      for(let i=0;i<4;i++)line(ctx,[[390,540+i*23],[830-i*36,540+i*23]],"#c1a58c",5);
      group(ctx,E(n,152,1),()=>stamp(ctx,1280,478,"授权测试",1.1));
      if(n>=162)group(ctx,E(n,162,1.5),()=>{round(ctx,1030,560,360,65,7,"#d4baa0");text(ctx,"交谈 → 敏感信息",1210,592,29,C.ink,{align:"center"});});
    }
  });
}

function development(ctx,n,t,w){
  if(!active(n,170,234))return;
  w.setNote(n<178?"1999 · RFC 2504 · 信息性安全手册":n<186?"渠道增加，电话并没有消失":n<210?"2000 · ILOVEYOU / LoveLetter · 资料示意":"2024 · FBI 提醒：AI 可用于冒充");
  group(ctx,fade(n,170,234),()=>{
    line(ctx,[[250,218],[1670,218]],"#a4755d",4);
    for(const [x,yr,start] of [[360,"1999",170],[950,"2000",186],[1540,"2024",210]]){
      ctx.fillStyle=n>=start?C.lightGold:"#785547";ctx.beginPath();ctx.arc(x,218,12,0,Math.PI*2);ctx.fill();text(ctx,yr,x,165,30,n>=start?C.paperLight:C.gray,{align:"center"});
    }
    if(n<186){
      paper(ctx,430,270,1060,420,-.015);text(ctx,"RFC 2504",525,356,62,C.ink,{serif:true});text(ctx,"互联网用户安全手册",525,447,42,C.muted);text(ctx,"讨论获取信任与未授权访问",525,532,31,C.muted);
      group(ctx,E(n,178,2),()=>{landline(ctx,1250,495,.65);envelope(ctx,1010,520,160,95);});
    }else if(n<210){
      const appear=E(n,186,1.4);group(ctx,appear,()=>{
        envelope(ctx,792,452,590,320);text(ctx,"ILOVEYOU",792,391,57,C.ink,{align:"center",serif:true});
        if(n>=194){round(ctx,657,490,270,72,7,"#b89175");text(ctx,"附件 · 示意",792,526,31,C.ink,{align:"center"});}
        if(n>=202){for(let i=0;i<3;i++)group(ctx,E(n,202+i*.8,1.2),()=>{arrow(ctx,1090,393+i*85,1260,365+i*100,C.gold,3,1);envelope(ctx,1380,365+i*100,180,105,"#d7bba0");});}
      });
    }else{
      person(ctx,1175,440,1.1,C.paper);for(let i=0;i<35;i++){const x=340+i*20, amp=18+31*Math.abs(Math.sin(i*.41+t*1.8));line(ctx,[[x,425-amp],[x,425+amp]],i%5===0?C.rust:C.gold,5);}
      text(ctx,"声音与影像",670,290,48,C.paperLight,{align:"center"});
      if(n>=218)stamp(ctx,1190,616,"身份待核",.95);
      if(n>=226){tag(ctx,445,610,"电话");tag(ctx,650,610,"邮件");tag(ctx,855,610,"AI 工具");}
    }
  });
}

function scenario(ctx,n,t,w){
  if(!active(n,234,298))return;
  w.setNote(n<242?"虚构情境：一通快递理赔来电":n<250?"知道订单信息，不等于身份已经核实":n<266?"对方的请求：紧迫感与验证码":n<282?"挂断后，从自己找到的入口核实":n<290?"保护密码和验证码":"个人核验与机构流程共同作用");
  group(ctx,fade(n,234,298),()=>{
    const drift=5*Math.sin(t*.6), late=n>=266;
    paper(ctx,280,235,560,430,-.025);text(ctx,"快递订单 · 示意",335,297,31,C.muted);
    parcel(ctx,440,448,.75);text(ctx,"已知订单",647,413,43,C.ink,{align:"center"});text(ctx,"不等于身份",647,483,35,C.muted,{align:"center"});
    if(n<266){
      phone(ctx,1190,448+drift,.92,"自称客服");group(ctx,E(n,242,1.2),()=>stamp(ctx,1450,394,"身份待核",.85));
      if(n>=250){tag(ctx,1470,500,"尽快理赔",true);}
      if(n>=258){round(ctx,1345,570,290,78,8,C.paperLight,"#d1aa86",2);text(ctx,"验证码 · 空白",1490,609,28,C.ink,{align:"center"});}
    }else{
      group(ctx,E(n,266,2),()=>{round(ctx,1010,283,650,390,12,"#31221e","#bd8d6a",3);text(ctx,"已中断来电",1335,355,38,C.paperLight,{align:"center"});line(ctx,[[1080,410],[1590,410]],"#a4755d",2);});
      if(n>=274){group(ctx,E(n,274,1.5),()=>{round(ctx,1090,455,490,115,9,C.paper);text(ctx,"自己打开常用平台",1335,512,36,C.ink,{align:"center"});});}
      if(n>=282){group(ctx,E(n,282,1.5),()=>tag(ctx,1335,627,"凭据留在自己手中",true));}
      if(n>=290){tag(ctx,1335,215,"机构：身份核验 + 操作规则");}
    }
  });
}

function close(ctx,n,t,w){
  if(!active(n,298,337))return;
  w.setNote(n<314?"协作需要信任，也需要可独立核验的流程":n<328?"模型与情节为示意 · 不构成个案安全建议":"");
  group(ctx,Math.min(1,E(n,298,.8)),()=>{
    if(n<314){
      const a=E(n,298,2);group(ctx,a,()=>{
        person(ctx,510,443,.85,C.paper);person(ctx,1410,443,.85,C.paper);line(ctx,[[590,460],[1330,460]],"#c19171",5);
        const x=700+520*((.5+.5*Math.sin(t*.55)));round(ctx,x-70,410,140,100,5,C.paperLight);text(ctx,"协作",x,460,29,C.ink,{align:"center"});
        if(n>=306){line(ctx,[[700,570],[1220,570]],C.lightGold,5);tag(ctx,960,605,"独立核验",true);}
      });
    } else if(n<328){
      paper(ctx,225,164,1470,570,0);text(ctx,"本片资料",315,225,45,C.ink,{serif:true});line(ctx,[[315,272],[1605,272]],"#c2a084",2);
      const refs=[["MIT Press · 概念史","Cambridge · 电话文化"],["1978 · 华盛顿邮报","1995 · USENIX"],["1999 · IETF","2000 · Microsoft"],["2024 · FBI","无锡网上公安"]];
      for(let i=0;i<refs.length;i++){text(ctx,refs[i][0],315,335+i*82,42,C.ink);text(ctx,refs[i][1],990,335+i*82,42,C.ink);}
      text(ctx,"模型与来电情节为示意",960,670,29,C.muted,{align:"center"});
    } else {
      group(ctx,E(n,328,1.2),()=>{line(ctx,[[590,395],[1330,395]],"#d1a06c55",3);text(ctx,"下一次，",960,455,69,C.paperLight,{align:"center",serif:true});text(ctx,"你会怎样确认对方是谁？",960,555,67,C.paperLight,{align:"center",serif:true});line(ctx,[[700,620],[1220,620]],C.gold,3);});
    }
  });
}

export function sections(world){const {ctx}=world;return [opening,mechanism,history,development,scenario,close].map(draw=>({state(t){ctx.save();ctx.translate(5*Math.sin(t*.38),3*Math.sin(t*.47));draw(ctx,t/BEAT,t,world);ctx.restore();}}));}
