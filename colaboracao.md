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

> Toda sessão adiciona uma entrada nova no topo desta lista. Nunca apague entradas antigas.

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
