import type { Point } from './constants';

export interface Bomb {
  x: number;
  y: number;
  timer: number;
  slideTimer?: number;
  slideDuration?: number;
  startX?: number;
  startY?: number;
  renderX?: number;
  renderY?: number;
  slideDx?: number;
  slideDy?: number;
  resistTimer?: number;
  resistDx?: number;
  resistDy?: number;
}

export interface Explosion {
  tiles: Point[];
  timer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface ScorchMark {
  x: number;
  y: number;
  life: number;
}

export interface GameSprites {
  enemies: HTMLImageElement[];
  bandit: HTMLImageElement;
  bomb: HTMLImageElement;
  bombExploding: HTMLImageElement;
  wall: HTMLImageElement;
  grass: HTMLImageElement;
  brick: HTMLImageElement;
  healthFull: HTMLImageElement;
  healthEmpty: HTMLImageElement;
  explosions: HTMLImageElement[];
}

export interface Enemy {
  mode: 'patrol' | 'chase';
  patrolDirection: Point;
  x: number;
  y: number;
  startX: number;
  startY: number;
  sprite: number;
  facing: number;
  lastDx: number;
  animTimer: number;
  invulnerableTimer: number;
  moveTimer: number;
  moveInterval: number;
}
