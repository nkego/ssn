document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
        console.error('❌ Telegram WebApp SDK не найден');
        return;
    }

    // Сообщаем Telegram, что интерфейс готов
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes(); // Отключаем скролл страницы вниз для закрытия

    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const startBtn = document.getElementById('start-btn');

    const TILE = 15;
    const COUNT = 20;
    canvas.width = canvas.height = TILE * COUNT;

    let snake = [{x: 10, y: 10}];
    let food = {x: 15, y: 15};
    let dx = 0, dy = 0;
    let score = 0;
    let gameLoop = null;
    let isRunning = false;

    function draw() {
        const secBg = getComputedStyle(document.body).getPropertyValue('--tg-sec').trim() || '#f0f0f0';
        ctx.fillStyle = secBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(food.x * TILE, food.y * TILE, TILE - 2, TILE - 2);

        snake.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? '#3390ec' : '#5dade2';
            ctx.fillRect(seg.x * TILE, seg.y * TILE, TILE - 2, TILE - 2);
        });
    }

    function update() {
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};
        if (head.x < 0 || head.x >= COUNT || head.y < 0 || head.y >= COUNT) return gameOver();
        for (let s of snake) if (head.x === s.x && head.y === s.y) return gameOver();

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            scoreEl.textContent = score;
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            placeFood();
        } else {
            snake.pop();
        }
    }

    function placeFood() {
        food.x = Math.floor(Math.random() * COUNT);
        food.y = Math.floor(Math.random() * COUNT);
        for (let s of snake) if (food.x === s.x && food.y === s.y) return placeFood();
    }

    function gameOver() {
        clearInterval(gameLoop);
        isRunning = false;
        startBtn.textContent = '🔄 Играть снова';
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
        tg.showAlert(`🐍 Игра окончена!\nСчёт: ${score}`);
    }

    function startGame() {
        console.log('▶ Кнопка Старт нажата');
        if (isRunning) return;
        
        snake = [{x: 10, y: 10}];
        dx = 1; dy = 0; // Начинаем движение вправо
        score = 0; scoreEl.textContent = 0;
        placeFood();
        isRunning = true;
        startBtn.textContent = '⏸ Игра идёт...';
        
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(() => {
            try {
                update();
                draw();
            } catch (err) {
                console.error('⚠️ Ошибка в игровом цикле:', err);
                gameOver();
            }
        }, 140);
    }

    // Универсальный обработчик тапов (работает на iOS/Android/Desktop)
    function bindInteractive(element, callback) {
        element.addEventListener('pointerdown', (e) => {
            e.preventDefault(); // Отключаем зум, скролл и двойные тапы
            callback();
        });
        // Фоллбэк для старых браузеров
        element.addEventListener('click', (e) => {
            e.preventDefault();
            callback();
        });
    }

    bindInteractive(startBtn, startGame);

    // Клавиатура (ПК)
    document.addEventListener('keydown', e => {
        if (!isRunning) return;
        if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
        if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
        if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
        if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
    });

    // Мобильные кнопки
    document.querySelectorAll('.dir').forEach(btn => {
        bindInteractive(btn, () => {
            if (!isRunning) return;
            const dir = btn.dataset.dir;
            if (dir === 'up' && dy === 0) { dx = 0; dy = -1; }
            if (dir === 'down' && dy === 0) { dx = 0; dy = 1; }
            if (dir === 'left' && dx === 0) { dx = -1; dy = 0; }
            if (dir === 'right' && dx === 0) { dx = 1; dy = 0; }
        });
    });

    // Первый рендер
    draw();
    console.log('✅ Игра загружена. Ждём нажатия Старт...');
});
