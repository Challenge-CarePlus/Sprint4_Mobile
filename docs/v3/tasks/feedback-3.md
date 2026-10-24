# V3 — Feedbacks de teste da usuária (23/10) — 7 itens

Branch `v3`. Mesmas regras: commits pequenos só dos seus arquivos, sem push, reportar com `maestri ask "PM"` (hashes, `tsc`,
`npm test`, o que NÃO validou). A usuária vai validar no Vercel quando o PM avisar. **Decisões do PM** em cada item abaixo.

## F1 — Responsivo para o tablet Samsung Galaxy Tab S6 (Frontend)
O app vai rodar também na tela do **Tab S6** (10,5", 2560×1600; no Chrome o viewport CSS fica ≈ **1280×800** na horizontal e
≈ **800×1280** na vertical, menos barras do navegador ≈ 1280×~700 e 800×~1180). Hoje o app é uma coluna de no máximo 768 px centralizada
(`theme/layout.ts`); na horizontal sobram faixas vazias dos lados e a altura útil é pequena (~700 px).
- Teste e ajuste **1280×720, 1280×800, 800×1280 e 712×1138** (e mantenha 360, 390, 768, 1440).
- **Decisão:** em tela larga e baixa (tablet na horizontal) usar a largura melhor: aumente o limite da coluna (ex.: 960–1040 px) e, onde fizer
  sentido, use duas colunas (ex.: prévia: vídeo à esquerda e passos à direita; painel admin: lista + detalhe) **sem refazer o app**. Câmera e
  vídeo calculados pela altura útil, sem cortar rosto nem exigir rolagem desnecessária. Sem rolagem horizontal, alvos ≥ 48 px (56 idosos),
  texto legível, claro e escuro.
- Validar com Playwright (viewport + `hasTouch`) e capturas; declarar o que não deu para validar no aparelho real.

## F2 — "Voltar" deve ir para a tela anterior, não para a Home (Frontend)
Hoje as telas usam `replace` ao avançar, então o histórico não guarda a tela anterior e o Voltar cai na Home.
- **Decisão — destino do Voltar por tela:** Escolha de trilha → Home · Prévia → Escolha de trilha (ou a tela de onde veio) · Calibração → **Prévia
  do mesmo exercício** · Sessão → **Prévia do mesmo exercício** (com a câmera encerrada e sem registrar nada) · Resumo → Home ·
  Configurações → tela de onde veio · Admin: Evolução → Painel · Paciente → Evolução · Treinos → Painel · Editar treino → Treinos ·
  Editar exercício → Editar treino (**sem perder o rascunho**) · Escolher pacientes → Editar treino (mantendo a seleção).
- Implemente com destinos explícitos (função `backTarget(route, params)`), usando `navigation.navigate`/`goBack` coerentes; garanta que
  voltar da Sessão não cria loop nem deixa a câmera ligada. Se for simples, faça o **botão Voltar do navegador (web)** e o gesto de voltar do
  Android seguirem a mesma regra. Testes unitários da função de destino.

## F3 — Tema escuro dentro da Trilha Infantil (Frontend)
A usuária quer o tema escuro **também na trilha infantil** (hoje ela fica sempre clara, regra do DS).
- **Decisão:** a Trilha Infantil passa a respeitar claro/escuro/automático. Crie a **variante escura do kit infantil** (não existe no DS —
  derive e documente): fundo índigo profundo (ex.: `#14123A`), cards `#1F1D52`, texto `#F3F2FF`, texto secundário `#B9B7E0`, trilhos `#2E2B6B`;
  verde/laranja/amarelo/azul vivos **mantidos**; **texto sobre as cores vivas segue sempre índigo `#2A2867`**; gradiente verde→azul no botão.
  Contraste AA (texto 4,5:1) medido, foco visível, vídeo/câmera inalterados. Aplique em Prévia, Calibração, Sessão e Resumo infantis.
- Atualize CLAUDE.md (a regra "infantil sempre clara" foi revogada pela usuária em 23/10; o DS original não tem o escuro infantil).

