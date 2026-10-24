# V3 — Infra (Render + Vercel): checklist da usuária

Objetivo: publicar a `v3` **sem derrubar a v2**. A v2 continua em `ecoa-backend` (Render) e no projeto `care-plus` (Vercel).
Verificações feitas por HTTP em 22/10 (sem acesso aos painéis).

## Estado atual (23/10)

| Item | Estado |
|---|---|
| Render `ecoa-backend` (v2) | OK |
| Render `ecoa-backend-v3` | **No ar** (`/health` 200; `/auth/me` sem token = 401 JSON) |
| Vercel preview da v3 (`care-plus-git-v3-…`) | OK: 200 e o bundle embute `https://ecoa-backend-v3.onrender.com` |
| Vercel **Production** (`care-plus-isabelabarcellos0812-6004s-projects.vercel.app`) | Ainda é a **v2**: embute `https://ecoa-backend.onrender.com` |
| `careplus-ecoafono.vercel.app` | Livre (404) — ainda não adicionado ao projeto |
| CSP (`vercel.json`) | Presente: `connect-src … https://*.onrender.com …` (cobre o backend v3; o domínio novo não exige ajuste) |

> As seções seguintes até "Riscos" descrevem a criação inicial do backend/preview da v3 (já executada). A promoção a produção
> está em **"Produção: promover a v3"**, no fim.

## O que o `render.yaml` da v3 já define (serviço `ecoa-backend-v3`)

`branch: v3` · `rootDir: ECOA_backend` · build `npm install && npm run build` · start `npm start` · health `/health` ·
`NODE_ENV=production` · `JWT_SECRET` gerado pelo Render · `DATA_DIR=/tmp/ecoa-data` · `UPLOADS_DIR=/tmp/ecoa-uploads` ·
`CORS_ORIGIN` (`sync:false` — você preenche). **Vai ganhar `ADMIN_PASSWORD` (`sync:false`)**: o servidor **não sobe em
produção sem ela** e exige **mínimo 12 caracteres**, **nunca igual à dos pacientes (`ecoa2026`)**, e recusa senhas óbvias (só números, `senha123`, `admin123`, `password`, `ecoafono`…). É a senha do admin (`ecoafono@email.com`); a dos pacientes mockados segue
`ecoa2026` (sem privilégio). Nunca colar a senha em chat, print ou commit.

**Modo demonstração (decisão da usuária, protótipo de evento):** definir `ALLOW_WEAK_ADMIN_PASSWORD` = `true` (valor exato,
minúsculo; `TRUE`, `1`, `yes` ou vazio **não** ligam) no painel do Render permite `ADMIN_PASSWORD` fraca/pública, inclusive
`ecoa2026` (mínimo 8 caracteres; vazia ou menor continua recusada). Ligado, o servidor sobe e escreve no log de boot
"MODO DEMONSTRACAO: senha de administrador fraca/publica permitida — nao use com dados reais" (sem a senha); `/health` **não**
mostra o modo. **Risco:** `ecoa2026` é pública (README, histórico do repo): quem lê o repo entra como admin, cria treinos e sobe
vídeos. **Depois do evento:** apagar `ALLOW_WEAK_ADMIN_PASSWORD` e trocar `ADMIN_PASSWORD` por uma senha forte (≥ 12).

CORS: além de `CORS_ORIGIN`, o código já aceita qualquer deploy/preview do projeto
(`care-plus*-isabelabarcellos0812-6004s-projects.vercel.app`). Então `CORS_ORIGIN` só é indispensável se houver outro domínio.

## Passo a passo final (usuária)

1. **Esperar** o PM confirmar que o `render.yaml` com `ADMIN_PASSWORD` está na `v3` do GitHub.
2. **Render → New → Blueprint** → repo `Challenge-CarePlus/Sprint4_Mobile` → **branch `v3`**.
   Conferir que aparece **só** `ecoa-backend-v3` como novo (o `ecoa-backend` da v2 já existe; não deve ser alterado — se o
   Render propuser mudar o da v2, **cancele**).
3. Na tela do Blueprint, preencher as variáveis pedidas:
   - `ADMIN_PASSWORD` = uma senha **sua**, ≥ 12 caracteres, diferente de `ecoa2026` e de qualquer senha óbvia (anote num lugar seguro; é a que entra no painel).
   - `CORS_ORIGIN` = `https://care-plus-git-v3-isabelabarcellos0812-6004s-projects.vercel.app`
4. **Apply**. Esperar o deploy ficar *Live* (se *Failed*, abrir Logs e me mandar as últimas linhas — **sem** valores de senha).
5. Copiar a URL pública do serviço (algo como `https://ecoa-backend-v3.onrender.com`) e **me passar**.
6. **Vercel → projeto `care-plus` → Settings → Environment Variables → Add**:
   - Key `EXPO_PUBLIC_API_BASE_URL` · Value = a URL do passo 5 (sem barra no final)
   - Environments: marcar **só Preview**, e em *Git Branch* escolher `v3` → Save.
   - **Não** editar a variável existente de Production (é a da v2).
