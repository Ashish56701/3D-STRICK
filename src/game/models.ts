import * as THREE from 'three';
import { CharacterSkin, WeaponType } from './types';
import { createSciFiWallTexture } from './textures';

export interface PlayerCharacterRigs {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  weaponHolder: THREE.Group;
  muzzlePoint: THREE.Object3D;
  thrusterLight: THREE.PointLight;
}

export function createPlayerCharacter(skin: CharacterSkin = 'commando'): PlayerCharacterRigs {
  const root = new THREE.Group();

  // Define skin palette
  let armorColor = 0x1e293b; // navy gunmetal
  let secondaryColor = 0x334155; // slate
  let glowColor = 0x06b6d4; // neon cyan
  let visorColor = 0x38bdf8; // light cyan
  let metalness = 0.85;
  let roughness = 0.25;

  if (skin === 'vanguard') {
    armorColor = 0x78350f; // bronze / desert alloy
    secondaryColor = 0xd97706; // amber gold
    glowColor = 0xf59e0b; // neon amber
    visorColor = 0xfbbf24;
    metalness = 0.9;
    roughness = 0.2;
  } else if (skin === 'phantom') {
    armorColor = 0x09090b; // obsidian black
    secondaryColor = 0x27272a; // dark zinc
    glowColor = 0xf43f5e; // crimson neon
    visorColor = 0xfb7185;
    metalness = 0.7;
    roughness = 0.35;
  }

  // Materials
  const armorMat = new THREE.MeshStandardMaterial({
    color: armorColor,
    metalness,
    roughness,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    metalness: 0.9,
    roughness: 0.15,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: glowColor,
  });

  const visorMat = new THREE.MeshBasicMaterial({
    color: visorColor,
  });

  // Torso group
  const torso = new THREE.Group();
  torso.position.y = 0.95;

  // Chest plate
  const chestGeo = new THREE.BoxGeometry(0.55, 0.6, 0.35);
  const chestMesh = new THREE.Mesh(chestGeo, armorMat);
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Glowing arc reactor core in chest
  const reactorGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
  reactorGeo.rotateX(Math.PI / 2);
  const reactorMesh = new THREE.Mesh(reactorGeo, glowMat);
  reactorMesh.position.set(0, 0.08, 0.18);
  torso.add(reactorMesh);

  // Collar armor
  const collarGeo = new THREE.BoxGeometry(0.35, 0.12, 0.25);
  const collar = new THREE.Mesh(collarGeo, secondaryMat);
  collar.position.y = 0.32;
  torso.add(collar);

  // Jetpack on back
  const jetpackGeo = new THREE.BoxGeometry(0.36, 0.45, 0.15);
  const jetpack = new THREE.Mesh(jetpackGeo, secondaryMat);
  jetpack.position.set(0, 0.05, -0.22);
  torso.add(jetpack);

  // Jetpack twin nozzles
  const nozzleGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.12, 12);
  const nozzle1 = new THREE.Mesh(nozzleGeo, armorMat);
  nozzle1.position.set(-0.1, -0.22, -0.22);
  const nozzle2 = nozzle1.clone();
  nozzle2.position.x = 0.1;
  torso.add(nozzle1);
  torso.add(nozzle2);

  // Thruster light
  const thrusterLight = new THREE.PointLight(glowColor, 0.8, 4);
  thrusterLight.position.set(0, -0.25, -0.25);
  torso.add(thrusterLight);

  // Head group
  const head = new THREE.Group();
  head.position.y = 0.42;
  const helmetGeo = new THREE.BoxGeometry(0.32, 0.34, 0.34);
  const helmet = new THREE.Mesh(helmetGeo, armorMat);
  helmet.castShadow = true;
  head.add(helmet);

  // Helmet crest
  const crestGeo = new THREE.BoxGeometry(0.08, 0.08, 0.32);
  const crest = new THREE.Mesh(crestGeo, secondaryMat);
  crest.position.y = 0.18;
  head.add(crest);

  // Glowing Visor
  const visorGeo = new THREE.BoxGeometry(0.26, 0.1, 0.05);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.02, 0.17);
  head.add(visor);
  torso.add(head);

  // Arms and Weapon Holder
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 0.22, 0);

  const lShoulderGeo = new THREE.BoxGeometry(0.18, 0.18, 0.2);
  const lShoulder = new THREE.Mesh(lShoulderGeo, secondaryMat);
  leftArm.add(lShoulder);

  const lForearmGeo = new THREE.BoxGeometry(0.12, 0.42, 0.12);
  lForearmGeo.translate(0, -0.2, 0);
  const lForearm = new THREE.Mesh(lForearmGeo, armorMat);
  lForearm.castShadow = true;
  leftArm.add(lForearm);
  torso.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 0.22, 0);

  const rShoulder = lShoulder.clone();
  rightArm.add(rShoulder);

  const rForearmGeo = new THREE.BoxGeometry(0.12, 0.42, 0.12);
  rForearmGeo.translate(0, -0.2, 0);
  const rForearm = new THREE.Mesh(rForearmGeo, armorMat);
  rForearm.castShadow = true;
  rightArm.add(rForearm);

  // Weapon holder attached to right arm
  const weaponHolder = new THREE.Group();
  weaponHolder.position.set(0, -0.38, 0.2);
  rightArm.add(weaponHolder);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.05, 0.7);
  weaponHolder.add(muzzlePoint);

  torso.add(rightArm);

  // Legs with pivots at hips
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.9, 0);

  const thighGeo = new THREE.BoxGeometry(0.16, 0.45, 0.18);
  thighGeo.translate(0, -0.22, 0);
  const lThigh = new THREE.Mesh(thighGeo, armorMat);
  lThigh.castShadow = true;
  leftLeg.add(lThigh);

  const shinGeo = new THREE.BoxGeometry(0.14, 0.48, 0.16);
  shinGeo.translate(0, -0.65, 0.02);
  const lShin = new THREE.Mesh(shinGeo, secondaryMat);
  lShin.castShadow = true;
  leftLeg.add(lShin);

  // Cyber boot
  const bootGeo = new THREE.BoxGeometry(0.16, 0.14, 0.24);
  bootGeo.translate(0, -0.85, 0.06);
  const lBoot = new THREE.Mesh(bootGeo, armorMat);
  lBoot.castShadow = true;
  leftLeg.add(lBoot);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.9, 0);

  const rThigh = lThigh.clone();
  const rShin = lShin.clone();
  const rBoot = lBoot.clone();
  rightLeg.add(rThigh);
  rightLeg.add(rShin);
  rightLeg.add(rBoot);

  root.add(torso);
  root.add(leftLeg);
  root.add(rightLeg);

  return {
    group: root,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head,
    torso,
    weaponHolder,
    muzzlePoint,
    thrusterLight,
  };
}

