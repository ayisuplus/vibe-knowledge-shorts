// 主角星球：从 02-风格样张/planet-lab 搬来，参数与定稿样张一致。
// 每个构造函数返回 { g, state(t, key) }：g 放进宇宙，state 每帧给时间 t 和主光方向 key（世界坐标）。
import { planet, glowMat, NOISE } from "./world.js";

// 普通星球：贴图＋大气，按 spin 自转
export async function basic(W, name, { R = 1, atm, spin = 0.12, phase = 0, tilt = 0.12, emis = 0, atmK = 1 } = {}) {
  const p = planet(W, await W.tex(name), { R, atm, emis, atmK });
  p.g.rotation.z = tilt;
  return { ...p, state(t, key) { p.U.L.value.copy(key); p.body.rotation.y = phase + t * spin; } };
}

// DeepSeek：深海光脉＋四条俯视座头鲸发光轮廓（贴在略大一圈的壳上，随星球转，摆尾由 t 算出）
export async function deepseek(W, { R = 1.1, spin = 0.08 } = {}) {
  const { THREE } = W;
  const p = planet(W, await W.tex("deepseek"), { R, atm: 0x5fd0ff });
  const WH = 640, cv = document.createElement("canvas"); cv.width = 1024; cv.height = WH;
  const g = cv.getContext("2d"); g.translate(0, WH / 2);
  const half = (s) => {
    g.moveTo(1000, 0);
    g.bezierCurveTo(998, -30 * s, 972, -68 * s, 920, -94 * s);
    g.bezierCurveTo(870, -114 * s, 800, -120 * s, 740, -118 * s);
    g.bezierCurveTo(640, -112 * s, 520, -80 * s, 420, -48 * s);
    g.bezierCurveTo(360, -30 * s, 315, -20 * s, 285, -16 * s);
    g.bezierCurveTo(262, -40 * s, 220, -120 * s, 140, -192 * s);
    g.bezierCurveTo(132, -168 * s, 150, -130 * s, 168, -100 * s);
    g.bezierCurveTo(182, -72 * s, 176, -40 * s, 150, -14 * s);
    g.lineTo(178, 0);
  };
  const fin = (s) => {
    g.moveTo(805, -112 * s);
    g.bezierCurveTo(780, -170 * s, 700, -228 * s, 572, -252 * s);
    g.bezierCurveTo(556, -244 * s, 588, -216 * s, 640, -186 * s);
    g.bezierCurveTo(690, -156 * s, 722, -136 * s, 730, -118 * s);
    g.closePath();
  };
  const shape = () => { g.beginPath(); half(1); half(-1); fin(1); fin(-1); };
  const grad = g.createLinearGradient(1000, 0, 200, 0);
  grad.addColorStop(0, "rgba(30,110,170,0.40)"); grad.addColorStop(1, "rgba(10,50,110,0.28)");
  shape(); g.fillStyle = grad; g.fill();
  g.shadowColor = "#4fdcff";
  g.shadowBlur = 34; shape(); g.strokeStyle = "rgba(79,220,255,0.75)"; g.lineWidth = 9; g.stroke();
  g.shadowBlur = 12; shape(); g.strokeStyle = "rgba(150,240,255,0.95)"; g.lineWidth = 3.5; g.stroke();
  g.shadowBlur = 0; shape(); g.strokeStyle = "rgba(235,252,255,0.95)"; g.lineWidth = 1.4; g.stroke();
  g.beginPath(); g.moveTo(960, 0); g.bezierCurveTo(800, 3, 560, -2, 300, 0);
  g.strokeStyle = "rgba(140,235,255,0.45)"; g.lineWidth = 2.2; g.stroke();
  g.fillStyle = "rgba(190,248,255,0.85)";
  for (const [x, y] of [[985, 0], [968, -18], [968, 18], [948, -34], [948, 34], [952, 0], [930, -16], [930, 16], [912, -46], [912, 46]]) { g.beginPath(); g.arc(x, y, 3.4, 0, 7); g.fill(); }
  for (const y of [-7, 7]) { g.beginPath(); g.ellipse(880, y, 6, 3, 0, 0, 7); g.fill(); }
  g.beginPath(); g.ellipse(560, 0, 22, 9, 0, 0, 7); g.strokeStyle = "rgba(150,240,255,0.6)"; g.lineWidth = 2; g.stroke();
  const wtex = new THREE.CanvasTexture(cv); wtex.colorSpace = THREE.SRGBColorSpace; wtex.anisotropy = 16;

  const WS = [
    { axis: [0.25, 1, 0.10], a0: 0.4, w: 0.07, s: 0.15, ph: 0.0 },
    { axis: [0.22, 1, 0.16], a0: 0.08, w: 0.07, s: 0.10, ph: 1.7 },
    { axis: [-0.5, 1, -0.3], a0: 2.6, w: 0.06, s: 0.13, ph: 3.1 },
    { axis: [0.6, 1, 0.5], a0: 4.4, w: 0.08, s: 0.12, ph: 4.6 },
  ].map((o) => ({ ...o, axis: new THREE.Vector3(...o.axis).normalize() }));
  const N = WS.length;
  const U = { tex: { value: wtex }, sun: p.U.L, time: { value: 0 },
    wp: { value: WS.map(() => new THREE.Vector3()) }, wf: { value: WS.map(() => new THREE.Vector3()) },
    wr: { value: WS.map(() => new THREE.Vector3()) }, ws: { value: WS.map((o) => o.s) }, wph: { value: WS.map((o) => o.ph) } };
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R * 1.004, 256, 128), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: U,
    vertexShader: "varying vec3 lp;varying vec3 wn;void main(){lp=normalize(position);wn=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `uniform sampler2D tex;uniform vec3 sun;uniform float time;
      uniform vec3 wp[${N}];uniform vec3 wf[${N}];uniform vec3 wr[${N}];uniform float ws[${N}];uniform float wph[${N}];
      varying vec3 lp;varying vec3 wn;
      void main(){
        vec4 acc=vec4(0.);
        for(int i=0;i<${N};i++){
          if(dot(lp,wp[i])<0.9) continue;
          float lx=dot(lp,wf[i])/ws[i];
          float ly=dot(lp,wr[i])/ws[i];
          float tail=smoothstep(0.35,-1.0,lx);
          ly-=0.06*tail*sin(time*6.0+wph[i]-lx*3.5);
          vec2 uv=vec2(0.5+0.5*lx,0.5+ly*${(512 / WH).toFixed(4)});
          if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.) continue;
          vec4 c=texture2D(tex,uv);
          acc=c+acc*(1.-c.a);
        }
        if(acc.a<0.003) discard;
        float day=smoothstep(-0.4,0.4,dot(wn,sun));
        acc.rgb*=mix(0.6,1.25,day);
        gl_FragColor=vec4(acc.rgb,acc.a*0.9);
      }`,
  }));
  p.body.add(shell);
  const v = new THREE.Vector3(), f = new THREE.Vector3(), rr = new THREE.Vector3(), base = new THREE.Vector3();
  return { ...p, state(t, key) {
    p.U.L.value.copy(key); p.body.rotation.y = 0.6 + t * spin; U.time.value = t;
    WS.forEach((o, i) => {
      base.set(0, 0, 1).cross(o.axis).normalize();
      v.copy(base).applyAxisAngle(o.axis, o.a0 + o.w * t);
      f.copy(o.axis).cross(v).normalize(); rr.copy(v).cross(f).normalize();
      U.wp.value[i].copy(v); U.wf.value[i].copy(f); U.wr.value[i].copy(rr);
    });
  } };
}

// Gemini：蓝端 Castor 与暖端 Pollux 绕共同质心互转（镜像般反向自转），外圈 Gemma 宝石偶尔闪光
export async function gemini(W, { R = 1, d = 1.6 } = {}) {
  const { THREE } = W;
  const g = new THREE.Group();
  const castor = planet(W, await W.tex("castor"), { R, atm: 0x6fb0ff });
  const pollux = planet(W, await W.tex("pollux"), { R, atm: 0xff9a86 });
  g.add(castor.g, pollux.g);
  const GEMS = [
    { c: 0xbfdcff, R: 3.6, w: 0.22, a0: 0.4, y: 0.5 }, { c: 0xd9c8ff, R: 4.1, w: -0.17, a0: 2.3, y: -0.6 },
    { c: 0xffd0d4, R: 3.9, w: 0.19, a0: 4.0, y: 0.25 }, { c: 0xe6efff, R: 4.4, w: -0.14, a0: 5.4, y: -0.2 },
  ];
  const glints = GEMS.map((o) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), glowMat(W, o.c, { kind: 1 })); g.add(m); return m; });
  const flash = { value: 0 };
  return { g, castor, pollux, glints, flash, state(t, key, camQ, gemBoost = 0) {
    const a = -0.95 + t * 0.16;
    castor.g.position.set(Math.cos(a) * d, Math.sin(a) * d * 0.22, Math.sin(a) * d);
    pollux.g.position.copy(castor.g.position).multiplyScalar(-1);
    castor.body.rotation.y = t * 0.25; pollux.body.rotation.y = -t * 0.25;
    castor.U.L.value.copy(key); pollux.U.L.value.copy(key);
    GEMS.forEach((o, i) => {
      const b = o.a0 + t * o.w;
      glints[i].position.set(Math.cos(b) * o.R, o.y + 0.15 * Math.sin(b * 2), Math.sin(b) * o.R);
      glints[i].quaternion.copy(camQ);
      const blink = Math.pow(Math.max(Math.sin(t * 1.6 + i * 1.9), 0), 12);   // 大部分时间暗，偶尔一闪
      glints[i].material.uniforms.k.value = 0.25 + blink + gemBoost;
    });
  } };
}

// Claude 三档：大小按诗的长短排（只表达长短顺序，不代表参数量——闭源参数未公开，见调研档案禁说）
export async function trio(W) {
  const { THREE } = W;
  const g = new THREE.Group();
  const P = [
    ["haiku", 0.42, 0xf3e6d0, [-3.2, 0.15, 0], 0.30],
    ["sonnet", 0.80, 0xf0b48c, [-0.9, 0, -0.5], 0.22],
    ["opus", 1.45, 0xe8946c, [2.6, -0.15, -1.3], 0.15],
  ];
  const ps = [];
  for (const [n, R, atm, pos, spin] of P) {
    const p = planet(W, await W.tex(n), { R, atm }); p.g.position.set(...pos); p.body.rotation.x = 0.12; g.add(p.g); ps.push({ p, spin, n, R });
  }
  return { g, ps, state(t, key) { for (const { p, spin } of ps) { p.U.L.value.copy(key); p.body.rotation.y = 0.5 + t * spin; } } };
}

// Mythos：底下是发光的神话浮雕，外裹一层近黑烟纱；纱上孔洞随 t 慢慢开合，孔洞边缘一圈细金线
export async function mythos(W, { R = 1.15 } = {}) {
  const { THREE } = W;
  const mt = await W.tex("mythos");
  const p = planet(W, mt, { R, atm: 0xe8b04a, emis: 0.16, amb: 0.02 });
  const VU = { time: { value: 0 }, sun: p.U.L, open: { value: 0 } };
  const veil = new THREE.Mesh(new THREE.SphereGeometry(R * 1.035, 256, 128), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: VU,
    vertexShader: "varying vec3 lp;varying vec3 wn;varying vec3 n;varying vec3 v;void main(){lp=position;wn=normalize(mat3(modelMatrix)*normal);n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}",
    fragmentShader: `uniform float time;uniform vec3 sun;uniform float open;varying vec3 lp;varying vec3 wn;varying vec3 n;varying vec3 v;${NOISE}
      void main(){
        vec3 q=lp/${R.toFixed(3)};
        float f=fbm(q*2.2+vec3(time*.05,0.,-time*.03))*.5+.5;
        float th=.60-.08*(.5+.5*sin(time*.55))-.06*open;               // open：额外张开（对在「神话」两个字上）
        float hole=smoothstep(th+.004,th+.016,f);
        float edge=exp(-pow((f-th-.002)/.006,2.));
        float ndl=max(dot(wn,sun),0.);
        float wisp=fbm(q*5.+vec3(0.,time*.08,0.))*.5+.5;
        vec3 cloth=vec3(.022,.018,.02)*(.4+.8*ndl)+vec3(.30,.22,.16)*pow(wisp,4.)*.25*(.3+ndl)+vec3(.35,.26,.18)*pow(1.-max(dot(n,v),0.),3.)*.5;
        vec3 col=mix(cloth,vec3(1.,.70,.30)*1.1,edge);
        float a=max((1.-hole)*(.90+.08*wisp),edge*.95);
        gl_FragColor=vec4(col,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  p.g.add(veil);
  return { ...p, VU, state(t, key, open = 0) { p.U.L.value.copy(key); p.body.rotation.y = 0.3 + t * 0.12; veil.rotation.y = t * 0.05; VU.time.value = t; VU.open.value = open; } };
}

// Kimi：白色月面，背光的半边只亮流动的细光；光源固定在世界坐标（永远只亮半边），镜头绕过去看
export async function kimi(W, { R = 1.05, sun } = {}) {
  const p = planet(W, await W.tex("kimi-day"), { R, atm: 0x9fb6ff, night: await W.tex("kimi-night"), amb: 0.015, kd: 1.25, atmK: 0.35 });
  p.U.L.value.copy(sun);
  return { ...p, state(t) { p.U.time.value = t; } };
}

// GPT：Sol（代码画的太阳，也是 Terra/Luna 的光源）、Terra（黑玻璃线描）、Luna、远处的 Astra 星簇
export async function gptSystem(W) {
  const { THREE } = W;
  const g = new THREE.Group();
  const SOL = new THREE.Vector3(-12, 4, -40), ASTRA = new THREE.Vector3(-24, 34, -50), L0 = new THREE.Vector3(2.2, 0.4, -1.6);
  const solU = { time: { value: 0 } };
  const sol = new THREE.Mesh(new THREE.SphereGeometry(1.6, 128, 64), new THREE.ShaderMaterial({
    uniforms: solU,
    vertexShader: "varying vec3 p;varying vec3 n;varying vec3 v;void main(){p=position;n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}",
    fragmentShader: `uniform float time;varying vec3 p;varying vec3 n;varying vec3 v;${NOISE}
      void main(){float g=fbm(p*1.8+vec3(0.,0.,time*.08));float g2=fbm(p*5.0-vec3(time*.05));
        float k=clamp(.5+1.1*g+.4*g2,0.,1.);vec3 c=mix(vec3(1.0,.80,.55),vec3(1.0,.98,.94),k);
        float limb=pow(max(dot(n,v),0.),.5);gl_FragColor=vec4(c*mix(.6,1.35,limb),1.);}`,
  }));
  sol.position.copy(SOL); g.add(sol);
  const cor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: solU,
    vertexShader: "varying vec2 u;void main(){u=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `uniform float time;varying vec2 u;${NOISE}
      void main(){float d=length(u);float a=atan(u.y,u.x);float ray=.55+.45*fbm(vec3(cos(a)*3.,sin(a)*3.,time*.06));
        float glow=exp(-d*7.)*1.6+exp(-d*2.6)*.35*ray;glow*=smoothstep(1.,.6,d);gl_FragColor=vec4(vec3(1.,.9,.75)*glow,1.);}`,
  }));
  cor.position.copy(SOL); g.add(cor);
  const terra = planet(W, await W.tex("terra"), { R: 1, atm: 0xdfe6ff });
  terra.body.rotation.order = "ZYX"; terra.body.rotation.z = 0.41; g.add(terra.g);
  const luna = planet(W, await W.tex("luna"), { R: 0.27, atm: 0x000000, kd: 1.2, atmK: 0 });
  luna.g.position.copy(L0); g.add(luna.g);
  // Astra 星簇：11 颗星，位置和亮度手写固定（昴星团式），外罩一层淡银白星云雾
  const astra = new THREE.Group(); astra.position.copy(ASTRA); astra.scale.setScalar(1.5); g.add(astra);
  const STARS = [[0, 0, 0, 1.0], [2.6, 1.1, -0.8, 0.85], [-2.1, 1.6, 0.6, 0.8], [1.2, -2.2, 0.4, 0.75], [-1.4, -1.3, -1.0, 0.7],
    [3.6, -0.9, 0.9, 0.55], [-3.4, -0.2, 0.3, 0.5], [0.4, 2.9, -0.5, 0.5], [2.2, 2.8, 1.0, 0.4], [-0.9, -3.4, 0.8, 0.4], [4.4, 1.8, -1.2, 0.35]];
  const stars = STARS.map(([x, y, z, b], i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2 + 3 * b, 3.2 + 3 * b), glowMat(W, 0xebf0ff, { kind: 1, k: b })); m.position.set(x, y, z); m.userData = { b, ph: i * 1.7 }; astra.add(m); return m; });
  const hazeU = { time: { value: 0 } };
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: hazeU,
    vertexShader: "varying vec2 u;void main(){u=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `uniform float time;varying vec2 u;${NOISE}
      void main(){float r=length(u);float f=fbm(vec3(u*2.2,time*.03))*.5+.5;float i=pow(f,2.2)*exp(-r*2.4)*.55*smoothstep(1.,.55,r);gl_FragColor=vec4(vec3(.78,.84,1.)*i,1.);}`,
  }));
  astra.add(haze);
  const bills = [cor, haze, ...stars];
  const wTerra = new THREE.Vector3(), wSol = new THREE.Vector3(), wLuna = new THREE.Vector3();
  return { g, terra, luna, sol, astra, SOL, ASTRA, L0, state(t, key, camQ) {
    solU.time.value = t; hazeU.time.value = t; sol.rotation.y = t * 0.05;
    terra.body.rotation.y = 0.6 + t * 0.12; luna.body.rotation.y = 2.4 + t * 0.02;
    g.updateMatrixWorld();
    sol.getWorldPosition(wSol); terra.g.getWorldPosition(wTerra); luna.g.getWorldPosition(wLuna);
    terra.U.L.value.copy(wSol).sub(wTerra).normalize(); terra.AU.L.value.copy(terra.U.L.value);
    luna.U.L.value.copy(wSol).sub(wLuna).normalize();
    for (const m of stars) m.material.uniforms.k.value = m.userData.b * (0.88 + 0.12 * Math.sin(t * 2.3 + m.userData.ph));
    for (const b of bills) b.quaternion.copy(camQ);
  } };
}

// Muse Spark：不透明、不发光的新星（Meta 闭源接班），只有一圈冷白轮廓
export function muse(W, { R = 0.8 } = {}) {
  const { THREE } = W;
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 48), new THREE.ShaderMaterial({
    uniforms: { a: { value: 0 } },
    vertexShader: "varying vec3 n;varying vec3 v;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}",
    fragmentShader: "uniform float a;varying vec3 n;varying vec3 v;void main(){float f=pow(1.-max(dot(n,v),0.),3.);vec3 c=vec3(.03,.035,.05)+vec3(.75,.82,1.)*f*.9;gl_FragColor=vec4(c*a,1.);}",
  }));
  g.add(m);
  return { g, m, state(t, a) { m.material.uniforms.a.value = a; g.visible = a > 0.001; } };
}
