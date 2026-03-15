const canvas = document.getElementById("planetCanvas");
const ctx = canvas.getContext("2d");

const HEX_SIZE = 25;
const HEX_H = HEX_SIZE * Math.sqrt(3);

// Цвета биомов
const biomeColors = {
    ocean: "#4a90e2",
    plain: "#7ed321",
    mountain: "#9b9b9b",
    desert: "#f5a623"
};

// Загружаем JSON
async function loadPlanet() {
    const urlParams = new URLSearchParams(window.location.search);
    const planetId = urlParams.get("planet") || 1;

    const response = await fetch(`../planets/planet_${planetId}.json`);
    const cells = await response.json();

    renderPlanet(cells);
}

// Центрирование + смещение odd-r
function hexToPixel(col, row, rowLength, maxLength) {
    const baseX = col * HEX_SIZE * 1.5;
    const baseY = row * HEX_H + (row % 2 ? HEX_H / 2 : 0);

    // Центрирование ряда
    const shift = ((maxLength - rowLength) * HEX_SIZE * 1.5) / 2;

    return {
        x: baseX + shift + 20,
        y: baseY + 20
    };
}

// Рисуем гекс по координатам
function drawHexAt(x, y, color) {
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

// Основной рендер
function renderPlanet(cells) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Группируем клетки по рядам
    const rows = {};
    for (const cell of cells) {
        if (!rows[cell.row]) rows[cell.row] = [];
        rows[cell.row].push(cell);
    }

    // Находим максимальную длину ряда
    const maxLength = Math.max(...Object.values(rows).map(r => r.length));

    // Рисуем ряды
    for (const row of Object.keys(rows)) {
        const rowCells = rows[row];
        const rowLength = rowCells.length;

        for (const cell of rowCells) {
            const { x, y } = hexToPixel(cell.col, cell.row, rowLength, maxLength);
            const color = biomeColors[cell.biome] || "#ffffff";
            drawHexAt(x, y, color);
        }
    }
}

loadPlanet();
