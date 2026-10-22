# V3 — Voz configurável, calma e atenciosa (Frontend)

Pedido da usuária (22/10): "a voz não sai por padrão em todos os aparelhos — colocar nas configurações para o usuário
configurar; e uma voz mais calma e atenciosa". Branch `v3`. Mesmas regras de trabalho (commits pequenos só dos seus arquivos,
sem push, reportar com `maestri ask "PM"`).

## Por que a voz não sai em alguns aparelhos (causas a tratar)
1. **Autoplay/gesto do usuário:** no navegador (Web Speech API), principalmente no iPhone/Safari e no Chrome mobile, falar sem um
   toque anterior do usuário na página é bloqueado. A 1ª fala da sessão acontece sem gesto recente.
2. **Vozes carregam de forma assíncrona:** `speechSynthesis.getVoices()` vem vazio no início; escolher voz cedo falha.
3. **O aparelho pode não ter voz em português do Brasil** instalada (Android sem pacote de voz, alguns Windows/Linux).
4. Hoje `speak()` só passa `language: "pt-BR"`, sem escolher voz, velocidade ou tom.

## Entregas
1. **Configurações → seção "Voz"** (mesmo padrão visual do DS/protótipo: `OptionGroup`, interruptor do tipo `px-switch`, claro e escuro,
   a11y com `aria-checked`/`role`, alvos ≥ 48 px):
   - Interruptor **"Voz de orientação"** (padrão **ligado**).
   - **"Voz"**: lista as vozes pt-BR **realmente disponíveis no aparelho** (`Speech.getAvailableVoicesAsync()` / `speechSynthesis.getVoices()`,
     recarregar no evento `voiceschanged`), com a opção **"Automática (recomendada)"** no topo, que escolhe a mais calma por heurística
     (função pura **testada**): preferir vozes neurais/naturais de qualidade (ex.: nomes com "Natural", "Neural", "Online", Google português do Brasil,
     Microsoft Francisca/Maria, Apple Luciana/Fernanda/Felipe), evitar vozes robóticas/compactas ("compact", "espeak").
   - **"Ritmo"**: Devagar (0,8) · **Calma (0,9, padrão)** · Normal (1,0). Tom padrão ligeiramente suave (0,95–1,0).
   - Botão **"Testar voz"** que fala uma frase curta e acolhedora ("Olá! Vou te orientar com calma durante os exercícios.") — esse toque também
     **destrava o áudio** do navegador (gesto do usuário).
   - Persistir em `AppSettings` (`services/settingsStorage.ts`: `voiceEnabled`, `voiceId`, `voiceRate`), com defaults e migração de quem já tem
     configurações salvas; "Restaurar padrão" também restaura a voz.
   - **Aviso honesto** quando não houver voz pt-BR: "Seu aparelho não tem uma voz em português instalada. As instruções continuam aparecendo na
     tela. Para ativar a voz, instale uma voz em português nas configurações do aparelho." (sem travar nada).
2. **`services/speech.ts`** passa a respeitar as configurações: `voiceEnabled=false` → não fala; aplica `voice`, `rate`, `pitch`; mantém a regra
   de não repetir a mesma frase em sequência e não falar duas ao mesmo tempo. Detectar falha silenciosa (nenhum `onStart` em ~1,5 s ou
   `speechSynthesis` ausente) e expor um estado `speechAvailable`/`speechBlocked`.
3. **Destravar na sessão:** se a voz estiver ligada mas bloqueada pelo navegador, mostrar na tela do exercício (calibração/sessão) um aviso
   discreto e tocável: **"Toque para ativar a voz"** (um toque destrava e fala "Pronto, voz ativada"). Não pode atrapalhar a câmera nem o fluxo.
4. **Voz calma e atenciosa — tom das falas.** Separar o texto **falado** do texto **exibido** quando fizer sentido, com frases curtas, gentis e
   sem imperativo seco, sem exclamações em excesso. Exemplos: "Abra mais a boca" → "Quando quiser, abra um pouquinho mais a boca";
   "Continue segurando" → "Isso, mantenha assim… você está indo bem"; "Ótimo!" → "Muito bem"; "Relaxe" → "Agora relaxe, respire com calma";
   "Exercício concluído" → "Pronto, exercício concluído. Muito bem". Trilha **infantil**: calorosa e animada, mas ainda suave; **idosos**: mais
   devagar (ritmo -0,05) e frases curtas. Centralize num mapa/função (ex.: `services/speechPhrases.ts`) para não espalhar texto pelas telas; mantenha
   os textos da tela como estão (fidelidade ao protótipo).
5. **Testes unitários:** escolha automática da voz (várias listas de vozes simuladas), defaults/migração das configurações, não falar com
   `voiceEnabled=false`, e mapeamento de frases. `tsc` e `npm test` verdes.
6. **Validação:** `expo export --platform web` e Playwright (Edge): seção Voz aparece nos dois temas, interruptor e ritmo persistem, "Testar voz"
   chama `speechSynthesis` (pode espiar `speechSynthesis.speak`), aviso quando não há voz. Declare o que NÃO validou (som real no celular).

## Observação de produto
A qualidade da voz depende do aparelho; no navegador usamos as vozes que ele oferece. Se a usuária quiser uma voz única e idêntica em todos os
aparelhos, o caminho é **áudio pré-gravado ou voz neural na nuvem (TTS)** — decisão futura (custo/privacidade); **não implementar agora**, só
registrar em CLAUDE.md como alternativa.
