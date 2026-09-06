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

Implementação de Bomberman 2D no navegador desenvolvida com Svelte 5 (Runes), TypeScript e HTML5 Canvas. O projeto une a jogabilidade arcade com aplicação prática de Teoria dos Grafos, comparando os algoritmos **Dijkstra** (busca uniforme, não-informada) e **A\*** (busca informada orientada pela distância de Manhattan) para movimentação dos inimigos pelo labirinto, implementados sem bibliotecas externas.

Toda a arte foi construída em Pixel Art 16×16 ampliada em 3× (células de 48 × 48 px) sem interpolação de escala, acompanhada de efeitos de partículas e rotação de paleta cromática a cada fase.

---

## Controles

| Tecla / Comando | Ação no Jogo |
| :--- | :--- |
| **`W` `A` `S` `D`** ou **`Setas`** | Movimentar o Bandit pelo tabuleiro |
| **`Espaço`** | Plantar dinamite no chão (pavio queima por 3s) |
| **`G`** | **Ativar / desativar Modo de Inspeção de Grafos (Vértices, Arestas e Nós Explorados)** |

---

## Modo de Inspeção de Grafos (Tecla `G`)

Pressionando a tecla **`G`** a qualquer momento durante a partida, o jogo ativa a camada visual de depuração do grafo diretamente no Canvas:

- **Vértices ($V$):** Marcadores no centro de cada célula transitável.
- **Arestas ($E$):** Conexões ortogonais ativas entre células livres vizinhas.
- **Área de Expansão (Nós Visitados):** Células exploradas pelo algoritmo na busca até o jogador.
- **Rota Planejada:** Traçado ortogonal do slime até o jogador.
- **Painel de Métricas:** Métricas em tempo real logo abaixo do labirinto exibindo o algoritmo ativo, quantidade de nós expandidos, tempo de execução da busca e passos da rota.

---

## Mecânicas do Jogo

### Mapas

O mapa mantém a grade clássica de pilares indestrutíveis com blocos destrutíveis distribuídos aleatoriamente. Cada célula elegível tem 45% de chance de receber um bloco, deixando corredores livres para circulação. Os quatro cantos contam com saídas em L com duas células livres em cada direção para movimentação inicial e fuga das bombas.

### Saída e Níveis

Cada fase possui uma saída secreta oculta sob um bloco de tijolo aleatório. Destrua o bloco com uma bomba para revelar a porta e elimine todos os slimes para destrancá-la (`closed.png` $\to$ `open.png`). Ao entrar na porta aberta, o jogador avança para o próximo nível com um novo mapa, progressão na quantidade de inimigos e transição de cores do cenário, preservando a vida restante.

### Inimigos e Algoritmos de Menor Caminho (Dijkstra vs A*)

A quantidade de slimes progride a cada fase (inicia com 3 e ganha +1 slime por nível, ciclando 7 cores distintas). As fases alternam automaticamente os algoritmos: **as fases ímpares usam Dijkstra e as fases pares usam A\***:

- **Modelagem:** Ambos os algoritmos foram implementados em TypeScript modelando a grade como grafo ortogonal com conjuntos aberto (`open`), fechado (`closed`), custos acumulados ($g(n)$) e predecessores (`parents`).
- **Dijkstra (Fases Ímpares):** Busca uniforme com $h(n) = 0$ ($f(n) = g(n)$). Expande nós radialmente a partir da origem cobrindo a grade até alcançar o jogador.
- **A\* com Heurística de Manhattan (Fases Pares):** Busca informada com $f(n) = g(n) + h(n)$, onde $h(n) = |x_n - x_{\text{alvo}}| + |y_n - y_{\text{alvo}}|$. Como a distância de Manhattan é uma heurística admissível e consistente em grades ortogonais sem diagonais, o algoritmo garante a rota ótima explorando substancialmente menos vértices.
- **Patrulha e Perseguição:** Longe do jogador, os slimes patrulham livremente; ao se aproximarem a 4 células de distância Manhattan, iniciam a perseguição recalculando o caminho a cada passo e desviando de obstáculos e bombas.

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
