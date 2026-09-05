# Colaboração entre sessões — Visualizador de Revestimentos

Este arquivo existe para que múltiplas sessões (incluindo diferentes instâncias do Claude, em diferentes momentos) consigam trabalhar neste repositório sem sobrescrever ou quebrar o que outra sessão já construiu.

**Toda sessão que for mexer neste repositório deve ler este arquivo inteiro antes de escrever qualquer código.**

---

## Regra de ouro

**Nunca confie em conteúdo de arquivo que você já tem "na memória" de uma leitura anterior nesta mesma conversa, se a conversa não é contínua com o momento em que você vai editar.** Outra sessão pode ter alterado o arquivo entre a sua leitura e a sua escrita. Sempre busque a versão mais recente do arquivo diretamente do GitHub (SHA/conteúdo atual) imediatamente antes de editar.

---

## Antes de começar a trabalhar

1. Leia este `colaboracao.md` por inteiro.
2. Leia a seção **"Log de sessões"** no final deste arquivo para saber o que foi feito por último e o que está em andamento.
3. Se algo estiver marcado como **"EM ANDAMENTO"** por outra sessão recente (menos de algumas horas), evite mexer nos mesmos arquivos até confirmar que não há conflito.
4. Busque o conteúdo atual de qualquer arquivo diretamente do GitHub antes de editar — nunca parta de uma cópia antiga.

## Enquanto trabalha

5. Faça commits pequenos e atômicos, com mensagens descritivas (ex: `feat: adiciona marcação de 4 pontos no canvas`, não `updates`).
5.1. **Não acumule o trabalho da sessão inteira para um único commit no final.** Faça push a cada parte funcional concluída (ex: primeiro o upload da foto, depois a marcação dos pontos, depois a homografia — cada um em um commit separado, assim que funcionar). Isso permite que outra sessão veja o progresso e continue o trabalho mesmo que a sessão atual seja interrompida ou termine antes do previsto — o build nunca deve ficar "preso" esperando uma sessão específica terminar tudo de uma vez.
6. Nunca faça `force push` nem reescreva histórico (`rebase -f`, `push --force`). Histórico é sagrado — outra sessão pode depender dele para entender o que mudou.
7. Não delete ou reescreva arquivos inteiros de funcionalidades que não são o foco da sua tarefa atual, mesmo que pareçam "melhoráveis". Se identificar algo que vale mudar fora do escopo, anote na seção de notas abaixo em vez de mexer.
8. Mantenha arquivos de frontend (site/app) separados de arquivos de treino de IA:
   - `/frontend/` — código do site/app (HTML, JS, CSS)
   - `/training/` — notebooks do Colab, scripts do Kohya, configs de treino da LoRA
   - `/dataset/` — fotos do catálogo usadas para treino (ou, melhor, um link/README apontando para onde estão armazenadas — ver regra 9)
9. **Nunca commitar arquivos binários grandes** (fotos em alta resolução, arquivos `.safetensors` da LoRA treinada) diretamente no Git. Isso incha o repositório e trava clones futuros. Use Git LFS, ou armazene em um serviço externo (Hugging Face Hub, Google Drive) e deixe só o link/README no repo.
10. Branch `main` é sempre a versão estável e pronta para deploy. Trabalho experimental (ex: testando uma abordagem nova de blend de luz) vai em uma branch separada até funcionar, depois faz merge.

## Antes de terminar sua sessão

11. Atualize a seção **"Log de sessões"** abaixo com: data, o que foi feito, quais arquivos foram tocados, e se ficou algo pela metade (marque como EM ANDAMENTO com detalhe do que falta).
12. Nunca apague entradas antigas do log — só adicione a sua no topo. O log é o histórico de continuidade entre sessões.

---

## Deploy

