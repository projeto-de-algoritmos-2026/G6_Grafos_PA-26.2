import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

// Resolve the extensionless TypeScript imports used by Vite (Node 24+).
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.endsWith('.ts') && specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
const { findPath, tileKey } = await import('../src/game/pathfinding.ts');
const { spawnEnemies, updateEnemies, isInExplosion } = await import('../src/game/enemies.ts');
const { generateMap } = await import('../src/game/map.ts');

test('A* takes the shortest detour and respects dynamic obstacles', () => {
  const grid = [[0, 0, 0], [0, 1, 0], [0, 2, 0]];
  assert.deepEqual(findPath(grid, { x: 0, y: 2 }, { x: 2, y: 2 }), [
    { x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 },
    { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
  ]);
  assert.deepEqual(findPath(grid, { x: 0, y: 2 }, { x: 2, y: 2 }, new Set(['1,0'])), []);
  assert.deepEqual(findPath(grid, { x: 0, y: 0 }, { x: 0, y: 0 }), []);
  assert.deepEqual(findPath(grid, { x: 0, y: 0 }, { x: -1, y: 0 }), []);
});

test('A* agrees with breadth-first search on 100 seeded obstacle maps', () => {
  let seed = 123;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  for (let trial = 0; trial < 100; trial++) {
    const grid = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => random() < 0.3 ? 1 : 0));
    grid[0][0] = grid[7][7] = 0;
    const queue = [{ x: 0, y: 0, distance: 0 }];
    const seen = new Set(['0,0']);
    let distance = 0;
    for (const p of queue) {
      if (p.x === 7 && p.y === 7) { distance = p.distance; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const next = { x: p.x + dx, y: p.y + dy, distance: p.distance + 1 };
        const key = tileKey(next);
        if (grid[next.y]?.[next.x] !== 0 || seen.has(key)) continue;
        seen.add(key);
        queue.push(next);
      }
    }
    const path = findPath(grid, { x: 0, y: 0 }, { x: 7, y: 7 });
    assert.equal(path.length, distance);
    let previous = { x: 0, y: 0 };
    for (const p of path) {
      assert.equal(grid[p.y][p.x], 0);
      assert.equal(Math.abs(p.x - previous.x) + Math.abs(p.y - previous.y), 1);
      previous = p;
    }
  }
});

test('all three enemies spawn safely and patrol', () => {
  const grid = generateMap(0);
  const enemies = spawnEnemies(grid);
  assert.deepEqual(enemies.map((e) => e.sprite), [0, 1, 2]);
  const player = { x: 48, y: 48 };
  const distances = enemies.map((e) => Math.abs(e.x - player.x) + Math.abs(e.y - player.y));
  updateEnemies(enemies, grid, player, [], 1);
  enemies.forEach((e, i) => {
    assert.equal(e.mode, 'patrol');
    assert.equal(Math.abs(e.x - player.x) + Math.abs(e.y - player.y), distances[i] - 48);
    assert.equal(grid[e.y / 48][e.x / 48], 0);
  });
  assert.equal(new Set(enemies.map(tileKey)).size, 3);
});

test('patrol reverses at corridor ends while the player is far away', () => {
  const enemy = spawnEnemies(generateMap(0))[0];
  enemy.x = 48; enemy.y = 0; enemy.moveTimer = 0;
  const grid = [[0, 0, 0]];
  const positions = [];
  for (let step = 0; step < 5; step++) {
    updateEnemies([enemy], grid, { x: 480, y: 480 }, [], 0.5);
    positions.push(enemy.x / 48);
  }
  assert.deepEqual(positions, [0, 1, 2, 1, 0]);
});

test('distance switches patrol to chase with hysteresis', () => {
  const enemy = spawnEnemies(generateMap(0))[0];
  enemy.x = 5 * 48; enemy.y = 0; enemy.moveTimer = 0;
  const grid = [Array(20).fill(0)];
  updateEnemies([enemy], grid, { x: 9 * 48, y: 0 }, [], 0.5);
  assert.equal(enemy.mode, 'chase');
  assert.equal(enemy.x, 6 * 48); // Pursuit overrides the initial leftward patrol.
  updateEnemies([enemy], grid, { x: 11 * 48, y: 0 }, [], 0.5);
  assert.equal(enemy.mode, 'chase');
  updateEnemies([enemy], grid, { x: 15 * 48, y: 0 }, [], 0.5);
  assert.equal(enemy.mode, 'patrol');
  assert.equal(enemy.x, 6 * 48);
});

test('patrol reverses at bombs and occupied cells', () => {
  for (const obstacle of ['bomb', 'enemy']) {
    const enemy = spawnEnemies(generateMap(0))[0];
    enemy.x = 48; enemy.y = 0; enemy.moveTimer = 0;
    const other = { ...enemy, x: 0, moveTimer: 10 };
    const enemies = obstacle === 'enemy' ? [enemy, other] : [enemy];
    const bombs = obstacle === 'bomb' ? [{ x: 0, y: 0, timer: 3 }] : [];
    updateEnemies(enemies, [[0, 0, 0]], { x: 480, y: 480 }, bombs, 0.5);
    assert.equal(enemy.x, 96);
  }
});

test('unreachable nearby player does not stop corridor patrol', () => {
  const enemy = spawnEnemies(generateMap(0))[0];
  enemy.x = 48; enemy.y = 0; enemy.moveTimer = 0;
  updateEnemies([enemy], [[0, 0, 0, 2, 0]], { x: 192, y: 0 }, [], 0.5);
  assert.equal(enemy.mode, 'chase');
  assert.equal(enemy.x, 0);
});

test('enemy waits for a blocked corridor and resumes when a bomb is removed', () => {
  const enemy = spawnEnemies(generateMap(0))[0];
  enemy.x = 0; enemy.y = 0; enemy.moveTimer = 0;
  const grid = [[0, 0, 0, 0]];
  const player = { x: 144, y: 0 };
  updateEnemies([enemy], grid, player, [{ x: 48, y: 0, timer: 3 }], 0.5);
  assert.equal(enemy.x, 0);
  updateEnemies([enemy], grid, player, [], 0.5);
  assert.equal(enemy.x, 48);
  assert.equal(isInExplosion(enemy, [{ tiles: [{ x: 1, y: 0 }], timer: 0.4 }]), true);
  assert.equal(isInExplosion(enemy, [{ tiles: [{ x: 2, y: 0 }], timer: 0.4 }]), false);
});

test('enemy approaches a player standing on a bomb without entering that cell', () => {
  const enemy = spawnEnemies(generateMap(0))[0];
  enemy.x = 0; enemy.y = 0; enemy.moveTimer = 0;
  const player = { x: 96, y: 0 };
  const bombs = [{ ...player, timer: 3 }];
  updateEnemies([enemy], [[0, 0, 0]], player, bombs, 0.5);
  assert.equal(enemy.x, 48);
  updateEnemies([enemy], [[0, 0, 0]], player, bombs, 0.5);
  assert.equal(enemy.x, 48);
});
