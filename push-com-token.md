# Como fazer push neste repositório (token temporário)

Este projeto não usa uma chave SSH fixa nem um token permanente salvo em lugar nenhum. O dono do projeto gera um **token do GitHub por sessão de trabalho** e revoga assim que termina. Toda sessão que precisar commitar segue este processo.

## Passo a passo

1. **Peça o token ao usuário quando for a hora de fazer commit/push.** Não assuma que um token de uma conversa anterior ainda é válido — ele é revogado ao final de cada rodada de atualizações.

2. **Escopo necessário:** o token precisa ter os escopos `repo` e `workflow`. Se o push falhar com erro tipo `refusing to allow a Personal Access Token to create or update workflow`, é porque o token foi gerado sem o escopo `workflow` — peça para o usuário gerar de novo já marcando essa opção.

3. **Configurar o remoto com o token** (rodar no ambiente onde o git será executado):
   ```bash
   git remote add origin https://SEU_TOKEN_AQUI@github.com/devupsite/visualizador-revestimentos.git
   ```
   Se o remoto já existir de uma sessão anterior, atualize a URL em vez de adicionar:
   ```bash
   git remote set-url origin https://SEU_TOKEN_AQUI@github.com/devupsite/visualizador-revestimentos.git
   ```

4. **Sempre sincronizar antes de editar.** Busque o estado atual do repositório antes de mexer em qualquer arquivo — outra sessão pode ter commitado algo depois da sua última leitura:
   ```bash
   git fetch origin main
   git reset --mixed origin/main
   ```

5. **Fazer as alterações, adicionar e commitar** com mensagem descritiva:
   ```bash
   git add <arquivos alterados>
   git commit -m "tipo: descrição clara do que mudou"
   ```

6. **Push:**
   ```bash
   git push origin main
   ```

7. **Avisar o usuário que pode revogar o token** assim que o push for confirmado com sucesso. Nunca pedir para reutilizar o mesmo token em uma sessão futura — sempre pedir um novo.

## Cuidados

- **Nunca escreva o valor do token em nenhum arquivo do repositório**, em comentário de código, em mensagem de commit, ou em qualquer lugar que fique salvo permanentemente. Ele deve existir só na configuração temporária do remoto git durante a sessão ativa.
- Se o push for rejeitado por falta de escopo (`workflow`, por exemplo), não tente contornar isso removendo o `.github/workflows/` do commit sem avisar — explique o problema ao usuário e peça um token com o escopo certo.
- Depois do push, confirme visualmente (ex: acessando a URL do repositório ou do GitHub Actions) que o commit e o deploy aconteceram como esperado, antes de encerrar a tarefa.

## Permissão para reutilizar o token sem perguntar a cada push

Por padrão, cada push deveria ser precedido de pedir o token ao usuário. **Porém, se o usuário disser explicitamente que a sessão pode reutilizar o token já fornecido durante o resto daquele dia/sessão de trabalho sem pedir de novo a cada commit**, isso vale — não precisa confirmar antes de cada push individual enquanto essa permissão estiver em vigor. Isso não é uma regra permanente do projeto: vale apenas para a sessão em que foi concedida, com o token daquele dia. Uma nova sessão (ou o mesmo token expirado/revogado) volta ao processo normal de pedir o token antes de commitar.
