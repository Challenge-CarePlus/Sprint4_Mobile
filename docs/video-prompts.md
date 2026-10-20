# Prompts de vídeo — ECOA (Gemini)

Prompts prontos pra colar no Gemini, um por exercício, organizados pelas três trilhas do ECOA
(infantil, adulta, idosos). Cada prompt já é auto-contido — pode copiar só o bloco de um
exercício e colar direto, sem precisar do resto do arquivo.

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
  câmera.
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

## Reaproveitamento entre trilhas

Comparando os 15 exercícios, só **"Alongamento de mandíbula"** (adultos) e **"Abertura e
fechamento de boca"** (idosos) são visualmente parecidos — os outros 13 não têm equivalente em
outra trilha. Não dá pra prometer mais economia de gerações do que isso.

---

## Trilha infantil

> ⚠️ **Sobre imagem de criança**: filmar uma criança de verdade exige autorização de imagem
> assinada pelo responsável legal — o mesmo princípio que a própria tela de consentimento do
> app já aplica para o paciente menor de idade. Sem essa autorização, os prompts abaixo pedem
> um(a) **adulto(a) com tom lúdico e brincalhão** no lugar da criança — gestos um pouco mais
> expressivos, expressão animada, como quem está brincando com uma criança. Se depois surgir
> autorização de verdade, só trocar "um adulto com tom lúdico e expressão animada, brincando
> com uma criança imaginária" por "uma criança, por volta de 6 a 8 anos, com expressão alegre"
> em cada prompt.

### 1. Sorriso largo

Texto exibido no app: *"Dá um sorrisão bem grande, mostrando os dentinhos! Segura o sorriso
enquanto eu conto até 2. Relaxa e respira fundo."* — praxia labial (mobilidade e força dos
lábios).

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo — crianças e
pais vão assistir antes de repetir o exercício na frente da câmera do celular.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Um adulto com tom lúdico e brincalhão, expressão animada, como quem está brincando com
uma criança (sem criança real no vídeo — ver nota de autorização de imagem).

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A pessoa começa com a boca relaxada e fechada, neutra. Abre suavemente num sorriso bem
largo, mostrando as duas fileiras de dentes, segura o sorriso completo por cerca de 2 segundos,
depois relaxa de volta à posição neutra. Repita o ciclo completo duas vezes.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 2. Bico de passarinho

Texto exibido no app: *"Faz um biquinho, como se fosse dar um beijinho! Segura o biquinho
enquanto eu conto até 2. Relaxa e respira fundo."* — praxia labial (protrusão e arredondamento
dos lábios).

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo — crianças e
pais vão assistir antes de repetir o exercício na frente da câmera do celular.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Um adulto com tom lúdico e brincalhão, expressão animada, como quem está brincando com
uma criança (sem criança real no vídeo — ver nota de autorização de imagem).

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A pessoa começa com a boca relaxada e neutra, depois franze os lábios para frente num
bico bem fechado e arredondado, como mandando um beijo, segura por cerca de 2 segundos, depois
relaxa de volta à posição neutra. Repita o ciclo completo duas vezes.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 3. Língua de cobrinha

Texto exibido no app: *"Bota a língua pra fora, bem reta, como uma cobrinha! Segura enquanto eu
conto até 2. Guarda a língua de novo."* — praxia lingual (protrusão de língua). Exercício
**guiado** (autoavaliação, não validado por câmera — o MediaPipe não rastreia língua).

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo — aqui o
paciente se auto-avalia (sem validação por câmera), então a demonstração precisa deixar bem
claro como repetir o movimento.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Um adulto com tom lúdico e brincalhão, expressão animada, como quem está brincando com
uma criança (sem criança real no vídeo — ver nota de autorização de imagem).

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A boca da pessoa abre levemente e a língua se estica para fora, reta e achatada (não
pontuda), segura por cerca de 2 segundos, depois a língua recolhe e a boca fecha. Repita o
ciclo completo duas vezes.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 4. Sopro do balãozinho

Texto exibido no app: *"Enche a bochecha de ar, como se fosse encher um balão! Segura o ar
enquanto eu conto até 3. Solta o ar devagarinho."* — sopro (controle de fluxo de ar e das
bochechas).

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo — crianças e
pais vão assistir antes de repetir o exercício na frente da câmera do celular.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Um adulto com tom lúdico e brincalhão, expressão animada, como quem está brincando com
uma criança (sem criança real no vídeo — ver nota de autorização de imagem).

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: As bochechas da pessoa enchem completamente de ar, como inflando um balão, segura por
cerca de 3 segundos, depois o ar solta devagar e as bochechas desincham suavemente. Repita o
ciclo completo duas vezes.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 5. Tique-taque da língua

