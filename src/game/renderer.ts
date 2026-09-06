import { CellType, HUD_HEIGHT, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, getLevelHueOffset, type Grid, type Point } from './constants';
import type { Bomb, Explosion, GameSprites, LevelTransition } from './types';

export function renderHud(
  ctx: CanvasRenderingContext2D,
  sprites: GameSprites,
  health: number,
  maxHealth: number,
  canvasWidth: number,
  level: number,
  enemyCount: number,
  exitRevealed: boolean,
  score: number = 0
): void {
  const heartSize = TILE_SIZE;
  const startX = Math.round((canvasWidth - maxHealth * heartSize) / 2);
  const startY = Math.round((HUD_HEIGHT - heartSize) / 2);

  ctx.save();
  ctx.textBaseline = 'middle';

  // Left: Level and Score
  ctx.textAlign = 'left';
  ctx.font = '700 16px "Pixelify Sans", cursive, monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(`NÍVEL ${level}`, 16, 16);

  ctx.font = '600 15px "Pixelify Sans", cursive, monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText(`PONTOS: ${score}`, 16, 34);

  // Right: Enemy Count and Status Objective
  ctx.textAlign = 'right';
  ctx.font = '700 16px "Pixelify Sans", cursive, monospace';
  ctx.fillStyle = enemyCount > 0 ? '#f87171' : '#4ade80';
  ctx.fillText(`INIMIGOS: ${enemyCount}`, canvasWidth - 16, 16);

  ctx.font = '600 15px "Pixelify Sans", cursive, monospace';
  ctx.fillStyle = enemyCount === 0 && exitRevealed ? '#86efac' : '#94a3b8';
  const status = !exitRevealed ? 'Ache a saída' :
    enemyCount > 0 ? 'Derrote os inimigos' : 'Entre na saída!';
  ctx.fillText(status, canvasWidth - 16, 34);

  ctx.restore();

  // Center: Health Hearts
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
  sprites: GameSprites,
  level: number = 1
): void {
  const hue = getLevelHueOffset(level);
  const prevFilter = ctx.filter;
  if (hue !== 0 && typeof ctx.filter === 'string') {
    ctx.filter = `hue-rotate(${hue}deg)`;
  }
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
  if (hue !== 0 && typeof ctx.filter === 'string') {
    ctx.filter = prevFilter || 'none';
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
    transition?: LevelTransition;
  },
  sprite: HTMLImageElement,
  time: number
): void {
  let renderX = player.x;
  let renderY = player.y;
  let scaleX = 1;
  let scaleY = 1;
  let rotation = 0;
  let alpha = 1.0;

  const transition = player.transition;

  if (transition && transition.phase === 'exiting') {
    const p = Math.min(1, Math.max(0, 1 - transition.timer / transition.duration));
    const targetX = transition.exitX ?? player.x;
    const targetY = transition.exitY ?? player.y;
    const holeX = targetX + TILE_SIZE / 2;
    const holeY = targetY + 28;

    const startCenterX = player.x + TILE_SIZE / 2;
    const startCenterY = player.y + TILE_SIZE / 2;

    let curCenterX: number;
    let curCenterY: number;
    let scale: number;
    let rotation: number;
    let alpha: number;

    if (p < 0.25) {
      // Step/hop directly into the center of the trapdoor opening
      const t = p / 0.25;
      const hop = Math.sin(t * Math.PI) * 6;
      curCenterX = startCenterX + (holeX - startCenterX) * t;
      curCenterY = startCenterY + (holeY - startCenterY) * t - hop;
      scale = 1.0 + Math.sin(t * Math.PI) * 0.1;
      rotation = player.facing * Math.sin(t * Math.PI) * 0.1;
      alpha = 1.0;
    } else {
      // Swirled directly into the vortex center
      const subP = (p - 0.25) / 0.75;
      curCenterX = holeX;
      curCenterY = holeY;
      scale = Math.max(0, 1 - subP);
      rotation = player.facing * subP * Math.PI * 3.5;
      alpha = Math.max(0, 1 - Math.pow(subP, 1.4));
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(curCenterX, curCenterY);
    ctx.scale(player.facing * scale, scale);
    ctx.rotate(rotation);
    ctx.drawImage(sprite, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
    ctx.restore();
    return;
  }
 else if (transition && transition.phase === 'entering') {
    const p = Math.min(1, Math.max(0, 1 - transition.timer / transition.duration));
    if (p < 0.35) {
      // Falling from the ceiling with gravity acceleration
      const fallT = p / 0.35;
      const easeFall = fallT * fallT;
      renderX = player.x;
      renderY = player.y - 70 * (1 - easeFall);
      scaleY = 1.25;
      scaleX = 0.8;
    } else if (p < 0.6) {
      // Squash bounce on landing impact
      const bounceT = (p - 0.35) / 0.25;
      const squash = Math.sin(bounceT * Math.PI) * 0.45;
      renderX = player.x;
      renderY = player.y;
      scaleY = 1.0 - squash;
      scaleX = 1.0 + squash * 0.65;
    } else if (p < 0.82) {
      // Elastic recoil recovery
      const recT = (p - 0.6) / 0.22;
      const rebound = Math.sin(recT * Math.PI) * 0.14;
      renderX = player.x;
      renderY = player.y;
      scaleY = 1.0 + rebound;
      scaleX = 1.0 - rebound * 0.4;
    } else {
      renderX = player.x;
      renderY = player.y;
      scaleX = 1;
      scaleY = 1;
    }
  } else if (player.animTimer > 0) {
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
    alpha *= 0.35;
  }

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(renderX + TILE_SIZE / 2, renderY + TILE_SIZE);
  ctx.scale(player.facing * scaleX, scaleY);
  ctx.rotate(player.facing * rotation);
  ctx.drawImage(sprite, -TILE_SIZE / 2, -TILE_SIZE, TILE_SIZE, TILE_SIZE);
  ctx.restore();
}

export function renderIrisWipe(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  level: number = 1
): void {
  const maxRadius = Math.hypot(width, height);
  if (radius >= maxRadius) return;

  ctx.save();
  ctx.fillStyle = '#08080a';
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  if (radius > 0) {
    ctx.arc(centerX, centerY, Math.max(0, radius), 0, Math.PI * 2, true);
  }
  ctx.fill();

  // Glowing ring around iris aperture matching the level hue
  if (radius > 4 && radius < maxRadius - 20) {
    const hue = getLevelHueOffset(level);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsl(${(50 + hue) % 360}, 96%, 54%)`;
    ctx.lineWidth = 3;
    ctx.shadowColor = `hsl(${(50 + hue) % 360}, 100%, 65%)`;
    ctx.shadowBlur = 10;
    ctx.stroke();
  }

  ctx.restore();
}

export function renderVortex(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  progress: number,
  time: number,
  level: number = 1
): void {
  ctx.save();
  ctx.translate(cx, cy);

  const hue = getLevelHueOffset(level);
  const spinAngle = time * 0.01;
  const numArms = 4;

  // 4 luminous yellow shades shifting with the current level hue
  const baseYellowHues = [48, 52, 45, 55];
  const baseLightnesses = [56, 66, 48, 72];
  const colors = baseYellowHues.map((h, i) => `hsl(${(h + hue) % 360}, 96%, ${baseLightnesses[i]}%)`);

  // Swirling glowing spiral arms converging to the center
  for (let i = 0; i < numArms; i++) {
    const baseAngle = (i / numArms) * Math.PI * 2 + spinAngle;
    ctx.strokeStyle = colors[i % colors.length];
    ctx.lineWidth = 2.5;
    ctx.shadowColor = colors[i % colors.length];
    ctx.shadowBlur = 6;
    ctx.beginPath();

    const maxR = 24 * Math.min(1, progress * 2.5);
    for (let r = maxR; r >= 2; r -= 1.5) {
      const angle = baseAngle + (maxR - r) * 0.24;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * (r * 0.75); // 0.75 perspective tilt matching 2.5D view
      if (r === maxR) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  // Dark central void singularity
  const voidRadius = Math.max(2, 6 * (1 - progress * 0.3));
  ctx.fillStyle = '#05070d';
  ctx.beginPath();
  ctx.ellipse(0, 0, voidRadius, voidRadius * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `hsl(${(50 + hue) % 360}, 96%, 60%)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}
