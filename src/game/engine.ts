import { CellType, getLevelHueOffset, HUD_HEIGHT, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, type Grid, type Point } from './constants';
import { generateMap } from './map';
import { canLeaveLevel, hideExit, isExitRevealed } from './level';
import { isInExplosion, recalculatePaths, spawnEnemies, updateEnemies } from './enemies';
import { loadGameSprites, BOMB_SPRITE_SRC, ENEMY_SPRITE_SRCS } from './assets';
import {
  renderBombs,
  renderExplosions,
  renderExit,
  renderGraphOverlay,
  renderHud,
  renderIrisWipe,
  renderMap,
  renderPlayer,
  renderVortex,
} from './renderer';
import {
  renderParticles,
  renderScorchMarks,
  spawnDust,
  spawnEnemyDeathParticles,
  spawnExplosionDebris,
  spawnLandingImpact,
  spawnPortalParticles,
  spawnWickSpark,
  updateParticles,
  updateScorchMarks,
} from './particles';
import type { Bomb, Enemy, Explosion, GameOverStats, GameSprites, GraphMetricsStats, LevelTransition, Particle, PathAlgorithm, ScorchMark } from './types';

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private grid: Grid;
  private sprites: GameSprites;
  private exit: Point;
  private level = 1;

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
  public transition: LevelTransition = { phase: 'none', timer: 0, duration: 0 };

  public onGameOver?: (stats: GameOverStats) => void;
  public onLevelChange?: (level: number) => void;
  public onGraphStatsUpdate?: (stats: GraphMetricsStats) => void;
  public isGameOver = false;
  public isPlaying = false;
  public showGraphOverlay = false;
  public algorithm: PathAlgorithm = 'dijkstra';
  public score = 0;
  private startTime = 0;
  private bombsPlacedCount = 0;
  private blocksDestroyedCount = 0;
  private enemiesKilledCount = 0;

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
    this.enemies = spawnEnemies(this.grid, this.level);
    this.exit = hideExit(this.grid);
  }

  public toggleGraphOverlay(): void {
    this.showGraphOverlay = !this.showGraphOverlay;
    this.emitGraphStats();
  }

  private lastStatsKey = '';

  private emitGraphStats(): void {
    if (!this.onGraphStatsUpdate) return;

    if (!this.showGraphOverlay) {
      if (this.lastStatsKey !== 'off') {
        this.lastStatsKey = 'off';
        this.onGraphStatsUpdate({
          show: false,
          algorithm: this.algorithm,
          algorithmName: this.algorithm === 'dijkstra' ? 'DIJKSTRA' : 'A*',
          totalExpanded: 0,
          maxTime: 0,
          pathLenStr: '0 passos',
          themeColor: '#facc15',
        });
      }
      return;
    }

    let totalExpanded = 0;
    let maxTime = 0;
    let activeChasers = 0;
    let avgPathLen = 0;

    for (const e of this.enemies) {
      if (e.mode === 'chase' && e.currentPath && e.currentPath.length > 0) {
        totalExpanded += e.nodesExpanded ?? 0;
        maxTime = Math.max(maxTime, e.searchTimeMs ?? 0);
        avgPathLen += e.currentPath.length;
        activeChasers++;
      }
    }

    const steps = activeChasers > 0 ? Math.round(avgPathLen / activeChasers) : 0;
    const pathLenStr = activeChasers > 0 ? `${steps} ${steps === 1 ? 'passo' : 'passos'}` : '0 passos';
    const hue = getLevelHueOffset(this.level);
    const themeColor = `hsl(${(48 + hue) % 360}, 96%, 54%)`;

    const key = `on-${this.algorithm}-${totalExpanded}-${maxTime.toFixed(2)}-${pathLenStr}-${themeColor}`;
    if (key !== this.lastStatsKey) {
      this.lastStatsKey = key;
      this.onGraphStatsUpdate({
        show: true,
        algorithm: this.algorithm,
        algorithmName: this.algorithm === 'dijkstra' ? 'DIJKSTRA' : 'A*',
        totalExpanded,
        maxTime,
        pathLenStr,
        themeColor,
      });
    }
  }

  start(): void {
    window.addEventListener('keydown', this.onKeyDown);
    this.score = 0;
    this.enemiesKilledCount = 0;
    this.startTime = performance.now();
    this.lastTime = performance.now();
    this.onLevelChange?.(this.level);
    this.rafId = requestAnimationFrame(this.tick);
  }

  startPlay(): void {
    this.isPlaying = true;
    this.isGameOver = false;
    this.startTime = performance.now();
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.isPlaying || this.isGameOver || this.transition.phase !== 'none') return;

    if (e.code === 'KeyG') {
      e.preventDefault();
      this.toggleGraphOverlay();
      return;
    }

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
    if (this.isGameOver) return;
    if (this.bombs.some((b) => b.x === this.x && b.y === this.y)) return;
    this.bombs.push({ x: this.x, y: this.y, timer: 3.0 });
    this.bombsPlacedCount++;
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
        this.blocksDestroyedCount++;
        this.score += 50;
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

  private takeDamage(cause = 'Dinamite', killerSprite = BOMB_SPRITE_SRC): void {
    if (!this.isPlaying || this.invulnerableTimer > 0 || this.isGameOver) return;
    this.health--;
    if (this.health <= 0) {
      this.health = 0;
      this.isGameOver = true;
      const elapsedSec = Math.floor((performance.now() - this.startTime) / 1000);
      const mins = Math.floor(elapsedSec / 60);
      const secs = elapsedSec % 60;
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      const stats: GameOverStats = {
        killerName: cause,
        killerSprite,
        timeSurvived: timeStr,
        bombsPlaced: this.bombsPlacedCount,
        blocksDestroyed: this.blocksDestroyedCount,
        score: this.score,
        enemiesKilled: this.enemiesKilledCount,
      };

      if (this.onGameOver) {
        this.onGameOver(stats);
      } else {
        this.restart();
      }
    } else {
      this.invulnerableTimer = 1.0;
    }
  }

  public resetToMenu(): void {
    this.isGameOver = false;
    this.isPlaying = false;
    this.level = 1;
    this.score = 0;
    this.enemiesKilledCount = 0;
    this.health = this.maxHealth;
    this.transition = { phase: 'none', timer: 0, duration: 0 };
    this.showGraphOverlay = false;
    this.algorithm = 'dijkstra';
    this.loadLevel();
    this.onLevelChange?.(this.level);
    this.emitGraphStats();
  }

  public restart(): void {
    this.resetToMenu();
    this.isPlaying = true;
  }

  private loadLevel(): void {
    this.x = TILE_SIZE;
    this.y = TILE_SIZE;
    this.startX = TILE_SIZE;
    this.startY = TILE_SIZE;
    this.animTimer = 0;
    this.lastDx = 0;
    this.lastDy = 0;
    this.facing = 1;
    this.invulnerableTimer = 0;
    this.shakeTrauma = 0;
    this.bombsPlacedCount = 0;
    this.blocksDestroyedCount = 0;
    this.startTime = performance.now();
    this.bombs = [];
    this.explosions = [];
    this.particles = [];
    this.scorchMarks = [];
    this.algorithm = this.level % 2 === 1 ? 'dijkstra' : 'astar';
    this.grid = generateMap();
    this.enemies = spawnEnemies(this.grid, this.level);
    this.exit = hideExit(this.grid);
    this.lastStatsKey = '';
    this.emitGraphStats();
  }

  private checkEnemyContact(): void {
    const touching = this.enemies.find((enemy) => {
      if (enemy.x === this.x && enemy.y === this.y) return true;
      if (
        this.animTimer > 0 && enemy.animTimer > 0 &&
        enemy.x === this.startX && enemy.y === this.startY &&
        this.x === enemy.startX && this.y === enemy.startY
      ) {
        return true;
      }
      return false;
    });

    if (touching) {
      const sprite = ENEMY_SPRITE_SRCS[touching.sprite % ENEMY_SPRITE_SRCS.length] ?? ENEMY_SPRITE_SRCS[0];
      this.takeDamage('Slime', sprite);
    }
  }

  private removeExplodedEnemies(): void {
    this.enemies = this.enemies.filter((enemy) => {
      if (!isInExplosion(enemy, this.explosions)) return true;
      let cx = enemy.x + TILE_SIZE / 2;
      let cy = enemy.y + TILE_SIZE / 2;
      if (enemy.animTimer > 0) {
        const total = 0.14;
        const t = Math.max(0, Math.min(1, 1 - enemy.animTimer / total));
        cx = enemy.startX + (enemy.x - enemy.startX) * t + TILE_SIZE / 2;
        cy = enemy.startY + (enemy.y - enemy.startY) * t + TILE_SIZE / 2;
      }
      spawnEnemyDeathParticles(this.particles, cx, cy, enemy.sprite);
      this.score += 200;
      this.enemiesKilledCount++;
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
    if (this.shakeTrauma > 0) {
      this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 4.0);
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    updateScorchMarks(this.scorchMarks, dt);
    updateParticles(this.particles, dt);

    if (!this.isPlaying || this.isGameOver) return;

    if (this.transition.phase === 'exiting') {
      this.transition.timer -= dt;
      const cx = (this.transition.exitX ?? this.exit.x * TILE_SIZE) + TILE_SIZE / 2;
      const cy = (this.transition.exitY ?? this.exit.y * TILE_SIZE) + 28;
      spawnPortalParticles(this.particles, cx, cy, this.level);

      if (this.transition.timer <= 0) {
        this.score += 1000;
        this.level++;
        this.loadLevel();
        this.onLevelChange?.(this.level);
        this.startEnterTransition();
      }
      return;
    }

    if (this.transition.phase === 'entering') {
      this.transition.timer -= dt;
      const progress = 1 - this.transition.timer / this.transition.duration;
      if (progress >= 0.35 && !this.transition.landingTriggered) {
        this.transition.landingTriggered = true;
        spawnLandingImpact(this.particles, this.x + TILE_SIZE / 2, this.y + TILE_SIZE - 4);
        this.shakeTrauma = 0.25;
      }

      if (this.transition.timer <= 0) {
        this.transition = { phase: 'none', timer: 0, duration: 0 };
      }
      return;
    }

    if (this.animTimer > 0) {
      this.animTimer = Math.max(0, this.animTimer - dt);
    }

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
    updateEnemies(this.enemies, this.grid, this, this.bombs, dt, this.algorithm);
    this.removeExplodedEnemies();
    this.checkEnemyContact();
    this.emitGraphStats();

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.timer -= dt;
      if (exp.timer <= 0) {
        this.explosions.splice(i, 1);
      }
    }

    if (this.invulnerableTimer <= 0 && !this.isGameOver) {
      const playerTx = Math.round(this.x / TILE_SIZE);
      const playerTy = Math.round(this.y / TILE_SIZE);
      for (const exp of this.explosions) {
        if (exp.tiles.some((p) => p.x === playerTx && p.y === playerTy)) {
          this.takeDamage('Dinamite');
          break;
        }
      }
    }
    this.tryNextLevel();
  }

  private tryNextLevel(): void {
    if (this.transition.phase !== 'none') return;
    if (this.animTimer > 0 || isInExplosion(this, this.explosions)) return;
    if (!canLeaveLevel(this.grid, this.exit, this, this.enemies.length)) return;

    this.startExitTransition();
  }

  public startExitTransition(): void {
    const duration = 0.55;
    this.transition = {
      phase: 'exiting',
      timer: duration,
      duration,
      exitX: this.exit.x * TILE_SIZE,
      exitY: this.exit.y * TILE_SIZE,
    };
  }

  public startEnterTransition(): void {
    const duration = 0.85;
    this.transition = {
      phase: 'entering',
      timer: duration,
      duration,
      landingTriggered: false,
    };
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    renderHud(this.ctx, this.sprites, this.health, this.maxHealth, this.canvas.width,
      this.level, this.enemies.length, isExitRevealed(this.grid, this.exit), this.score, this.showGraphOverlay, this.algorithm);

    const shake = Math.pow(this.shakeTrauma, 2) * 5;
    const shakeX = (Math.random() * 2 - 1) * shake;
    const shakeY = (Math.random() * 2 - 1) * shake;

    this.ctx.save();
    this.ctx.translate(shakeX, HUD_HEIGHT + shakeY);

    renderMap(this.ctx, this.grid, this.sprites, this.level);
    renderScorchMarks(this.ctx, this.scorchMarks);
    if (this.showGraphOverlay) {
      renderGraphOverlay(this.ctx, this.grid, this.enemies);
    }
    if (isExitRevealed(this.grid, this.exit)) {
      renderExit(this.ctx, this.exit, this.enemies.length === 0 ? this.sprites.exitOpen : this.sprites.exit);
      if (this.transition.phase === 'exiting') {
        const p = Math.min(1, Math.max(0, 1 - this.transition.timer / this.transition.duration));
        renderVortex(this.ctx, this.exit.x * TILE_SIZE + TILE_SIZE / 2, this.exit.y * TILE_SIZE + 28, p, this.lastTime, this.level);
      }
    }
    renderExplosions(this.ctx, this.explosions, this.sprites);
    renderBombs(this.ctx, this.bombs, this.sprites, this.lastTime);
    renderParticles(this.ctx, this.particles);
    for (const enemy of this.enemies) {
      renderPlayer(this.ctx, enemy, this.sprites.enemies[enemy.sprite], this.lastTime);
    }
    renderPlayer(this.ctx, this, this.sprites.bandit, this.lastTime);

    this.ctx.restore();

    this.renderTransitions();
  }

  private renderTransitions(): void {
    const maxRadius = Math.hypot(this.canvas.width, this.canvas.height);

    if (this.transition.phase === 'exiting') {
      const p = Math.min(1, Math.max(0, 1 - this.transition.timer / this.transition.duration));
      const exitPixelX = (this.transition.exitX ?? this.exit.x * TILE_SIZE) + TILE_SIZE / 2;
      const exitPixelY = HUD_HEIGHT + (this.transition.exitY ?? this.exit.y * TILE_SIZE) + 28;

      if (p >= 0.25) {
        const irisT = (p - 0.25) / 0.75;
        const ease = irisT < 0.5 ? 2 * irisT * irisT : 1 - Math.pow(-2 * irisT + 2, 2) / 2;
        const radius = maxRadius * (1 - ease);
        renderIrisWipe(this.ctx, this.canvas.width, this.canvas.height, exitPixelX, exitPixelY, radius, this.level);
      }
    } else if (this.transition.phase === 'entering') {
      const p = Math.min(1, Math.max(0, 1 - this.transition.timer / this.transition.duration));
      const spawnPixelX = this.x + TILE_SIZE / 2;
      const spawnPixelY = HUD_HEIGHT + this.y + TILE_SIZE / 2;

      if (p < 0.45) {
        const irisT = p / 0.45;
        const ease = 1 - Math.pow(1 - irisT, 3);
        const radius = maxRadius * ease;
        renderIrisWipe(this.ctx, this.canvas.width, this.canvas.height, spawnPixelX, spawnPixelY, radius, this.level);
      }
    }
  }
}
