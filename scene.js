import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.getElementById("bg-canvas");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const compactScene = window.matchMedia("(max-width: 768px)").matches;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !compactScene,
    powerPreference: "high-performance",
  });
} catch {
  document.documentElement.classList.add("no-webgl");
  canvas.hidden = true;
}

if (renderer) {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactScene ? 1.25 : 1.75));
  renderer.setClearColor(0xf5f5f0, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf5f5f0, 0.00025);

  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.5, 6000);
  camera.position.set(0, 120, 520);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, -55, 0);
  controls.enableRotate = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.55;
  controls.panSpeed = 0.7;
  controls.zoomSpeed = 0.55;
  controls.screenSpacePanning = true;
  controls.minDistance = 80;
  controls.maxDistance = 900;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };
  controls.autoRotate = !reducedMotion && !compactScene;
  controls.autoRotateSpeed = 0.3;
  controls.enabled = !compactScene;
  controls.update();
  if (compactScene) canvas.style.touchAction = "pan-y";

  let orbitResumeTimer;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    clearTimeout(orbitResumeTimer);
  });
  controls.addEventListener("end", () => {
    if (reducedMotion || compactScene) return;
    orbitResumeTimer = setTimeout(() => { controls.autoRotate = true; }, 2500);
  });

  canvas.addEventListener("wheel", (event) => {
    if (window.portfolioHandleWheel) {
      window.portfolioHandleWheel(event);
      event.stopImmediatePropagation();
    }
  }, { capture: true, passive: false });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("pointerdown", (event) => {
    canvas.classList.remove("dragging", "panning", "dollying");
    if (event.button === 0) canvas.classList.add("dragging");
    if (event.button === 1) canvas.classList.add("dollying");
    if (event.button === 2) canvas.classList.add("panning");
  });
  window.addEventListener("pointerup", () => canvas.classList.remove("dragging", "panning", "dollying"));

  function makeDotTexture(color = "26,95,255") {
    const dot = document.createElement("canvas");
    dot.width = 16;
    dot.height = 16;
    const context = dot.getContext("2d");
    const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, `rgba(${color},1)`);
    gradient.addColorStop(0.4, `rgba(${color},.58)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(dot);
  }

  const blueDot = makeDotTexture();

  function buildStars(count, minRadius, radiusRange, size, opacity) {
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = minRadius + Math.random() * radiusRange;
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[index * 3 + 2] = radius * Math.cos(phi);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      map: blueDot,
      color: 0x1a5fff,
      size,
      opacity,
      transparent: true,
      depthWrite: false,
    });
    scene.add(new THREE.Points(geometry, material));
    return material;
  }

  const starMaterial = buildStars(compactScene ? 6500 : 20000, 2200, 4500, compactScene ? 4 : 4.5, 0.55);
  const nearStarMaterial = buildStars(compactScene ? 400 : 950, 400, 1600, 3.2, 0.32);

  const gridGroup = new THREE.Group();
  const gridSize = 700;
  const gridDivisions = 35;
  const gridStep = gridSize / gridDivisions;
  const gridVertices = [];
  for (let index = 0; index <= gridDivisions; index += 1) {
    const point = -gridSize / 2 + index * gridStep;
    gridVertices.push(-gridSize / 2, 0, point, gridSize / 2, 0, point);
    gridVertices.push(point, 0, -gridSize / 2, point, 0, gridSize / 2);
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(gridVertices, 3));
  const gridLineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
  gridGroup.add(new THREE.LineSegments(gridGeometry, gridLineMaterial));

  const axisGeometry = new THREE.BufferGeometry();
  axisGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -gridSize / 2, 0, 0, gridSize / 2, 0, 0,
    0, 0, -gridSize / 2, 0, 0, gridSize / 2,
  ], 3));
  const gridAxisMaterial = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 });
  gridGroup.add(new THREE.LineSegments(axisGeometry, gridAxisMaterial));

  const yAxisGeometry = new THREE.BufferGeometry();
  yAxisGeometry.setAttribute("position", new THREE.Float32BufferAttribute([0, -gridSize / 2, 0, 0, gridSize / 2, 0], 3));
  const gridYAxisMaterial = gridAxisMaterial.clone();
  gridGroup.add(new THREE.LineSegments(yAxisGeometry, gridYAxisMaterial));
  gridGroup.position.y = -55;
  scene.add(gridGroup);

  const waveColumns = compactScene ? 38 : 60;
  const waveRows = compactScene ? 58 : 90;
  const waveCount = waveColumns * waveRows;
  const wavePositions = new Float32Array(waveCount * 3);
  const waveOriginalX = new Float32Array(waveCount);
  for (let row = 0; row < waveRows; row += 1) {
    for (let column = 0; column < waveColumns; column += 1) {
      const index = row * waveColumns + column;
      const x = (column / (waveColumns - 1) - 0.5) * 580;
      wavePositions[index * 3] = x;
      wavePositions[index * 3 + 2] = -(row / (waveRows - 1)) * 1100;
      waveOriginalX[index] = x;
    }
  }

  const waveGeometry = new THREE.BufferGeometry();
  waveGeometry.setAttribute("position", new THREE.BufferAttribute(wavePositions, 3));
  const waveMaterial = new THREE.PointsMaterial({
    size: compactScene ? 4 : 4.5,
    color: 0x1a5fff,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const waveGroup = new THREE.Group();
  waveGroup.add(new THREE.Points(waveGeometry, waveMaterial));
  scene.add(waveGroup);

  const waveMaterial2 = waveMaterial.clone();
  waveMaterial2.opacity = 0.3;
  waveMaterial2.color.set(0x5588ff);
  const waveGroup2 = new THREE.Group();
  waveGroup2.add(new THREE.Points(waveGeometry, waveMaterial2));
  waveGroup2.position.y = 30;
  scene.add(waveGroup2);

  const tornadoGroup = new THREE.Group();
  const tornadoStrands = compactScene ? 4 : 6;
  const tornadoPoints = compactScene ? 130 : 220;
  const tornadoHeight = 320;
  const tornadoRadius = 95;
  for (let strand = 0; strand < tornadoStrands; strand += 1) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(tornadoPoints * 3), 3));
    tornadoGroup.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color: [0xff1111, 0xcc0000, 0xff4422, 0xdd1133, 0xff2200, 0xbb0011][strand],
      transparent: true,
      opacity: 0.75,
    })));
  }

  const dustCount = compactScene ? 260 : 600;
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(dustCount * 3), 3));
  tornadoGroup.add(new THREE.Points(dustGeometry, new THREE.PointsMaterial({
    map: makeDotTexture("255,34,34"),
    size: 3.5,
    color: 0xff2222,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })));
  tornadoGroup.position.set(0, -55, -80);
  scene.add(tornadoGroup);

  const pointer = { x: 0, y: 0 };
  const tornadoVelocity = { x: 0, z: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / window.innerWidth * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight * 2 - 1);
  }, { passive: true });

  function tornadoNoise(x, y, time) {
    return Math.sin(x * 1.9 + y * 2.5 + time * 0.8) * 0.5
      + Math.sin(x * 3.7 - y * 1.3 + time * 1.4) * 0.25
      + Math.sin(x * 7.1 + y * 4.3 - time * 2.1) * 0.125;
  }

  const pulseRingGeometry = new THREE.RingGeometry(4, 6, 40);
  const pulseBranchPointCount = 9;
  const pulseBoltPointCount = 15;
  const pulseDuration = 1700;
  const pulsePurple = 0x7c3aed;
  const pulseDot = makeDotTexture("255,255,255");
  const pulsePool = Array.from({ length: 4 }, () => {
    const group = new THREE.Group();
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: pulsePurple,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(pulseRingGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.35;
    group.add(ring);

    const strikeGeometry = new THREE.BufferGeometry();
    strikeGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pulseBoltPointCount * 3), 3));
    const strike = new THREE.Line(strikeGeometry, new THREE.LineBasicMaterial({
      color: pulsePurple,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending,
    }));
    group.add(strike);

    const branches = Array.from({ length: 3 }, () => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pulseBranchPointCount * 3), 3));
      const material = new THREE.LineBasicMaterial({
        color: pulsePurple,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geometry, material);
      group.add(line);
      return line;
    });

    const sparkGeometry = new THREE.BufferGeometry();
    sparkGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 3), 3));
    const sparks = new THREE.Points(sparkGeometry, new THREE.PointsMaterial({
      map: pulseDot,
      color: 0xa855f7,
      size: 16,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    group.add(sparks);
    group.visible = false;
    gridGroup.add(group);
    return {
      group,
      ring,
      strike,
      branches,
      sparks,
      started: 0,
      duration: pulseDuration,
      branchCount: 0,
    };
  });

  // Floor plane is XZ in Three.js; user-facing "Z up" is the world Y axis.
  const pulseFloorDirections = [
    [1, 0, 0],
    [0, 0, 1],
    [-1, 0, 0],
    [0, 0, -1],
  ];
  let pulseCursor = 0;
  let pulseThemeBelow = false;
  const pulseLocalPoint = new THREE.Vector3();
  const pulseTopWorld = new THREE.Vector3();
  const pulseTopLocal = new THREE.Vector3();

  function applyPulseTheme(pulse, below) {
    const lineColor = below ? 0x1a5fff : pulsePurple;
    const sparkColor = below ? 0x7da6ff : 0xa855f7;
    const blending = below ? THREE.AdditiveBlending : THREE.NormalBlending;
    pulse.ring.material.color.setHex(lineColor);
    pulse.ring.material.blending = blending;
    pulse.strike.material.color.setHex(lineColor);
    pulse.strike.material.blending = blending;
    pulse.branches.forEach((branch) => {
      branch.material.color.setHex(lineColor);
      branch.material.blending = blending;
    });
    pulse.sparks.material.color.setHex(sparkColor);
    pulse.sparks.material.blending = blending;
    pulse.sparks.material.map = pulseDot;
  }

  function writePulseBranch(target, direction, steps, seed) {
    const [directionX, , directionZ] = direction;
    const length = steps * gridStep;
    for (let pointIndex = 0; pointIndex < pulseBranchPointCount; pointIndex += 1) {
      const progress = pointIndex / (pulseBranchPointCount - 1);
      const flicker = Math.sin(pointIndex * 4.1 + seed) * 0.55;
      target[pointIndex * 3] = directionX * length * progress;
      target[pointIndex * 3 + 1] = 0.8 + flicker;
      target[pointIndex * 3 + 2] = directionZ * length * progress;
    }
  }

  function writeLightningBolt(target, start) {
    const jag = 18 + Math.random() * 18;
    for (let pointIndex = 0; pointIndex < pulseBoltPointCount; pointIndex += 1) {
      const progress = pointIndex / (pulseBoltPointCount - 1);
      const envelope = Math.sin(progress * Math.PI);
      target[pointIndex * 3] = start.x * (1 - progress) + (Math.random() - 0.5) * jag * envelope;
      target[pointIndex * 3 + 1] = start.y * (1 - progress) + (Math.random() - 0.5) * jag * 0.45 * envelope;
      target[pointIndex * 3 + 2] = start.z * (1 - progress) + (Math.random() - 0.5) * jag * envelope;
    }
  }

  function triggerGridPulse(point, pointerNdc, milliseconds) {
    const pulse = pulsePool[pulseCursor];
    pulseCursor = (pulseCursor + 1) % pulsePool.length;
    gridGroup.worldToLocal(pulseLocalPoint.copy(point));
    const landingX = clamp(Math.round(pulseLocalPoint.x / gridStep) * gridStep, -gridSize / 2, gridSize / 2);
    const landingZ = clamp(Math.round(pulseLocalPoint.z / gridStep) * gridStep, -gridSize / 2, gridSize / 2);
    pulse.group.position.set(
      landingX,
      0,
      landingZ,
    );
    pulse.group.visible = true;
    pulse.started = milliseconds;
    pulse.duration = reducedMotion ? 360 : pulseDuration;
    pulse.ring.scale.setScalar(0.45);

    const distance = camera.position.distanceTo(point);
    pulseTopWorld
      .set(clamp(pointerNdc.x + (Math.random() - 0.5) * 0.75, -0.95, 0.95), 1.08, 0)
      .unproject(camera)
      .sub(camera.position)
      .normalize()
      .multiplyScalar(distance)
      .add(camera.position);
    gridGroup.worldToLocal(pulseTopLocal.copy(pulseTopWorld));
    pulseTopLocal.set(pulseTopLocal.x - landingX, pulseTopLocal.y, pulseTopLocal.z - landingZ);
    writeLightningBolt(pulse.strike.geometry.attributes.position.array, pulseTopLocal);
    pulse.strike.geometry.setDrawRange(0, 0);
    pulse.strike.geometry.attributes.position.needsUpdate = true;
    applyPulseTheme(pulse, pulseThemeBelow);

    const directionOffset = pulseCursor % 4;
    const branchCount = 3;
    pulse.branchCount = branchCount;
    const sparkPositions = pulse.sparks.geometry.attributes.position.array;

    pulse.branches.forEach((branch, branchIndex) => {
      if (branchIndex >= branchCount) {
        branch.geometry.setDrawRange(0, 0);
        return;
      }

      const direction = pulseFloorDirections[(branchIndex + directionOffset) % pulseFloorDirections.length];
      const steps = 2 + (branchIndex + pulseCursor) % 3;
      const positions = branch.geometry.attributes.position.array;
      writePulseBranch(positions, direction, steps, branchIndex * 11 + pulseCursor * 3);
      branch.geometry.setDrawRange(0, pulseBranchPointCount);
      branch.geometry.attributes.position.needsUpdate = true;

      const tip = (pulseBranchPointCount - 1) * 3;
      sparkPositions[branchIndex * 3] = positions[tip];
      sparkPositions[branchIndex * 3 + 1] = positions[tip + 1];
      sparkPositions[branchIndex * 3 + 2] = positions[tip + 2];
    });
    pulse.sparks.geometry.setDrawRange(0, branchCount);
    pulse.sparks.geometry.attributes.position.needsUpdate = true;
  }

  const raycaster = new THREE.Raycaster();
  const gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 55);
  const intersection = new THREE.Vector3();
  const clickNdc = new THREE.Vector2();
  let clickStart;

  document.addEventListener("pointerdown", (event) => {
    if (event.button === 0 && event.isPrimary !== false) clickStart = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  }, true);
  document.addEventListener("pointermove", (event) => {
    if (!clickStart || clickStart.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - clickStart.x, event.clientY - clickStart.y) > 5) clickStart.moved = true;
  }, true);
  document.addEventListener("pointercancel", () => { clickStart = null; }, true);
  document.addEventListener("pointerup", (event) => {
    if (!clickStart || clickStart.id !== event.pointerId || clickStart.moved || event.button !== 0) {
      clickStart = null;
      return;
    }
    clickNdc.set(
      event.clientX / window.innerWidth * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );
    raycaster.setFromCamera(clickNdc, camera);
    gridPlane.constant = -gridGroup.position.y;
    if (!raycaster.ray.intersectPlane(gridPlane, intersection)) {
      intersection.set(controls.target.x, gridGroup.position.y, controls.target.z);
    }
    triggerGridPulse(intersection, clickNdc, performance.now());
    clickStart = null;
  }, true);

  const backgroundLight = new THREE.Color(0xf5f5f0);
  const backgroundDark = new THREE.Color(0x050505);
  const lineBlack = new THREE.Color(0x000000);
  const lineWhite = new THREE.Color(0xffffff);
  const waveBlue = new THREE.Color(0x1a5fff);
  const waveAmber = new THREE.Color(0xe5a000);
  const waveBlue2 = new THREE.Color(0x5588ff);
  const waveAmber2 = new THREE.Color(0xaa7700);
  const starBlue = new THREE.Color(0x1a5fff);
  const starWhite = new THREE.Color(0xffffff);
  const colorBuffer = new THREE.Color();
  const brightnessOverlay = document.getElementById("brightness-overlay");

  let rawScrollProgress = 0;
  let rawOutroProgress = 0;
  let sceneProgress = 0;
  const sceneOutro = document.getElementById("scene-outro");
  function updateScrollProgress() {
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    const contentEnd = Math.max(sceneOutro.offsetTop - window.innerHeight, 1);
    rawScrollProgress = clamp(window.scrollY / contentEnd, 0, 1);
    rawOutroProgress = clamp((window.scrollY - contentEnd) / Math.max(maximum - contentEnd, 1), 0, 1);
  }
  updateScrollProgress();
  sceneProgress = rawScrollProgress;
  window.addEventListener("scroll", updateScrollProgress, { passive: true });

  function updatePulses(milliseconds) {
    pulsePool.forEach((pulse) => {
      if (!pulse.group.visible) return;
      const progress = (milliseconds - pulse.started) / pulse.duration;
      if (progress >= 1) {
        pulse.group.visible = false;
        return;
      }

      const impact = clamp(progress / 0.18, 0, 1);
      const fade = progress < 0.62 ? 1 : 1 - (progress - 0.62) / 0.38;
      pulse.strike.geometry.setDrawRange(0, Math.max(2, Math.ceil(impact * (pulseBoltPointCount - 1)) + 1));
      const flash = 0.68 + Math.sin(progress * 90) ** 2 * 0.32;
      pulse.strike.material.opacity = progress < 0.3 ? (1 - progress / 0.3) * flash : 0;
      pulse.branches.forEach((branch) => {
        branch.material.opacity = impact * fade * (pulseThemeBelow ? 0.9 : 1);
      });
      pulse.ring.scale.setScalar(reducedMotion ? 1.8 : 0.45 + Math.min(progress / 0.7, 1) * 3.6);
      pulse.ring.material.opacity = impact * fade * (pulseThemeBelow ? 0.7 : 0.85);
      pulse.sparks.material.opacity = impact * fade * (0.72 + Math.sin(progress * 12) * 0.16);
    });
  }

  function updateScene(milliseconds) {
    const elapsed = reducedMotion ? 0 : milliseconds / 1000;
    sceneProgress += (rawScrollProgress - sceneProgress) * (reducedMotion ? 1 : 0.1);
    const progress = clamp(sceneProgress, 0, 1);
    const waveBlend = Math.sin(progress * Math.PI * 0.5);

    for (let row = 0; row < waveRows; row += 1) {
      const rowProgress = row / (waveRows - 1);
      for (let column = 0; column < waveColumns; column += 1) {
        const index = row * waveColumns + column;
        const x = waveOriginalX[index];
        const z = wavePositions[index * 3 + 2];
        const waveY = 52 * Math.sin(0.016 * x + 0.01 * z - elapsed * 1.1)
          + 28 * Math.sin(0.028 * x - 0.018 * z - elapsed * 1.7)
          + 11 * Math.sin(0.055 * x + 0.038 * z - elapsed * 3.1);
        const spread = column / (waveColumns - 1) - 0.5;
        const angle = rowProgress * 12 * Math.PI + spread * Math.PI * 0.7 + elapsed * 0.3;
        const spiralX = 220 * Math.cos(angle);
        const spiralY = 220 * Math.sin(angle) + waveY * 0.15;
        wavePositions[index * 3] = x * (1 - waveBlend) + spiralX * waveBlend;
        wavePositions[index * 3 + 1] = waveY * (1 - waveBlend) + spiralY * waveBlend;
      }
    }
    waveGeometry.attributes.position.needsUpdate = true;
    waveGroup.position.set(0, -30, -200 + progress * 700);
    waveGroup2.position.z = waveGroup.position.z + 80;

    const tornadoTargetX = pointer.x * 320;
    const tornadoTargetZ = -pointer.y * 240 - 60;
    tornadoVelocity.x += (tornadoTargetX - tornadoGroup.position.x) * 0.006;
    tornadoVelocity.z += (tornadoTargetZ - tornadoGroup.position.z) * 0.006;
    tornadoVelocity.x *= 0.82;
    tornadoVelocity.z *= 0.82;
    tornadoGroup.position.x += tornadoVelocity.x;
    tornadoGroup.position.z += tornadoVelocity.z;
    tornadoGroup.position.y = -55;

    const mouseDistance = Math.hypot(pointer.x, pointer.y);
    for (let strand = 0; strand < tornadoStrands; strand += 1) {
      const positions = tornadoGroup.children[strand].geometry.attributes.position.array;
      const baseAngle = strand / tornadoStrands * Math.PI * 2;
      for (let index = 0; index < tornadoPoints; index += 1) {
        const normalized = index / (tornadoPoints - 1);
        const radius = 4 + (tornadoRadius - 4) * (1 - normalized);
        const angle = baseAngle + normalized * 14 * Math.PI + elapsed * 1.4;
        const noise = radius * (0.22 + mouseDistance * 0.45);
        positions[index * 3] = radius * Math.cos(angle) + tornadoNoise(normalized * 4, strand * 1.3, elapsed) * noise + pointer.x * 55 * normalized;
        positions[index * 3 + 1] = normalized * tornadoHeight;
        positions[index * 3 + 2] = radius * Math.sin(angle) + tornadoNoise(normalized * 4 + 99, strand * 1.3, elapsed) * noise + pointer.y * 30 * normalized;
      }
      tornadoGroup.children[strand].geometry.attributes.position.needsUpdate = true;
    }

    const dustPositions = dustGeometry.attributes.position.array;
    for (let index = 0; index < dustCount; index += 1) {
      const angle = index / dustCount * Math.PI * 2 + elapsed * 0.6;
      const radius = tornadoRadius * (0.5 + 0.5 * ((index * 7919) % 100) / 100);
      const y = ((index * 1013) % 100) / 100 * 40;
      const noise = tornadoNoise(index * 0.1, y, elapsed) * 12;
      dustPositions[index * 3] = radius * Math.cos(angle) + noise;
      dustPositions[index * 3 + 1] = y;
      dustPositions[index * 3 + 2] = radius * Math.sin(angle) + noise;
    }
    dustGeometry.attributes.position.needsUpdate = true;

    gridGroup.rotation.y += reducedMotion ? 0 : 0.0008;
    gridGroup.position.z = -24 * progress;
    brightnessOverlay.style.background = `rgba(26,95,255,${progress > 0.75 ? (progress - 0.75) * 0.24 : 0})`;

    const endProgress = clamp((progress - 0.92) / 0.08, 0, 1);
    const endEase = endProgress * endProgress * (3 - 2 * endProgress);
    const outroEase = rawOutroProgress * rawOutroProgress * (3 - 2 * rawOutroProgress);
    camera.fov = 72 + endEase * 52 + outroEase * 28;
    camera.updateProjectionMatrix();

    const belowGrid = clamp((gridGroup.position.y - camera.position.y) / 220, 0, 1);
    const inversion = belowGrid * belowGrid * (3 - 2 * belowGrid);
    const aboveGrid = camera.position.y - gridGroup.position.y;
    const approach = Math.pow(1 - clamp(aboveGrid / 130, 0, 1), 2.2) * 0.88;
    const darkBlend = Math.max(approach * (1 - inversion), inversion);
    const lineBlend = Math.max(approach * 0.75 * (1 - inversion), inversion);
    const nextPulseThemeBelow = inversion > 0.35;
    if (nextPulseThemeBelow !== pulseThemeBelow) {
      pulseThemeBelow = nextPulseThemeBelow;
      pulsePool.forEach((pulse) => {
        if (pulse.group.visible) applyPulseTheme(pulse, pulseThemeBelow);
      });
    } else {
      pulseThemeBelow = nextPulseThemeBelow;
    }

    colorBuffer.copy(backgroundLight).lerp(backgroundDark, darkBlend);
    renderer.setClearColor(colorBuffer, 1);
    scene.fog.color.copy(colorBuffer);
    colorBuffer.copy(lineBlack).lerp(lineWhite, lineBlend);
    gridLineMaterial.color.copy(colorBuffer);
    gridAxisMaterial.color.copy(colorBuffer);
    gridYAxisMaterial.color.copy(colorBuffer);
    colorBuffer.copy(waveBlue).lerp(waveAmber, inversion);
    waveMaterial.color.copy(colorBuffer);
    colorBuffer.copy(waveBlue2).lerp(waveAmber2, inversion);
    waveMaterial2.color.copy(colorBuffer);
    colorBuffer.copy(starBlue).lerp(starWhite, darkBlend);
    starMaterial.color.copy(colorBuffer);
    nearStarMaterial.color.copy(colorBuffer);
    document.body.classList.toggle("dark-mode", darkBlend > 0.45);

    controls.update();
    updatePulses(milliseconds);
    renderer.render(scene, camera);
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth <= 768 ? 1.25 : 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener("resize", resize);

  let animationFrame;
  function animate(milliseconds) {
    updateScene(milliseconds);
    animationFrame = requestAnimationFrame(animate);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(animationFrame);
    else animationFrame = requestAnimationFrame(animate);
  });
  animationFrame = requestAnimationFrame(animate);
}
