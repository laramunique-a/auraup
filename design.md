# Sistema de Design: AuraUP — Gamified 3D Learning Experience

## 1. Direção Visual da Marca

- **Nome do produto:** AuraUP
- **Posicionamento visual:** plataforma de aprendizado por repetição espaçada com sensação de jogo, progresso constante e recompensa visual.
- **Nova estética:** divertida, energética, amigável, 3D, interativa e altamente motivacional.
- **Referência de linguagem visual:** apps modernos de educação gamificada, combinando ilustrações 3D, personagens/mascotes, feedback imediato, progressão por níveis, badges, streaks e microanimações.
- **Sensação desejada:** "estou jogando e evoluindo", e não "estou preenchendo um formulário".
- **Princípio principal:** cada ação importante deve produzir algum tipo de resposta visual, sonora ou de movimento.
- **Personalidade:** encorajadora, positiva, divertida e inteligente; nunca infantil demais.
- **Logo:** manter a identidade do logo AuraUP como referência principal. O azul representa confiança, evolução e conhecimento; o laranja representa energia, recompensa e ação.
- **Evitar:** visual corporativo frio, excesso de glassmorphism, telas monocromáticas, interfaces excessivamente flat, sombras muito discretas e layouts que pareçam dashboards empresariais.

---

## 2. Conceito Visual

A interface deve parecer um **mundo de aprendizado vivo**.

Em vez de apresentar somente cards e listas, a aplicação deve transformar o progresso do usuário em elementos visuais:

- progresso representado por níveis;
- caminhos de aprendizado;
- XP e moedas;
- streak diário;
- desafios;
- conquistas;
- personagens ou mascotes;
- troféus e badges;
- elementos flutuantes;
- pequenos efeitos de partículas;
- feedback de acerto/erro;
- animações de evolução;
- componentes com profundidade 3D.

O usuário deve conseguir perceber rapidamente:

1. **Onde estou?**
2. **O que devo estudar agora?**
3. **Quanto estou evoluindo?**
4. **Qual é minha próxima recompensa?**

---

## 3. Paleta de Cores

A paleta deve derivar visualmente do logo AuraUP, utilizando azul e laranja como protagonistas.

### Cores Principais

- **Aura Blue:** `#1769D5`
  - Cor primária.
  - Navegação, CTA principal, progresso e elementos de confiança.

- **Sky Blue:** `#55A8FF`
  - Azul claro de apoio.
  - Gradientes, estados ativos, fundos de cards e elementos 3D.

- **Deep Blue:** `#103B8F`
  - Contraste, textos fortes, bordas e profundidade.

- **Aura Orange:** `#FF9800`
  - Cor secundária.
  - XP, recompensas, streaks, moedas, ações de destaque.

- **Bright Orange:** `#FFB52E`
  - Highlight de laranja.
  - Brilho, gradientes, elementos comemorativos e estados de recompensa.

### Cores de Suporte

- **Success Green:** `#32C875`
- **Warning Yellow:** `#FFD447`
- **Error Red:** `#FF5C65`
- **Purple Accent:** `#8B6DFF`

### Neutros

- **Page Background:** `#F2F8FF`
- **Surface:** `#FFFFFF`
- **Soft Blue Surface:** `#E7F2FF`
- **Primary Text:** `#15345B`
- **Secondary Text:** `#55708F`
- **Muted Text:** `#8AA0B8`

### Gradientes

Utilizar gradientes de forma frequente para reforçar profundidade e energia.

- `linear-gradient(135deg, #55A8FF 0%, #1769D5 100%)`
- `linear-gradient(135deg, #FFB52E 0%, #FF9800 100%)`
- `linear-gradient(135deg, #1769D5 0%, #103B8F 100%)`
- `linear-gradient(135deg, #FFFFFF 0%, #E7F2FF 100%)`

Gradientes devem ser usados principalmente em:

- botões;
- cards de progresso;
- XP;
- badges;
- barras de progresso;
- elementos 3D;
- backgrounds de destaque.

---

## 4. Tipografia

A tipografia deve transmitir personalidade e acessibilidade.

### Headings

- Preferência: **Nunito ExtraBold / Bold**
- Alternativas: **Baloo 2**, **Poppins ExtraBold**
- Uso: títulos de páginas, níveis, XP, conquistas e mensagens motivacionais.

