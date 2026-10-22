# V3 — Correções do Backend após o QA (hash testado a0bd676)

Decisões do PM sobre os achados do Tester. Mesmas regras: branch `v3`, commits pequenos só dos seus arquivos, sem push,
reportar com `maestri ask "PM"` (arquivos, hashes, `tsc`, `npm test`, o que NÃO validou).

## V3-S21 (ALTA) — senha do administrador NÃO pode estar no repositório
**Decisão:** a senha do admin vem de `ADMIN_PASSWORD` (variável de ambiente).
- Em `NODE_ENV=production`, `ADMIN_PASSWORD` é **obrigatória**: sem ela o servidor **não sobe** (mesmo padrão do `JWT_SECRET`), com
  mensagem clara. Mínimo 8 caracteres.
- Fora de produção (dev/teste), sem a variável, usa um valor de desenvolvimento **diferente do dos pacientes** (ex.: `ecoa-admin-dev`).
- Pacientes mockados **mantêm** `ecoa2026` (são usuários de teste sem privilégio; o treino destinado a eles é o que se quer testar).
- O seed **não grava** a senha do admin em texto: faz o hash a partir da env na inicialização; se a env mudar, o hash do admin é atualizado.
- Remover a senha do admin de `seed.ts`, do `CLAUDE.md`, de `docs/v3/*` e dos testes (os testes definem `ADMIN_PASSWORD` própria).
  A senha de teste dos pacientes (`ecoa2026`) pode continuar documentada.
- `render.yaml` (serviço v3): `ADMIN_PASSWORD` com `sync: false` (a usuária define no painel; nunca em chat nem commit).
- Atualize `docs/v3/SPEC.md` (a tabela de usuários deixa de dizer que o admin usa `ecoa2026`; diz "senha definida em `ADMIN_PASSWORD`").
- Teste: produção sem `ADMIN_PASSWORD` não sobe; login do admin só com a env; paciente não loga como admin.

## V3-B1 — multipart malformado devolve 500 (deve ser 400)
Em `mediaRouter.ts`, erros do busboy/multer que não sejam `MulterError` (cabeçalho com NUL no filename etc.) → **400** com mensagem
clara, sem stack no log de produção.

## V3-B2 — Range inválido em `/media` devolve 404 (deve ser 416)
O callback do `sendFile` troca qualquer erro por 404. Repasse `error.status` (416 para Range fora do tamanho; 404 só para arquivo inexistente).

## V3-B3 — ids de exercício duplicados no mesmo treino
Aceitos hoje (`ex1`, `ex1`). **Decisão:** o servidor ignora o `id` enviado pelo cliente nos exercícios e **gera ids únicos** (como já faz com o id do treino).

## V3-B4 — `video.url` que não existe no disco
Validar que `video.url` é `/media/<hex32>.<ext>` **e** que o arquivo existe em `UPLOADS_DIR`; senão 400 ("Vídeo não encontrado, envie de novo").
Uploads nunca ligados a um treino ficam órfãos: implemente limpeza simples (apagar uploads sem referência e com mais de 24 h, na inicialização
e a cada 6 h) **ou** registre como limitação no CLAUDE.md — prefira a limpeza se for pequena.

Atualize/adicione testes para cada item. Depois me avise para o Tester reexecutar V3-B1..B4 e V3-S21.
