// 《一分钟，拆解 AK-47》：一条驱动 tween，每帧状态都由 t 算出。
import { composer, ao, setAO, bloom, fx } from "./world.js";
import { BEAT, DUR, HITS, SHAKES, REAL } from "./beats.js";
import { clamp } from "./lib.js";
import { machineState, propsState, shot, fpsCamera } from "./sections.js";
import { envState } from "./env.js";
import { hudState } from "./hud.js";

const kick = (n) => { let k = 0; for (const h of HITS) if (n >= h) k = Math.max(k, Math.exp(-(n - h) * 4.5)); return k; };
const shake = (n) => { let k = 0; for (const h of SHAKES) if (n >= h) k = Math.max(k, Math.exp(-(n - h) * 7)); return k; };
const pulse = (n, h, rate = 9) => n >= h ? Math.exp(-(n - h) * rate) : 0;

function frame(t) {
  const n = t / BEAT, sk = shake(n), k = kick(n);
  const st = machineState(n, t); propsState(n, t);
  const blue = n >= 103.6 && n < 113;
  envState(n, t, blue);
  const dist = n < 6 ? (fpsCamera(n), 40) : shot(n, sk);
  const dive = n >= 84 && n < 87.5 ? .09 * clamp((n - 84) / 3.5) ** 2 : 0;
  fx.uniforms.uZoom.value = .006 * k + .03 * sk + dive; fx.uniforms.uAb.value = .0006 + .001 * k + .002 * sk;
  fx.uniforms.uFlash.value = Math.max(.2 * pulse(n, 6), .03 * pulse(n, 50), .06 * pulse(n, REAL), .3 * pulse(n, 103.6, 7), .12 * pulse(n, 113), n >= 127.55 ? .9 * clamp((n - 127.55) / .35) : 0);
  fx.uniforms.uSeed.value = Math.floor(t * 30) % 97;
  ao.enabled = !blue; setAO(clamp(dist * .025, .12, 2.5)); bloom.strength = blue ? .35 : .08;
  composer.render();
  hudState(n, t, st);
}

const tl = gsap.timeline({ paused: true }), driver = { t: 0 };
tl.to(driver, { t: DUR, duration: DUR, ease: "none", onUpdate: () => frame(driver.t) });
window.__registerMainTimeline(tl);
window.__DUR = DUR; window.__renderFrame = frame; frame(0);
