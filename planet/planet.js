const canvas = document.getElementById("planetCanvas");
const ctx = canvas.getContext("2d");

const HEX_SIZE = 25;
const HEX_H = HEX_SIZE * Math.sqrt(3); // полная высота flat‑top
const HEX_W = HEX_SIZE * 2;            // полная ширина

let planetCells = [];
let rows = {};
let maxLength = 0;

let hoveredCell = null;

const biomeColors = {
    ocean: "#4a90e2",
    plain: "#7ed321",
    mountain: "#9b9b9b",
    desert: "#f5a623"
};

async function loadPlanet() {
    const urlParams = new URLSearchParams(window.location.search);
    const planetId = urlParams.get("planet") || 1;

    const response = await fetch(`../planets/planet_${planetId}.json`);
    planetCells = await response.json();

    renderPlanet();
}

// flat‑top координаты + центрирование
function hexToPixel(col, row, rowLength, maxLength) {
    // базовые координаты flat‑top
    const stepX = HEX_SIZE * 1.5; // горизонтальный шаг
    const stepY = HEX_H;          // вертикальный шаг

    let x = col * stepX;
    let y = row * stepY;

    // смещение чётных рядов вправо (odd-r / even-r — под твой вкус)
    const offsetX = (row % 2 === 0) ? HEX_SIZE * 0.75 : 0;
    x += offsetX;

    // центрирование ряда относительно максимальной длины
    const shift = ((maxLength - rowLength) * stepX) / 2;
    x += shift;

    // общий отступ от края канваса
    x += 40;
    y += 40;

    return { x, y };
}

// рисуем один flat‑top гекс по центру (x, y)
function drawHexAt(x, y, color, stroke = "#222", lineWidth = 1) {
    const w = HEX_SIZE;
    const h = HEX_H / 2;

    ctx.beginPath();
    ctx.moveTo(x - w,     y);      // левая середина
    ctx.lineTo(x - w / 2, y - h);  // левый верх
    ctx.lineTo(x + w / 2, y - h);  // правый верх
    ctx.lineTo(x + w,     y);      // правая середина
    ctx.lineTo(x + w / 2, y + h);  // правый низ
    ctx.lineTo(x - w / 2, y + h);  // левый низ
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
}

function renderPlanet() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // группируем по рядам
    rows = {};
    for (const cell of planetCells) {
        if (!rows[cell.row]) rows[cell.row] = [];
        rows[cell.row].push(cell);
    }

    maxLength = Math.max(...Object.values(rows).map(r => r.length));

    for (const rowKey of Object.keys(rows)) {
        const rowCells = rows[rowKey];
        const rowLength = rowCells.length;

        for (const cell of rowCells) {
            const { x, y } = hexToPixel(cell.col, cell.row, rowLength, maxLength);
            const color = biomeColors[cell.biome] || "#ffffff";

            const isHovered =
                hoveredCell &&
                hoveredCell.row === cell.row &&
                hoveredCell.col === cell.col;

            if (isHovered) {
                drawHexAt(x, y, color, "#ffffff", 3);
            } else {
                drawHexAt(x, y, color);
            }
        }
    }
}

// проверка попадания точки в flat‑top гекс
function pointInHex(px, py, hx, hy) {
    const w = HEX_SIZE;
    const h = HEX_H / 2;

    const dx = Math.abs(px - hx);
    const dy = Math.abs(py - hy);

    if (dx > w || dy > h) return false;

    // ромбовидная часть
    return (h * w - h * dx - (w / 2) * dy) >= 0;
}

function findCellAt(x, y) {
    for (const rowKey of Object.keys(rows)) {
        const rowCells = rows[rowKey];
        const rowLength = rowCells.length;

        for (const cell of rowCells) {
            const pos = hexToPixel(cell.col, cell.row, rowLength, maxLength);
            if (pointInHex(x, y, pos.x, pos.y)) {
                return cell;
            }
        }
    }
    return null;
}

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cell = findCellAt(x, y);

    if (
        (!cell && hoveredCell) ||
        (cell && (!hoveredCell ||
                  cell.row !== hoveredCell.row ||
                  cell.col !== hoveredCell.col))
    ) {
        hoveredCell = cell;
        renderPlanet();

        const info = document.getElementById("info");
        if (cell) {
            info.textContent = `Клетка: row=${cell.row}, col=${cell.col}, биом=${cell.biome}`;
        } else {
            info.textContent = "Клетка: —";
        }
    }
});

canvas.addEventListener("mouseleave", () => {
    hoveredCell = null;
    renderPlanet();
    const info = document.getElementById("info");
    if (info) info.textContent = "Клетка: —";
});

loadPlanet();
