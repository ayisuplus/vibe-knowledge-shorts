// v3：每段一个「世界」。魔方是唯一不变的主角，背景、灯光跟着段落换。
// 照片背景（assets/img/env/*.jpg，Codex 生成后预先柔焦）当作无限远的天幕：镜头转多少，背景就平移多少（镜像平铺，甩镜也不露边）。
// 场景对象里写 env: "名字"；每帧 film.js 调 apply(名字, 镜头)，只看当前帧，可任意跳帧。
import * as THREE from "three";
import { PAL } from "./world.js";

const L = (hex, i, p) => ({ hex, i, p });
const DEF = { key: L(0xe8f6ff, 2.2, [-5, 9, 7]), fill: L(0x8fb8ff, 0.5, [6, 2, 6]), rimC: L(0x38e8ff, 2.4, [7, 4, -7]), rimV: L(0x7a5cff, 0.35, [-7, 3, -6]) };
export const ENVS = {
  stage: { stage: true, lights: DEF },
  blueprint: { img: "blueprint", bright: 0.9, lights: { key: L(0xdff3ff, 2.0, [-5, 9, 7]), fill: L(0x6fa8ff, 0.6, [6, 2, 6]), rimC: L(0x38e8ff, 3.0, [7, 4, -7]), rimV: L(0x2a6cff, 0.7, [-7, 3, -6]) } },
  y1974: { img: "1974", bright: 0.9, lights: { key: L(0xffcf9a, 2.4, [-6, 7, 5]), fill: L(0xff9a50, 0.45, [6, 2, 6]), rimC: L(0xffb060, 2.4, [7, 4, -7]), rimV: L(0x000000, 0, [-7, 3, -6]) } },
  space: { img: "space", bright: 1.0, lights: { key: L(0xf0f6ff, 2.1, [-5, 9, 7]), fill: L(0x6fd8e8, 0.4, [6, 2, 6]), rimC: L(0x40e0d0, 2.6, [7, 4, -7]), rimV: L(0xffc060, 1.1, [-7, 3, -6]) } },
  vault: { img: "vault", bright: 0.85, lights: { key: L(0xd8f0f0, 2.0, [-5, 9, 7]), fill: L(0x5fa0a0, 0.5, [6, 2, 6]), rimC: L(0x38e8ff, 1.8, [7, 4, -7]), rimV: L(0xff3040, 0.6, [-7, 3, -6]) } },
  tunnel: { color: 0x02050a, lights: { key: L(0xe8f6ff, 2.0, [-5, 9, 7]), fill: L(0x8fb8ff, 0.5, [6, 2, 6]), rimC: L(0x38e8ff, 3.0, [7, 4, -7]), rimV: L(0xffb040, 0.7, [-7, 3, -6]) } },
  collider: { img: "collider", bright: 0.85, lights: { key: L(0xe8f6ff, 2.0, [-5, 9, 7]), fill: L(0x8fd0ff, 0.6, [6, 2, 6]), rimC: L(0x60c8ff, 2.6, [7, 4, -7]), rimV: L(0xffffff, 0.5, [-7, 3, -6]) } },
  skylight: { img: "skylight", bright: 1.0, lights: { key: L(0xffffff, 3.4, [0.6, 12, 1.8]), fill: L(0x8a9aae, 0.3, [6, 2, 6]), rimC: L(0xd0ecff, 1.3, [5, 6, -7]), rimV: L(0x000000, 0, [-7, 3, -6]) } },
};

export async function buildEnvs(Wd, set) {
  const loader = new THREE.TextureLoader();
  const tex = {};
  await Promise.all(Object.values(ENVS).filter((e) => e.img).map(async (e) => {
    const t = await loader.loadAsync(`assets/img/env/${e.img}.jpg`);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8;
    t.userData.aspect = t.image.width / t.image.height;
    tex[e.img] = t;
  }));
  const bgColor = new THREE.Color(PAL.bg), dir = new THREE.Vector3();
  const SCREEN = 1920 / 1080, HF = 2 * Math.atan(Math.tan((32 * Math.PI) / 360) * SCREEN); // 32° 竖直视场对应的水平视场（弧度）
  let cur = null;

  /** opts: { transparent, yaw0, zoom, bright } —— yaw0 是这一段背景居中时镜头的朝向 */
  function apply(name, o = {}) {
    const S = Wd.scene, cam = Wd.camera;
    if (o.transparent) { S.background = null; S.fog = null; Wd.stage.visible = false; set.visible = false; cur = null; return; }
    const e = ENVS[name] || ENVS.stage;
    Wd.stage.visible = !!e.stage; set.visible = !!e.stage;
    if (e.stage) { S.background = bgColor; S.fog = S.fog || new THREE.Fog(PAL.bg, 14, 46); S.backgroundIntensity = 1; }
    else if (e.color != null) { S.background = new THREE.Color(e.color); S.fog = null; }
    else {
      const t = tex[e.img]; S.background = t; S.fog = null; S.backgroundIntensity = (e.bright ?? 1) * (o.bright ?? 1);
      // 视场越宽，看到的天幕越多（推拉变焦时背景跟着变）
      const z = (o.zoom ?? 1.22) * Math.tan((32 * Math.PI) / 360) / Math.tan((cam.fov * Math.PI) / 360);
      const rx = 1 / z, ry = (t.userData.aspect / SCREEN) / z;
      cam.getWorldDirection(dir);
      const yaw = Math.atan2(dir.x, dir.z), pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
      let dy = yaw - (o.yaw0 ?? 0); dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const k = 0.75; // 比真·无限远稍慢一点，更稳
      t.repeat.set(rx, ry);
      t.offset.set(0.5 - rx / 2 - (k * dy / HF) * rx - (o.pan ?? 0) * rx, 0.5 - ry / 2 + (k * pitch / (HF / SCREEN)) * ry * 0.6 + (o.tilt ?? 0));
    }
    const lt = e.lights;
    for (const n of ["key", "fill", "rimC", "rimV"]) { const l = Wd.lights[n], s = lt[n]; l.color.setHex(s.hex); l.intensity = s.i; l.position.set(...s.p); }
    cur = name;
  }
  return { apply, ENVS, current: () => cur };
}