// 3 Selectable Energy Weapons
export function createWeaponModel(type: WeaponType): THREE.Group {
  const weapon = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.9,
    roughness: 0.2,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.8,
    roughness: 0.3,
  });

  if (type === 'plasma_rifle') {
    // Plasma Rifle (Cyan glow)
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    // Receiver
    const recGeo = new THREE.BoxGeometry(0.1, 0.14, 0.55);
    const rec = new THREE.Mesh(recGeo, bodyMat);
    weapon.add(rec);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.4, 12);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, trimMat);
    barrel.position.set(0, 0.02, 0.42);
    weapon.add(barrel);

    // Glowing plasma energy coils
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(0.045, 0.012, 8, 16);
      const ring = new THREE.Mesh(ringGeo, glowMat);
      ring.position.set(0, 0.02, 0.15 + i * 0.09);
      weapon.add(ring);
    }

    // Grip
    const gripGeo = new THREE.BoxGeometry(0.07, 0.18, 0.09);
    gripGeo.rotateX(-0.3);
    const grip = new THREE.Mesh(gripGeo, trimMat);
    grip.position.set(0, -0.12, -0.05);
    weapon.add(grip);
  } else if (type === 'scattergun') {
    // Vortex Scattergun (Heavy, amber/orange glow)
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    const recGeo = new THREE.BoxGeometry(0.14, 0.18, 0.5);
    const rec = new THREE.Mesh(recGeo, bodyMat);
    weapon.add(rec);

    // Triple barrel cluster
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const bGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.32, 12);
      bGeo.rotateX(Math.PI / 2);
      const b = new THREE.Mesh(bGeo, trimMat);
      b.position.set(Math.cos(angle) * 0.04, 0.02 + Math.sin(angle) * 0.04, 0.38);
      weapon.add(b);
    }

    // Side heat radiators
    const radGeo = new THREE.BoxGeometry(0.18, 0.06, 0.25);
    const rad = new THREE.Mesh(radGeo, glowMat);
    rad.position.set(0, 0.02, 0.05);
    weapon.add(rad);

    // Heavy stock
    const stockGeo = new THREE.BoxGeometry(0.1, 0.14, 0.25);
    const stock = new THREE.Mesh(stockGeo, trimMat);
    stock.position.set(0, -0.04, -0.32);
    weapon.add(stock);
  } else if (type === 'rail_sniper') {
    // Ion Rail-Sniper (Long, purple/violet glow)
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });

    const recGeo = new THREE.BoxGeometry(0.09, 0.12, 0.7);
    const rec = new THREE.Mesh(recGeo, bodyMat);
    weapon.add(rec);

    // Magnetic dual rails
    const rail1Geo = new THREE.BoxGeometry(0.02, 0.04, 0.65);
    const rail1 = new THREE.Mesh(rail1Geo, trimMat);
    rail1.position.set(-0.03, 0.02, 0.55);
    const rail2 = rail1.clone();
    rail2.position.x = 0.03;
    weapon.add(rail1);
    weapon.add(rail2);

    // Glowing core channel between rails
    const coreGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 12);
    coreGeo.rotateX(Math.PI / 2);
    const core = new THREE.Mesh(coreGeo, glowMat);
    core.position.set(0, 0.02, 0.55);
    weapon.add(core);

    // Sniper Optic Scope
    const scopeGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.28, 12);
    scopeGeo.rotateX(Math.PI / 2);
    const scope = new THREE.Mesh(scopeGeo, trimMat);
    scope.position.set(0, 0.1, 0.05);
    weapon.add(scope);

    const scopeLens = new THREE.Mesh(
      new THREE.CircleGeometry(0.028, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    scopeLens.position.set(0, 0.1, 0.19);
    weapon.add(scopeLens);
  }

  weapon.castShadow = true;
  return weapon;
}

