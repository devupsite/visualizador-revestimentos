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
});
