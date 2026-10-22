# V3 — Tarefa do Backend (ECOA_backend)

Leia antes: `docs/v3/SPEC.md` (contrato) e o protótipo do administrador
https://claude.ai/artifact/EttUPt9beEkP1ksTjpzeJY (dados de exemplo em `PATIENTS` no HTML).

## Regras de trabalho
- Branch **v3** (`git branch --show-current`). **Não altere a v2.** Sem push (o PM faz).
- Outras sessões editam a árvore: `git status` antes, commite **só os seus arquivos**, commits pequenos.
- Dúvida de contrato → `maestri ask PM`, não invente.
- Reporte por etapa com `maestri ask "PM" "<o que fez, hashes, tsc/testes, o que NÃO validou>"`.

## PRIORIDADE 1 — o Frontend precisa do contrato cedo
Faça (1) e (2) primeiro e me avise assim que `POST /auth/login` e `GET/POST /trainings` rodarem localmente,
com **exemplos reais de resposta** (curl) colados na mensagem.

## Entregas
1. **Papéis e usuários mockados.** `role: "admin" | "patient"` (hoje existe `Access.USER/ADMIN` — pode evoluir).
   Seed dos 9 usuários da tabela do SPEC (pacientes com senha `ecoa2026`, hash bcrypt; o admin `ecoafono@email.com` tem a senha em `ADMIN_PASSWORD`, nunca no repositório — ver `backend-fixes-1.md`).
   `POST /auth/login` → `{ success, token, user:{ id, name, email, role } }` com claim `role` no JWT.
   Mantenha o que já foi endurecido: rate limit, validação, mensagem única de login, `JWT_SECRET` obrigatório em produção.
   Middleware `requireRole("admin")`: **401 sem token, 403 se não for admin** (checado no servidor).
2. **Treinos personalizados.** `GET/POST/PUT/DELETE /trainings` e `GET /trainings/:id` com a visibilidade do SPEC
   (sem token = só `audience.all`; paciente = `all` + os que incluem seu id; admin = todos). Validação completa do modelo:
   nome obrigatório, ≥ 1 exercício, ≥ 1 passo não vazio por exercício, `repetitions ≥ 1`, `validation.movement` dentre os 7
   permitidos, `sensitivity` dentre soft/normal/firm, `audience` coerente (ids existentes), tamanhos máximos de string, sem HTML.
   Seed "Aquecimento para apresentações" (`example: true`, audiência p3, p4, p5) recriado se o arquivo não existir.
   Persistência em JSON atômico com fila (mesmo padrão de `db/userStore.ts`).
3. **Upload de vídeo.** `POST /uploads/video` (admin), multipart (`multer`), só `mp4`/`webm`/`quicktime`, ≤ **30 MB**, nome
   aleatório no disco, pasta por env `UPLOADS_DIR` (padrão dentro do projeto, fora do git). Recusar com mensagem clara
   (tipo inválido, grande demais, extensão dupla, nome com `../`). `GET /media/:file` com **Range** e `Content-Type`
   corretos (o `<video>` do celular exige), sem listar diretório e sem path traversal. Ao excluir treino/exercício, apagar
   vídeos órfãos.
4. **Pacientes (admin).** `GET /patients` e `GET /patients/:id` com os dados de evolução de exemplo do protótipo
   (adesão %, sessões, última sessão, exercícios por dia nos últimos 7 dias, treinos que o veem).
5. **Segurança.** Authz no servidor em toda rota de admin; sanitização de strings; confirmar que o regex de CORS cobre
   `care-plus-git-v3-isabelabarcellos0812-6004s-projects.vercel.app`; limite de body só nas rotas JSON (o upload tem o seu).
6. **Testes automatizados de API** (jest + supertest ou equivalente; scripts no `package.json`): login admin/paciente/errado,
   401/403, CRUD, visibilidade por audiência, upload ok/recusado, path traversal em `/media`, mensagem única de login.
7. **Infra como código.** `render.yaml` com um **segundo serviço** `ecoa-backend-v3` (branch `v3`, `rootDir: ECOA_backend`,
   `NODE_ENV=production`, `JWT_SECRET` gerado, `CORS_ORIGIN sync:false`, `UPLOADS_DIR`) **sem alterar** o serviço da v2.
   Documente no CLAUDE.md a limitação do disco efêmero (treinos e vídeos podem sumir num redeploy do Render free).

## Critérios de pronto
`tsc` e `npm run build` limpos; testes de API verdes; `curl` dos fluxos principais; nada de segredo no repositório.
