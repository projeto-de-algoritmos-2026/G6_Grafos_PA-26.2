# Proposta de escopo — Bomberman 2D

## Objetivo

Desenvolver um Bomberman 2D para a disciplina de Projeto de Algoritmos, aplicando algoritmos de menor caminho em grafos à movimentação dos inimigos.

A proposta para a entrega é ter uma arena, três inimigos e comparação entre BFS e A*. O foco é entregar uma partida completa e demonstrar o funcionamento dos algoritmos sem ampliar demais o escopo.

**Status:** proposta para discussão. Os algoritmos, a quantidade de inimigos e as demais regras abaixo ainda precisam ser confirmados pelo grupo.

## Base implementada

Referência: commit `106359a6cf1efc897d5d877dbe870dc8ffffa11c`.

- Svelte 5, TypeScript, Vite e HTML5 Canvas.
- Mapa de 15 × 13 células, com 48 × 48 px por célula.
- Paredes nas bordas, pilares fixos e blocos aleatórios com densidade padrão de 0,65.
- Área inicial livre para o jogador.
- Função `getNeighbors`, que retorna células vazias nas quatro direções.
- Movimentação por WASD ou setas, colisões e renderização com retângulos coloridos.

Sprites, inimigos, busca de caminhos, bombas, explosões e destruição de blocos ainda não fazem parte dessa base.

## Escopo e regras

| Ponto | Proposta |
| --- | --- |
| Arena | Uma arena de 15 × 13 células, mantendo a estrutura atual. |
| Objetivo | Eliminar todos os inimigos usando bombas. |
| Vitória | Todos os inimigos eliminados. |
| Derrota | Jogador atingido por explosão ou em contato com um inimigo. |
| Vidas | Uma vida por partida. |
| Reinício | Tecla `R`, restaurando o mesmo mapa inicial e o estado da partida. |
| Bombas | Tecla `Espaço`, com uma bomba ativa por vez. |
| Temporizador | Detonação após 2 segundos. |
| Alcance | Duas células em cada direção ortogonal, além da célula da bomba. |
| Duração da explosão | 0,4 segundo. |
| Paredes | Interrompem a explosão e não são destruídas. |
| Blocos | São destruídos e interrompem a explosão naquela direção. |
| Colisão com bomba | O jogador pode sair da bomba que acabou de colocar. Depois de sair, ela bloqueia a passagem. |

A explosão afeta tanto o jogador quanto os inimigos. As células atingidas são calculadas no momento da detonação. A destruição de um bloco não permite que a mesma explosão continue além dele.

Itens, melhorias, múltiplas fases, multiplayer e progressão ficam fora da entrega.

## Sprites

A proposta visual é usar pixel art simples, produzida pelo grupo.

| Ponto | Proposta |
| --- | --- |
| Dimensões | Sprites de 16 × 16 px, ampliados em 3 vezes para as células de 48 × 48 px. |
| Renderização | Desativar a suavização do Canvas com `imageSmoothingEnabled = false`. |
| Personagens | Jogador e um tipo visual de inimigo. |
| Cenário | Chão, parede e bloco. |
| Objetos e efeitos | Bomba e explosão, incluindo centro, segmentos e pontas. |
| Animações | Dois quadros de caminhada para jogador e inimigo e dois quadros de pulsação para a bomba. |

Na entrega, as animações de caminhada podem ser independentes da direção.

Organização prevista:

```text
public/sprites/
├── personagens/
├── cenario/
├── efeitos/
└── CREDITS.md
```

O arquivo `CREDITS.md` deve registrar autor, origem e licença dos recursos utilizados. Ainda precisamos definir quem vai produzir os sprites e qual licença será aplicada. Caso o grupo prefira um pacote externo, a escolha e a verificação da licença devem ser feitas antes da integração.

## Modelagem do grafo

- Cada célula livre representa um vértice.
- Movimentos para cima, baixo, esquerda e direita representam as arestas.
- Cada movimento tem custo `1`.
- Paredes, blocos e bombas impedem a passagem.
- Células com explosões ativas ficam indisponíveis para o planejamento.
- A posição de outros inimigos não altera o grafo.

A função `getNeighbors` será ampliada para considerar obstáculos dinâmicos, além do conteúdo da matriz.

## Algoritmos de menor caminho

| Algoritmo | Uso proposto | Justificativa |
| --- | --- | --- |
| BFS | Referência para menor caminho. | Encontra o caminho com menos movimentos quando todas as arestas têm o mesmo custo. |
| A* | Busca direcionada ao jogador. | Usa a distância de Manhattan para orientar a busca e permite comparar a exploração com BFS. |

A distância de Manhattan é adequada à grade porque os movimentos são ortogonais e têm custo unitário. Nesse modelo, ela não superestima o custo restante.

Todos os inimigos usarão o mesmo algoritmo, selecionável entre BFS e A*. Isso permite comparar os algoritmos sem misturar diferenças de velocidade ou comportamento.

Dijkstra fica como possível extensão. Como o grafo proposto tem custos uniformes, BFS já resolve o problema de menor caminho. Se a disciplina exigir Dijkstra ou se forem introduzidos terrenos com pesos diferentes, essa escolha deverá ser revista.

