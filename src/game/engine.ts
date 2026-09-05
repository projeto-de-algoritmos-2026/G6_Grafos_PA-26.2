import { CellType, HUD_HEIGHT, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, type Grid, type Point } from './constants';
import { generateMap } from './map';
import { isInExplosion, spawnEnemies, updateEnemies } from './enemies';
import { loadGameSprites } from './assets';
import {
  renderBombs,
  renderExplosions,
  renderHud,
  renderMap,
  renderPlayer,
} from './renderer';
import {
  renderParticles,
  renderScorchMarks,
  spawnDust,
  spawnExplosionDebris,
  spawnWickSpark,
  updateParticles,
  updateScorchMarks,
} from './particles';
import type { Bomb, Enemy, Explosion, GameSprites, Particle, ScorchMark } from './types';

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private grid: Grid;
  private sprites: GameSprites;

  // Player state
  x = TILE_SIZE;
  y = TILE_SIZE;
  startX = TILE_SIZE;
  startY = TILE_SIZE;
  animTimer = 0;
  lastDx = 0;
  lastDy = 0;
  facing = 1;
  health = 3;
  maxHealth = 3;
  invulnerableTimer = 0;

  // Entities and visual effects
  private bombs: Bomb[] = [];
  private enemies: Enemy[] = [];
  private explosions: Explosion[] = [];
  private particles: Particle[] = [];
  private scorchMarks: ScorchMark[] = [];
  private shakeTrauma = 0;

  private rafId = 0;
  private lastTime = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = MAP_WIDTH * TILE_SIZE;
    this.canvas.height = MAP_HEIGHT * TILE_SIZE + HUD_HEIGHT;
    this.ctx.imageSmoothingEnabled = false;

    this.sprites = loadGameSprites();
    this.grid = generateMap();
    this.enemies = spawnEnemies(this.grid);
  }

  start(): void {
    window.addEventListener('keydown', this.onKeyDown);
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    let dx = 0;
    let dy = 0;

    if (e.code === 'KeyW' || e.code === 'ArrowUp') dy = -1;
    else if (e.code === 'KeyS' || e.code === 'ArrowDown') dy = 1;
    else if (e.code === 'KeyA' || e.code === 'ArrowLeft') dx = -1;
    else if (e.code === 'KeyD' || e.code === 'ArrowRight') dx = 1;
    else if (e.code === 'Space') {
      e.preventDefault();
      this.spawnBomb();
      return;
    }

    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      this.move(dx, dy);
    }
  };

  private move(dx: number, dy: number): void {
    const nextX = this.x + dx * TILE_SIZE;
    const nextY = this.y + dy * TILE_SIZE;
    const tileX = nextX / TILE_SIZE;
    const tileY = nextY / TILE_SIZE;

    if (this.grid[tileY]?.[tileX] !== CellType.EMPTY) return;

    const bomb = this.bombs.find((b) => b.x === nextX && b.y === nextY);
    if (bomb) {
      const pushX = nextX + dx * TILE_SIZE;
      const pushY = nextY + dy * TILE_SIZE;
      const pushTileX = pushX / TILE_SIZE;
      const pushTileY = pushY / TILE_SIZE;

      const isBlocked =
        this.grid[pushTileY]?.[pushTileX] !== CellType.EMPTY ||
        this.bombs.some((b) => b !== bomb && b.x === pushX && b.y === pushY) ||
        this.enemies.some((enemy) => enemy.x === pushX && enemy.y === pushY);

      if (isBlocked) {
        bomb.resistTimer = 0.12;
        bomb.resistDx = dx;
        bomb.resistDy = dy;
        return;
      }

      const fromX = bomb.slideTimer && bomb.slideTimer > 0 ? (bomb.renderX ?? nextX) : nextX;
      const fromY = bomb.slideTimer && bomb.slideTimer > 0 ? (bomb.renderY ?? nextY) : nextY;

      bomb.startX = fromX;
      bomb.startY = fromY;
      bomb.x = pushX;
      bomb.y = pushY;
      bomb.slideDuration = 0.18;
      bomb.slideTimer = 0.18;
      bomb.slideDx = dx;
      bomb.slideDy = dy;
      bomb.renderX = fromX;
      bomb.renderY = fromY;

      spawnDust(this.particles, fromX + TILE_SIZE / 2, fromY + TILE_SIZE / 2, dx, dy, 5, 25);
    }

    const prevX = this.x;
    const prevY = this.y;
    this.startX = prevX;
    this.startY = prevY;
    this.x = nextX;
    this.y = nextY;
    this.animTimer = 0.14;
    this.lastDx = dx;
    this.lastDy = dy;
    if (dx !== 0) this.facing = dx;

    spawnDust(this.particles, prevX + TILE_SIZE / 2, prevY + TILE_SIZE - 4, dx, dy, 4, 20);
    this.checkEnemyContact();
  }

  private spawnBomb(): void {
    if (this.bombs.some((b) => b.x === this.x && b.y === this.y)) return;
    this.bombs.push({ x: this.x, y: this.y, timer: 3.0 });
  }

  private explodeBomb(bomb: Bomb): void {
    const tx = Math.round(bomb.x / TILE_SIZE);
    const ty = Math.round(bomb.y / TILE_SIZE);
    const tiles: Point[] = [{ x: tx, y: ty }];

    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    for (const d of dirs) {
      const nx = tx + d.x;
      const ny = ty + d.y;
      const cell = this.grid[ny]?.[nx];

      if (cell === CellType.WALL) continue;

      if (cell === CellType.BLOCK) {
        this.grid[ny][nx] = CellType.EMPTY;
        tiles.push({ x: nx, y: ny });
      } else if (cell === CellType.EMPTY) {
        tiles.push({ x: nx, y: ny });
      }

      for (const b of this.bombs) {
        if (b.x === nx * TILE_SIZE && b.y === ny * TILE_SIZE && b.timer > 0.05) {
          b.timer = 0.05;
        }
      }
    }

    this.explosions.push({ tiles, timer: 0.45 });
    this.shakeTrauma = 0.5;

    for (const p of tiles) {
      this.scorchMarks.push({ x: p.x, y: p.y, life: 1.5 });
      spawnExplosionDebris(this.particles, p.x, p.y);
    }
  }

  private takeDamage(): void {
    if (this.invulnerableTimer > 0) return;
    this.health--;
    if (this.health <= 0) {
      this.restart();
    } else {
      this.invulnerableTimer = 1.0;
    }
  }

  private restart(): void {
    this.health = this.maxHealth;
    this.x = TILE_SIZE;
    this.y = TILE_SIZE;
    this.startX = TILE_SIZE;
    this.startY = TILE_SIZE;
    this.animTimer = 0;
    this.invulnerableTimer = 0;
    this.shakeTrauma = 0;
    this.bombs = [];
    this.explosions = [];
    this.particles = [];
    this.scorchMarks = [];
    this.grid = generateMap();
    this.enemies = spawnEnemies(this.grid);
  }

  private checkEnemyContact(): void {
    if (this.enemies.some((enemy) => enemy.x === this.x && enemy.y === this.y)) this.takeDamage();
  }

  private removeExplodedEnemies(): void {
    this.enemies = this.enemies.filter((enemy) => {
      if (!isInExplosion(enemy, this.explosions)) return true;
      spawnExplosionDebris(this.particles, enemy.x / TILE_SIZE, enemy.y / TILE_SIZE);
      return false;
    });
  }

  private tick = (now: number) => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(this.tick);
  };

  private update(dt: number): void {
    if (this.animTimer > 0) {
      this.animTimer = Math.max(0, this.animTimer - dt);
    }

    if (this.shakeTrauma > 0) {
      this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 4.0);
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    updateScorchMarks(this.scorchMarks, dt);
    updateParticles(this.particles, dt);

    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.timer -= dt;

      if (bomb.slideTimer && bomb.slideTimer > 0 && bomb.slideDuration) {
        bomb.slideTimer -= dt;
        const progress = Math.min(1, 1 - bomb.slideTimer / bomb.slideDuration);
        const ease = 1 - Math.pow(1 - progress, 3);
        bomb.renderX = bomb.startX! + (bomb.x - bomb.startX!) * ease;
        bomb.renderY = bomb.startY! + (bomb.y - bomb.startY!) * ease;

        if (Math.random() < 0.35) {
          spawnDust(this.particles, bomb.renderX + TILE_SIZE / 2, bomb.renderY + TILE_SIZE / 2, bomb.slideDx ?? 0, bomb.slideDy ?? 0, 1, 10);
        }

        if (bomb.slideTimer <= 0) {
          bomb.slideTimer = 0;
          bomb.renderX = bomb.x;
          bomb.renderY = bomb.y;
          spawnDust(this.particles, bomb.x + TILE_SIZE / 2, bomb.y + TILE_SIZE / 2, 0, 0, 2, 10);
        }
      }

      if (bomb.resistTimer && bomb.resistTimer > 0) {
        bomb.resistTimer -= dt;
        if (bomb.resistTimer <= 0) {
          bomb.resistTimer = 0;
          bomb.resistDx = 0;
          bomb.resistDy = 0;
        }
      }

      const urgency = 1 - Math.max(0, bomb.timer / 3.0);
      if (Math.random() < 0.25 + urgency * 0.45) {
        const curX = bomb.slideTimer && bomb.slideTimer > 0 ? (bomb.renderX ?? bomb.x) : bomb.x;
        const curY = bomb.slideTimer && bomb.slideTimer > 0 ? (bomb.renderY ?? bomb.y) : bomb.y;
        spawnWickSpark(this.particles, curX + TILE_SIZE / 2 - 22.5, curY + TILE_SIZE / 2 - 15.5);
      }

      if (bomb.timer <= 0) {
        this.explodeBomb(bomb);
        this.bombs.splice(i, 1);
      }
    }

    this.removeExplodedEnemies();
    this.checkEnemyContact();
    updateEnemies(this.enemies, this.grid, this, this.bombs, dt);
    this.removeExplodedEnemies();
    this.checkEnemyContact();

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.timer -= dt;
      if (exp.timer <= 0) {
        this.explosions.splice(i, 1);
      }
    }

    if (this.invulnerableTimer <= 0) {
      const playerTx = Math.round(this.x / TILE_SIZE);
      const playerTy = Math.round(this.y / TILE_SIZE);
      for (const exp of this.explosions) {
        if (exp.tiles.some((p) => p.x === playerTx && p.y === playerTy)) {
          this.takeDamage();
          break;
        }
      }
    }
  }

  private render(): void {
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    renderHud(this.ctx, this.sprites, this.health, this.maxHealth, this.canvas.width);

    const shake = Math.pow(this.shakeTrauma, 2) * 5;
    const shakeX = (Math.random() * 2 - 1) * shake;
    const shakeY = (Math.random() * 2 - 1) * shake;

    this.ctx.save();
    this.ctx.translate(shakeX, HUD_HEIGHT + shakeY);

    renderMap(this.ctx, this.grid, this.sprites);
    renderScorchMarks(this.ctx, this.scorchMarks);
    renderExplosions(this.ctx, this.explosions, this.sprites);
    renderBombs(this.ctx, this.bombs, this.sprites, this.lastTime);
    renderParticles(this.ctx, this.particles);
    for (const enemy of this.enemies) {
      renderPlayer(this.ctx, enemy, this.sprites.enemies[enemy.sprite], this.lastTime);
    }
    renderPlayer(this.ctx, this, this.sprites.bandit, this.lastTime);

    this.ctx.restore();
  }
}
