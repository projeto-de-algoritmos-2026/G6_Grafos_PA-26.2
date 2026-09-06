import { CellType, TILE_SIZE, type Grid, type Point } from './constants';

export function hideExit(grid: Grid): Point {
  const blocks: Point[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === CellType.BLOCK) blocks.push({ x, y });
    }
  }
  if (blocks.length > 0) return blocks[Math.floor(Math.random() * blocks.length)]!;

  for (let y = 3; y < grid.length - 3; y++) {
    for (let x = 3; x < grid[y].length - 3; x++) {
      if (grid[y][x] !== CellType.EMPTY) continue;
      grid[y][x] = CellType.BLOCK;
      return { x, y };
    }
  }
  throw new Error('No valid tile for the hidden exit');
}

export function isExitRevealed(grid: Grid, exit: Point): boolean {
  return grid[exit.y]?.[exit.x] === CellType.EMPTY;
}

export function canLeaveLevel(grid: Grid, exit: Point, player: Point, enemyCount: number): boolean {
  return enemyCount === 0 && isExitRevealed(grid, exit) &&
    player.x === exit.x * TILE_SIZE && player.y === exit.y * TILE_SIZE;
}
