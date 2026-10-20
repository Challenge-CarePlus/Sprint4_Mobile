# Deglutição em esforço (`elderly-effortful-swallow`)

Texto exibido no app: *"Engula a saliva apertando bem a musculatura da garganta. Repita 5
vezes, com calma entre cada uma. Pare se sentir desconforto e avise seu(sua)
fonoaudiólogo(a)."* — fortalecimento muscular envolvido na deglutição. Exercício **guiado**,
recomendado com orientação do(a) fonoaudiólogo(a).

> Esta é provavelmente a ação mais difícil das 15 pra um modelo de vídeo generativo acertar —
> deglutição é um movimento rápido e sutil, fácil de "escorregar" pra um resultado genérico
> (rosto parado ou sorrindo). Por isso o prompt abaixo é mais rígido que os outros: sequência
> de tempo exata + uma seção dizendo explicitamente o que não pode acontecer.

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo — aqui o
esforço aparece no pescoço, não na boca, então o enquadramento e a ação precisam deixar isso
claro.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Uma pessoa idosa, por volta de 70 anos, com expressão calma e paciente, pescoço sem
roupa ou colar cobrindo a garganta.

ENQUADRAMENTO: Plano aberto o suficiente pra mostrar do peito pra cima, incluindo bem o
pescoço inteiro e a maçã-de-adão (não só o rosto) — essa é a parte do corpo mais importante do
vídeo, precisa ficar nítida e bem iluminada, nunca na sombra do queixo. Pessoa centralizada no
quadro, olhando diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave vinda de frente (pra não criar
sombra sob o queixo), sem sombras fortes, textura de pele natural. Vídeo de demonstração
educacional em estilo documental.

AÇÃO (siga esta sequência de tempo exatamente, não resuma nem generalize):
- 0.0–1.5s: pessoa parada, pescoço relaxado, boca fechada, expressão neutra e calma.
- 1.5–2.5s: a pessoa engole a saliva com esforço visível — a maçã-de-adão sobe
  perceptivelmente ao longo do pescoço e os músculos externos da garganta se contraem,
  ficando tensos por um instante.
- 2.5–3.0s: a maçã-de-adão desce de volta à posição de repouso, o pescoço relaxa.
- 3.0–4.5s: pausa curta, pescoço relaxado, neutro (igual ao início).
- 4.5–8.0s: repete a sequência inteira (engolir com esforço, subida e descida visível da
  maçã-de-adão, relaxar) mais uma vez, de forma idêntica à primeira.

O QUE NÃO PODE ACONTECER: o vídeo não pode mostrar a pessoa só sorrindo, falando, com a boca
se mexendo, ou parada com expressão neutra o tempo todo sem nenhum movimento visível no
pescoço. A subida e descida da maçã-de-adão é o único evento visual do vídeo e precisa
acontecer de forma clara e inconfundível nos dois momentos indicados acima — não troque por
nenhum outro gesto facial.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes, sem texto na
tela. O movimento do pescoço precisa ser exagerado o suficiente pra ficar óbvio num vídeo
silencioso, mesmo sendo um esforço realista (não cômico).

DURAÇÃO: 8 segundos, em loop perfeito — o quadro final deve ser idêntico ao quadro inicial
(pescoço relaxado, neutro) pra o loop não ter um "salto" visível.
```