7. **Vercel → Deployments → deploy mais recente da `v3` → ⋯ → Redeploy → desmarcar "Use existing Build Cache"**.
   (A variável é embutida no bundle **durante o build**; sem redeploy o preview continua com a API errada.)
8. Plano B manual do Render (se o Blueprint der problema): New → Web Service → mesmo repo, Name `ecoa-backend-v3`, Branch
   `v3`, Root Directory `ECOA_backend`, Build `npm install && npm run build`, Start `npm start`, Health Check `/health`,
   Free; Environment: `NODE_ENV=production`, `JWT_SECRET`=Generate, `ADMIN_PASSWORD`, `CORS_ORIGIN`,
   `DATA_DIR=/tmp/ecoa-data`, `UPLOADS_DIR=/tmp/ecoa-uploads`.

## O que eu verifico por HTTP depois de cada passo

| Depois do passo | Verificação |
|---|---|
| 4–5 (Render no ar) | `GET /health` = 200 (a 1ª chamada pode levar ~50 s: serviço dormindo) · `GET /auth/me` sem token = 401 JSON · rota inexistente = 404 JSON |
| 4–5 | `POST /auth/login` paciente mockado (`ana.lima@ecoa.test`/`ecoa2026`) = 200 + `role: patient`; admin com senha errada = erro genérico sem vazar qual campo |
| 4–5 | Rotas de admin (`/patients`, `POST /trainings`, `POST /uploads/video`): **401 sem token, 403 com token de paciente** |
| 4–5 | CORS: `Origin: https://care-plus-git-v3-…vercel.app` → `access-control-allow-origin` presente; origem estranha → ausente |
| 4–5 | `GET /trainings` sem token devolve só treinos `audience.all` (seed "Aquecimento para apresentações") |
| 7 (redeploy) | O preview `care-plus-git-v3-…` responde 200 e o JS embute `https://ecoa-backend-v3.onrender.com` (e **não** `10.0.2.2`); a v2 (`care-plus-git-v2-…`) continua embutindo `ecoa-backend.onrender.com` |
| 7 | Quando existir upload: `POST /uploads/video` com admin → `GET /media/:file` com `Range: bytes=0-99` = 206 e `Content-Type` de vídeo |

Eu **não** testo login do admin com a senha real (não a conheço nem devo): essa checagem final é da usuária — entrar com
`ecoafono@email.com` + `ADMIN_PASSWORD` e ver o Painel do administrador.

## Riscos para decisão da usuária

1. **Disco efêmero:** `DATA_DIR` e `UPLOADS_DIR` estão em `/tmp` — treinos criados e vídeos enviados **somem em redeploy ou
   reinício** (o seed e os usuários mockados voltam). Aceito nesta fase. Produção: Render Postgres + armazenamento de objetos
   (Cloudflare R2 ou Supabase Storage). Disco persistente do Render é pago. **Para o evento: criar os treinos de demonstração
   pouco antes e não redeployar depois.**
2. **Upload de 30 MB** no free: pode estourar tempo/memória; testar com um vídeo real antes do evento.
3. **Sleep de ~50 s:** o free dorme após ~15 min sem uso; o 1º login do admin pode demorar. Acordar com um `GET /health`
   poucos minutos antes.
4. **Cota de horas gratuitas:** dois serviços ativos consomem mais cota mensal compartilhada (com sleep, normalmente cabe).
5. **Segredos:** `JWT_SECRET` e `ADMIN_PASSWORD` nunca em conversa, commit ou print. Senha dos mockados é de teste.
6. **Vercel Hobby:** proíbe uso comercial; vídeos não devem ser servidos pela Vercel.
7. **Redeploy do Render ≠ redeploy da Vercel:** mudar `ADMIN_PASSWORD`/`CORS_ORIGIN` só reinicia o backend (e apaga o `/tmp`);
   mudar `EXPO_PUBLIC_*` exige Redeploy sem cache na Vercel.

## Produção: promover a v3 para `careplus-ecoafono.vercel.app`

Pedido da usuária: a v3 vira o site **principal** (Production) em `careplus-ecoafono.vercel.app` (subdomínio gratuito
`vercel.app`; URLs são minúsculas). Hoje a Production serve a v2 e aponta para o backend da v2.

**Ordem (backend primeiro, front depois, domínio por último):**

1. **Render → `ecoa-backend-v3` → Environment → `CORS_ORIGIN`** =
   `https://care-plus-git-v3-isabelabarcellos0812-6004s-projects.vercel.app,https://careplus-ecoafono.vercel.app`
   (vírgula, sem espaço, sem barra no final). **O regex do backend NÃO cobre o domínio novo** (só `care-plus*-…-projects.vercel.app`).
   Salvar reinicia o serviço e apaga o `/tmp` (treinos e vídeos criados somem): faça **antes** de montar treinos de demonstração.
