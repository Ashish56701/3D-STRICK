import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  GameMode,
  CharacterSkin,
  WeaponType,
  GameSettings,
  PlayerStats,
  WeaponConfig,
} from './types';
import { sound } from './audio';
import { createTerrainTexture, createHexShieldTexture } from './textures';
import { ParticleSystem } from './particles';
import {
  createPlayerCharacter,
  PlayerCharacterRigs,
  createWeaponModel,
  createDroneModel,
  createAndroidModel,
  createGoliathModel,
  createPowerupMesh,
  createSciFiBunker,
  createEnergyPylon,
  createBarricade,
  createCyberFlora,
} from './models';

// Pre-defined weapon configurations
export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  plasma_rifle: {
    id: 'plasma_rifle',
    name: 'Mark-IV Plasma Rifle',
    category: 'Rapid Energy Carbine',
    damage: 26,
    fireRate: 8,
    capacity: 32,
    reloadTime: 1.4,
    spread: 0.02,
    range: 120,
    projectileSpeed: 90,
    projectileColor: '#06b6d4',
    glowColor: 0x06b6d4,
    description: 'High rate of fire, reliable accuracy and balanced plasma discharge.',
  },
  scattergun: {
    id: 'scattergun',
    name: 'Vortex Scattergun',
    category: 'Heavy Pulse Shotgun',
    damage: 18, // per pellet (6 pellets = 108 max)
    fireRate: 2.2,
    capacity: 12,
    reloadTime: 1.8,
    spread: 0.09,
    range: 50,
    projectileSpeed: 75,
    projectileColor: '#f59e0b',
    glowColor: 0xf59e0b,
    description: 'Fires a devastating cone of superheated kinetic plasma at close range.',
  },
  rail_sniper: {
    id: 'rail_sniper',
    name: 'Ion Rail-Sniper',
    category: 'Anti-Armor Hyperion Beam',
    damage: 135,
    fireRate: 1.1,
    capacity: 6,
    reloadTime: 2.2,
    spread: 0.002,
    range: 200,
    projectileSpeed: 240,
    projectileColor: '#a855f7',
    glowColor: 0xa855f7,
    description: 'Pin-point electromagnetic accelerator that punches through heavy chassis.',
  },
};

interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  life: number;
  fromPlayer: boolean;
  color: number;
}

interface EnemyInstance {
  id: number;
  type: 'drone' | 'android' | 'goliath';
  group: THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  scoreValue: number;
  state: 'spawning' | 'active' | 'dead';
  spawnProgress: number;
  attackCooldown: number;
  rotors?: THREE.Group[];
  leftLeg?: THREE.Group;
  rightLeg?: THREE.Group;
  cannons?: THREE.Mesh[];
  animTime: number;
  strafeDir: number;
  strafeTimer: number;
}

interface PowerupInstance {
  id: number;
  type: 'health' | 'energy' | 'shield' | 'overdrive';
  group: THREE.Group;
  collected: boolean;
  bobOffset: number;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: ParticleSystem;

  // Environment and Lighting
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private arenaRadius = 110;
  private obstacles: THREE.Box3[] = [];

  // Player state and character
  public playerStats: PlayerStats;
  private playerRigs!: PlayerCharacterRigs;
  private playerPos = new THREE.Vector3(0, 0, 0);
  private playerVelocity = new THREE.Vector3(0, 0, 0);
  private playerYaw = 0;
  private isGrounded = true;
  private activeSkin: CharacterSkin = 'commando';
  private activeWeapon: WeaponType = 'plasma_rifle';
  private weaponMesh: THREE.Group | null = null;
  private fireTimer = 0;
  private reloadTimer = 0;
  private overdriveTimer = 0;
  private cameraDistance = 4.8;
  private cameraHeight = 2.2;
  private cameraYaw = 0;
  private cameraPitch = 0.2;
  private aimTarget = new THREE.Vector3();

  // Control inputs
  public keys: Record<string, boolean> = {};
  public mouseButtons: Record<number, boolean> = {};
  public isPointerLocked = false;
  public virtualJoystick = { x: 0, y: 0 };
  public isVirtualFiring = false;

  // Game flow
  public mode: GameMode = 'survival';
  public isRunning = false;
  public isPaused = false;
  public settings: GameSettings;
  private projectiles: Projectile[] = [];
  private enemies: EnemyInstance[] = [];
  private powerups: PowerupInstance[] = [];
  private nextEnemyId = 1;
  private nextPowerupId = 1;
  private waveSpawnTimer = 0;
  private enemiesToSpawnInWave = 0;
  private trainingTargetRespawnTimer = 0;

  // Callbacks
  public onStatsUpdate?: (stats: PlayerStats) => void;
  public onHitEnemy?: (isKill: boolean, headshot: boolean) => void;
  public onGameOver?: (victory: boolean, stats: PlayerStats) => void;
  public onWaveAnnounce?: (wave: number, title: string) => void;
  public onMinimapUpdate?: (data: {
    player: { x: number; z: number; yaw: number };
    enemies: Array<{ x: number; z: number; type: string }>;
    powerups: Array<{ x: number; z: number; type: string }>;
  }) => void;

  // Software WebGL & Loop management
  private isSoftwareGl = false;
  private animFrameId = 0;
  private lastTime = 0;

  constructor(container: HTMLElement, initialSettings: GameSettings) {
    this.container = container;
    this.settings = initialSettings;

    // Detect software WebGL as instructed by Three.js skill
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Initialize initial player stats
    const weaponConf = WEAPON_CONFIGS[this.activeWeapon];
    this.playerStats = {
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      energy: weaponConf.capacity,
      maxEnergy: weaponConf.capacity,
      isReloading: false,
      reloadProgress: 0,
      score: 0,
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
      wave: 1,
      timeSurvived: 0,
      multiplier: 1,
      comboTimer: 0,
    };

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      initialSettings.cameraFov || 70,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Procedural Studio Environment Reflection
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback gracefully
    }

    // Particle System
    this.particles = new ParticleSystem(this.scene);

    // Build the 3D World
    this.setupLighting();
    this.buildBattlefieldArena();
    this.initPlayer();
    this.setupEventListeners();

    // Resize observer
    window.addEventListener('resize', this.handleResize);

    // Start render loop
    this.lastTime = performance.now();
    this.startLoop();
  }

  private setupLighting() {
    // Hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.7);
    this.scene.add(this.hemiLight);

    // Directional Key Light
    this.dirLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    this.dirLight.position.set(45, 60, 35);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 160;
    const d = 50;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    this.applyDayNightPreset(this.settings.isDaytime);
  }

  public applyDayNightPreset(isDaytime: boolean) {
    this.settings.isDaytime = isDaytime;
    if (isDaytime) {
      this.scene.background = new THREE.Color(0x0f172a);
      this.scene.fog = new THREE.FogExp2(0x0f172a, 0.012);
      this.dirLight.color.setHex(0xffedd5);
      this.dirLight.intensity = 1.9;
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.8;
    } else {
      this.scene.background = new THREE.Color(0x020617);
      this.scene.fog = new THREE.FogExp2(0x020617, 0.016);
      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 0.9;
      this.hemiLight.color.setHex(0x1e1b4b);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.5;
    }
  }

  private buildBattlefieldArena() {
    // 1. Terrain ground plane
    const groundGeo = new THREE.PlaneGeometry(240, 240, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const groundTex = createTerrainTexture();
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      metalness: 0.6,
      roughness: 0.45,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Perimeter Energy Shield Barrier (Hexagon dome)
    const shieldGeo = new THREE.CylinderGeometry(
      this.arenaRadius,
      this.arenaRadius,
      24,
      48,
      1,
      true
    );
    shieldGeo.translate(0, 12, 0);
    const shieldTex = createHexShieldTexture();
    const shieldMat = new THREE.MeshBasicMaterial({
      map: shieldTex,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    this.scene.add(shield);

    // 3. Perimeter Defense Pylons around the circle
    const pylonCount = 12;
    for (let i = 0; i < pylonCount; i++) {
      const angle = (i * Math.PI * 2) / pylonCount;
      const x = Math.cos(angle) * this.arenaRadius;
      const z = Math.sin(angle) * this.arenaRadius;
      const pylon = createEnergyPylon(16);
      pylon.position.set(x, 0, z);
      this.scene.add(pylon);
      this.obstacles.push(
        new THREE.Box3(
          new THREE.Vector3(x - 3, 0, z - 3),
          new THREE.Vector3(x + 3, 16, z + 3)
        )
      );
    }

    // 4. Tactical Sci-Fi Bunkers & Outposts
    const bunkerLayouts = [
      { x: -35, z: -30, w: 14, h: 6, d: 10, rot: 0.3 },
      { x: 38, z: -35, w: 16, h: 7, d: 12, rot: -0.4 },
      { x: -32, z: 36, w: 15, h: 6, d: 10, rot: 1.2 },
      { x: 42, z: 32, w: 14, h: 6, d: 12, rot: -1.1 },
    ];

    bunkerLayouts.forEach((b) => {
      const bunker = createSciFiBunker(b.w, b.h, b.d);
      bunker.position.set(b.x, 0, b.z);
      bunker.rotation.y = b.rot;
      this.scene.add(bunker);
      this.obstacles.push(
        new THREE.Box3(
          new THREE.Vector3(b.x - b.w / 2, 0, b.z - b.d / 2),
          new THREE.Vector3(b.x + b.w / 2, b.h, b.z + b.d / 2)
        )
      );
    });

    // 5. Combat Barricades for cover
    const barricadePos = [
      { x: 0, z: -18, rot: 0 },
      { x: 0, z: 18, rot: Math.PI },
      { x: -18, z: 0, rot: Math.PI / 2 },
      { x: 18, z: 0, rot: -Math.PI / 2 },
      { x: -14, z: -14, rot: 0.78 },
      { x: 14, z: -14, rot: -0.78 },
      { x: -14, z: 14, rot: 2.35 },
      { x: 14, z: 14, rot: -2.35 },
    ];

    barricadePos.forEach((p) => {
      const bar = createBarricade();
      bar.position.set(p.x, 0, p.z);
      bar.rotation.y = p.rot;
      this.scene.add(bar);
      this.obstacles.push(
        new THREE.Box3(
          new THREE.Vector3(p.x - 2, 0, p.z - 1),
          new THREE.Vector3(p.x + 2, 1.8, p.z + 1)
        )
      );
    });

    // 6. Bioluminescent Cyber Flora
    const floraPos = [
      { x: -55, z: -15, h: 5 },
      { x: -50, z: 20, h: 6 },
      { x: 55, z: 15, h: 5.5 },
      { x: 50, z: -25, h: 6 },
      { x: -15, z: -55, h: 5 },
      { x: 20, z: -50, h: 6.5 },
      { x: 15, z: 55, h: 5 },
      { x: -20, z: 50, h: 6 },
    ];
    floraPos.forEach((fl) => {
      const tree = createCyberFlora(fl.h);
      tree.position.set(fl.x, 0, fl.z);
      this.scene.add(tree);
      this.obstacles.push(
        new THREE.Box3(
          new THREE.Vector3(fl.x - 1, 0, fl.z - 1),
          new THREE.Vector3(fl.x + 1, fl.h, fl.z + 1)
        )
      );
    });

    // Initial power-ups on the battlefield
    this.spawnPowerup('health', new THREE.Vector3(-8, 0, -8));
    this.spawnPowerup('energy', new THREE.Vector3(8, 0, -8));
    this.spawnPowerup('shield', new THREE.Vector3(-8, 0, 8));
    this.spawnPowerup('overdrive', new THREE.Vector3(8, 0, 8));
  }

  private initPlayer() {
    this.playerRigs = createPlayerCharacter(this.activeSkin);
    this.scene.add(this.playerRigs.group);
    this.attachWeaponModel(this.activeWeapon);
  }

  public setSkin(skin: CharacterSkin) {
    this.activeSkin = skin;
    this.scene.remove(this.playerRigs.group);
    this.playerRigs = createPlayerCharacter(skin);
    this.playerRigs.group.position.copy(this.playerPos);
    this.scene.add(this.playerRigs.group);
    this.attachWeaponModel(this.activeWeapon);
  }

  public setWeapon(weapon: WeaponType) {
    this.activeWeapon = weapon;
    const config = WEAPON_CONFIGS[weapon];
    this.playerStats.energy = config.capacity;
    this.playerStats.maxEnergy = config.capacity;
    this.playerStats.isReloading = false;
    this.playerStats.reloadProgress = 0;
    this.attachWeaponModel(weapon);
    this.triggerStatsUpdate();
  }

  private attachWeaponModel(type: WeaponType) {
    if (this.weaponMesh) {
      this.playerRigs.weaponHolder.remove(this.weaponMesh);
    }
    this.weaponMesh = createWeaponModel(type);
    this.playerRigs.weaponHolder.add(this.weaponMesh);
  }

  public spawnPowerup(
    type: 'health' | 'energy' | 'shield' | 'overdrive',
    pos: THREE.Vector3
  ) {
    const group = createPowerupMesh(type);
    group.position.set(pos.x, 1.2, pos.z);
    this.scene.add(group);
    this.powerups.push({
      id: this.nextPowerupId++,
      type,
      group,
      collected: false,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }

  public startTrainingMode() {
    this.mode = 'training';
    this.resetGame();
    // Spawn static training drones
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const pos = new THREE.Vector3(
        Math.cos(angle) * 16,
        1.5,
        Math.sin(angle) * 16 - 15
      );
      this.spawnEnemy('drone', pos, true);
    }
    this.onWaveAnnounce?.(1, 'TRAINING GROUND ACTIVE · TARGET PRACTICE');
  }

  public startSurvivalMode() {
    this.mode = 'survival';
    this.resetGame();
    this.startWave(1);
  }

  public startTimeChallenge() {
    this.mode = 'time_challenge';
    this.resetGame();
    this.playerStats.timeSurvived = 180; // 3 minutes countdown
    this.startWave(1);
    this.onWaveAnnounce?.(1, 'TIME CHALLENGE · DEFEAT ALL ASSAILANTS');
  }

  public startEndlessMode() {
    this.mode = 'endless';
    this.resetGame();
    this.startWave(1);
    this.onWaveAnnounce?.(1, 'ENDLESS MODE · SURVIVE AS LONG AS POSSIBLE');
  }

  private resetGame() {
    this.isRunning = true;
    this.isPaused = false;
    const conf = WEAPON_CONFIGS[this.activeWeapon];

    this.playerStats = {
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      energy: conf.capacity,
      maxEnergy: conf.capacity,
      isReloading: false,
      reloadProgress: 0,
      score: 0,
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
      wave: 1,
      timeSurvived: 0,
      multiplier: 1,
      comboTimer: 0,
    };

    this.playerPos.set(0, 0, 0);
    this.playerVelocity.set(0, 0, 0);
    this.playerYaw = 0;
    this.cameraYaw = 0;
    this.cameraPitch = 0.2;

    // Clear existing enemies
    this.enemies.forEach((e) => this.scene.remove(e.group));
    this.enemies = [];

    // Clear projectiles
    this.projectiles.forEach((p) => this.scene.remove(p.mesh));
    this.projectiles = [];

    sound.startSciFiBgm();
    this.triggerStatsUpdate();
  }

  private startWave(waveNum: number) {
    this.playerStats.wave = waveNum;
    this.waveSpawnTimer = 0;

    let baseEnemies = 4 + waveNum * 3;
    if (this.mode === 'endless') {
      baseEnemies = 5 + Math.floor(waveNum * 3.5);
    }
    this.enemiesToSpawnInWave = baseEnemies;

    const title =
      waveNum === 5 || waveNum === 10
        ? `WAVE ${waveNum}: BOSS ASSAULT - GOLIATH DETECTED`
        : `WAVE ${waveNum}: HOSTILE FORCES INBOUND`;

    this.onWaveAnnounce?.(waveNum, title);
    this.triggerStatsUpdate();
  }

  public spawnEnemy(
    type: 'drone' | 'android' | 'goliath',
    position: THREE.Vector3,
    isTraining = false
  ) {
    let group: THREE.Group;
    let rotors: THREE.Group[] | undefined;
    let leftLeg: THREE.Group | undefined;
    let rightLeg: THREE.Group | undefined;
    let cannons: THREE.Mesh[] | undefined;

    let health = 60;
    let speed = 4.2;
    let damage = 8;
    let scoreValue = 100;

    if (type === 'drone') {
      const droneData = createDroneModel();
      group = droneData.group;
      rotors = droneData.rotors;
      health = 55;
      speed = 5.2;
      damage = 7;
      scoreValue = 120;
    } else if (type === 'android') {
      const androidData = createAndroidModel();
      group = androidData.group;
      leftLeg = androidData.leftLeg;
      rightLeg = androidData.rightLeg;
      health = 110;
      speed = 3.6;
      damage = 12;
      scoreValue = 200;
    } else {
      const goliathData = createGoliathModel();
      group = goliathData.group;
      cannons = goliathData.cannons;
      health = 480;
      speed = 2.4;
      damage = 25;
      scoreValue = 850;
    }

    // Scale with waves
    const waveScale = 1 + (this.playerStats.wave - 1) * 0.12;
    health = Math.round(health * waveScale);
    damage = Math.round(damage * waveScale);

    if (isTraining) {
      health = 40;
      speed = 0;
    }

    group.position.copy(position);
    this.scene.add(group);

    // Spawn teleport beacon effect
    this.particles.emit({
      count: 25,
      position: position,
      speed: 6,
      color: type === 'goliath' ? 0xdc2626 : 0x06b6d4,
      scale: 1.5,
      life: 0.8,
      upwardBias: 1.2,
    });

    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      group,
      health,
      maxHealth: health,
      speed,
      damage,
      scoreValue,
      state: 'spawning',
      spawnProgress: 0,
      attackCooldown: 1.2 + Math.random() * 0.8,
      rotors,
      leftLeg,
      rightLeg,
      cannons,
      animTime: Math.random() * 10,
      strafeDir: Math.random() > 0.5 ? 1 : -1,
      strafeTimer: 2 + Math.random() * 2,
    });
  }

  private triggerStatsUpdate() {
    this.onStatsUpdate?.({ ...this.playerStats });
  }

  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyR' && !this.playerStats.isReloading) {
        this.reload();
      }

      if (e.code === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.mouseButtons = {};
    });

    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.mouseButtons[e.button] = true;
      if (!this.isPointerLocked && document.pointerLockElement !== dom) {
        dom.requestPointerLock?.();
      }
    });

    window.addEventListener('mouseup', (e) => {
      this.mouseButtons[e.button] = false;
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === dom;
    });

    dom.addEventListener('mousemove', (e) => {
      if (this.isPaused) return;

      const sens = this.settings.sensitivity * 0.0022;
      const deltaX = e.movementX * sens;
      const deltaY = e.movementY * sens * (this.settings.invertY ? 1 : -1);

      this.cameraYaw -= deltaX;
      this.cameraPitch = Math.max(
        -0.4,
        Math.min(1.1, this.cameraPitch - deltaY)
      );
    });
  }

  public handleTouchLook(deltaX: number, deltaY: number) {
    if (this.isPaused) return;
    const sens = this.settings.sensitivity * 0.003;
    this.cameraYaw -= deltaX * sens;
    this.cameraPitch = Math.max(
      -0.4,
      Math.min(1.1, this.cameraPitch + deltaY * sens * (this.settings.invertY ? -1 : 1))
    );
  }

  public jump() {
    if (this.isGrounded && !this.isPaused && this.isRunning) {
      this.playerVelocity.y = 8.5;
      this.isGrounded = false;
      sound.playJump();
      this.particles.emit({
        count: 14,
        position: this.playerPos,
        speed: 4,
        color: 0x06b6d4,
        scale: 0.8,
        life: 0.35,
        upwardBias: -0.5,
      });
    }
  }

  public reload() {
    const config = WEAPON_CONFIGS[this.activeWeapon];
    if (
      this.playerStats.energy < config.capacity &&
      !this.playerStats.isReloading
    ) {
      this.playerStats.isReloading = true;
      this.playerStats.reloadProgress = 0;
      this.reloadTimer = config.reloadTime;
      sound.playReload();
      this.triggerStatsUpdate();
    }
  }

  public togglePause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      document.exitPointerLock?.();
    }
  }

  private firePlayerWeapon() {
    if (
      this.playerStats.isReloading ||
      this.fireTimer > 0 ||
      this.playerStats.energy <= 0
    ) {
      if (this.playerStats.energy <= 0 && !this.playerStats.isReloading) {
        this.reload();
      }
      return;
    }

    const config = WEAPON_CONFIGS[this.activeWeapon];
    this.fireTimer = 1 / config.fireRate;
    this.playerStats.energy--;
    this.playerStats.shotsFired++;

    // Muzzle position in world
    const muzzleWorldPos = new THREE.Vector3();
    this.playerRigs.muzzlePoint.getWorldPosition(muzzleWorldPos);

    // Aim direction toward target
    const targetDir = new THREE.Vector3()
      .subVectors(this.aimTarget, muzzleWorldPos)
      .normalize();

    // Weapon specific firing sound & projectile spawning
    if (config.id === 'plasma_rifle') {
      sound.playLaser('plasma');
      this.spawnProjectile(
        muzzleWorldPos,
        targetDir,
        config.damage,
        config.projectileSpeed,
        config.glowColor,
        true,
        config.spread
      );
    } else if (config.id === 'scattergun') {
      sound.playLaser('scatter');
      for (let i = 0; i < 6; i++) {
        this.spawnProjectile(
          muzzleWorldPos,
          targetDir,
          config.damage,
          config.projectileSpeed,
          config.glowColor,
          true,
          config.spread
        );
      }
    } else if (config.id === 'rail_sniper') {
      sound.playLaser('rail');
      this.spawnProjectile(
        muzzleWorldPos,
        targetDir,
        config.damage,
        config.projectileSpeed,
        config.glowColor,
        true,
        config.spread
      );
    }

    // Muzzle flash particle
    this.particles.createMuzzleFlash(muzzleWorldPos, targetDir, config.glowColor);

    // Gun recoil animation
    if (this.playerRigs.weaponHolder) {
      this.playerRigs.weaponHolder.position.z -= 0.12;
    }

    this.triggerStatsUpdate();
  }

  private spawnProjectile(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    speed: number,
    color: number,
    fromPlayer: boolean,
    spread = 0
  ) {
    const finalDir = direction.clone();
    if (spread > 0) {
      finalDir.x += (Math.random() - 0.5) * spread;
      finalDir.y += (Math.random() - 0.5) * spread;
      finalDir.z += (Math.random() - 0.5) * spread;
      finalDir.normalize();
    }

    // Projectile mesh
    const length = fromPlayer && this.activeWeapon === 'rail_sniper' ? 3.0 : 0.8;
    const radius = fromPlayer && this.activeWeapon === 'rail_sniper' ? 0.08 : 0.06;
    const geo = new THREE.CylinderGeometry(radius, radius, length, 8);
    geo.rotateX(Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), finalDir);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      velocity: finalDir.multiplyScalar(speed),
      damage,
      life: 2.5,
      fromPlayer,
      color,
    });
  }

  private updatePlayer(dt: number) {
    if (!this.isRunning) return;

    // Stamina / Sprinting
    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    let moveSpeed = 7.0;
    if (this.activeSkin === 'commando') moveSpeed = 7.5;
    if (this.activeSkin === 'vanguard') moveSpeed = 7.0;
    if (this.activeSkin === 'phantom') moveSpeed = 8.2;
    if (isSprinting) moveSpeed *= 1.45;
    if (this.overdriveTimer > 0) moveSpeed *= 1.25;

    // Movement vector relative to camera yaw
    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // Virtual Joystick support
    if (Math.abs(this.virtualJoystick.x) > 0.05 || Math.abs(this.virtualJoystick.y) > 0.05) {
      moveX = this.virtualJoystick.x;
      moveZ = this.virtualJoystick.y;
    }

    const inputLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    const isMoving = inputLen > 0.1;

    if (isMoving) {
      const normX = moveX / Math.max(1, inputLen);
      const normZ = moveZ / Math.max(1, inputLen);

      // Rotate with camera yaw
      const forward = new THREE.Vector3(
        -Math.sin(this.cameraYaw),
        0,
        -Math.cos(this.cameraYaw)
      );
      const right = new THREE.Vector3(
        Math.cos(this.cameraYaw),
        0,
        -Math.sin(this.cameraYaw)
      );

      const targetMove = new THREE.Vector3()
        .addScaledVector(forward, -normZ)
        .addScaledVector(right, normX)
        .normalize()
        .multiplyScalar(moveSpeed);

      this.playerVelocity.x = THREE.MathUtils.damp(
        this.playerVelocity.x,
        targetMove.x,
        14,
        dt
      );
      this.playerVelocity.z = THREE.MathUtils.damp(
        this.playerVelocity.z,
        targetMove.z,
        14,
        dt
      );

      // Player faces movement or faces aim direction
      const moveAngle = Math.atan2(this.playerVelocity.x, this.playerVelocity.z);
      this.playerYaw = THREE.MathUtils.damp(this.playerYaw, moveAngle, 12, dt);
    } else {
      this.playerVelocity.x = THREE.MathUtils.damp(
        this.playerVelocity.x,
        0,
        16,
        dt
      );
      this.playerVelocity.z = THREE.MathUtils.damp(
        this.playerVelocity.z,
        0,
        16,
        dt
      );
    }

    // Jump / Space action
    if (this.keys['Space']) {
      this.jump();
    }

    // Gravity
    this.playerVelocity.y -= 22 * dt;
    this.playerPos.addScaledVector(this.playerVelocity, dt);

    // Ground floor collision
    if (this.playerPos.y <= 0) {
      this.playerPos.y = 0;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // Arena perimeter barrier
    const distFromCenter = Math.sqrt(
      this.playerPos.x * this.playerPos.x + this.playerPos.z * this.playerPos.z
    );
    if (distFromCenter > this.arenaRadius - 2) {
      const angle = Math.atan2(this.playerPos.z, this.playerPos.x);
      this.playerPos.x = Math.cos(angle) * (this.arenaRadius - 2);
      this.playerPos.z = Math.sin(angle) * (this.arenaRadius - 2);
    }

    // Obstacle collisions
    const playerRadius = 0.55;
    for (const box of this.obstacles) {
      if (
        this.playerPos.x > box.min.x - playerRadius &&
        this.playerPos.x < box.max.x + playerRadius &&
        this.playerPos.z > box.min.z - playerRadius &&
        this.playerPos.z < box.max.z + playerRadius
      ) {
        // Resolve pushout
        const overlapX =
          this.playerPos.x < (box.min.x + box.max.x) / 2
            ? box.min.x - playerRadius - this.playerPos.x
            : box.max.x + playerRadius - this.playerPos.x;
        const overlapZ =
          this.playerPos.z < (box.min.z + box.max.z) / 2
            ? box.min.z - playerRadius - this.playerPos.z
            : box.max.z + playerRadius - this.playerPos.z;

        if (Math.abs(overlapX) < Math.abs(overlapZ)) {
          this.playerPos.x += overlapX;
        } else {
          this.playerPos.z += overlapZ;
        }
      }
    }

    // Update Player group position and orientation
    this.playerRigs.group.position.copy(this.playerPos);
    this.playerRigs.group.rotation.y = this.playerYaw;

    // Procedural walking animation
    const animSpeed = isSprinting ? 14 : 9;
    const walkPhase = performance.now() * 0.001 * animSpeed;
    if (isMoving && this.isGrounded) {
      this.playerRigs.leftLeg.rotation.x = Math.sin(walkPhase) * 0.65;
      this.playerRigs.rightLeg.rotation.x = -Math.sin(walkPhase) * 0.65;
      this.playerRigs.leftArm.rotation.x = -Math.sin(walkPhase) * 0.45;
      this.playerRigs.torso.position.y = 0.95 + Math.abs(Math.sin(walkPhase * 2)) * 0.05;
    } else {
      this.playerRigs.leftLeg.rotation.x = THREE.MathUtils.damp(
        this.playerRigs.leftLeg.rotation.x,
        0,
        12,
        dt
      );
      this.playerRigs.rightLeg.rotation.x = THREE.MathUtils.damp(
        this.playerRigs.rightLeg.rotation.x,
        0,
        12,
        dt
      );
      this.playerRigs.leftArm.rotation.x = THREE.MathUtils.damp(
        this.playerRigs.leftArm.rotation.x,
        0,
        12,
        dt
      );
      this.playerRigs.torso.position.y = 0.95;
    }

    // Reload timer
    if (this.playerStats.isReloading) {
      this.reloadTimer -= dt;
      const config = WEAPON_CONFIGS[this.activeWeapon];
      this.playerStats.reloadProgress = 1 - Math.max(0, this.reloadTimer) / config.reloadTime;

      if (this.reloadTimer <= 0) {
        this.playerStats.isReloading = false;
        this.playerStats.energy = config.capacity;
        this.playerStats.reloadProgress = 0;
        this.triggerStatsUpdate();
      }
    }

    // Fire timer cooldown
    if (this.fireTimer > 0) {
      this.fireTimer -= dt;
    }

    // Weapon recoil return
    if (this.playerRigs.weaponHolder) {
      this.playerRigs.weaponHolder.position.z = THREE.MathUtils.damp(
        this.playerRigs.weaponHolder.position.z,
        0.2,
        16,
        dt
      );
    }

    // Firing triggers
    if ((this.mouseButtons[0] || this.isVirtualFiring) && !this.isPaused) {
      this.firePlayerWeapon();
    }

    // Overdrive countdown
    if (this.overdriveTimer > 0) {
      this.overdriveTimer -= dt;
      this.particles.emit({
        count: 1,
        position: this.playerPos,
        speed: 1.5,
        color: 0xf59e0b,
        scale: 0.4,
        life: 0.3,
      });
    }

    // Combo timer
    if (this.playerStats.comboTimer > 0) {
      this.playerStats.comboTimer -= dt;
      if (this.playerStats.comboTimer <= 0) {
        this.playerStats.multiplier = 1;
        this.triggerStatsUpdate();
      }
    }

    // Shield passive regeneration
    if (
      this.playerStats.shield < this.playerStats.maxShield &&
      this.playerStats.health > 0
    ) {
      this.playerStats.shield = Math.min(
        this.playerStats.maxShield,
        this.playerStats.shield + 4 * dt
      );
    }
  }

  private updateCamera(dt: number) {
    // Calculate third-person camera location based on yaw and pitch
    const camOffset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance,
      Math.sin(this.cameraPitch) * this.cameraDistance + this.cameraHeight,
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance
    );

    const targetCamPos = this.playerPos.clone().add(camOffset);

    // Smooth camera damping
    this.camera.position.lerp(targetCamPos, Math.min(1, 16 * dt));

    // Look at player chest
    const lookTarget = this.playerPos.clone().add(new THREE.Vector3(0, 1.5, 0));
    this.camera.lookAt(lookTarget);

    // Aim target in world: raycast from camera forward
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    this.aimTarget.copy(this.camera.position).addScaledVector(camDir, 50);
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Step
      const prevPos = p.mesh.position.clone();
      p.mesh.position.addScaledVector(p.velocity, dt);

      // Trail particle
      if (Math.random() < 0.6) {
        this.particles.emit({
          count: 1,
          position: p.mesh.position,
          speed: 1,
          color: p.color,
          scale: 0.35,
          life: 0.2,
        });
      }

      // Ground hit
      if (p.mesh.position.y <= 0) {
        this.particles.createHitSparks(p.mesh.position, new THREE.Vector3(0, 1, 0), p.color);
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Obstacle hit
      let hitObstacle = false;
      for (const box of this.obstacles) {
        if (box.containsPoint(p.mesh.position)) {
          this.particles.createHitSparks(p.mesh.position, new THREE.Vector3(0, 1, 0), p.color);
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          hitObstacle = true;
          break;
        }
      }
      if (hitObstacle) continue;

      // Player projectile -> Enemy hit
      if (p.fromPlayer) {
        let hitEnemy = false;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          if (enemy.state !== 'active') continue;

          const hitRadius = enemy.type === 'goliath' ? 2.2 : 0.9;
          const hitHeight = enemy.type === 'goliath' ? 2.8 : 1.8;

          const dx = p.mesh.position.x - enemy.group.position.x;
          const dy = p.mesh.position.y - enemy.group.position.y;
          const dz = p.mesh.position.z - enemy.group.position.z;
          const distSq = dx * dx + dz * dz;

          if (distSq < hitRadius * hitRadius && dy >= 0 && dy <= hitHeight) {
            // Register Hit
            hitEnemy = true;
            this.playerStats.shotsHit++;
            sound.playHitmark();

            // Headshot bonus
            const isHeadshot = dy > hitHeight * 0.75;
            let finalDmg = p.damage;
            if (isHeadshot) finalDmg = Math.round(finalDmg * 1.6);
            if (this.overdriveTimer > 0) finalDmg = Math.round(finalDmg * 1.5);

            enemy.health -= finalDmg;
            this.particles.createHitSparks(p.mesh.position, new THREE.Vector3(0, 1, 0), 0xef4444);

            this.onHitEnemy?.(enemy.health <= 0, isHeadshot);

            // Enemy death
            if (enemy.health <= 0) {
              this.killEnemy(j);
            }

            this.scene.remove(p.mesh);
            this.projectiles.splice(i, 1);
            break;
          }
        }
        if (hitEnemy) continue;
      }

      // Enemy projectile -> Player hit
      if (!p.fromPlayer) {
        const dx = p.mesh.position.x - this.playerPos.x;
        const dy = p.mesh.position.y - (this.playerPos.y + 1.0);
        const dz = p.mesh.position.z - this.playerPos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < 0.8 * 0.8 && Math.abs(dy) < 1.0) {
          // Player hurt
          this.applyDamageToPlayer(p.damage);
          this.particles.createHitSparks(p.mesh.position, new THREE.Vector3(0, 1, 0), 0x38bdf8);
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private killEnemy(idx: number) {
    const enemy = this.enemies[idx];
    enemy.state = 'dead';

    // Sound and explosion
    sound.playExplosion(enemy.type === 'goliath');
    this.particles.createExplosion(enemy.group.position, enemy.type === 'goliath');

    // Score and kills
    this.playerStats.kills++;
    this.playerStats.comboTimer = 3.5;
    this.playerStats.multiplier = Math.min(8, this.playerStats.multiplier + 1);
    this.playerStats.score += enemy.scoreValue * this.playerStats.multiplier;

    // Time challenge bonus
    if (this.mode === 'time_challenge') {
      this.playerStats.timeSurvived += 5; // extra 5 seconds
    }

    // Powerup drop chance (25%)
    if (Math.random() < 0.28 || enemy.type === 'goliath') {
      const dropTypes: Array<'health' | 'energy' | 'shield' | 'overdrive'> = [
        'health',
        'energy',
        'shield',
        'overdrive',
      ];
      const pick = dropTypes[Math.floor(Math.random() * dropTypes.length)];
      this.spawnPowerup(pick, enemy.group.position);
    }

    this.scene.remove(enemy.group);
    this.enemies.splice(idx, 1);
    this.triggerStatsUpdate();
  }

  public applyDamageToPlayer(amount: number) {
    if (this.overdriveTimer > 0) return; // Invulnerable in overdrive

    sound.playPlayerHurt();

    // Damage shield first
    if (this.playerStats.shield > 0) {
      if (this.playerStats.shield >= amount) {
        this.playerStats.shield -= amount;
        amount = 0;
      } else {
        amount -= this.playerStats.shield;
        this.playerStats.shield = 0;
      }
    }

    if (amount > 0) {
      this.playerStats.health = Math.max(0, this.playerStats.health - amount);
    }

    // Check game over
    if (this.playerStats.health <= 0) {
      this.triggerGameOver(false);
    }

    this.triggerStatsUpdate();
  }

  private updateEnemies(dt: number) {
    const playerTarget = this.playerPos.clone().add(new THREE.Vector3(0, 1.2, 0));

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Spawning animation
      if (e.state === 'spawning') {
        e.spawnProgress += dt * 2;
        e.group.scale.setScalar(Math.min(1, e.spawnProgress));
        if (e.spawnProgress >= 1) {
          e.state = 'active';
        }
        continue;
      }

      e.animTime += dt;

      // Distance and direction to player
      const toPlayer = new THREE.Vector3().subVectors(playerTarget, e.group.position);
      const dist = toPlayer.length();
      const dir = toPlayer.clone().normalize();

      // Look at player
      const targetAngle = Math.atan2(dir.x, dir.z);
      e.group.rotation.y = THREE.MathUtils.damp(
        e.group.rotation.y,
        targetAngle,
        6,
        dt
      );

      // AI Movement per type
      if (e.type === 'drone') {
        // Drone hovers and circles around player at 10-18 units distance
        const desiredDist = 14;
        let moveVec = new THREE.Vector3();

        if (dist > desiredDist + 3) {
          moveVec.add(dir);
        } else if (dist < desiredDist - 3) {
          moveVec.sub(dir);
        }

        // Strafing sideways
        const strafeVec = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(e.strafeDir);
        moveVec.add(strafeVec.multiplyScalar(0.7));

        e.strafeTimer -= dt;
        if (e.strafeTimer <= 0) {
          e.strafeDir *= -1;
          e.strafeTimer = 2 + Math.random() * 2;
        }

        moveVec.y = 0;
        moveVec.normalize().multiplyScalar(e.speed * dt);
        e.group.position.add(moveVec);

        // Hover bobbing
        e.group.position.y = 2.8 + Math.sin(e.animTime * 3) * 0.4;

        // Spin rotors
        if (e.rotors) {
          e.rotors.forEach((r) => (r.rotation.y += 25 * dt));
        }

        // Firing attack
        e.attackCooldown -= dt;
        if (e.attackCooldown <= 0 && dist < 35 && this.isRunning) {
          e.attackCooldown = 1.4 + Math.random() * 0.8;
          sound.playEnemyLaser();
          this.spawnProjectile(
            e.group.position.clone().add(new THREE.Vector3(0, -0.2, 0)),
            dir,
            e.damage,
            50,
            0xef4444,
            false,
            0.04
          );
        }
      } else if (e.type === 'android') {
        // Ground soldier advances to 8-12 units
        const desiredDist = 9;
        let moveVec = new THREE.Vector3();

        if (dist > desiredDist) {
          moveVec.add(dir);
        }

        moveVec.y = 0;
        moveVec.normalize().multiplyScalar(e.speed * dt);
        e.group.position.add(moveVec);
        e.group.position.y = 0;

        // Walking leg swings
        const legSwing = Math.sin(e.animTime * 8) * 0.6;
        if (e.leftLeg && e.rightLeg) {
          e.leftLeg.rotation.x = legSwing;
          e.rightLeg.rotation.x = -legSwing;
        }

        // Blaster attack
        e.attackCooldown -= dt;
        if (e.attackCooldown <= 0 && dist < 28 && this.isRunning) {
          e.attackCooldown = 1.6 + Math.random() * 0.6;
          sound.playEnemyLaser();
          this.spawnProjectile(
            e.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
            dir,
            e.damage,
            55,
            0xef4444,
            false,
            0.03
          );
        }
      } else if (e.type === 'goliath') {
        // Heavy boss marches slowly, fires dual heavy volleys
        if (dist > 8) {
          const moveVec = dir.clone();
          moveVec.y = 0;
          e.group.position.add(moveVec.multiplyScalar(e.speed * dt));
        }
        e.group.position.y = 0;

        e.attackCooldown -= dt;
        if (e.attackCooldown <= 0 && dist < 45 && this.isRunning) {
          e.attackCooldown = 2.4;
          sound.playLaser('rail');
          // Twin blast
          this.spawnProjectile(
            e.group.position.clone().add(new THREE.Vector3(-0.9, 2.1, 0)),
            dir,
            e.damage,
            65,
            0xdc2626,
            false,
            0.02
          );
          this.spawnProjectile(
            e.group.position.clone().add(new THREE.Vector3(0.9, 2.1, 0)),
            dir,
            e.damage,
            65,
            0xdc2626,
            false,
            0.02
          );
        }
      }
    }
  }

  private updatePowerups(dt: number) {
    const pPos = this.playerPos;

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      if (p.collected) continue;

      // Bob and spin
      p.group.rotation.y += 2.0 * dt;
      p.group.position.y = 1.0 + Math.sin(performance.now() * 0.003 + p.bobOffset) * 0.25;

      // Pickup distance check
      const dx = p.group.position.x - pPos.x;
      const dz = p.group.position.z - pPos.z;
      if (dx * dx + dz * dz < 2.2 * 2.2) {
        p.collected = true;
        sound.playPowerup();

        if (p.type === 'health') {
          this.playerStats.health = Math.min(
            this.playerStats.maxHealth,
            this.playerStats.health + 40
          );
        } else if (p.type === 'energy') {
          this.playerStats.energy = this.playerStats.maxEnergy;
          this.playerStats.isReloading = false;
        } else if (p.type === 'shield') {
          this.playerStats.shield = this.playerStats.maxShield;
        } else if (p.type === 'overdrive') {
          this.overdriveTimer = 10; // 10 seconds overdrive
        }

        this.particles.emit({
          count: 20,
          position: p.group.position,
          speed: 5,
          color: p.type === 'health' ? 0x22c55e : 0x06b6d4,
          scale: 0.8,
          life: 0.5,
        });

        this.scene.remove(p.group);
        this.powerups.splice(i, 1);
        this.triggerStatsUpdate();
      }
    }
  }

  private updateWaves(dt: number) {
    if (!this.isRunning || this.mode === 'training') return;

    // Time challenge mode timer countdown
    if (this.mode === 'time_challenge') {
      this.playerStats.timeSurvived -= dt;
      if (this.playerStats.timeSurvived <= 0) {
        this.playerStats.timeSurvived = 0;
        this.triggerGameOver(true); // Victory on time elapsed
        return;
      }
    } else {
      this.playerStats.timeSurvived += dt;
    }

    // Spawn wave queue
    if (this.enemiesToSpawnInWave > 0) {
      this.waveSpawnTimer -= dt;
      if (this.waveSpawnTimer <= 0) {
        this.waveSpawnTimer = 1.5;
        this.enemiesToSpawnInWave--;

        // Determine enemy type
        let type: 'drone' | 'android' | 'goliath' = 'drone';
        const wave = this.playerStats.wave;
        const rand = Math.random();

        if ((wave === 5 || wave === 10) && this.enemiesToSpawnInWave === 0) {
          type = 'goliath';
        } else if (wave >= 3 && rand < 0.45) {
          type = 'android';
        }

        // Spawn position around perimeter
        const angle = Math.random() * Math.PI * 2;
        const radius = this.arenaRadius - 8;
        const pos = new THREE.Vector3(
          Math.cos(angle) * radius,
          type === 'drone' ? 3 : 0,
          Math.sin(angle) * radius
        );
        this.spawnEnemy(type, pos);
      }
    } else if (this.enemies.length === 0) {
      // Wave Cleared!
      if (this.mode === 'survival' && this.playerStats.wave >= 10) {
        this.triggerGameOver(true); // Survival victory!
      } else {
        this.startWave(this.playerStats.wave + 1);
      }
    }
  }

  private triggerGameOver(victory: boolean) {
    this.isRunning = false;
    sound.stopSciFiBgm();
    sound.playExplosion(true);
    this.saveHighScore();
    this.onGameOver?.(victory, { ...this.playerStats });
  }

  private saveHighScore() {
    try {
      const key = `3dstrike_highscore_${this.mode}`;
      const saved = localStorage.getItem(key);
      const currentBest = saved ? parseInt(saved, 10) : 0;
      if (this.playerStats.score > currentBest) {
        localStorage.setItem(key, this.playerStats.score.toString());
      }
    } catch {
      // Ignore localStorage issues
    }
  }

  private updateMinimap() {
    if (!this.onMinimapUpdate) return;
    this.onMinimapUpdate({
      player: {
        x: this.playerPos.x,
        z: this.playerPos.z,
        yaw: this.playerYaw,
      },
      enemies: this.enemies.map((e) => ({
        x: e.group.position.x,
        z: e.group.position.z,
        type: e.type,
      })),
      powerups: this.powerups.map((p) => ({
        x: p.group.position.x,
        z: p.group.position.z,
        type: p.type,
      })),
    });
  }

  private startLoop() {
    const tick = () => {
      const now = performance.now();
      const rawDt = (now - this.lastTime) * 0.001;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05); // clamp frame delta as instructed

      if (!this.isPaused && this.isRunning) {
        this.updatePlayer(dt);
        this.updateCamera(dt);
        this.updateProjectiles(dt);
        this.updateEnemies(dt);
        this.updatePowerups(dt);
        this.updateWaves(dt);
        this.updateMinimap();
      }

      this.particles.update(this.camera, this.camera, dt);
      this.renderer.render(this.scene, this.camera);

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private handleResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.handleResize);
    sound.stopSciFiBgm();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