Características:

- formas arredondadas;
- alto peso;
- aparência amigável;
- ótima leitura em mobile.

### Body

- **Nunito / Inter**
- Pesos 400, 500 e 600.
- Leitura simples e confortável durante longas sessões de estudo.

### Numbers / Gamification

Para XP, streak, níveis e contadores:

- peso 800/900;
- números grandes;
- possibilidade de usar fonte display arredondada.

Exemplo:

`+25 XP`

deve ter muito mais impacto visual do que um texto comum.

---

## 5. Layout e Estrutura

A aplicação deve abandonar a aparência de dashboard tradicional.

### Princípios

- muito espaço para elementos visuais;
- cards maiores;
- hierarquia clara;
- blocos assimétricos;
- elementos parcialmente sobrepostos;
- ilustrações e objetos 3D;
- bastante uso de formas orgânicas;
- fundo claro com pequenas formas decorativas.

### Grid

- Desktop: 12 colunas.
- Tablet: 8 colunas.
- Mobile: 4 colunas.

### Containers

- `max-width: 1280px`
- padding desktop: `32px`
- padding tablet: `24px`
- padding mobile: `16px`

---

## 6. Backgrounds

O background não deve ser completamente plano.

Usar:

- azul extremamente claro;
- gradientes radiais suaves;
- blobs orgânicos;
- círculos transparentes;
- pequenas estrelas;
- partículas;
- formas geométricas discretas.

Exemplo conceitual:

```css
background:
  radial-gradient(circle at 15% 15%, rgba(85,168,255,.18), transparent 28%),
  radial-gradient(circle at 85% 80%, rgba(255,152,0,.12), transparent 25%),
  #F2F8FF;
```

Os elementos decorativos devem permanecer atrás do conteúdo e nunca prejudicar a leitura.

---

## 7. Cards 3D

Os cards devem parecer objetos físicos leves, e não simples retângulos flat.

### Características

- `border-radius: 24px`;
- sombra macia;
- pequena profundidade;
- highlight no topo;
- possibilidade de bevel visual;
- estados hover com elevação;
- objetos ou ilustrações parcialmente saindo do card.

Exemplo:

```css
box-shadow:
  0 8px 0 rgba(16, 59, 143, 0.10),
  0 18px 35px rgba(16, 59, 143, 0.12);
```

### Interactive Card

No hover:

- `translateY(-6px)`;
- leve `rotateX()` / `rotateY()` seguindo o cursor;
- aumento da sombra;
- highlight passando pela superfície.

No click:

- pequeno `scale(0.97)`;
- retorno rápido ao estado normal.

---

## 8. Botões

Botões são elementos de recompensa e precisam parecer "pressionáveis".

### Primary Button

- fundo azul ou gradiente azul;
- texto branco;
- `border-radius: 16px`;
- altura mínima: `48px`;
- sombra inferior ou "extrusão" 3D.

Exemplo:

```css
box-shadow: 0 5px 0 #103B8F, 0 10px 20px rgba(23,105,213,.20);
```

### Hover

```text
translateY(-2px)
```

### Active

```text
translateY(3px)
```

A sombra deve diminuir junto com o deslocamento, criando sensação de botão físico.

### Secondary Button

Usar fundo branco/azul claro e borda azul suave.

### Reward Button

Usar laranja e elementos de brilho.

---

## 9. Navegação

A navegação deve ser simples e amigável.

### Desktop

Sidebar ou navegação superior com:

- Home;
- Aprender;
- Revisar;
- Progresso;
- Conquistas;
- Perfil.

### Mobile

Bottom navigation com 4–5 itens.

Cada item ativo deve apresentar:

- ícone maior;
- fundo em cápsula;
- cor azul;
- pequena animação;
- indicador de estado.

---

## 10. Dashboard / Home

A Home deve funcionar como um **painel de aventura**.

### Hero

Mostrar:

- saudação;
- nível atual;
- XP;
- streak;
- objetivo diário;
- personagem ou ilustração 3D.

Exemplo de mensagem:

> "Pronta para subir mais um nível?"

### Daily Goal

Card destacado com:

- meta diária;
- progresso;
- XP restante;
- CTA "Continuar aprendendo".

