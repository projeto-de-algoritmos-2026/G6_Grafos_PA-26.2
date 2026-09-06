# Definir escopo do Bomberman: sprites, algoritmos de menor caminho e inimigos

## Objetivo

Definir os detalhes do Bomberman da disciplina de Projeto de Algoritmos, com algoritmos de menor caminho em grafos para movimentar os inimigos.

## Base já implementada

Referência: commit `106359a6cf1efc897d5d877dbe870dc8ffffa11c`.

- Svelte 5, TypeScript, Vite e HTML5 Canvas.
- Mapa 15 × 13 com células de 48 px, paredes, blocos e espaços vazios (`src/game/constants.ts`).
- Geração aleatória de blocos com densidade padrão de 0,65, bordas e pilares fixos e área inicial livre para o jogador (`src/game/map.ts`).
- `getNeighbors` retorna células vazias nas quatro direções e serve como base para percorrer o grafo.
- Movimentação por WASD/setas, colisões e renderização por retângulos coloridos (`src/game/engine.ts`).
- Ainda não há sprites, inimigos, busca de caminhos, bombas, explosões ou destruição de blocos implementados.

## Decisões pendentes

### Escopo e regras

- [ ] Definir uma arena ou múltiplas fases, objetivo, vitória e derrota.
- [ ] Definir tecla das bombas, quantidade simultânea, tempo de explosão, alcance e interação com paredes e blocos.
- [ ] Definir dano, vidas e reinício.
- [ ] Decidir se itens, melhorias e progressão entram na primeira entrega.

### Sprites

- [ ] Escolher estilo visual e origem dos recursos, registrando licença e créditos.
- [ ] Listar sprites de jogador, tipos de inimigos, chão, paredes, blocos, bombas e explosões.
- [ ] Definir dimensões e escala considerando células de 48 × 48 px.
- [ ] Definir animações mínimas e organização dos arquivos para substituir os retângulos no Canvas.

### Grafo e algoritmos de menor caminho

- [ ] Confirmar células transitáveis como vértices e movimentos ortogonais como arestas, aproveitando `getNeighbors`.
- [ ] Escolher algoritmos e justificar a relação com o conteúdo da disciplina. Alternativas para discussão:
  - BFS para menor caminho em número de movimentos com custos uniformes.
  - Dijkstra caso existam custos diferentes, definindo os pesos utilizados.
  - A* para busca orientada ao jogador, considerando distância de Manhattan como heurística na grade ortogonal.
- [ ] Decidir entre algoritmo comum ou tipos de inimigos com estratégias distintas.
- [ ] Definir quando recalcular caminhos e como tratar alterações no mapa, bombas e explosões.
- [ ] Definir comportamento quando não houver caminho até o jogador.
- [ ] Definir conversão do caminho em células para a movimentação do motor atual.

### Quantidade e comportamento dos inimigos

- [ ] Fixar quantidade inicial por partida e máximo simultâneo.
- [ ] Definir número de tipos, algoritmos, velocidades e comportamentos de perseguição, patrulha ou fuga.
- [ ] Definir posições de nascimento, distância mínima do jogador e áreas livres necessárias.
- [ ] Tratar inimigos isolados por blocos: o mapa aleatório atual não garante conexão entre todas as áreas livres.
- [ ] Definir colisões entre inimigos, contato com o jogador e reação às bombas.
- [ ] Decidir se haverá reaparecimento ou aumento da quantidade por fase.

### Demonstração acadêmica

- [ ] Documentar modelagem, funcionamento e complexidade dos algoritmos escolhidos.
- [ ] Decidir se serão exibidos caminhos, células visitadas ou métricas de busca.
- [ ] Planejar cenários com caminho livre, desvio de obstáculos, destino inacessível e atualização após destruição de blocos.
- [ ] Caso haja comparação, usar cenários iguais e métricas de custo do caminho, vértices explorados e tempo de busca.

## Critério de conclusão

Registrar no README ou em documento de projeto o escopo da primeira entrega, sprites e suas origens, algoritmos e justificativas, quantidade inicial e máxima de inimigos, tipos e comportamentos, além do plano de implementação e demonstração com tarefas derivadas.

As alternativas são pontos para discussão; os algoritmos e a quantidade de inimigos permanecem em aberto até a definição do grupo.
