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

// Rainbow hue progression starting from default yellow (0deg offset)
export const RAINBOW_HUE_OFFSETS = [0, 70, 130, 185, 240, 285, 325, 350];

export function getLevelHueOffset(level: number): number {
  const index = (Math.max(1, level) - 1) % RAINBOW_HUE_OFFSETS.length;
  return RAINBOW_HUE_OFFSETS[index];
}