// 3 Robot Enemy Types
export function createDroneModel(): { group: THREE.Group; rotors: THREE.Group[] } {
  const group = new THREE.Group();
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.9,
    roughness: 0.2,
  });
  const redEyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // Central chassis sphere / octagon
  const coreGeo = new THREE.SphereGeometry(0.45, 12, 10);
  const core = new THREE.Mesh(coreGeo, darkMetal);
  core.castShadow = true;
  group.add(core);

  // Red optic lens in center
  const eyeGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16);
  eyeGeo.rotateX(Math.PI / 2);
  const eye = new THREE.Mesh(eyeGeo, redEyeMat);
  eye.position.set(0, 0.05, 0.42);
  group.add(eye);

  // 4 Outrigger drone arms
  const rotors: THREE.Group[] = [];
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const armGroup = new THREE.Group();
    armGroup.position.set(Math.cos(angle) * 0.75, 0.1, Math.sin(angle) * 0.75);

    // Strut
    const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
    strutGeo.rotateZ(Math.PI / 2);
    strutGeo.rotateY(-angle);
    const strut = new THREE.Mesh(strutGeo, darkMetal);
    strut.position.set(Math.cos(angle) * 0.35, 0, Math.sin(angle) * 0.35);
    group.add(strut);

    // Thruster ring
    const ringGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 16);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, darkMetal);
    armGroup.add(ring);

    // Spinning rotor blades
    const rotorBlade = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(0.32, 0.015, 0.05);
    const b1 = new THREE.Mesh(bladeGeo, thrusterMat);
    const b2 = b1.clone();
    b2.rotation.y = Math.PI / 2;
    rotorBlade.add(b1);
    rotorBlade.add(b2);
    armGroup.add(rotorBlade);
    rotors.push(rotorBlade);

    group.add(armGroup);
  }

  // Underslung mini-blasters
  const gunGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
  gunGeo.rotateX(Math.PI / 2);
  const gunL = new THREE.Mesh(gunGeo, darkMetal);
  gunL.position.set(-0.2, -0.3, 0.2);
  const gunR = gunL.clone();
  gunR.position.x = 0.2;
  group.add(gunL);
  group.add(gunR);

  return { group, rotors };
}

