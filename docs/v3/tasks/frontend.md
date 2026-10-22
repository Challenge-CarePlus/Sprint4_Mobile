# V3 — Tarefa do Frontend (ECOA_mobile)

Leia antes: `docs/v3/SPEC.md` (contrato), o protótipo do administrador
https://claude.ai/artifact/EttUPt9beEkP1ksTjpzeJY (fonte principal; o HTML tem o CSS `.px-*` e o JSX de cada tela:
`function Login`, `Home`, `Evolution`, `Patient`, `Trainings`, `EditTraining`, `EditExercise`, `PickPatients`),
o protótipo do fluxo do usuário https://claude.ai/artifact/AzXNgJF9S64Np44EjvER5k e o DS
https://claude.ai/artifact/Ttcaqk6QNXVrPd1zQ7wZ2D. **Fidelidade extrema ao protótipo** é exigência da usuária.

## Regras de trabalho
- Branch **v3** (`git branch --show-current`). **Não altere a v2.** Sem push (o PM faz).
- Outras sessões editam a árvore: `git status` antes, commite **só os seus arquivos**, commits pequenos por tela/etapa.
- Dúvida de contrato → `maestri ask PM`. Reporte por etapa com `maestri ask "PM" "<telas, hashes, tsc/testes, desvios, o que NÃO validou>"`.
- Mantém: responsivo (coluna máx. 768px; 360/768/1440), alvos ≥ 48px (56px idoso), foco visível em `brand` sem contorno preto,
  Trilha Infantil com kit próprio, **todos os exercícios validados pela câmera**, `AUTH_REQUIRED=false` abre sem login.

## Etapa A — Tema claro / escuro / automático
- `ThemeProvider` + hook (`useTheme`): `auto` (segue `useColorScheme`), `light`, `dark`; persistido em AsyncStorage; troca instantânea.
- Tokens escuros do DS (`tokens.json` do DS: `surface #0A1322`, `surface-raised #131E31`, `ink #EEF2F8`, `brand #5AB4F0`,
  `brand-deep #1C3A66`, `hero-end #2A4F85`, `tonal-*`, status…). Sombras no escuro: nenhuma (elevação por camada).
- Migrar o uso **estático** de `colors`/`shadow` (importado direto em ~25 arquivos) para cores vindas do tema
  (`StyleSheet` dinâmico por tema ou `useMemo`). **Trilha Infantil fica sempre clara.** Contraste AA nos dois temas.
- Configurações → **Aparência** (OptionGroup Automático/Claro/Escuro, como no protótipo) e **botão lua/sol** na tela de entrada.

## Etapa B — Entrada e papéis
- Nova tela de entrada "Bem-vindo ao Ecoa" (fiel ao protótipo): aviso "Hoje o acesso é livre", e-mail e senha opcionais,
  "Entrar", rodapé "Equipe Ecoa: entre com seu e-mail para abrir o painel".
  Vazio → paciente anônimo · e-mail admin → exige senha (erro do protótipo) e chama `POST /auth/login` · e-mail de paciente
  mockado → login real e identificado · e-mail desconhecido → anônimo · senha errada de usuário conhecido → "E-mail ou senha inválidos".
- `AuthContext` com `role` (`guest | patient | admin`) e `user`; menu mostra "Sair" quando há sessão; Cadastro fica dormente.

## Etapa C — Painel do administrador (fiel ao protótipo)
Início admin (HeroHeader "Painel do administrador"; cards Evolução dos pacientes, Treinos personalizados, Exercícios, Configurações) ·
Evolução (filtro por trilha, MetricPanel, lista por adesão) · Paciente (métricas, barras de 7 dias, treinos dele) ·
Treinos personalizados (lista + "Criar novo treino") · Novo/Editar treino (nome, exercícios, "Quem vai ver", excluir) ·
Escolher pacientes (busca, selecionar todos). Use `services/trainingsApi.ts` com a **mesma interface do SPEC** e um
**fallback em memória/AsyncStorage** (flag) enquanto o backend v3 não subir — você não fica bloqueado. Depois integre.

## Etapa D — Exercício + visão computacional
Formulário Novo/Editar exercício = protótipo (nome, objetivo, "Como fazer", repetições) **+ seção "Como a câmera valida"**:
1. `vision/inferMovement.ts` — função pura (nome/objetivo/passos → movimento sugerido; palavras-chave no SPEC) **com testes unitários**.
   Mostra "Sugerimos: Sorrir — com base no que você escreveu"; o admin confirma ou troca; sem correspondência → escolha obrigatória.
2. Lista fechada de 7 movimentos com nomes amigáveis; segurar (s), relaxamento (s), sensibilidade (Leve/Normal/Firme).
3. Aviso honesto: a câmera não vê língua, barriga nem garganta — escolher o indicador facial mais próximo; campo "o que a câmera confirma".
4. **"Testar agora"**: câmera + calibração rápida + detector com a regra montada ("Rosto encontrado… Sorriso detectado ✓"), sem gravar nada.
5. Mapeamento `CustomExercise → ValidationRule/Exercise` (`activationDelta = padrão × 0.7/1/1.3`, `mode` alternate/vowels, `holdDurationMs`,
   `relaxDurationMs`, `promptMessage`, `validationNote`) reaproveitando `createDetector`. Testes do mapeamento.

## Etapa E — Vídeo (gravar na hora ou escolher do celular)
"Gravar agora" (web: `<input type="file" accept="video/*" capture>`; nativo: `expo-image-picker` câmera) e "Escolher do celular" (galeria).
Limites **30 MB / 60 s** com mensagens claras; tipos mp4/webm/quicktime; prévia no formulário; upload multipart a `POST /uploads/video`
com estado "enviando"; sem vídeo é permitido (aviso "sem vídeo").

## Etapa F — Paciente com trilhas dinâmicas
Treinos visíveis ao usuário aparecem em "Escolha sua trilha" (chip "Personalizado · N exercícios") e percorrem prévia → calibração →
sessão → resumo. Refatore os lookups estáticos (`TRACKS.find`/`getExerciseById` em 4 telas) para um **store de trilhas/exercícios**
que aceite trilhas remotas, mantendo as 3 padrão. O progresso do ciclo continua local.

## Validação esperada
`npx tsc --noEmit`, `npm test`, `npx expo export --platform web`, capturas Playwright (Edge `channel:'msedge'`; scripts em
`C:/Users/isabe/AppData/Local/Temp/claude/*/scratchpad/pw`; `face-adult.y4m` serve de webcam falsa com rosto), claro e escuro,
360/768/1440. Comece por **A e B** e me reporte; depois C, D, E, F.
