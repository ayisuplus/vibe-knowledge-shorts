// 场景根：渲染器、相机、背景星空、贴图加载，以及所有星球共用的着色器。
// 星球的光照方向是每颗星自己的 uniform（世界坐标），由 film.js 每帧按时间算出——
// 默认跟着机位做「主光从镜头左上方来」，Kimi、GPT 等需要固定光源的单独指定。
import * as THREE from "three";

export const NOISE = `
  vec3 h3(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return -1.+2.*fract(sin(p)*43758.5453);}
  float n3(vec3 p){vec3 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
    return mix(mix(mix(dot(h3(i),f),dot(h3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),mix(dot(h3(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(h3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
               mix(mix(dot(h3(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(h3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),mix(dot(h3(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(h3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);}
  float fbm(vec3 p){float a=.5,v=0.;for(int i=0;i<5;i++){v+=a*n3(p);p*=2.03;a*=.5;}return v;}`;

// 固定种子随机数：同一个种子永远同一串数，跳帧一致
export function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function buildWorld(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  r.setPixelRatio(1);
  r.setSize(canvas.width, canvas.height, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping;   // ACES 会把青色推成薄荷绿（样张阶段定下的）
  r.toneMappingExposure = 1.0;
  r.setClearColor(0x03030a, 1);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, canvas.width / canvas.height, 0.02, 4000);

  // 背景星空：两层，远处细密、近处稀疏稍亮；位置在一个大球壳上，跟着相机走（只做背景）
  const sky = new THREE.Group();
  const rnd = rng(7);
  for (const [n, R, size, col] of [[6000, 1800, 1.6, 0xb8c0dc], [900, 1600, 3.2, 0xe6ecff]]) {
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, b = Math.acos(2 * rnd() - 1);
      p.set([R * Math.sin(b) * Math.cos(a), R * Math.cos(b), R * Math.sin(b) * Math.sin(a)], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: col, size, sizeAttenuation: false, transparent: true, opacity: 0.8, depthWrite: false }));
    pts.frustumCulled = false; sky.add(pts);
  }
  scene.add(sky);

  const loader = new THREE.TextureLoader();
  const tex = async (name) => {
    const t = await loader.loadAsync(`assets/tex/${name}.jpg`);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = r.capabilities.getMaxAnisotropy();
    return t;
  };

  const tmp = new THREE.Vector3();
  return {
    THREE, r, scene, cam, tex, sky,
    setCam(pos, tgt, roll = 0) {
      cam.position.set(pos[0], pos[1], pos[2]);
      cam.up.set(Math.sin(roll), Math.cos(roll), 0);
      cam.lookAt(tmp.set(tgt[0], tgt[1], tgt[2]));
      sky.position.copy(cam.position);
    },
    // 机位相关的主光方向（世界坐标）：从镜头左上前方照向画面
    keyLight(out = new THREE.Vector3()) {
      const m = cam.matrixWorld.elements;          // 列：右、上、后
      return out.set(-0.55 * m[0] + 0.45 * m[4] + 0.7 * m[8], -0.55 * m[1] + 0.45 * m[5] + 0.7 * m[9], -0.55 * m[2] + 0.45 * m[6] + 0.7 * m[10]).normalize();
    },
    render() { cam.updateMatrixWorld(); r.render(scene, cam); },
  };
}

// ---------- 星球：贴图＋可指定光照方向＋可选夜光贴图/自发光；外加只在受光面亮的大气 ----------
const PV = `varying vec2 vUv;varying vec3 wN;varying vec3 wP;
  void main(){vUv=uv;wN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);wP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const PF = `uniform sampler2D map;uniform sampler2D night;uniform float useNight;uniform vec3 L;uniform float amb;uniform float kd;uniform float emis;uniform float dim;uniform float time;
  varying vec2 vUv;varying vec3 wN;varying vec3 wP;
  void main(){
    vec3 a=texture2D(map,vUv).rgb;
    float ndl=dot(normalize(wN),L);
    vec3 c=a*(max(ndl,0.)*kd+amb)+a*emis;
    if(useNight>.5){                                                     // Kimi：背光面只亮夜光细线，沿线有光脉冲流动
      float dark=1.-smoothstep(-.12,.06,ndl);
      float g=texture2D(night,vUv).r;
      float pulse=.55+.45*pow(.5+.5*sin(vUv.x*62.83-time*1.4+vUv.y*9.),3.);
      c+=vec3(.72,.84,1.)*g*pulse*dark*1.6;
    }
    gl_FragColor=vec4(c*dim,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const AV = `varying vec3 n;varying vec3 v;varying vec3 wn;void main(){n=normalize(normalMatrix*normal);wn=normalize(mat3(modelMatrix)*normal);vec4 mv=modelViewMatrix*vec4(position,1.);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
const AF = `uniform vec3 c;uniform vec3 L;uniform float k;varying vec3 n;varying vec3 v;varying vec3 wn;
  void main(){float d=clamp(-dot(n,v),0.,1.);float f=pow(smoothstep(0.,.42,d),2.)*(1.-smoothstep(.42,.55,d));float day=smoothstep(-.35,.45,dot(wn,L));gl_FragColor=vec4(c*f*day*1.1*k,1.);}`;

export function planet(W, map, { R = 1, atm = 0xf2a679, amb = 0.03, kd = 1.15, emis = 0, night = null, atmK = 1 } = {}) {
  const { THREE } = W;
  const U = { map: { value: map }, night: { value: night || map }, useNight: { value: night ? 1 : 0 }, L: { value: new THREE.Vector3(0, 0, 1) },
    amb: { value: amb }, kd: { value: kd }, emis: { value: emis }, dim: { value: 1 }, time: { value: 0 } };
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(R, 192, 96), new THREE.ShaderMaterial({ uniforms: U, vertexShader: PV, fragmentShader: PF }));
  g.add(body);
  const AU = { c: { value: new THREE.Color(atm) }, L: U.L, k: { value: atmK } };
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R * 1.09, 128, 64), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: AU, vertexShader: AV, fragmentShader: AF }));
  g.add(shell);
  return { g, body, U, AU, R };
}

// 面向镜头的发光点（星、星芒、光晕都用它）：kind 0=圆形光晕 1=十字星芒
export function glowMat(W, color, { kind = 0, k = 1 } = {}) {
  const { THREE } = W;
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { c: { value: new THREE.Color(color) }, k: { value: k }, kind: { value: kind } },
    vertexShader: "varying vec2 u;void main(){u=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `uniform vec3 c;uniform float k;uniform float kind;varying vec2 u;
      void main(){float r=length(u);
        float core=exp(-r*22.)*2.;float halo=exp(-r*5.)*.45;
        float spike=kind>.5?(exp(-abs(u.x)*80.)+exp(-abs(u.y)*80.))*exp(-r*3.):0.;
        float i=(core+halo+spike*.9)*k*smoothstep(1.,.7,r);
        gl_FragColor=vec4(c*i,1.);}`,
  });
}