- **Método atual: GitHub Pages**, via `.github/workflows/deploy.yml`. Todo push na branch `main` publica automaticamente o conteúdo de `/frontend/` em `https://devupsite.github.io/visualizador-revestimentos/`.
- Em Settings → Pages, o Source precisa estar configurado como **"GitHub Actions"** (não "Deploy from a branch") — confirme isso se o deploy parecer não estar atualizando.
- O deploy **só acontece a partir da branch `main`**, nunca de uma branch experimental.
- Antes de fazer push para `main`, confirme que a parte que você construiu funciona sozinha (mesmo que o fluxo completo ainda não esteja pronto).
- Já existe um workflow alternativo via FTP para a Hostinger (usado antes de migrarmos para o Pages) no histórico do repositório, caso um dia seja necessário voltar a hospedar lá.
- Para fazer push usando o token temporário do usuário, siga o processo descrito em `push-com-token.md`.

---

## Estrutura de pastas do projeto (atualizar conforme o projeto cresce)

```
/frontend/          → site do visualizador (HTML/JS/CSS, roda na Hostinger)
/training/          → notebooks do Colab, scripts de treino da LoRA
/dataset/           → README com onde estão as fotos de treino (não as fotos em si)
/docs/              → documentação técnica adicional, se necessário
colaboracao.md       → este arquivo
```

---

## Log de sessões

### 04/09/2026 (continuação) — Migração para Hostinger concluída + frontend da prévia por IA
- Contexto: sessão anterior decidiu adotar IA generativa via máscara e manter tudo na Hostinger. Esta continuação executa a migração de infraestrutura e o frontend.
- Infraestrutura:
  - Conta FTP dedicada criada na Hostinger, isolada em `.../public_html/visualizador` (usuário `u764636502.rafael`), em vez de reaproveitar a conta principal do domínio (`brutoceramica.com.br`) — princípio de menor privilégio, mesmo raciocínio do `bruto-secrets/`.
  - Secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` recadastrados no repositório via API (os anteriores tinham sido apagados na migração para Pages).
  - `deploy.yml` ajustado: `server-dir` de `/visualizador/` para `/` (a conta FTP dedicada já nasce presa dentro da subpasta certa).
  - **Deploy confirmado funcionando**: workflow run com `conclusion: success`, site publicado e verificado pelo usuário em `brutoceramica.com.br/visualizador/`. O link antigo do GitHub Pages não recebe mais atualizações.
- Arquivos alterados:
  - `frontend/index.html` — nova seção `.ai-preview` com botão "Gerar prévia com IA", área de status e `<img>` de resultado, dentro de `#catalog-section`.
  - `frontend/app.js` — `buildOriginalPhotoCanvas()` (foto original sem textura desenhada, mesma escala de `points`), `buildMaskCanvasForIA()` (máscara preto-e-branco reaproveitando o mesmo contorno `points` já usado na homografia — branco = editável, preto = preservar), `gerarPreviewIA()` (monta `FormData` com ambiente + máscara + textura do catálogo, chama `fetch('/api/gerar-preview.php')`, extrai a imagem `inline_data`/`inlineData` da resposta bruta do Gemini e exibe). Botão habilita ao escolher um revestimento; estado reseta em `resetPoints()`.
  - `api/gerar-preview.php` (sessão anterior) — ponte pública sem segredo, `require` de `visualizador-secrets/API/gerar-preview.php` fora do `public_html`.
