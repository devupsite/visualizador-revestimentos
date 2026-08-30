# Visualizador de Revestimentos

Ferramenta para visitantes do site aplicarem revestimentos do catálogo em fotos do próprio ambiente, com IA.

Antes de mexer no código, leia [`colaboracao.md`](./colaboracao.md) — regras para múltiplas sessões trabalharem aqui sem conflito.

## Estrutura

```
/frontend/     → código do site (HTML/JS/CSS), é o que vai pro ar na Hostinger
/training/     → (a criar) notebooks do Colab, scripts de treino da LoRA
/dataset/      → (a criar) README apontando onde estão as fotos de treino (não as fotos em si)
.github/workflows/deploy.yml → pipeline de deploy automático
colaboracao.md → guia de colaboração entre sessões
```

## Deploy

**Método atual: GitHub Pages.** Todo push na branch `main` dispara o workflow `.github/workflows/deploy.yml`, que publica o conteúdo de `/frontend/` diretamente no GitHub Pages — sem precisar de FTP nem secrets.

**Configuração necessária (uma vez só, direto na interface do GitHub):**

Em Settings → Pages → Build and deployment → Source, selecionar **"GitHub Actions"** (não "Deploy from a branch").

Depois disso, cada push na `main` gera uma URL pública automaticamente (algo como `https://devupsite.github.io/visualizador-revestimentos/`).

> Quando for hora de apontar um domínio próprio ou migrar para a Hostinger via FTP, existe um workflow alternativo já testado anteriormente (ver histórico do repositório) — é só trocar o `deploy.yml` de volta e cadastrar as secrets de FTP.

## Status atual

MVP geométrico (marcação de 4 pontos + homografia + blend de luz, sem IA generativa) — ainda não iniciado. Ver `colaboracao.md` para o log de sessões.
