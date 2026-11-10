import * as THREE from 'three';
import { createGlowParticleTexture, createSmokeParticleTexture } from './textures';

interface Particle {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  scale: number;
  initialScale: number;
  life: number;
  maxLife: number;
  decay: number;
  rotation: number;
  rotSpeed: number;
}

export class ParticleSystem {
  private maxParticles = 600;
  private particles: Particle[] = [];
  private instancedMesh: THREE.InstancedMesh;
  private smokeMesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private colorHelper = new THREE.Color();

  constructor(scene: THREE.Scene) {
    const glowTex = createGlowParticleTexture();
    const smokeTex = createSmokeParticleTexture();

    // Glow quad
    const glowGeo = new THREE.PlaneGeometry(1, 1);
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.instancedMesh = new THREE.InstancedMesh(glowGeo, glowMat, 400);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.frustumCulled = false;
    scene.add(this.instancedMesh);

    // Smoke quad
    const smokeGeo = new THREE.PlaneGeometry(1, 1);
    const smokeMat = new THREE.MeshBasicMaterial({
      map: smokeTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.smokeMesh = new THREE.InstancedMesh(smokeGeo, smokeMat, 200);
    this.smokeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.smokeMesh.frustumCulled = false;
    scene.add(this.smokeMesh);

    // Initialize pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        scale: 1,
        initialScale: 1,
        life: 0,
        maxLife: 1,
        decay: 1,
        rotation: 0,
        rotSpeed: 0
      });
    }

    // Hide all initially
    for (let i = 0; i < 400; i++) {
      this.dummy.position.set(0, -9999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    for (let i = 0; i < 200; i++) {
      this.dummy.position.set(0, -9999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.smokeMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.smokeMesh.instanceMatrix.needsUpdate = true;
  }

  public emit(options: {
    count: number;
    position: THREE.Vector3;
    speed?: number;
    spread?: number;
    color?: THREE.Color | number | string;
    scale?: number;
    life?: number;
    isSmoke?: boolean;
    upwardBias?: number;
  }) {
    const {
      count,
      position,
      speed = 5,
      spread = 1,
      color = 0x06b6d4,
      scale = 0.8,
      life = 0.5,
      isSmoke = false,
      upwardBias = 0
    } = options;

    const baseColor = typeof color === 'object' && 'isColor' in color ? color : new THREE.Color(color);

    let spawned = 0;
    const startIdx = isSmoke ? 400 : 0;
    const endIdx = isSmoke ? 600 : 400;

    for (let i = startIdx; i < endIdx && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.position.copy(position);
        p.position.x += (Math.random() - 0.5) * 0.2;
        p.position.y += (Math.random() - 0.5) * 0.2;
        p.position.z += (Math.random() - 0.5) * 0.2;

        p.velocity.set(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread + upwardBias,
          (Math.random() - 0.5) * spread
        ).normalize().multiplyScalar(speed * (0.5 + Math.random() * 0.8));

        p.color.copy(baseColor);
        p.initialScale = scale * (0.7 + Math.random() * 0.6);
        p.scale = p.initialScale;
        p.maxLife = life * (0.7 + Math.random() * 0.6);
        p.life = p.maxLife;
        p.decay = 1 / p.maxLife;
        p.rotation = Math.random() * Math.PI * 2;
        p.rotSpeed = (Math.random() - 0.5) * 4;

        spawned++;
      }
    }
  }

  public createExplosion(pos: THREE.Vector3, isHeavy = false) {
    const count = isHeavy ? 45 : 25;
    // Fiery orange/red core
    this.emit({
      count,
      position: pos,
      speed: isHeavy ? 14 : 9,
      spread: 2,
      color: 0xf59e0b,
      scale: isHeavy ? 2.5 : 1.4,
      life: 0.6,
      upwardBias: 0.8
    });
    // Cyan electric energy discharge
    this.emit({
      count: Math.floor(count * 0.6),
      position: pos,
      speed: isHeavy ? 16 : 10,
      spread: 2,
      color: 0x06b6d4,
      scale: isHeavy ? 1.6 : 1.0,
      life: 0.45
    });
    // Dark heavy smoke plume
    this.emit({
      count: isHeavy ? 30 : 15,
      position: pos,
      speed: 4,
      spread: 1.5,
      scale: isHeavy ? 3.5 : 2.0,
      life: 1.1,
      isSmoke: true,
      upwardBias: 1.5
    });
  }

  public createHitSparks(pos: THREE.Vector3, normal: THREE.Vector3, color = 0x06b6d4) {
    this.emit({
      count: 8,
      position: pos,
      speed: 7,
      spread: 1.2,
      color,
      scale: 0.5,
      life: 0.25,
      upwardBias: 0.4
    });
  }

  public createMuzzleFlash(pos: THREE.Vector3, dir: THREE.Vector3, color = 0x06b6d4) {
    this.emit({
      count: 6,
      position: pos,
      speed: 4,
      spread: 0.5,
      color,
      scale: 1.2,
      life: 0.12
    });
  }

  public update(dt: THREE.Camera, camera: THREE.Camera, delta: number) {
    // Glow instances: 0..399
    for (let i = 0; i < 400; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.life -= delta;
        if (p.life <= 0) {
          p.active = false;
          this.dummy.position.set(0, -9999, 0);
          this.dummy.scale.set(0, 0, 0);
          this.dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
          continue;
        }

        // Move
        p.position.addScaledVector(p.velocity, delta);
        p.velocity.y -= 9.8 * delta * 0.2; // slight gravity
        p.rotation += p.rotSpeed * delta;

        // Scale fade
        const progress = p.life / p.maxLife;
        const currentScale = p.initialScale * progress;

        this.dummy.position.copy(p.position);
        this.dummy.quaternion.copy(camera.quaternion);
        this.dummy.scale.set(currentScale, currentScale, currentScale);
        this.dummy.updateMatrix();

        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        this.colorHelper.copy(p.color).multiplyScalar(progress * 1.5);
        this.instancedMesh.setColorAt(i, this.colorHelper);
      }
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    // Smoke instances: 400..599
    for (let i = 400; i < 600; i++) {
      const p = this.particles[i];
      const meshIdx = i - 400;
      if (p.active) {
        p.life -= delta;
        if (p.life <= 0) {
          p.active = false;
          this.dummy.position.set(0, -9999, 0);
          this.dummy.scale.set(0, 0, 0);
          this.dummy.updateMatrix();
          this.smokeMesh.setMatrixAt(meshIdx, this.dummy.matrix);
          continue;
        }

        p.position.addScaledVector(p.velocity, delta);
        p.position.y += 0.8 * delta; // smoke rises
        p.rotation += p.rotSpeed * delta;

        const progress = p.life / p.maxLife;
        const currentScale = p.initialScale * (1 + (1 - progress) * 1.5);

        this.dummy.position.copy(p.position);
        this.dummy.quaternion.copy(camera.quaternion);
        this.dummy.scale.set(currentScale, currentScale, currentScale);
        this.dummy.updateMatrix();

        this.smokeMesh.setMatrixAt(meshIdx, this.dummy.matrix);
      }
    }
    this.smokeMesh.instanceMatrix.needsUpdate = true;
  }
}
