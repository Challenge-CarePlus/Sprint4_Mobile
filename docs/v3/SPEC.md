# ECOA v3 — Modo administrador, login do evento e tema claro/escuro

Branch: `v3` (criada a partir da `v2` em 21/10; **a `v2` não deve ser alterada** — ela é a versão
validada e publicada). Responsável pelo produto: PM. Este documento é o contrato entre os agentes
**Backend**, **Frontend**, **Tester** e **Render e Vercel**.

## Fontes de verdade (leia antes de implementar)

- **Protótipo do administrador** (fonte principal desta fase): https://claude.ai/artifact/EttUPt9beEkP1ksTjpzeJY
  — telas: Entrada (login), Início do paciente, Painel do admin, Evolução dos pacientes, Paciente,
  Treinos personalizados, Novo/Editar treino, Novo/Editar exercício, Escolher pacientes, Configurações →
  Aparência (tema). O HTML traz o CSS `.px-*` e o JSX de cada tela (procure `function Login`, `EditExercise`…).
- **Protótipo do fluxo do usuário** (já aplicado na v2): https://claude.ai/artifact/AzXNgJF9S64Np44EjvER5k
- **DS** (tokens claro e escuro, componentes): https://claude.ai/artifact/Ttcaqk6QNXVrPd1zQ7wZ2D
  Fidelidade ao protótipo é exigência da usuária ("extremamente fiel").

## Escopo

1. **Modo administrador** — a equipe cria **trilhas personalizadas** ("treinos"), com exercícios próprios,
   vídeo próprio e escolha de quais pacientes veem cada treino.
2. **Login do dia do evento** — o app continua com acesso livre; **só o admin precisa logar**.
3. **Tema claro / escuro / automático** — escolha do usuário, sincronizada em todo o app.
4. **Validação pela câmera dos exercícios criados** — com base nos dados que o admin informa, a visão
   computacional (MediaPipe, já existente em `vision/`) valida o exercício criado.
5. **Usuários mockados** — lista de pacientes de teste; ao logar com um deles, os treinos destinados a ele aparecem.

## Papéis e login (comportamento do protótipo)

- **Sem preencher nada → "Entrar"**: entra como **paciente anônimo** (acesso livre). Vê as 3 trilhas padrão e
  os treinos personalizados com `audience.all = true`.
- **E-mail da equipe + senha** → backend valida → papel **admin** → abre o **Painel do administrador**.
  Senha vazia com o e-mail do admin: erro "Digite a senha de administrador para entrar no painel."
- **E-mail de paciente mockado + senha** → papel **patient** identificado → vê também os treinos destinados a ele.
- **E-mail desconhecido** (nem admin nem mockado): segue como paciente anônimo (como no protótipo).
- Senha errada de usuário conhecido → erro claro ("E-mail ou senha inválidos"), sem vazar qual dos dois.
- A chave `AUTH_REQUIRED` da v2 continua existindo (padrão `false` = acesso livre). A tela de entrada nova
  substitui a antiga Login/Register **quando `AUTH_REQUIRED=false`**; Cadastro fica dormente.

### Usuários mockados (seed no backend; senha de TODOS = `ecoa2026`)

| id | Nome | E-mail | Papel | Trilha atual (para a Evolução) |
|---|---|---|---|---|
| a1 | Equipe Ecoa | `ecoafono@email.com` | **admin** | — |
| p1 | Ana Beatriz Lima | `ana.lima@ecoa.test` | patient | Infantil |
| p2 | Pedro Henrique Souza | `pedro.souza@ecoa.test` | patient | Infantil |
| p3 | Mariana Costa | `mariana.costa@ecoa.test` | patient | Dicção e oratória |
| p4 | Lucas Almeida | `lucas.almeida@ecoa.test` | patient | Dicção e oratória |
| p5 | Juliana Rocha | `juliana.rocha@ecoa.test` | patient | Dicção e oratória |
| p6 | Antônio Ferreira | `antonio.ferreira@ecoa.test` | patient | Fortalecimento orofacial |
| p7 | Helena Martins | `helena.martins@ecoa.test` | patient | Fortalecimento orofacial |
| p8 | José Carlos Pereira | `jose.pereira@ecoa.test` | patient | Fortalecimento orofacial |

