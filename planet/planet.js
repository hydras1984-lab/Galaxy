const canvas = document.getElementById("planetCanvas");
const ctx = canvas.getContext("2d");

// Радиус гекса (от центра до вершины)
const HEX_SIZE = 25;

// Геометрия pointy‑top
const HEX_H = HEX_SIZE * 2;               // высота (от вершины до вершины)
const HEX_W = Math.sqrt(3) * HEX_SIZE;    // ширина

// Шаги между гексами (увеличенные для зазора)
const SPACING = 1.5;

const STEP_X = HEX_W * 0.75 * SPACING;    // горизонтальный шаг
const STEP_Y = HEX_H * 0.5 * SPACING;     // вертикальный шаг

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

// pointy‑top + even‑r + центрирование
function hexToPixel(col, row, rowLength, maxLength) {
    let x = col * STEP_X;
    let y = row * STEP_Y;

    // even‑r: смещаются чётные ряды
    if (row % 2 === 0) {
        x += HEX_W * 0.5;
    }

    // центрирование ряда
    const shift = ((maxLength - rowLength) * STEP_X) / 2;
    x += shift;

    // общий отступ
    x += 40;
    y += 40;

    return { x, y };
}

// Рисуем настоящий pointy‑top гекс
function hexToPixel(col, row, rowLength, maxLength) {
    // базовые координаты
    let x = col * STEP_X;
    let y = row * STEP_Y;

    // even‑r: смещаются чётные ряды
    if (row % 2 === 0) {
        x += HEX_W * 0.5;
    }

    // ширина текущего ряда
    const rowWidth = (rowLength - 1) * STEP_X + HEX_W;

    // центр канваса
    const centerX = canvas.width / 2;

    // центрирование ряда
    x += centerX - rowWidth / 2;

    // дополнительное смещение второго ряда (row = 1)
    if (row === 1) {
        x -= HEX_W * 0.5; // на пол‑соты влево
    }

    // общий отступ сверху
    y += 40;

    return { x, y };
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

// попадание в pointy‑top гекс
function pointInHex(px, py, hx, hy) {
    const dx = Math.abs(px - hx);
    const dy = Math.abs(py - hy);

    if (dx > HEX_W / 2 || dy > HEX_H / 2) return false;

    return (dx / (HEX_W / 2) + dy / (HEX_H / 2)) <= 1;
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
