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

### Pendências reais (não posso validar neste ambiente)

1. **Comportamento em device físico** — sem `adb`/emulador aqui. Tudo foi validado
   estaticamente (typecheck, 10 testes unitários, `expo export --platform android` bundlando
   os ~1084 módulos e todos os assets sem erro), mas ninguém rodou o app de verdade. Ver
   "Como testar" abaixo.
2. **Limiares de ativação dos movimentos** (`vision/movementThresholds.ts`) são valores
   iniciais, não calibrados com rostos reais — esperado ajuste fino depois do teste em device.
3. **Card "Spike (dev)"** em Main ainda está no app — mantive de propósito como ferramenta de
   diagnóstico até a validação em device confirmar que o fluxo de produção funciona; remover
   depois.
4. **Build Android/EAS completo** não foi gerado (sem SDK Android neste ambiente) — só o bundle
   JS via `expo export` foi validado.

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
4. No app: Login (`ecoafono@email.com` / `ecoa2026`, ou cadastre pela tela de registro) →
   "Exercícios" → aceitar consentimento → escolher uma trilha → calibração (3s, rosto
   relaxado) → fazer os 5 exercícios → conferir o resumo do ciclo.
5. Card "Spike (dev)" na Home mede latência bruta da ponte MediaPipe isoladamente, útil para
   depurar se o fluxo de produção parecer lento ou travado.
6. Reportar: a câmera abre? o status muda para "pronto"? o feedback por voz/texto reage aos
   movimentos? a latência é aceitável? Isso decide se os limiares em
   `movementThresholds.ts` precisam de ajuste.

## Adaptações em relação ao briefing original

- "Deploy no Vercel" não se aplica (app nativo, não web) — critério substituído por
  "build Android funcionando" via `expo run:android`.
- "Mobile futuro via Capacitor/WebView" já é o presente: a WebView entra agora como sandbox
  de cálculo do MediaPipe, não como o app inteiro.
- "Web Speech API" (específica de navegador) substituída por `expo-speech`, o equivalente
  nativo, mantendo pt-BR e a regra de não repetir a mesma instrução em sequência.