Dados de evolução (adesão %, sessões, última sessão, exercícios por dia nos últimos 7 dias) = **exemplos fixos**
do protótipo (`PATIENTS` no HTML). Devem ser claramente rotulados "dados de exemplo" na UI.

## Modelo de dados

```ts
type Audience = { all: boolean; ids: string[] };            // ids = id de paciente (p1..p8)

type CustomExercise = {
  id: string;
  name: string;                  // obrigatório
  goal?: string;                 // objetivo (opcional)
  steps: string[];               // "Como fazer", >= 1 passo não vazio
  repetitions: number;           // ≥ 1
  holdSeconds: number;           // 0 = sem tempo de segurar
  relaxSeconds: number;          // tempo de relaxamento entre repetições (conta na validação)
  video: { url: string; name: string; size: number; mime: string } | null;
  validation: CustomValidation;  // OBRIGATÓRIO — como a câmera valida este exercício
};

type CustomValidation = {
  movement: "jawOpen" | "mouthSmile" | "mouthPucker" | "cheekPuff" | "lipPress"
          | "alternateSmilePucker" | "vowels";                 // só o que o MediaPipe mede
  sensitivity: "soft" | "normal" | "firm";                     // multiplica o limiar padrão: 0.7× / 1× / 1.3×
  promptMessage?: string;        // fala/mostra enquanto o movimento não é detectado
  note?: string;                 // "o que a câmera confirma" — mostrado ao paciente (transparência)
};

type Training = {                // "trilha personalizada"
  id: string; name: string; example?: boolean;
  audience: Audience;
  exercises: CustomExercise[];   // ≥ 1
  createdAt: string; updatedAt: string; createdBy: string;
};
```

**Mapeamento para o que já existe** (`ECOA_mobile/data/types.ts`): `CustomValidation.movement` →
`ValidationRule.movement` (+ `mode: "alternate"` para `alternateSmilePucker`, `mode: "vowels"` para `vowels`);
`holdSeconds*1000` → `holdDurationMs`; `relaxSeconds*1000` → `relaxDurationMs`; `repetitions` → `repetitions`;
`sensitivity` → `activationDelta = padrão(movimento) × {0.7|1|1.3}`; `promptMessage` → `promptMessage`;
`note` → `validationNote`. Um treino vira um `Track` (ageGroup tratado como `adults` = núcleo do app).

### Como a câmera valida a partir da descrição (requisito da usuária)

O admin "deve inserir todos os dados necessários". O formulário de exercício tem, além do protótipo (nome,
objetivo, passos, repetições, vídeo), a seção **"Como a câmera valida"**:
1. **Movimento** (lista fechada, nomes amigáveis): Abrir a boca · Sorrir · Fazer bico · Encher as bochechas ·
   Apertar os lábios · Alternar sorriso e bico · Vogais A-E-I-O-U. Texto de apoio honesto: a câmera vê o rosto,
   **não vê língua, barriga nem garganta** — para esses exercícios escolher o indicador facial mais próximo
   (ex.: boca aberta) e o `note` explica.
2. **Sugestão automática a partir da descrição**: função pura `inferMovement(name, goal, steps)` (palavras-chave:
   sorri/sorriso→sorrir; bico/beijo/projet→fazer bico; abr(a|ir) a boca/bocejo/mandíbula→abrir a boca;
   bochecha/balão→bochechas; apert(e|ar) os lábios/esforço→apertar os lábios; sorriso e bico alternados→alternar;
   vogais/A, E, I, O, U→vogais). Mostra "Sugerimos: Sorrir — com base no que você escreveu" e o admin confirma/troca.
   Sem correspondência → admin escolhe manualmente (campo obrigatório).