Texto exibido no app: *"Estala a língua fazendo tique-taque, como um relógio! Repete o
tique-taque 10 vezes. Se sentir a boca cansada, descansa um pouquinho."* — praxia linguopalatal
(estalar a língua no céu da boca). Exercício **guiado**.

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo — aqui o som do
estalo é o ponto principal, então o movimento da língua precisa ficar bem visível mesmo sem
áudio.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Um adulto com tom lúdico e brincalhão, expressão animada, como quem está brincando com
uma criança (sem criança real no vídeo — ver nota de autorização de imagem).

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A boca da pessoa fica levemente aberta e a língua estala ritmicamente contra o céu da
boca, num ritmo constante de tique-taque, como um relógio, repetido cerca de 6 vezes num ritmo
uniforme.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

---

## Trilha de dicção e oratória (adultos)

> Os 5 vídeos desta trilha **já foram gerados e estão no app** (`assets/videos/adults-*.mp4`).
> Os prompts ficam aqui só como registro — útil se algum precisar ser refeito.

### 1. Alongamento de mandíbula ✅ já gerado

Texto exibido no app: *"Abra bem a boca, como um bocejo controlado. Segure a abertura por 3
segundos. Feche devagar e relaxe o maxilar."* — relaxamento e amplitude da ATM antes de falar.

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo antes do
paciente repetir na frente da câmera do celular.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Um adulto por volta dos 30 anos, com expressão calma e profissional.

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A boca da pessoa abre bem larga e devagar, como um bocejo controlado, segura por cerca
de 3 segundos, depois fecha devagar relaxando o maxilar. Repita o ciclo completo duas vezes.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 2. Sobrearticulação vocálica ✅ já gerado

Texto exibido no app: *"Exagere a abertura da boca ao pronunciar A, E, I, O, U. Faça 2 séries
das 5 vogais, bem devagar. Observe no espelho a amplitude de cada movimento."* — amplitude
articulatória para dicção.

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo antes do
paciente repetir na frente da câmera do celular.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Um adulto por volta dos 30 anos, com expressão calma e profissional.

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A pessoa articula as vogais A, E, I, O, U em sequência, cada uma devagar e
exageradamente clara, com um movimento de boca bem amplo e deliberado para cada vogal.

RESTRIÇÕES: Sem fala (o movimento da boca mostra a articulação, mas sem áudio de voz), sem
música de fundo, sem movimento de câmera, sem cortes. Movimento suave e anatomicamente claro,
fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 3. Sorriso e bico alternados ✅ já gerado

Texto exibido no app: *"Alterne entre um sorriso aberto e um bico de lábios. Faça 8
alternâncias, num ritmo controlado. Mantenha a cabeça parada, só os lábios se movem."* —
mobilidade e velocidade labial.

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo antes do
paciente repetir na frente da câmera do celular.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Um adulto por volta dos 30 anos, com expressão calma e profissional.

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A boca da pessoa alterna ritmicamente entre um sorriso bem aberto e um bico de lábios
fechado, num ritmo constante e uniforme, repetido cerca de 4 vezes, com a cabeça parada.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 4. Vibração de lábios (motorboat) ✅ já gerado

Texto exibido no app: *"Solte o ar vibrando os lábios, como um motorzinho. Mantenha a vibração
por cerca de 3 segundos. Repita 5 vezes, respirando entre as repetições."* — aquecimento vocal
e relaxamento labial. Exercício **guiado**.

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo antes do
paciente repetir na frente da câmera do celular.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Um adulto por volta dos 30 anos, com expressão calma e profissional.

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: Os lábios da pessoa ficam soltos e juntos, vibrando enquanto o ar é soltado por eles,
como um som de motor de barco, durando cerca de 3 segundos, depois relaxa. Repita o ciclo
completo duas vezes.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 5. Respiração costodiafragmática ✅ já gerado

Texto exibido no app: *"Inspire pelo nariz enchendo a barriga, não o peito. Expire soltando o
ar devagar pela boca. Repita por 5 ciclos completos."* — suporte respiratório para projeção
vocal. Exercício **guiado**.

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo antes do
paciente repetir na frente da câmera do celular.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Um adulto por volta dos 30 anos, com expressão calma e profissional.

ENQUADRAMENTO: Plano fechado, do ombro para cima (suficiente pra ver a mão na barriga), pessoa
centralizada no quadro, olhando diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A pessoa apoia uma mão na própria barriga. Inspira devagar pelo nariz, expandindo
visivelmente a barriga sob a mão, depois expira devagar pelos lábios entreabertos enquanto a
barriga volta a baixar. Repita por dois ciclos completos de respiração calma.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

---

## Trilha de fortalecimento orofacial (idosos)

### 1. Abertura e fechamento de boca

