# V3 — Correções do Frontend após o QA no Chrome real (22/10)

Pedido da usuária. Branch `v3`. Mesmas regras: commits pequenos só dos seus arquivos, sem push, reportar com
`maestri ask "PM"` (hashes, `tsc`, `npm test`, o que NÃO validou). Origem: relatório do QA com o Claude in Chrome
(câmera real aprovada; só observações P3 abaixo).

## 1) Avisos de validação antigos ficam na tela depois de corrigidos
No formulário de treino e de exercício, mensagens como "Não use os símbolos < e >…", "Adicione pelo menos um exercício",
"Dê um nome…" continuam visíveis depois que o campo é corrigido, até salvar. **Esperado:** o erro de um campo some assim que o
valor passa a ser válido (ao digitar/alterar), o alerta geral "Faltam alguns dados…" some quando não restar nenhum erro, e o
foco/leitor de tela anuncia o erro quando ele aparece (`role="alert"`/`aria-live`). Teste unitário da lógica de erros (função pura de
validação por campo, se ainda não existir).

## 2) Excluir usa `window.confirm` do navegador
Troque por uma **confirmação própria do DS** (folha/modal no padrão do app, claro e escuro, foco preso no modal, `Escape` cancela,
botão "Excluir" em tom de perigo e "Cancelar", alvos ≥ 48 px, texto "Isso não pode ser desfeito", `aria-modal`, `role="alertdialog"`).
Vale para excluir **treino** e **exercício** (e qualquer outro `confirm`/`alert` do app: `grep` por `window.confirm`/`window.alert`/`Alert.alert`
e padronize; no app nativo `Alert.alert` pode ficar). Motivo: janelas nativas do navegador não seguem o tema e travam automação.
O "Esqueci minha senha" também usa `window.alert` ("Em breve") — troque pelo Toast do app.

## 3) Texto de privacidade vs. telemetria do MediaPipe
O QA viu o MediaPipe (web) enviar um registro de uso a `odml.pa.googleapis.com/v1/log`. Não são imagens nem vídeo, mas o
Consentimento e outros textos dizem que **"nenhum vídeo ou imagem sai do aparelho"**.
- **Investigue** o que sai (abra o DevTools/Playwright e registre as requisições a `googleapis.com` durante calibração e sessão: método,
  tamanho, se há corpo com algo além de métricas de uso). Registre o achado em `docs/v3/PRIVACIDADE.md` (curto, factual).
- **Ajuste a redação** onde houver a promessa (Consentimento, CLAUDE.md, qualquer tela) para ser **exata**: as imagens da câmera são
  processadas só no aparelho e nunca enviadas; o MediaPipe pode enviar ao Google estatísticas técnicas de uso (sem imagens), e o app envia ao
  nosso servidor apenas login, treinos e vídeos que o **administrador** escolher enviar. Mantenha o tom do DS, frase curta, sem jargão.
- **Mitigação opcional (faça só se for segura):** bloquear essa telemetria no navegador sem quebrar o carregamento do wasm/modelo — por exemplo
  cabeçalho `Content-Security-Policy` com `connect-src` permitindo apenas o que o app usa (self, o backend `EXPO_PUBLIC_API_BASE_URL`,
  `cdn.jsdelivr.net` e o que o MediaPipe realmente precisar) via `ECOA_mobile/vercel.json` `headers`. **Teste exaustivamente** (calibração,
  sessão, "Testar agora", vídeo remoto, Google Fonts) antes de manter; se qualquer coisa quebrar, **não aplique** e deixe só a redação
  correta. Não toque na `v2`.

## Validação
`npx tsc --noEmit`, `npm test`, `npx expo export --platform web`, Playwright (Edge, `face-adult.y4m`/rosto falso): erros somem ao corrigir;
confirmação própria abre/cancela/exclui nos dois temas; texto de privacidade atualizado; se aplicar o CSP, fluxo completo sem erro no console.
Declare o que NÃO validou.
