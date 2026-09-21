import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const hud = document.getElementById('hud');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const scoreEl = document.getElementById('score');
const waveEl = document.getElementById('wave');
const energyEl = document.getElementById('energy');
const timerEl = document.getElementById('timer');
const ammoEl = document.getElementById('ammo');
const endTitle = document.getElementById('end-title');
const endCopy = document.getElementById('end-copy');
const statusEl = document.getElementById('status');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050d1a);
scene.fog = new THREE.Fog(0x050d1a, 20, 90);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 250);
camera.rotation.order = 'YXZ';
camera.position.set(0, 1.7, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.inset = '0';
renderer.domElement.style.zIndex = '0';
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const worldBounds = 28;
const player = {
  radius: 1.2,
  health: 100,
  maxHealth: 100,
  fireCooldown: 0,
  pulse: 0,
};

const input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
};

const state = {
  started: false,
  gameOver: false,
  score: 0,
  wave: 1,
  elapsed: 0,
  ammo: 12,
  reload: 0,
  crystals: [],
  enemies: [],
  bullets: [],
  obstacles: [],
};

const loader = new GLTFLoader();
let robotModel = null;
loader.load(
  'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive.glb',
  (gltf) => {
    robotModel = gltf.scene;
    robotModel.traverse((item) => {
      if (item.isMesh) {
        item.castShadow = true;
        item.receiveShadow = true;
      }
    });
  },
  undefined,
  () => {
    robotModel = null;
  }
);

function createFallbackDrone() {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x77ffed,
    emissive: 0x2cc7d1,
    metalness: 0.8,
    roughness: 0.2,
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.8, 20, 20), bodyMat);
  core.castShadow = true;
  group.add(core);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.12, 12, 30),
    new THREE.MeshStandardMaterial({ color: 0xff4d8d, emissive: 0xff4080, metalness: 0.5, roughness: 0.3 })
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  return group;
}

function makeEnemyInstance() {
  let model = null;

  if (robotModel) {
    model = robotModel.clone();
    model.scale.setScalar(0.7);
    model.traverse((item) => {
      if (item.isMesh) {
        item.castShadow = true;
        item.receiveShadow = true;
      }
    });
  } else {
    model = createFallbackDrone();
  }

  return model;
}

function updateHUD() {
  scoreEl.textContent = String(state.score).padStart(6, '0');
  waveEl.textContent = String(state.wave).padStart(2, '0');
  ammoEl.textContent = String(Math.max(0, Math.floor(state.ammo)));
  energyEl.style.width = `${(player.health / player.maxHealth) * 100}%`;
  timerEl.textContent = new Date(state.elapsed * 1000).toISOString().substr(14, 5);
}

function setStatus(text) {
  statusEl.textContent = text.toUpperCase();
}

function spawnArena() {
  scene.clear();

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0x9be7ff, 1.2);
  keyLight.position.set(8, 20, 14);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const rim = new THREE.PointLight(0xff4d8d, 16, 80, 2);
  rim.position.set(-12, 7, -10);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshStandardMaterial({
      color: 0x091827,
      emissive: 0x0a2030,
      roughness: 0.9,
      metalness: 0.1,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(90, 45, 0x3ddcff, 0x113548);
  grid.position.y = 0.02;
  scene.add(grid);

  const arenaRing = new THREE.Mesh(
    new THREE.TorusGeometry(30, 0.45, 16, 120),
    new THREE.MeshStandardMaterial({
      color: 0x60f3ff,
      emissive: 0x13cde8,
      metalness: 0.8,
      roughness: 0.25,
    })
  );
  arenaRing.rotation.x = Math.PI / 2;
  arenaRing.position.y = 0.08;
  scene.add(arenaRing);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x111f2e,
    emissive: 0x0d2237,
    metalness: 0.5,
    roughness: 0.7,
  });

  const wallConfig = [
    { x: 0, z: -worldBounds, w: 64, h: 3, d: 2 },
    { x: 0, z: worldBounds, w: 64, h: 3, d: 2 },
    { x: -worldBounds, z: 0, w: 2, h: 3, d: 64 },
    { x: worldBounds, z: 0, w: 2, h: 3, d: 64 },
  ];

  wallConfig.forEach((cfg) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d), wallMat);
    wall.position.set(cfg.x, cfg.h / 2, cfg.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  });

  const obstacleData = [
    { x: -10, z: -8, w: 8, d: 4 },
    { x: 12, z: -10, w: 5, d: 5 },
    { x: -15, z: 10, w: 6, d: 6 },
    { x: 8, z: 12, w: 8, d: 4 },
    { x: 0, z: 0, w: 6, d: 6 },
    { x: -2, z: -18, w: 4, d: 8 },
    { x: 18, z: 1, w: 7, d: 4 },
  ];

  obstacleData.forEach(({ x, z, w, d }) => {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(w, 3, d),
      new THREE.MeshStandardMaterial({ color: 0x132b42, emissive: 0x164d76, metalness: 0.6, roughness: 0.4 })
    );
    block.position.set(x, 1.5, z);
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);
    state.obstacles.push({ x, z, w, d });
  });

  addSpawnCrystal(0, 0);
}

