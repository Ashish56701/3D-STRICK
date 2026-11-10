export type GameMode = 'training' | 'survival' | 'time_challenge' | 'endless';

export type CharacterSkin = 'commando' | 'vanguard' | 'phantom';

export type WeaponType = 'plasma_rifle' | 'scattergun' | 'rail_sniper';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  category: string;
  damage: number;
  fireRate: number; // shots per second
  capacity: number;
  reloadTime: number; // in seconds
  spread: number;
  range: number;
  projectileSpeed: number;
  projectileColor: string;
  glowColor: number;
  description: string;
}

export interface CharacterSkinConfig {
  id: CharacterSkin;
  name: string;
  title: string;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  armorBonus: number;
  speedBonus: number;
  description: string;
}

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  masterVolume: number; // 0 to 1
  sfxVolume: number;
  musicVolume: number;
  sensitivity: number; // 0.5 to 3.0
  isDaytime: boolean;
  invertY: boolean;
  showMinimap: boolean;
  cameraFov: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  isReloading: boolean;
  reloadProgress: number;
  score: number;
  kills: number;
  shotsFired: number;
  shotsHit: number;
  wave: number;
  timeSurvived: number;
  multiplier: number;
  comboTimer: number;
}

export interface HighScoreRecord {
  mode: GameMode;
  score: number;
  kills: number;
  timeSurvived: number;
  wave: number;
  date: string;
}

export type EnemyType = 'drone' | 'android' | 'goliath';

export interface EnemyData {
  id: number;
  type: EnemyType;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  scoreValue: number;
  state: 'spawning' | 'patrol' | 'chase' | 'attack' | 'dead';
  attackCooldown: number;
  attackInterval: number;
  position: { x: number; y: number; z: number };
}

export interface PowerupItem {
  id: number;
  type: 'health' | 'energy' | 'shield' | 'overdrive';
  position: { x: number; y: number; z: number };
  duration?: number;
}
