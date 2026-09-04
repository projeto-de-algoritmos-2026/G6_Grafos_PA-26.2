import { CellType, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, type Grid } from './constants';
import { generateMap } from './map';

function isBlocked(grid: Grid, x: number, y: number): boolean {
  const minX = Math.floor(x / TILE_SIZE);
  const maxX = Math.floor((x + TILE_SIZE - 0.01) / TILE_SIZE);
  const minY = Math.floor(y / TILE_SIZE);
  const maxY = Math.floor((y + TILE_SIZE - 0.01) / TILE_SIZE);

  for (let r = minY; r <= maxY; r++) {
    for (let c = minX; c <= maxX; c++) {
      if (grid[r]?.[c] !== CellType.EMPTY) return true;
    }
  }
  return false;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private grid: Grid;
  private x = TILE_SIZE;
  private y = TILE_SIZE;
  private speed = 190;
  private keys = new Set<string>();
  private rafId = 0;
  private lastTime = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = MAP_WIDTH * TILE_SIZE;
    this.canvas.height = MAP_HEIGHT * TILE_SIZE;
    this.grid = generateMap();
  }

  start(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private tick = (now: number) => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(this.tick);
  };

  private update(dt: number): void {
    let dx = 0;
    let dy = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;

    if (dx !== 0) {
      const alignY = Math.round(this.y / TILE_SIZE) * TILE_SIZE;
      if (Math.abs(this.y - alignY) < 16) this.y = alignY;

      const nextX = this.x + dx * this.speed * dt;
      if (!isBlocked(this.grid, nextX, this.y)) this.x = nextX;
    }

    if (dy !== 0) {
      const alignX = Math.round(this.x / TILE_SIZE) * TILE_SIZE;
      if (Math.abs(this.x - alignX) < 16) this.x = alignX;

      const nextY = this.y + dy * this.speed * dt;
      if (!isBlocked(this.grid, this.x, nextY)) this.y = nextY;
    }
  }

  private render(): void {
    this.ctx.fillStyle = '#1e1e1e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const cell = this.grid[y][x];
        if (cell === CellType.WALL) {
          this.ctx.fillStyle = '#64748b';
          this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else if (cell === CellType.BLOCK) {
          this.ctx.fillStyle = '#b45309';
          this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    this.ctx.fillStyle = '#3b82f6';
    this.ctx.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE);
  }
}
