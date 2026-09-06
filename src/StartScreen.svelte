<script lang="ts">
  import logoImg from "../assets/Logo.png";
  import banditSprite from "../assets/Bandit.png";
  import bombSprite from "../assets/Bomb.png";
  import brickSprite from "../assets/Bricks.png";

  let {
    onPlay,
    onComplete,
    isExiting = false,
  }: {
    onPlay: () => void;
    onComplete: () => void;
    isExiting?: boolean;
  } = $props();

  type ModalType = null | "howToPlay" | "algorithms" | "credits";
  let activeModal = $state<ModalType>(null);

  function openModal(type: ModalType) {
    if (isExiting) return;
    activeModal = type;
  }

  function closeModal() {
    activeModal = null;
  }

  function handlePlayClick() {
    if (isExiting || activeModal !== null) return;
    onPlay();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (isExiting) return;

    if (activeModal !== null) {
      if (e.code === "Escape" || e.code === "Backspace") {
        e.preventDefault();
        closeModal();
      }
      return;
    }

    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      handlePlayClick();
    }
  }

  function handleAnimationEnd(e: AnimationEvent) {
    if (isExiting && e.target === e.currentTarget) {
      onComplete();
    }
  }

  $effect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        onComplete();
      }, 550);
      return () => clearTimeout(timer);
    }
  });
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
  class="overlay"
  class:is-exiting={isExiting}
  onanimationend={handleAnimationEnd}
