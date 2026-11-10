// 场景根：渲染器、辉光、径向模糊＋色散＋闪白后期、机位，以及文字和贴图工具。
// 每帧 begin() 先把登记过的物件全部藏起来，各段只负责把这一拍要出现的物件摆出来，跳帧不会有残留。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { hash, mix } from "./lib.js";

export const W = 1920, H = 1080;
export function buildWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  const dpr = window.devicePixelRatio || 1;   // 4K 母版 dpr = 2，画布跟着提高分辨率
  renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene(), BLACK = new THREE.Color(0x020102);
  scene.background = BLACK.clone();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .55;
  const camera = new THREE.PerspectiveCamera(36, W / H, .05, 500);
  scene.add(new THREE.HemisphereLight(0xffe7d0, 0x200806, .9));
  const key = new THREE.DirectionalLight(0xfff0dd, 2.4); key.position.set(-5, 7, 9); scene.add(key);
  const redL = new THREE.PointLight(0xff3020, 0, 60); scene.add(redL);

  const rt = new THREE.WebGLRenderTarget(W * dpr, H * dpr, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt); composer.setPixelRatio(dpr); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .42, .45, .92); composer.addPass(bloom);
  const fx = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uZoom: { value: 0 }, uAb: { value: 0 }, uFlash: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uZoom,uAb,uFlash; varying vec2 vUv;
      void main(){ vec2 d=vUv-.5; vec3 c=vec3(0.); float w=0.;
        for(int i=0;i<12;i++){ float s=1.-uZoom*float(i)/11.; float g=1.-float(i)/14.;
          c.r+=texture2D(tDiffuse,.5+d*s*(1.+uAb)).r*g; c.g+=texture2D(tDiffuse,.5+d*s).g*g; c.b+=texture2D(tDiffuse,.5+d*s*(1.-uAb)).b*g; w+=g; }
        c/=w; float v=smoothstep(.95,.3,length(d)); gl_FragColor=vec4(c*mix(.55,1.,v)+vec3(uFlash),1.); }`,
  });
  composer.addPass(fx); composer.addPass(new OutputPass());

  const objs = [], tmp = new THREE.Vector3();
  const w = {
    THREE, renderer, scene, camera, redL, bloom, fx,
    reg(o) { o.visible = false; if (!o.parent) scene.add(o); objs.push(o); return o; },
    begin() { for (const o of objs) o.visible = false; scene.background.copy(BLACK); redL.intensity = 0; },
    bg(hex, p = 1) { scene.background.lerpColors(BLACK, new THREE.Color(hex), p); },
    cam(x, y, z, tx = 0, ty = 0, tz = 0, roll = 0, fov = 36) {
      camera.position.set(x, y, z); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(tmp.set(tx, ty, tz)); w._fov = fov;
    },
    /** 重击后的手持抖动和推镜，幅度随机位距离走 */
    shake(k, t) {
      const d = camera.position.length() / 15 || 1, s = k * .3 * Math.min(1.6, d);
      camera.position.x += s * Math.sin(t * 61); camera.position.y += s * Math.sin(t * 47 + 1);
      camera.fov = w._fov * (1 - .1 * k); camera.updateProjectionMatrix();
    },
    render() { composer.render(); },
  };

  // ── 文字与贴图 ──
  w.tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
  w.basic = (map, extra = {}) => new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, ...extra });
  w.textCanvas = (str, { size = 300, color = "#fff", font = "NotoSerifSC", weight = 900, pad = 40, stroke = null, box = null } = {}) => {
    const c = document.createElement("canvas"), g = c.getContext("2d");
    g.font = `${weight} ${size}px ${font}`;
    c.width = Math.ceil(g.measureText(str).width + pad * 2 + (box ? size * .8 : 0)); c.height = Math.ceil(size * 1.3 + pad + (box ? size * .3 : 0));
    g.font = `${weight} ${size}px ${font}`; g.textAlign = "center"; g.textBaseline = "middle";
    if (box) { g.strokeStyle = box; g.lineWidth = size * .09; g.strokeRect(size * .1, size * .1, c.width - size * .2, c.height - size * .2); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = size * .06; g.strokeText(str, c.width / 2, c.height / 2); }
    g.fillStyle = color; g.fillText(str, c.width / 2, c.height / 2);
    return c;
  };
  /** height 是世界单位的高度 */
  w.text = (str, height, o = {}) => { const c = w.textCanvas(str, o), m = new THREE.Mesh(new THREE.PlaneGeometry(height * c.width / c.height, height), w.basic(w.tex(c))); return w.reg(m); };
  /** 把物件放到位并显示 */
  w.put = (m, x, y, z, s = 1, rz = 0, op = 1) => { m.visible = true; m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.set(0, 0, rz); if (m.material) m.material.opacity = op; };
  /** 假挤出：一叠逐层变暗的文字 */
  w.extruded = (str, height, layers, front, back) => {
    const g = new THREE.Group();
    for (let i = layers - 1; i >= 0; i--) { const c = w.textCanvas(str, { color: i ? back : front, size: 420 }), m = new THREE.Mesh(new THREE.PlaneGeometry(height * c.width / c.height, height), w.basic(w.tex(c))); m.position.z = -i * height * .012; if (i) m.material.color.setScalar(mix(.9, .25, i / (layers - 1))); g.add(m); }
    return w.reg(g);
  };
  /** 动态数字：字符串变了才重画，值由 n 算出，所以跳帧安全 */
  w.number = (cw, ch, px, color, glow) => {
    const c = document.createElement("canvas"); c.width = cw; c.height = ch; const g = c.getContext("2d"), t = w.tex(c); let last = null;
    return { t, set(str) { if (str === last) return; last = str; g.clearRect(0, 0, cw, ch); g.font = `900 ${px}px NotoSerifSC`; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = glow; g.shadowBlur = 40; g.fillStyle = color; g.fillText(str, cw / 2, ch / 2 + 10); g.shadowBlur = 0; t.needsUpdate = true; } };
  };
  /** 切成 TX×TY 的碎块，用来撞碎、撕碎 */
  w.tiles = (tex, pw, ph, TX, TY) => {
    const g = new THREE.Group(), list = [], mat = w.basic(tex);
    for (let y = 0; y < TY; y++) for (let x = 0; x < TX; x++) {
      const geo = new THREE.PlaneGeometry(pw / TX, ph / TY), uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + uv.getX(i)) / TX, (TY - 1 - y + uv.getY(i)) / TY);
      const m = new THREE.Mesh(geo, mat); m.userData = { hx: (x + .5) * pw / TX - pw / 2, hy: ph / 2 - (y + .5) * ph / TY, k: list.length }; g.add(m); list.push(m);
    }
    w.reg(g);
    g.userData.burst = (sp, grav = .5) => list.forEach((m) => { const { hx, hy, k } = m.userData, ax = hash(k) - .5, ay = hash(k + 50) - .5; m.position.set(hx + sp * (hx * 1.4 + ax * 9), hy + sp * (hy * 1.4 + ay * 9) - sp * sp * grav, sp * (10 + 12 * hash(k + 90))); m.rotation.set(sp * ax * 7, sp * ay * 7, sp * (ax - ay) * 5); });
    g.userData.mat = mat;
    return g;
  };

  // ── 粒子云 ──
  const dot = document.createElement("canvas"); dot.width = dot.height = 32;
  { const g = dot.getContext("2d"), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "#fff"); r.addColorStop(.5, "rgba(255,255,255,.75)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }
  const dotT = new THREE.CanvasTexture(dot);
  w.cloud = (N, size) => {
    const geo = new THREE.BufferGeometry(), P = new Float32Array(N * 3), Col = new Float32Array(N * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(P, 3)); geo.setAttribute("color", new THREE.BufferAttribute(Col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: dotT, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    pts.frustumCulled = false; w.reg(pts);
    return { pts, N, P, Col, show() { pts.visible = true; geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; } };
  };
  /** 把一张画布上不透明的像素采样成点（确定性） */
  w.sample = (c, N, worldH) => {
    const g = c.getContext("2d", { willReadFrequently: true }), d = g.getImageData(0, 0, c.width, c.height).data, pts = [];
    for (let y = 0; y < c.height; y += 3) for (let x = 0; x < c.width; x += 3) if (d[(y * c.width + x) * 4 + 3] > 128) pts.push([x, y]);
    const k = worldH / c.height, out = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const p = pts[Math.floor(hash(i + 1.7) * pts.length)]; out[i * 3] = (p[0] - c.width / 2) * k; out[i * 3 + 1] = (c.height / 2 - p[1]) * k; out[i * 3 + 2] = (hash(i * 3.1) - .5) * .25; }
    return out;
  };
  return w;
}