- Status: **frontend e ponte pública prontos e commitados, mas o pipeline de geração ainda NÃO funciona de ponta a ponta** — falta a peça final.
- EM ANDAMENTO / pendente para a próxima sessão:
  - **Criar `visualizador-secrets/API/gerar-preview.php` no servidor Hostinger** (fora do `public_html`, via FTP/File Manager) — só existe um rascunho de referência (não commitado, entregue ao usuário fora do Git) com: leitura dos 3 arquivos (`ambiente`, `mascara`, `textura`) via `$_FILES`, prompt restritivo por máscara (validado manualmente pelo usuário em teste fora do código, ver entrada anterior do log), chamada à API do Gemini (`generateContent`, modelo a confirmar — usar o Nano Banana Pro vigente), limite simples de gerações por IP/dia via arquivo local em `sys_get_temp_dir()`.
  - **Confirmar o nome exato do modelo Gemini vigente** (`gemini-3-pro-image-preview` no rascunho é um placeholder — sujeito a mudança de nomenclatura da API do Google) e obter uma `GEMINI_API_KEY` real no Google AI Studio.
  - Nenhum teste end-to-end foi feito ainda (nem estático nem visual) — o `fetch` do `app.js` para `/api/gerar-preview.php` vai falhar até o arquivo real existir no servidor.
  - Depois de funcionar, validar visualmente com uma foto real (idealmente repetindo o mesmo teste de quina já usado antes) e reavaliar se o limite de 5 gerações/dia por IP é adequado.
  - Decisão ainda em aberto: manter a homografia geométrica como prévia instantânea/gratuita ao lado da prévia por IA, ou descontinuá-la.


### 04/09/2026 — Decisão: pivotar para IA generativa (Gemini) e voltar a hospedar tudo na Hostinger
- Contexto: a abordagem geométrica (homografia + blend) resolve fidelidade ao produto do catálogo, mas está travada em validação visual real desde a sessão anterior (esta sessão não tem como rodar Canvas/OpenCV.js). O usuário testou manualmente o mesmo ambiente em duas plataformas de edição de imagem por IA generativa:
  - **GPT (gpt-image)**: resolveu perspectiva de quina e iluminação muito bem, mas **não reproduziu o produto real** — generalizou o "Brick Mescla Prime" (tijolo mesclado cinza/terracota) para um tijolo terracota liso genérico.
  - **Nano Banana 2 (Gemini)**: fidelidade de cor/mescla do produto muito mais próxima do catálogo real, quina também resolvida bem. Porém **alucinou elementos que não existem na foto original** (abajur aceso, fita de LED no rodapé) — risco sério para um visualizador de vendas, onde o cliente precisa ver o próprio ambiente real, não um ambiente reinventado.
- Decisão tomada: adotar geração via IA (Gemini) em vez da homografia geométrica, mas **restringindo a edição a uma máscara** (a área já marcada manualmente pelo usuário na UI existente) para evitar que o modelo altere qualquer coisa fora da parede indicada — ataca diretamente o problema de alucinação observado no teste do Nano Banana 2.
- Decisão de infraestrutura: **manter tudo na Hostinger** (não usar Cloudflare Worker). Descoberto que o projeto `devupsite/bruto` já tem um padrão testado em produção para guardar segredo de API em PHP: `api/chat.php` é uma ponte pública sem segredo nenhum, que faz `require` de um arquivo fora do `public_html` (`bruto-secrets/API/chat.php`, nunca tocado pelo deploy do Git). Esse padrão foi replicado aqui.
- Arquivos alterados nesta sessão:
  - `.github/workflows/deploy.yml` — revertido de GitHub Pages para o pipeline FTP/Hostinger original (idêntico ao commit `22f2781`, anterior à migração `89c76b0`). **Os secrets `FTP_SERVER`/`FTP_USERNAME`/`FTP_PASSWORD` foram apagados na migração anterior e precisam ser recadastrados manualmente em Settings → Secrets and variables → Actions antes do próximo push funcionar.**
  - `api/gerar-preview.php` (novo) — ponte pública no mesmo padrão do Bruto.
