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

## Mapas

O mapa mantém a grade clássica de pilares indestrutíveis, com blocos destrutíveis
distribuídos aleatoriamente. Cada célula elegível tem 45% de chance de receber um
bloco, deixando mais corredores livres. Os quatro cantos têm saídas em L com duas
células livres em cada direção para movimentação e fuga das bombas.

A estrutura é inspirada nos [mapas clássicos de Bomberman](https://randomhoohaas.flyingomelette.com/bomb/msx-1/game.html);
a densidade de 45% é um ajuste próprio de jogabilidade, não uma reprodução exata.

## Saída e níveis

Cada mapa tem uma saída escondida sob um bloco destrutível aleatório. Destrua o
bloco com uma bomba para revelar a porta e elimine os três inimigos para abri-la.
A porta usa `assets/exit1.png` enquanto bloqueada e `assets/exit2.png`, com a seta,
quando liberada.

Entre na porta aberta para avançar ao próximo nível. O mapa é gerado novamente,
com novos inimigos e outra saída oculta, preservando os corações restantes.
Bombas e efeitos do mapa anterior são removidos. A passagem aguarda o fim da
animação de chegada e das chamas sobre a porta. O HUD mostra o nível, os inimigos
restantes e o objetivo atual. Ao perder todos os corações, a partida volta ao nível 1.

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
