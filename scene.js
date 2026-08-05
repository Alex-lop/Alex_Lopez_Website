import * as THREE from "three";

const canvas = document.querySelector("#bg-canvas");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const compactScene = window.matchMedia("(max-width: 760px)").matches;

function initScene() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !compactScene, powerPreference: "high-performance" });
  } catch {
    canvas.hidden = true;
    return;
  }

  renderer.setClearColor(0xf5f5f0, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactScene ? 1.25 : 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf5f5f0, 0.00042);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.5, 6000);
  camera.position.set(0, 115, 540);
  camera.lookAt(0, -45, -40);

  function makeDotTexture() {
    const dot = document.createElement("canvas");
    dot.width = 16;
    dot.height = 16;
    const context = dot.getContext("2d");
    const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, "rgba(26,95,255,1)");
    gradient.addColorStop(0.45, "rgba(26,95,255,.5)");
    gradient.addColorStop(1, "rgba(26,95,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(dot);
  }

  const dotTexture = makeDotTexture();
  const starCount = compactScene ? 4500 : 12000;
  const starPositions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 900 + Math.random() * 4200;
    starPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[index * 3 + 2] = radius * Math.cos(phi);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({
    map: dotTexture,
    color: 0x1a5fff,
    size: compactScene ? 4 : 4.5,
    opacity: 0.42,
    transparent: true,
    depthWrite: false,
  })));

  const grid = new THREE.Group();
  const gridSize = 900;
  const gridDivisions = 36;
  const gridVertices = [];
  for (let index = 0; index <= gridDivisions; index += 1) {
    const point = -gridSize / 2 + index * (gridSize / gridDivisions);
    gridVertices.push(-gridSize / 2, 0, point, gridSize / 2, 0, point);
    gridVertices.push(point, 0, -gridSize / 2, point, 0, gridSize / 2);
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(gridVertices, 3));
  grid.add(new THREE.LineSegments(gridGeometry, new THREE.LineBasicMaterial({
    color: 0x111111,
    opacity: 0.19,
    transparent: true,
  })));
  const axesGeometry = new THREE.BufferGeometry();
  axesGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -gridSize / 2, 0, 0, gridSize / 2, 0, 0,
    0, 0, -gridSize / 2, 0, 0, gridSize / 2,
    0, -gridSize / 3, 0, 0, gridSize / 3, 0,
  ], 3));
  grid.add(new THREE.LineSegments(axesGeometry, new THREE.LineBasicMaterial({
    color: 0x111111,
    opacity: 0.38,
    transparent: true,
  })));
  grid.position.y = -72;
  scene.add(grid);

  const waveColumns = compactScene ? 34 : 50;
  const waveRows = compactScene ? 54 : 76;
  const waveCount = waveColumns * waveRows;
  const wavePositions = new Float32Array(waveCount * 3);
  const waveOriginalX = new Float32Array(waveCount);
  for (let row = 0; row < waveRows; row += 1) {
    for (let column = 0; column < waveColumns; column += 1) {
      const index = row * waveColumns + column;
      const x = (column / (waveColumns - 1) - 0.5) * 560;
      wavePositions[index * 3] = x;
      wavePositions[index * 3 + 2] = -(row / (waveRows - 1)) * 1000;
      waveOriginalX[index] = x;
    }
  }
  const waveGeometry = new THREE.BufferGeometry();
  waveGeometry.setAttribute("position", new THREE.BufferAttribute(wavePositions, 3));
  const wave = new THREE.Points(waveGeometry, new THREE.PointsMaterial({
    map: dotTexture,
    color: 0x1a5fff,
    size: compactScene ? 4.2 : 5,
    opacity: 0.72,
    transparent: true,
    depthWrite: false,
  }));
  const waveGroup = new THREE.Group();
  waveGroup.add(wave);
  waveGroup.position.set(105, -35, -170);
  scene.add(waveGroup);

  const tornado = new THREE.Group();
  const strandCount = compactScene ? 4 : 6;
  const strandPoints = compactScene ? 110 : 170;
  for (let strand = 0; strand < strandCount; strand += 1) {
    const positions = new Float32Array(strandPoints * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    tornado.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color: strand % 2 ? 0x111111 : 0x1a5fff,
      opacity: strand % 2 ? 0.3 : 0.52,
      transparent: true,
    })));
  }
  tornado.position.set(210, -72, -95);
  tornado.scale.setScalar(1.2);
  scene.add(tornado);

  const pointer = { x: 0, y: 0 };
  let scrollProgress = 0;

  function updateProgress() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0;
  }

  function updateScene(milliseconds = 0) {
    const elapsed = reducedMotion ? 0 : milliseconds / 1000;
    const blend = Math.sin(Math.min(scrollProgress * 1.2, 1) * Math.PI * 0.5);

    for (let row = 0; row < waveRows; row += 1) {
      const rowProgress = row / (waveRows - 1);
      for (let column = 0; column < waveColumns; column += 1) {
        const index = row * waveColumns + column;
        const x = waveOriginalX[index];
        const z = wavePositions[index * 3 + 2];
        const waveY = 46 * Math.sin(0.017 * x + 0.012 * z - elapsed * 0.65)
          + 20 * Math.sin(0.034 * x - 0.019 * z - elapsed * 1.1);
        const spread = column / (waveColumns - 1) - 0.5;
        const angle = rowProgress * Math.PI * 10 + spread * Math.PI * 0.65 + elapsed * 0.17;
        const spiralX = Math.cos(angle) * 205;
        const spiralY = Math.sin(angle) * 205 + waveY * 0.12;
        wavePositions[index * 3] = x * (1 - blend) + spiralX * blend;
        wavePositions[index * 3 + 1] = waveY * (1 - blend) + spiralY * blend;
      }
    }
    waveGeometry.attributes.position.needsUpdate = true;
    waveGroup.position.z = -170 + scrollProgress * 360;

    for (let strand = 0; strand < strandCount; strand += 1) {
      const positions = tornado.children[strand].geometry.attributes.position.array;
      for (let point = 0; point < strandPoints; point += 1) {
        const progress = point / (strandPoints - 1);
        const radius = 5 + (1 - progress) * 86;
        const angle = strand / strandCount * Math.PI * 2 + progress * Math.PI * 13 + elapsed * 0.52;
        const turbulence = Math.sin(progress * 28 + strand * 1.7 + elapsed) * radius * 0.09;
        positions[point * 3] = Math.cos(angle) * radius + turbulence + pointer.x * 24 * progress;
        positions[point * 3 + 1] = progress * 300;
        positions[point * 3 + 2] = Math.sin(angle) * radius + pointer.y * 16 * progress;
      }
      tornado.children[strand].geometry.attributes.position.needsUpdate = true;
    }

    if (!reducedMotion) {
      grid.rotation.y = elapsed * 0.025;
      camera.position.x += (pointer.x * 22 - camera.position.x) * 0.025;
      camera.position.y += (115 - pointer.y * 12 - camera.position.y) * 0.025;
      camera.lookAt(0, -45, -40);
    }
    renderer.render(scene, camera);
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    updateScene();
  }

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / window.innerWidth * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight * 2 - 1);
  }, { passive: true });
  window.addEventListener("scroll", () => {
    updateProgress();
    if (reducedMotion) updateScene();
  }, { passive: true });
  window.addEventListener("resize", resize);

  updateProgress();
  if (reducedMotion) {
    updateScene();
    return;
  }

  let animationFrame;
  function animate(milliseconds) {
    updateScene(milliseconds);
    animationFrame = requestAnimationFrame(animate);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrame);
    } else {
      animationFrame = requestAnimationFrame(animate);
    }
  });
  animationFrame = requestAnimationFrame(animate);
}

initScene();
