# V3 — Plano de testes (QA)

Escopo: `docs/v3/SPEC.md` (critérios de aceite 1–9). Branch `v3`. Autor: Tester.
Plano escrito sobre o hash **0956b11** (só documentação; nenhum código v3 existia ainda).
Cada relatório de execução deve trazer o hash testado (`git rev-parse --short HEAD`).

Prioridade: **P0** bloqueia entrega · **P1** importante · **P2** desejável.
Tipo: **API** (curl/script) · **E2E** (Playwright, Edge) · **UNIT** (jest) · **MAN** (precisa de pessoa/aparelho).

## Convenções e ambiente

- Backend: compilar em outDir isolado e rodar com `USERS_DB_PATH`/pasta de dados/uploads em cópia temporária — nunca
  sobre arquivos versionados. Porta de teste ≠ 3000. `JWT_SECRET` de teste.
- Front: `EXPO_PUBLIC_API_BASE_URL=http://localhost:<porta> npx expo export --platform web --clear` e servir estático.
- Playwright com `channel:'msedge'`; webcam falsa: `--use-fake-device-for-media-stream --use-file-for-fake-video-capture=<rosto>.y4m`
  (sem rosto a calibração não avança — ver V3-T40).
- Rate limit é por IP e compartilhado: reiniciar o servidor entre baterias grandes.
- Usuários: admin `ecoafono@email.com` (senha = `ADMIN_PASSWORD`; nos testes de API é uma senha própria da suíte); pacientes `ana.lima`, `pedro.souza`, `mariana.costa`, `lucas.almeida`,
  `juliana.rocha`, `antonio.ferreira`, `helena.martins`, `jose.pereira` `@ecoa.test`; senha dos pacientes `ecoa2026`.

## A. Baseline e regressão (critérios 1, 9)

| ID | Pri | Tipo | Passos | Esperado |
|---|---|---|---|---|
| V3-T01 | P0 | MAN/git | `git diff --stat v2..v3` e `git log v3..v2` | `v2` contida na `v3`; branch `v2` sem commits novos; mudanças em comportamento da v2 só onde o SPEC pede |
| V3-T02 | P0 | CMD | `npx tsc --noEmit` em `ECOA_mobile` e `ECOA_backend` | 0 erros |
| V3-T03 | P0 | CMD | `npm test` mobile e backend | tudo verde (inclui `inferMovement`, mapeamento, tema, API 401/403) |
| V3-T04 | P0 | CMD | `expo export --platform web --clear` e `--platform android` | sem erro |
| V3-T05 | P0 | E2E | `AUTH_REQUIRED=false` (padrão): abrir app | cai na Entrada nova (ou Home, conforme SPEC) sem exigir login; fluxo de exercícios padrão continua funcionando |
| V3-T06 | P1 | E2E | regressão v2: consentimento → 3 trilhas padrão → prévia → calibração | igual à v2 (sem pageerror) |

## B. Entrada e papéis (critério 2)

| ID | Pri | Tipo | Passos | Esperado |
|---|---|---|---|---|
| V3-T10 | P0 | E2E | Entrada: deixar tudo vazio → "Entrar" | entra como paciente anônimo; vê 3 trilhas padrão + treinos `audience.all` |
| V3-T11 | P0 | E2E | e-mail admin + senha correta | abre "Painel do administrador" |
| V3-T12 | P0 | E2E | e-mail admin + senha vazia | erro exato "Digite a senha de administrador para entrar no painel." |
| V3-T13 | P0 | E2E | e-mail admin + senha errada | erro "E-mail ou senha inválidos" (mensagem idêntica à de paciente com senha errada) |
| V3-T14 | P0 | E2E | `mariana.costa@ecoa.test` / `ecoa2026` | entra como paciente identificado; vê treinos destinados a ela |
| V3-T15 | P1 | E2E | paciente mockado + senha errada | "E-mail ou senha inválidos"; não revela qual campo |
| V3-T16 | P1 | E2E | e-mail desconhecido (qualquer senha) | segue como paciente anônimo |
| V3-T17 | P1 | E2E | e-mail com maiúsculas/espaços (`" ANA.LIMA@ECOA.TEST "`) | normalizado, reconhece o paciente |
| V3-T18 | P1 | E2E | recarregar página logado como admin / paciente | sessão mantida (papel preservado); token inválido no storage → volta à Entrada, sem painel |
| V3-T19 | P1 | E2E | "Sair" (admin e paciente) | limpa sessão; volta à Entrada; painel inacessível pela URL/histórico |
| V3-T19b | P0 | E2E | paciente tenta abrir rota de admin pela navegação/URL | bloqueado (redireciona), nunca renderiza telas de admin |

