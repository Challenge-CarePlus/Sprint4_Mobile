# V3 — Infra (Render + Vercel): checklist da usuária

Objetivo: publicar a `v3` **sem derrubar a v2**. A v2 continua em `ecoa-backend` (Render) e no projeto `care-plus` (Vercel).
Verificações abaixo feitas por HTTP em 21/10 (sem acesso aos painéis).

## Estado atual (21/10)

| Item | Estado |
|---|---|
| Render `ecoa-backend` (v2) | OK, código novo no ar: `/auth/me` sem token → 401 JSON |
| Vercel preview da v2 (`care-plus-git-v2-…`) | OK, bundle com Plus Jakarta Sans (DS v2) |
| Branch `v3` no GitHub | **Ainda não existe** (`origin` só tem `main` e `v2`) → sem push da v3 não há deploy |
| Render `ecoa-backend-v3` | Não existe (`ecoa-backend-v3.onrender.com` → 404) |
| Vercel preview da v3 | Não existe (`care-plus-git-v3-…` → 404) |

## Ordem de execução

### 0. Pré-requisito (PM)
Push da branch `v3` para o GitHub. Sem isso, Render e Vercel não têm o que construir.

### 1. Render — segundo serviço `ecoa-backend-v3`
Só depois que o Backend fechar o `render.yaml` da v3. **Não mexa no serviço `ecoa-backend` existente.**

**Plano A (Blueprint):** Render → New → Blueprint → repo `Challenge-CarePlus/Sprint4_Mobile`, **branch `v3`** → conferir que o
serviço novo se chama `ecoa-backend-v3` (nunca reaproveitar o nome `ecoa-backend`, para não sobrescrever o da v2) → Apply.

**Plano B (manual):** New → Web Service → mesmo repo →
- Name: `ecoa-backend-v3` · Branch: `v3` · Root Directory: `ECOA_backend` · Runtime: Node · Plan: Free
- Build Command: `npm install && npm run build` · Start Command: `npm start`
- Advanced → Health Check Path: `/health`
- Environment:
  - `NODE_ENV` = `production`
  - `JWT_SECRET` = botão **Generate** (nunca colar em conversa nem commitar; **diferente** do da v2)
  - `CORS_ORIGIN` = `https://care-plus-git-v3-isabelabarcellos0812-6004s-projects.vercel.app` (várias URLs separadas por vírgula)
  - `UPLOADS_DIR` = conforme definido pelo Backend (se usar disco persistente, ver riscos)
- Auto-Deploy: On.

Anotar a URL pública (ex.: `https://ecoa-backend-v3.onrender.com`) e me passar. Eu verifico por HTTP: `/health`, `POST /auth/login`
(admin e paciente mockado), `/auth/me`, 401/403 nas rotas de admin, CORS com
`Origin: https://care-plus-git-v3-isabelabarcellos0812-6004s-projects.vercel.app` e, quando existir, upload + `Range` em `/media`.

### 2. Vercel — variável só para a branch `v3`
Vercel → projeto `care-plus` → Settings → Environment Variables → **Add**:
- Key `EXPO_PUBLIC_API_BASE_URL` · Value = URL do backend v3 · **desmarcar Production e Development, marcar só Preview** →
  "Select a custom Preview branch" / Git Branch = `v3` → Save.
- (Opcional, documentar) `EXPO_PUBLIC_AUTH_REQUIRED` = `false` (padrão; `true` volta a exigir login). Só mexer se for o caso.
- **Não alterar** a `EXPO_PUBLIC_API_BASE_URL` existente (Production/v2).

> A variável é **embutida no bundle no momento do build**. Mudou o valor → precisa de **Redeploy** (Deployments → ⋯ →
> Redeploy, **desmarcar "Use existing Build Cache"**; o `vercel.json` já usa `--clear`).

### 3. Preview da v3
Depois do push da v3, a Vercel gera `care-plus-git-v3-isabelabarcellos0812-6004s-projects.vercel.app` (alias estável da branch).
Se a variável foi criada **depois** do primeiro build → Redeploy sem cache. Eu confirmo por HTTP qual API o bundle embute
(`grep` por `onrender.com` no JS) e que a v2 continua apontando para `ecoa-backend.onrender.com`.

### 4. Conferência final
- v2 intacta: `care-plus-git-v2-…` abre e loga; `ecoa-backend.onrender.com/health` = 200.
- v3: entrada → admin (`ecoafono@email.com` / `ecoa2026`) abre o painel; Mariana vê o treino destinado a ela; Pedro não.

## Riscos para decisão da usuária

1. **Disco efêmero (Render free):** treinos (JSON) e vídeos enviados **somem em redeploy ou reinício**. Aceito nesta fase (SPEC).
   Produção: Render Postgres (treinos/usuários) + armazenamento de objetos (Cloudflare R2 ou Supabase Storage) para vídeos.
   Disco persistente do Render é pago.
2. **Limite de upload 30 MB** × plano/proxy: conferir se o Render free aceita o corpo; vídeo grande no free pode estourar tempo/memória.
3. **Sleep de ~50 s:** o free dorme após ~15 min sem uso; o primeiro login do admin (e da demo) pode demorar. Acordar com um
   `GET /health` poucos minutos antes do evento.
4. **Horas gratuitas:** o free tem cota mensal de instâncias compartilhada na conta; dois serviços ativos consomem mais cota
   (com sleep, normalmente cabe). Se a cota acabar, o serviço fica suspenso até o mês virar.
5. **Segredos:** `JWT_SECRET` nunca em conversa, commit ou print. Senha dos usuários mockados (`ecoa2026`) é de teste — não
   reutilizar em dados reais.
6. **Vercel Hobby:** proíbe uso comercial; previews por branch funcionam, mas uploads/vídeos não devem passar pela Vercel.
7. **CORS:** previews por commit (`care-plus-<hash>-…`) mudam a cada deploy; use só o **alias da branch** em `CORS_ORIGIN`.

## Lembrete de rotina
A cada push na v3: eu confiro os dois deploys e aviso o PM **quando** é preciso Redeploy manual (mudança de env var da Vercel
ou de `EXPO_PUBLIC_*`).