A barra de progresso deve ter aparência física e preenchimento animado.

### Continue Learning

Mostrar o próximo conteúdo em um card grande.

Informações:

- nome do deck;
- quantidade de cards;
- progresso;
- dificuldade;
- XP disponível.

CTA:

**Continuar**

---

## 11. Sistema de XP

XP deve ser uma das informações mais visíveis do produto.

Exibir:

`⭐ 1.240 XP`

Ao ganhar XP:

1. número aparece;
2. número cresce rapidamente;
3. partículas pequenas saem do componente;
4. "+25 XP" sobe pela tela;
5. contador faz um pequeno bounce;
6. barra de progresso aumenta.

A animação precisa ser rápida e satisfatória.

---

## 12. Streak

Streak deve ter destaque semelhante ao XP.

Exemplo:

`🔥 12 dias`

O componente deve utilizar:

- chama ou mascote;
- laranja;
- partículas;
- pequena animação contínua;
- contador grande.

Ao completar um novo dia:

- chama cresce;
- brilho aparece;
- contador muda;
- pequena chuva de estrelas;
- mensagem de comemoração.

---

## 13. Sistema de Níveis

Criar sensação de evolução constante.

Exemplo:

```text
NÍVEL 12
██████████████░░░
1.240 / 1.500 XP

260 XP para o próximo nível
```

Ao subir de nível:

- modal de celebração;
- número do nível em 3D;
- partículas;
- confetes;
- expansão do círculo/medalha;
- mensagem motivacional.

---

## 14. Caminho de Aprendizado

Sempre que possível, representar conteúdos como um **learning path**.

Em vez de uma lista simples:

```text
Deck 01
Deck 02
Deck 03
Deck 04
```

utilizar um caminho visual:

```text
    🏆
     |
   ●─── Lesson 04
     |
   ●─── Lesson 03
     |
   ●─── Lesson 02
     |
   ●─── Lesson 01
```

Os nós devem parecer pequenas ilhas, medalhas ou plataformas 3D.

Estados:

- concluído;
- disponível;
- em progresso;
- bloqueado;
- desafio especial.

---

## 15. Tela de Estudo

Esta é a área mais importante da aplicação.

A experiência deve ser focada e extremamente interativa.

### Flashcard

O flashcard deve ter:

- grande área de toque;
- aparência física;
- sombra 3D;
- bordas arredondadas;
- animação de flip;
- conteúdo centralizado.

### Flip

Ao tocar:

```text
rotateY(180deg)
```

A animação deve durar aproximadamente `450ms`.

### Antes da resposta

Mostrar apenas:

- pergunta;
- dica opcional;
- indicador de progresso.

### Depois da resposta

Apresentar respostas de forma visual:

- Novamente;
- Difícil;
- Bom;
- Fácil.

Cada botão deve possuir:

- cor própria;
- ícone;
- tempo para próxima revisão;
- leve profundidade;
- feedback instantâneo.

---

## 16. Feedback de Resposta

### Resposta correta

Utilizar:

- verde;
- brilho;
- check grande;
- partículas;
- pequeno bounce;
- aumento de XP.

Exemplo:

`✓ Muito bem! +10 XP`

### Resposta incorreta

Não utilizar feedback punitivo.

Preferir:

- laranja/vermelho suave;
- movimento curto do card;
- mensagem encorajadora.

Exemplo:

`Quase! Vamos tentar novamente.`

O objetivo é incentivar repetição, não gerar frustração.

---

## 17. Microinterações

A aplicação deve possuir microinterações em praticamente todos os elementos importantes.

### Hover

- elevação;
- brilho;
- rotação 3D;
- alteração de sombra.

### Click

- compressão;
- retorno;
- ripple discreto.

### Completion

- check;
- partículas;
- badge;
- XP animado.

### Progress

A barra nunca deve simplesmente "saltar".

Ela deve:

1. iniciar no valor antigo;
2. animar até o novo valor;
3. gerar brilho;
4. parar suavemente.

---

## 18. 3D e Ilustrações

O 3D deve aparecer como complemento da interface.

Preferir:

- objetos arredondados;
- troféus;
- estrelas;
- livros;
- cartões;
- foguetes;
- mochilas;
- mascotes;
- medalhas;
- cristais;
- pequenos planetas.

### Estilo