function addSpawnCrystal(x, z) {
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.8, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xff9900,
      roughness: 0.1,
      metalness: 0.6,
    })
  );
  crystal.position.set(x, 1.4, z);
  crystal.castShadow = true;
  scene.add(crystal);
  state.crystals.push(crystal);
}

function spawnWave(level) {
  state.wave = level;
  state.enemies.forEach((enemy) => scene.remove(enemy.root));
  state.enemies = [];

  for (let i = 0; i < 3 + level; i += 1) {
    const root = makeEnemyInstance();
    const angle = (Math.PI * 2 * i) / (3 + level) + Math.random() * 0.8;
    const radius = 14 + Math.random() * 12;
    root.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    root.scale.setScalar(1.1 + Math.random() * 0.4);

    scene.add(root);
    state.enemies.push({
      root,
      hp: 1 + Math.floor(level / 2),
      speed: 2.4 + level * 0.35 + Math.random() * 0.8,
      cooldown: 0.6 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const crystalCount = 4 + level * 2;
  state.crystals.forEach((crystal) => scene.remove(crystal));
  state.crystals = [];

  for (let i = 0; i < crystalCount; i += 1) {
    const angle = (Math.PI * 2 * i) / crystalCount + Math.random() * 0.8;
    const radius = 10 + Math.random() * 12;
    addSpawnCrystal(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }

  statusEl.textContent = `VAGUE ${level.toString().padStart(2, '0')} // DÉTECTÉE`;
  updateHUD();
}

function addShot(origin, direction) {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0x7af6ff,
      emissive: 0x3de6ff,
      metalness: 0.4,
      roughness: 0.3,
    })
  );

  bullet.position.copy(origin);
  bullet.castShadow = true;
  scene.add(bullet);

  state.bullets.push({
    mesh: bullet,
    velocity: direction.clone().multiplyScalar(42),
    life: 1.4,
  });
}

function fireWeapon() {
  if (!state.started || state.gameOver) return;
  if (state.ammo <= 0) {
    setStatus('réarmement');
    return;
  }
  if (player.fireCooldown > 0) return;

  const direction = new THREE.Vector3();
camera.getWorldDirection(direction);
  const origin = camera.position.clone().add(direction.clone().multiplyScalar(1.5));
  addShot(origin, direction);
  state.ammo -= 1;
  player.fireCooldown = 0.18;
  setStatus('tir actif');

  if (state.ammo <= 0) {
    state.reload = 1.5;
    setStatus('rechargement');
  }

  updateHUD();
}

function resolveCollisions(position) {
  for (const obstacle of state.obstacles) {
    const dx = position.x - obstacle.x;
    const dz = position.z - obstacle.z;
    const halfW = obstacle.w / 2 + player.radius;
    const halfD = obstacle.d / 2 + player.radius;

    if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
      const overlapX = halfW - Math.abs(dx);
      const overlapZ = halfD - Math.abs(dz);

      if (overlapX < overlapZ) {
        position.x += dx > 0 ? overlapX : -overlapX;
      } else {
        position.z += dz > 0 ? overlapZ : -overlapZ;
      }
    }
  }

  position.x = THREE.MathUtils.clamp(position.x, -worldBounds + 1.5, worldBounds - 1.5);
  position.z = THREE.MathUtils.clamp(position.z, -worldBounds + 1.5, worldBounds - 1.5);
}

function handleMovement(delta) {
  if (!state.started || state.gameOver) return;

  const moveX = Number(input.right) - Number(input.left);
  const moveZ = Number(input.forward) - Number(input.backward);
  const speed = input.sprint ? 11 : 7.2;

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const movement = new THREE.Vector3();
  movement.addScaledVector(forward, moveZ);
  movement.addScaledVector(right, moveX);

  if (movement.lengthSq() > 0) {
    movement.normalize().multiplyScalar(speed * delta);
    camera.position.add(movement);
    resolveCollisions(camera.position);
  }
}

function checkPickups() {
  for (let i = state.crystals.length - 1; i >= 0; i -= 1) {
    const crystal = state.crystals[i];
    if (crystal.position.distanceTo(camera.position) < 2) {
      scene.remove(crystal);
      state.crystals.splice(i, 1);
      state.score += 150;
      setStatus('noyau récupéré');
      updateHUD();

      if (state.crystals.length === 0) {
        state.wave += 1;
        spawnWave(state.wave);
      }
    }
  }
}

function damagePlayer(amount) {
  player.health = Math.max(0, player.health - amount);
  updateHUD();
  if (player.health <= 0) endGame('Mission échouée');
}

