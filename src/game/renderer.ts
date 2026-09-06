import { CellType, HUD_HEIGHT, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, type Grid, type Point } from './constants';
import type { Bomb, Explosion, GameSprites } from './types';

export function renderHud(
  ctx: CanvasRenderingContext2D,
  sprites: GameSprites,
  health: number,
  maxHealth: number,
  canvasWidth: number,
  level: number,
  enemyCount: number,
  exitRevealed: boolean
): void {
  const heartSize = TILE_SIZE;
  const startX = (canvasWidth - maxHealth * heartSize) / 2;
  const startY = (HUD_HEIGHT - heartSize) / 2;

  ctx.save();
  ctx.font = 'bold 16px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(`NÍVEL ${level}`, 16, 16);
  ctx.font = '12px monospace';
  ctx.fillText(`Inimigos: ${enemyCount}`, 16, 35);
  ctx.textAlign = 'right';
  ctx.fillStyle = enemyCount === 0 && exitRevealed ? '#86efac' : '#e2e8f0';
  const status = !exitRevealed ? 'Encontre a saída oculta' :
    enemyCount > 0 ? 'Elimine os inimigos' : 'Entre na saída!';
  ctx.fillText(status, canvasWidth - 16, HUD_HEIGHT / 2);
  ctx.restore();

  for (let i = 0; i < maxHealth; i++) {
    const img = i < health ? sprites.healthFull : sprites.healthEmpty;
    ctx.drawImage(img, startX + i * heartSize, startY, heartSize, heartSize);
  }
}

export function renderExit(
  ctx: CanvasRenderingContext2D,
  exit: Point,
  sprite: HTMLImageElement
): void {
  ctx.save();
  ctx.translate(exit.x * TILE_SIZE, exit.y * TILE_SIZE);
  ctx.drawImage(sprite, 0, 0, TILE_SIZE, TILE_SIZE);
  ctx.restore();
}