- 3D soft;
- plástico fosco;
- highlights suaves;
- formas arredondadas;
- pouca textura;
- sombras macias.

O 3D não deve dominar a tela inteira. Ele deve reforçar a sensação de jogo.

---

## 19. Mascote / Personalidade

Considerar um mascote oficial AuraUP.

O mascote pode aparecer:

- no onboarding;
- na Home;
- após conquistas;
- em mensagens de erro;
- durante streak;
- em estados vazios.

Estados possíveis:

- comemorando;
- estudando;
- pensando;
- comemorando XP;
- cansado;
- surpreso;
- incentivando o usuário.

O mascote deve seguir a paleta azul/laranja e o estilo 3D soft.

---

## 20. Badges e Conquistas

Badges devem parecer itens colecionáveis.

Exemplos:

- `🔥 7 dias seguidos`
- `📚 100 cards revisados`
- `⚡ 500 XP`
- `🏆 Primeiro nível`
- `🎯 10 respostas perfeitas`

Formato:

- medalhas;
- escudos;
- moedas;
- estrelas;
- troféus.

Utilizar relevo, sombra e highlights para criar aparência 3D.

---

## 21. Feedback de Conclusão

Ao terminar uma sessão de estudos, apresentar uma tela de celebração.

Exemplo:

```text
🎉 SESSÃO CONCLUÍDA!

+120 XP
🔥 Streak mantido
⭐ 18 respostas corretas

[ Continuar ]
```

Adicionar:

- confetes;
- partículas;
- brilho;
- personagem comemorando;
- animação do XP;
- progresso para o próximo nível.

A duração da celebração deve ser curta para não atrapalhar o fluxo de estudo.

---

## 22. Loading States

Evitar skeletons excessivamente corporativos.

Preferir:

- pequenas animações do mascote;
- pontos saltando;
- ícones girando;
- objeto 3D flutuando;
- mensagens como:

> "Preparando seu próximo desafio..."

O loading deve transmitir atividade, não espera.

---

## 23. Empty States

Estados vazios também devem parecer parte do jogo.

Exemplo:

```text
📚
Nenhuma coleção criada ainda.

Vamos preparar seu primeiro desafio?

[ Criar coleção ]
```

Usar ilustração ou objeto 3D sempre que possível.

---

## 24. Toasts e Feedbacks Rápidos

Toasts devem parecer pequenas recompensas.

Exemplo:

`⭐ +25 XP`

ou:

`🔥 Streak de 7 dias!`

Características:

- cápsula arredondada;
- sombra;
- ícone grande;
- pequena entrada vertical;
- saída suave;
- cores da marca.

---

## 25. Modal de Conquista

Modal de conquista deve possuir:

- fundo com gradiente;
- badge 3D central;
- partículas;
- título grande;
- descrição;
- XP recebido;
- CTA.

Evitar excesso de informação.

---

## 26. Som e Haptics

Quando a plataforma permitir:

### Eventos

- resposta correta → som curto e positivo;
- erro → som suave;
- ganho de XP → som de recompensa;
- nível concluído → som mais marcante;
- conquista → som especial.

No mobile:

- utilizar haptic feedback leve;
- intensidade maior somente para conquistas importantes.

Som e haptics devem possuir opção de desativação.

---

## 27. Animações

A AuraUP deve ter animações perceptíveis, mas rápidas.

### Timing

- Microinteração: `120–180ms`
- Hover: `180–250ms`
- Card flip: `400–500ms`
- Transição de página: `250–350ms`
- Celebração: `700–1200ms`

### Easing

Priorizar:

```css
cubic-bezier(0.22, 1, 0.36, 1)
```

para entradas e elevação.

Utilizar spring/bounce apenas em elementos de recompensa.

---

## 28. Animações Permitidas

Usar frequentemente:

- `scale`;
- `translate`;
- `rotate`;
- `rotateX`;
- `rotateY`;
- `opacity`;
- glow;
- particles;
- floating;
- bounce suave;
- progress animation;
- card flip;
- confetti.

Evitar:

- animações longas;
- excesso de blur;
- movimentos contínuos em muitos elementos simultaneamente;
- efeitos que prejudiquem a leitura.

---

## 29. Acessibilidade

Mesmo com uma interface gamificada:

