<script lang="ts">
  import { onMount } from 'svelte';
  import { GameEngine } from './game/engine';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const engine = new GameEngine(canvas);
    engine.start();
    return () => engine.destroy();
  });
</script>

<main>
  <canvas bind:this={canvas}></canvas>
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #111;
  }
</style>
