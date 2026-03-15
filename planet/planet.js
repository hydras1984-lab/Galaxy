// -----------------------------
// Чтение параметров из URL
// -----------------------------
const params = new URLSearchParams(location.search);
const planetId = params.get("planet") || 1;
const startX = Number(params.get("startX"));
const startY = Number(params.get("startY"));

const canvas = document.getElementById("planetCanvas");
const ctx = canvas.getContext("2d");

const HEX_SIZE = 25; // размер гекса
const HEX_H = HEX_SIZE * Math.sqrt(3);

// Цвета биомов
const biomeColors = {
  ocean: "#3a6ff7",
  desert: "#e8d26a",
  mountain: "#888888",
  plain: "#4caf50"
};

// -----------------------------
// Загрузка JSON планеты
// -----------------------------
async function loadPlanet() {
  const response = await fetch(`../planets/planet_${planetId}.json`);
  return await response.json();
}

// -----------------------------
// Рисование одного гекса
// -----------------------------
function hexToPixel(col, row) {
  const x = col * HEX_SIZE * 1.5 + 50;
  const y = row * HEX_H + (col % 2 ? HEX_H / 2 : 0) + 50;
  return { x, y };
}

function drawHex(col, row, color) {
  const { x, y } = hexToPixel(col, row);

  ctx.beginPath();
  ctx.moveTo(x + HEX_SIZE, y);
  ctx.lineTo(x + HEX_SIZE / 2, y + HEX_H / 2);
  ctx.lineTo(x - HEX_SIZE / 2, y + HEX_H / 2);
  ctx.lineTo(x - HEX_SIZE, y);
  ctx.lineTo(x - HEX_SIZE / 2, y - HEX_H / 2);
  ctx.lineTo(x + HEX_SIZE / 2, y - HEX_H / 2);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.stroke();
}

// -----------------------------
// Рисование всей планеты
// -----------------------------
function renderPlanet(cells) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const cell of cells) {
    const color = biomeColors[cell.biome] || "#ffffff";
    drawHex(cell.col, cell.row, color);
  }

  document.getElementById("info").textContent =
    `Стартовая клетка: ${startX}x${startY}`;
}

// -----------------------------
// Старт
// -----------------------------
loadPlanet().then(renderPlanet);
