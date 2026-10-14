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

## Paleta (design tokens)

Arquivo central: `ECOA_mobile/theme/tokens.ts`.

| Token | Hex | Uso |
|---|---|---|
| `primary900` | `#1E3E6D` | títulos |
| `primary700` | `#284A7D` | marca, CTAs, bordas |
| `primary500` | `#3C64AA` | estados hover/pressed, UI secundária |
| `primary100` | `#EAF2FF` | tint de seleção/dica |
| `secondary500` | `#E0704F` | coral do logo, decorativo/gamificação (com texto escuro) |
| `secondary700` | `#B84A2E` | coral escurecido, botões/chips com texto branco |
| `neutral900` | `#1F2933` | texto principal |
| `neutral500` | `#6E7681` | texto secundário |
| `neutral300` | `#8B8B8B` | decorativo apenas (não usar em texto, falha AA) |
| `neutral200` / `neutral100` | `#E5E7EB` / `#F3F4F6` | bordas suaves / fundos alternativos |
| `success` / `warning` / `attention` / `error` | `#2E7D32` / `#F9A825` / `#B84F00` / `#C62828` | feedback de exercício |

Todas as combinações texto/fundo validadas em AA (≥4.5:1). `warning` usa texto `neutral900`
(não branco) e `attention` foi escurecido de `#EF6C00` para `#B84F00` — as duas correções
necessárias para passar AA sobre as cores já existentes no app. Fonte de títulos: `Righteous`.
`theme/ageGroupThemes.ts` adapta escala de fonte, contraste, gamificação e alvo de toque por
faixa etária em cima desses tokens.

`theme/tokens.ts` também define `gradients` (hero/primary/accent/calm/success/surface — o
`hero` reaproveita o degradê navy→coral do próprio logo ECOA) e uma escala maior de `radii`
(`lg`/`xl`/`xxl`) e `shadow` (`sm`/`md`/`lg`/`glow`), usados pelo design system em
`components/` (ver "Redesign visual" abaixo).

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

- **Feito**: trilha adulta inteira (5 de 5) — todos gerados pelo usuário via prompt de IA
  (roteiro completo e os 15 prompts por trilha estão num artifact publicado nesta conversa, não
  neste repo). Arquivos em `assets/videos/adults-*.mp4`: `jaw-stretch`,
  `vowel-overarticulation`, `smile-pucker`, `lip-trill`, `diaphragmatic-breathing`. Todos
  1024×576 (16:9).
- **Bug corrigido**: a caixa de preview tinha `height: 180` fixo com largura total — numa tela
  larga isso dá uma proporção bem mais "esticada" que 16:9, e com `contentFit="cover"` o vídeo
  era escalado e cortado verticalmente (só aparecia uma fatia central, ex. só olhos e nariz).
  Troquei `videoPlaceholder` para `aspectRatio: 16/9` (em vez de altura fixa) e o `contentFit` de
  `ExerciseVideo` de `"cover"` para `"contain"` — mesmo raciocínio já aplicado antes na câmera
  (`FaceTrackingCamera.web.tsx`), prioriza nunca cortar o rosto mesmo que um vídeo futuro venha
  numa proporção diferente de 16:9.
- **Pendente**: os outros 10 (trilhas infantil e idosos). Plano combinado com o usuário: a
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

- A câmera agora ocupa a maior parte da tela (altura calculada como fração da altura da janela
  via `getCameraHeight`, não mais um `height: 280` fixo), com a tela inteira dentro de um
  `ScrollView` (antes era uma `View` com `flex: 1`, sem rolagem).
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
  do próprio `<video>` via `onLoadedMetadata`, nova prop `onAspectRatioChange` em
  `FaceTrackingCamera.web.tsx`) não batia com a proporção da caixa. `getCameraBoxSize` em
  `ExerciseSessionScreen.tsx` calcula largura e altura juntas a partir dessa proporção real, e
  encolhe as duas junto quando a tela é estreita — sem isso, uma caixa larga em desktop (ex.
  1800×450) sobre uma webcam 4:3 sobrava tarja enorme nas laterais com `contentFit: "contain"`.
  Resolvido sem usar `"cover"` (que cortaria o rosto, o mesmo problema já corrigido antes no
  vídeo de demonstração).
- `CalibrationScreen.tsx` **não foi alterado** — continua com a câmera no tamanho original
  (280px), decisão deliberada pra não arriscar o layout dela (não usa `ScrollView`, tem
  título+subtítulo+anel de progresso abaixo da câmera; aumentar a câmera ali sem rolagem podia
  cortar o anel de progresso em telas baixas).

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
6. No app: Login (`ecoafono@email.com` / `ecoa2026`, ou cadastre pela tela de registro) →
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

## Adaptações em relação ao briefing original

- "Deploy no Vercel" não se aplica (app nativo, não web) — critério substituído por
  "build Android funcionando" via `expo run:android`.
- "Mobile futuro via Capacitor/WebView" já é o presente: a WebView entra agora como sandbox
  de cálculo do MediaPipe, não como o app inteiro.
- "Web Speech API" (específica de navegador) substituída por `expo-speech`, o equivalente
  nativo, mantendo pt-BR e a regra de não repetir a mesma instrução em sequência.
