import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

// Transpile the engine's constructor parameter property and stub image imports.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.endsWith('.ts') && specifier.startsWith('.') && !/\.(ts|png)$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.png')) return { format: 'module', source: `export default ${JSON.stringify(url)}`, shortCircuit: true };
    if (url.endsWith('.ts')) {
      const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
      }).outputText;
      return { format: 'module', source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
const { GameEngine } = await import('../src/game/engine.ts');
const { hideExit, isExitRevealed, canLeaveLevel } = await import('../src/game/level.ts');
const { generateMap } = await import('../src/game/map.ts');

function createEngine() {
  const previous = globalThis.Image;
  globalThis.Image = class { src = ''; };
  try {
    return new GameEngine({ getContext: () => ({}) });
  } finally {
    if (previous === undefined) delete globalThis.Image;
    else globalThis.Image = previous;
  }
}

test('an empty map still hides its exit under a block away from spawn', () => {
  const grid = generateMap(0);
  const exit = hideExit(grid);
  assert.equal(grid[exit.y][exit.x], 2);
  assert.equal(grid.flat().filter((cell) => cell === 2).length, 1);
  assert.equal(grid[1][1], 0);
  assert.equal(isExitRevealed(grid, exit), false);
});

test('exit requires a destroyed block, no enemies, and the player on its tile', () => {
  const grid = generateMap(0);
  const exit = hideExit(grid);
  const player = { x: exit.x * 48, y: exit.y * 48 };
  assert.equal(canLeaveLevel(grid, exit, player, 0), false);
  grid[exit.y][exit.x] = 0;
  assert.equal(canLeaveLevel(grid, exit, player, 1), false);
  assert.equal(canLeaveLevel(grid, exit, { x: 48, y: 48 }, 0), false);
  assert.equal(canLeaveLevel(grid, exit, player, 0), true);
});

test('bomb destruction reveals the exit and further explosions preserve it', () => {
  const engine = createEngine();
  engine.grid = generateMap(0);
  engine.exit = { x: 3, y: 3 };
  engine.grid[3][3] = 2;
  const bomb = { x: 2 * 48, y: 3 * 48, timer: 0 };
  engine.explodeBomb(bomb);
  assert.equal(isExitRevealed(engine.grid, engine.exit), true);
  engine.explodeBomb(bomb);
  assert.equal(isExitRevealed(engine.grid, engine.exit), true);
});

test('entering an unlocked exit advances once, preserves health and resets map entities', () => {
  const engine = createEngine();
  const oldGrid = engine.grid;
  engine.grid[engine.exit.y][engine.exit.x] = 0;
  engine.x = engine.exit.x * 48;
  engine.y = engine.exit.y * 48;
  engine.enemies = [];
  engine.health = 2;
  engine.bombs = [{ x: 48, y: 48, timer: 3 }];
  engine.particles = [{ life: 1 }];
  engine.scorchMarks = [{ life: 1 }];
  engine.update(0);
  assert.equal(engine.level, 2);
  assert.equal(engine.health, 2);
  assert.equal(engine.x, 48);
  assert.equal(engine.y, 48);
  assert.notEqual(engine.grid, oldGrid);
  assert.equal(engine.enemies.length, 3);
  assert.equal(isExitRevealed(engine.grid, engine.exit), false);
  for (const key of ['bombs', 'explosions', 'particles', 'scorchMarks']) assert.equal(engine[key].length, 0);
  engine.update(0);
  assert.equal(engine.level, 2);
});

test('exit waits for arrival animation and active flames', () => {
  const engine = createEngine();
  engine.grid[engine.exit.y][engine.exit.x] = 0;
  engine.x = engine.exit.x * 48;
  engine.y = engine.exit.y * 48;
  engine.enemies = [];
  engine.animTimer = 0.14;
  engine.update(0);
  assert.equal(engine.level, 1);
  engine.animTimer = 0;
  engine.explosions = [{ tiles: [engine.exit], timer: 0.45 }];
  engine.update(0);
  assert.equal(engine.level, 1);
  assert.equal(engine.health, 2);
  engine.explosions = [];
  engine.update(0);
  assert.equal(engine.level, 2);
});

test('death restarts the campaign at level one with full health and a hidden exit', () => {
  const engine = createEngine();
  engine.level = 4;
  engine.health = 1;
  engine.takeDamage();
  assert.equal(engine.level, 1);
  assert.equal(engine.health, 3);
  assert.equal(engine.enemies.length, 3);
  assert.equal(isExitRevealed(engine.grid, engine.exit), false);
});