## C. Autorização e segurança da API (critério 3)

Matriz: para **toda** rota de admin → sem token **401**, token de paciente **403**, token admin 2xx/4xx de validação.
Rotas de admin: `POST /trainings`, `PUT /trainings/:id`, `DELETE /trainings/:id`, `POST /uploads/video`, `GET /patients`, `GET /patients/:id`.

| ID | Pri | Tipo | Passos | Esperado |
|---|---|---|---|---|
| V3-S01 | P0 | API | matriz 401/403 acima (6 rotas × 3 perfis) | 401 / 403 / ok. Nenhum 500, nenhuma resposta 200 sem admin |
| V3-S02 | P0 | API | token JWT forjado: assinado com secret errado; `alg:none`; claim `role:"admin"` num token de paciente sem reassinar | 401; role vem do servidor/segredo, nunca do corpo |
| V3-S03 | P0 | API | token expirado | 401 |
| V3-S04 | P0 | API | `GET /trainings` sem token / paciente / admin | sem token: só `all`; paciente: `all` + os do id dele; admin: todos (conferir ids retornados) |
| V3-S05 | P0 | API | `GET /trainings/:id` de treino destinado a outro paciente, como paciente e como anônimo | 403 ou 404 (sem vazar existência/conteúdo) |
| V3-S06 | P0 | API | `POST /trainings` com `audience.ids` inexistentes, `exercises: []`, `repetitions: 0/-1/1e9`, tipos errados, campos extras (`createdBy` forjado, `id` forçado) | 400 com mensagem clara; servidor ignora/valida `createdBy`/`id` |
| V3-S07 | P1 | API | `validation.movement` fora da lista; `sensitivity` inválido; `holdSeconds` negativo/enorme | 400 |
| V3-S08 | P0 | API | upload: arquivo > 30 MB | 413/400 com mensagem; nada gravado |
| V3-S09 | P0 | API | upload: tipo falso (`.exe`/HTML renomeado `.mp4`, mime `video/mp4` mas conteúdo não-vídeo), `text/html`, `image/svg+xml` | recusado (valida mime + extensão; idealmente magic bytes) |
| V3-S10 | P0 | API | upload: nome `../../x.mp4`, `..%2f`, `con.mp4`, nome com NUL, extensão dupla `a.php.mp4`/`a.mp4.html`, nome gigante | nome sanitizado/renomeado; nada fora da pasta de uploads; resposta não ecoa caminho do disco |
| V3-S11 | P0 | API | `GET /media/..%2f..%2fusers.json`, `/media/%2e%2e/…`, `/media/<nome>/../..` | 400/404; nunca conteúdo de outro arquivo |
| V3-S12 | P1 | API | `GET /media/:file` com `Range: bytes=0-99`, `bytes=999999999-`, `bytes=-5`, inválido | 206/416 corretos; `Content-Type` de vídeo; `X-Content-Type-Options: nosniff` |
| V3-S13 | P1 | API | `DELETE /trainings/:id` remove vídeos órfãos; deletar id inexistente; deletar treino de outro | 204/404; vídeo some do disco; `/media` do vídeo apagado dá 404 |
| V3-S14 | P1 | API | rate limit em `/auth/login`; limite não afeta `/health`, `/trainings`, `/media` indevidamente | 429 após o limite; headers `RateLimit-*` |
| V3-S15 | P1 | API | CORS: origem `https://care-plus-git-v3-xxx.vercel.app` (preview), origem do v3 de produção, origem estranha | permitidas só as configuradas; estranha sem `Access-Control-Allow-Origin` quando `CORS_ORIGIN` definido |
| V3-S16 | P1 | API | JSON malformado, body gigante (>limite), Content-Type errado, em todas as rotas novas | 400/413 em JSON, sem stack, sem `x-powered-by` |
| V3-S17 | P1 | API | produção: `NODE_ENV=production` sem `JWT_SECRET` | boot falha; senhas mockadas **não** em texto puro no repo (hash) |
| V3-S18 | P2 | API | injeção em campos (`__proto__`, `constructor`, NoSQL-like objetos) em treino/exercício | sem poluição de protótipo; 400 |
| V3-S19 | P1 | API | concorrência: 10 `POST /trainings` simultâneos e `PUT` concorrente no mesmo treino | todos gravados/serializados; JSON íntegro; sem perda |
| V3-S20 | P1 | API | usuários mockados: login dos 8 + admin; senha errada; `GET /auth/me` | `user.role` correto; mensagem única "inválidos" |

