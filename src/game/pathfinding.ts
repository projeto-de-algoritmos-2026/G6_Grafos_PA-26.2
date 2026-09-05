import { CellType, type Grid, type Point } from './constants';
import { getNeighbors } from './map';

export const tileKey = (p: Point): string => `${p.x},${p.y}`;

// Unit-cost, four-directional A*: Manhattan distance is admissible and consistent.
// The returned path excludes the start and includes the goal.
export function findPath(grid: Grid, start: Point, goal: Point, blocked = new Set<string>()): Point[] {
  const startKey = tileKey(start);
  const goalKey = tileKey(goal);
  if (grid[start.y]?.[start.x] !== CellType.EMPTY ||
      grid[goal.y]?.[goal.x] !== CellType.EMPTY || blocked.has(goalKey)) return [];

  const heuristic = (p: Point) => Math.abs(p.x - goal.x) + Math.abs(p.y - goal.y);
  const open = new Map<string, Point>([[startKey, start]]);
  const costs = new Map<string, number>([[startKey, 0]]);
  const parents = new Map<string, Point>();
  const closed = new Set<string>();

  while (open.size > 0) {
    let current = open.values().next().value!;
    for (const candidate of open.values()) {
      if (costs.get(tileKey(candidate))! + heuristic(candidate) <
          costs.get(tileKey(current))! + heuristic(current)) current = candidate;
    }
    const key = tileKey(current);
    if (key === goalKey) {
      const path: Point[] = [];
      while (tileKey(current) !== startKey) {
        path.push(current);
        current = parents.get(tileKey(current))!;
      }
      return path.reverse();
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
  return [];
}
