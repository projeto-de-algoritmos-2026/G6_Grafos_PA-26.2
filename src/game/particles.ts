import { TILE_SIZE, getLevelHueOffset } from './constants';
import type { Particle, ScorchMark } from './types';

const DUST_COLORS = ['#e2c078', '#dcb672', '#ecd69d', '#d2b474'];

function randomColor(colors: string[]): string {
  return colors[Math.floor(Math.random() * colors.length)];
}

export function spawnDust(
  particles: Particle[],
  x: number,
  y: number,
  dx = 0,
  dy = 0,
  count = 4,
  speed = 20
): void {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 6,
      vx: -dx * speed + (Math.random() - 0.5) * 15,
      vy: (dy === 0 ? -Math.random() * 12 - 4 : -dy * speed) + (Math.random() - 0.5) * 10,
      size: 3,
      color: randomColor(DUST_COLORS),
      life: 0.2,
      maxLife: 0.2,
    });
  }
}

export function spawnExplosionDebris(particles: Particle[], tileX: number, tileY: number): void {
  const cx = tileX * TILE_SIZE + TILE_SIZE / 2;
  const cy = tileY * TILE_SIZE + TILE_SIZE / 2;
  for (let i = 0; i < 4; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 60 + 20;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() < 0.5 ? 6 : 3,
      color: Math.random() < 0.5 ? '#fde047' : '#f97316',
      life: 0.22,
      maxLife: 0.22,
    });
  }
}

export function spawnWickSpark(particles: Particle[], x: number, y: number): void {
  particles.push({
    x: x + (Math.random() - 0.5) * 2,
    y: y + (Math.random() - 0.5) * 2,
    vx: (Math.random() - 0.5) * 20,
    vy: -Math.random() * 25 - 12,
    size: 3,
    color: Math.random() < 0.6 ? '#fde047' : '#f97316',
    life: 0.16,
    maxLife: 0.16,
  });
}

export function spawnPortalParticles(particles: Particle[], cx: number, cy: number, level = 1): void {
  const hue = getLevelHueOffset(level);
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 20 + 8;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * (dist * 0.75);

    const inwardSpeed = 40;
    const orbitSpeed = 60;
    const vx = -Math.cos(angle) * inwardSpeed - Math.sin(angle) * orbitSpeed;
    const vy = (-Math.sin(angle) * inwardSpeed + Math.cos(angle) * orbitSpeed) * 0.75;

    const isWhiteHighlight = Math.random() < 0.2;
    const yellowHues = [48, 52, 45, 55];
    const pickedHue = yellowHues[Math.floor(Math.random() * yellowHues.length)];
    const color = isWhiteHighlight
      ? '#ffffff'
      : `hsl(${(pickedHue + hue) % 360}, 96%, ${Math.random() * 20 + 55}%)`;

    particles.push({
      x: px,
      y: py,
      vx,
      vy,
      size: Math.random() < 0.5 ? 3 : 6,
      color,
      life: 0.32,
      maxLife: 0.32,
      drag: 0.5,
    });
  }
}

export function spawnLandingImpact(particles: Particle[], cx: number, cy: number): void {
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: cx - 4 + (Math.random() - 0.5) * 6,
      y: cy + (Math.random() - 0.5) * 4,
      vx: -Math.random() * 55 - 25,
      vy: -Math.random() * 20 - 5,
      size: Math.random() < 0.4 ? 6 : 3,
      color: randomColor(DUST_COLORS),
      life: 0.25,
      maxLife: 0.25,
      drag: 1.5,
    });
  }
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: cx + 4 + (Math.random() - 0.5) * 6,
      y: cy + (Math.random() - 0.5) * 4,
      vx: Math.random() * 55 + 25,
      vy: -Math.random() * 20 - 5,
      size: Math.random() < 0.4 ? 6 : 3,
      color: randomColor(DUST_COLORS),
      life: 0.25,
      maxLife: 0.25,
      drag: 1.5,
    });
  }
  for (let i = 0; i < 4; i++) {
    particles.push({
      x: cx + (Math.random() - 0.5) * 8,
      y: cy - 4,
      vx: (Math.random() - 0.5) * 35,
      vy: -Math.random() * 45 - 20,
      size: 3,
      color: '#facc15',
      life: 0.22,
      maxLife: 0.22,
      drag: 1.2,
    });
  }
}

const ENEMY_PARTICLE_COLORS: Record<number, string[]> = {
  0: ['#4ade80', '#22c55e', '#16a34a', '#86efac', '#a3e635', '#bef264', '#d9f99d', '#ffffff'],
  1: ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#e11d48', '#be123c', '#ffe4e6', '#ffffff'],
  2: ['#38bdf8', '#06b6d4', '#67e8f9', '#0ea5e9', '#a5f3fc', '#0284c7', '#e0f2fe', '#ffffff'],
};

const DEFAULT_ENEMY_COLORS = ['#c084fc', '#a855f7', '#e879f9', '#f0abfc', '#ffffff'];

export function spawnEnemyDeathParticles(
  particles: Particle[],
  cx: number,
  cy: number,
  spriteIndex: number
): void {
  const colors = ENEMY_PARTICLE_COLORS[spriteIndex] ?? DEFAULT_ENEMY_COLORS;
  const count = 54;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const speed = Math.random() * 140 + 35;
    const rand = Math.random();
    const size = rand < 0.15 ? 12 : rand < 0.45 ? 9 : rand < 0.75 ? 6 : 3;
    const life = Math.random() * 0.4 + 0.35;

    particles.push({
      x: cx + (Math.random() - 0.5) * 12,
      y: cy + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (Math.random() * 65 + 25),
      size,
      color: randomColor(colors),
      life,
      maxLife: life,
      gravity: 300,
      drag: 1.3,
    });
  }

  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 180 + 70;
    const life = Math.random() * 0.2 + 0.15;
    particles.push({
      x: cx + (Math.random() - 0.5) * 6,
      y: cy + (Math.random() - 0.5) * 6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      size: 3,
      color: Math.random() < 0.6 ? '#ffffff' : colors[0],
      life,
      maxLife: life,
      gravity: 160,
      drag: 1.8,
    });
  }
}

export function updateParticles(particles: Particle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.gravity) {
      p.vy = (p.vy ?? 0) + p.gravity * dt;
    }
    if (p.drag) {
      const factor = Math.max(0, 1 - p.drag * dt);
      if (p.vx !== undefined) p.vx *= factor;
      if (p.vy !== undefined) p.vy *= factor;
    }
    if (p.vx !== undefined) p.x += p.vx * dt;
    if (p.vy !== undefined) p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

export function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    const px = Math.round(p.x / 3) * 3;
    const py = Math.round(p.y / 3) * 3;
    ctx.fillRect(px, py, p.size, p.size);
  }
  ctx.globalAlpha = 1.0;
}

export function updateScorchMarks(marks: ScorchMark[], dt: number): void {
  for (let i = marks.length - 1; i >= 0; i--) {
    marks[i].life -= dt;
    if (marks[i].life <= 0) {
      marks.splice(i, 1);
    }
  }
}

export function renderScorchMarks(ctx: CanvasRenderingContext2D, marks: ScorchMark[]): void {
  for (const s of marks) {
    const alpha = Math.min(s.life / 1.5, 0.22);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(s.x * TILE_SIZE + 6, s.y * TILE_SIZE + 6, TILE_SIZE - 12, TILE_SIZE - 12);
  }
}