3. Tempo de segurar (s), relaxamento (s), sensibilidade (Leve/Normal/Firme).
4. **Testar agora**: botão que abre a câmera e roda a regra montada (calibração rápida + detector) para o admin
   ver "Rosto encontrado… Sorriso detectado ✓" antes de salvar. Não grava nada.

## Vídeo do exercício: gravar na hora **ou** escolher do celular

- Web (celular): dois botões como no protótipo — "Gravar agora" = `<input type="file" accept="video/*" capture>` e
  "Escolher do celular" = `<input type="file" accept="video/*">`. App nativo: `expo-image-picker`
  (`launchCameraAsync` / `launchImageLibraryAsync`, `mediaTypes: videos`).
- Limites: ≤ **30 MB**, ≤ **60 s** (aviso se maior), tipos `video/mp4`, `video/webm`, `video/quicktime`.
- Upload multipart ao backend (admin autenticado). O treino só guarda a `url` devolvida. Pré-visualização do
  vídeo no formulário. Reprodução no paciente usa o mesmo `ExerciseVideo` (`playsinline`, `muted`, `loop`).
- Sem vídeo é permitido (aviso "sem vídeo" na lista, como no protótipo).

## API (Backend → Frontend)

Base: a mesma de hoje (`EXPO_PUBLIC_API_BASE_URL`). JSON, erros `{ success:false, message }`. Token JWT no
`Authorization: Bearer`; claims: `id`, `email`, `role: "admin"|"patient"`. **Toda rota de admin exige role admin
no servidor** (nunca confiar no app).

| Método e rota | Quem | Descrição |
|---|---|---|
| `POST /auth/login` | público | `{email,password}` → `{success,token,user:{id,name,email,role}}`. Admin e pacientes mockados. |
| `GET /auth/me` | logado | usuário atual |
| `GET /trainings` | público/logado | **Sem token**: treinos com `audience.all`. **Paciente**: `all` + os que incluem seu id. **Admin**: todos. |
| `GET /trainings/:id` | idem | mesma regra de visibilidade |
| `POST /trainings` | admin | cria (valida o modelo acima) |
| `PUT /trainings/:id` | admin | substitui |
| `DELETE /trainings/:id` | admin | exclui (e seus vídeos órfãos) |
| `POST /uploads/video` | admin | multipart `file` → `{url,name,size,mime}`; valida mime/extensão/tamanho |
| `GET /media/:file` | público | serve o vídeo com `Range` e `Content-Type` corretos |
| `GET /patients` | admin | lista dos 8 pacientes + dados de evolução de exemplo |
| `GET /patients/:id` | admin | um paciente (com semana, adesão, treinos que o veem) |

Persistência: arquivos JSON atômicos (padrão do `userStore`) + pasta de uploads. **Limitação conhecida e
aceita nesta fase**: o disco do Render free é efêmero — treinos e vídeos podem sumir num redeploy/reinício.
Seed (`example: true`, "Aquecimento para apresentações") recriado quando o arquivo não existe. Decisão de
produção pendente (Postgres + armazenamento de objetos); registrar no CLAUDE.md.

## Telas (Frontend) — todas fiéis ao protótipo

Entrada · Início (paciente) · Início (admin: "Painel do administrador", cards Evolução dos pacientes,
Treinos personalizados, Exercícios, Configurações) · Evolução dos pacientes (filtro por trilha, MetricPanel,
lista ordenada por adesão) · Paciente (métricas, gráfico de barras 7 dias, treinos dele) · Treinos
personalizados (lista + "Criar novo treino") · Novo/Editar treino (nome, exercícios, "Quem vai ver", excluir) ·
Novo/Editar exercício (+ seção "Como a câmera valida", vídeo) · Escolher pacientes (busca, selecionar todos) ·
Escolha de trilha do paciente (3 padrão + personalizadas com chip "Personalizado · N exercícios") ·
Configurações → **Aparência** (Automático/Claro/Escuro) · botão lua/sol na tela de entrada.
Treino personalizado percorre o mesmo fluxo: prévia → calibração → sessão (validada) → resumo.

