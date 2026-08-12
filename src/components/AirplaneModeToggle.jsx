import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

// ─── Easing ───────────────────────────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Color Lerp Helper ────────────────────────────────────────────────────────
function lerpColor(a, b, t) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, t);
}

// ─── High-Quality Runway Canvas Texture ───────────────────────────────────────
function makeRunwayTexture() {
  const w = 256, h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Dark asphalt base
  ctx.fillStyle = '#26292d';
  ctx.fillRect(0, 0, w, h);

  // Subtle asphalt grain/noise
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const shade = Math.floor(30 + Math.random() * 20);
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.15)`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Side threshold boundary lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(16, 0); ctx.lineTo(16, h);
  ctx.moveTo(w - 16, 0); ctx.lineTo(w - 16, h);
  ctx.stroke();

  // Threshold piano keys (Runway entry/exit lines)
  const barWidth = 14;
  const barGap = 10;
  const totalBars = 6;
  const startX = (w - (totalBars * barWidth + (totalBars - 1) * barGap)) / 2;
  
  ctx.fillStyle = '#ffffff';
  [40, h - 140].forEach(startY => {
    for (let i = 0; i < totalBars; i++) {
      ctx.fillRect(startX + i * (barWidth + barGap), startY, barWidth, 70);
    }
  });

  // Centerline dashes
  ctx.lineWidth = 10;
  ctx.setLineDash([80, 50]);
  ctx.beginPath();
  ctx.moveTo(w / 2, 130);
  ctx.lineTo(w / 2, h - 130);
  ctx.stroke();
  ctx.setLineDash([]);

  // Touchdown zone markings & tire rubber skid tracks
  ctx.fillStyle = 'rgba(20, 20, 22, 0.4)';
  ctx.fillRect(w / 2 - 25, h * 0.4, 50, 180);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

// ─── Stylized 3D Airplane Mesh ────────────────────────────────────────────────
function buildAirplane() {
  const group = new THREE.Group();

  // Materials
  const matFuselage = new THREE.MeshStandardMaterial({
    color: '#f7f9fa',
    metalness: 0.25,
    roughness: 0.25,
  });
  const matAccent = new THREE.MeshStandardMaterial({
    color: '#ff8c42',
    metalness: 0.4,
    roughness: 0.3,
  });
  const matDark = new THREE.MeshStandardMaterial({
    color: '#1e2226',
    metalness: 0.6,
    roughness: 0.4,
  });
  const matGlass = new THREE.MeshStandardMaterial({
    color: '#1a2b3c',
    metalness: 0.85,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const matChrome = new THREE.MeshStandardMaterial({
    color: '#d0d7de',
    metalness: 0.9,
    roughness: 0.15,
  });
  const matPropYellow = new THREE.MeshStandardMaterial({
    color: '#ffcc00',
    metalness: 0.2,
    roughness: 0.4,
  });

  // Main Fuselage (Aft/Center body)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.38, 2.4, 24),
    matFuselage
  );
  body.rotation.z = Math.PI / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Aerodynamic Nose Fairing
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.7, 24),
    matFuselage
  );
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(1.55, 0, 0);
  nose.castShadow = true;
  group.add(nose);

  // Nose Cone Tip (Chrome spinner root)
  const noseTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 16, 16),
    matChrome
  );
  noseTip.position.set(1.9, 0, 0);
  group.add(noseTip);

  // Tapered Tail Section
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 0.9, 24),
    matFuselage
  );
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-1.65, 0, 0);
  tail.castShadow = true;
  group.add(tail);

  // Orange Accent Racing Stripe
  const stripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.365, 0.375, 1.5, 24, 1, true, 0, Math.PI * 1.2),
    matAccent
  );
  stripe.rotation.z = Math.PI / 2;
  stripe.rotation.x = Math.PI * 0.1;
  stripe.position.set(0.1, 0, 0);
  group.add(stripe);

  // Windshield & Canopy Glass
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.1),
    matGlass
  );
  canopy.position.set(1.05, 0.24, 0);
  canopy.scale.set(1.4, 0.9, 1.0);
  canopy.rotation.z = -0.25;
  canopy.castShadow = true;
  group.add(canopy);

  // Swept Wings with Winglets
  [-1, 1].forEach((side) => {
    const wingGroup = new THREE.Group();
    
    // Main Wing Surface
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.055, 0.8),
      matFuselage
    );
    wing.position.set(0.12, -0.06, side * 0.88);
    wing.rotation.x = side * 0.04;
    wing.rotation.y = side * 0.09;
    wing.castShadow = true;
    wing.receiveShadow = true;
    wingGroup.add(wing);

    // Winglet at tip
    const winglet = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.24, 0.04),
      matAccent
    );
    winglet.position.set(-0.35, 0.08, side * 1.28);
    winglet.rotation.z = 0.3;
    winglet.rotation.y = side * 0.1;
    winglet.castShadow = true;
    wingGroup.add(winglet);

    // Twin Engine Nacelles
    const engineNacelle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.11, 0.65, 16),
      matChrome
    );
    engineNacelle.rotation.z = Math.PI / 2;
    engineNacelle.position.set(0.05, -0.22, side * 0.78);
    engineNacelle.castShadow = true;
    wingGroup.add(engineNacelle);

    // Engine Intake Ring
    const intake = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.025, 12, 20),
      matDark
    );
    intake.position.set(0.38, -0.22, side * 0.78);
    intake.rotation.y = Math.PI / 2;
    wingGroup.add(intake);

    group.add(wingGroup);
  });

  // Vertical Tail Fin
  const tailFin = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.48, 0.06),
    matFuselage
  );
  tailFin.position.set(-1.42, 0.38, 0);
  tailFin.rotation.z = 0.22;
  tailFin.castShadow = true;
  group.add(tailFin);

  // Tail Fin Accent Top Stripe
  const finStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.1, 0.065),
    matAccent
  );
  finStripe.position.set(-1.48, 0.58, 0);
  finStripe.rotation.z = 0.22;
  group.add(finStripe);

  // Horizontal Elevator Stabilizers
  const elevator = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.045, 0.65),
    matFuselage
  );
  elevator.position.set(-1.58, 0.12, 0);
  elevator.castShadow = true;
  group.add(elevator);

  // ─── Propeller Assembly (propGroup) ───────────────────────────────────────
  const propGroup = new THREE.Group();
  propGroup.position.set(1.98, 0, 0);

  const hubSpinner = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.25, 16),
    matChrome
  );
  hubSpinner.rotation.z = -Math.PI / 2;
  propGroup.add(hubSpinner);

  for (let i = 0; i < 3; i++) {
    const bladeHolder = new THREE.Group();
    bladeHolder.rotation.x = (i / 3) * Math.PI * 2;

    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.56, 0.02),
      matDark
    );
    blade.position.y = 0.28;
    blade.rotation.y = 0.25; // Blade pitch twist
    blade.castShadow = true;
    bladeHolder.add(blade);

    // Yellow blade tips
    const bladeTip = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.08, 0.022),
      matPropYellow
    );
    bladeTip.position.y = 0.52;
    bladeHolder.add(bladeTip);

    propGroup.add(bladeHolder);
  }
  group.add(propGroup);

  // ─── Landing Gear Assembly (gearGroup) ────────────────────────────────────
  const gearGroup = new THREE.Group();

  const createStrutAndWheel = (x, z, scale = 1.0) => {
    const g = new THREE.Group();
    
    // Hydraulic Strut
    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025 * scale, 0.025 * scale, 0.32 * scale, 10),
      matChrome
    );
    strut.position.y = -0.16 * scale;
    g.add(strut);

    // Wheel Axle Hub
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04 * scale, 0.04 * scale, 0.08 * scale, 12),
      matChrome
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.y = -0.32 * scale;
    g.add(hub);

    // Rubber Tire
    const tire = new THREE.Mesh(
      new THREE.TorusGeometry(0.08 * scale, 0.035 * scale, 10, 16),
      matDark
    );
    tire.rotation.y = Math.PI / 2;
    tire.position.y = -0.32 * scale;
    tire.castShadow = true;
    g.add(tire);

    g.position.set(x, -0.40, z);
    gearGroup.add(g);
  };

  // Tricycle gear arrangement (Nose gear + Left/Right main gear)
  createStrutAndWheel(1.2, 0, 0.85);
  createStrutAndWheel(-0.25, 0.55, 1.0);
  createStrutAndWheel(-0.25, -0.55, 1.0);

  group.add(gearGroup);

  return { group, propGroup, gearGroup };
}

// ─── Stylized Soft Cloud Cluster ──────────────────────────────────────────────
function buildCloud() {
  const cloudGroup = new THREE.Group();

  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#f0f4f8',
    roughness: 0.85,
    metalness: 0.05,
    flatShading: false,
  });

  const puffCount = 6 + Math.floor(Math.random() * 5);
  for (let i = 0; i < puffCount; i++) {
    const radius = 0.45 + Math.random() * 0.55;
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 16, 16),
      cloudMat
    );

    puff.position.set(
      (Math.random() - 0.5) * 2.2,
      (Math.random() - 0.3) * 0.4,
      (Math.random() - 0.5) * 1.4
    );

    puff.scale.set(1.0 + Math.random() * 0.3, 0.65 + Math.random() * 0.25, 0.9 + Math.random() * 0.3);
    puff.castShadow = true;
    puff.receiveShadow = true;
    cloudGroup.add(puff);
  }

  return cloudGroup;
}

// ─── Instanced Natural Grass Field ───────────────────────────────────────────
function buildGrass(scene) {
  const COUNT = 2200;
  
  // Tapered blade geometry
  const bladeGeo = new THREE.ConeGeometry(0.016, 1, 4);
  bladeGeo.translate(0, 0.5, 0);

  const bladeMat = new THREE.MeshStandardMaterial({
    roughness: 0.85,
    metalness: 0.1,
  });

  const mesh = new THREE.InstancedMesh(bladeGeo, bladeMat, COUNT);
  mesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const groundR = 9.2;
  const colorPalette = [
    new THREE.Color('#386341'),
    new THREE.Color('#43754d'),
    new THREE.Color('#2e5235'),
    new THREE.Color('#4c8257'),
  ];

  let placed = 0;
  while (placed < COUNT) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * groundR;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    // Keep grass clear of the runway strip
    if (Math.abs(z) < 0.95 && Math.abs(x) < 4.8) continue;

    dummy.position.set(x, 0, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.rotation.z = (Math.random() - 0.5) * 0.35;
    
    const h = 0.09 + Math.random() * 0.13;
    const w = 0.65 + Math.random() * 0.45;
    dummy.scale.set(w, h, w);
    dummy.updateMatrix();

    mesh.setMatrixAt(placed, dummy.matrix);
    
    // Pick random natural green shade for each instance
    const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    mesh.setColorAt(placed, col);

    placed++;
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  scene.add(mesh);
  return mesh;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function AirplaneModeToggle() {
  const [isOn, setIsOn] = useState(false);
  const mountRef = useRef(null);
  const sceneRef = useRef({});

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    // Scene & Atmosphere
    const scene = new THREE.Scene();
    const SKY_DUSK = '#192537';
    const SKY_DAY  = '#79b7e3';
    scene.background = new THREE.Color(SKY_DUSK);
    scene.fog = new THREE.Fog(SKY_DUSK, 8, 28);

    // Camera
    const camera = new THREE.PerspectiveCamera(42, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(6.5, 2.4, 6.5);
    camera.lookAt(0, 0.4, 0);

    // Lighting
    const hemi = new THREE.HemisphereLight('#a0d2f8', '#2c442c', 0.7);
    scene.add(hemi);

    const dirLight = new THREE.DirectionalLight('#fff5e6', 1.0);
    dirLight.position.set(5, 9, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    dirLight.shadow.camera.left = dirLight.shadow.camera.bottom = -8;
    dirLight.shadow.camera.right = dirLight.shadow.camera.top = 8;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const ambient = new THREE.AmbientLight('#3d526e', 0.3);
    scene.add(ambient);

    // Terrain Ground Mesh
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(9.5, 64),
      new THREE.MeshStandardMaterial({ color: '#2d4d33', roughness: 0.9, metalness: 0.1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Instanced Grass
    buildGrass(scene);

    // Runway Strip Mesh
    const runway = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 9.6),
      new THREE.MeshStandardMaterial({ map: makeRunwayTexture(), roughness: 0.8, metalness: 0.15 })
    );
    runway.rotation.x = -Math.PI / 2;
    runway.rotation.z = Math.PI / 2;
    runway.position.y = 0.003;
    runway.receiveShadow = true;
    scene.add(runway);

    // 3D Airplane Mesh
    const { group: plane, propGroup, gearGroup } = buildAirplane();
    plane.position.set(-3.2, 0.42, 0);
    scene.add(plane);

    // Soft Contact Shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128; shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d');
    const grad = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    shadowCtx.fillStyle = grad;
    shadowCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.006;
    scene.add(contactShadow);

    // Clouds
    const clouds = [];
    const cloudPositions = [
      [-3.5, 4.2, -5.2], [1.0, 5.0, -6.0], [4.5, 4.6, -4.8],
      [-6.0, 3.8, -3.0], [2.5, 5.4, -2.5], [-1.5, 4.0, -7.5],
    ];
    cloudPositions.forEach(([x, y, z]) => {
      const c = buildCloud();
      c.position.set(x, y, z);
      scene.add(c);
      clouds.push({ group: c, speed: 0.0008 + Math.random() * 0.0006, phase: Math.random() * Math.PI * 2 });
    });

    // Resize Handler
    function onResize() {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    onResize();
    window.addEventListener('resize', onResize);

    // Animation Loop Variables
    let progress = 0;
    let rafId = null;
    const isOnRef = { current: false };
    sceneRef.current.setIsOnRef = (val) => { isOnRef.current = val; };

    function animate(time) {
      rafId = requestAnimationFrame(animate);

      const target = isOnRef.current ? 1 : 0;
      progress += (target - progress) * 0.045;
      const clampedP = Math.max(0, Math.min(1, progress));
      const p = easeInOutCubic(clampedP);

      const climbStart = 0.35;
      const climbProgress = p > climbStart
        ? (p - climbStart) / (1 - climbStart)
        : 0;
      const climbP = Math.min(climbProgress, 1);

      // Airplane Trajectory & Pitch/Roll
      const px = THREE.MathUtils.lerp(-3.2, 6.5, p);
      const py = 0.42 + Math.pow(climbP, 1.3) * 3.4;
      const pz = THREE.MathUtils.lerp(0, -2.5, climbP);

      plane.position.set(px, py, pz);
      plane.rotation.y = THREE.MathUtils.lerp(0, 0.18, climbP);
      plane.rotation.z = THREE.MathUtils.lerp(0, 0.08, climbP);
      plane.rotation.x = THREE.MathUtils.lerp(0, -0.28, climbP);
      const sc = THREE.MathUtils.lerp(1.0, 0.55, climbP);
      plane.scale.setScalar(sc);

      // Propeller Spin
      const propSpeed = 0.05 + p * 0.32;
      propGroup.rotation.x += propSpeed;

      // Landing Gear Retraction
      const gearRetract = climbP > 0 ? Math.max(0, 1 - climbP / 0.6) : 1;
      gearGroup.scale.setScalar(gearRetract);
      gearGroup.position.y = THREE.MathUtils.lerp(0, 0.3, 1 - gearRetract);

      // Soft Contact Shadow Tracking
      contactShadow.position.x = px;
      contactShadow.position.z = pz;
      contactShadow.scale.setScalar(THREE.MathUtils.lerp(1.0, 0.0, climbP));
      shadowMat.opacity = THREE.MathUtils.lerp(0.4, 0, climbP);

      // Sky Atmosphere & Lighting Lerp
      const skyCol = lerpColor(SKY_DUSK, SKY_DAY, p);
      scene.background = skyCol;
      scene.fog.color.copy(skyCol);
      hemi.intensity = THREE.MathUtils.lerp(0.7, 0.95, p);
      dirLight.intensity = THREE.MathUtils.lerp(1.0, 1.35, p);

      // Floating Cloud Drift
      clouds.forEach(({ group: cg, speed, phase }) => {
        cg.position.x += speed;
        if (cg.position.x > 9) cg.position.x = -9;
        cg.position.y += Math.sin(time * 0.0004 + phase) * 0.0005;
      });

      // Camera Smooth Tracking
      const camY = THREE.MathUtils.lerp(2.4, 3.2, climbP);
      camera.position.y += (camY - camera.position.y) * 0.02;
      camera.lookAt(px - 0.5, py * 0.5, pz);

      renderer.render(scene, camera);
    }

    animate(0);

    // Clean Memory Disposal on Unmount
    sceneRef.current.cleanup = () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);

      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            });
          } else {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };

    const sceneObj = sceneRef.current;
    return () => sceneObj.cleanup?.();
  }, []);

  useEffect(() => {
    sceneRef.current.setIsOnRef?.(isOn);
  }, [isOn]);

  return (
    <div className="am-root">
      <div className="am-canvas-wrap" ref={mountRef} />
      <div className="am-bar">
        <div className="am-labels">
          <span className="am-label">Airplane Mode</span>
          <span className="am-status">
            {isOn ? 'TAKEOFF · CRUISING' : 'GROUNDED · STANDBY'}
          </span>
        </div>
        <button
          className="am-toggle"
          aria-pressed={isOn}
          aria-label="Toggle airplane mode"
          onClick={() => setIsOn(v => !v)}
        >
          <span className="am-knob">✈</span>
        </button>
      </div>
    </div>
  );
}
