# V3 — Tarefa de Render e Vercel (infra)

Leia antes: `docs/v3/SPEC.md` (seção Responsabilidades) e a seção "Deploy" do `CLAUDE.md`.
Você **não tem acesso aos painéis**: verifique por HTTP e **guie a usuária com passos exatos**.

## Regras
- Branch **v3**. Não altere código de app. Sem push. O Backend edita `render.yaml`: não conflite — só revise o que ele colocar.
- Reporte com `maestri ask "PM" "<o que está OK, o que falhou, o que a usuária deve fazer>"` e deixe o checklist em `docs/v3/INFRA.md`.

## Contexto
- **v2 está em produção** e não pode cair: Render `ecoa-backend` (`srv-db82togm7kps73cr4870`, branch `v2`) e Vercel projeto `care-plus`
  (https://vercel.com/isabelabarcellos0812-6004s-projects/care-plus). O preview da v2 é
  `care-plus-git-v2-isabelabarcellos0812-6004s-projects.vercel.app`.
- A `v3` precisa de backend próprio (papéis, treinos, uploads) sem derrubar a v2.

## Entregas
1. **Render — segundo serviço `ecoa-backend-v3`** (branch `v3`, `rootDir ECOA_backend`, build `npm install && npm run build`, start `npm start`,
   health `/health`, `NODE_ENV=production`, `JWT_SECRET` gerado, `CORS_ORIGIN` com o padrão da Vercel v3, `UPLOADS_DIR`). Valide o `render.yaml`
   do Backend e escreva o **plano B manual** (passos de clique/preenchimento no painel). Depois da criação, verifique por HTTP: `/health`,
   `POST /auth/login`, CORS com `Origin: https://care-plus-git-v3-isabelabarcellos0812-6004s-projects.vercel.app`, e (quando existir)
   upload + `Range` em `/media`.
2. **Vercel — preview da v3.** Variável `EXPO_PUBLIC_API_BASE_URL` **por branch** (Environment Variables → Preview → Git Branch = `v3`) apontando
   para a URL do backend v3, **sem alterar** o que a v2 usa. Documente `EXPO_PUBLIC_AUTH_REQUIRED` (padrão `false`). Explique que a variável é
   embutida no build (precisa de redeploy ao mudar). Confirme depois por HTTP qual API o bundle do preview da v3 embute.
3. **Riscos a registrar para decisão da usuária:** disco efêmero do Render free (treinos e vídeos podem sumir num redeploy/reinício; opções:
   Render Postgres + armazenamento de objetos como Cloudflare R2 ou Supabase Storage); limite de upload (30 MB) vs plano; *sleep* de ~50 s do
   free tier (o login do admin pode demorar na 1ª vez); o `JWT_SECRET` nunca deve ser colado em conversa nem commitado.
4. Entregue `docs/v3/INFRA.md` (checklist curto, na ordem em que a usuária deve executar) e avise o PM.