>
  <!-- Menu Principal -->
  <div class="menu-container" class:is-hidden={activeModal !== null}>
    <div class="logo-wrapper">
      <img src={logoImg} alt="Bandit Boy" class="logo" />
    </div>

    <nav class="button-list">
      <button type="button" class="pixel-btn primary" onclick={onPlay}>
        JOGAR
      </button>
      <button
        type="button"
        class="pixel-btn"
        onclick={() => openModal("howToPlay")}
      >
        COMO JOGAR
      </button>
      <button
        type="button"
        class="pixel-btn"
        onclick={() => openModal("algorithms")}
      >
        ALGORITMOS
      </button>
      <button
        type="button"
        class="pixel-btn"
        onclick={() => openModal("credits")}
      >
        CRÉDITOS
      </button>
    </nav>

    <div class="hint-text">
      [ ENTER OU ESPAÇO PARA INICIAR ]
    </div>
  </div>

  <!-- Modal Informativo -->
  {#if activeModal !== null}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div
      class="modal-backdrop"
      onclick={closeModal}
      role="presentation"
    >
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
      <div
        class="modal-window"
        onclick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <header class="modal-header">
          {#if activeModal === "howToPlay"}
            <span class="modal-title">COMO JOGAR</span>
          {:else if activeModal === "algorithms"}
            <span class="modal-title">ALGORITMOS DE GRAFOS</span>
          {:else if activeModal === "credits"}
            <span class="modal-title">CRÉDITOS</span>
          {/if}
          <button
            type="button"
            class="close-btn"
            onclick={closeModal}
            aria-label="Fechar"
          >
            X
          </button>
        </header>

        <div class="modal-body">
          {#if activeModal === "howToPlay"}
            <div class="info-section">
              <div class="section-title">CONTROLES</div>
              <div class="control-row">
                <span class="key-combo">W A S D / SETAS</span>
                <span class="key-desc">Mover o Bandit pelo labirinto</span>
              </div>
              <div class="control-row">
                <span class="key-combo">ESPAÇO</span>
                <span class="key-desc">Plantar dinamite no chão</span>
              </div>
              <div class="control-row">
                <span class="key-combo">EMPURRÃO</span>
                <span class="key-desc">Ande contra a dinamite para chutá-la</span>
              </div>
            </div>

            <div class="info-section">
              <div class="section-title">OBJETIVO & DICAS</div>
              <div class="sprite-row">
                <img src={bombSprite} alt="Bomba" class="pixel-sprite" />
                <p>O pavio queima por 3 segundos antes de explodir em cruz (+). Fuja do raio de alcance!</p>
              </div>
              <div class="sprite-row">
                <img src={brickSprite} alt="Tijolos" class="pixel-sprite" />
                <p>Destrua blocos de tijolo para abrir novas passagens no tabuleiro.</p>
              </div>
              <div class="sprite-row">
                <img src={banditSprite} alt="Bandit" class="pixel-sprite" />
                <p>Você possui 3 corações de vida. Sobreviva o máximo de tempo possível!</p>
              </div>
            </div>

          {:else if activeModal === "algorithms"}
            <div class="info-section">
              <div class="section-title">MODELAGEM DO GRAFO G = (V, E)</div>
              <p class="section-text">
                O tabuleiro 15x13 é modelado como um Grafo Não-Direcionado:
              </p>
              <ul class="pixel-list">
                <li><strong>Vértices (V):</strong> Cada célula livre transitável do mapa.</li>
                <li><strong>Arestas (E):</strong> Conexões ortogonais livres (cima, baixo, esquerda, direita).</li>
                <li>Paredes de pedra são obstáculos estáticos e intransponíveis.</li>
              </ul>
            </div>

            <div class="info-section">
              <div class="section-title">DINÂMICA EM TEMPO REAL</div>
              <p class="section-text">
                Tijolos bloqueiam arestas temporariamente. Quando uma dinamite destrói um tijolo, novas arestas são inseridas no grafo em tempo de execução, recalculando instantaneamente a malha de caminhos!
              </p>
            </div>

            <div class="info-section">
              <div class="section-title">BUSCA EM LARGURA (BFS)</div>
              <p class="section-text">
                Algoritmo aplicado para determinação de caminhos mínimos (Shortest Path) em grafos não-ponderados, navegação de entidades e detecção de rotas de fuga seguras.
              </p>
              <div class="complexity-box">
                COMPLEXIDADE: O(|V| + |E|) TEMPO | O(|V|) ESPAÇO
              </div>
            </div>

          {:else if activeModal === "credits"}
            <div class="info-section">
              <div class="section-title">DESENVOLVEDORES</div>
              <div class="credit-row">
                <span class="author-name">Eduardo Lôbo Moreira</span>
                <span class="author-id">241011027</span>
              </div>
              <div class="credit-row">
                <span class="author-name">Hugo Freitas Silva</span>
                <span class="author-id">241041302</span>
              </div>
            </div>

            <div class="info-section">
              <div class="section-title">DISCIPLINA</div>
              <p class="section-text">
                Projeto de Algoritmos (PA 26.2) — Módulo de Grafos
                <br />
                Universidade de Brasília (UnB)
              </p>
            </div>

            <div class="info-section">
              <div class="section-title">TECNOLOGIAS</div>
              <p class="section-text">
                Svelte 5 (Runes) • TypeScript • HTML5 Canvas 2D
                <br />
                Pixel Art 16x16 (Escala 3x consistente, zero mixels)
              </p>
            </div>
          {/if}
        </div>

        <footer class="modal-footer">
          <button type="button" class="pixel-btn small" onclick={closeModal}>
            VOLTAR
          </button>
          <span class="esc-hint">[ ESC ]</span>
        </footer>
      </div>
    </div>
  {/if}
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;
    font-family: "Pixelify Sans", cursive, monospace;
    color: #fce8c8;
    animation: fadeIn 0.25s ease-out;
  }

  .overlay.is-exiting {
    pointer-events: none;
    animation: fadeOut 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes fadeOut {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.03);
    }
  }

  .menu-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 600px;
  }

  .menu-container.is-hidden {
    opacity: 0;
    pointer-events: none;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .logo-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
    filter: drop-shadow(0 9px 0 rgba(0, 0, 0, 0.75));
  }

  /* Logo: 200x100 em escala 3x = 600x300 px (Zero Mixels) */
  .logo {
    width: 600px;
    height: 300px;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    display: block;
  }

  .button-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  /* Botões em pixel art com passos de 3px */
  .pixel-btn {
    position: relative;
    width: 270px;
    height: 48px;
    padding: 0;
    font-family: "Pixelify Sans", cursive, monospace;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #fce8c8;
    background: #2a1b12;
    border: 3px solid #000000;
    border-radius: 0;
    box-shadow:
      inset 3px 3px 0 #543320,
      inset -3px -3px 0 #130a06,
      0 6px 0 #000000;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    image-rendering: pixelated;
    transition: none;
  }

  .pixel-btn:hover {
    background: #422818;
    color: #ffffff;
    box-shadow:
      inset 3px 3px 0 #73452b,
      inset -3px -3px 0 #1c0f09,
      0 6px 0 #000000;
  }

  .pixel-btn:active {
    transform: translateY(6px);
    box-shadow:
      inset 3px 3px 0 #130a06,
      inset -3px -3px 0 #543320,
      0 0 0 #000000;
  }

  .pixel-btn.primary {
    background: #d46816;
    color: #ffffff;
    box-shadow:
      inset 3px 3px 0 #f5a338,
      inset -3px -3px 0 #7d3305,
      0 6px 0 #000000;
  }

  .pixel-btn.primary:hover {
    background: #e87b28;
    box-shadow:
      inset 3px 3px 0 #ffbc5e,
      inset -3px -3px 0 #943d07,
      0 6px 0 #000000;
  }

  .pixel-btn.primary:active {
    transform: translateY(6px);
    box-shadow:
      inset 3px 3px 0 #7d3305,
      inset -3px -3px 0 #f5a338,
      0 0 0 #000000;
  }

  .pixel-btn.small {
    width: 150px;
    height: 39px;
    font-size: 20px;
  }

  .hint-text {
    margin-top: 24px;
    font-size: 15px;
    font-weight: 600;
    color: #d8af84;
    letter-spacing: 0.6px;
    text-shadow: 0 3px 0 #000000;
  }

  /* Modais Informativos */
  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(8, 8, 10, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20;
    animation: fadeIn 0.15s ease-out;
  }

  .modal-window {
    width: 540px;
    max-height: 570px;
    background: #1c130d;
    border: 3px solid #000000;
    box-shadow:
      inset 3px 3px 0 #4d2f1b,
      inset -3px -3px 0 #0a0604,
      0 9px 0 #000000;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #2b1a11;
    border-bottom: 3px solid #000000;
    padding: 9px 15px;
    box-shadow: inset 0 3px 0 #4d2f1b;
  }

  .modal-title {
    font-size: 24px;
    font-weight: 700;
    color: #f5a338;
    letter-spacing: 0.6px;
    text-shadow: 0 3px 0 #000000;
  }

  .close-btn {
    background: #7d1810;
    border: 3px solid #000000;
    color: #ffffff;
    font-family: inherit;
    font-size: 18px;
    font-weight: 700;
    width: 33px;
    height: 33px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow:
      inset 3px 3px 0 #a9291f,
      inset -3px -3px 0 #420a06;
  }

  .close-btn:hover {
    background: #962016;
  }

  .close-btn:active {
    transform: translateY(3px);
  }

  .modal-body {
    padding: 18px 21px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    overflow-y: auto;
    font-size: 16px;
    line-height: 1.35;
    color: #ecd2b0;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: #f8c050;
    border-bottom: 3px solid #332014;
    padding-bottom: 3px;
    letter-spacing: 0.5px;
  }

  .section-text {
    margin: 0;
  }

  .control-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #25170f;
    border: 3px solid #000000;
    padding: 6px 12px;
  }

  .key-combo {
    font-weight: 700;
    color: #ffffff;
    background: #3a2215;
    border: 3px solid #543320;
    padding: 3px 9px;
    font-size: 15px;
  }

  .key-desc {
    font-size: 15px;
    color: #d8af84;
  }

  .sprite-row {
    display: flex;
    align-items: center;
    gap: 15px;
    background: #25170f;
    border: 3px solid #000000;
    padding: 6px 12px;
  }

  .sprite-row p {
    margin: 0;
    font-size: 15px;
  }

  /* Sprites 16x16 em escala 3x = 48x48 px (Zero Mixels) */
  .pixel-sprite {
    width: 48px;
    height: 48px;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    flex-shrink: 0;
  }

  .pixel-list {
    margin: 0;
    padding-left: 21px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .complexity-box {
    margin-top: 6px;
    background: #2a1508;
    border: 3px solid #f5a338;
    color: #ffbc5e;
    font-weight: 700;
    font-size: 15px;
    padding: 6px 12px;
    text-align: center;
  }

  .credit-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #25170f;
    border: 3px solid #000000;
    padding: 6px 12px;
  }

  .author-name {
    font-weight: 700;
    color: #ffffff;
  }

  .author-id {
    color: #f5a338;
    font-weight: 700;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 21px;
    background: #25170f;
    border-top: 3px solid #000000;
  }

  .esc-hint {
    font-size: 15px;
    font-weight: 600;
    color: #a67c52;
  }
</style>
