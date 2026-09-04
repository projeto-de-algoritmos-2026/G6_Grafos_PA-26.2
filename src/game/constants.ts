export const MAP_WIDTH = 15;
export const MAP_HEIGHT = 13;
export const TILE_SIZE = 48;

export const CellType = {
  EMPTY: 0,
  WALL: 1,
  BLOCK: 2,
} as const;

export type CellType = (typeof CellType)[keyof typeof CellType];

export type Grid = CellType[][];

export interface Point {
  x: number;
  y: number;
}
