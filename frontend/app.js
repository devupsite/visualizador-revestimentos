// Visualizador de Revestimentos — lógica do frontend
// Etapa atual: upload da foto e exibição no canvas.
// Próxima etapa (commit separado): marcação dos 4 pontos.

const uploadBox = document.getElementById('upload-box');
const photoInput = document.getElementById('photo-input');
const uploadSection = document.getElementById('upload-section');
const canvasSection = document.getElementById('canvas-section');
const canvas = document.getElementById('photo-canvas');
const ctx = canvas.getContext('2d');
const newPhotoBtn = document.getElementById('new-photo-btn');

let currentImage = null;

function loadImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      drawImageToCanvas(img);
      uploadSection.classList.add('hidden');
      canvasSection.classList.remove('hidden');
      points = [];
      updateInstructions();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function drawImageToCanvas(img) {
  // Limita a largura para manter performance e consistência de coordenadas,
  // mantendo a proporção original da foto.
  const maxWidth = 900;
  const scale = Math.min(1, maxWidth / img.width);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

// --- Upload via clique ---
uploadBox.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  loadImageFile(file);
});

// --- Upload via arrastar e soltar ---
uploadBox.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadBox.classList.add('dragover');
});
uploadBox.addEventListener('dragleave', () => {
  uploadBox.classList.remove('dragover');
});
uploadBox.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadBox.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  loadImageFile(file);
});

// --- Trocar foto ---
newPhotoBtn.addEventListener('click', () => {
  currentImage = null;
  photoInput.value = '';
  canvasSection.classList.add('hidden');
  uploadSection.classList.remove('hidden');
  resetPoints();
});

// --- Marcação da área a revestir (polígono livre, N >= 4 pontos) ---
// Antes travava em exatamente 4 pontos (quadrilátero simples), o que falha
// quando a área visível não é um quadrilátero perfeito na foto (ex: um canto
// de parede no meio, um móvel cortando a área, etc). Agora o visitante marca
// quantos pontos forem necessários para contornar a forma exata; o cálculo de
// perspectiva (homografia) é feito separadamente, a partir do quadrilátero
// real (os 4 cantos extremos do contorno) desses pontos — ver getBestFitQuad().
const resetPointsBtn = document.getElementById('reset-points-btn');
const finishPointsBtn = document.getElementById('finish-points-btn');
const markCornerBtn = document.getElementById('mark-corner-btn');
const instructions = document.getElementById('instructions');

const MIN_POINTS = 4;

let points = []; // [{x, y}, ...] em coordenadas do canvas
let isFinalized = false;

// Até 2 dos pontos marcados acima podem ser identificados como "quina": o
// ponto onde a parede muda de ângulo/plano (o canto interno de um ambiente,
// por exemplo). Uma única homografia só consegue representar UM plano; se a
// área marcada cobre duas paredes com ângulos diferentes, aplicar uma textura
// só via um quadrilátero produz uma perspectiva errada na parede que não foi
// a base do cálculo (ver splitAtCorner() e runHomography()). armCornerMode
// arma o próximo clique no canvas para ser registrado como quina, em vez de
// um ponto comum do contorno.
let cornerIndices = [];
let armCornerMode = false;

function resetPoints() {
  points = [];
  isFinalized = false;
  cornerIndices = [];
  armCornerMode = false;
  if (currentImage) {
    drawImageToCanvas(currentImage);
  }
  updateInstructions();
}