- contraste mínimo adequado;
- textos legíveis;
- foco visível;
- navegação por teclado;
- áreas de toque de pelo menos `44px`;
- não depender somente de cor para comunicar estados;
- respeitar `prefers-reduced-motion`;
- permitir desativação de animações intensas.

---

## 30. Responsividade

### Mobile First

A experiência de estudo deve ser pensada primeiro para smartphones.

No mobile:

- cards ocupam quase toda a largura;
- botões de resposta ficam fáceis de tocar;
- navegação inferior;
- animações menores;
- elementos 3D são reduzidos;
- informações secundárias podem ser recolhidas.

### Desktop

Utilizar mais espaço para:

- learning path;
- dashboard;
- estatísticas;
- ilustrações;
- cards 3D.

---

## 31. Estados dos Componentes

Todo componente interativo deve possuir:

- default;
- hover;
- focus;
- active;
- disabled;
- loading;
- success;
- error;
- completed.

Não criar componentes "estáticos" quando existe interação.

---

## 32. Regras de Profundidade

A interface deve trabalhar com três níveis principais:

### Nível 1 — Fundo
- blobs;
- partículas;
- gradientes;
- elementos decorativos.

### Nível 2 — Conteúdo
- cards;
- botões;
- listas;
- barras;
- menus.

### Nível 3 — Destaque
- XP;
- badges;
- mascote;
- conquistas;
- objetos 3D;
- feedback de interação.

Essa hierarquia cria sensação de profundidade sem transformar toda a aplicação em um ambiente 3D pesado.

---

## 33. Diretrizes de Ícones

Preferir:

- ícones arredondados;
- traços médios;
- aparência amigável;
- pequenos preenchimentos;
- uso consistente de azul e laranja.

Quando apropriado, combinar ícone 2D com pequeno elemento 3D.

Evitar ícones extremamente finos ou excessivamente corporativos.

---

## 34. Princípios UX

A AuraUP deve sempre responder às ações do usuário.

### Regra 1
**Aprendi algo → recebo feedback.**

### Regra 2
**Completei algo → vejo progresso.**

### Regra 3
**Estou perto de uma meta → vejo o quanto falta.**

### Regra 4
**Errei → sou incentivada a tentar novamente.**

### Regra 5
**Voltei amanhã → minha sequência é valorizada.**

### Regra 6
**Evoluí → a interface mostra visualmente essa evolução.**

---

## 35. Tom de Voz

O texto da interface deve ser:

- curto;
- positivo;
- motivador;
- informal na medida certa;
- direto;
- encorajador.

Preferir:

> "Mandou bem! +20 XP"

em vez de:

> "Resposta correta. Você recebeu 20 pontos de experiência."

Preferir:

> "Mais uma revisão e você sobe de nível!"

em vez de:

> "Você está próximo do próximo nível."

---

## 36. Direção Visual Resumida

A AuraUP deve parecer:

**Duolingo-like em energia e gamificação + 3D soft + azul e laranja da marca + interface moderna e acessível.**

Não deve parecer:

**dashboard corporativo + SaaS financeiro + glassmorphism minimalista + interface fria.**

### Palavra-chave do produto

**LEARN → PLAY → LEVEL UP**

Cada tela deve reforçar essa ideia.

---

## 37. Checklist de Implementação

Antes de considerar uma tela pronta, verificar:

- [ ] Existe uma hierarquia visual clara?
- [ ] O azul AuraUP é a cor principal?
- [ ] O laranja aparece nos elementos de recompensa/ação?
- [ ] Existe profundidade visual?
- [ ] Os elementos interativos respondem ao usuário?
- [ ] O progresso está visualmente evidente?
- [ ] A tela parece divertida sem parecer infantil?
- [ ] O usuário entende facilmente qual é a próxima ação?
- [ ] Há feedback para ações importantes?
- [ ] A interface continua leve e legível no mobile?
- [ ] Animações não atrapalham o estudo?
- [ ] A experiência reforça a sensação de evolução?

---

## 38. Regra Final de Design

**AuraUP não deve apenas mostrar ao usuário que ele está aprendendo. A interface deve fazer o usuário SENTIR que está evoluindo.**

Cada revisão, cada XP, cada streak, cada badge e cada nível deve parecer uma pequena conquista.
