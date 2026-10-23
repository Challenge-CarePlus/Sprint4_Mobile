# V3 — Infra (Render + Vercel): checklist da usuária

Objetivo: publicar a `v3` **sem derrubar a v2**. A v2 continua em `ecoa-backend` (Render) e no projeto `care-plus` (Vercel).
Verificações feitas por HTTP em 22/10 (sem acesso aos painéis).

## Estado atual (22/10)

| Item | Estado |
|---|---|
| Render `ecoa-backend` (v2) | OK, código novo no ar |
| Branch `v3` no GitHub | Existe. `render.yaml` já traz o serviço `ecoa-backend-v3` |
| Render `ecoa-backend-v3` | **Não criado ainda** (`ecoa-backend-v3.onrender.com/health` → 404) |
| Vercel preview da v3 (`care-plus-git-v3-…`) | **Existe (200)**, mas embute a API de fallback `http://10.0.2.2:3000` → **não** tem `EXPO_PUBLIC_API_BASE_URL`; o login/treinos não funcionam nele até a variável existir e haver redeploy |

## O que o `render.yaml` da v3 já define (serviço `ecoa-backend-v3`)

`branch: v3` · `rootDir: ECOA_backend` · build `npm install && npm run build` · start `npm start` · health `/health` ·
`NODE_ENV=production` · `JWT_SECRET` gerado pelo Render · `DATA_DIR=/tmp/ecoa-data` · `UPLOADS_DIR=/tmp/ecoa-uploads` ·
`CORS_ORIGIN` (`sync:false` — você preenche). **Vai ganhar `ADMIN_PASSWORD` (`sync:false`)**: o servidor **não sobe em
produção sem ela** e exige **mínimo 12 caracteres**, **nunca igual à dos pacientes (`ecoa2026`)**, e recusa senhas óbvias (só números, `senha123`, `admin123`, `password`, `ecoafono`…). É a senha do admin (`ecoafono@email.com`); a dos pacientes mockados segue
`ecoa2026` (sem privilégio). Nunca colar a senha em chat, print ou commit.

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

## Rotina
A cada push na v3: confiro os dois deploys e aviso o PM **quando** é preciso Redeploy manual na Vercel.
