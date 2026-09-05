<script lang="ts">
  import { onMount } from "svelte";
  import { GameEngine } from "./game/engine";
  import GameOver from "./GameOver.svelte";
  import type { GameOverStats } from "./game/types";

  let canvas: HTMLCanvasElement;
  let engine: GameEngine | null = null;
  let isGameOver = $state(false);
  let gameOverStats = $state<GameOverStats | null>(null);

  onMount(() => {
    engine = new GameEngine(canvas);
    engine.onGameOver = (stats) => {
      isGameOver = true;
      gameOverStats = stats;
    };
    engine.start();
    return () => engine?.destroy();
  });

  function handleRestart() {
    isGameOver = false;
    gameOverStats = null;
    engine?.restart();
  }
</script>

<main>
  <div class="bg-overlay"></div>
  <canvas bind:this={canvas} class:is-gameover={isGameOver}></canvas>

  {#if isGameOver && gameOverStats}
    <GameOver stats={gameOverStats} onRestart={handleRestart} />
  {/if}
</main>

<style>
  main {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    overflow: hidden;
    background: #08080a;
  }

  .bg-overlay {
    position: absolute;
    inset: -30px;
    background: url("../assets/bg.png") no-repeat center center;
    background-size: cover;
    filter: blur(14px) brightness(0.25) contrast(1.1);
    transform: scale(1.05);
    pointer-events: none;
    z-index: 0;
  }

  canvas {
    position: relative;
    z-index: 1;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.8));
    transition: filter 0.4s ease;
  }

  canvas.is-gameover {
    filter: blur(14px) brightness(0.25) contrast(1.1) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.8));
  }
</style>