## Tema claro/escuro

- Três modos: `auto` (segue o aparelho), `light`, `dark`; persistido (AsyncStorage) e sincronizado em toda a UI
  (`ThemeProvider` + hook). Tokens escuros = os do DS (`surface #0A1322`, `surface-raised #131E31`, `ink #EEF2F8`,
  `brand #5AB4F0`, `brand-deep #1C3A66`, … ver `tokens.json` do DS). Sombras no escuro: `none` (elevação por camada).
- **Trilha Infantil fica sempre clara** (regra do DS). O resto, incluindo as telas do evento, acompanha o tema.
- Contraste AA nos dois temas (texto 4.5:1). Câmera/vídeo não mudam.
- Refatorar o uso estático de `colors` (hoje importado direto) para cores vindas do tema.

## Critérios de aceite (resumo — o Tester usa isto)

1. `v2` intacta; `v3` com histórico próprio. `AUTH_REQUIRED=false` continua abrindo sem login.
2. "Entrar" vazio → paciente; e-mail admin + senha certa → painel; senha vazia/errada → erros do protótipo.
3. Rotas de admin respondem **401 sem token e 403 para paciente** (testado).
4. Admin cria treino com 2 exercícios, 1 vídeo gravado/escolhido, audiência "Mariana + Lucas"; logando como
   `mariana.costa@ecoa.test` o treino aparece; como `pedro.souza@ecoa.test` **não**; anônimo só vê os "para todos".
5. O exercício criado roda o fluxo completo e é **validado pela câmera** conforme o movimento escolhido; "Testar agora" funciona.
6. Vídeo > 30 MB ou tipo inválido é recusado com mensagem clara.
7. Tema: troca instantânea, persiste ao recarregar, kids sempre claro, sem texto ilegível no escuro.
8. Responsivo (360/768/1440, coluna máx. 768px) e sem rolagem horizontal; alvos ≥ 48px (56px idoso).
9. `tsc` mobile e backend limpos; testes unitários e de API verdes; export web ok.

## Responsabilidades

- **Backend**: auth com papéis e usuários mockados; middleware `requireRole`; `/trainings`, `/patients`,
  upload e `/media`; testes de API (inclui 401/403); atualizar `render.yaml`/docs do backend; limites e validação.
- **Frontend**: contrato de API (cliente + fallback em memória até o backend subir); `ThemeProvider` e migração das
  telas; nova entrada e papéis; painel admin completo; formulário de exercício com validação pela câmera
  (`inferMovement`, "Testar agora", vídeo gravar/escolher); trilhas personalizadas no fluxo do paciente (tracks
  dinâmicos); Aparência. Testes unitários (`inferMovement`, mapeamento, tema).
- **Tester**: plano e automação (Playwright/Edge, scripts em `scratchpad/pw`) para os critérios acima, segurança
  (authz, upload malicioso, XSS em nome de treino), contraste no escuro, responsivo; reportar por ID (V3-B*, V3-F*).
- **Render e Vercel**: segundo serviço Render para a `v3` (para **não derrubar** a v2 em produção), variáveis,
  `CORS_ORIGIN`, disco/uploads, e Vercel Preview da `v3` apontando para o backend v3; guiar a usuária nos painéis.
- **PM**: prioridades, revisão, integração, push e verificação dos deploys.

## Ordem sugerida

1. Backend: contrato + seed + auth/papéis (para o Frontend integrar cedo).
2. Frontend em paralelo: tema → entrada/papéis → painel admin (com API mockada) → formulário/validação → integrar.
3. Backend: uploads + `/media` + trilhas personalizadas completas.
4. Tester acompanha por entregas; Render/Vercel prepara a infra da v3 desde o início.