- EM ANDAMENTO / itens em aberto para a próxima sessão:
  - **Recriar os secrets de FTP no repositório** (apagados, `total_count: 0` confirmado via API nesta sessão).
  - **Criar `visualizador-secrets/API/gerar-preview.php` diretamente no servidor Hostinger** (fora do `public_html`, via FTP/File Manager) — contém a chave real da API do Gemini e a lógica de chamada. Não deve ser commitado no Git em hipótese nenhuma. Ainda não escrito.
  - Testar se o pipeline FTP volta a publicar corretamente depois de recadastrar os secrets.
  - Implementar no `frontend/app.js`: conversão do contorno marcado (pontos já capturados) em uma máscara PNG via canvas, e um botão "Gerar prévia com IA" que chama `fetch('/api/gerar-preview.php', ...)` com `FormData` (foto do ambiente, máscara, imagem do revestimento escolhido).
  - Prompt a usar na chamada real (validado manualmente pelo usuário via testes fora do código): pedir para respeitar fielmente o padrão/cor do material de referência, aplicar em cada plano de parede com sua própria perspectiva, e não alterar nada fora da máscara (luz, sombra, objetos).
  - Definir limite de gerações por sessão/visitante (custo de ~US$0,039 por imagem gerada, Gemini 2.5/3 Flash Image) para evitar abuso, já que o site é público.
  - Decidir se a homografia geométrica atual é mantida como fallback/prévia instantânea gratuita, ou descontinuada em favor só da geração por IA.


> Toda sessão adiciona uma entrada nova no topo desta lista. Nunca apague entradas antigas.

### 30/08/2026 (continuação 4) — Suporte a quina de parede (2 planos com homografias separadas)
- Contexto: usuário testou a correção do quadrilátero livre (`32d0944`) e reportou dois problemas juntos: (1) o ângulo ainda não está totalmente fiel, e (2) a área marcada corre por duas paredes com ângulos diferentes (visível pela quina/junção entre elas na foto).
- Diagnóstico: os dois problemas reportados são, na prática, o MESMO problema. Uma homografia representa exatamente 1 plano. Quando o contorno marcado atravessa uma quina real do ambiente (2 paredes com ângulos diferentes), calcular UM quadrilátero pra área toda (mesmo que agora seja um trapézio livre, não mais um retângulo) só pode estar certo pra uma das paredes — a outra necessariamente fica com a perspectiva errada, porque está sendo forçada a caber no mesmo plano da primeira. É isso que aparece como "ainda incorreto" na parede que fica depois da quina, na screenshot que o usuário mandou.
- Arquivos alterados: `frontend/app.js`, `frontend/index.html`, `frontend/style.css`
- Commit desta sessão: `de827f8` — feat: suporta quina de parede, aplica textura em 2 planos separados. Novo botão "Marcar quina da parede" arma o próximo clique no canvas pra ser registrado como um dos 2 pontos de transição entre paredes (destacado visualmente em laranja, com a linha da quina tracejada). Quando os 2 pontos existem, `splitAtCorner()` divide o contorno marcado (que já está em ordem de perímetro, por ser clicado nessa ordem) em 2 sub-polígonos — cada um compartilhando os 2 pontos de quina — e cada sub-polígono é processado com sua PRÓPRIA homografia via `renderTextureForPolygon()` (extraído do corpo antigo de `runHomography`, que fazia tudo isso uma vez só). Os dois resultados são compostos um sobre o outro no canvas final.
- Status: **validado só estaticamente** (sintaxe via `node --check`, e a lógica de `splitAtCorner` foi testada isoladamente fora do navegador com um mock simples — confirma que os 2 arcos resultantes compartilham os 2 pontos de quina e cobrem o contorno inteiro sem sobreposição de pontos únicos). **Não testado visualmente** — precisa reabrir a página publicada, fazer uma marcação atravessando uma quina real (como a da screenshot do usuário), marcar os 2 pontos de quina com o novo botão, e confirmar visualmente que agora cada parede recebe uma perspectiva própria e coerente com sua própria convergência de linhas.
- Notas para a próxima sessão: se o teste visual mostrar que a UX de marcar a quina está confusa (ex: visitante não entende que precisa marcar 2 pontos específicos, ou clica no botão na hora errada), vale simplificar — ex: detectar automaticamente um vértice côncavo no contorno como candidato a quina, em vez de depender de marcação manual explícita. Isso não foi feito nesta sessão porque um vértice côncavo pode significar tanto "quina real" quanto "desviei de um móvel" (caso já suportado antes), e não há como diferenciar os dois automaticamente sem mais contexto — por isso a marcação explícita foi a escolha mais segura por ora. Itens em aberto de sessões anteriores continuam os mesmos: calibração visual do `TARGET_TILE_WIDTH_PX` (110) e da opacidade do blend (45%), mais itens no catálogo, e a camada de IA generativa (LoRA).

