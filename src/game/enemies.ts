import { CellType, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, type Grid, type Point } from './constants';
import { getNeighbors } from './map';
import { findPath, tileKey } from './pathfinding';
import type { Bomb, Enemy, Explosion, PathAlgorithm, PathResult } from './types';

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

export function getSlimeCount(level: number): number {
  return Math.max(1, level) + 2;
}

const BASE_SPAWN_POINTS: Point[] = [
  { x: MAP_WIDTH - 2, y: 1 },
  { x: 1, y: MAP_HEIGHT - 2 },
  { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 },
  { x: 7, y: 1 },
  { x: 7, y: MAP_HEIGHT - 2 },
  { x: MAP_WIDTH - 2, y: 7 },
  { x: 7, y: 5 },
  { x: 1, y: 7 },
  { x: MAP_WIDTH - 2, y: 5 },
  { x: 5, y: MAP_HEIGHT - 2 },
  { x: 9, y: 1 },
  { x: 5, y: 5 },
  { x: 9, y: 7 },
  { x: 11, y: MAP_HEIGHT - 2 },
  { x: 11, y: 3 },
  { x: 3, y: 9 },
  { x: 7, y: 9 },
  { x: 7, y: 3 },
  { x: 9, y: 5 },
  { x: 5, y: 7 },
  { x: 3, y: 5 },
  { x: 11, y: 7 },
  { x: 9, y: 9 },
  { x: 5, y: 3 },
  { x: 9, y: 3 },
  { x: 3, y: 7 },
];

function getSpawnPoints(count: number): Point[] {
  const result: Point[] = [];
  const used = new Set<string>();

  for (const p of BASE_SPAWN_POINTS) {
    if (result.length >= count) break;
    const key = `${p.x},${p.y}`;
    if (!used.has(key)) {
      used.add(key);
      result.push(p);
    }
  }

  if (result.length < count) {
    for (let y = 1; y < MAP_HEIGHT - 1; y += 2) {
      for (let x = 1; x < MAP_WIDTH - 1; x += 2) {
        if (result.length >= count) break;
        if (x + y <= 4) continue;
        const key = `${x},${y}`;
        if (!used.has(key)) {
          used.add(key);
          result.push({ x, y });
        }
      }
    }
  }

  return result;
}

export function spawnEnemies(grid: Grid, level: number = 1): Enemy[] {
  const count = getSlimeCount(level);
  const spawns = getSpawnPoints(count);

  return spawns.map((p, index) => {
    for (const d of [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
      const x = p.x + d.x;
      const y = p.y + d.y;
      if (grid[y]?.[x] === CellType.BLOCK) grid[y][x] = CellType.EMPTY;
    }

    const sprite = index % 7;
    const patrolDirection =
      p.x > 7 ? { x: -1, y: 0 } : p.y > 6 ? { x: 0, y: -1 } : { x: 1, y: 0 };

    return {
      x: p.x * TILE_SIZE,
      y: p.y * TILE_SIZE,
      startX: p.x * TILE_SIZE,
      startY: p.y * TILE_SIZE,
      sprite,
      facing: -1,
      lastDx: 0,
      animTimer: 0,
      moveTimer: 1,
      moveInterval: 0.45,
      mode: 'patrol',
      patrolDirection,
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

function clearEnemyPath(enemy: Enemy): void {
  enemy.currentPath = [];
  enemy.visitedCells = [];
  enemy.exploredEdges = [];
  enemy.nodesExpanded = 0;
  enemy.searchTimeMs = 0;
}

function applyEnemyPath(enemy: Enemy, result: PathResult): void {
  enemy.currentPath = result.path;
  enemy.visitedCells = result.visited;
  enemy.exploredEdges = result.exploredEdges;
  enemy.nodesExpanded = result.nodesExpanded;
  enemy.searchTimeMs = result.timeMs;
}

function findChaseRoute(
  enemy: Enemy,
  grid: Grid,
  player: Point,
  blocked: Set<string>,
  algorithm: PathAlgorithm
): PathResult | undefined {
  const start = { x: Math.round(enemy.x / TILE_SIZE), y: Math.round(enemy.y / TILE_SIZE) };
  const goal = { x: Math.round(player.x / TILE_SIZE), y: Math.round(player.y / TILE_SIZE) };
  const goals = blocked.has(tileKey(goal)) ? getNeighbors(grid, goal.x, goal.y) : [goal];
  if (goals.some((p) => p.x === start.x && p.y === start.y)) return undefined;

  let best: PathResult | undefined;
  for (const target of goals) {
    const res = findPath(grid, start, target, blocked, algorithm);
    if (res.path.length > 0 && (!best || res.path.length < best.path.length)) {
      best = res;
    }
  }
  return best;
}

export function updateEnemies(
  enemies: Enemy[],
  grid: Grid,
  player: Point,
  bombs: Bomb[],
  dt: number,
  algorithm: PathAlgorithm = 'astar'
): void {
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

    const start = { x: Math.round(enemy.x / TILE_SIZE), y: Math.round(enemy.y / TILE_SIZE) };
    const goal = { x: Math.round(player.x / TILE_SIZE), y: Math.round(player.y / TILE_SIZE) };
    const distance = Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y);
    if (distance <= CHASE_DISTANCE) enemy.mode = 'chase';
    else if (distance > LOSE_INTEREST_DISTANCE) enemy.mode = 'patrol';

    let next: Point | undefined;
    if (enemy.mode === 'chase') {
      const best = findChaseRoute(enemy, grid, player, blocked, algorithm);
      if (best) {
        next = best.path[0];
        applyEnemyPath(enemy, best);
      } else {
        clearEnemyPath(enemy);
      }
    } else {
      clearEnemyPath(enemy);
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

export function recalculatePaths(
  enemies: Enemy[],
  grid: Grid,
  player: Point,
  bombs: Bomb[],
  algorithm: PathAlgorithm
): void {
  const bombTiles = bombs.map((b) => tileKey({ x: b.x / TILE_SIZE, y: b.y / TILE_SIZE }));
  for (const enemy of enemies) {
    if (enemy.mode !== 'chase') continue;
    const blocked = new Set(bombTiles);
    for (const other of enemies) {
      if (other !== enemy) blocked.add(tileKey({ x: other.x / TILE_SIZE, y: other.y / TILE_SIZE }));
    }
    const best = findChaseRoute(enemy, grid, player, blocked, algorithm);
    if (best) {
      applyEnemyPath(enemy, best);
    }
  }
}
