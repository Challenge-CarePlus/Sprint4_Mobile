# Privacidade: o que sai do aparelho (v3, 22/10)

## Achado
O MediaPipe (versão web, `@mediapipe/tasks-vision@1.1.0`) faz uma requisição de uso ao Google durante a calibração/sessão:

- `POST https://odml.pa.googleapis.com/v1/log`, corpo binário (protobuf) de **~90 bytes**: versão da biblioteca (`1.1.0`) e contadores/códigos de uso.
  Sem imagem, sem vídeo, sem landmarks, sem identificação do usuário que o app informe (o app não envia nada a esse endereço; é a biblioteca).
- Medido com Edge + câmera falsa (Playwright, `ctx.on('request')`): 1 POST em ~1 min de sessão. Os demais pedidos externos são só `GET` de
  `cdn.jsdelivr.net` (código e wasm do MediaPipe) e, ao nosso back-end, `GET /trainings`.
- O endereço IP de quem usa chega ao Google como em qualquer requisição.

## O que a promessa passa a dizer
- As imagens da câmera são analisadas só no aparelho: nunca enviadas nem guardadas.
- A biblioteca do Google pode enviar estatísticas técnicas de uso, sem imagens.
- Ao nosso servidor vão apenas login, treinos e os vídeos que o **administrador** escolher enviar.

Textos ajustados: tela de Consentimento (`pages/exercise/ConsentScreen.tsx`) e `CLAUDE.md`.

## Mitigação (web)
`ECOA_mobile/vercel.json` define `Content-Security-Policy: connect-src 'self' blob: data: https://*.onrender.com https://cdn.jsdelivr.net`.
O POST ao Google passa a ser recusado pelo navegador (erro de CSP no console, inofensivo); wasm, modelo (local), API e vídeos continuam.

Testado com o mesmo cabeçalho num servidor local (Edge): calibração e sessão chegam ao exercício; admin cria treino, envia vídeo (30 MB recusado,
mp4 aceito), paciente vê o treino e o vídeo remoto toca; sem erro de CSP além do POST bloqueado.

**Não testado:** o cabeçalho servido de fato pela Vercel; Chrome/Safari reais; app nativo (a WebView local carrega o MediaPipe do bundle;
se ele envia telemetria lá, não foi medido — por isso o texto diz "pode enviar").
**Risco:** backend em outro domínio que não `*.onrender.com`, ou troca do CDN, exige ajustar o `connect-src`; senão a API/MediaPipe falham.
