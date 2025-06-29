// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreDisplay = document.getElementById('score-display');
const finalScoreDisplay = document.getElementById('final-score');
const pauseBtn = document.getElementById('pause-btn');

// Set canvas size
function resizeCanvas() {
    canvas.width = gameScreen.clientWidth;
    canvas.height = gameScreen.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game state
let gameRunning = false;
let gamePaused = false;
let score = 0;
let animationId;
let lastTime = 0;
let speed = 2;

// Game objects
const car = {
    x: 100,
    y: canvas.height / 2,
    width: 60,
    height: 30,
    color: '#00ffff',
    speed: 0,
    gravity: 0.5,
    lift: -10,
    draw() {
        ctx.fillStyle = this.color;
        // Car body
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Car windows
        ctx.fillStyle = '#16213e';
        ctx.fillRect(this.x + 10, this.y + 5, 15, 10);
        ctx.fillRect(this.x + 35, this.y + 5, 15, 10);
        // Car wings
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(this.x - 10, this.y + 10, 10, 5);
        ctx.fillRect(this.x + this.width, this.y + 10, 10, 5);
    },
    update() {
        this.speed += this.gravity;
        this.y += this.speed;
        
        // Keep car within canvas
        if (this.y < 0) {
            this.y = 0;
            this.speed = 0;
        }
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.speed = 0;
        }
    },
    flap() {
        this.speed = this.lift;
    }
};

const obstacles = {
    list: [],
    width: 30,
    gap: 150,
    frequency: 120, // frames
    counter: 0,
    draw() {
        ctx.fillStyle = '#ff00ff';
        this.list.forEach(obstacle => {
            // Top obstacle
            ctx.fillRect(obstacle.x, 0, this.width, obstacle.topHeight);
            // Bottom obstacle
            ctx.fillRect(
                obstacle.x, 
                canvas.height - obstacle.bottomHeight, 
                this.width, 
                obstacle.bottomHeight
            );
        });
    },
    update() {
        // Add new obstacles
        this.counter++;
        if (this.counter % this.frequency === 0) {
            const topHeight = Math.floor(Math.random() * (canvas.height - this.gap - 100)) + 50;
            const bottomHeight = canvas.height - this.gap - topHeight;
            this.list.push({
                x: canvas.width,
                topHeight,
                bottomHeight,
                passed: false
            });
            
            // Increase difficulty
            if (score > 0 && score % 5 === 0) {
                this.frequency = Math.max(60, this.frequency - 5);
                speed = Math.min(6, speed + 0.2);
            }
        }
        
        // Move obstacles
        for (let i = this.list.length - 1; i >= 0; i--) {
            this.list[i].x -= speed;
            
            // Check if passed
            if (!this.list[i].passed && this.list[i].x + this.width < car.x) {
                this.list[i].passed = true;
                score++;
                scoreDisplay.textContent = `Score: ${score}`;
            }
            
            // Remove off-screen obstacles
            if (this.list[i].x + this.width < 0) {
                this.list.splice(i, 1);
            }
        }
    },
    checkCollision() {
        for (const obstacle of this.list) {
            // Check collision with top obstacle
            if (
                car.x + car.width > obstacle.x &&
                car.x < obstacle.x + this.width &&
                car.y < obstacle.topHeight
            ) {
                return true;
            }
            
            // Check collision with bottom obstacle
            if (
                car.x + car.width > obstacle.x &&
                car.x < obstacle.x + this.width &&
                car.y + car.height > canvas.height - obstacle.bottomHeight
            ) {
                return true;
            }
        }
        return false;
    }
};

// Game functions
function startGame() {
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Reset game state
    score = 0;
    speed = 2;
    scoreDisplay.textContent = `Score: ${score}`;
    car.y = canvas.height / 2;
    car.speed = 0;
    obstacles.list = [];
    obstacles.counter = 0;
    obstacles.frequency = 120;
    
    gameRunning = true;
    gamePaused = false;
    lastTime = 0;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = `Your score: ${score}`;
}

function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        cancelAnimationFrame(animationId);
        pauseBtn.textContent = "Resume (P)";
    } else {
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
        pauseBtn.textContent = "Pause (P)";
    }
}

function gameLoop(timestamp) {
    if (!gamePaused) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw game objects
        car.update();
        car.draw();
        obstacles.update();
        obstacles.draw();
        
        // Check for collisions
        if (obstacles.checkCollision() || car.y + car.height > canvas.height || car.y < 0) {
            endGame();
            return;
        }
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch (e.code) {
        case 'Space':
        case 'ArrowUp':
            e.preventDefault();
            if (!gamePaused) car.flap();
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (!gamePaused) car.speed = 5;
            break;
        case 'KeyP':
            togglePause();
            break;
    }
});

pauseBtn.addEventListener('click', togglePause);
// Mobile controls
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');

// Touch events
upBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gamePaused) car.flap();
});

downBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gamePaused) car.speed = 5;
});

// Also make sure clicks work (for devices that support both)
upBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (!gamePaused) car.flap();
});

downBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (!gamePaused) car.speed = 5;
});
