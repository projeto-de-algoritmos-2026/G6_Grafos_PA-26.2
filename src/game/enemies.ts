import { CellType, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, type Grid, type Point } from './constants';
import { getNeighbors } from './map';
import { findPath, tileKey } from './pathfinding';
import type { Bomb, Enemy, Explosion } from './types';

export const CHASE_DISTANCE = 4;
export const LOSE_INTEREST_DISTANCE = 6;

function patrolStep(enemy: Enemy, grid: Grid, start: Point, blocked: Set<string>): Point | undefined {
  const d = enemy.patrolDirection;
  // Keep moving along the corridor, reverse at obstacles, turn only if both ends are blocked.
  const directions = [d, { x: -d.x, y: -d.y }, { x: d.y, y: d.x }, { x: -d.y, y: -d.x }];
  for (const direction of directions) {
    const goal = { x: start.x + direction.x, y: start.y + direction.y };
    const path = findPath(grid, start, goal, blocked);
    if (path.length !== 1) continue;
    enemy.patrolDirection = direction;
    return path[0];
  }
  return undefined;
}

export function spawnEnemies(grid: Grid): Enemy[] {
  const spawns = [
    { x: MAP_WIDTH - 2, y: 1 },
    { x: 1, y: MAP_HEIGHT - 2 },
    { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 },
  ];
  return spawns.map((p, sprite) => {
    // Reserve a small pocket, preserving indestructible walls and the rest of the map.
    for (const d of [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
      const x = p.x + d.x;
      const y = p.y + d.y;
      if (grid[y]?.[x] === CellType.BLOCK) grid[y][x] = CellType.EMPTY;
    }
    return {
      x: p.x * TILE_SIZE, y: p.y * TILE_SIZE,
      startX: p.x * TILE_SIZE, startY: p.y * TILE_SIZE,
      sprite, facing: -1, lastDx: 0, animTimer: 0, invulnerableTimer: 0,
      moveTimer: 1, moveInterval: 0.45,
      mode: 'patrol',
      patrolDirection: sprite === 1 ? { x: 0, y: -1 } : { x: -1, y: 0 },
    };
  });
}

export function isInExplosion(enemy: Point, explosions: Explosion[]): boolean {
  return explosions.some((exp) => exp.tiles.some((p) =>
    p.x * TILE_SIZE === enemy.x && p.y * TILE_SIZE === enemy.y));
}

export function updateEnemies(enemies: Enemy[], grid: Grid, player: Point, bombs: Bomb[], dt: number): void {
  const bombTiles = bombs.map((b) => tileKey({ x: b.x / TILE_SIZE, y: b.y / TILE_SIZE }));
  for (const enemy of enemies) {
    enemy.animTimer = Math.max(0, enemy.animTimer - dt);
    enemy.moveTimer = Math.max(0, enemy.moveTimer - dt);
    if (enemy.moveTimer > 0) continue;
    enemy.moveTimer = enemy.moveInterval;
    const blocked = new Set(bombTiles);
    for (const other of enemies) {
      if (other !== enemy) blocked.add(tileKey({ x: other.x / TILE_SIZE, y: other.y / TILE_SIZE }));
    }
    const start = { x: enemy.x / TILE_SIZE, y: enemy.y / TILE_SIZE };
    const goal = { x: player.x / TILE_SIZE, y: player.y / TILE_SIZE };
    const distance = Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y);
    if (distance <= CHASE_DISTANCE) enemy.mode = 'chase';
    else if (distance > LOSE_INTEREST_DISTANCE) enemy.mode = 'patrol';

    let next: Point | undefined;
    if (enemy.mode === 'chase') {
      // If the player stands on a bomb, approach an adjacent cell without crossing it.
      const goals = blocked.has(tileKey(goal)) ? getNeighbors(grid, goal.x, goal.y) : [goal];
      if (goals.some((p) => p.x === start.x && p.y === start.y)) continue;
      const paths = goals.map((p) => findPath(grid, start, p, blocked)).filter((path) => path.length > 0);
      paths.sort((a, b) => a.length - b.length);
      next = paths[0]?.[0];
    }
    // Patrol also keeps enemies active when the player is behind destructible blocks.
    next ??= patrolStep(enemy, grid, start, blocked);
    if (!next) continue;
    enemy.startX = enemy.x;
    enemy.startY = enemy.y;
    enemy.x = next.x * TILE_SIZE;
    enemy.y = next.y * TILE_SIZE;
    enemy.lastDx = next.x - start.x;
    if (enemy.lastDx !== 0) enemy.facing = enemy.lastDx;
    enemy.animTimer = 0.14;
  }
}
