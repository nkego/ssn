const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const startBtn = document.getElementById('start-btn');

const GRID = 20;
const TILE = 15; // 20 * 15 = 300px

let snake = [{x: 10, y: 10}];
let food = {x: 5, y: 5};
let dx = 0, dy = 0;
let score = 0;
let timer = null;
let isPlaying = false;

function draw() {
    // Фон
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--sec').trim() || '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Еда
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(food.x * TILE + 1, food.y * TILE + 1, TILE - 2, TILE - 2);

    // Змейка
    snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#3390ec' : '#5dade2';
        ctx.fillRect(seg.x * TILE + 1, seg.y * TILE + 1, TILE - 2, TILE - 2);
    });
}

function step() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    // Столкновение со стеной или собой
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || 
        snake.some(s => s.x === head.x && s.y === head.y)) {
        return stopGame();
    }

    snake.unshift(head);

    // Съели еду
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        placeFood();
    } else {
        snake.pop();
    }
}

function placeFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID),
            y: Math.floor(Math.random() * GRID)
        };
    } while (snake.some(s => s.x === newFood.x && s.y === newFood.y));
    food = newFood;
}

function stopGame() {
    clearInterval(timer);
    isPlaying = false;
    startBtn.textContent = '🔄 Заново';
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
    tg.showAlert(`🐍 Игра окончена!\nСчёт: ${score}`);
}

function startGame() {
    if (isPlaying) return;
    
    snake = [{x: 10, y: 10}];
    dx = 1; dy = 0;
    score = 0;
    scoreEl.textContent = 0;
    placeFood();
    isPlaying = true;
    startBtn.textContent = '⏸ В игре...';
    
    clearInterval(timer);
    timer = setInterval(() => { step(); draw(); }, 150);
}

// Кнопка старта
startBtn.addEventListener('click', startGame);
startBtn.addEventListener('touchstart', e => { e.preventDefault(); startGame(); }, {passive: false});

// Клавиатура (ПК)
document.addEventListener('keydown', e => {
    if (!isPlaying) return;
    if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
    else if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
    else if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
    else if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
});

// Тач-кнопки (мгновенный отклик через pointerdown)
document.querySelectorAll('.ctrl-btn').forEach(btn => {
    btn.addEventListener('pointerdown', e => {
        e.preventDefault(); // Блокирует зум/скролл
        if (!isPlaying) return;
        const d = btn.dataset.dir;
        if (d === 'up' && dy === 0) { dx = 0; dy = -1; }
        if (d === 'down' && dy === 0) { dx = 0; dy = 1; }
        if (d === 'left' && dx === 0) { dx = -1; dy = 0; }
        if (d === 'right' && dx === 0) { dx = 1; dy = 0; }
    });
});

// Первая отрисовка
draw();
