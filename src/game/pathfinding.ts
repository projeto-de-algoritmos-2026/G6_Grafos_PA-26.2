import { CellType, type Grid, type Point } from './constants';
import { getNeighbors } from './map';
import type { PathAlgorithm, PathResult } from './types';

export const tileKey = (p: Point): string => `${p.x},${p.y}`;

function searchShortestPath(
  grid: Grid,
  start: Point,
  goal: Point,
  blocked: Set<string>,
  heuristic: (p: Point) => number
): { path: Point[]; visited: Point[]; exploredEdges: PathResult['exploredEdges']; nodesExpanded: number } {
  const startKey = tileKey(start);
  const goalKey = tileKey(goal);
  const open = new Map<string, Point>([[startKey, start]]);
  const costs = new Map<string, number>([[startKey, 0]]);
  const parents = new Map<string, Point>();
  const closed = new Set<string>();
  const visited: Point[] = [];
  const exploredEdges: PathResult['exploredEdges'] = [];

  while (open.size > 0) {
    let current = open.values().next().value!;
    let bestF = costs.get(tileKey(current))! + heuristic(current);

    for (const candidate of open.values()) {
      const f = costs.get(tileKey(candidate))! + heuristic(candidate);
      if (f < bestF) {
        current = candidate;
        bestF = f;
      }
    }

    const key = tileKey(current);
    visited.push(current);
    if (parents.has(key)) {
      exploredEdges.push({ from: parents.get(key)!, to: current });
    }

    if (key === goalKey) {
      const path: Point[] = [];
      let trace = current;
      while (tileKey(trace) !== startKey) {
        path.push(trace);
        trace = parents.get(tileKey(trace))!;
      }
      return {
        path: path.reverse(),
        visited,
        exploredEdges,
        nodesExpanded: closed.size + 1,
      };
    }

    open.delete(key);
    closed.add(key);

    for (const neighbor of getNeighbors(grid, current.x, current.y)) {
      const nextKey = tileKey(neighbor);
      if (closed.has(nextKey) || blocked.has(nextKey)) continue;
      const cost = costs.get(key)! + 1;
      if (cost >= (costs.get(nextKey) ?? Infinity)) continue;
      costs.set(nextKey, cost);
      parents.set(nextKey, current);
      open.set(nextKey, neighbor);
    }
  }

  return {
    path: [],
    visited,
    exploredEdges,
    nodesExpanded: closed.size,
  };
}

export function dijkstraSearch(
  grid: Grid,
  start: Point,
  goal: Point,
  blocked: Set<string>
) {
  return searchShortestPath(grid, start, goal, blocked, () => 0);
}

export function aStarSearch(
  grid: Grid,
  start: Point,
  goal: Point,
  blocked: Set<string>
) {
  const heuristic = (p: Point) => Math.abs(p.x - goal.x) + Math.abs(p.y - goal.y);
  return searchShortestPath(grid, start, goal, blocked, heuristic);
}

export function findPath(
  grid: Grid,
  start: Point,
  goal: Point,
  blocked = new Set<string>(),
  algorithm: PathAlgorithm = 'astar'
): PathResult {
  const startKey = tileKey(start);
  const goalKey = tileKey(goal);

  if (
    grid[start.y]?.[start.x] !== CellType.EMPTY ||
    grid[goal.y]?.[goal.x] !== CellType.EMPTY ||
    blocked.has(goalKey)
  ) {
    return {
      path: [],
      visited: [],
      exploredEdges: [],
      nodesExpanded: 0,
      timeMs: 0,
    };
  }

  const runAlgorithm = algorithm === 'dijkstra' ? dijkstraSearch : aStarSearch;

  const t0 = performance.now();
  const res = runAlgorithm(grid, start, goal, blocked);
  const timeMs = Math.max(0.01, +(performance.now() - t0).toFixed(2));

  return {
    ...res,
    timeMs,
  };
}