export function createAndroidModel(): {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
} {
  const group = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.95,
    roughness: 0.15,
  });
  const darkPlate = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.8,
    roughness: 0.3,
  });
  const redScanMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  // Torso
  const torso = new THREE.Group();
  torso.position.y = 1.0;
  const torsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.32);
  const torsoMesh = new THREE.Mesh(torsoGeo, darkPlate);
  torsoMesh.castShadow = true;
  torso.add(torsoMesh);

  // Armored rib plates
  for (let i = 0; i < 3; i++) {
    const ribGeo = new THREE.BoxGeometry(0.54, 0.08, 0.35);
    const rib = new THREE.Mesh(ribGeo, steelMat);
    rib.position.y = -0.15 + i * 0.14;
    torso.add(rib);
  }

  // Head with horizontal eye slit
  const headGeo = new THREE.BoxGeometry(0.3, 0.28, 0.3);
  headGeo.translate(0, 0.48, 0);
  const head = new THREE.Mesh(headGeo, steelMat);
  const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.04), redScanMat);
  eyeSlit.position.set(0, 0.48, 0.16);
  torso.add(head);
  torso.add(eyeSlit);

  // Arms with blaster barrels
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.38, 0.22, 0);
  const armGeo = new THREE.BoxGeometry(0.14, 0.5, 0.14);
  armGeo.translate(0, -0.25, 0);
  const lArmMesh = new THREE.Mesh(armGeo, steelMat);
  lArmMesh.castShadow = true;
  leftArm.add(lArmMesh);
  const lGun = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 8), darkPlate);
  lGun.rotation.x = Math.PI / 2;
  lGun.position.set(0, -0.5, 0.15);
  leftArm.add(lGun);
  torso.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.38, 0.22, 0);
  const rArmMesh = lArmMesh.clone();
  rightArm.add(rArmMesh);
  const rGun = lGun.clone();
  rightArm.add(rGun);
  torso.add(rightArm);

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.18, 0.85, 0);
  const legGeo = new THREE.BoxGeometry(0.16, 0.85, 0.18);
  legGeo.translate(0, -0.42, 0);
  const lLegMesh = new THREE.Mesh(legGeo, darkPlate);
  lLegMesh.castShadow = true;
  leftLeg.add(lLegMesh);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18, 0.85, 0);
  const rLegMesh = lLegMesh.clone();
  rightLeg.add(rLegMesh);

  group.add(torso);
  group.add(leftLeg);
  group.add(rightLeg);

  return { group, leftLeg, rightLeg, leftArm, rightArm };
}

