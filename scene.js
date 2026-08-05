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
  const pulsePool = Array.from({ length: 4 }, () => {
    const group = new THREE.Group();
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a5fff,
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

    const branches = Array.from({ length: 3 }, () => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(7 * 3), 3));
      const material = new THREE.LineBasicMaterial({
        color: 0x1a5fff,
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
      map: blueDot,
      color: 0x7da6ff,
      size: 13,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    group.add(sparks);
    group.visible = false;
    scene.add(group);
    return { group, ring, branches, sparks, started: 0, duration: 780 };
  });

  let pulseCursor = 0;
  function triggerGridPulse(point, milliseconds) {
    const pulse = pulsePool[pulseCursor];
    pulseCursor = (pulseCursor + 1) % pulsePool.length;
    pulse.group.position.set(
      Math.round(point.x / gridStep) * gridStep,
      gridGroup.position.y,
      Math.round(point.z / gridStep) * gridStep,
    );
    pulse.group.visible = true;
    pulse.started = milliseconds;
    pulse.duration = reducedMotion ? 140 : 780;
    pulse.ring.scale.setScalar(0.5);

    const directionOffset = pulseCursor % 4;
    const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const branchCount = 2 + pulseCursor % 2;
    const sparkPositions = pulse.sparks.geometry.attributes.position.array;

    pulse.branches.forEach((branch, branchIndex) => {
      if (branchIndex >= branchCount) {
        branch.geometry.setDrawRange(0, 0);
        return;
      }
      const [directionX, directionZ] = directions[(branchIndex + directionOffset) % directions.length];
      const steps = 2 + (branchIndex + pulseCursor) % 3;
      const positions = branch.geometry.attributes.position.array;
      for (let pointIndex = 0; pointIndex < 7; pointIndex += 1) {
        const progress = pointIndex / 6;
        positions[pointIndex * 3] = directionX * steps * gridStep * progress;
        positions[pointIndex * 3 + 1] = 0.65 + Math.sin(pointIndex * 4.1 + pulseCursor) * 0.8;
        positions[pointIndex * 3 + 2] = directionZ * steps * gridStep * progress;
      }
      branch.geometry.setDrawRange(0, 7);
      branch.geometry.attributes.position.needsUpdate = true;
      sparkPositions[branchIndex * 3] = directionX * steps * gridStep;
      sparkPositions[branchIndex * 3 + 1] = 0.8;
      sparkPositions[branchIndex * 3 + 2] = directionZ * steps * gridStep;
    });
    pulse.sparks.geometry.setDrawRange(0, branchCount);
    pulse.sparks.geometry.attributes.position.needsUpdate = true;
  }

  const raycaster = new THREE.Raycaster();
  const gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 55);
  const intersection = new THREE.Vector3();
  let clickStart;

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button === 0) clickStart = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!clickStart || clickStart.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - clickStart.x, event.clientY - clickStart.y) > 5) clickStart.moved = true;
  });
  canvas.addEventListener("pointercancel", () => { clickStart = null; });
  canvas.addEventListener("pointerup", (event) => {
    if (!clickStart || clickStart.id !== event.pointerId || clickStart.moved || event.button !== 0 || event.target !== canvas) {
      clickStart = null;
      return;
    }
    const pointerNdc = new THREE.Vector2(
      event.clientX / window.innerWidth * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );
    raycaster.setFromCamera(pointerNdc, camera);
    if (raycaster.ray.intersectPlane(gridPlane, intersection)) triggerGridPulse(intersection, performance.now());
    clickStart = null;
  });

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
  let sceneProgress = 0;
  function updateScrollProgress() {
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    rawScrollProgress = maximum > 0 ? clamp(window.scrollY / maximum, 0, 1) : 0;
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
      const fade = 1 - progress;
      pulse.ring.scale.setScalar(reducedMotion ? 1.8 : 0.5 + progress * 3.4);
      pulse.ring.material.opacity = fade * 0.7;
      pulse.branches.forEach((branch) => { branch.material.opacity = fade * 0.95; });
      pulse.sparks.material.opacity = Math.sin(progress * Math.PI) * 0.9;
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
    camera.fov = 72 + endEase * 52;
    camera.updateProjectionMatrix();

    const belowGrid = clamp((gridGroup.position.y - camera.position.y) / 220, 0, 1);
    const inversion = belowGrid * belowGrid * (3 - 2 * belowGrid);
    const aboveGrid = camera.position.y - gridGroup.position.y;
    const approach = Math.pow(1 - clamp(aboveGrid / 130, 0, 1), 2.2) * 0.88;
    const darkBlend = Math.max(approach * (1 - inversion), inversion);
    const lineBlend = Math.max(approach * 0.75 * (1 - inversion), inversion);

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
