<script lang="ts">
  import type { GameOverStats } from "./game/types";
  import goParchment from "../assets/go.png";
  import banditSprite from "../assets/Bandit.png";
  import enemySprite from "../assets/Enemy1.png";
  import bombSprite from "../assets/Bomb.png";
  import brickSprite from "../assets/Bricks.png";

  let { stats, onRestart }: { stats: GameOverStats; onRestart: () => void } = $props();

  function handleKeyDown(e: KeyboardEvent) {
    if (e.code === "Space" || e.code === "KeyR" || e.code === "Enter") {
      e.preventDefault();
      onRestart();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="overlay">
  <div class="parchment">
    <img src={goParchment} alt="" class="bg" />

    <header>
      <h1>Querido diário,</h1>
      <p>hoje eu morri,</p>
      <p>deixo tudo pro meu cão.</p>
    </header>

    <div class="killer-text">
      <span>Fui morto por</span>
      <span class="arrow">esta coisa ➜</span>
    </div>

    <div class="killer-frame">
      <img src={stats.killerSprite || bombSprite} alt={stats.killerName} />
      <span>{stats.killerName}</span>
    </div>

    <section class="records">
      <h2>Meus pertences / registros:</h2>
      <ul>
        <li>
          <div>
            <img src={banditSprite} alt="" />
            <span>Pontos:</span>
          </div>
          <span>{stats.score ?? 0}</span>
        </li>
        <li>
          <div>
            <img src={enemySprite} alt="" />
            <span>Inimigos:</span>
          </div>
          <span>{stats.enemiesKilled ?? 0}</span>
        </li>
        <li>
          <div>
            <img src={bombSprite} alt="" />
            <span>Dinamites:</span>
          </div>
          <span>{stats.bombsPlaced}</span>
        </li>
        <li>
          <div>
            <img src={brickSprite} alt="" />
            <span>Tijolos:</span>
          </div>
          <span>{stats.blocksDestroyed}</span>
        </li>
      </ul>
    </section>

    <p class="farewell">adeus mundo cruel! xoxo</p>

    <footer class="actions">
      <button type="button" onclick={onRestart}>RECOMEÇAR</button>
      <span>[ ESPAÇO ou ENTER ]</span>
    </footer>
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    background: radial-gradient(
      circle at center,
      rgba(8, 8, 10, 0.45) 0%,
      rgba(8, 8, 10, 0.88) 100%
    );
    backdrop-filter: blur(4px);
    user-select: none;
    animation: fadeIn 0.25s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .parchment {
    position: relative;
    width: 408px;
    height: 472px;
    padding: 24px 28px 22px 28px;
    box-sizing: border-box;
    font-family: "Pixelify Sans", cursive, monospace;
    color: #26160e;
    filter: drop-shadow(0 16px 30px rgba(0, 0, 0, 0.9));
    animation: dropIn 0.3s ease-out;
  }

  @keyframes dropIn {
    from {
      opacity: 0;
      transform: translateY(-12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
  }

  img {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }

  header {
    line-height: 1.05;
    margin-bottom: 2px;
  }

  h1 {
    margin: 0;
    font-size: 48px;
    font-weight: 700;
    letter-spacing: -0.8px;
    line-height: 1;
  }

  header p {
    margin: 1px 0 0;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.15;
    white-space: nowrap;
  }

  .killer-text {
    position: absolute;
    left: 28px;
    top: 154px;
    display: flex;
    flex-direction: column;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.3;
  }

  .arrow {
    color: #7d1810;
  }

  .killer-frame {
    position: absolute;
    left: 202px;
    top: 143px;
    width: 140px;
    height: 108px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    pointer-events: none;
  }

  .killer-frame img {
    width: 32px;
    height: 32px;
  }

  .killer-frame span {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  .records {
    margin-top: 116px;
    width: 100%;
  }

  .records h2 {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 700;
    color: #3d2618;
    letter-spacing: -0.2px;
  }

  .records ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .records li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 15px;
    font-weight: 600;
  }

  .records li div {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .records li img {
    width: 24px;
    height: 24px;
  }

  .records li > span {
    font-size: 16px;
    font-weight: 700;
    text-align: right;
    min-width: 54px;
  }

  .farewell {
    position: absolute;
    bottom: 64px;
    left: 28px;
    right: 28px;
    margin: 0;
    font-size: 13px;
    font-style: italic;
    text-align: center;
    letter-spacing: -0.2px;
  }

  .actions {
    position: absolute;
    bottom: 22px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }

  .actions button {
    background: none;
    border: none;
    font: inherit;
    font-size: 18px;
    font-weight: 700;
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-thickness: 2px;
    cursor: pointer;
    padding: 2px 10px;
    letter-spacing: 0.3px;
    transition: transform 0.1s ease, color 0.1s ease;
  }

  .actions button:hover {
    color: #7d1810;
    transform: scale(1.05);
  }

  .actions span {
    font-size: 12px;
    font-weight: 600;
    color: #422a1c;
    letter-spacing: 0.4px;
  }
</style>