export function createGoliathModel(): {
  group: THREE.Group;
  turret: THREE.Group;
  cannons: THREE.Mesh[];
} {
  const group = new THREE.Group();
  const heavyMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    metalness: 0.9,
    roughness: 0.3,
  });
  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.6,
    roughness: 0.4,
  });
  const redCoreMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });

  // Main quadruped base platform
  const baseGeo = new THREE.BoxGeometry(2.4, 0.8, 2.4);
  baseGeo.translate(0, 1.4, 0);
  const baseMesh = new THREE.Mesh(baseGeo, heavyMat);
  baseMesh.castShadow = true;
  group.add(baseMesh);

  // 4 Massive angled crawler legs
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const leg = new THREE.Group();
    leg.position.set(Math.cos(angle) * 1.4, 1.2, Math.sin(angle) * 1.4);

    // Upper hip
    const hipGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const hip = new THREE.Mesh(hipGeo, hazardMat);
    leg.add(hip);

    // Upper limb
    const upperGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
    upperGeo.rotateZ(0.4);
    upperGeo.translate(0.3, -0.4, 0);
    const upper = new THREE.Mesh(upperGeo, heavyMat);
    upper.castShadow = true;
    leg.add(upper);

    // Stomp foot pad
    const footGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.25, 8);
    const foot = new THREE.Mesh(footGeo, heavyMat);
    foot.position.set(0.6, -1.1, 0);
    foot.castShadow = true;
    leg.add(foot);

    group.add(leg);
  }

  // Top rotating turret dome
  const turret = new THREE.Group();
  turret.position.y = 1.9;

  const domeGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.8, 10);
  const dome = new THREE.Mesh(domeGeo, heavyMat);
  dome.castShadow = true;
  turret.add(dome);

  // Glowing reactor vent in front
  const ventGeo = new THREE.BoxGeometry(0.8, 0.3, 0.2);
  const vent = new THREE.Mesh(ventGeo, redCoreMat);
  vent.position.set(0, 0.1, 1.1);
  turret.add(vent);

  // Twin massive heavy plasma cannons
  const cannons: THREE.Mesh[] = [];
  for (const side of [-0.9, 0.9]) {
    const cannonArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.5), hazardMat);
    cannonArm.position.set(side, 0.2, 0.2);
    turret.add(cannonArm);

    const barrelGeo = new THREE.CylinderGeometry(0.14, 0.18, 1.8, 12);
    barrelGeo.rotateX(Math.PI / 2);
    barrelGeo.translate(0, 0, 0.9);
    const barrel = new THREE.Mesh(barrelGeo, heavyMat);
    barrel.position.set(side, 0.2, 0.4);
    barrel.castShadow = true;
    turret.add(barrel);
    cannons.push(barrel);
  }

  group.add(turret);
  return { group, turret, cannons };
}

// Power-up collectibles (Floating & Spinning)
export function createPowerupMesh(type: 'health' | 'energy' | 'shield' | 'overdrive'): THREE.Group {
  const group = new THREE.Group();

  let color = 0x22c55e; // green health
  if (type === 'energy') color = 0x06b6d4; // cyan energy
  if (type === 'shield') color = 0x3b82f6; // blue shield
  if (type === 'overdrive') color = 0xf59e0b; // gold overdrive

  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.2,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
  });

  // Core icon geometry
  if (type === 'health') {
    // Cross
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.2), mat);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), mat);
    group.add(bar1);
    group.add(bar2);
  } else if (type === 'energy') {
    // Octahedron crystal
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), mat);
    group.add(crystal);
  } else if (type === 'shield') {
    // Shield sphere with rings
    const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), mat);
    group.add(sphere);
  } else {
    // Overdrive star
    const star = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), mat);
    group.add(star);
  }

  // Outer orbital ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 8, 24), glowMat);
  group.add(ring);

  // Soft point light
  const pLight = new THREE.PointLight(color, 1.2, 5);
  group.add(pLight);

  return group;
}