### XSS e renderização (UI)

| ID | Pri | Tipo | Passos | Esperado |
|---|---|---|---|---|
| V3-S30 | P0 | E2E | admin cria treino/exercício com nome `<img src=x onerror=window.__x=1>`, `<script>`, `"><svg onload=…>`, `javascript:` em URL de vídeo | exibido como texto literal em todas as telas (lista, paciente, prévia, resumo, "escolher pacientes"); `window.__x` indefinido; sem diálogo |
| V3-S31 | P1 | E2E | `promptMessage`/`note`/passos com HTML/markdown | idem; `expo-speech` fala o texto cru sem erro |
| V3-S32 | P1 | E2E | `video.url` apontando para outro host / `javascript:` / `data:` | recusado pelo backend (só `/media/...`) ou não reproduzido |

## D. Treinos personalizados e visibilidade (critério 4)

| ID | Pri | Tipo | Passos | Esperado |
|---|---|---|---|---|
| V3-T20 | P0 | E2E | admin cria treino "QA" com 2 exercícios, 1 vídeo, audiência "Mariana + Lucas" | salvo; aparece na lista de treinos do admin com "N exercícios" e aviso "sem vídeo" no que não tem |
| V3-T21 | P0 | E2E | logar como `mariana.costa` | treino "QA" aparece na escolha de trilha com chip "Personalizado · 2 exercícios" |
| V3-T22 | P0 | E2E | idem `lucas.almeida` | aparece |
| V3-T23 | P0 | E2E | logar como `pedro.souza` | **não** aparece |
| V3-T24 | P0 | E2E | anônimo | só treinos `audience.all`; "QA" não aparece |
| V3-T25 | P1 | E2E | editar treino: trocar audiência para "Todos" | passa a aparecer para anônimo e Pedro; voltar → some |
| V3-T26 | P1 | E2E | excluir treino (com confirmação) | some para todos; vídeos órfãos removidos |
| V3-T27 | P1 | E2E | "Escolher pacientes": busca por nome, "selecionar todos", desmarcar | contagem correta; persiste ao salvar |
| V3-T28 | P1 | E2E | seed "Aquecimento para apresentações" (`example:true`) | existe com arquivo de dados vazio/novo; recriado quando o arquivo não existe |
| V3-T29 | P1 | E2E | validações de formulário: treino sem nome, sem exercício, exercício sem nome, sem passo, repetições 0, sem movimento da câmera | bloqueia salvar, mensagem por campo, foco no erro |
| V3-T29b | P2 | E2E | treino com 1 exercício, 20 exercícios, nome de 100+ caracteres, emojis/acentos | salva/renderiza sem quebrar layout |

## E. Exercício personalizado + validação pela câmera (critério 5)

| ID | Pri | Tipo | Passos | Esperado |
|---|---|---|---|---|
| V3-T40 | P0 | E2E | paciente (Mariana) abre treino "QA" → prévia → calibração → sessão → resumo (webcam falsa **com rosto**) | percorre o fluxo; sessão mostra o `promptMessage` e `note` do exercício; vídeo do admin toca (muted/loop/playsinline); resumo conta o exercício |
| V3-T41 | P0 | UNIT | `inferMovement(name, goal, steps)`: sorri/sorriso→sorrir; bico/beijo/projet→fazer bico; abra a boca/bocejo/mandíbula→abrir a boca; bochecha/balão→bochechas; apertar os lábios/esforço→apertar; "sorriso e bico alternados"→alternar; vogais/"A, E, I, O, U"→vogais; sem correspondência→`null`; ambíguo (sorriso **e** bico) não cai em "sorrir" por engano; acentos/maiúsculas | tabela completa passa |
| V3-T42 | P0 | UNIT | mapeamento `CustomExercise → Exercise/Track`: movimento, `mode` (alternate/vowels), `holdSeconds*1000`, `relaxSeconds*1000`, `repetitions`, `activationDelta = padrão × {0.7,1,1.3}`, `promptMessage`, `validationNote`, ageGroup `adults` | valores exatos; `holdSeconds=0` → sem tempo de segurar |
| V3-T43 | P0 | E2E | formulário: "Sugerimos: Sorrir — com base no que você escreveu" aparece ao digitar; admin troca/confirma; sem correspondência → campo obrigatório | conforme SPEC |
| V3-T44 | P0 | E2E | "Testar agora" (webcam falsa com rosto) | abre câmera, calibração rápida, mostra "Rosto encontrado…" e o estado do detector; **não grava nada** (conferir que treino/lista não mudou); sem rosto → aviso claro, não trava |
| V3-T45 | P1 | E2E | sensibilidade Leve/Normal/Firme muda o limiar efetivo (inspecionar `activationDelta` via UI de diagnóstico ou teste unitário) | 0,7× / 1× / 1,3× |
| V3-T46 | P1 | MAN | **device/rosto real**: cada movimento (7) é detectado e a sessão avança; "pular após 25 s" aparece sem progresso | fora do alcance da automação (webcam falsa não faz movimento) — registrar como pendente até haver aparelho/vídeo gravado de rosto |
| V3-T47 | P1 | E2E | exercício com `holdSeconds=0`, `relaxSeconds=0`, repetitions=1 e =50 | sem divisão por zero/travamento; contagem correta |
| V3-T48 | P1 | E2E | exercício criado sem vídeo | prévia mostra fallback (ícone) sem erro; aviso "sem vídeo" na lista do admin |
| V3-T49 | P1 | E2E | treino com 2 exercícios: ordem, "Exercício 1 de 2", resumo "2/2" (regressão do bug 0/5 da v2) | corretos |

