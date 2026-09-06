export const MAP_WIDTH = 15;
export const MAP_HEIGHT = 13;
export const TILE_SIZE = 48;
export const HUD_HEIGHT = 48;

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

export const RAINBOW_HUE_OFFSETS = [0, 340, 310, 240, 175, 130, 70];

export function getLevelHueOffset(level: number): number {
  const index = (Math.max(1, level) - 1) % RAINBOW_HUE_OFFSETS.length;
  return RAINBOW_HUE_OFFSETS[index];
}