### 30/08/2026 (continuação 3) — Corrige o cálculo de perspectiva: retângulo rotacionado não representa trapézio
- Contexto: usuário reportou, depois de validar as correções de tiling/blend da continuação 2, que a proporção e o ângulo da textura ainda não são fiéis — "a imagem está reta", mesmo com a marcação livre respeitando o contorno.
- Diagnóstico: `getBestFitQuad` usava `cv.minAreaRect`, que só consegue devolver um retângulo (possivelmente rotacionado) — sempre 4 cantos de 90°, só que girados. Isso é geometricamente incapaz de representar um trapézio (cantos com ângulos diferentes entre si), que é a forma real que uma superfície reta assume numa foto por causa da perspectiva da câmera (aresta mais distante mais estreita, linhas convergindo). Por isso a textura aplicada nunca respeitava a perspectiva de verdade, independente de quanto o retângulo girasse.
- Arquivos alterados: `frontend/app.js`
- Commit desta sessão: `32d0944` — fix: extrai quadrilátero livre (trapézio) em vez de retângulo rotacionado. `getBestFitQuad` agora tira o convex hull dos pontos marcados (pra ignorar reentrâncias de móveis contornados) e pega os 4 cantos mais extremos combinando x+y e y-x (método clássico de ordenação de cantos), formando um quadrilátero livre — pode ser um trapézio de qualquer formato — que a homografia usa para respeitar a perspectiva real da foto. `width`/`height` (usados só pra escala do ladrilhamento) passam a ser a média dos lados opostos, já que não são mais lados de um retângulo perfeito.
- Status: **validado só estaticamente** (sintaxe via `node --check`, leitura da lógica de convex hull/ordenação de cantos) — mesma limitação de sempre: este ambiente não roda Canvas/OpenCV.js de verdade. Precisa do teste visual real: marcar uma parede com perspectiva clara (não de frente) e confirmar que a textura agora acompanha a convergência das linhas em vez de ficar "reta".
- Notas para a próxima sessão: se o teste visual mostrar que os 4 cantos escolhidos pelo hull não são os cantos certos em algum caso (ex: contorno muito irregular com muitos pontos ao longo de uma reentrância grande), considerar usar `cv.approxPolyDP` no hull antes de extrair os extremos, para simplificar o contorno a algo mais próximo de um quadrilátero antes da ordenação. Depois de validado, os itens em aberto continuam os mesmos das entradas anteriores: calibração visual do `TARGET_TILE_WIDTH_PX` (110) e da opacidade do blend (45%), mais itens no catálogo e a camada de IA generativa (LoRA).

