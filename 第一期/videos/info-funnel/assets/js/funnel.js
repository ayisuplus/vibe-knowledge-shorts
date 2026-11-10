// 分层玻璃漏斗：外壳、环线、经线、口沿、过滤膜。局部坐标里口沿 y=3.2，颈部 y=-2.2。
import * as THREE from "three";
import { scene, lerp, smooth, clamp01, pulse, additiveBasic } from "./core.js";

export const Y_TOP = 3.2, Y_NECK = -2.2, Y_BOT = -3.1, R_TOP = 3.1, R_NECK = 0.22;
export function R(y) {
  if (y >= Y_TOP) return R_TOP;
  if (y <= Y_NECK) return R_NECK;
  const k = (y - Y_NECK) / (Y_TOP - Y_NECK);
  return R_NECK + (R_TOP - R_NECK) * Math.pow(k, 1.7);
}

const membraneVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const membraneFS = `
  uniform vec3 uColor; uniform float uBase; uniform float uPulse; uniform float uWave; uniform float uWaveAmp;
  varying vec2 vUv;
  void main(){
    vec2 p = vUv - 0.5; float r = length(p) * 2.0; float a = atan(p.y, p.x);
    float rings = smoothstep(0.08, 0.0, abs(fract(r * 9.0) - 0.5) - 0.42);
    float spokes = smoothstep(0.06, 0.0, abs(fract(a / 6.2831853 * 36.0) - 0.5) - 0.44) * step(0.25, r);
    float grid = max(rings, spokes);
    float edge = smoothstep(0.82, 1.0, r);
    float wave = exp(-pow((r - uWave) * 10.0, 2.0)) * uWaveAmp;
    float a1 = uBase * (grid * 0.35 + edge * 0.5) + uPulse * (grid * 0.8 + 0.18) + wave;
    gl_FragColor = vec4(uColor, a1 * step(r, 1.0));
  }`;

export function membraneMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uBase: { value: 0 }, uPulse: { value: 0 }, uWave: { value: 0 }, uWaveAmp: { value: 0 },
    },
    vertexShader: membraneVS, fragmentShader: membraneFS,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
}

// tiers: [{ y, color }]；返回 update(state)
export function buildFunnel({ yOff = 0, s = 1, tiers = [], lineColor = 0x00d8ff, shellColor = 0x00b8ff, mouthColor = 0xc8fbff }) {
  const group = new THREE.Group();
  group.position.y = yOff;
  group.scale.setScalar(s);
  scene.add(group);

  // 外壳（菲涅尔）
  const profile = [];
  for (let i = 0; i <= 80; i++) {
    const y = lerp(Y_BOT, Y_TOP, i / 80);
    profile.push(new THREE.Vector2(R(y), y));
  }
  const shellMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(shellColor) }, uAlpha: { value: 0 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uAlpha; varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.6);
        gl_FragColor = vec4(uColor, f * uAlpha);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 128), shellMat));

  // 环线
  const rings = [];
  const RING_COUNT = 28;
  for (let k = 0; k <= RING_COUNT; k++) {
    const y = lerp(Y_TOP, Y_BOT, k / RING_COUNT);
    const pts = [];
    for (let a = 0; a <= 128; a++) {
      const th = (a / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(th) * R(y), y, Math.sin(th) * R(y)));
    }
    const mat = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    rings.push({ mat, y });
  }
  // 经线
  const mpts = [];
  for (let m = 0; m < 40; m++) {
    const th = (m / 40) * Math.PI * 2;
    for (let i = 0; i < 60; i++) {
      const y0 = lerp(Y_TOP, Y_BOT, i / 60), y1 = lerp(Y_TOP, Y_BOT, (i + 1) / 60);
      mpts.push(new THREE.Vector3(Math.cos(th) * R(y0), y0, Math.sin(th) * R(y0)));
      mpts.push(new THREE.Vector3(Math.cos(th) * R(y1), y1, Math.sin(th) * R(y1)));
    }
  }
  const meridianMat = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(mpts), meridianMat));

  // 口沿 + 冲击波
  const mouthRim = new THREE.Mesh(new THREE.TorusGeometry(R_TOP, 0.02, 8, 160), additiveBasic(mouthColor));
  mouthRim.rotation.x = Math.PI / 2; mouthRim.position.y = Y_TOP;
  group.add(mouthRim);
  const shock = new THREE.Mesh(new THREE.TorusGeometry(R_TOP, 0.035, 8, 160), additiveBasic(0xffffff));
  shock.rotation.x = Math.PI / 2; shock.position.y = Y_TOP;
  group.add(shock);

  // 过滤层
  const tierObjs = tiers.map((tier) => {
    const r = R(tier.y);
    const mat = membraneMaterial(tier.color);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r * 0.985, 96), mat);
    disc.rotation.x = -Math.PI / 2; disc.position.y = tier.y;
    group.add(disc);
    const rimMat = additiveBasic(tier.color);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.022, 8, 160), rimMat);
    rim.rotation.x = Math.PI / 2; rim.position.y = tier.y;
    group.add(rim);
    return { y: tier.y, mat, rimMat };
  });

  // state: { t, vis, revealAt, dim, shockAt, tierPulse: [[times...]], heroY (局部), heroOn }
  function update(st) {
    const { t, vis, revealAt, dim = 1, shockAt = -99 } = st;
    group.visible = vis > 0.001;
    if (!group.visible) return;
    const v = vis * dim;
    rings.forEach((r) => {
      const at = revealAt + (Y_TOP - r.y) * 0.08;
      r.mat.opacity = (0.2 * smooth((t - at) / 0.25) + 0.35 * pulse(t, at, 6)) * v;
    });
    meridianMat.opacity = 0.07 * smooth((t - revealAt - 0.05) / 0.8) * v;
    shellMat.uniforms.uAlpha.value = 0.55 * smooth((t - revealAt) / 0.6) * v;
    mouthRim.material.opacity = (0.55 + 1.2 * pulse(t, shockAt, 3)) * smooth((t - revealAt + 0.1) / 0.15) * v;
    const sk = clamp01((t - shockAt) / 0.7);
    shock.scale.setScalar(1 + sk * 0.7);
    shock.material.opacity = t >= shockAt ? (1 - sk) * 0.6 * v : 0;

    tierObjs.forEach((o, i) => {
      const reveal = smooth((t - (revealAt + (Y_TOP - o.y) * 0.08)) / 0.3);
      let p = 0, wave = 0, waveAmp = 0;
      for (const at of (st.tierPulse && st.tierPulse[i]) || []) {
        p = Math.max(p, pulse(t, at, 3.2));
        if (t >= at && t < at + 0.7) { wave = clamp01((t - at) / 0.7) * 1.05; waveAmp = (1 - clamp01((t - at) / 0.7)) * 0.9; }
      }
      const hp = st.heroOn ? Math.exp(-Math.pow((st.heroY - o.y) / 0.12, 2)) : 0;
      const hold = (st.tierHold && st.tierHold[i]) || 0;
      o.mat.uniforms.uBase.value = (0.22 * reveal + 0.35 * hold) * v;
      o.mat.uniforms.uPulse.value = (0.9 * p + 0.7 * hp) * vis;
      o.mat.uniforms.uWave.value = wave;
      o.mat.uniforms.uWaveAmp.value = waveAmp * vis;
      o.rimMat.opacity = (0.45 * reveal + 1.4 * p + 1.2 * hp + 0.6 * hold) * v;
    });
  }
  return { group, update, tiers: tierObjs, yOff, s, toWorldY: (y) => yOff + s * y };
}
