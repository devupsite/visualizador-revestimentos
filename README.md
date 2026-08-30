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

Todo push na branch `main` dispara o workflow `.github/workflows/deploy.yml`, que envia o conteúdo de `/frontend/` para a Hostinger via FTP.

**Configuração necessária (uma vez só, feita direto no GitHub, nunca compartilhada em chat):**

Em Settings → Secrets and variables → Actions, cadastrar:
- `FTP_SERVER` — endereço do servidor FTP da Hostinger
- `FTP_USERNAME` — usuário FTP
- `FTP_PASSWORD` — senha FTP

O caminho remoto (`server-dir`) está configurado como `/visualizador/` no workflow — ajustar se a estrutura real do servidor for diferente.

## Status atual

MVP geométrico (marcação de 4 pontos + homografia + blend de luz, sem IA generativa) — ainda não iniciado. Ver `colaboracao.md` para o log de sessões.
