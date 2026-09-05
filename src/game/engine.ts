import { CellType, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, type Grid, type Point } from './constants';
import { generateMap } from './map';
import banditSprite from '../../assets/Bandit.png';
import bombSprite from '../../assets/Bomb.png';
import bombExplodingSprite from '../../assets/BombExploding.png';
import wallSprite from '../../assets/Walls.png';
import grassSprite from '../../assets/Grass.png';
import brickSprite from '../../assets/Bricks.png';

interface Bomb {
  x: number;
  y: number;
  timer: number;
}

interface Explosion {
  tiles: Point[];
  timer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private grid: Grid;
  private x = TILE_SIZE;
  private y = TILE_SIZE;
  private rafId = 0;
  private lastTime = 0;
  private banditImg = new Image();
  private bombImg = new Image();
  private bombExplodingImg = new Image();
  private wallImg = new Image();
  private grassImg = new Image();
  private brickImg = new Image();
  private bombs: Bomb[] = [];
  private explosions: Explosion[] = [];
  private particles: Particle[] = [];
  private animTimer = 0;
  private startX = TILE_SIZE;
  private startY = TILE_SIZE;
  private lastDx = 0;
  private lastDy = 0;
  private facing = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = MAP_WIDTH * TILE_SIZE;
    this.canvas.height = MAP_HEIGHT * TILE_SIZE;
    this.ctx.imageSmoothingEnabled = false;
    this.banditImg.src = banditSprite;
    this.bombImg.src = bombSprite;
    this.bombExplodingImg.src = bombExplodingSprite;
    this.wallImg.src = wallSprite;
    this.grassImg.src = grassSprite;
    this.brickImg.src = brickSprite;
    this.grid = generateMap();
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

      if (this.grid[pushTileY]?.[pushTileX] !== CellType.EMPTY) return;
      if (this.bombs.some((b) => b.x === pushX && b.y === pushY)) return;

      bomb.x = pushX;
      bomb.y = pushY;
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
    this.spawnStepParticles(prevX, prevY, dx, dy);
  }

  private spawnStepParticles(x: number, y: number, dx: number, dy: number): void {
    const colors = ['#e2c078', '#dcb672', '#ecd69d', '#d2b474', '#c29b53'];
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + TILE_SIZE / 2 + (Math.random() - 0.5) * 14,
        y: y + TILE_SIZE - 4 + (Math.random() - 0.5) * 6,
        vx: -dx * (Math.random() * 30 + 10) + (Math.random() - 0.5) * 20,
        vy: -dy * (Math.random() * 30 + 10) - Math.random() * 20,
        size: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.25,
      });
    }
  }

  private spawnBomb(): void {
    if (this.bombs.some((b) => b.x === this.x && b.y === this.y)) return;
    this.bombs.push({ x: this.x, y: this.y, timer: 3 });
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

    this.explosions.push({ tiles, timer: 0.4 });
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

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.timer -= dt;

      if (bomb.timer <= 0) {
        this.explodeBomb(bomb);
        this.bombs.splice(i, 1);
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].timer -= dt;
      if (this.explosions[i].timer <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  private render(): void {
    this.ctx.fillStyle = '#1e1e1e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        this.ctx.drawImage(this.grassImg, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        const cell = this.grid[y][x];
        if (cell === CellType.WALL) {
          this.ctx.drawImage(this.wallImg, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else if (cell === CellType.BLOCK) {
          this.ctx.drawImage(this.brickImg, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    for (const p of this.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    for (const exp of this.explosions) {
      const alpha = Math.min(exp.timer / 0.4, 1);
      for (const p of exp.tiles) {
        this.ctx.fillStyle = `rgba(239, 68, 68, ${0.8 * alpha})`;
        this.ctx.fillRect(p.x * TILE_SIZE, p.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        this.ctx.fillStyle = `rgba(251, 191, 36, ${0.9 * alpha})`;
        this.ctx.fillRect(p.x * TILE_SIZE + 8, p.y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
      }
    }

    for (const bomb of this.bombs) {
      const blinkSpeed = bomb.timer < 1 ? 12 : 5;
      const isExploding = Math.floor(bomb.timer * blinkSpeed) % 2 === 0;
      const img = isExploding ? this.bombExplodingImg : this.bombImg;
      this.ctx.drawImage(img, bomb.x, bomb.y, TILE_SIZE, TILE_SIZE);
    }

    let renderX = this.x;
    let renderY = this.y;
    let scaleX = 1;
    let scaleY = 1;
    let rotation = 0;

    if (this.animTimer > 0) {
      const total = 0.14;
      const hopDuration = 0.085;
      const t = 1 - this.animTimer / total;

      if (t < hopDuration / total) {
        const hopP = t / (hopDuration / total);
        renderX = this.startX + (this.x - this.startX) * hopP;
        renderY = this.startY + (this.y - this.startY) * hopP - Math.sin(hopP * Math.PI) * 10;
        const stretch = Math.sin(hopP * Math.PI) * 0.25;
        scaleY = 1 + stretch;
        scaleX = 1 - stretch * 0.4;
        rotation = this.lastDx * 0.15 * Math.sin(hopP * Math.PI);
      } else {
        const landP = (t - hopDuration / total) / (1 - hopDuration / total);
        const squash = Math.sin(landP * Math.PI) * 0.35;
        scaleY = 1 - squash;
        scaleX = 1 + squash * 0.5;
      }
    } else {
      const breath = Math.sin(this.lastTime / 350) * 0.03;
      scaleY = 1 + breath;
      scaleX = 1 - breath * 0.4;
    }

    this.ctx.save();
    this.ctx.translate(renderX + TILE_SIZE / 2, renderY + TILE_SIZE);
    this.ctx.scale(this.facing * scaleX, scaleY);
    this.ctx.rotate(this.facing * rotation);
    this.ctx.drawImage(this.banditImg, -TILE_SIZE / 2, -TILE_SIZE, TILE_SIZE, TILE_SIZE);
    this.ctx.restore();
  }
}