### Complexidade

- **BFS:** tempo `O(V + E)` e espaço `O(V)`.
- **A*:** com heap binário, heurística consistente e controle de estados, limite de tempo `O((V + E) log V)`. A documentação final deve detalhar a fila de prioridade e o armazenamento adotados.

`V` representa os vértices do grafo e `E`, suas arestas.

## Quantidade e comportamento dos inimigos

| Ponto | Proposta |
| --- | --- |
| Quantidade inicial | Três inimigos. |
| Máximo simultâneo | Três inimigos. |
| Tipos | Um tipo, com comportamento de perseguição. |
| Velocidade | 96 px/s, abaixo dos atuais 190 px/s do jogador. |
| Movimento | Uma célula por vez, seguindo o caminho calculado. |
| Contato entre inimigos | Podem se sobrepor na entrega. |
| Contato com jogador | Derrota imediata. |
| Explosão | Elimina o inimigo. |
| Reaparecimento | Não haverá. |

### Nascimento e conectividade

Os inimigos nascerão em três posições fixas próximas aos outros cantos internos da arena. A geração deve reservar a célula de nascimento e suas saídas e abrir corredores até a região inicial do jogador, removendo apenas blocos, nunca paredes.

Após gerar o mapa, será necessário validar a conexão e garantir distância mínima de oito movimentos entre cada nascimento e o jogador. Essa etapa evita depender da distribuição aleatória dos blocos para obter uma partida viável.

### Reação às bombas

Os inimigos contornam bombas e explosões ativas quando existe uma rota. A entrega não terá antecipação de explosões nem fuga inteligente, então eles poderão ser atingidos durante a perseguição.

## Replanejamento e movimentação

Cada inimigo guarda um caminho como uma sequência de células `{ x, y }`. O motor converte a próxima célula em coordenadas de pixels e move o inimigo até ela. Ao chegar ao alinhamento da célula, ele avança para o próximo trecho.

Regras propostas:

- Recalcular quando o jogador mudar de célula ou o mapa mudar, respeitando um intervalo mínimo de 0,3 segundo entre buscas.
- Aplicar o novo trajeto no alinhamento de uma célula, preservando movimentos ortogonais.
- Verificar se a próxima célula continua transitável antes de iniciar cada trecho.
- Parar e solicitar uma nova busca se o trecho estiver bloqueado.
- Permanecer parado quando não houver caminho e tentar novamente quando ocorrer uma mudança relevante.

Para detectar alterações, manter uma versão do mapa, incrementada quando uma bomba aparecer ou desaparecer, uma explosão começar ou terminar ou um bloco for destruído.

## Demonstração acadêmica

A proposta é ter um seletor de BFS/A* e a tecla `G` para mostrar o caminho planejado e as células exploradas pela última busca.

Métricas por busca:

- Comprimento do caminho, em movimentos.
- Número de vértices expandidos, usando o mesmo critério de contagem para ambos os algoritmos.
- Tempo de execução, medido com `performance.now()`.

A comparação deve executar os dois algoritmos sobre a mesma configuração do mapa, origem e destino. Comparar apenas partidas em andamento não garante condições iguais, pois as posições e os obstáculos podem mudar.

Como a grade é pequena, o tempo de execução pode variar bastante. A análise também deve considerar o custo do caminho e a quantidade de vértices expandidos.

### Cenários

1. Caminho livre até o jogador.
2. Desvio de paredes e blocos.
3. Destino inacessível em um mapa de teste.
4. Atualização do caminho após a destruição de um bloco.
5. Rota temporariamente bloqueada por uma bomba.

## Plano de implementação

- [ ] Confirmar o escopo com o grupo e vincular este documento no README.
- [ ] Separar o estado do mapa, jogador, bombas, explosões e inimigos.
- [ ] Implementar bombas, propagação das explosões e destruição de blocos.
- [ ] Garantir nascimentos conectados e criar mapas fixos de teste.
- [ ] Implementar BFS e A* como funções independentes do Canvas.
- [ ] Integrar os caminhos à movimentação dos três inimigos.
- [ ] Implementar dano, vitória, derrota e reinício.
- [ ] Produzir e integrar os sprites, registrando os créditos e as licenças.
- [ ] Adicionar visualização dos caminhos e métricas de busca.
- [ ] Preparar os cenários comparativos e documentar os resultados.

## Pontos para aprovação do grupo

- [ ] Uma única arena, sem progressão na entrega.
- [ ] Regras de bombas, dano, vitória, derrota e reinício descritas neste documento.
- [ ] BFS e A* como algoritmos da entrega, considerando os requisitos da disciplina.
- [ ] Três inimigos do mesmo tipo, sem reaparecimento.
- [ ] Perseguição sem fuga preditiva de explosões.
- [ ] Sprites próprios, com definição de responsáveis e licença.
- [ ] Visualização de caminhos e comparação em cenários iguais.

## Critério de conclusão da definição

A definição estará concluída quando o grupo confirmar o escopo, os algoritmos e suas justificativas, a quantidade e o comportamento dos inimigos, a origem e a licença dos sprites e o plano de implementação e demonstração. As decisões aprovadas deverão ser atualizadas neste documento.
