import { CellType, MAP_HEIGHT, MAP_WIDTH, type Grid, type Point } from './constants';

const DIRS: Point[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

// Keep the classic hard-block lattice, with a more open soft-block distribution.
export function generateMap(blockDensity = 0.45): Grid {
  const grid: Grid = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: CellType[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const isBorder = x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1;
      const isPillar = x % 2 === 0 && y % 2 === 0;
      const distanceFromSide = Math.min(x, MAP_WIDTH - 1 - x);
      const distanceFromTopOrBottom = Math.min(y, MAP_HEIGHT - 1 - y);
      // An L-shaped pocket at each corner gives the player and enemies room to move.
      const isSpawn =
        (distanceFromSide <= 3 && distanceFromTopOrBottom === 1) ||
        (distanceFromSide === 1 && distanceFromTopOrBottom <= 3);

      if (isBorder || isPillar) {
        row.push(CellType.WALL);
      } else if (isSpawn) {
        row.push(CellType.EMPTY);
      } else {
        row.push(Math.random() < blockDensity ? CellType.BLOCK : CellType.EMPTY);
      }
    }
    grid.push(row);
  }

  return grid;
}

export function getNeighbors(grid: Grid, x: number, y: number): Point[] {
  return DIRS
    .map((d) => ({ x: x + d.x, y: y + d.y }))
    .filter((p) => grid[p.y]?.[p.x] === CellType.EMPTY);
}
