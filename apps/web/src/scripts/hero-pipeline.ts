/**
 * Ops pipeline sculpture — one WebGL scene for home hero.
 * Matte charcoal nodes + conduits (intake → route → exception).
 * Idle yaw ≤8°, pointer tilt ≤4°. No particles/glow orbs.
 */
import * as THREE from "three";

const INK = 0x0e1014;
const CHARCOAL = 0x1e2430;
const CHARCOAL_MID = 0x161a22;
const PAPER = 0xf4f1ea;
const COPPER = 0xc96a3d;
const LINE = 0x3a4050;

type Options = {
  canvas: HTMLCanvasElement;
  reduced: boolean;
  mobile: boolean;
};

export function mountHeroPipeline({ canvas, reduced, mobile }: Options): () => void {
  const parent = canvas.parentElement;
  if (!parent) return () => {};

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);

  const w = parent.clientWidth || 400;
  const h = parent.clientHeight || 500;
  const aspect = w / Math.max(h, 1);

  // ¾ orthographic-ish feel via mild perspective + framing
  const camera = new THREE.PerspectiveCamera(32, aspect, 0.1, 100);
  camera.position.set(4.2, 2.8, 5.6);
  camera.lookAt(0, 0.15, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: mobile ? "low-power" : "default",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75));
  renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const matNode = new THREE.MeshStandardMaterial({
    color: CHARCOAL,
    roughness: 0.82,
    metalness: 0.18,
  });
  const matNodeAlt = new THREE.MeshStandardMaterial({
    color: CHARCOAL_MID,
    roughness: 0.88,
    metalness: 0.12,
  });
  const matCopper = new THREE.MeshStandardMaterial({
    color: COPPER,
    roughness: 0.45,
    metalness: 0.55,
    emissive: COPPER,
    emissiveIntensity: 0.12,
  });
  const matConduit = new THREE.MeshStandardMaterial({
    color: LINE,
    roughness: 0.7,
    metalness: 0.25,
  });
  const matLabel = new THREE.MeshBasicMaterial({ color: PAPER });

  const root = new THREE.Group();
  scene.add(root);

  function boxNode(sx: number, sy: number, sz: number, mat = matNode) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    return m;
  }

  function cylinderConduit(len: number, radius = 0.045) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 10), matConduit);
    return m;
  }

  // Nodes: intake → route → exception (left → mid → right/up)
  const intake = boxNode(0.95, 0.55, 0.7, matNode);
  intake.position.set(-1.55, -0.15, 0.2);
  root.add(intake);

  const route = boxNode(0.85, 0.7, 0.85, matNodeAlt);
  route.position.set(0.05, 0.35, -0.15);
  root.add(route);

  const exception = boxNode(0.75, 0.5, 0.65, matNode);
  exception.position.set(1.55, -0.05, 0.35);
  root.add(exception);

  // ONE copper active edge on route (top front edge bar)
  const copperEdge = boxNode(0.88, 0.04, 0.04, matCopper);
  copperEdge.position.set(0.05, 0.72, 0.28);
  root.add(copperEdge);

  // Soft bevel accents — thin plates on nodes
  const plate = boxNode(0.55, 0.03, 0.4, matLabel);
  plate.position.set(-1.55, 0.15, 0.2);
  root.add(plate);

  const plate2 = boxNode(0.4, 0.03, 0.35, matLabel);
  plate2.position.set(1.55, 0.22, 0.35);
  root.add(plate2);

  // Conduits intake → route
  const c1 = cylinderConduit(1.55, 0.04);
  c1.rotation.z = Math.PI / 2;
  c1.rotation.y = -0.18;
  c1.position.set(-0.72, 0.12, 0.05);
  root.add(c1);

  // Conduit route → exception
  const c2 = cylinderConduit(1.45, 0.038);
  c2.rotation.z = Math.PI / 2;
  c2.rotation.y = 0.22;
  c2.position.set(0.78, 0.18, 0.12);
  root.add(c2);

  // Secondary thinner conduit (bypass / sync)
  const c3 = cylinderConduit(1.2, 0.028);
  c3.rotation.z = Math.PI / 2 + 0.35;
  c3.position.set(-0.55, -0.35, -0.25);
  root.add(c3);

  // Small satellite nodes (systems language, not mascot)
  const sat1 = boxNode(0.28, 0.28, 0.28, matNodeAlt);
  sat1.position.set(-0.9, 0.95, -0.6);
  root.add(sat1);

  const satLink = cylinderConduit(0.85, 0.022);
  satLink.position.set(-0.55, 0.7, -0.4);
  satLink.rotation.z = 0.9;
  satLink.rotation.x = 0.4;
  root.add(satLink);

  // Ground plane hairline frame (editorial, not grid glow)
  const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(4.2, 0.02, 3.2));
  const frame = new THREE.LineSegments(
    frameGeo,
    new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: 0.45 })
  );
  frame.position.set(0, -0.85, 0);
  root.add(frame);

  // Lights — soft, no neon
  const amb = new THREE.AmbientLight(0xb8bcc8, 0.55);
  scene.add(amb);
  const key = new THREE.DirectionalLight(0xf4f1ea, 0.85);
  key.position.set(3, 5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8a909c, 0.35);
  fill.position.set(-4, 1, -2);
  scene.add(fill);
  const copperRim = new THREE.PointLight(COPPER, 0.55, 6);
  copperRim.position.set(0.2, 1.2, 1.5);
  scene.add(copperRim);

  let raf = 0;
  let running = true;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const baseRotY = -0.12;
  const baseRotX = 0.08;
  root.rotation.y = baseRotY;
  root.rotation.x = baseRotX;

  const onPointer = (e: PointerEvent) => {
    if (reduced || mobile) return;
    const r = parent.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    pointer.tx = THREE.MathUtils.clamp(nx, -1, 1);
    pointer.ty = THREE.MathUtils.clamp(ny, -1, 1);
  };

  const onResize = () => {
    const cw = parent.clientWidth || 400;
    const ch = parent.clientHeight || 500;
    camera.aspect = cw / Math.max(ch, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  };

  parent.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("resize", onResize);

  const t0 = performance.now();
  const yawAmp = (8 * Math.PI) / 180; // ≤8°
  const tiltAmp = (4 * Math.PI) / 180; // ≤4°

  function tick(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    if (!reduced) {
      const t = (now - t0) / 1000;
      const idleYaw = Math.sin(t * 0.35) * yawAmp;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      root.rotation.y = baseRotY + idleYaw + pointer.x * tiltAmp;
      root.rotation.x = baseRotX + pointer.y * tiltAmp * 0.65;
    }
    renderer.render(scene, camera);
  }

  if (reduced) {
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(tick);
  }

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    parent.removeEventListener("pointermove", onPointer);
    window.removeEventListener("resize", onResize);
    matNode.dispose();
    matNodeAlt.dispose();
    matCopper.dispose();
    matConduit.dispose();
    matLabel.dispose();
    renderer.dispose();
  };
}
