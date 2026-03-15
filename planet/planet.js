const canvas = document.getElementById("planetCanvas");
const ctx = canvas.getContext("2d");

const HEX_SIZE = 25;
const HEX_W = HEX_SIZE * 2;              // ширина гекса
const HEX_H = Math.sqrt(3) * HEX_SIZE;   // высота гекса

const SPACING = 1.05; // расстояние между гексами (чуть больше 1 = небольшой зазор)

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

// pointy‑top + even‑r смещение + центрирование
function hexToPixel(col, row, rowLength, maxLength) {
    const stepX = HEX_W * 0.75 * SPACING; // горизонтальный шаг
    const stepY = HEX_H * SPACING;        // вертикальный шаг

    let x = col * stepX;
    let y = row * stepY;

    // even‑r: смещаются ЧЁТНЫЕ ряды
    if (row % 2 === 0) {
        x += (HEX_W * 0.5);
    }

    // центрирование ряда
    const shift = ((maxLength - rowLength) * stepX) / 2;
    x += shift;

    // общий отступ
    x += 40;
    y += 40;

    return { x, y };
}

// рисуем pointy‑top гекс
function drawHexAt(x, y, color, stroke = "#222", lineWidth = 1) {
    const s = HEX_SIZE;
    const h = HEX_H / 2;

    ctx.beginPath();
    ctx.moveTo(x,         y - h); // верх
    ctx.lineTo(x + s,     y - h/2);
    ctx.lineTo(x + s,     y + h/2);
    ctx.lineTo(x,         y + h); // низ
    ctx.lineTo(x - s,     y + h/2);
    ctx.lineTo(x - s,     y - h/2);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
}

function renderPlanet() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

// проверка попадания курсора в pointy‑top гекс
function pointInHex(px, py, hx, hy) {
    const dx = Math.abs(px - hx) / HEX_SIZE;
    const dy = Math.abs(py - hy) / (HEX_H / 2);

    if (dx + dy <= 1) return true;
    return false;
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