### 30/08/2026 (continuação 2) — Corrige o cálculo de tiling, que era um no-op na prática
- Contexto: usuário testou o deploy da sessão anterior (commits `12842cc`/`24ed077`) e reportou "ficou exatamente igual" — nenhuma mudança visível, nem no tamanho da textura nem (aparentemente, ofuscado pelo problema maior) no blend.
- Diagnóstico: `12842cc` calculava `repeatX = round(quadWidth / texImg.width)`. A foto do catálogo (`brick-mescla-prime.jpg`) tem 800×753px — verificado diretamente baixando o arquivo. O canvas onde a foto do visitante é desenhada tem no máximo 900px de largura (`maxWidth` em `drawImageToCanvas`). Como os dois números são da mesma ordem de grandeza, o `round()` quase sempre dava 1 — ou seja, o ladrilhamento "novo" continuava sendo, na prática, o comportamento antigo (1 imagem esticada). A resolução em pixels de uma foto de catálogo não tem nenhuma relação com o tamanho físico real do que ela retrata, então usar ela como referência de escala não fazia sentido — foi um erro de raciocínio da sessão anterior, não percebido antes porque não havia como testar visualmente por aqui.
- Commit desta sessão: `b8ae2bb` — fix: corrige cálculo de repeat do tiling. Substitui a referência de escala por um tamanho de módulo ALVO em pixels do canvas (`TARGET_TILE_WIDTH_PX = 110`, constante arbitrária no topo de `runHomography`), mantendo a proporção original da textura via `texImg.height / texImg.width`.
- Status: **de novo, só validado estaticamente** — precisa do mesmo teste visual real. Dessa vez o efeito deve ser visivelmente diferente (não vai mais ser "exatamente igual"), mas o valor `110` é um chute calibrado só pela lógica, sem ver o resultado.
- Notas para a próxima sessão: se `110` deixar o padrão repetitivo demais (módulos pequenos e óbvios) ou ainda grande demais, é só ajustar essa constante — está isolada e comentada no topo de `runHomography`, fácil de encontrar. Se depois de ajustar isso o blend de luz/sombra (45% de opacidade, `24ed077`) ainda não tiver sido avaliado de verdade (ficou ofuscado pelo problema do tiling neste teste), vale reavaliar ele também.

### 30/08/2026 (continuação) — Corrige desproporção da textura (tiling) e reduz intensidade do blend, a partir de teste visual real
- Contexto: a sessão anterior (mesmo dia, entrada abaixo) deixou duas mudanças "validadas só estaticamente" e pediu teste visual real antes de considerar prontas. O usuário testou e reportou dois problemas — este é o resultado da correção deles.
- Arquivos alterados: `frontend/app.js`
- Commits desta sessão:
  - `12842cc` — fix: ladrilha a textura em vez de esticar uma unidade sobre a área toda. Era o bug mais grave: a imagem do catálogo (retrato de UM módulo do revestimento) estava sendo esticada via homografia pra cobrir a área marcada inteira, gerando um padrão gigante e desproporcional, sem repetição nenhuma — exatamente o "sem dimensionamento" reportado. `getBestFitQuad` agora também retorna as dimensões do retângulo (`rect.size`), usadas pra calcular `repeatX`/`repeatY` e montar um mosaico da textura (`buildTiledTextureCanvas`) na escala nativa da imagem do catálogo, ANTES da homografia.
  - `24ed077` — fix: reduz intensidade do blend de luz/sombra de 100% pra 45% de opacidade. O usuário reportou um retângulo "fantasma"/lavado sobre a textura aplicada; era o soft-light do commit anterior (`1b76aaa`) vazando luminância alta de quadros na parede original, quase apagando a textura ali. Risco que já tinha sido sinalizado na entrada de log anterior, agora confirmado em teste real.
- Status: **as duas correções acima são só validadas estaticamente de novo** (sintaxe + leitura da lógica) — precisam do mesmo teste visual real antes de dar como resolvido. Em especial: (1) confirmar que o ladrilhamento resolve a desproporção sem introduzir um padrão repetitivo óbvio/artificial demais (pode precisar de variação entre tiles no futuro, ex: leve rotação/espelhamento alternado, se ficar repetitivo demais visualmente); (2) confirmar se 45% de opacidade no blend é o valor certo, ou se precisa subir/descer — foi um valor arbitrário, não calculado a partir de nada.
- Notas para a próxima sessão: se o teste visual mostrar que o ladrilhamento ainda está com escala errada (módulos grandes/pequenos demais), o cálculo de `repeatX`/`repeatY` em `runHomography` (usa `quadWidth / texImg.width`) é o lugar certo pra ajustar — hoje assume que a resolução nativa da imagem do catálogo já é uma escala razoável, o que é só uma aproximação sem medida real da parede.

