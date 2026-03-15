const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

const size = 200;
const cellSize = canvas.width / size;

let showSectors = true;
let showStart = true;

let startPlanets = [];
let usedStartCells = new Set();

let selectedSector = 1; // выбранный сектор

// -----------------------------
// Сетка
// -----------------------------
function drawGrid() {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;

  for (let i = 0; i <= size; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.stroke();
  }
}

// -----------------------------
// Подсветка выбранного сектора
// -----------------------------
function drawSectorHighlight() {
  ctx.fillStyle = "rgba(150, 0, 255, 0.25)";

  if (selectedSector == 1) {
    ctx.fillRect(0, canvas.height/2, canvas.width/2, canvas.height/2);
  }
  if (selectedSector == 2) {
    ctx.fillRect(canvas.width/2, canvas.height/2, canvas.width/2, canvas.height/2);
  }
  if (selectedSector == 3) {
    ctx.fillRect(0, 0, canvas.width/2, canvas.height/2);
  }
  if (selectedSector == 4) {
    ctx.fillRect(canvas.width/2, 0, canvas.width/2, canvas.height/2);
  }
}

// -----------------------------
// Границы секторов
// -----------------------------
function drawSectors() {
  ctx.fillStyle = "rgba(0,255,0,0.25)";

  for (let y = 0; y < size; y++) {
    ctx.fillRect(100 * cellSize, (size - 1 - y) * cellSize, cellSize, cellSize);
  }

  for (let x = 0; x < size; x++) {
    ctx.fillRect(x * cellSize, (size - 1 - 100) * cellSize, cellSize, cellSize);
  }
}

// -----------------------------
// Стартовые планеты
// -----------------------------
function drawStartPlanets() {
  ctx.fillStyle = "#00aaff";

  for (const p of startPlanets) {
    const px = p.x * cellSize + cellSize / 2;
    const py = (size - 1 - p.y) * cellSize + cellSize / 2;

    ctx.beginPath();
    ctx.arc(px, py, cellSize * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

// -----------------------------
// Генерация стартовых планет
// -----------------------------
function generateStartPlanets() {
  startPlanets = [];

  const perSector = 2000;

  function gen(x1, x2, y1, y2) {
    let arr = [];
    while (arr.length < perSector) {
      arr.push({
        x: Math.floor(Math.random() * (x2 - x1)) + x1,
        y: Math.floor(Math.random() * (y2 - y1)) + y1
      });
    }
    return arr;
  }

  startPlanets.push(...gen(0, 100, 0, 100));
  startPlanets.push(...gen(100, 200, 0, 100));
  startPlanets.push(...gen(0, 100, 100, 200));
  startPlanets.push(...gen(100, 200, 100, 200));
}

// -----------------------------
// Полная отрисовка
// -----------------------------
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawSectorHighlight();

  if (showSectors) drawSectors();
  if (showStart) drawStartPlanets();
}

// -----------------------------
// Подсветка клетки
// -----------------------------
function highlightCell(x, y, color='rgba(0,200,255,0.4)') {
  redraw();
  ctx.fillStyle = color;
  ctx.fillRect(x * cellSize, (size - 1 - y) * cellSize, cellSize, cellSize);
}

// -----------------------------
// Левый клик
// -----------------------------
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const cellX = Math.floor(x / cellSize);
  const cellY = size - 1 - Math.floor(y / cellSize);

  highlightCell(cellX, cellY);

  document.getElementById('info').textContent =
    `Координаты: ${cellX}x${cellY}`;
});

// -----------------------------
// Правый клик — меню
// -----------------------------
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const cellX = Math.floor(x / cellSize);
  const cellY = size - 1 - Math.floor(y / cellSize);

  const menu = document.getElementById('menu');
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';
  menu.style.display = 'block';

  document.getElementById('menu-coords').textContent =
    `Клетка: ${cellX}x${cellY}`;
});

// Скрытие меню
document.addEventListener('click', (e) => {
  if (e.button !== 2) {
    document.getElementById('menu').style.display = 'none';
  }
});

// -----------------------------
// Поиск стартовой клетки игрока
// -----------------------------
function findStartCellForPlayer(sector) {
  const center = { x: 100, y: 100 };

  const sectorCells = startPlanets.filter(p => {
    if (sector == 1) return p.x < 100 && p.y < 100;
    if (sector == 2) return p.x >= 100 && p.y < 100;
    if (sector == 3) return p.x < 100 && p.y >= 100;
    if (sector == 4) return p.x >= 100 && p.y >= 100;
  });

  sectorCells.sort((a, b) => {
    const da = (a.x - center.x)**2 + (a.y - center.y)**2;
    const db = (b.x - center.x)**2 + (b.y - center.y)**2;
    return da - db;
  });

  for (const cell of sectorCells) {
    const key = `${cell.x},${cell.y}`;
    if (!usedStartCells.has(key)) {
      usedStartCells.add(key);
      return cell;
    }
  }

  return null;
}

// -----------------------------
// Кнопка "Начать игру"
// -----------------------------
document.getElementById("startGame").onclick = () => {
  const sector = Number(document.getElementById("sectorSelect").value);

  const cell = findStartCellForPlayer(sector);

  if (!cell) {
    alert("Нет свободных стартовых клеток в этом секторе!");
    return;
  }

  // Подсветка выбранной клетки
  highlightCell(cell.x, cell.y, 'rgba(255,0,0,0.5)');

  // Переход на страницу гекс-планеты
  // planetId = 1 — пока что у нас одна планета
  setTimeout(() => {
    location.href = `../planet/index.html?planet=1&startX=${cell.x}&startY=${cell.y}`;
  }, 600);
};

// -----------------------------
// Изменение выбранного сектора
// -----------------------------
document.getElementById("sectorSelect").onchange = (e) => {
  selectedSector = Number(e.target.value);
  redraw();
};

// -----------------------------
// Кнопки слоёв
// -----------------------------
document.getElementById("toggleSectors").onclick = () => {
  showSectors = !showSectors;
  redraw();
};

document.getElementById("toggleStart").onclick = () => {
  showStart = !showStart;
  redraw();
};

// -----------------------------
// Старт
// -----------------------------
generateStartPlanets();
redraw();
