import shield from '../../assets/shield.png';
import fire1 from '../../assets/fire1.png';
import fire2 from '../../assets/fire2.png';
import fire3 from '../../assets/fire3.png';
import boots1 from '../../assets/winged-boot1.png';
import boots2 from '../../assets/winged-boot2.png';
import boots3 from '../../assets/winged-boot3.png';
import banditSprite from '../../assets/Bandit.png';
import closedSprite from '../../assets/closed.png';
import openSprite from '../../assets/open.png';
import enemy1Sprite from '../../assets/Enemy1.png';
import enemy2Sprite from '../../assets/Enemy2.png';
import enemy3Sprite from '../../assets/Enemy3.png';
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
    upgrades: { fire: [fire1, fire2, fire3].map(createImg), boots: [boots1, boots2, boots3].map(createImg), shield: [createImg(shield)] },
    exit: createImg(closedSprite),
    exitOpen: createImg(openSprite),
    enemies: [enemy1Sprite, enemy2Sprite, enemy3Sprite].map(createImg),
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
