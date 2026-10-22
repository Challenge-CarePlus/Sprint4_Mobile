# V3 — Tarefa do Tester (QA)

Leia antes: `docs/v3/SPEC.md` (escopo, usuários mockados, API, **critérios de aceite**), o protótipo do administrador
https://claude.ai/artifact/EttUPt9beEkP1ksTjpzeJY e o DS https://claude.ai/artifact/Ttcaqk6QNXVrPd1zQ7wZ2D.

## Regras de trabalho
- Branch **v3**. Não edite código de produção; só testes/automação/documentos de teste. Sem push.
- Fixe sempre o **hash testado** (`git rev-parse --short HEAD`) em cada relatório.
- Reporte com `maestri ask "PM" "<resultado por ID: aprovado/reprovado/pendente + hash>"`. IDs: **V3-B*** backend, **V3-F*** frontend,
  **V3-S*** segurança, **V3-T*** casos do plano.

## Entregas
1. **Plano de testes** em `docs/v3/TEST-PLAN.md`: casos `V3-T01…` com pré-condições, passos, resultado esperado e prioridade, cobrindo todos os
   critérios de aceite do SPEC.
2. **Automação** (Playwright, `channel:'msedge'`; scripts em `C:/Users/isabe/AppData/Local/Temp/claude/*/scratchpad/pw`; `e2e.js` usa um `.y4m`
   de rosto como webcam falsa):
   - Entrada: vazio → paciente; e-mail admin + senha certa → painel; admin sem senha → erro; senha errada; paciente mockado
     (`mariana.costa@ecoa.test` / `ecoa2026`); e-mail desconhecido → anônimo.
   - Admin cria treino (2 exercícios, 1 vídeo, audiência "Mariana + Lucas") → visibilidade: Mariana vê, Pedro **não**, anônimo só "para todos".
   - Exercício personalizado percorre prévia → calibração → sessão **validada pela câmera** → resumo; "Testar agora" funciona.
   - Tema claro/escuro/auto: persiste ao recarregar, Trilha Infantil sempre clara, **contraste AA no escuro** (meça por script os pares
     texto/fundo das telas principais), sem texto ilegível.
   - Responsivo 360/768/1440 sem rolagem horizontal; alvos ≥ 48px.
3. **Segurança (API):** 401 sem token e **403 para paciente** em TODA rota de admin; upload malicioso (tipo falso, > 30 MB, nome com `../`,
   extensão dupla); path traversal em `/media`; **XSS** em nome de treino/exercício (renderização escapada); rate limit; CORS para
   `care-plus-git-v3-*`; confirmar que a v2 não foi alterada (`git diff v2..v3` não deve tocar comportamento da v2 sem o SPEC pedir).
4. **Acompanhe as entregas** (`git log v3`) e rode o que já existir; não teste código inexistente. Avise o PM quando o plano estiver pronto.