2. **Vercel → care-plus → Settings → Environment Variables:** editar `EXPO_PUBLIC_API_BASE_URL` do ambiente **Production** (hoje
   `https://ecoa-backend.onrender.com`) para `https://ecoa-backend-v3.onrender.com`. Não criar uma variável duplicada; a de Preview/`v3` já está certa.
3. **Settings → Git → Production Branch** = `v3`.
4. **Deployments → deploy mais recente da `v3` → ⋯ → Redeploy, desmarcando "Use existing Build Cache"**, e então **Promote to Production**
   (ou, se o redeploy já sair como Production, nada a promover). A API é embutida no build; sem build novo a Production segue com a API errada.
5. **Settings → Domains → Add** `careplus-ecoafono.vercel.app` (Production).

**O que eu verifico por HTTP depois de cada passo**

| Depois do passo | Verificação |
|---|---|
| 1 | `curl -i -H "Origin: https://careplus-ecoafono.vercel.app" …/health` → `access-control-allow-origin` com esse domínio (hoje **ausente**); origem estranha → ausente; origem `care-plus-git-v3-…` continua permitida; `/health` 200 depois do restart (~50 s) |
| 2–4 | O JS da Production (`care-plus-isabelabarcellos0812-6004s-projects.vercel.app`) embute `https://ecoa-backend-v3.onrender.com` e **não** `ecoa-backend.onrender.com` nem `10.0.2.2`; mesmo `index-*.js` do preview da v3 |
| 5 | `https://careplus-ecoafono.vercel.app` = 200 (hoje 404); `<title>` do ECOA; header `Content-Security-Policy: connect-src … https://*.onrender.com …`; bundle igual ao da Production |
| 5 | Pré-voo CORS: `OPTIONS /auth/login` com `Origin` novo + `Access-Control-Request-Method: POST` → 204 com o `allow-origin` certo |
| 5 | `GET /trainings` sem token = 200 só com treinos `audience.all`; login de paciente mockado = 200 `role: patient`; rotas de admin 401 sem token |
| 5 | **v2 intacta:** `care-plus-git-v2-…` = 200 embutindo `ecoa-backend.onrender.com`; `ecoa-backend.onrender.com/health` = 200 |

O login do admin no domínio novo é checagem **da usuária** (a senha é dela): `ecoafono@email.com` + `ADMIN_PASSWORD` → Painel do administrador.
No navegador (DevTools → Network) não deve haver chamada a `10.0.2.2` nem a `ecoa-backend.onrender.com` (v2).

**Plano de volta (v2 como site principal)**

- Mais rápido: **Vercel → Deployments → último deploy Production da v2 (anterior à promoção) → ⋯ → Promote to Production / Instant Rollback.**
  Volta o código **e** a API embutida daquele build (a da v2), sem editar variável. `careplus-ecoafono.vercel.app` segue na Production, então passa a servir a v2.
- Depois do rollback, **não** rebuildar com `EXPO_PUBLIC_API_BASE_URL` apontando para o backend v3 sem querer. Volta "definitiva":
  Production Branch = `v2`, `EXPO_PUBLIC_API_BASE_URL` (Production) = `https://ecoa-backend.onrender.com`, Redeploy sem cache.
- O backend v3 é serviço separado: não precisa de rollback; o `ecoa-backend` da v2 nunca foi alterado.

**Riscos da produção**

1. **Disco efêmero** (`/tmp`): reinício, redeploy ou sleep apagam treinos criados e vídeos (só seed e mockados voltam). Montar a demonstração
   pouco antes e não salvar variáveis no Render depois (cada Save reinicia e limpa).
2. **Sleep de ~50 s** no free: o 1º acesso (login/treinos) pode demorar; dar `GET /health` minutos antes.
3. **Vercel Hobby não permite uso comercial** (termos): ok para demonstração/protótipo; uso comercial exige Pro.
4. **Admin:** `ADMIN_PASSWORD` segue as regras (≥ 12, nunca `ecoa2026`). Com `ALLOW_WEAK_ADMIN_PASSWORD=true` (modo demonstração) quem lê o repo
   entra como admin e sobe vídeos — **agora num endereço público e principal**: desligar a chave e trocar a senha depois do evento.
5. **A v2 deixa de ser o site principal**, mas continua na branch `v2`, no backend `ecoa-backend` e no preview `care-plus-git-v2-…`.
6. **CSP:** se o backend sair de `*.onrender.com`, ajustar o `connect-src` no `vercel.json` ou o app perde a API.
7. **Mudar `EXPO_PUBLIC_*`** na Production exige Redeploy sem cache; mudar `CORS_ORIGIN`/`ADMIN_PASSWORD` exige só restart do Render (que apaga o `/tmp`).

## Rotina
A cada push na v3: confiro os dois deploys e aviso o PM **quando** é preciso Redeploy manual na Vercel.