## F. Vídeo: gravar ou escolher (critério 6)

| ID | Pri | Tipo | Passos | Esperado |
|---|---|---|---|---|
| V3-T50 | P0 | E2E | "Escolher do celular": mp4 válido ≤30 MB e ≤60 s | upload ok; pré-visualização no formulário; `url` salva no treino |
| V3-T51 | P0 | E2E | "Gravar agora": `<input capture>` presente com `accept="video/*"`; no app nativo `launchCameraAsync` | atributos/botões conforme SPEC (gravação real = MAN) |
| V3-T52 | P0 | E2E | arquivo > 30 MB | recusado **antes ou no** upload, mensagem clara com o limite |
| V3-T53 | P0 | E2E | tipo inválido (`.avi`, `.txt`, `.html` renomeado) | recusado, mensagem clara |
| V3-T54 | P1 | E2E | vídeo > 60 s | aviso (conforme SPEC), não trava |
| V3-T55 | P1 | E2E | `video/webm` e `video/quicktime` | aceitos; reproduzem no Edge (mov pode não reproduzir em Chromium — registrar) |
| V3-T56 | P1 | E2E | cancelar seleção; trocar vídeo; remover vídeo; falha de rede no upload | estado consistente, sem órfão, erro com "tentar de novo" |
| V3-T57 | P2 | E2E | upload com 3G simulado (progresso/spinner) e duplo clique em Salvar | sem duplicar treino |

## G. Tema claro/escuro/automático (critério 7)

| ID | Pri | Tipo | Passos | Esperado |
|---|---|---|---|---|
| V3-T60 | P0 | E2E | Configurações → Aparência: Automático/Claro/Escuro | troca **instantânea** em todo o app (sem recarregar), sem flash de tema errado |
| V3-T61 | P0 | E2E | escolher Escuro, recarregar | persiste (AsyncStorage/localStorage) |
| V3-T62 | P0 | E2E | Automático com `colorScheme: 'dark'` e `'light'` do navegador | segue o aparelho; ao mudar o SO em tempo real, atualiza |
| V3-T63 | P0 | E2E | Trilha Infantil (prévia, calibração, sessão, resumo) no tema escuro | **sempre clara** |
| V3-T64 | P0 | E2E+script | **Contraste AA no escuro e no claro**: para cada tela (Entrada, Início paciente, Painel admin, Evolução, Paciente, Treinos, Treino, Exercício, Escolher pacientes, Escolha de trilha, Prévia, Calibração, Sessão, Resumo, Configurações, Consentimento), medir via `getComputedStyle` cada nó de texto vs. fundo efetivo (percorrendo ancestrais; gradientes → pior caso) | texto normal ≥ 4,5:1, texto grande/ícones ≥ 3:1; relatório por tela e par (script `contrast.js`) |
| V3-T65 | P1 | E2E | procurar texto ilegível: sem `color` herdado preto sobre fundo escuro (varredura de nós com contraste < 3) | zero ocorrências |
| V3-T66 | P1 | E2E | câmera/vídeo inalterados no escuro; sombras `none` (elevação por camada); bordas dos campos visíveis | conforme DS |
| V3-T67 | P2 | E2E | botão lua/sol na Entrada alterna e sincroniza com Aparência | igual estado nas duas |
| V3-T68 | P1 | UNIT | `ThemeProvider`: modo, persistência, fallback quando storage indisponível (try/catch) | verde |
| V3-T69 | P1 | E2E | cores que ainda usam `colors` estático (grep `from "../theme/tokens"` + `colors.`) | nenhuma tela do evento/app fora de `trailThemes` infantil ignora o tema |

