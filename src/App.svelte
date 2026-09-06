<script lang="ts">
  import { onMount } from "svelte";
  import { GameEngine } from "./game/engine";
  import { getLevelHueOffset } from "./game/constants";
  import StartScreen from "./StartScreen.svelte";
  import GameOver from "./GameOver.svelte";
  import type { GameOverStats } from "./game/types";

  type GameState = "menu" | "starting" | "playing" | "gameover";

  let canvas: HTMLCanvasElement;
  let engine: GameEngine | null = null;
  let gameState = $state<GameState>("menu");
  let gameOverStats = $state<GameOverStats | null>(null);
  let currentLevel = $state(1);

  let bgHue = $derived(getLevelHueOffset(currentLevel));

  onMount(() => {
    engine = new GameEngine(canvas);
    engine.onGameOver = (stats) => {
      gameState = "gameover";
      gameOverStats = stats;
    };
    engine.onLevelChange = (level) => {
      currentLevel = level;
    };
    engine.start();
    return () => engine?.destroy();
  });

  function handlePlayStart() {
    if (gameState !== "menu") return;
    gameState = "starting";
  }

  function handlePlayComplete() {
    gameState = "playing";
    engine?.startPlay();
  }

  function handleRestart() {
    gameState = "playing";
    gameOverStats = null;
    engine?.restart();
  }
</script>

<main>
  <div
    class="bg-overlay"
    style="filter: blur(14px) brightness(0.25) contrast(1.1) hue-rotate({bgHue}deg);"
  ></div>
  <canvas
    bind:this={canvas}
    class:is-blurred={gameState === "menu" || gameState === "gameover"}
  ></canvas>

  {#if gameState === "menu" || gameState === "starting"}
    <StartScreen
      onPlay={handlePlayStart}
      onComplete={handlePlayComplete}
      isExiting={gameState === "starting"}
    />
  {:else if gameState === "gameover" && gameOverStats}
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
    transition: filter 0.8s ease;
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
    transition: filter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  canvas.is-blurred {
    filter: blur(14px) brightness(0.25) contrast(1.1) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.8));
  }
</style>
