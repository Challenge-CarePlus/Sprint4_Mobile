# ECOA — Exercícios de Fonoaudiologia em Casa (v2)

Nova aba do app ECOA (CarePlus) para o paciente continuar, com autonomia e supervisão, os
exercícios de fonoaudiologia das sessões semanais. Branch de trabalho: `v2`.

## Stack

- **ECOA_mobile/**: React Native 0.81 + Expo 54 + TypeScript (strict), React Navigation
  (native-stack), `react-native-vision-camera` v5 para a câmera nativa, AsyncStorage para
  persistência local. Não roda no Expo Go (depende de código nativo de câmera) — usar
  `npx expo run:android`.
- **ECOA_backend/**: Node + Express + WebSocket, usado **apenas para login/cadastro (JWT)**.
  A detecção facial via WebSocket/TensorFlow que existia no backend está sendo removida da
  nova aba — toda a visão computacional passa a rodar localmente no aparelho.

### Decisão de arquitetura: visão computacional

O briefing original pedia MediaPipe Face Landmarker *Web*, que não roda nativamente em React
Native. Decisão (aprovada com o usuário): uma **WebView local e invisível**, carregando
`@mediapipe/tasks-vision` como asset bundlado (sem CDN), recebe frames da câmera nativa via
`postMessage` e devolve landmarks/blendshapes. Processamento 100% no aparelho, nenhum vídeo ou
imagem sai do dispositivo. Risco técnico principal: latência da ponte WebView em tempo real —
validado via spike antes de construir o restante da feature (ver status abaixo).

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

## Estrutura de pastas (nova aba)

- `theme/` — tokens centralizados (cores, tipografia, espaçamento, raios, sombra).
- `data/` — trilhas e exercícios em JSON tipado (sem backend nesta fase).
- `vision/` — bridge WebView↔RN do MediaPipe, calibração, um detector por tipo de movimento,
  separado da UI, com testes unitários.
- `services/` — camada de acesso a dados (progresso, trilhas), trocável por API depois.

## Status do projeto

- [x] Branch `v2` criada.
- [x] Exploração do repositório e paleta aprovadas pelo usuário.
- [x] Fase 1 — fundação: tokens, estrutura de pastas, este CLAUDE.md.
- [ ] Fase 0 — spike técnico MediaPipe+WebView (latência em device real — não pode ser
      validado neste ambiente, sem `adb`/emulador disponível; precisa ser rodado via
      `expo run:android` por quem tem o device).
- [ ] Fase 2 — modelo de dados + tabela de 15 exercícios (aguardando revisão com
      fonoaudióloga antes de prosseguir).
- [ ] Fase 3 — camada `vision/`.
- [ ] Fase 4 — fluxo principal de telas.
- [ ] Fase 5 — adaptação visual por faixa etária.
- [ ] Fase 6 — progresso e resumo de ciclo.
- [ ] Fase 7 — robustez e acessibilidade.
- [ ] Fase 8 — limpeza do backend (remover detecção facial via WebSocket) + build Android.

## Adaptações em relação ao briefing original

- "Deploy no Vercel" não se aplica (app nativo, não web) — critério substituído por
  "build Android funcionando" via `expo run:android`.
- "Mobile futuro via Capacitor/WebView" já é o presente: a WebView entra agora como sandbox
  de cálculo do MediaPipe, não como o app inteiro.
