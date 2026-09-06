<script lang="ts">
  import { onMount } from "svelte";
  import { GameEngine } from "./game/engine";
  import { getLevelHueOffset } from "./game/constants";
  import StartScreen from "./StartScreen.svelte";
  import GameOver from "./GameOver.svelte";
  import type { GameOverStats, GraphMetricsStats } from "./game/types";

  type GameState = "menu" | "starting" | "playing" | "gameover";

  let canvas: HTMLCanvasElement;
  let engine: GameEngine | null = null;
  let gameState = $state<GameState>("menu");
  let gameOverStats = $state<GameOverStats | null>(null);
  let currentLevel = $state(1);
  let graphStats = $state<GraphMetricsStats | null>(null);

  let bgHue = $derived(getLevelHueOffset(currentLevel));
  let themeColor = $derived(`hsl(${(48 + bgHue) % 360}, 96%, 54%)`);

  onMount(() => {
    engine = new GameEngine(canvas);
    engine.onGameOver = (stats) => {
      gameState = "gameover";
      gameOverStats = stats;
    };
    engine.onLevelChange = (level) => {
      currentLevel = level;
    };
    engine.onGraphStatsUpdate = (stats) => {
      graphStats = stats;
    };
    engine.start();
    (window as any).__engine = engine;
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
    gameState = "menu";
    gameOverStats = null;
    engine?.resetToMenu();
  }
</script>

<main>
  <div
    class="bg-overlay"
    style="filter: blur(14px) brightness(0.25) contrast(1.1) hue-rotate({bgHue}deg);"
  ></div>

  <div class="game-wrapper">
    <canvas
      bind:this={canvas}
      class:is-blurred={gameState === "menu" || gameState === "gameover"}
    ></canvas>

    {#if graphStats?.show && gameState === "playing"}
      <div
        class="graph-modal-bar"
        style="--theme-color: {themeColor};"
      >
        <div class="modal-info">
          <span class="modal-tag">[G] GRAFO & A*</span>
          <span class="modal-stat">NÓS EXPANDIDOS: <strong>{graphStats.totalExpanded}</strong></span>
          <span class="modal-sep">|</span>
          <span class="modal-stat">TEMPO: <strong>{graphStats.maxTime.toFixed(2)}ms</strong></span>
          <span class="modal-sep">|</span>
          <span class="modal-stat">ROTA: <strong>{graphStats.pathLenStr}</strong></span>
        </div>
        <button
          class="modal-close-btn"
          onclick={() => engine?.toggleGraphOverlay()}
          type="button"
        >
          [G] OCULTAR
        </button>
      </div>
    {/if}
  </div>

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
    transform: scale(1.05);
    pointer-events: none;
    z-index: 0;
  }

  .game-wrapper {
    position: relative;
    width: 720px;
    height: 672px;
    display: flex;
    justify-content: center;
    align-items: center;
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

  .graph-modal-bar {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    width: 720px;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
    background: transparent;
    border: none;
    box-shadow: none;
    z-index: 5;
    font-family: "Pixelify Sans", cursive, monospace;
    animation: modalFade 0.15s ease-out;
  }

  @keyframes modalFade {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.95), 0 0 3px rgba(0, 0, 0, 0.9);
  }

  .modal-tag {
    color: var(--theme-color, #facc15);
    letter-spacing: 0.5px;
    transition: color 0.4s ease;
  }

  .modal-stat {
    color: #cbd5e1;
  }

  .modal-stat strong {
    color: #ffffff;
  }

  .modal-sep {
    color: var(--theme-color, #facc15);
    transition: color 0.4s ease;
  }

  .modal-close-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    padding: 2px 4px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.95);
    transition: color 0.2s ease;
  }

  .modal-close-btn:hover {
    color: var(--theme-color, #ffffff);
  }
</style>
