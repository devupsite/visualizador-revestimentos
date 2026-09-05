<?php
/* ════════════════════════════════════════════════════════════════
   Ponte pública — NÃO contém segredo nenhum.
   O arquivo de verdade (com a chave da API do Gemini e a lógica de
   geração) mora fora do public_html, em visualizador-secrets/,
   protegido do deploy automático do Git — mesmo padrão usado em
   devupsite/bruto (api/chat.php).
   Este arquivo pode ir pro GitHub sem problema.
════════════════════════════════════════════════════════════════ */
require dirname($_SERVER['DOCUMENT_ROOT']) . '/visualizador-secrets/API/gerar-preview.php';
