const canvas = document.getElementById("planetCanvas");
const ctx = canvas.getContext("2d");

const HEX_W = HEX_SIZE * 2;
const HEX_H = HEX_SIZE * Math.sqrt(3);

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

function hexToPixel(col, row, rowLength, maxLength) {
    const x = col * (HEX_W * 0.75);
    const y = row * HEX_H + (col % 2 ? HEX_H / 2 : 0);

    const shift = ((maxLength - rowLength) * (HEX_W * 0.75)) / 2;

    return {
        x: x + shift + 20,
        y: y + 20
    };
}

function drawHexAt(x, y, color, stroke = "#222", lineWidth = 1) {
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

    for (const row of Object.keys(rows)) {
        const rowCells = rows[row];
        const rowLength = rowCells.length;

        for (const cell of rowCells) {
            const { x, y } = hexToPixel(cell.col, cell.row, rowLength, maxLength);
            const color = biomeColors[cell.biome] || "#ffffff";

            const isHovered = hoveredCell &&
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

function pointInHex(px, py, hx, hy) {
    const dx = Math.abs(px - hx) / HEX_SIZE;
    const dy = Math.abs(py - hy) / HEX_H;

    return dy <= 0.5 && dx + dy <= 1;
}

function findCellAt(x, y) {
    for (const row of Object.keys(rows)) {
        const rowCells = rows[row];
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

    if (cell !== hoveredCell) {
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
    document.getElementById("info").textContent = "Клетка: —";
});

loadPlanet();
