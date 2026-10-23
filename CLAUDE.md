# ECOA — Exercícios de Fonoaudiologia em Casa (v2)

Nova aba do app ECOA (CarePlus) para o paciente continuar, com autonomia e supervisão, os
exercícios de fonoaudiologia das sessões semanais. Branch de trabalho: `v2`.

## Stack

- **ECOA_mobile/**: React Native 0.81 + Expo 54 + TypeScript (strict), React Navigation
  (native-stack), `react-native-vision-camera` v5 para a câmera nativa, `react-native-webview`
  + `@mediapipe/tasks-vision` para a visão computacional on-device, `expo-speech` para voz em
  pt-BR, AsyncStorage para persistência local. Não roda no Expo Go (depende de código nativo
  de câmera) — usar `npx expo run:android`.
- **ECOA_backend/**: Node + Express, usado **apenas para login/cadastro (JWT)**. O WebSocket de
  detecção facial via TensorFlow que existia antes foi removido (Fase 8) — toda a visão
  computacional roda localmente no aparelho.

### Decisão de arquitetura: visão computacional

O briefing original pedia MediaPipe Face Landmarker *Web*, que não roda nativamente em React
Native. Decisão (aprovada com o usuário): uma **WebView local e invisível**, carregando
`@mediapipe/tasks-vision` como asset bundlado (sem CDN), recebe frames da câmera nativa via
`postMessage` e devolve landmarks/blendshapes. Processamento 100% no aparelho, nenhum vídeo ou
imagem sai do dispositivo. Risco técnico principal: latência da ponte WebView em tempo real —
código implementado e validado estaticamente (typecheck, testes, bundle), mas **não validado
em device físico neste ambiente** (sem `adb`/emulador disponível). Ver "Como testar" abaixo.

## Acesso livre, sem login (temporário, 21/10)

Decisão da usuária: "por enquanto" o app abre **direto na Home, sem login**. Chave única:
`ECOA_mobile/config/authConfig.ts` → `AUTH_REQUIRED`, lida de `EXPO_PUBLIC_AUTH_REQUIRED` (**padrão `false`**; só
`"true"` liga). Com `false`: `AppRouter` entra nas rotas privadas sem token, `AuthContext` não lê token nem registra o
handler de 401, o Menu esconde "Sair", e nada chama o back-end (o fluxo de exercícios nunca usou a API). Consentimento e
progresso seguem locais (AsyncStorage). **Nada foi apagado**: Login, Register, AuthContext, `jwt.ts` e o back-end ficam
dormentes. Para voltar a exigir login: `EXPO_PUBLIC_AUTH_REQUIRED=true` no build (Vercel → Environment Variables, ou
`.env`) e refazer o deploy (a variável é embutida no bundle; `--clear` já está no `vercel.json`). O Render só precisa
estar no ar de novo nesse caso.

## Backend v3 (modo administrador) — `ECOA_backend/`

Contrato completo em `docs/v3/SPEC.md`. O que o backend faz agora, além de login/cadastro:

- **Papéis** (`role: "admin" | "patient"`, claim no JWT). 9 usuários mockados (seed em `src/data/seed.ts`; pacientes com senha
  `ecoa2026`; `ecoafono@email.com` é o admin e **a senha dele vem de `ADMIN_PASSWORD`**, nunca do repositório: obrigatória em
  produção (o servidor não sobe sem ela; mínimo 12 caracteres, nunca igual à dos pacientes `ecoa2026` nem uma senha óbvia — o servidor recusa subir com ela; em dev o mínimo é 8). **Modo demonstração** (protótipo de evento): `ALLOW_WEAK_ADMIN_PASSWORD=true` (só o valor exato; padrão desligado) aceita senha fraca/pública, inclusive `ecoa2026`, mínimo 8, e loga um AVISO no boot (sem a senha; `/health` não mostra). Risco: quem lê o repo entra como admin e sobe vídeos — desligar a chave e trocar a senha depois do evento), com um valor de dev próprio fora de produção; o hash do admin é
  recalculado da env a cada subida, então trocar a variável troca a senha). `requireRole("admin")` responde **401 sem token e 403 para paciente**, sempre
  no servidor. Cadastro aberto continua existindo e cria sempre `patient`. Login devolve `{ token, user }`; erro único
  "E-mail ou senha inválidos" (não revela se o e-mail existe).
- **Treinos** (`/trainings`, CRUD): sem token só os de `audience.all`; paciente = `all` + os que incluem seu id; admin = todos.
  Treino invisível dá 404. Para não-admin `audience.ids` vem `[]`. Validação completa em `src/validation/training.ts`
  (limites de tamanho, sem `<`/`>`, 7 movimentos, 3 sensibilidades, ids de paciente existentes).
- **Vídeos**: `POST /uploads/video` (admin, multipart `file`, ≤ 30 MB, mp4/webm/mov; confere mime, extensão e os primeiros
  bytes; nome em disco aleatório) devolve uma URL **relativa** `/media/<32hex>.<ext>` — o app prefixa a base da API. `GET /media/:file`
  serve com `Range`/`206`, só aceita nomes gerados pelo upload (sem path traversal nem listagem). O treino só aceita essa
  URL em `video.url` **e o arquivo precisa existir** em `UPLOADS_DIR` (senão 400 "Vídeo não encontrado, envie de novo" — vale também
  no PUT, o que importa quando o disco efêmero apagou o vídeo). Vídeo trocado/removido ou treino excluído apaga o arquivo se
  nenhum outro treino o usa; uploads sem treino há mais de 24 h são apagados na inicialização e a cada 6 h (`removeStaleUploads`).
  Range fora do arquivo → 416 com `Content-Range`; multipart malformado → 400. Os **ids dos exercícios são sempre gerados pelo
  servidor** (o `id` enviado pelo cliente é ignorado).
- **Pacientes** (`/patients`, admin): dados de evolução **de exemplo** fixos (`sample: true`), do protótipo.
- **Persistência**: JSON atômico com fila (`src/db/jsonStore.ts`) em `ECOA_backend/data/` (`DATA_DIR`) e vídeos em
  `ECOA_backend/uploads/` (`UPLOADS_DIR`), ambos fora do git e recriados pelo seed quando não existem. O antigo
  `src/db/users.json` versionado foi removido (o seed recria os usuários).
- **Testes**: `cd ECOA_backend && npm test` (jest + supertest, 150 casos: login, 401/403, CRUD, audiência, upload ok/recusado,
  Range, path traversal em `/media`, vídeos órfãos, rate limit, CORS). Cada suíte usa pastas temporárias.
- **Deploy**: `render.yaml` tem um segundo serviço `ecoa-backend-v3` (branch `v3`) separado do da v2. Quem precisa de `@types/*`
  no build tem que estar em `dependencies` (o Render instala com `NODE_ENV=production`, sem devDependencies).
- **Limitação conhecida e aceita nesta fase**: o disco do Render free é **efêmero** — treinos criados e vídeos enviados **podem
  sumir num redeploy ou quando o serviço dorme/reinicia** (usuários mockados e o treino de exemplo voltam pelo seed). Produção de
  verdade exige Postgres (treinos/usuários) + armazenamento de objetos (vídeos, ex. Cloudflare R2). Decisão pendente do PM.

## Voz de orientação configurável (v3, 22/10)

Configurações → **Voz**: interruptor (padrão ligado), voz (`Automática (recomendada)` ou uma das vozes pt-BR do aparelho), ritmo
(Devagar 0,8 · **Calma 0,9** · Normal 1,0) e **Testar voz** (o toque também destrava o áudio do navegador). Persistido em
`AppSettings` (`voiceEnabled`, `voiceId`, `voiceRate`; quem já tinha configurações recebe os padrões). `services/speech.ts` aplica voz,
ritmo e tom suave, não repete a mesma frase nem fala duas ao mesmo tempo e, no navegador, detecta fala bloqueada (sem `onstart` em ~1,5 s):
a calibração/sessão mostram **"Toque para ativar a voz"**. A escolha automática é heurística (`services/voiceChoice.ts`, testada).
As frases faladas ficam em `services/speechPhrases.ts` (gentis; infantil calorosa; idosos curtas e −0,05 de ritmo) e o texto da tela não mudou.
**Limite**: a qualidade da voz depende do aparelho. **Alternativa futura (não implementada)**: áudio pré-gravado ou TTS neural na nuvem, para a
mesma voz em todos os aparelhos — decisão de custo/privacidade.

## DS v2 (atual, 20/10) — SUBSTITUI a paleta e as trilhas descritas abaixo

O usuário atualizou o DS (artifact Ttcaqk6QNXVrPd1zQ7wZ2D, versão de 20/10). Regra nova: **todo o app
segue o núcleo** — marinho `brandDeep #061B38` → `heroEnd #173A66` (hero, botão primário, item ativo),
tonal `#C6D8F6`→`#E6EEFA`, cards brancos sobre `surface #F3F4F7`, `brand #0079C8` só como **acento**
(foco, links, gráficos), **Plus Jakarta Sans** 400–600 em frase normal, raios 12/20/24/32, sombras largas
e suaves, hierarquia por camadas (sem bordas). **Só a Trilha Infantil tem cores próprias**: kit
"Ecoa · Hábitos Sustentáveis" (`kidsColors`: verde `#00CC7A`, laranja, amarelo, azul, índigo `#2A2867`,
fundo `#F6F6EC`), **Figtree**, títulos em frase normal, botão em gradiente verde→laranja, texto sobre
as cores vivas **sempre índigo**. Trilha Idoso = núcleo + texto 18px+ e alvos 56px. Os tokens `ecoa-*`,
`idoso-*` e Barlow Condensed são **legado do DS: não usar**. Implementação: `theme/tokens.ts`,
`theme/trailThemes.ts` (Adultos/Idosos = núcleo; Infantil = kit). As seções "Paleta", "Migração" e
"Identidade por trilha" abaixo descrevem a versão anterior (histórico). Validado: `tsc`, export web,
capturas em 360 e 1440px (Home, prévia e calibração). Não migrado ainda: componentes novos do DS
(ArrowButton, MetricPanel, BottomNav…), tema escuro, ícones chapados multicoloridos do kit infantil.

### Atualização do DS (21/10) — protótipo "Telas do App Ecoa"

Gradiente do kit infantil agora é **verde-água → azul** (sem laranja; o laranja fica só em ícones/anéis). As 11
telas do protótipo (artifact AzXNgJF9S64Np44EjvER5k) foram aplicadas com componentes compartilhados em
`components/ds.tsx` (PageIntro, MenuCard, Alert, ActionBar, StepBadge, RepChip): Login (título, mostrar/ocultar
senha, "Criar conta" no rodapé, erro em Alert), Home (cards num Sheet sobre o hero, "Em breve" tracejado),
Menu (item atual marcado, "Sair" separado), Escolha de trilha (MenuCard + chip "5 exercícios"), Prévia
(vídeo 16:9, passos num card, ActionBar fixa no rodapé), Calibração (guia oval, status "Rosto encontrado",
contagem, Cancelar, linha de diagnóstico de quadros). Pendente: tela de Consentimento, Sessão e Resumo não estão
no protótipo e seguem o tema por trilha; erros por campo no Cadastro; "Esqueci minha senha" (sem backend).

## Paleta (design tokens)

Arquivo central: `ECOA_mobile/theme/tokens.ts`. **v2 da paleta** — substituiu a navy+coral das
fases anteriores da v2 (criada "no escuro", sem fonte oficial) pelo **design system oficial da
Care Plus** (artifact fornecido pelo usuário, só tema claro aplicado — ver "Migração para o
design system oficial" abaixo).

| Token | Hex | Uso |
|---|---|---|
| `brand` | `#0079C8` | Azul Care Plus — cor institucional publicada no site da marca. CTAs, ícone ativo, destaques |
| `brandInk` / `brandStrong` | `#005A96` | texto em azul sobre fundo claro / estado pressionado do botão primário |
| `brandSoft` | `#E3F1FB` | fundo tonal — chips selecionados, tint de seleção |
| `brandDeep` / `ink` | `#0B2340` | marinho institucional — hero, cartão de destaque / texto principal e títulos |
| `inkMuted` | `#4E6279` | texto secundário |
| `sky` | `#7FC4EE` | decorativo (ilustrações, gráficos) — nunca em texto |
| `surface` / `surfaceRaised` | `#F4F8FC` / `#FFFFFF` | fundo das telas / cards, campos, sheets |
| `line` / `lineStrong` | `#D7E2EE` / `#8A9DB3` | divisores sutis / bordas de campo e decorativo |
| `success` / `warning` / `danger` | `#1D7044` / `#8A5300` / `#B3261E` | feedback de exercício, cada um com par `*Soft` para fundo de banner/badge |

**Regra que mais se erra** (do próprio DS): `brand` como **texto** só passa contraste sobre
`surfaceRaised` (branco puro); sobre `surface` ou `brandSoft`, usar `brandInk`. O DS oficial
não define nenhuma cor de apoio/coral — era uma invenção da v1 desta paleta; a v2 é mono-azul
("Azul é a assinatura, branco é o respiro"), com variação só de tom dentro do próprio azul.
Fonte de títulos: **Montserrat** (700 para `display`/`title-lg`, 600 para `title-md`); texto
corrido: **Open Sans** — nenhuma das duas estava carregada de fato antes (`Righteous_400Regular`
era uma string solta sem `useFonts`, caindo silenciosamente na fonte padrão do SO; ver "Fontes"
abaixo). `theme/ageGroupThemes.ts` adapta escala de fonte, contraste, gamificação e alvo de
toque por faixa etária em cima desses tokens — não foi tocado pela migração (não referencia
nenhum token de cor).

`theme/tokens.ts` também define `gradients` (hero/primary/accent/calm/success/surface — todas
variações tonais dentro do azul único, já que o DS não define gradiente nenhum: os botões do DS
são preenchimento sólido) e `radii` (`sm` 8 / `md` 16 / `lg` 24 / `pill` 999, do DS, mais um
`xxl` 32 nosso para os cantos bem grandes do hero da Home e do card de resumo de ciclo — o DS
para em 24). `shadow` só define `card` e `nav` oficialmente (ambos cor `ink`, variando
offset/blur); `sm`/`md`/`lg` são extrapolações nossas da mesma receita para os outros níveis de
elevação que o app já usa. O `glow` que existia antes (usado só em `IconBadge`, nunca de fato
acionado por nenhum consumidor) foi removido — dead code, não uma simplificação do DS.

### Migração para o design system oficial

O usuário forneceu um artifact do tipo "Design System" com a paleta real da Care Plus
(`#0079C8`, tirada do site oficial da marca) — substituiu a paleta anterior desta v2, que tinha
sido inventada sem essa fonte. Decisão combinada com o usuário: substituir tudo (cores,
tipografia, raios, sombra) nas telas do fluxo ECOA, mas **só o tema claro** — o DS também
define tema escuro, mas o app não tem nenhuma infraestrutura de tema (sem contexto, sem
`useColorScheme`); fica para uma etapa separada depois.

- **~140 pontos de uso renomeados** em 20 arquivos (`colors.primary900` → `colors.ink`,
  `colors.secondary500` → `colors.brand`, etc.) — sem deixar alias de compatibilidade no
  `tokens.ts` depois de migrar (checado com grep antes de remover).
- **Fontes de verdade pela primeira vez**: não existia `useFonts` em lugar nenhum do app —
  instalados `@expo-google-fonts/montserrat` e `@expo-google-fonts/open-sans`, carregados em
  `App.tsx` com um gate (`ActivityIndicator` até `fontsLoaded`). Open Sans vira a fonte padrão
  de todo `<Text>` via `Text.defaultProps.style` (truque global de uma linha só, em vez de criar
  um componente `AppText` e trocar todo `<Text>` do app); títulos continuam definindo Montserrat
  explicitamente por cima (tem precedência).
- **Componentes do DS (`BeneficiaryCard`, `TextField`, `ListItem`, `BottomNav`, `Badge`) não
  foram recriados 1:1** — são peças do app CarePlus mais amplo, não do fluxo ECOA. Só `Card` e
  `Button`(`GradientButton`) têm equivalente direto aqui, e esses dois tiveram a receita exata
  do DS aplicada (`Card`: `surfaceRaised` + borda `line` + `radius-md` + `shadow-card`,
  inclusive o `radius-md` corrigindo um valor que antes usava `radius-lg`).
- `GradientButton` continua renderizando um gradiente de 2 tons (`brand` → `brandStrong`), não
  o preenchimento sólido que o DS especifica pro componente `Button` — simplificação deliberada
  pra não reescrever a arquitetura do componente nesta passada (os dois tons são próximos o
  bastante pra ler como quase sólido). Documentado aqui como pendência em aberto, não decisão
  silenciosa.
- **Validado**: `npx tsc --noEmit` limpo, os 14 testes unitários passando, captura de tela no
  navegador confirmando fontes e cores aplicadas (ver "Como testar").

### Identidade por trilha (sub-marca "Projeto Ecoa" do DS)

O DS oficial também define a sub-marca Ecoa, com paleta própria por trilha — decisão com o usuário:
aplicar só nas telas do fluxo de exercício (as que sabem a trilha); login, Home e menu continuam
no núcleo Care Plus mono-azul. Fonte de verdade: `theme/trailThemes.ts` (`getTrailTheme(ageGroup)`),
usado por Preview, Calibração, Sessão e Resumo.

- **Adultos**: fundo `ecoa-mist`, chips `ecoa-navy`, botão `ecoa-teal-strong`.
- **Infantil**: fundo `kids-blue`, títulos `kids-yellow`, botão amarelo com texto `kids-deep`.
- **Idosos**: fundo `idoso-cream`, texto `idoso-ink` sem tom "muted", botão `idoso-coral`.
- Títulos e botões em **Barlow Condensed 800 caixa-alta** (`trailFont`, carregada em `App.tsx`).
  `GradientButton` ganhou `fill`/`textColor`/`fontFamily` — botão sólido, como o DS especifica.
- Alvo de toque dos adultos subiu de 44 para 48px (DS). Texto do idoso ≥18px via `fontScale` 1.3.
- **Pendências**: as cores Ecoa do DS foram tiradas de um JPEG pequeno (o próprio DS avisa) —
  trocar pelos valores exatos quando houver Figma. `TrackSelectScreen` ainda usa o núcleo Care Plus.
  Validado: `tsc`, 14 testes, `expo export --platform web`; **sem captura de tela** ainda.

### Responsividade

Regra do usuário: funcionar em celulares de qualquer modelo, tablets e monitores. Em monitores e
notebooks o app é exibido **como tablet**: coluna centralizada de no máximo 768px
(`theme/layout.ts`, `MAX_APP_WIDTH`; aplicada em `App.tsx`, com o resto da janela em `line`).
`getCameraBoxSize` usa essa largura, não a da janela. Validado no navegador (Chromium) em 360, 768
e 1440px nas telas de Login e Home: sem rolagem horizontal. Fluxo de exercício das 3 trilhas (escolha de
trilha, prévia, calibração) também conferido nas 3 resoluções, com webcam simulada: sem estouro e com o
tema por trilha aplicado. **Não conferidas visualmente**: Sessão e Resumo do ciclo (a webcam simulada
não tem rosto, então a calibração corretamente não avança — precisa de rosto real ou foto).

## Design system (componentes reutilizáveis)

A pedido do usuário ("mais moderno, sofisticado, que cause impacto"), a interface inteira foi
redesenhada por cima da paleta acima — nenhuma cor nova fora da CarePlus, só execução visual
melhor. Peças centrais em `components/`:

- `IconBadge.tsx` — selo circular com gradiente para ícones em destaque (cards, cabeçalhos,
  conquistas), substitui os círculos de cor lisa que o app tinha.
- `GradientButton.tsx` — o único botão primário do app (gradiente, feedback tátil ao tocar,
  estado `loading` com spinner). Trocar o CTA do app inteiro é mudar aqui, não em cada tela.
- `CircularProgress.tsx` — anel de progresso animado (`react-native-svg`), usado na contagem
  de 3s da calibração em vez de texto cru.
- `AuthTextField.tsx` — campo de texto de Login/Cadastro (ícone + fundo branco + sombra).

Aplicado em todas as telas: autenticação, Home (hero em gradiente com a textura de
`assets/waves1.png`), Menu (dropdown em gradiente), Configurações e todo o fluxo de
exercícios. Um bug real foi descoberto testando: `components/Menu.tsx` (cabeçalho fixo de
todas as telas) é posicionado `absolute` e não reservava altura de verdade no layout — o
conteúdo das telas começava atrás dele. Passava despercebido com fundo branco liso; ficou
óbvio com o hero em gradiente cobrindo o título. Corrigido dando altura explícita ao wrapper
do header. Validado visualmente (Playwright) nas 10 telas principais depois do fix.

## Estrutura de pastas (nova aba)

- `theme/` — tokens centralizados (cores, tipografia, espaçamento, raios, sombra) e as
  variações de apresentação por faixa etária.
- `data/` — trilhas e exercícios em arquivos TS tipados (`types.ts`, `exercises.ts`,
  `tracks.ts`), sem backend nesta fase.
- `vision/` — bridge WebView↔RN do MediaPipe (`FaceLandmarkerBridge`, `mediapipeAssets`),
  componente de câmera reutilizável (`FaceTrackingCamera`), calibração, detector de movimento
  por exercício (`MovementDetector`) e os limiares/mapeamento de blendshapes — tudo separado
  da UI, com testes unitários.
- `services/` — camada de acesso a dados (consentimento, progresso, voz), trocável por API
  depois.
- `pages/exercise/` — as 6 telas do fluxo (consentimento, seleção de trilha, preview/vídeo,
  calibração, execução do exercício, resumo do ciclo).

## Status do projeto

- [x] Branch `v2` criada; exploração do repositório, paleta e plano aprovados pelo usuário.
- [x] Fase 1 — fundação: tokens, estrutura de pastas.
- [x] Fase 2 — modelo de dados + 15 exercícios (5 por público, 3 validados + 2 guiados cada)
      revisados e aprovados pelo usuário.
- [~] Fase 0 — spike técnico MediaPipe+WebView: código implementado
      (`vision/mediapipeAssets.ts`, `vision/FaceLandmarkerBridge.tsx`,
      `pages/_dev/VisionSpike.tsx`, card "Spike (dev)" em Main — **ainda não removido do
      produto final, ver pendências**). Validado: typecheck, testes e `expo export
      --platform android` sem erro. **Não validado em device físico.**
- [x] Fase 3 — camada `vision/`: `MovementDetector`, `calibration.ts`, `movementThresholds.ts`.
      10 testes unitários (`npm test` em `ECOA_mobile/`). Limiares de ativação são valores
      iniciais razoáveis, não calibrados com rostos reais ainda.
- [x] Fase 4 — fluxo principal de telas: `ConsentScreen` → `TrackSelectScreen` →
      `ExercisePreviewScreen` → `CalibrationScreen` (uma vez por trilha/sessão) →
      `ExerciseSessionScreen` (validado com câmera+voz, ou guiado com espelho+contador+
      autoavaliação) → `CycleSummaryScreen`. Ligado em `routes/AppRouter.tsx`; "Exercícios"
      em Main/Menu checa consentimento antes de entrar.
- [x] Fase 5 — adaptação por faixa etária: `theme/ageGroupThemes.ts` aplicado nas telas do
      fluxo (escala de fonte, alto contraste para idosos, estrelas para crianças, métricas
      numéricas para adultos, alvo de toque maior).
- [x] Fase 6 — progresso: `services/progressStorage.ts` persiste o resumo de cada ciclo em
      AsyncStorage; `CycleSummaryScreen` mostra exercícios concluídos, validados vs. guiados
      e ciclos anteriores da trilha.
- [x] Fase 7 — robustez: permissão de câmera negada, nenhuma câmera encontrada, aviso de
      "rosto não detectado" (fora do quadro ou pouca luz), redução automática da taxa de
      captura em device lento (`vision/FaceTrackingCamera.tsx`). Acessibilidade: contraste AA,
      alvos de toque ≥44px, `accessibilityRole`/`accessibilityLabel` nos controles principais.
- [x] Fase 8 — backend reduzido a `/auth` + `/health`; fluxo antigo de câmera/exercício único
      (`Camera.tsx`, `ExerciseIntro.tsx`, rota WebSocket) removido.
- [x] Compatibilidade web (não faz parte do briefing, pedido do usuário para testar sem
      device): `vision/FaceTrackingCamera.web.tsx` e `pages/_dev/VisionSpike.web.tsx` —
      variantes que o Metro escolhe automaticamente ao buildar para web, evitando que
      `react-native-vision-camera`/`react-native-webview` (sem build web) quebrassem o app
      inteiro em tela branca (`AppRouter.tsx` importa essas telas estaticamente).
- [x] **Câmera e detecção facial reais no navegador** (webcam do PC/tablet via
      `getUserMedia`), não só um aviso — pedido explícito do usuário depois de testar.
      `FaceTrackingCamera.web.tsx` roda `@mediapipe/tasks-vision` direto no mesmo contexto JS
      da página (sem WebView, diferente do nativo) com `runningMode: "VIDEO"` sobre um
      `<video>` ao vivo via `requestAnimationFrame`. Carrega o runtime wasm do CDN oficial via
      `new Function("specifier", "return import(specifier)")` — importar o pacote
      `@mediapipe/tasks-vision` direto (`require`/`import` estático) faz o Metro tentar
      analisar seu `vision_bundle.mjs`, que tem um `import()` dinâmico interno que o Metro não
      suporta estaticamente (erro "Invalid call... import(t.toString())"); o truque força um
      `import()` de verdade resolvido pelo navegador em runtime. O modelo `.task` continua
      bundlado localmente. Validado com Chromium headless + webcam simulada
      (`--use-fake-device-for-media-stream`): MediaPipe inicializa de verdade ("Graph
      successfully started running"), calibração roda, chega no exercício real.
- [x] **Redesign visual completo** (pedido do usuário: "mais moderno, sofisticado, que cause
      impacto"), mantendo a paleta CarePlus — ver "Design system" acima. Descobriu e corrigiu
      um bug real: o header (`Menu.tsx`) não reservava altura de verdade no layout.

### Pendências reais (não posso validar neste ambiente)

1. **Comportamento em device físico** — sem `adb`/emulador aqui. Tudo foi validado
   estaticamente (typecheck, 10 testes unitários, `expo export --platform android` bundlando
   os módulos e todos os assets sem erro), mas ninguém rodou o app de verdade. Ver
   "Como testar" abaixo.
2. **Limiares de ativação dos movimentos** (`vision/movementThresholds.ts`) são valores
   iniciais, não calibrados com rostos reais — esperado ajuste fino depois do teste em device.
3. **Card "Spike (dev)"** continua no código, agora atrás de `__DEV__` (não aparece em build de
   produção, mas ainda é usado em dev para medir latência). Remover de vez quando não precisar
   mais dele como ferramenta de diagnóstico.
4. **Build Android/EAS completo** não foi gerado (sem SDK Android neste ambiente) — só o bundle
   JS via `expo export` foi validado.

### Revisão de código (code-review, 8 agentes, branch `main...v2`)

Achados reais corrigidos: corrida no "ciclos concluídos" do resumo (3 agentes confirmaram),
vazamento de progresso de trilha abandonada corrompendo o histórico salvo, calibração com
fallback silencioso para baseline vazio (2 agentes confirmaram), pilha de navegação crescendo
sem limite (`navigate`→`replace`), throttle adaptativo que nunca se recuperava, troca de
câmera sem aviso, `setTimeout` sem limpeza, union discriminada faltando em `Exercise`, card
dev visível em produção, cópia serial dos assets do MediaPipe. Detalhes no commit
"fix: corrige bugs achados na revisão de código da v2".

**Não corrigido, decisão em aberto com o usuário — segurança do backend de auth** (código
pré-existente de antes da v2, não tocado por esta sprint, mas acessível pelo app):
JWT secret hardcoded e duplicado em `authRouter.ts`/`middleware/auth.ts`, CORS totalmente
aberto, cadastro com condição de corrida no arquivo JSON, sem validação de formato de
e-mail/senha, `dotenv` declarado mas nunca usado (porta/secret não são configuráveis por
ambiente), sem error handler global (vaza stack trace em dev). O mais sério é o secret
hardcoded — qualquer um com acesso ao repo forja um token válido.

**Não corrigido, aceito como débito técnico documentado** (baixo risco/baixo valor agora):
`pages/_dev/VisionSpike.tsx` duplica o laço de captura de `vision/FaceTrackingCamera.tsx` e já
diverge dele (sem o throttle adaptativo nem o aviso de "sem rosto"), e seu `pendingSinceRef`
pode vazar entradas num caminho de erro sem `requestId`; a sobreposição visual dos pontos
faciais que existia na tela antiga não foi reconstruída (a ponte só repassa blendshapes, não
coordenadas); `vision/mediapipeAssets.ts` não teria como invalidar um asset desatualizado
depois de um update do app (só copia se o arquivo de destino ainda não existe); alguns pontos
de duplicação menores (lookup de trilha/exercício repetido em 3 telas, boilerplate de
AsyncStorage repetido em 3 serviços, estilos entre as variantes `.tsx`/`.web.tsx`).

### Simplificações assumidas (documentadas, não decisões silenciosas)

- "Exercício prescrito pelo(a) fonoaudiólogo(a)" do briefing não foi implementado — não há
  backend/portal profissional nesta fase (decisão já registrada: sem backend para o conteúdo).
  O modelo de dados (`getExerciseById`) já suporta acessar um exercício avulso por id, então dá
  para ligar isso depois sem reestruturar nada.
- Calibração acontece uma vez por trilha por sessão do app (não a cada exercício), seguindo a
  ordem do fluxo descrito no briefing; a calibração fica só em memória (`vision/
  calibrationStore.ts`), recalibra a cada nova sessão.

## Vídeos de demonstração

`components/ExerciseVideo.tsx` (expo-video) já toca vídeo de verdade — silencioso, em loop, sem
controles. `Exercise.demoVideoAsset` (local, `require(...)`) tem prioridade sobre
`Exercise.demoVideoUrl` (remoto, ainda placeholder); `ExercisePreviewScreen` cai no gradiente
com ícone de play só quando nenhum dos dois estiver resolvido.

- **Feito**: trilha adulta inteira (5 de 5) — todos gerados pelo usuário via prompt de IA.
  Arquivos em `assets/videos/adults-*.mp4`: `jaw-stretch`, `vowel-overarticulation`,
  `smile-pucker`, `lip-trill`, `diaphragmatic-breathing`. Todos 1024×576 (16:9).
- **`docs/video-prompts/`** traz os 15 prompts prontos pro Gemini — uma pasta por faixa etária
  (`infantil/`, `adultos/`, `idosos/`), um arquivo por exercício dentro dela, cada um com o
  contexto do projeto embutido e o texto exato exibido no app pra aquele exercício. Substitui
  o artifact publicado na conversa, que não ficava versionado no repo.
- **Bug corrigido**: a caixa de preview tinha `height: 180` fixo com largura total — numa tela
  larga isso dá uma proporção bem mais "esticada" que 16:9, e com `contentFit="cover"` o vídeo
  era escalado e cortado verticalmente (só aparecia uma fatia central, ex. só olhos e nariz).
  Troquei `videoPlaceholder` para `aspectRatio: 16/9` (em vez de altura fixa) e o `contentFit` de
  `ExerciseVideo` de `"cover"` para `"contain"` — mesmo raciocínio já aplicado antes na câmera
  (`FaceTrackingCamera.web.tsx`), prioriza nunca cortar o rosto mesmo que um vídeo futuro venha
  numa proporção diferente de 16:9.
- **Idosos (5 de 5)**: `elderly-jaw-open-close`, `pucker-hold`, `smile-hold`, `tongue-elevation` ligados em `assets/videos/elderly-*.mp4` (20/10). `effortful-swallow` ligado em 21/10. **Infantil (5 de 5)** ligados (21/10). **Os 15 vídeos estão ligados** — só resta comprimir os grandes e decidir a hospedagem. **Tamanho**: `pucker-hold` (17MB, 1080p, índice no fim do arquivo) e `smile-hold` (10MB) foram recomprimidos em 21/10 para 1024x576, H.264, sem áudio, faststart (~0,2MB cada); todos os 15 decodificam sem erro (ffmpeg). Originais não ficaram no repo.
- **Pendente**: os outros 6 (trilhas infantil e idosos). Plano combinado com o usuário: a
  trilha adulta era o primeiro lote, agora validada — próximo passo é gerar as outras duas.
  Reaproveitamento entre trilhas é limitado — só "Alongamento de mandíbula" tem um par visual
  parecido na trilha de idosos (abertura e fechamento de boca); os outros 4 exercícios da trilha
  adulta não têm equivalente nas outras trilhas.
- **Hospedagem**: os vídeos bundlados localmente (`require`) funcionam bem para este estágio,
  mas não escalam para produção (infla o tamanho do app, não tem cache/CDN). Decisão de produção
  ainda em aberto — ao hospedar externamente, só trocar `demoVideoAsset` por
  `{ uri: exercise.demoVideoUrl }` no `source` passado a `ExerciseVideo`, o componente não muda.
  Vercel Hobby (grátis) não é uma opção viável para isso: proíbe uso comercial nos termos e o
  plano Pro (US$ 20/mês) seria necessário de qualquer forma; para o vídeo em si, object storage
  com CDN voltado a mídia (Cloudflare R2, Bunny.net) é mais apropriado que servir do mesmo deploy
  do app.

## Redesign da tela de execução do exercício (câmera)

A pedido do usuário, pesquisei apps do mesmo ramo que usam vídeo/câmera (fisioterapia por
câmera como Kaia Health, apps de pose detection como True Pose/FLEX//AI, um protótipo de
treino de fala do Interspeech 2021) pra replicar os padrões de interação. Achado comum: a
câmera é o elemento principal da tela (quase em espelho), com o feedback **sobreposto** nela
em vez de caixas de texto separadas ao lado. `ExerciseSessionScreen.tsx` foi redesenhado nessa
linha:

- A câmera agora ocupa a maior parte da tela (altura calculada como fração da altura da janela),
  com a tela inteira dentro de um `ScrollView` (antes era uma `View` com `flex: 1`, sem rolagem).
- `FaceTrackingCamera`/`FaceTrackingCamera.web.tsx` ganharam uma prop `borderColor` — o contorno
  da câmera muda de cor conforme o feedback (`getFeedbackColor`): azul-marinho aguardando,
  azul claro segurando, verde ao concluir repetição/exercício.
- A mensagem de feedback, a fileira de repetições e a métrica numérica viraram um overlay
  (`LinearGradient` + texto branco) na base da própria câmera, em vez de uma caixa sólida
  abaixo dela — libera espaço vertical e deixa a câmera maior.
- A tela guiada (sem validação por câmera) ganhou o mesmo tratamento visual de câmera maior,
  mas manteve instruções/botão abaixo dela (sem overlay), já que não há feedback ao vivo pra
  mostrar por cima.
- A caixa da câmera não usa mais altura fixa com largura total — isso deixava tarja preta nas
  laterais (desktop) ou em cima/embaixo (celular) sempre que a proporção real da webcam (lida
  do próprio `<video>` via `onLoadedMetadata`, prop `onAspectRatioChange` em
  `FaceTrackingCamera.web.tsx`) não batia com a proporção da caixa. `vision/cameraBoxSize.ts`
  (`getCameraBoxSize`) calcula largura e altura juntas a partir dessa proporção real, e encolhe
  as duas junto quando a tela é estreita — sem isso, uma caixa larga em desktop (ex. 1800×450)
  sobre uma webcam 4:3 sobrava tarja enorme nas laterais com `contentFit: "contain"`. Resolvido
  sem usar `"cover"` (que cortaria o rosto, o mesmo problema já corrigido antes no vídeo de
  demonstração).
- **`CalibrationScreen.tsx` recebeu o mesmo tratamento depois** — o usuário relatou a câmera
  "abrindo em tela cheia" ali; a tela tinha ficado de fora da primeira passada (altura fixa de
  280px, `View` sem rolagem) e usava uma caixa só largura-total sem considerar a proporção real
  da câmera. Agora usa `getCameraBoxSize` também, dentro de um `ScrollView` — mesmo mecanismo
  das outras telas, sem caixa especial.

## Validação alinhada às instruções (21/10)

Auditoria pedida pela usuária ("as validações não condizem com a descrição nem com o vídeo"). Achados reais:
`adults-smile-pucker` validava só sorriso ×8 (dava para nunca fazer o bico) e `adults-vowel-overarticulation`
validava só abertura de mandíbula (I e U têm a boca quase fechada). Agora `ValidationRule.mode` escolhe o detector
(`vision/createDetector.ts`, `vision/SequenceDetectors.ts`): `alternate` conta cada troca sorriso↔bico; `vowels`
exige A-E-I-O-U em ordem (regiões de jawOpen × sorriso × bico/funnel). A sustentação ("segure 2–3 s") ganhou
tolerância de 400 ms de oscilação — antes um único quadro abaixo do limiar zerava a contagem. 19 testes. **Limiares
ainda não calibrados com rostos reais** (podem exigir ajuste fino); cheekPuff do MediaPipe costuma ser baixo.

## Todos os exercícios validados pela câmera + relaxamento (21/10)

Decisão da usuária: **os 15 exercícios são validados por visão computacional** (nenhum "guiado" restou em
`data/exercises.ts`) e o **tempo de relaxamento conta**. Como o MediaPipe não vê língua, barriga nem garganta,
os 6 exercícios antes guiados usam um **indicador facial aproximado**, declarado ao paciente na prévia
(`Exercise.validationNote`): tongue-out/tongue-elevation/respiração = boca aberta (jawOpen, limiares 0,15/0,06/0,06),
tongue-click = abrir/fechar a boca ×10, lip-trill = lábios projetados (mouthPucker), deglutição = lábios firmes
(`lipPress` = mouthPressLeft/Right). `ValidationRule` ganhou `activationDelta`, `relaxDurationMs` e `promptMessage`.
Relaxamento: depois de cada repetição o rosto precisa ficar solto por `relaxDurationMs` (padrão 1,5 s com tempo
de segurar) — a tela mostra "Relaxe... Ns"; na respiração o relaxamento é a inspiração. Escape: sem progresso por
25 s aparece "Pular este exercício" (registrado como não validado) para ninguém ficar preso com limiares ainda
não calibrados. Balãozinho: cheekPuff baixado para 0,1. **Resumo do ciclo** mostrava 0/5: o efeito limpava o
armazenamento e o re-render lia vazio; agora usa um snapshot (useRef). A tela guiada (`GuidedExerciseSession`) ficou
sem uso. **Honestidade**: estes 6 validam um indicador, não o movimento em si (língua, diafragma, deglutição).

## Correção: movimento "tongueOut" nunca validava

O usuário relatou alguns exercícios "pedindo para abrir a boca" quando não deveriam. Revisei o
mapeamento movimento→exercício em `data/exercises.ts` e a lógica de `vision/MovementDetector.ts`
a fundo: cada exercício só é avaliado contra o `movement` do seu próprio `validationRule` (sem
vazamento entre exercícios — confirmado lendo `computeRelativeScore`), e os únicos três
exercícios com `movement: "jawOpen"` são, de fato, os três sobre abertura de mandíbula/vogais
(`adults-jaw-stretch`, `adults-vowel-overarticulation`, `elderly-jaw-open-close`) — nenhum
outro usa jawOpen nos dados.

**Achado real, diferente**: `children-tongue-out` ("Língua de cobrinha") estava configurado como
`validado` com `movement: "tongueOut"` — mas o MediaPipe Face Landmarker **não expõe esse
blendshape**. A lista oficial de 52 categorias do MediaPipe (diferente da do ARKit, que tem um
a mais) não inclui rastreamento de língua — não dá pra ver a língua de forma confiável só com
landmarks 2D de rosto. Na prática, o score desse movimento ficava sempre em 0, nunca passava do
limiar, e o exercício ficava preso pra sempre pedindo "Coloque mais a língua para fora".
Corrigido: `FacialMovement` perdeu `"tongueOut"` (removido de `data/types.ts` e das três tabelas
em `vision/movementThresholds.ts`), e `children-tongue-out` virou `"guiado"` — mesmo tratamento
que seus "irmãos" de língua já tinham (`children-tongue-click`, `elderly-tongue-elevation`),
que por essa mesma razão já eram guiados, não validados.

Não encontrei, revisando o código, como o prompt de um exercício vazaria pro de outro — se o
problema relatado persistir num exercício específico depois dessa correção, preciso saber qual
exercício e a mensagem exata que apareceu pra investigar mais a fundo (os limiares em
`vision/movementThresholds.ts` são valores iniciais, nunca calibrados contra rostos reais —
ver "Pendências reais" acima — então também é possível que seja um limiar solto demais/apertado
demais pro movimento certo, não o movimento errado sendo checado).

## Como testar

1. `cd ECOA_mobile && npm install && npm test` — 10 testes unitários das regras de validação.
2. `npx tsc --noEmit` em `ECOA_mobile/` e em `ECOA_backend/` — typecheck.
3. Para testar de verdade num device físico Android (não funciona no Expo Go):
   ```
   cd ECOA_mobile
   npx expo prebuild
   npx expo run:android
   ```
4. Para testar no navegador com a webcam do PC/tablet de verdade: `.env` traz
   `EXPO_PUBLIC_API_IP=10.0.2.2` (alias do emulador Android), que não resolve num navegador
   desktop — sobrescreva na hora de rodar:
   ```
   cd ECOA_backend && npm run dev
   # em outro terminal:
   cd ECOA_mobile && EXPO_PUBLIC_API_IP=localhost npx expo start --web
   ```
6. No app: entrar como paciente (ex.: `mariana.costa@ecoa.test` / `ecoa2026`, ou sem preencher nada para o acesso livre; o admin
   `ecoafono@email.com` usa a senha de `ADMIN_PASSWORD`) →
   "Exercícios" → aceitar consentimento → escolher uma trilha → calibração (3s, rosto
   relaxado) → fazer os 5 exercícios → conferir o resumo do ciclo. No navegador a câmera e a
   detecção já rodam de verdade (webcam via `getUserMedia`); `vision/FaceTrackingCamera.tsx`
   (app nativo) continua sendo o caminho de produção.
7. Card "Spike (dev)" na Home mede latência bruta da ponte MediaPipe isoladamente, útil para
   depurar se o fluxo de produção parecer lento ou travado (só funciona no app nativo).
8. No device físico, reportar: a câmera abre? o status muda para "pronto"? o feedback por
   voz/texto reage aos movimentos? a latência é aceitável? Isso decide se os limiares em
   `movementThresholds.ts` precisam de ajuste.

### Testar num celular de verdade (Android/iOS) — não é Expo Go

O Expo Go genérico (da loja de apps) **não funciona** neste projeto — ele só roda módulos
nativos pré-compilados, e `react-native-vision-camera` não está entre eles. O caminho certo é
um *development build* (um app próprio, não o Expo Go): depois de instalado uma vez, aceita o
mesmo fluxo de QR code via `npx expo start --dev-client` para recarregar só o JS sem recompilar.

- **Android** (grátis, local): celular por USB com depuração USB ativada, `npx expo prebuild &&
  npx expo run:android` — só precisa do Android SDK na máquina (já presente neste setup, em
  `AppData/Local/Android/Sdk`).
- **iOS**: `expo run:ios` exige Xcode, que só roda em Mac — **não tem como compilar pra iOS
  numa máquina Windows**. Sem Mac disponível, as opções são: (a) conta Apple Developer Program
  (US$ 99/ano) + EAS Build (compila na nuvem, sem precisar de Mac, mas precisa dessa conta paga
  pra instalar via TestFlight/ad-hoc num iPhone físico); ou (b) acesso a um Mac emprestado/
  alugado (MacInCloud etc.) com Apple ID gratuito — `expo run:ios` instala de graça, mas o
  provisionamento expira em 7 dias e precisa reinstalar. Não existe caminho gratuito sem passar
  por um Mac em algum momento. Decisão em aberto com o usuário — por ora, só Android.

## Deploy (Render + Vercel)

Back-end no **Render** (free), front-end web no **Vercel** — cada um na sua própria conta
conectada ao GitHub (`Challenge-CarePlus/Sprint4_Mobile`), ninguém além do usuário consegue
autenticar essas contas. Dois ajustes de infraestrutura foram necessários pra isso funcionar:

- **`ECOA_backend/tsconfig.json` estava vazio** — sem `outDir`, `tsc` compilava os `.js` dentro
  da própria `src/` em vez de `dist/`, e o script `start` (`node dist/server.js`) quebraria no
  primeiro deploy. Corrigido com `outDir: "dist"`, `rootDir: "src"`, `module: "CommonJS"`.
- **Porta e segredo do JWT hardcoded** — `PORT` agora vem de `process.env.PORT` (hosts como o
  Render atribuem a porta por env var; sem isso o serviço nunca fica "healthy"). O `JWT_SECRET`
  duplicado em `authRouter.ts`/`middleware/auth.ts` virou um único `src/config/jwt.ts` lido de
  `process.env.JWT_SECRET` — o Render gera um valor aleatório sozinho via `generateValue: true`
  no `render.yaml`. `CORS_ORIGIN` também é configurável (sem definir, aceita qualquer origem,
  como antes).
- `ECOA_mobile/config/apiConfig.ts` ganhou `EXPO_PUBLIC_API_BASE_URL` — o esquema antigo
  (`EXPO_PUBLIC_API_IP` + `EXPO_PUBLIC_API_PORT`) monta sempre `http://IP:PORTA`, que não
  representa um host de produção (HTTPS, sem porta custom, ex. `https://ecoa-backend.onrender.com`).
  A variável nova tem prioridade quando definida; o esquema antigo continua valendo pra
  emulador Android/LAN em dev local.
- `render.yaml` (raiz do repo) e `ECOA_mobile/vercel.json` guardam a configuração de build como
  código — `rootDir`/Root Directory apontando pra cada pasta do monorepo, já que back-end e
  front-end vivem no mesmo repositório.
- **Achado testando o build de produção**: `npx expo export --platform web` com variável de
  ambiente nova (`EXPO_PUBLIC_API_BASE_URL`) **não pegava o valor** se já existia um `dist/`
  ou cache do Metro de uma exportação anterior — o bundle saía idêntico (mesmo hash de arquivo)
  ao de antes, ignorando a env var. Resolvido adicionando `--clear` ao comando de build (limpa
  o cache do bundler); por segurança, isso foi incluído no `vercel.json` também, não só
  localmente.
- **Validado de ponta a ponta antes de publicar**: build de produção do back-end
  (`npm run build && PORT=4001 JWT_SECRET=... npm start`) respondendo `/health` e `/auth/login`
  de verdade; export estático do front-end (`npx expo export --platform web --clear`) servido
  por um servidor HTTP puro (sem dev server do Expo) com `EXPO_PUBLIC_API_BASE_URL` apontando
  pro back-end de teste — login completo funcionando via Playwright, sem nenhum processo de
  desenvolvimento no meio.

**Limitação conhecida, não resolvida**: `ECOA_backend/src/db/users.json` é um arquivo JSON local
(sem banco de dados de verdade) — no plano free do Render, o sistema de arquivos é efêmero.
Novos cadastros feitos no site publicado funcionam enquanto o serviço não reinicia, mas podem
ser perdidos num redeploy ou quando o Render reinicia o serviço por inatividade (free tier
"dorme" depois de 15 min sem uso). O usuário de teste (`ecoafono@email.com`) sempre volta, por
estar no arquivo versionado no repo. Resolver de verdade exigiria um banco de dados externo
(ex. Postgres gratuito do próprio Render/Supabase) — fora do escopo de hoje.

**Versionamento**: conectando os dois projetos ao GitHub (não um deploy avulso por CLI), tanto
Render quanto Vercel criam um deploy novo a cada push na branch configurada, cada um amarrado
ao commit exato — dá pra ver o histórico, comparar e reverter pelo painel de cada serviço sem
precisar resolver isso aqui. A Vercel também gera uma preview URL separada por Pull Request,
útil pra revisar uma mudança antes de ir pra produção.

## Adaptações em relação ao briefing original

- "Deploy no Vercel" (frontend web) e Render (API) — ver "Deploy" acima; o app nativo (Android)
  continua existindo em paralelo via `expo run:android`, descrito em "Como testar".
- "Mobile futuro via Capacitor/WebView" já é o presente: a WebView entra agora como sandbox
  de cálculo do MediaPipe, não como o app inteiro.
- "Web Speech API" (específica de navegador) substituída por `expo-speech`, o equivalente
  nativo, mantendo pt-BR e a regra de não repetir a mesma instrução em sequência.
