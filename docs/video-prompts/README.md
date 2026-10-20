# Prompts de vídeo — ECOA (Gemini)

Prompts prontos pra colar no Gemini, um arquivo por exercício, organizados em pastas por
faixa etária: `infantil/`, `adultos/`, `idosos/`. Cada arquivo é auto-contido — abre só o do
exercício que você quer gerar e copia o bloco de prompt direto.

## Contexto do projeto (vale pra todos os prompts)

O **ECOA** é uma aba do app de saúde **Care Plus** que leva exercícios de fonoaudiologia pra
dentro de casa: o paciente pratica sozinho, entre as sessões semanais com o(a)
fonoaudiólogo(a), acompanhado por uma câmera que reconhece o movimento do rosto e valida se o
exercício foi feito corretamente. Antes de cada exercício, a tela de prévia mostra um vídeo
curto, silencioso e em loop, demonstrando exatamente o movimento que o paciente vai repetir —
é esse vídeo que estes prompts geram. Ele precisa ser claro e fácil de copiar só de olhar,
porque é a referência visual do paciente antes de começar.

## Regras técnicas gerais

- **Proporção**: 16:9 (horizontal/landscape) — os 5 vídeos já gerados da trilha adulta saíram
  nesse formato (1024×576) e o player do app (`ExerciseVideo.tsx`) já está ajustado pra ele;
  manter os novos na mesma proporção evita qualquer caixa com tarja ou corte diferente entre
  exercícios.
- **Enquadramento**: plano fechado, do ombro pra cima, pessoa centralizada, olhando direto pra
  câmera (exceções anotadas nos arquivos de idosos, onde o movimento é mais difícil de ver).
- **Cenário**: fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras
  fortes — estilo documental, como referência real de exercício de fonoaudiologia, não
  publicidade.
- **Sem fala, sem música, sem corte de câmera** — só o movimento, devagar e anatomicamente
  claro.
- **Duração**: 8 segundos, em loop perfeito (o player do app toca em loop sem parar).
- Modelos de vídeo costumam responder melhor em inglês — se um prompt sair recusado ou
  estranho em português, vale tentar traduzir só esse prompt pro inglês.
- Assim que um vídeo sair bom, **baixe e guarde na hora** — ferramentas de geração costumam
  limpar o histórico ou expirar o link depois de um tempo.
- **Um prompt por conversa nova no Gemini.** Mandar vários prompts seguidos na mesma conversa
  faz o modelo usar os vídeos anteriores como contexto — na prática, o vídeo do 3º exercício
  sai mostrando o movimento do 1º, depois o do 2º, depois só então o do 3º, em vez de só o
  terceiro do início ao fim. Abra um chat novo pra cada exercício. Se precisar continuar na
  mesma conversa por algum motivo, comece o prompt com algo como *"Ignore completamente todos
  os vídeos e instruções anteriores desta conversa. Este é um pedido novo e independente:"*
  antes de colar o prompt normal.

## Se o vídeo sair parecido com outro, ou genérico

Ações sutis (língua, garganta, bochechas) são as que mais frequentemente saem parecidas com
"a cara padrão" do modelo — um rosto neutro ou sorrindo, em vez do movimento pedido. Por isso
cada prompt desta pasta tem duas seções a mais, pensadas especificamente pra isso:

- **AÇÃO com sequência de tempo** (ex. "0.0–1.0s: ...", "1.0–2.0s: ...") em vez de uma
  descrição solta — modelos de vídeo seguem uma instrução "roteirizada" por tempo bem melhor
  do que um parágrafo corrido pedindo a mesma coisa.
- **"O QUE NÃO PODE ACONTECER"** — diz explicitamente que o vídeo não pode cair num sorriso ou
  expressão neutra genérica, e qual é o único evento visual que precisa estar lá. Isso reduz
  (não elimina) a chance do modelo "escorregar" pro resultado seguro de sempre.

Se mesmo assim o vídeo sair errado: tente gerar de novo primeiro (o mesmo prompt pode dar
resultados bem diferentes em tentativas diferentes) antes de reescrever o prompt. Os
exercícios de `elderly-effortful-swallow` (deglutição) e `elderly-tongue-elevation` (língua)
são os mais arriscados das 15 — pode valer gerar esses dois por último, depois de já ter
prática com os outros.

## Reaproveitamento entre trilhas

Comparando os 15 exercícios, só **"Alongamento de mandíbula"** (adultos) e **"Abertura e
fechamento de boca"** (idosos) são visualmente parecidos — os outros 13 não têm equivalente em
outra trilha. Não dá pra prometer mais economia de gerações do que isso.

## Depois de gerar

Cada vídeo entra em `ECOA_mobile/assets/videos/<id-do-exercicio>.mp4` e precisa de uma linha
`demoVideoAsset: require("../assets/videos/<id-do-exercicio>.mp4")` no exercício correspondente
em `ECOA_mobile/data/exercises.ts` — o id de cada exercício está no nome do arquivo de prompt
correspondente.
