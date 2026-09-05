import banditSprite from '../../assets/Bandit.png';
import bombSprite from '../../assets/Bomb.png';
import bombExplodingSprite from '../../assets/BombExploding.png';
import wallSprite from '../../assets/Walls.png';
import grassSprite from '../../assets/Grass.png';
import brickSprite from '../../assets/Bricks.png';
import healthFullSprite from '../../assets/HealthFull.png';
import healthEmptySprite from '../../assets/HealthEmpty.png';
import exp1Sprite from '../../assets/Explosion1.png';
import exp2Sprite from '../../assets/Explosion2.png';
import exp3Sprite from '../../assets/Explosion3.png';
import exp4Sprite from '../../assets/Explosion4.png';
import exp5Sprite from '../../assets/Explosion5.png';
import type { GameSprites } from './types';

function createImg(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

export function loadGameSprites(): GameSprites {
  return {
    bandit: createImg(banditSprite),
    bomb: createImg(bombSprite),
    bombExploding: createImg(bombExplodingSprite),
    wall: createImg(wallSprite),
    grass: createImg(grassSprite),
    brick: createImg(brickSprite),
    healthFull: createImg(healthFullSprite),
    healthEmpty: createImg(healthEmptySprite),
    explosions: [exp1Sprite, exp2Sprite, exp3Sprite, exp4Sprite, exp5Sprite].map(createImg),
  };
}
