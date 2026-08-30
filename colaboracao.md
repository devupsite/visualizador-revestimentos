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

## Deploy para a Hostinger

- O deploy para produção (Hostinger) **só acontece a partir da branch `main`**, nunca de uma branch experimental.
- Antes de disparar o deploy, confirme que a build local funciona (teste manual do fluxo: upload de foto → marcação dos 4 pontos → aplicação da textura → resultado final).
- Documente aqui, na primeira vez que o pipeline de deploy for configurado, exatamente como ele funciona (GitHub Actions? FTP manual? webhook?), para que sessões futuras não precisem redescobrir isso.

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

### [Adicionar aqui: data] — [Adicionar aqui: resumo da sessão]
- Arquivos alterados:
- Status: (concluído / EM ANDAMENTO — o que falta)
- Notas para a próxima sessão:
