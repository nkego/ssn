const tg = window.Telegram.WebApp;

// 🔑 1. Сразу сообщаем Telegram, что скрипт загружен
tg.ready(); 
tg.expand(); // Растягиваем до полного экрана без задержек
tg.setHeaderColor('secondary_bg_color'); // Убираем белую вспышку при смене темы

const ROWS = 9, COLS = 9, MINES = 10;
let board, revealed, flagged, gameOver, firstClick, timer, time = 0;
let mode = 'open';
let cells = [];

const gridEl = document.getElementById('grid');
const timerEl = document.getElementById('timer');
const minesEl = document.getElementById('mines-left');
const modeBtn = document.getElementById('mode-btn');
const modeBtnFlag = document.getElementById('mode-btn-flag');
const newGameBtn = document.getElementById('new-game');
const loader = document.getElementById('loader');
const app = document.getElementById('app');

// 🔑 2. Инициализация в следующем тике, чтобы не блокировать main thread
requestAnimationFrame(() => {
    init();
    loader.style.display = 'none';
    app.style.display = 'block';
});

function init() {
    clearInterval(timer);
    time = 0; timerEl.textContent = '⏱ 000';
    minesEl.textContent = `💣 ${MINES}`;
    gameOver = false; firstClick = true;
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    revealed = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    flagged = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    renderGrid();
    tg.MainButton.hide();
}

function renderGrid() {
    let html = '';
    cells = new Array(ROWS * COLS);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            html += `<div class="cell" data-r="${r}" data-c="${c}"></div>`;
        }
    }
    gridEl.innerHTML = html;
    gridEl.querySelectorAll('.cell').forEach(el => {
        cells[parseInt(el.dataset.r) * COLS + parseInt(el.dataset.c)] = el;
    });
}

gridEl.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    handleInteraction(parseInt(cell.dataset.r), parseInt(cell.dataset.c));
});

function handleInteraction(r, c) {
    if (gameOver || revealed[r][c]) return;
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

    if (mode === 'flag') {
        flagged[r][c] = !flagged[r][c];
        updateCell(r, c);
        const flags = flagged.flat().filter(Boolean).length;
        minesEl.textContent = `💣 ${MINES - flags}`;
        return;
    }

    if (flagged[r][c]) return;
    if (firstClick) {
        placeMines(r, c);
        calculateNumbers();
        firstClick = false;
        startTimer();
    }
    revealCell(r, c);
    checkWin();
}

function placeMines(safeR, safeC) {
    let placed = 0;
    while (placed < MINES) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        if (board[r][c] === -1) continue;
        if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
        board[r][c] = -1;
        placed++;
    }
}

function calculateNumbers() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === -1) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === -1) count++;
                }
            }
            board[r][c] = count;
        }
    }
}

function revealCell(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || revealed[r][c] || flagged[r][c]) return;
    revealed[r][c] = true;
    updateCell(r, c);

    if (board[r][c] === -1) {
        endGame(false); return;
    }
    if (board[r][c] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                revealCell(r + dr, c + dc);
            }
        }
    }
}

function updateCell(r, c) {
    const cell = cells[r * COLS + c];
    cell.className = 'cell';
    if (revealed[r][c]) {
        cell.classList.add('revealed');
        if (board[r][c] === -1) {
            cell.classList.add('mine');
            cell.textContent = '💣';
        } else if (board[r][c] > 0) {
            cell.textContent = board[r][c];
            cell.dataset.num = board[r][c];
        } else {
            cell.textContent = '';
            delete cell.dataset.num;
        }
    } else {
        cell.textContent = '';
        delete cell.dataset.num;
        if (flagged[r][c]) cell.classList.add('flagged');
    }
}

function checkWin() {
    const safeCells = ROWS * COLS - MINES;
    const opened = revealed.flat().filter(Boolean).length;
    if (opened === safeCells) endGame(true);
}

function endGame(win) {
    gameOver = true; clearInterval(timer);
    if (win) {
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        tg.MainButton.setText('🎉 Победа! Играть снова').show();
    } else {
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                if (board[r][c] === -1) revealed[r][c] = true;
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                updateCell(r, c);
        tg.MainButton.setText('💥 Взрыв! Новая игра').show();
    }
}

function startTimer() {
    timer = setInterval(() => {
        time++;
        timerEl.textContent = `⏱ ${String(time).padStart(3, '0')}`;
    }, 1000);
}

modeBtn.addEventListener('click', () => { mode = 'open'; updateModeButtons(); });
modeBtnFlag.addEventListener('click', () => { mode = 'flag'; updateModeButtons(); });
function updateModeButtons() {
    modeBtn.classList.toggle('active', mode === 'open');
    modeBtnFlag.classList.toggle('active', mode === 'flag');
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

newGameBtn.addEventListener('click', () => { init(); if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium'); });
tg.MainButton.onClick(() => { init(); tg.MainButton.hide(); });

// 🔑 Правильная инициализация
init();
requestAnimationFrame(() => {
    loader.classList.add('hidden');
    app.classList.add('visible');
    tg.ready(); // Сообщаем Telegram, что интерфейс готов
    tg.expand(); // Растягиваем на весь экран
});
