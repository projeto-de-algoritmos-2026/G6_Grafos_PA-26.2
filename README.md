# Bomberman 2D - Grafos | Grupo 6

- Eduardo Lôbo Moreira | 241011027
- Hugo Freitas Silva | 241041302

Implementação de Bomberman 2D no navegador desenvolvida com Svelte 5, TypeScript e HTML5 Canvas.

## Como rodar

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Build de produção:

```bash
npm run build
```

## Inimigos e A*

Os três inimigos usam os sprites `Enemy1.png`, `Enemy2.png` e `Enemy3.png`.
Eles surgem nos outros três cantos do mapa e patrulham os corredores, com um passo
a cada 0,45 segundo após uma espera inicial de 1 segundo.

O A* em `src/game/pathfinding.ts` usa distância Manhattan e custo unitário
para os quatro vizinhos de cada célula. A rota é recalculada a cada passo,
considerando paredes, blocos, bombas e outros inimigos como obstáculos.
Longe do jogador, andam de um lado para o outro, invertendo a direção ao encontrar
obstáculos. A perseguição começa a até 4 células de distância Manhattan e termina
acima de 6 células, evitando alternâncias constantes na borda do alcance.
Quando não há caminho até o jogador, continuam patrulhando as células livres.
Se estiverem completamente cercados, aguardam uma passagem ser liberada.
Se o jogador estiver sobre uma bomba, o inimigo tenta chegar a uma célula adjacente.

O contato tira um coração, respeitando a invulnerabilidade do jogador.
Explosões eliminam inimigos; ao morrer, o jogador reinicia o mapa com os três
inimigos novamente. Use WASD ou as setas para mover e espaço para colocar bombas.

## Verificação

```bash
npm run check
npm test
```

Os testes usam Node.js 24 ou superior e verificam rotas do A* contra uma busca
em largura em 100 mapas, além de obstáculos e movimentação dos inimigos.