export function renderMap(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  sprites: GameSprites
): void {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      ctx.drawImage(sprites.grass, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      const cell = grid[y][x];
      if (cell === CellType.WALL) {
        ctx.drawImage(sprites.wall, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (cell === CellType.BLOCK) {
        ctx.drawImage(sprites.brick, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

export function renderExplosions(
  ctx: CanvasRenderingContext2D,
  explosions: Explosion[],
  sprites: GameSprites
): void {
  for (const exp of explosions) {
    const frameIdx = Math.min(4, Math.floor((1 - exp.timer / 0.45) * 5));
    const img = sprites.explosions[frameIdx];
    if (!img) continue;
    for (const p of exp.tiles) {
      ctx.drawImage(img, p.x * TILE_SIZE, p.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

function drawWickFlame(ctx: CanvasRenderingContext2D, time: number, isPanic: boolean): void {
  const flicker = Math.floor(time / 60) % 4;
  const fx = -22.5;
  const fy = -15.5;
  const flameH = (isPanic ? 5 : 4) + (flicker % 2);
  const flameW = isPanic ? 4 : 3;
  const swayX = flicker === 1 ? -0.5 : (flicker === 2 ? 0.5 : 0);

  ctx.fillStyle = flicker === 0 ? '#ef4444' : '#f97316';
  ctx.fillRect(fx - flameW / 2 + swayX, fy - flameH, flameW, flameH);

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(fx - (flameW - 1) / 2 + swayX, fy - flameH + 1, Math.max(1, flameW - 1), flameH - 2);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(fx - 0.5 + swayX, fy - flameH / 2, 1, 1.5);
}

export function renderBombs(
  ctx: CanvasRenderingContext2D,
  bombs: Bomb[],
  sprites: GameSprites,
  time: number
): void {
  for (const bomb of bombs) {
    const urgency = 1 - Math.max(0, bomb.timer / 3.0);
    const interval = 0.8 - urgency * 0.5;
    const cycleTime = (3.0 - bomb.timer) % interval;
    const isHeartbeat = cycleTime < 0.08;
    const pulseScale = isHeartbeat ? 1 + Math.sin((cycleTime / 0.08) * Math.PI) * 0.04 : 1.0;
    const swell = bomb.timer < 0.5 ? ((0.5 - bomb.timer) / 0.5) * 0.12 : 0;
    const scale = Math.max(pulseScale, 1.0 + swell);

    const isPanicBlink = bomb.timer < 0.6 && Math.floor(bomb.timer * 10) % 2 === 0;
    const img = isHeartbeat || isPanicBlink ? sprites.bombExploding : sprites.bomb;

    const jiggleX = bomb.timer < 0.35 ? (Math.random() - 0.5) * 1.5 : 0;
    const jiggleY = bomb.timer < 0.35 ? (Math.random() - 0.5) * 1.5 : 0;

    const curX = bomb.slideTimer && bomb.slideTimer > 0 ? (bomb.renderX ?? bomb.x) : bomb.x;
    const curY = bomb.slideTimer && bomb.slideTimer > 0 ? (bomb.renderY ?? bomb.y) : bomb.y;

    let resistOffsetX = 0;
    let resistOffsetY = 0;
    let resistScaleX = 1.0;
    let resistScaleY = 1.0;
    if (bomb.resistTimer && bomb.resistTimer > 0) {
      const t = bomb.resistTimer / 0.12;
      const nudge = Math.sin(t * Math.PI) * 3.5;
      resistOffsetX = (bomb.resistDx ?? 0) * nudge;
      resistOffsetY = (bomb.resistDy ?? 0) * nudge;
      const squash = Math.sin(t * Math.PI) * 0.16;
      if (bomb.resistDx) {
        resistScaleX = 1 - squash;
        resistScaleY = 1 + squash * 0.5;
      } else if (bomb.resistDy) {
        resistScaleY = 1 - squash;
        resistScaleX = 1 + squash * 0.5;
      }
    }

    let slideScaleX = 1.0;
    let slideScaleY = 1.0;
    let slideTilt = 0;
    if (bomb.slideTimer && bomb.slideTimer > 0 && bomb.slideDuration) {
      const t = 1 - bomb.slideTimer / bomb.slideDuration;
      if (t < 0.4) {
        const squash = Math.sin((t / 0.4) * Math.PI) * 0.22;
        if (bomb.slideDx) {
          slideScaleX = 1 - squash;
          slideScaleY = 1 + squash * 0.5;
        } else if (bomb.slideDy) {
          slideScaleY = 1 - squash;
          slideScaleX = 1 + squash * 0.5;
        }
      } else if (t < 0.8) {
        const stretch = Math.sin(((t - 0.4) / 0.4) * Math.PI) * 0.14;
        if (bomb.slideDx) {
          slideScaleX = 1 + stretch;
          slideScaleY = 1 - stretch * 0.4;
        } else if (bomb.slideDy) {
          slideScaleY = 1 + stretch;
          slideScaleX = 1 - stretch * 0.4;
        }
      } else {
        const wobble = Math.sin(((t - 0.8) / 0.2) * Math.PI) * 0.1;
        slideScaleX = 1 - wobble;
        slideScaleY = 1 + wobble;
      }

      if (bomb.slideDx) {
        slideTilt = bomb.slideDx * 0.14 * Math.sin(t * Math.PI);
      }
    }

    ctx.save();
    ctx.translate(
      curX + TILE_SIZE / 2 + jiggleX + resistOffsetX,
      curY + TILE_SIZE / 2 + jiggleY + resistOffsetY
    );
    if (slideTilt !== 0) ctx.rotate(slideTilt);
    ctx.scale(scale * resistScaleX * slideScaleX, scale * resistScaleY * slideScaleY);
    ctx.drawImage(img, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
    drawWickFlame(ctx, time, bomb.timer < 0.6);
    ctx.restore();
  }
}

export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: {
    x: number;
    y: number;
    startX: number;
    startY: number;
    animTimer: number;
    lastDx: number;
    facing: number;
    invulnerableTimer: number;
  },
  sprite: HTMLImageElement,
  time: number
): void {
  let renderX = player.x;
  let renderY = player.y;
  let scaleX = 1;
  let scaleY = 1;
  let rotation = 0;

  if (player.animTimer > 0) {
    const total = 0.14;
    const hopDuration = 0.085;
    const t = 1 - player.animTimer / total;

    if (t < hopDuration / total) {
      const hopP = t / (hopDuration / total);
      renderX = player.startX + (player.x - player.startX) * hopP;
      renderY = player.startY + (player.y - player.startY) * hopP - Math.sin(hopP * Math.PI) * 10;
      const stretch = Math.sin(hopP * Math.PI) * 0.25;
      scaleY = 1 + stretch;
      scaleX = 1 - stretch * 0.4;
      rotation = player.lastDx * 0.15 * Math.sin(hopP * Math.PI);
    } else {
      const landP = (t - hopDuration / total) / (1 - hopDuration / total);
      const squash = Math.sin(landP * Math.PI) * 0.35;
      scaleY = 1 - squash;
      scaleX = 1 + squash * 0.5;
    }
  } else {
    const breath = Math.sin(time / 350) * 0.03;
    scaleY = 1 + breath;
    scaleX = 1 - breath * 0.4;
  }

  if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 10) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  ctx.save();
  ctx.translate(renderX + TILE_SIZE / 2, renderY + TILE_SIZE);
  ctx.scale(player.facing * scaleX, scaleY);
  ctx.rotate(player.facing * rotation);
  ctx.drawImage(sprite, -TILE_SIZE / 2, -TILE_SIZE, TILE_SIZE, TILE_SIZE);
  ctx.restore();

  ctx.globalAlpha = 1.0;
}
