// Game setup
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
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');

// Set canvas size
function resizeCanvas() {
    canvas.width = gameScreen.clientWidth;
    canvas.height = gameScreen.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game variables
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = 0;
let animationId;
let lastTime = 0;
let speed = 3;
let backgroundOffset = 0;

// Background with "MANSEHRA HELL" text
const backgroundImg = new Image();
backgroundImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNTAwIiB2aWV3Qm94PSIwIDAgODAwIDUwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzAwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iJ1ByZXNzIFN0YXJ0IDInIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0cmFuc2Zvcm09InJvdGF0ZSgtMTUgNDAwIDI1MCkiPk1BTlNFSEhBIEhFTEw8L3RleHQ+PC9zdmc+';

// Player - The Black Big Guy
const player = {
    x: 100,
    y: canvas.height / 2,
    width: 60,
    height: 90,
    speedY: 0,
    gravity: 0.5,
    jumpForce: -12,
    draw() {
        // Body
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Eyes (glowing red)
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 25, 8, 0, Math.PI * 2);
        ctx.arc(this.x + 45, this.y + 25, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth (evil grin)
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y + 50, 20, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        
        // Shoulder spikes
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 10);
        ctx.lineTo(this.x - 15, this.y + 30);
        ctx.lineTo(this.x, this.y + 50);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + 10);
        ctx.lineTo(this.x + this.width + 15, this.y + 30);
        ctx.lineTo(this.x + this.width, this.y + 50);
        ctx.fill();
    },
    update() {
        this.speedY += this.gravity;
        this.y += this.speedY;
        
        // Keep player within canvas bounds
        if (this.y < 0) {
            this.y = 0;
            this.speedY = 0;
        }
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.speedY = 0;
        }
    },
    jump() {
        this.speedY = this.jumpForce;
    },
    crouch() {
        this.speedY = 8;
    }
};

// Castle Walls (Obstacles)
const walls = {
    list: [],
    width: 60,
    gap: 180,
    frequency: 100,
    counter: 0,
    draw() {
        ctx.fillStyle = '#600';
        ctx.strokeStyle = '#300';
        ctx.lineWidth = 3;
        
        this.list.forEach(wall => {
            // Top wall with battlements
            ctx.fillRect(wall.x, 0, this.width, wall.topHeight);
            this.drawBattlements(wall.x, wall.topHeight - 20);
            
            // Bottom wall with battlements
            const bottomY = canvas.height - wall.bottomHeight;
            ctx.fillRect(wall.x, bottomY, this.width, wall.bottomHeight);
            this.drawBattlements(wall.x, bottomY);
            
            // Wall details
            ctx.strokeRect(wall.x, 0, this.width, wall.topHeight);
            ctx.strokeRect(wall.x, bottomY, this.width, wall.bottomHeight);
        });
    },
    drawBattlements(x, y) {
        ctx.fillStyle = '#900';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(x + i * 12, y, 8, 10);
            ctx.strokeRect(x + i * 12, y, 8, 10);
        }
    },
    update() {
        // Add new walls
        this.counter++;
        if (this.counter % this.frequency === 0) {
            const minHeight = 80;
            const maxHeight = canvas.height - this.gap - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
            const bottomHeight = canvas.height - this.gap - topHeight;
            
            this.list.push({
                x: canvas.width,
                topHeight,
                bottomHeight,
                passed: false
            });
            
            // Increase difficulty as score increases
            if (score > 0 && score % 5 === 0) {
                this.frequency = Math.max(60, this.frequency - 5);
                speed = Math.min(8, speed + 0.3);
                this.gap = Math.max(150, this.gap - 2);
            }
        }
        
        // Move walls
        for (let i = this.list.length - 1; i >= 0; i--) {
            this.list[i].x -= speed;
            
            // Score when passing a wall
            if (!this.list[i].passed && this.list[i].x + this.width < player.x) {
                this.list[i].passed = true;
                score++;
                scoreDisplay.textContent = `SCORE: ${score}`;
            }
            
            // Remove off-screen walls
            if (this.list[i].x + this.width < 0) {
                this.list.splice(i, 1);
            }
        }
    },
    checkCollision() {
        for (const wall of this.list) {
            // Top wall collision
            if (player.x + player.width > wall.x &&
                player.x < wall.x + this.width &&
                player.y < wall.topHeight) {
                return true;
            }
            
            // Bottom wall collision
            if (player.x + player.width > wall.x &&
                player.x < wall.x + this.width &&
                player.y + player.height > canvas.height - wall.bottomHeight) {
                return true;
            }
        }
        return false;
    }
};

// Game functions
function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // Reset game state
    score = 0;
    speed = 3;
    scoreDisplay.textContent = `SCORE: ${score}`;
    player.y = canvas.height / 2;
    player.speedY = 0;
    walls.list = [];
    walls.counter = 0;
    walls.frequency = 100;
    walls.gap = 180;
    
    gameRunning = true;
    gamePaused = false;
    lastTime = performance.now();
    
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = `SCORE: ${score}`;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
    }
}

function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        cancelAnimationFrame(animationId);
        pauseBtn.textContent = "> (P)";
        
        // Draw pause overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f00';
        ctx.font = '30px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
    } else {
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
        pauseBtn.textContent = "II (P)";
    }
}

function drawBackground() {
    // Draw scrolling background with "MANSEHRA HELL" text
    ctx.drawImage(backgroundImg, backgroundOffset, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, backgroundOffset + canvas.width, 0, canvas.width, canvas.height);
    backgroundOffset -= speed / 2;
    if (backgroundOffset <= -canvas.width) {
        backgroundOffset = 0;
    }
    
    // Additional dark overlay for hellish atmosphere
    ctx.fillStyle = 'rgba(100, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop(timestamp) {
    if (!gamePaused) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw and update game elements
        drawBackground();
        player.update();
        player.draw();
        walls.update();
        walls.draw();
        
        // Collision detection
        if (walls.checkCollision() || 
            player.y + player.height > canvas.height || 
            player.y < 0) {
            endGame();
            return;
        }
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// Event listeners for keyboard controls
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch (e.code) {
        case 'Space':
        case 'ArrowUp':
            e.preventDefault();
            if (!gamePaused) player.jump();
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (!gamePaused) player.crouch();
            break;
        case 'KeyP':
            togglePause();
            break;
    }
});

// Mobile touch controls
upBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning && !gamePaused) {
        player.jump();
        upBtn.classList.add('pressed');
    }
});

upBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    upBtn.classList.remove('pressed');
});

upBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (gameRunning && !gamePaused) {
        player.jump();
        upBtn.classList.add('pressed');
    }
});

upBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    upBtn.classList.remove('pressed');
});

downBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning && !gamePaused) {
        player.crouch();
        downBtn.classList.add('pressed');
    }
});

downBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    downBtn.classList.remove('pressed');
});

downBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (gameRunning && !gamePaused) {
        player.crouch();
        downBtn.classList.add('pressed');
    }
});

downBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    downBtn.classList.remove('pressed');
});

// Start the game when window loads
window.addEventListener('load', () => {
    startBtn.focus();
});