Texto exibido no app: *"Abra e feche a boca devagar, com um pouco de esforço. Repita o
movimento 8 vezes. Faça pausas se sentir cansaço."* — fortalecimento da musculatura
mandibular. (Único exercício com equivalente visual na trilha adulta — "Alongamento de
mandíbula" — mas o ritmo aqui deve ser mais lento e com mais esforço aparente, não um bocejo.)

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo antes do
paciente repetir na frente da câmera do celular. O público dessa trilha é idoso — o ritmo
precisa parecer calmo e deliberado, nunca apressado.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Uma pessoa idosa, por volta de 70 anos, com expressão calma e paciente.

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A pessoa abre e fecha a boca devagar e deliberadamente, com um pouco de esforço muscular
visível a cada vez, repetido cerca de 4 vezes num ritmo calmo e sem pressa.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar — ritmo mais lento que o de um
adulto jovem.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 2. Bico labial sustentado

Texto exibido no app: *"Faça bico com os lábios, bem fechado. Segure a posição por 3 segundos.
Repita 5 vezes."* — fortalecimento do fechamento labial, apoio ao controle de saliva e à
deglutição.

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo antes do
paciente repetir na frente da câmera do celular. O público dessa trilha é idoso — o ritmo
precisa parecer calmo e deliberado, nunca apressado.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Uma pessoa idosa, por volta de 70 anos, com expressão calma e paciente.

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A pessoa franze os lábios num bico firme e fechado e sustenta a posição de forma
estável, sem tremer, por cerca de 3 segundos, depois relaxa. Repita o ciclo completo duas
vezes.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 3. Sorriso sustentado

Texto exibido no app: *"Sorria abrindo bem os lábios. Segure o sorriso por 3 segundos. Repita 5
vezes."* — fortalecimento da musculatura de bochechas e lábios.

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo antes do
paciente repetir na frente da câmera do celular. O público dessa trilha é idoso — o ritmo
precisa parecer calmo e deliberado, nunca apressado.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Uma pessoa idosa, por volta de 70 anos, com expressão calma e paciente.

ENQUADRAMENTO: Plano fechado, do ombro para cima, pessoa centralizada no quadro, olhando
diretamente para a câmera. Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A pessoa sorri amplamente e sustenta o sorriso de forma estável, sem tremer, por cerca
de 3 segundos, depois relaxa de volta à posição neutra. Repita o ciclo completo duas vezes.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 4. Elevação de língua ao palato

Texto exibido no app: *"Encoste a ponta da língua atrás dos dentes de cima. Segure a posição
por 3 segundos. Repita 5 vezes, sem pressa."* — preparo motor para uma deglutição mais segura.
Exercício **guiado**, recomendado com orientação do(a) fonoaudiólogo(a).

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo — esse
exercício é difícil de enxergar por fora (a língua fica quase escondida), então vale pedir um
close um pouco mais aberto pra região da boca.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Uma pessoa idosa, por volta de 70 anos, com expressão calma e paciente.

ENQUADRAMENTO: Close na região da boca, boca levemente entreaberta de propósito pra dar pra
ver o movimento da ponta da língua, pessoa olhando diretamente para a câmera. Proporção 16:9
(horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A boca da pessoa fica levemente aberta. A ponta da língua sobe visivelmente e pressiona
contra a região logo atrás dos dentes da frente superiores, segura ali por cerca de 3
segundos, depois abaixa. Repita o ciclo completo duas vezes.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar — a língua precisa ficar visível,
não escondida atrás dos lábios fechados.

DURAÇÃO: 8 segundos, em loop perfeito.
```

### 5. Deglutição em esforço

Texto exibido no app: *"Engula a saliva apertando bem a musculatura da garganta. Repita 5
vezes, com calma entre cada uma. Pare se sentir desconforto e avise seu(sua)
fonoaudiólogo(a)."* — fortalecimento muscular envolvido na deglutição. Exercício **guiado**,
recomendado com orientação do(a) fonoaudiólogo(a).

```
CONTEXTO: Este vídeo é para o ECOA, recurso do app de saúde Care Plus que ensina pacientes a
fazerem exercícios de fonoaudiologia sozinhos em casa. Ele toca em loop, silencioso, na tela
de prévia do exercício, como referência visual de como fazer o movimento certo — aqui o
esforço aparece mais no pescoço do que na boca, então o enquadramento precisa incluir o
pescoço, não só o rosto.

ESTILO: Vídeo fotorrealista, filmado com câmera de verdade — não é renderização 3D, não é
ilustração, não é desenho animado.

PESSOA: Uma pessoa idosa, por volta de 70 anos, com expressão calma e paciente.

ENQUADRAMENTO: Plano aberto o suficiente pra mostrar do peito pra cima, incluindo bem o
pescoço (não só o rosto), pessoa centralizada no quadro, olhando diretamente para a câmera.
Proporção 16:9 (horizontal).

CENÁRIO: Fundo liso cinza-claro, iluminação de estúdio suave e uniforme, sem sombras fortes,
textura de pele natural. Vídeo de demonstração educacional em estilo documental.

AÇÃO: A pessoa realiza uma deglutição visivelmente forçada: os músculos da garganta e do
pescoço se contraem perceptivelmente e a laringe sobe durante a deglutição, depois relaxa.
Repita o ciclo completo duas vezes.

RESTRIÇÕES: Sem fala, sem música de fundo, sem movimento de câmera, sem cortes. Movimento
suave e anatomicamente claro, fácil de copiar só de olhar — o movimento da garganta precisa
ficar visível, não escondido pela sombra do queixo.

DURAÇÃO: 8 segundos, em loop perfeito.
```
