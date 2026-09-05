import { TILE_SIZE } from './constants';
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
      size: Math.random() < 0.5 ? 2 : 1.5,
      color: randomColor(DUST_COLORS),
      life: 0.2,
      maxLife: 0.2,
    });
  }
}

export function spawnExplosionDebris(particles: Particle[], tileX: number, tileY: number): void {
  const cx = tileX * TILE_SIZE + TILE_SIZE / 2;
  const cy = tileY * TILE_SIZE + TILE_SIZE / 2;
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 50 + 20;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2,
      color: Math.random() < 0.5 ? '#fde047' : '#f97316',
      life: 0.2,
      maxLife: 0.2,
    });
  }
}

export function spawnWickSpark(particles: Particle[], x: number, y: number): void {
  particles.push({
    x: x + (Math.random() - 0.5) * 2,
    y: y + (Math.random() - 0.5) * 2,
    vx: (Math.random() - 0.5) * 20,
    vy: -Math.random() * 25 - 12,
    size: Math.random() < 0.4 ? 2 : 1.5,
    color: Math.random() < 0.6 ? '#fde047' : '#f97316',
    life: 0.16,
    maxLife: 0.16,
  });
}

export function updateParticles(particles: Particle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
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
    ctx.fillRect(p.x, p.y, p.size, p.size);
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