## F4 — Balãozinho (children-blow-balloon): validação não funciona → contagem manual (Frontend)
O MediaPipe quase não mede bochecha cheia, e a usuária ficou sem conseguir validar.
- **Decisão (exceção explícita à regra "todos validados pela câmera"):** neste exercício, **manter a tentativa de validação pela câmera e oferecer
  também a contagem manual**: botão **"Fiz uma vez"** (conta a repetição, com feedback e voz gentil), contador `n/5` e botão **"Finalizar exercício"**
  (habilitado depois da primeira repetição manual ou quando a câmera concluir). Sem espera de 25 s para aparecer.
- Modele como opção do exercício (ex.: `allowManualCount: true`, valendo para outros no futuro e para exercícios personalizados via um interruptor
  "Permitir contagem manual" no formulário do admin). O resultado registra **como foi contado** (câmera × manual) e o **Resumo** mostra os dois
  ("Validados pela câmera", "Confirmados por você"). Texto da prévia honesto: "A câmera tenta reconhecer as bochechas; se não reconhecer, conte
  você mesma(o)." Tema infantil, a11y, alvos ≥ 48 px, testes unitários.

## F5 — "Soltar o ar pelos lábios" (adults-lip-trill): diminuir o tempo (Frontend)
- **Decisão:** de 3 s para **2 s** de manutenção e relaxamento de 2 s → **1,5 s** (`holdDurationMs: 2000`, `relaxDurationMs: 1500`); atualize passos
  ("Mantenha a vibração por cerca de 2 segundos"), `durationSeconds`/chip de repetição e `validationNote`. Mantenha as 5 repetições. Teste unitário.

## F6 — "Deglutição em esforço" (elderly-effortful-swallow): relaxamento não é reconhecido em quem tem lábios finos (Frontend)
Com lábios finos o sinal `lipPress` continua acima do limiar durante o relaxamento, então o app acha que a pessoa ainda faz o exercício.
- **Decisão — detecção de relaxamento adaptativa (vale para todos os exercícios com relaxamento):** considerar "relaxou" quando o sinal **cai de forma
  relevante em relação ao pico da repetição** (ex.: ≤ 60 % do pico), **ou** fica abaixo do limiar; não exigir voltar ao nível de repouso absoluto.
  Para `lipPress`, estimar o repouso pela calibração e usar limiar efetivo com margem sobre o repouso da pessoa. Evitar falso positivo de repetição
  (a queda do sinal não pode contar como nova repetição). Testes unitários simulando **lábios finos** (repouso alto ≈ 0,18, esforço ≈ 0,45) e lábios
  normais (repouso ≈ 0,02), mais regressão dos 150+ testes existentes. Ajuste a `validationNote` se necessário.

## F7 — Só exercícios/treinos personalizados podem ser excluídos (Backend + Frontend)
- **Decisão:** os itens "padrão" **não podem ser excluídos**: as 3 trilhas padrão (já são estáticas) e o treino de exemplo **"Aquecimento para
  apresentações"** (`example: true`) e **seus exercícios**. Treinos criados pelo admin e os exercícios deles continuam excluíveis.
- **Backend:** `DELETE /trainings/:id` em treino `example: true` → **403** `{ success:false, message:"Treino padrão não pode ser excluído" }`;
  `PUT` em treino `example` **não pode remover** exercícios originais (400 com mensagem clara); testes (incluindo 401/403 de sempre). O seed continua
  recriando o exemplo.
- **Frontend:** esconder/desabilitar "Excluir treino" e a lixeira de exercício nos itens padrão, com selo **"Padrão"** e texto de apoio ("Treinos
  padrão podem ser editados, mas não excluídos" — só se a edição for permitida; senão "somente leitura"); tratar o 403 com mensagem amigável.
  Pode editar nome/público do treino padrão? **Sim**, só não excluir.

## Validação e entrega
Cada dono valida o seu e declara o que não validou. O **Tester** reexecuta o plano nos itens F1–F7 (inclusive viewports do Tab S6, Voltar,
infantil no escuro, balãozinho manual, lábios finos simulados, exclusão de padrão) e a regressão do fluxo principal. O PM faz o push e avisa a usuária.