### 30/08/2026 — Corrige recorte por polígono livre + blend de luz/sombra (e recupera log de 4 commits não registrados)
- **Catch-up de log:** entre a entrada anterior (29/08) e esta sessão, uma outra sessão fez 4 commits que não ficaram registrados aqui: `ea56819` (upload de foto), `0445a76` (marcação dos 4 cantos), `c07c8c2` (aplica textura via homografia, sem blend), `00c1ce7` (marcação vira polígono livre de N pontos). Ver mensagens de commit no histórico do git para detalhe de cada um.
- Arquivos alterados nesta sessão: `frontend/app.js`
- Commits desta sessão:
  - `123def4` — fix: recorte da textura pelo polígono real marcado. O `00c1ce7` introduziu marcação de polígono livre, mas o recorte (`source-in` aplicado direto no canvas principal, já opaco) ignorava o polígono e só respeitava o bounding rect (`minAreaRect`) da textura — a marcação livre não tinha efeito visual nenhum. Corrigido fazendo o `destination-in` num canvas transparente separado antes de compor sobre a foto.
  - `1b76aaa` — feat: blend de luz/sombra (soft-light com a luminância da foto original), próximo passo que já estava planejado.
- Status: **concluído o que foi implementado, mas validado só estaticamente** (sintaxe via `node --check`, leitura cuidadosa da lógica de compositing/alpha). **Não testado em navegador real** — este ambiente não tem forma de rodar Canvas/OpenCV.js de verdade. Antes de considerar essas duas mudanças prontas para produção, alguém precisa abrir a página publicada, marcar um polígono não-retangular de propósito (ex: contornando um móvel) e confirmar visualmente que (a) a textura realmente respeita o contorno e não vaza pro bounding rect, e (b) o blend de luz/sombra está com intensidade razoável (o soft-light pode estar forte/fraco demais dependendo da foto — não há como calibrar isso sem ver o resultado real).
- Notas para a próxima sessão: se o blend soft-light se mostrar forte/fraco demais no teste visual, considerar deixar a intensidade ajustável (ex: compor `shadedCanvas` com opacidade parcial sobre `warpedCanvas` em vez de soft-light puro a 100%). Depois da validação visual, os próximos passos continuam sendo os do plano original: mais itens reais no catálogo (hoje só tem 1, `brick-mescla-prime`), e a camada de IA generativa (LoRA via Colab + Hugging Face Spaces) — essa última ainda não tem `/training/` nem `/dataset/` criados.

### 29/08/2026 — Estrutura inicial do repositório e pipeline de deploy
- Arquivos alterados: `colaboracao.md`, `README.md`, `frontend/index.html` (placeholder), `.github/workflows/deploy.yml`, `push-com-token.md`
- Status: concluído (base do repositório e deploy funcionando)
- Notas para a próxima sessão: deploy está publicando via GitHub Pages em `https://devupsite.github.io/visualizador-revestimentos/`. O MVP funcional (upload de foto + marcação de 4 pontos + homografia + blend de luz, tudo client-side, sem IA paga) ainda não foi iniciado — é o próximo passo. Ver a conversa que originou este projeto para o racional técnico completo (segmentação manual por 4 pontos no lugar de SAM2, OpenCV.js para homografia, Canvas/WebGL para blend, LoRA via Colab + Hugging Face Spaces para a camada generativa futura).

### [Adicionar aqui: data] — [Adicionar aqui: resumo da sessão]
- Arquivos alterados:
- Status: (concluído / EM ANDAMENTO — o que falta)
- Notas para a próxima sessão:
