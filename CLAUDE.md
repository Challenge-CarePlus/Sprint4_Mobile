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
- [x] Compatibilidade web para teste de navegação (não faz parte do briefing, mas testado a
      pedido do usuário): `vision/FaceTrackingCamera.web.tsx` e `pages/_dev/VisionSpike.web.tsx`
      — variantes que o Metro escolhe automaticamente ao buildar para web, sem importar
      `react-native-vision-camera`/`react-native-webview` (nenhum dos dois tem build web; sem
      essas variantes o app inteiro ficava em tela branca, não só a tela de câmera, porque
      `AppRouter.tsx` importa essas telas estaticamente). Validado de ponta a ponta com
      Playwright headless: login → Main → consentimento → trilha → preview → calibração
      renderizam certo no navegador, com aviso de que câmera é só no app nativo.

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
- Vídeo de demonstração é um placeholder visual (ícone + texto), não um player de vídeo real —
  o campo `demoVideoUrl` já existe no modelo de dados para quando houver vídeos de verdade.
- Calibração acontece uma vez por trilha por sessão do app (não a cada exercício), seguindo a
  ordem do fluxo descrito no briefing; a calibração fica só em memória (`vision/
  calibrationStore.ts`), recalibra a cada nova sessão.

## Como testar

1. `cd ECOA_mobile && npm install && npm test` — 10 testes unitários das regras de validação.
2. `npx tsc --noEmit` em `ECOA_mobile/` e em `ECOA_backend/` — typecheck.
3. Para testar de verdade num device físico Android (não funciona no Expo Go):
   ```
   cd ECOA_mobile
   npx expo prebuild
   npx expo run:android
   ```
4. Para testar só a navegação/UI no navegador (câmera não funciona, é só placeholder — ver
   Fase 0): `.env` traz `EXPO_PUBLIC_API_IP=10.0.2.2` (alias do emulador Android), que não
   resolve num navegador desktop — sobrescreva na hora de rodar:
   ```
   cd ECOA_backend && npm run dev
   # em outro terminal:
   cd ECOA_mobile && EXPO_PUBLIC_API_IP=localhost npx expo start --web
   ```
6. No app: Login (`ecoafono@email.com` / `ecoa2026`, ou cadastre pela tela de registro) →
   "Exercícios" → aceitar consentimento → escolher uma trilha → calibração (3s, rosto
   relaxado) → fazer os 5 exercícios → conferir o resumo do ciclo. No navegador, a tela de
   calibração para aqui com um aviso — é esperado, a câmera é só no app nativo.
7. Card "Spike (dev)" na Home mede latência bruta da ponte MediaPipe isoladamente, útil para
   depurar se o fluxo de produção parecer lento ou travado (só funciona no app nativo).
8. No device físico, reportar: a câmera abre? o status muda para "pronto"? o feedback por
   voz/texto reage aos movimentos? a latência é aceitável? Isso decide se os limiares em
   `movementThresholds.ts` precisam de ajuste.

## Adaptações em relação ao briefing original

- "Deploy no Vercel" não se aplica (app nativo, não web) — critério substituído por
  "build Android funcionando" via `expo run:android`.
- "Mobile futuro via Capacitor/WebView" já é o presente: a WebView entra agora como sandbox
  de cálculo do MediaPipe, não como o app inteiro.
- "Web Speech API" (específica de navegador) substituída por `expo-speech`, o equivalente
  nativo, mantendo pt-BR e a regra de não repetir a mesma instrução em sequência.
