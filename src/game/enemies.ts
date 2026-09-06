import { CellType, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, type Grid, type Point } from './constants';
import { getNeighbors } from './map';
import { findPath, tileKey } from './pathfinding';
import type { Bomb, Enemy, Explosion } from './types';

export const CHASE_DISTANCE = 4;
export const LOSE_INTEREST_DISTANCE = 6;

function isWalkable(grid: Grid, p: Point, blocked: Set<string>): boolean {
  return (
    p.x >= 0 &&
    p.x < MAP_WIDTH &&
    p.y >= 0 &&
    p.y < MAP_HEIGHT &&
    grid[p.y]?.[p.x] === CellType.EMPTY &&
    !blocked.has(tileKey(p))
  );
}

function patrolStep(enemy: Enemy, grid: Grid, start: Point, blocked: Set<string>): Point | undefined {
  const d = enemy.patrolDirection;
  const forward = (d.x !== 0 || d.y !== 0) ? d : { x: 1, y: 0 };
  const left = { x: -forward.y, y: forward.x };
  const right = { x: forward.y, y: -forward.x };
  const backward = { x: -forward.x, y: -forward.y };

  const validForwardOrTurns = [forward, left, right].filter((dir) =>
    isWalkable(grid, { x: start.x + dir.x, y: start.y + dir.y }, blocked)
  );

  if (validForwardOrTurns.length > 0) {
    const chosen = validForwardOrTurns[Math.floor(Math.random() * validForwardOrTurns.length)];
    enemy.patrolDirection = chosen;
    return { x: start.x + chosen.x, y: start.y + chosen.y };
  }

  if (isWalkable(grid, { x: start.x + backward.x, y: start.y + backward.y }, blocked)) {
    enemy.patrolDirection = backward;
    return { x: start.x + backward.x, y: start.y + backward.y };
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
      currentPath: [],
      visitedCells: [],
      nodesExpanded: 0,
      searchTimeMs: 0,
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
      const goals = blocked.has(tileKey(goal)) ? getNeighbors(grid, goal.x, goal.y) : [goal];
      if (goals.some((p) => p.x === start.x && p.y === start.y)) {
        enemy.currentPath = [];
        continue;
      }
      const results = goals
        .map((p) => findPath(grid, start, p, blocked))
        .filter((r) => r.path.length > 0);
      results.sort((a, b) => a.path.length - b.path.length);
      const best = results[0];
      if (best) {
        next = best.path[0];
        enemy.currentPath = best.path;
        enemy.visitedCells = best.visited;
        enemy.exploredEdges = best.exploredEdges;
        enemy.nodesExpanded = best.nodesExpanded;
        enemy.searchTimeMs = best.timeMs;
      } else {
        enemy.currentPath = [];
        enemy.visitedCells = [];
        enemy.exploredEdges = [];
      }
    } else {
      enemy.currentPath = [];
      enemy.visitedCells = [];
      enemy.exploredEdges = [];
    }
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