function getCanvasCoords(evt) {
  const rect = canvas.getBoundingClientRect();
  // Corrige a diferença entre o tamanho real do canvas e o tamanho exibido em tela
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function drawPoints() {
  if (!currentImage) return;
  drawImageToCanvas(currentImage);

  points.forEach((p, i) => {
    const isCorner = cornerIndices.includes(i);
    ctx.fillStyle = isCorner ? '#E8A33D' : '#57999B';
    ctx.beginPath();
    ctx.arc(p.x, p.y, isCorner ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Conecta os pontos já marcados, e fecha o polígono quando a marcação for finalizada
  ctx.strokeStyle = '#57999B';
  ctx.lineWidth = 2;
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    if (isFinalized) {
      ctx.closePath();
    }
    ctx.stroke();
  }

  // Destaca a linha da quina (entre os 2 pontos marcados como tal), se houver,
  // pra deixar visualmente claro onde a área será dividida em 2 planos.
  if (cornerIndices.length === 2) {
    const [a, b] = cornerIndices;
    ctx.strokeStyle = '#E8A33D';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(points[a].x, points[a].y);
    ctx.lineTo(points[b].x, points[b].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function handleCanvasPoint(evt) {
  if (!currentImage || isFinalized) return;
  evt.preventDefault();
  const coords = getCanvasCoords(evt);
  points.push(coords);
  if (armCornerMode) {
    if (cornerIndices.length >= 2) {
      // Já havia 2 quinas marcadas (não deveria chegar aqui, o botão some
      // nesse caso) — substitui a mais antiga em vez de acumular indefinidamente.
      cornerIndices.shift();
    }
    cornerIndices.push(points.length - 1);
    armCornerMode = false;
  }
  drawPoints();
  updateInstructions();
}

canvas.addEventListener('click', handleCanvasPoint);
canvas.addEventListener('touchstart', handleCanvasPoint);

resetPointsBtn.addEventListener('click', resetPoints);
markCornerBtn.addEventListener('click', () => {
  if (isFinalized || cornerIndices.length >= 2) return;
  armCornerMode = true;
  updateInstructions();
});
finishPointsBtn.addEventListener('click', () => {
  if (points.length < MIN_POINTS) {
    instructions.textContent = `Marque pelo menos ${MIN_POINTS} pontos antes de concluir (${points.length}/${MIN_POINTS}).`;
    return;
  }
  isFinalized = true;
  drawPoints();
  updateInstructions();
});

// --- Aplicação da textura via homografia (OpenCV.js) ---
// Etapa atual: mapeia a textura escolhida para o quadrilátero marcado,
// respeitando a perspectiva. Ainda SEM blend de luz/sombra (próximo commit) —
// por enquanto a textura fica "colada" por cima, sem herdar iluminação da foto original.

const catalogSection = document.getElementById('catalog-section');
let selectedTextureSrc = null;

function updateInstructions() {
  if (!isFinalized) {
    if (armCornerMode) {
      instructions.textContent = 'Clique no ponto exato onde a parede muda de ângulo (a quina). Esse ponto vira parte do contorno normalmente.';
    } else if (points.length === 0) {
      instructions.textContent = 'Clique nos cantos da área que você quer revestir, contornando o formato exato. Perto de móveis ou objetos, use pontos mais próximos entre si para um recorte mais preciso. Quando terminar, clique em "Concluir marcação".';
    } else {
      instructions.textContent = `${points.length} ponto(s) marcado(s). Continue contornando a área ou clique em "Concluir marcação" (mínimo ${MIN_POINTS}). Se a área cobre uma quina (parede que muda de ângulo), use "Marcar quina da parede" antes de clicar no ponto da quina.`;
    }
    catalogSection.classList.add('hidden');
    markCornerBtn.classList.toggle('hidden', cornerIndices.length >= 2);
    markCornerBtn.classList.toggle('active', armCornerMode);
  } else {
    instructions.textContent = 'Marcação concluída! Escolha um revestimento do catálogo abaixo.';
    catalogSection.classList.remove('hidden');
    markCornerBtn.classList.add('hidden');
  }
}

document.querySelectorAll('.catalog-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.catalog-item').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTextureSrc = btn.dataset.texture;
    applyTexture(selectedTextureSrc);
  });
});

function waitForOpenCV(callback) {
  if (window.cv && window.cv.Mat) {
    callback();
  } else {
    setTimeout(() => waitForOpenCV(callback), 100);
  }
}

function applyTexture(textureSrc) {
  if (!isFinalized || !currentImage) return;

  const texImg = new Image();
  texImg.crossOrigin = 'anonymous';
  texImg.onload = () => {
    waitForOpenCV(() => runHomography(texImg));
  };
  texImg.src = textureSrc;
}

function getBestFitQuad(pts) {
  // Extrai o quadrilátero REAL do contorno marcado, não um retângulo ajustado.
  //
  // Versão anterior usava cv.minAreaRect, que só consegue devolver um
  // retângulo rotacionado — ou seja, sempre 4 cantos de 90°, só que girados.
  // Isso é geometricamente incapaz de representar um trapézio (cantos com
  // ângulos diferentes entre si), que é exatamente a forma que uma superfície
  // retangular real assume numa foto por causa da perspectiva da câmera (a
  // aresta mais distante fica mais estreita, as linhas convergem). Por isso a
  // textura sempre ficava "reta" — não importa o quanto o retângulo gire, ele
  // nunca deixa de ser um retângulo.
  //
  // Correção: em vez de ajustar uma forma aos pontos, pegamos os 4 cantos
  // extremos reais do contorno marcado. Isso forma um quadrilátero livre (pode
  // ser um trapézio de qualquer formato), que é o que a homografia precisa
  // para respeitar a perspectiva real da foto.
  //
  // 1) Convex hull dos pontos marcados: se o visitante contornou uma
  //    reentrância (ex: desviando de um móvel), o hull ignora essas
  //    concavidades e mantém só o contorno externo — de onde vêm os 4 cantos
  //    reais da área.
  // 2) Dentre os pontos do hull, pega os 4 mais extremos combinando x+y e
  //    x-y (método clássico de ordenação de cantos): o de cima-esquerda tem a
  //    menor soma (x+y), o de baixo-direita tem a maior soma; o de
  //    cima-direita tem a menor diferença (y-x), o de baixo-esquerda tem a
  //    maior diferença. Funciona com qualquer N de pontos porque os 4 cantos
  //    reais da área são sempre os pontos mais extremos do hull.
  const flatPoints = [];
  pts.forEach((p) => flatPoints.push(Math.round(p.x), Math.round(p.y)));

  const pointsMat = cv.matFromArray(pts.length, 1, cv.CV_32SC2, flatPoints);
  const hullIdx = new cv.Mat();
  cv.convexHull(pointsMat, hullIdx, false, false); // returnPoints=false -> índices
  pointsMat.delete();

  const hullPoints = [];
  for (let i = 0; i < hullIdx.rows; i++) {
    hullPoints.push(pts[hullIdx.data32S[i]]);
  }
  hullIdx.delete();

  let tl = hullPoints[0];
  let tr = hullPoints[0];
  let br = hullPoints[0];
  let bl = hullPoints[0];
  let minSum = Infinity;
  let maxSum = -Infinity;
  let minDiff = Infinity;
  let maxDiff = -Infinity;

  hullPoints.forEach((p) => {
    const sum = p.x + p.y;
    const diff = p.y - p.x;
    if (sum < minSum) { minSum = sum; tl = p; }
    if (sum > maxSum) { maxSum = sum; br = p; }
    if (diff < minDiff) { minDiff = diff; tr = p; }
    if (diff > maxDiff) { maxDiff = diff; bl = p; }
  });

  const corners = [tl, tr, br, bl];

  // "width"/"height" deixam de ser lados de um retângulo perfeito (o
  // quadrilátero agora pode ser um trapézio) — viram uma média entre os lados
  // opostos, usada só como referência de escala para o ladrilhamento da
  // textura (ver buildTiledTextureCanvas), não como medida geométrica exata.
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const width = (dist(tl, tr) + dist(bl, br)) / 2;
  const height = (dist(tl, bl) + dist(tr, br)) / 2;

  return { corners, width, height };
}

function buildTiledTextureCanvas(texImg, repeatX, repeatY) {
  // Uma textura de catálogo (ex: brick-mescla-prime.jpg) é o retrato de UMA
  // unidade/módulo do revestimento, não da parede inteira. Esticar essa
  // imagem única para preencher toda a área marcada faz cada tijolo/peça
  // aparecer do tamanho da parede — desproporcional e sem repetição alguma
  // (era exatamente o problema reportado: textura "reta", sem dimensionamento).
  // Aqui repetimos a textura lado a lado repeatX × repeatY vezes ANTES da
  // homografia, preservando a escala/proporção nativa da imagem do catálogo;
  // o warpPerspective depois mapeia esse mosaico inteiro (não mais uma imagem
  // só) para a área marcada.
  //
  // Duas melhorias em cima do tiling "cru" (grade perfeita, todo módulo
  // idêntico), que testado visualmente ficou com cara de papel de parede
  // digital em vez de revestimento real assentado:
  // 1. Running bond: linhas alternadas deslocadas em meio módulo, como
  //    tijolo/brick real é assentado (nunca é uma grade quadriculada perfeita).
  // 2. Variação pseudo-aleatória (mas determinística, sem Math.random — o
  //    mesmo ladrilhamento deve sair igual se o usuário reaplicar a mesma
  //    textura): alguns módulos são espelhados horizontalmente, quebrando a
  //    repetição óbvia do mesmo padrão de veios/manchas em cada peça.
  const tileW = texImg.width;
  const tileH = texImg.height;
  const halfW = tileW / 2;

  const tiled = document.createElement('canvas');
  tiled.width = tileW * repeatX;
  tiled.height = tileH * repeatY;
  const tiledCtx = tiled.getContext('2d');

  for (let row = 0; row < repeatY; row++) {
    // Linhas ímpares deslocam meio módulo pra esquerda — o canvas não muda de
    // tamanho, então desenhamos 1 coluna extra de cada lado (-1 e repeatX);
    // o que cair fora dos limites do canvas é automaticamente cortado pelo
    // próprio <canvas>, sem precisar checar limites manualmente.
    const rowOffset = row % 2 === 1 ? -halfW : 0;

    for (let col = -1; col <= repeatX; col++) {
      const x = col * tileW + rowOffset;
      const y = row * tileH;
      // Padrão determinístico de espelhamento — não é aleatório de verdade,
      // é só uma combinação de row/col que "parece" espalhada o suficiente
      // pra quebrar a repetição visual sem precisar de estado/seed.
      const shouldMirror = (row * 7 + col * 13) % 5 === 0;

      tiledCtx.save();
      if (shouldMirror) {
        tiledCtx.translate(x + tileW, y);
        tiledCtx.scale(-1, 1);
        tiledCtx.drawImage(texImg, 0, 0);
      } else {
        tiledCtx.drawImage(texImg, x, y);
      }
      tiledCtx.restore();
    }
  }
  return tiled;
}

function buildLuminanceCanvas(image, width, height) {
  // Extrai só a luminância (preto e branco) da foto original, no mesmo
  // enquadramento do canvas principal. Isso vira a "camada de luz" que dá
  // forma às sombras/reflexos reais do ambiente por cima da textura nova.
  const grayCanvas = document.createElement('canvas');
  grayCanvas.width = width;
  grayCanvas.height = height;
  const grayCtx = grayCanvas.getContext('2d');
  grayCtx.filter = 'grayscale(1)';
  grayCtx.drawImage(image, 0, 0, width, height);
  return grayCanvas;
}

function splitAtCorner(pts, corners) {
  // Divide o contorno marcado em 2 sub-polígonos usando os 2 pontos marcados
  // como quina (corners = índices em pts). Cada sub-polígono representa uma
  // parede/plano diferente e será processado com sua própria homografia —
  // ver o porquê disso em runHomography().
  //
  // pts está em ordem de contorno (o visitante clicou nos pontos seguindo o
  // perímetro da área). Os 2 pontos de quina dividem esse perímetro em 2
  // arcos; cada arco + os 2 pontos de quina (que ambos os arcos compartilham,
  // por serem os pontos de transição) formam o contorno fechado de uma parede.
  const [a, b] = [...corners].sort((x, y) => x - y);
  const arc1 = pts.slice(a, b + 1); // de a até b, incluindo os dois
  const arc2 = pts.slice(b).concat(pts.slice(0, a + 1)); // de b até o fim + do início até a
  return [arc1, arc2];
}

function renderTextureForPolygon(poly, texImg) {
  // Aplica a textura (ladrilhada + com perspectiva + blend de luz/sombra) a
  // UM polígono/plano específico, e devolve um canvas transparente fora dele
  // — pronto pra ser composto sobre o resultado acumulado em runHomography().
  // Isso é o que antes era o corpo inteiro de runHomography(), extraído pra
  // poder ser chamado 1x (parede única) ou 2x (parede com quina) sem duplicar
  // a lógica de homografia/tiling/blend/recorte.
  const { corners: quad, width: quadWidth, height: quadHeight } = getBestFitQuad(poly);

  // Repete a textura o suficiente para simular um padrão real de revestimento,
  // em vez de esticar 1 módulo pra cobrir a área toda.
  //
  // IMPORTANTE: a escala NÃO pode vir da resolução em pixels da foto do
  // catálogo (texImg.width/height) — isso foi tentado numa versão anterior e
  // não funcionou. A foto do catálogo tem ~800px de largura, e o canvas onde
  // a foto do visitante é desenhada tem no máximo 900px (ver `maxWidth` em
  // drawImageToCanvas) — como os dois números são da mesma ordem de
  // grandeza, `quadWidth / texImg.width` quase sempre arredondava pra 1,
  // ou seja: nenhum ladrilhamento de verdade acontecia. A resolução de uma
  // foto de catálogo não tem NENHUMA relação com o tamanho físico real do
  // que ela retrata (pode ter sido fotografada de perto ou de longe).
  //
  // Em vez disso, usamos um tamanho de módulo ALVO em pixels do canvas —
  // arbitrário, calibrado visualmente pra parecer um padrão de revestimento
  // razoável numa foto de ambiente doméstico (não fisicamente exato, porque
  // não temos nenhuma medida real da parede/superfície marcada).
  const TARGET_TILE_WIDTH_PX = 110;
  const targetTileHeightPx = TARGET_TILE_WIDTH_PX * (texImg.height / texImg.width);
  const repeatX = Math.max(1, Math.round(quadWidth / TARGET_TILE_WIDTH_PX));
  const repeatY = Math.max(1, Math.round(quadHeight / targetTileHeightPx));
  const tiledTexCanvas = buildTiledTextureCanvas(texImg, repeatX, repeatY);

  const srcCorners = [
    0, 0,
    tiledTexCanvas.width, 0,
    tiledTexCanvas.width, tiledTexCanvas.height,
    0, tiledTexCanvas.height,
  ];
  const dstCorners = [];
  quad.forEach((p) => dstCorners.push(p.x, p.y));

  const srcMat = cv.imread(tiledTexCanvas);
  const dstMat = new cv.Mat();
  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, srcCorners);
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, dstCorners);
  const homography = cv.findHomography(srcTri, dstTri);

  const warpedSize = new cv.Size(canvas.width, canvas.height);
  cv.warpPerspective(srcMat, dstMat, homography, warpedSize, cv.INTER_LINEAR, cv.BORDER_TRANSPARENT);

  // Máscara: só desenha o resultado dentro do polígono marcado (deste plano),
  // preservando o resto da foto original intacto.
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext('2d');
  maskCtx.fillStyle = '#fff';
  maskCtx.beginPath();
  maskCtx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) maskCtx.lineTo(poly[i].x, poly[i].y);
  maskCtx.closePath();
  maskCtx.fill();

  const warpedCanvas = document.createElement('canvas');
  warpedCanvas.width = canvas.width;
  warpedCanvas.height = canvas.height;
  cv.imshow(warpedCanvas, dstMat);

  // Blend de luz/sombra: aplica a luminância da foto original por cima da
  // textura warpada, via soft-light, para herdar sombras/reflexos reais do
  // ambiente (em vez da textura ficar "colada" com iluminação plana).
  // Isso acontece ANTES do recorte pelo polígono — como o blend pode extrapolar
  // a área do quadrilátero (mesmo problema de alpha do recorte, ver abaixo),
  // o destination-in com o polígono real, feito depois, corta qualquer sobra.
  const shadedCanvas = document.createElement('canvas');
  shadedCanvas.width = canvas.width;
  shadedCanvas.height = canvas.height;
  const shadedCtx = shadedCanvas.getContext('2d');
  shadedCtx.drawImage(warpedCanvas, 0, 0);
  shadedCtx.globalCompositeOperation = 'soft-light';
  // Blend a 100% lava a textura quase até sumir em áreas muito claras da foto
  // original (ex: quadros na parede, como visto em teste real) — reduzido pra
  // dar a sensação de sombra/luz reais sem apagar o padrão da textura.
  shadedCtx.globalAlpha = 0.45;
  shadedCtx.drawImage(buildLuminanceCanvas(currentImage, canvas.width, canvas.height), 0, 0);
  // Segunda passada, em 'multiply': o soft-light sozinho ficou "flat" em teste
  // visual real (textura parecia com brilho/saturação deslocados do resto da
  // foto, principalmente em cantos e sombras mais fortes). Multiply só
  // escurece (nunca clareia), então reforça sombra de canto/objeto sem lavar
  // a textura em áreas claras como o soft-light isolado fazia.
  shadedCtx.globalCompositeOperation = 'multiply';
  shadedCtx.globalAlpha = 0.2;
  shadedCtx.drawImage(buildLuminanceCanvas(currentImage, canvas.width, canvas.height), 0, 0);
  // globalAlpha/globalCompositeOperation persistem no canvas — reseta os dois
  // antes de qualquer outro draw nesse contexto.
  shadedCtx.globalAlpha = 1;
  shadedCtx.globalCompositeOperation = 'source-over';

  // Recorta o resultado (já com o blend) pelo polígono EXATO deste plano, não
  // pelo bounding rect da textura. Isso precisa acontecer num canvas próprio,
  // transparente por padrão — se fizermos o destination-in direto no canvas
  // principal (que já está opaco com a foto), o recorte não tem efeito
  // nenhum, porque "onde a origem sobrepõe o destino" passa a ser o
  // bounding rect inteiro da textura, não o contorno do polígono.
  const clippedCanvas = document.createElement('canvas');
  clippedCanvas.width = canvas.width;
  clippedCanvas.height = canvas.height;
  const clippedCtx = clippedCanvas.getContext('2d');
  clippedCtx.drawImage(shadedCanvas, 0, 0);
  clippedCtx.globalCompositeOperation = 'destination-in';
  clippedCtx.drawImage(maskCanvas, 0, 0);

  srcMat.delete();
  dstMat.delete();
  srcTri.delete();
  dstTri.delete();
  homography.delete();

  return clippedCanvas;
}

function runHomography(texImg) {
  // Redesenha a foto original antes de aplicar, para não empilhar aplicações antigas
  drawImageToCanvas(currentImage);

  // Uma única homografia só representa UM plano (uma parede reta). Se a área
  // marcada cobre uma quina (2 paredes com ângulos diferentes — visível na
  // foto como uma dobra na linha do teto/rodapé), tratar a área toda como um
  // quadrilátero só faz a perspectiva ficar certa numa parede e errada na
  // outra. Quando o visitante marcou os 2 pontos de quina, dividimos o
  // contorno em 2 sub-polígonos (um por parede) e aplicamos a textura em cada
  // um separadamente, com sua própria homografia — ver splitAtCorner().
  const polygons = cornerIndices.length === 2
    ? splitAtCorner(points, cornerIndices)
    : [points];

  polygons.forEach((poly) => {
    if (poly.length < 3) return; // contorno degenerado (não deveria acontecer) — ignora
    const result = renderTextureForPolygon(poly, texImg);
    ctx.drawImage(result, 0, 0);
  });
}
