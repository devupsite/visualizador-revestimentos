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

// --- Marcação dos 4 pontos (cantos da superfície a revestir) ---
const resetPointsBtn = document.getElementById('reset-points-btn');
const instructions = document.getElementById('instructions');

const POINT_LABELS = [
  'superior-esquerdo',
  'superior-direito',
  'inferior-direito',
  'inferior-esquerdo',
];

let points = []; // [{x, y}, ...] em coordenadas do canvas

function resetPoints() {
  points = [];
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

  ctx.fillStyle = '#57999B';
  ctx.strokeStyle = '#57999B';
  ctx.lineWidth = 2;

  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Conecta os pontos já marcados, e fecha o polígono quando os 4 estiverem prontos
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    if (points.length === 4) {
      ctx.closePath();
    }
    ctx.stroke();
  }
}

function handleCanvasPoint(evt) {
  if (!currentImage || points.length >= 4) return;
  evt.preventDefault();
  const coords = getCanvasCoords(evt);
  points.push(coords);
  drawPoints();
  updateInstructions();
}

canvas.addEventListener('click', handleCanvasPoint);
canvas.addEventListener('touchstart', handleCanvasPoint);

resetPointsBtn.addEventListener('click', resetPoints);

// --- Aplicação da textura via homografia (OpenCV.js) ---
// Etapa atual: mapeia a textura escolhida para o quadrilátero marcado,
// respeitando a perspectiva. Ainda SEM blend de luz/sombra (próximo commit) —
// por enquanto a textura fica "colada" por cima, sem herdar iluminação da foto original.

const catalogSection = document.getElementById('catalog-section');
let selectedTextureSrc = null;

function updateInstructions() {
  if (points.length < 4) {
    instructions.textContent = `Marque o canto ${POINT_LABELS[points.length]} da parede ou piso (${points.length}/4).`;
    catalogSection.classList.add('hidden');
  } else {
    instructions.textContent = 'Marcação concluída! Escolha um revestimento do catálogo abaixo.';
    catalogSection.classList.remove('hidden');
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
  if (points.length !== 4 || !currentImage) return;

  const texImg = new Image();
  texImg.crossOrigin = 'anonymous';
  texImg.onload = () => {
    waitForOpenCV(() => runHomography(texImg));
  };
  texImg.src = textureSrc;
}

function runHomography(texImg) {
  // Redesenha a foto original antes de aplicar, para não empilhar aplicações antigas
  drawImageToCanvas(currentImage);

  const srcCorners = [
    0, 0,
    texImg.width, 0,
    texImg.width, texImg.height,
    0, texImg.height,
  ];
  const dstCorners = [];
  points.forEach((p) => dstCorners.push(p.x, p.y));

  const texCanvas = document.createElement('canvas');
  texCanvas.width = texImg.width;
  texCanvas.height = texImg.height;
  texCanvas.getContext('2d').drawImage(texImg, 0, 0);

  const srcMat = cv.imread(texCanvas);
  const dstMat = new cv.Mat();
  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, srcCorners);
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, dstCorners);
  const homography = cv.findHomography(srcTri, dstTri);

  const warpedSize = new cv.Size(canvas.width, canvas.height);
  cv.warpPerspective(srcMat, dstMat, homography, warpedSize, cv.INTER_LINEAR, cv.BORDER_TRANSPARENT);

  // Máscara: só desenha o resultado dentro do polígono marcado,
  // preservando o resto da foto original intacto.
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext('2d');
  maskCtx.fillStyle = '#fff';
  maskCtx.beginPath();
  maskCtx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) maskCtx.lineTo(points[i].x, points[i].y);
  maskCtx.closePath();
  maskCtx.fill();

  const warpedCanvas = document.createElement('canvas');
  warpedCanvas.width = canvas.width;
  warpedCanvas.height = canvas.height;
  cv.imshow(warpedCanvas, dstMat);

  ctx.save();
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.drawImage(warpedCanvas, 0, 0);
  ctx.restore();

  // Redesenha o resto da foto original por baixo do resultado mascarado
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = canvas.width;
  finalCanvas.height = canvas.height;
  const finalCtx = finalCanvas.getContext('2d');
  finalCtx.drawImage(currentImage, 0, 0, finalCanvas.width, finalCanvas.height);
  finalCtx.drawImage(canvas, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(finalCanvas, 0, 0);

  srcMat.delete();
  dstMat.delete();
  srcTri.delete();
  dstTri.delete();
  homography.delete();
}