function liveEnemies(delta) {
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    if (!enemy) continue;

    const dir = camera.position.clone().sub(enemy.root.position);
    const dist = dir.length();
    dir.y = 0;
    if (dir.lengthSq() > 0.0001) dir.normalize();

    enemy.root.position.addScaledVector(dir, enemy.speed * delta);
    enemy.root.position.y = 0.8 + Math.sin(state.elapsed * 5 + enemy.phase) * 0.2;
    enemy.root.rotation.y = Math.atan2(dir.x, dir.z);
    enemy.cooldown -= delta;

    if (dist < 2.5 && enemy.cooldown <= 0) {
      damagePlayer(12);
      enemy.cooldown = 1.1;
    }
  }
}

function updateBullets(delta) {
  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.bullets[i];
    bullet.life -= delta;
    bullet.mesh.position.addScaledVector(bullet.velocity, delta);

    let hitEnemy = false;

    for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
      const enemy = state.enemies[j];
      if (!enemy) continue;
      const dist = bullet.mesh.position.distanceTo(enemy.root.position);
      if (dist < 1.5) {
        enemy.hp -= 1;
        hitEnemy = true;
        if (enemy.hp <= 0) {
          scene.remove(enemy.root);
          state.enemies.splice(j, 1);
          state.score += 250;
          setStatus('drone éliminé');
        }
        break;
      }
    }

    if (hitEnemy || bullet.life <= 0) {
      scene.remove(bullet.mesh);
      state.bullets.splice(i, 1);
    }
  }

  updateHUD();
}

function updateCameraEffects(delta) {
  player.fireCooldown = Math.max(0, player.fireCooldown - delta);
  if (state.reload > 0) {
    state.reload -= delta;
    if (state.reload <= 0) {
      state.ammo = 12;
      setStatus('arme prête');
      updateHUD();
    }
  }

  if (state.started && !state.gameOver) {
    state.elapsed += delta;
    timerEl.textContent = new Date(state.elapsed * 1000).toISOString().substr(14, 5);
  }
}

function animate() {
  const delta = clock.getDelta();
  state.elapsed += delta * Number(state.started && !state.gameOver);

  handleMovement(delta);
  liveEnemies(delta);
  updateBullets(delta);
  checkPickups();
  updateCameraEffects(delta);

  const pulse = 1 + Math.sin(state.elapsed * 10) * 0.03;
  scene.traverse((obj) => {
    if (obj.isMesh && obj.geometry && obj.geometry.type === 'OctahedronGeometry') {
      obj.rotation.x += delta * 1.4;
      obj.rotation.y += delta * 1.8;
      obj.scale.setScalar(pulse);
    }
  });

  renderer.render(scene, camera);
}

function startGame() {
  state.started = true;
  state.gameOver = false;
  state.score = 0;
  state.wave = 1;
  state.elapsed = 0;
  state.ammo = 12;
  state.reload = 0;
  player.health = 100;
  player.fireCooldown = 0;
  camera.position.set(0, 1.7, 18);

  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  hud.classList.remove('hidden');

  spawnArena();
  spawnWave(1);
  updateHUD();
  document.body.requestPointerLock();
}

function endGame(title) {
  state.started = false;
  state.gameOver = true;
  endTitle.textContent = title.toUpperCase();
  endCopy.textContent = `Score final : ${state.score.toString().padStart(6, '0')} | Vague maximum : ${state.wave}`;
  endScreen.classList.remove('hidden');
  hud.classList.add('hidden');
  document.exitPointerLock();
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyW' || event.code === 'ArrowUp') input.forward = true;
  if (event.code === 'KeyS' || event.code === 'ArrowDown') input.backward = true;
  if (event.code === 'KeyA' || event.code === 'ArrowLeft') input.left = true;
  if (event.code === 'KeyD' || event.code === 'ArrowRight') input.right = true;
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.sprint = true;
  if (event.code === 'KeyP') startGame();
});

document.addEventListener('keyup', (event) => {
  if (event.code === 'KeyW' || event.code === 'ArrowUp') input.forward = false;
  if (event.code === 'KeyS' || event.code === 'ArrowDown') input.backward = false;
  if (event.code === 'KeyA' || event.code === 'ArrowLeft') input.left = false;
  if (event.code === 'KeyD' || event.code === 'ArrowRight') input.right = false;
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.sprint = false;
});

document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === document.body && state.started && !state.gameOver) {
    camera.rotation.y -= event.movementX * 0.0022;
    camera.rotation.x -= event.movementY * 0.0018;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x, -1.5, 1.5);
  }
});

document.addEventListener('mousedown', (event) => {
  if (event.button === 0 && state.started && !state.gameOver) {
    fireWeapon();
  }
});

document.addEventListener('contextmenu', (event) => event.preventDefault());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

spawnArena();
updateHUD();
renderer.setAnimationLoop(animate);