// Environmental props: Sci-Fi Command Outpost Bunker
export function createSciFiBunker(width = 12, height = 6, depth = 10): THREE.Group {
  const group = new THREE.Group();
  const wallTex = createSciFiWallTexture('#06b6d4');
  wallTex.repeat.set(2, 1);

  const bunkerMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.3,
    map: wallTex,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.9,
    roughness: 0.2,
  });

  const neonMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

  // Main block
  const mainGeo = new THREE.BoxGeometry(width, height, depth);
  mainGeo.translate(0, height / 2, 0);
  const mainMesh = new THREE.Mesh(mainGeo, bunkerMat);
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  group.add(mainMesh);

  // Slanted blast roof cap
  const roofGeo = new THREE.BoxGeometry(width * 0.9, 0.8, depth * 0.9);
  roofGeo.translate(0, height + 0.4, 0);
  const roof = new THREE.Mesh(roofGeo, trimMat);
  roof.castShadow = true;
  group.add(roof);

  // Rooftop communications dish & antenna
  const dishGeo = new THREE.ConeGeometry(1.2, 0.6, 12, 1, true);
  dishGeo.rotateX(0.8);
  const dish = new THREE.Mesh(dishGeo, trimMat);
  dish.position.set(width * 0.25, height + 1.2, -depth * 0.2);
  group.add(dish);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 3.5, 8),
    trimMat
  );
  mast.position.set(-width * 0.25, height + 1.8, depth * 0.2);
  group.add(mast);

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), neonMat);
  beacon.position.set(-width * 0.25, height + 3.6, depth * 0.2);
  group.add(beacon);

  // Recessed door frame
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 4.2, 0.4),
    trimMat
  );
  doorFrame.position.set(0, 2.1, depth / 2 + 0.1);
  group.add(doorFrame);

  const doorNeon = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.15, 0.5),
    neonMat
  );
  doorNeon.position.set(0, 4.0, depth / 2 + 0.15);
  group.add(doorNeon);

  return group;
}

// Sci-Fi Defense Tower / Energy Pylon
export function createEnergyPylon(height = 14): THREE.Group {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.2,
  });
  const cyanGlow = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

  // Concrete pedestal
  const baseGeo = new THREE.CylinderGeometry(2.2, 3.0, 1.8, 8);
  baseGeo.translate(0, 0.9, 0);
  const base = new THREE.Mesh(baseGeo, metalMat);
  base.castShadow = true;
  group.add(base);

  // Vertical central core
  const coreGeo = new THREE.CylinderGeometry(0.6, 0.8, height - 2, 8);
  coreGeo.translate(0, height / 2, 0);
  const core = new THREE.Mesh(coreGeo, metalMat);
  core.castShadow = true;
  group.add(core);

  // 3 Glowing energy accelerator rings
  for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.TorusGeometry(1.5, 0.15, 8, 16);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, cyanGlow);
    ring.position.y = 4 + i * 3.5;
    group.add(ring);
  }

  // Top plasma emitter sphere
  const topGeo = new THREE.SphereGeometry(1.2, 16, 16);
  const top = new THREE.Mesh(topGeo, cyanGlow);
  top.position.y = height + 0.6;
  group.add(top);

  const pLight = new THREE.PointLight(0x06b6d4, 1.5, 18);
  pLight.position.y = height + 0.6;
  group.add(pLight);

  return group;
}

// Sci-Fi Barricade for tactical player/enemy cover
export function createBarricade(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.3,
  });
  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.5,
    roughness: 0.4,
  });

  const bodyGeo = new THREE.BoxGeometry(3.5, 1.4, 0.6);
  bodyGeo.translate(0, 0.7, 0);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const stripeGeo = new THREE.BoxGeometry(3.55, 0.2, 0.65);
  stripeGeo.translate(0, 1.1, 0);
  const stripe = new THREE.Mesh(stripeGeo, hazardMat);
  group.add(stripe);

  return group;
}

// Bioluminescent Cyber Crystal Spire / Tree
export function createCyberFlora(height = 5): THREE.Group {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.3,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.8,
    metalness: 0.6,
    roughness: 0.15,
  });

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, height * 0.6, 6);
  trunkGeo.translate(0, (height * 0.6) / 2, 0);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.castShadow = true;
  group.add(trunk);

  // Multi-faceted crystal clusters
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const crystalGeo = new THREE.ConeGeometry(0.35, 1.8, 5);
    crystalGeo.rotateZ(0.35);
    crystalGeo.rotateY(angle);
    crystalGeo.translate(
      Math.cos(angle) * 0.4,
      height * 0.6 + i * 0.3,
      Math.sin(angle) * 0.4
    );
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.castShadow = true;
    group.add(crystal);
  }

  // Top crown crystal
  const crownGeo = new THREE.OctahedronGeometry(0.65, 0);
  const crown = new THREE.Mesh(crownGeo, crystalMat);
  crown.position.y = height + 0.4;
  group.add(crown);

  return group;
}
