import * as THREE from 'three';

/**
 * Procedural canvas textures for 3D STRIKE: ULTIMATE SURVIVAL.
 * Zero external image dependencies to ensure instantaneous load and zero 404s.
 */

// Procedural sci-fi grid ground texture
export function createTerrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark gunmetal base with subtle noise
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1024, 1024);

  // Large tiles
  const tileSize = 128;
  ctx.lineWidth = 2;

  for (let x = 0; x < 1024; x += tileSize) {
    for (let y = 0; y < 1024; y += tileSize) {
      // Plate variation
      const shade = 18 + Math.floor(Math.sin(x * 12.3 + y * 45.7) * 6);
      ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 12})`;
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Plate bevel border
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Corner rivet dots
      ctx.fillStyle = '#334155';
      const r = 3;
      ctx.beginPath();
      ctx.arc(x + 8, y + 8, r, 0, Math.PI * 2);
      ctx.arc(x + tileSize - 8, y + 8, r, 0, Math.PI * 2);
      ctx.arc(x + 8, y + tileSize - 8, r, 0, Math.PI * 2);
      ctx.arc(x + tileSize - 8, y + tileSize - 8, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Futuristic neon cyber grid lines
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 1024, 1024);
  ctx.beginPath();
  for (let i = 0; i <= 1024; i += 256) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
  }
  ctx.stroke();

  // Central runway line
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
  ctx.setLineDash([20, 16]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.moveTo(0, 512);
  ctx.lineTo(1024, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 24);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural sci-fi wall / metal plate texture
export function createSciFiWallTexture(accentColor = '#06b6d4'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark alloy panel
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  // Metal panel division
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(16, 16, 480, 480);

  // Diagonal hazard stripes along the top
  ctx.fillStyle = '#334155';
  ctx.fillRect(20, 20, 472, 40);
  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.85;
  for (let x = -40; x < 520; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x + 16, 20);
    ctx.lineTo(x - 4, 60);
    ctx.lineTo(x - 20, 60);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Center tech emblem / circuits
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 60, 0, Math.PI * 2);
  ctx.stroke();

  // Circuit traces
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(256, 196);
  ctx.lineTo(256, 120);
  ctx.lineTo(340, 120);
  ctx.moveTo(256, 316);
  ctx.lineTo(256, 392);
  ctx.lineTo(172, 392);
  ctx.stroke();

  // Outer border
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 504);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural energy barrier hexagon texture
export function createHexShieldTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  const drawHex = (x: number, y: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + r * Math.cos(angle);
      const hy = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  };

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';

  const r = 32;
  const h = r * Math.sqrt(3);
  for (let y = -h; y < 256 + h; y += h) {
    for (let x = -r * 3; x < 256 + r * 3; x += r * 3) {
      drawHex(x, y, r);
      ctx.stroke();
      ctx.fill();

      drawHex(x + r * 1.5, y + h / 2, r);
      ctx.stroke();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

// Particle sprite texture (smooth radial glow)
export function createGlowParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(6, 182, 212, 0.9)');
  gradient.addColorStop(0.6, 'rgba(6, 182, 212, 0.25)');
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Smoke / blast particle texture
export function createSmokeParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 180, 50, 0.9)');
  gradient.addColorStop(0.3, 'rgba(239, 68, 68, 0.7)');
  gradient.addColorStop(0.7, 'rgba(40, 40, 40, 0.35)');
  gradient.addColorStop(1, 'rgba(20, 20, 20, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
