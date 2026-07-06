// Three.js Rubik's Cube Renderer with Neon Glow, Stage Isolation, and Smooth Animations.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Absolute face colors
export const STICKER_COLORS = {
  u: 0xffeb3b, // yellow (Neon-ish)
  d: 0xffffff, // white
  f: 0x00e676, // green (Cyber-neon)
  b: 0x2979ff, // blue (Neon)
  l: 0xff9100, // orange (Neon)
  r: 0xff1744  // red (Neon-red)
};

const FACE_MATERIAL_ORDER = ['r', 'l', 'u', 'd', 'f', 'b']; // Right, Left, Up, Down, Front, Back

export class Cube3DRenderer {
  constructor(containerEl) {
    this.container = containerEl;
    this.cubies = [];
    this.isAnimating = false;
    this.currentStepIndex = 0;
    this.animationQueue = [];
    this.activeStagePieces = new Set(); // Set of cubie IDs to highlight
    this.isolationMode = false;

    this.initScene();
    this.createCube();
    this.setupResize();
  }

  initScene() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10); // Sleek dark space

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(4, 4, 6);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-5, -5, -5);
    this.scene.add(dirLight2);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 15;

    // Grid / Base glow
    const grid = new THREE.GridHelper(10, 10, 0x00f0ff, 0x1f2330);
    grid.position.y = -2.5;
    this.scene.add(grid);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  createCube() {
    this.cubies = [];

    // Base geometry
    const geom = new THREE.BoxGeometry(0.95, 0.95, 0.95);

    // Create 27 cubies
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let xz = -1; xz <= 1; xz++) {
          const z = xz; // Rename for readability
          const id = (x + 1) + 3 * (y + 1) + 9 * (z + 1);

          const materials = FACE_MATERIAL_ORDER.map(face => {
            let color = 0x12151f; // Dark structural body
            let isOuter = false;

            if (face === 'r' && x === 1) { color = STICKER_COLORS.r; isOuter = true; }
            if (face === 'l' && x === -1) { color = STICKER_COLORS.l; isOuter = true; }
            if (face === 'u' && y === 1) { color = STICKER_COLORS.u; isOuter = true; }
            if (face === 'd' && y === -1) { color = STICKER_COLORS.d; isOuter = true; }
            if (face === 'f' && z === 1) { color = STICKER_COLORS.f; isOuter = true; }
            if (face === 'b' && z === -1) { color = STICKER_COLORS.b; isOuter = true; }

            return new THREE.MeshStandardMaterial({
              color: color,
              roughness: 0.1,
              metalness: 0.1,
              emissive: isOuter ? color : 0x000000,
              emissiveIntensity: isOuter ? 0.05 : 0,
              transparent: true,
              opacity: 1.0
            });
          });

          // Core cubie Mesh
          const mesh = new THREE.Mesh(geom, materials);
          mesh.position.set(x, y, z);
          mesh.userData = { id, x, y, z, originalMaterials: materials.map(m => m.clone()) };

          // Add a sleek black/neon wireframe edge overlay
          const edges = new THREE.EdgesGeometry(geom);
          const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.2 });
          const wireframe = new THREE.LineSegments(edges, lineMat);
          mesh.add(wireframe);

          this.scene.add(mesh);
          this.cubies.push(mesh);
        }
      }
    }
  }

  // Update piece highlight opacity depending on active stage set
  updateStageHighlight(activeIds, isolationMode) {
    this.activeStagePieces = new Set(activeIds);
    this.isolationMode = isolationMode;

    for (const cubie of this.cubies) {
      const id = cubie.userData.id;
      const materials = cubie.material;
      const wireframe = cubie.children[0];

      if (this.isolationMode) {
        const isActive = this.activeStagePieces.has(id);
        
        if (isActive) {
          // Glow and make fully visible
          materials.forEach((mat, idx) => {
            mat.opacity = 1.0;
            const orig = cubie.userData.originalMaterials[idx];
            if (orig.emissiveIntensity > 0) {
              mat.emissiveIntensity = 0.4; // Boost neon glow
            }
          });
          wireframe.material.color.setHex(0x00ffff);
          wireframe.material.opacity = 0.8;
        } else {
          // Dim non-active pieces, keeping their original colors but making them transparent (no dark spots!)
          materials.forEach((mat, idx) => {
            mat.opacity = 0.15;
            mat.emissiveIntensity = 0;
          });
          wireframe.material.color.setHex(0x00f0ff);
          wireframe.material.opacity = 0.1;
        }
      } else {
        // Reset to normal
        materials.forEach((mat, idx) => {
          const orig = cubie.userData.originalMaterials[idx];
          mat.opacity = 1.0;
          mat.emissiveIntensity = orig.emissiveIntensity;
        });
        wireframe.material.color.setHex(0x00f0ff);
        wireframe.material.opacity = 0.2;
      }
    }
  }

  // Animates a single move sequence smoothly
  animateMove(moveStr, durationMs = 250) {
    if (this.isAnimating) {
      this.animationQueue.push({ moveStr, durationMs });
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.isAnimating = true;

      // Parse face, modifier
      const face = moveStr[0];
      const modifier = moveStr.substring(1);
      const isPrime = modifier.includes("'");
      const isDouble = modifier.includes("2");

      let angle = Math.PI / 2;
      if (isPrime) angle = -Math.PI / 2;
      if (isDouble) angle = Math.PI;

      // Group selection depending on move
      const targetCubies = [];
      const axis = new THREE.Vector3();

      // Determine axis and filter criteria based on standard notations
      switch (face) {
        case 'R':
          axis.set(1, 0, 0);
          angle = -angle; // inverse angle for standard CW direction
          this.cubies.forEach(c => { if (Math.round(c.position.x) === 1) targetCubies.push(c); });
          break;
        case 'r': // wide right (R + M slice)
          axis.set(1, 0, 0);
          angle = -angle;
          this.cubies.forEach(c => { if (Math.round(c.position.x) >= 0) targetCubies.push(c); });
          break;
        case 'L':
          axis.set(1, 0, 0);
          this.cubies.forEach(c => { if (Math.round(c.position.x) === -1) targetCubies.push(c); });
          break;
        case 'U':
          axis.set(0, 1, 0);
          angle = -angle;
          this.cubies.forEach(c => { if (Math.round(c.position.y) === 1) targetCubies.push(c); });
          break;
        case 'D':
          axis.set(0, 1, 0);
          this.cubies.forEach(c => { if (Math.round(c.position.y) === -1) targetCubies.push(c); });
          break;
        case 'F':
          axis.set(0, 0, 1);
          angle = -angle;
          this.cubies.forEach(c => { if (Math.round(c.position.z) === 1) targetCubies.push(c); });
          break;
        case 'B':
          axis.set(0, 0, 1);
          this.cubies.forEach(c => { if (Math.round(c.position.z) === -1) targetCubies.push(c); });
          break;
        case 'M': // middle slice relative to L
          axis.set(1, 0, 0);
          this.cubies.forEach(c => { if (Math.round(c.position.x) === 0) targetCubies.push(c); });
          break;
        case 'E': // middle layer relative to D
          axis.set(0, 1, 0);
          this.cubies.forEach(c => { if (Math.round(c.position.y) === 0) targetCubies.push(c); });
          break;
        case 'S': // standing slice relative to F
          axis.set(0, 0, 1);
          angle = -angle;
          this.cubies.forEach(c => { if (Math.round(c.position.z) === 0) targetCubies.push(c); });
          break;
        default:
          // Rotations (x, y, z)
          if (face === 'x') {
            axis.set(1, 0, 0);
            angle = -angle;
            this.cubies.forEach(c => targetCubies.push(c));
          } else if (face === 'y') {
            axis.set(0, 1, 0);
            angle = -angle;
            this.cubies.forEach(c => targetCubies.push(c));
          } else if (face === 'z') {
            axis.set(0, 0, 1);
            angle = -angle;
            this.cubies.forEach(c => targetCubies.push(c));
          } else {
            // Unrecognized turn
            this.isAnimating = false;
            resolve();
            return;
          }
      }

      // Animation pivot group
      const pivotGroup = new THREE.Group();
      this.scene.add(pivotGroup);

      targetCubies.forEach(c => {
        pivotGroup.attach(c);
      });

      let elapsed = 0;
      const startTime = performance.now();

      const updateRotation = () => {
        const now = performance.now();
        elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1.0);

        // Smooth easing (Ease Out Quad)
        const ease = 1 - (1 - progress) * (1 - progress);
        const currentAngle = angle * ease;

        pivotGroup.rotation.set(0, 0, 0);
        pivotGroup.rotateOnAxis(axis, currentAngle);

        if (progress < 1.0) {
          requestAnimationFrame(updateRotation);
        } else {
          // Finalize rotation matrices
          pivotGroup.rotation.set(0, 0, 0);
          pivotGroup.rotateOnAxis(axis, angle);
          pivotGroup.updateMatrixWorld();

          // Detach meshes back to main scene
          targetCubies.forEach(c => {
            this.scene.attach(c);
            // Snap position/rotation to integers to prevent floating-point accumulation drift
            c.position.x = Math.round(c.position.x);
            c.position.y = Math.round(c.position.y);
            c.position.z = Math.round(c.position.z);
          });

          this.scene.remove(pivotGroup);
          this.isAnimating = false;

          resolve();
          this.processQueue();
        }
      };

      requestAnimationFrame(updateRotation);
    });
  }

  processQueue() {
    if (this.animationQueue.length > 0 && !this.isAnimating) {
      const next = this.animationQueue.shift();
      this.animateMove(next.moveStr, next.durationMs);
    }
  }

  // Quickly set the physical state colors to match a given engine CubeState
  setCubeState(engineCubeState) {
    // Reset all rotations and snap meshes to matching coordinates
    const sortedEngine = [...engineCubeState.cubies].sort((a, b) => a.id - b.id);
    const sortedRenderer = [...this.cubies].sort((a, b) => a.userData.id - b.userData.id);

    const charToColor = {
      'y': STICKER_COLORS.u,
      'w': STICKER_COLORS.d,
      'g': STICKER_COLORS.f,
      'b': STICKER_COLORS.b,
      'o': STICKER_COLORS.l,
      'r': STICKER_COLORS.r,
      '-': 0x12151f // Body
    };

    const flatStr = engineCubeState.serialize();

    for (let i = 0; i < 27; i++) {
      const rendererCubie = sortedRenderer[i];
      const offset = i * 9;
      
      const x = parseInt(flatStr[offset], 10) - 1;
      const y = parseInt(flatStr[offset + 1], 10) - 1;
      const z = parseInt(flatStr[offset + 2], 10) - 1;

      rendererCubie.position.set(x, y, z);
      rendererCubie.rotation.set(0, 0, 0);

      // Re-assign material colors
      const materials = rendererCubie.material;
      materials[0].color.setHex(charToColor[flatStr[offset + 8]]); // Right
      materials[1].color.setHex(charToColor[flatStr[offset + 7]]); // Left
      materials[2].color.setHex(charToColor[flatStr[offset + 3]]); // Up
      materials[3].color.setHex(charToColor[flatStr[offset + 4]]); // Down
      materials[4].color.setHex(charToColor[flatStr[offset + 5]]); // Front
      materials[5].color.setHex(charToColor[flatStr[offset + 6]]); // Back

      // Reset originals
      rendererCubie.userData.originalMaterials.forEach((orig, idx) => {
        orig.color.copy(materials[idx].color);
      });
    }

    // Refresh highlight state
    this.updateStageHighlight(Array.from(this.activeStagePieces), this.isolationMode);
  }

  setupResize() {
    window.addEventListener('resize', () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }
}
