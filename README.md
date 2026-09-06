<p align="center">
  <img src="./assets/Logo.png" alt="Bandit Boy - Bomberman 2D" width="380" />
</p>

<p align="center">
  <b>Projeto de Algoritmos — Módulo de Grafos 1 | Grupo 6</b><br>
  Universidade de Brasília (UnB)
</p>

---

## Integrantes da Dupla

| Matrícula | Aluno | GitHub |
| :--- | :--- | :--- |
| **241011027** | Eduardo Lôbo Moreira | [@EduLoboM](https://github.com/EduLoboM) |
| **241041302** | Hugo Freitas Silva | [@HugoFreitass](https://github.com/HugoFreitass) |

---

## Sobre o Jogo

Implementação de Bomberman 2D no navegador desenvolvida com Svelte 5 (Runes), TypeScript e HTML5 Canvas. O projeto une a jogabilidade arcade com aplicação prática de Teoria dos Grafos, utilizando o algoritmo A* (A-Estrela) orientado por distância de Manhattan para movimentação inteligente dos inimigos pelo labirinto.

Toda a arte foi construída em Pixel Art 16×16 ampliada em 3× (células de 48 × 48 px) sem interpolação de escala (zero mixels), acompanhada de efeitos de partículas.

---

## Controles

| Tecla / Comando | Ação no Jogo |
| :--- | :--- |
| **`W` `A` `S` `D`** ou **`Setas`** | Movimentar o Bandit pelo tabuleiro |
| **`Espaço`** | Plantar dinamite no chão (pavio queima por 3s) |
| **`G`** | **Ativar / desativar Modo de Inspeção de Grafos e A\*** |

---

## Modo de Inspeção de Grafos (Tecla `G`)

Pressionando a tecla **`G`** a qualquer momento durante a partida, o jogo ativa a camada visual de depuração do grafo diretamente no Canvas:

- **Vértices ($V$):** Marcadores no centro de cada célula transitável.
- **Arestas ($E$):** Conexões ortogonais ativas entre células livres vizinhas.
- **Área de Expansão (Nós Visitados):** Trajetórias que o algoritmo explorou na busca, desenhadas como um caminho conectado em amarelo dourado.
- **Rota Planejada:** Traçado ortogonal destacado na cor de cada monstro conectando-o até o jogador.
- **Painel de Métricas:** Métricas em tempo real logo abaixo do labirinto exibindo quantidade de nós expandidos, tempo de execução da busca e passos da rota.

---

## Mecânicas do Jogo

### Mapas

O mapa mantém a grade clássica de pilares indestrutíveis com blocos destrutíveis distribuídos aleatoriamente. Cada célula elegível tem 45% de chance de receber um bloco, deixando corredores livres para circulação. Os quatro cantos contam com saídas em L com duas células livres em cada direção para movimentação inicial e fuga das bombas.

### Saída e Níveis

Cada fase possui uma saída secreta oculta sob um bloco de tijolo aleatório. Destrua o bloco com uma bomba para revelar a porta e elimine os três slimes para destrancá-la (`closed.png` $\to$ `open.png`). Ao entrar na porta aberta, um vórtice pixel art transporta o jogador para o próximo nível com um novo mapa, novos inimigos e transição de cores (*hue shift*), preservando os corações restantes.

### Inimigos e Inteligência com A*

Os três inimigos surgem nos cantos opostos do mapa e patrulham os corredores a cada 0,45s após uma espera inicial de 1s:

- **Patrulha:** Longe do jogador, navegam pelo labirinto sorteando caminhos livres nas bifurcações e encruzilhadas, invertendo o sentido apenas em becos sem saída.
- **Perseguição:** A perseguição inicia a até 4 células de distância Manhattan e termina acima de 6 células (evitando alternâncias na borda).
- **Desvio de Obstáculos:** O $A^*$ recalcula o trajeto a cada passo, tratando paredes, tijolos, bombas e outros monstros como bloqueios temporários.
- **Heurística de Manhattan:** $h(n) = |x_n - x_{\text{alvo}}| + |y_n - y_{\text{alvo}}|$, ótima e admissível para malha ortogonal, garantindo o menor caminho sem superestimar custos.

---

## Vídeo de Apresentação

- **Vídeo no YouTube:** [Apresentação do Projeto](https://youtu.be/)

---

## Como Rodar

### Pré-requisitos

- Node.js (v18 ou superior) e npm.

### Comandos

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse em: `http://localhost:5173/`

Verificação de integridade e tipos (TypeScript + Svelte):

```bash
npm run check
```

Geração de build de produção:

```bash
npm run build
```

Deploy no GitHub Pages:

```bash
npm run deploy
```

---

## Participação

O projeto foi desenvolvido em colaboração contínua (*pair programming*), com ambos os integrantes atuando em conjunto em todas as etapas: modelagem e algoritmo de grafos, motor do jogo, arte e documentação.

---

## Tecnologias

- **Framework:** Svelte 5 (Runes: `$state`, `$derived`, `$effect`)
- **Linguagem:** TypeScript
- **Renderização:** HTML5 Canvas 2D (`imageSmoothingEnabled = false`, escala nativa 3x)
- **Build Tool:** Vite
- **Arte:** Pixel Art própria 16×16 sem mixels