## H. Responsivo e acessibilidade (critério 8)

| ID | Pri | Tipo | Passos | Esperado |
|---|---|---|---|---|
| V3-T70 | P0 | E2E | 360×800, 768×1024, 1440×900 em **todas** as telas (paciente e admin), claro e escuro | `scrollWidth <= clientWidth` (sem rolagem horizontal); coluna máx. 768 px centralizada |
| V3-T71 | P0 | E2E | alvos de toque: todo `button/[role=button]/a/input` visível | ≥ 48×48 px (56 no idoso); lista os que falham |
| V3-T72 | P1 | E2E | fontes carregadas (`document.fonts.check` para Plus Jakarta Sans e Figtree no infantil), sem fallback | ok |
| V3-T73 | P1 | E2E | listas longas (8 pacientes, 20 treinos), nome longo, zoom 200% | sem overflow/quebra |
| V3-T74 | P1 | E2E | teclado: tab/enter em Entrada e formulários; `accessibilityLabel`/role nos controles do admin | foco visível, ordem lógica |
| V3-T75 | P2 | E2E | `prefers-reduced-motion` | animações respeitam |

## I. Painel do admin e dados de exemplo

| ID | Pri | Tipo | Passos | Esperado |
|---|---|---|---|---|
| V3-T80 | P0 | E2E | Painel: 4 cards (Evolução, Treinos personalizados, Exercícios, Configurações) | navegam; títulos conforme protótipo |
| V3-T81 | P1 | E2E | Evolução: filtro por trilha, MetricPanel, lista ordenada por adesão (desc) | confere com `PATIENTS` do SPEC; rótulo "dados de exemplo" visível |
| V3-T82 | P1 | E2E | Paciente: métricas, gráfico 7 dias, treinos que ele vê | batem com `GET /patients/:id`; lista de treinos respeita audiência |
| V3-T83 | P1 | E2E | paciente sem treino, sem dados, falha de API (backend fora) | estados vazio/erro/loading amigáveis; fallback em memória não expõe dado de admin a anônimo |
| V3-T84 | P2 | MAN | fidelidade ao protótipo (usuária exige "extremamente fiel"): comparar capturas lado a lado com o artifact `EttUPt9beEkP1ksTjpzeJY` | divergências listadas por tela (espaçamento, cores, texto) |

## J. Infra v3 (Render/Vercel)

| ID | Pri | Tipo | Passos | Esperado |
|---|---|---|---|---|
| V3-I01 | P0 | API | `GET <render-v3>/health`, `/auth/me`, `/trainings` | 200 / 401 / lista (não 404 HTML do código antigo) |
| V3-I02 | P0 | API | a **v2 em produção** continua respondendo igual (health, login) | v2 não derrubada |
| V3-I03 | P1 | E2E | Preview Vercel v3 → backend v3 (não o v2); login admin e fluxo completo | funciona; sem erro de CORS |
| V3-I04 | P1 | API | persistência: reiniciar serviço Render → seed volta; treinos/vídeos podem sumir (limitação aceita) | comportamento documentado; seed recriado |
| V3-I05 | P1 | API | `render.yaml`/envs: `JWT_SECRET` gerado, `NODE_ENV=production`, `CORS_ORIGIN` com `care-plus-git-v3-*` | boot ok; origem estranha sem CORS |

## K. Fora do alcance da automação (declarar no relatório)

Rosto real e movimentos reais (V3-T46) · gravação de vídeo pela câmera do celular · Android/iOS físico · reprodução de `.mov` em
todos os navegadores · desempenho em aparelho lento · Render free "dormindo" (cold start).

## Critérios de saída

Release candidate só com: todos os **P0** aprovados; **P1** aprovados ou com risco aceito pelo PM por escrito; pendências MAN listadas.
Relatório por ID: `V3-B*` (backend), `V3-F*` (frontend), `V3-S*` (segurança), `V3-T*` (plano), `V3-I*` (infra) com **aprovado / reprovado /
pendente + hash**.

## Automação (scripts em `scratchpad/pw`)

`api-sec.js` (V3-S01…S20, S08–S13 com arquivos gerados) · `e2e-entrada.js` (T10–T19b) · `e2e-treino.js` (T20–T29, T40–T49) ·
`e2e-tema.js` (T60–T69) · `contrast.js` (T64–T65) · `e2e-responsivo.js` (T70–T73) · `xss.js` (S30–S32).
Reutilizar a bateria já existente da v2 (login, consentimento, calibração) como regressão (V3-T06).
