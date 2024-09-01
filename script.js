// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// UI Elements
const scoreElement = document.getElementById('score');
const highscoreElement = document.getElementById('highscore');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

// Game Variables
let gameSpeed = 5;
let gravity = 1.5;
let score = 0;
let highscore = localStorage.getItem('highscore') || 0;
let gameFrame = 0;
let gameOver = false;
let obstacles = [];
let clouds = [];

// Load Images
const background = new Image();
background.src = 'https://static.vecteezy.com/system/resources/thumbnails/010/876/711/small_2x/cemetery-landscape-graveyard-and-tombstones-vector.jpg';

const ground = new Image();
ground.src = 'ground.png';

const playerImage = new Image();
playerImage.src = 'p.png';

const obstacleImages = [
    'pp.png',
    'zombie.png',
    'pp.png'
].map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

const cloudImage = new Image();
cloudImage.src = 'cloud.png';

// Load Sounds
const jumpSound = new Audio('assets/jump.mp3');
const collisionSound = new Audio('assets/gameover.mp3');
const backgroundMusic = new Audio('assets/background.mp3');
backgroundMusic.loop = true;

// Player Object
const player = {
    x: 100,
    y: canvas.height - 200,
    width: 80,
    height: 80,
    dy: 0,
    jumpForce: -25,
    originalHeight: 80,
    grounded: false,
    jumpTimer: 0,
    sprite: playerImage,
    draw() {
        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    },
    update() {
        // Jump
        if (keys['Space'] || keys['ArrowUp'] || keys['w']) {
            this.jump();
        } else {
            this.jumpTimer = 0;
        }

        // Apply gravity
        this.y += this.dy;
        if (!this.grounded) {
            this.dy += gravity;
        } else {
            this.dy = 0;
        }

        // Ground collision
        if (this.y + this.height >= canvas.height - ground.height) {
            this.y = canvas.height - ground.height - this.height;
            this.grounded = true;
        } else {
            this.grounded = false;
        }

        this.draw();
    },
    jump() {
        if (this.grounded && this.jumpTimer === 0) {
            jumpSound.play();
            this.jumpTimer = 1;
            this.dy = this.jumpForce;
        } else if (this.jumpTimer > 0 && this.jumpTimer < 15) {
            this.jumpTimer++;
            this.dy = this.jumpForce - (this.jumpTimer / 50);
        }
    }
};

// Obstacle Class
class Obstacle {
    constructor() {
        this.sprite = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
        this.width = 75;
        this.height = 100;
        this.x = canvas.width + this.width;
        this.y = canvas.height - ground.height - this.height;
        this.passed = false;
    }
    draw() {
        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
    update() {
        this.x -= gameSpeed;
        if (!this.passed && this.x + this.width < player.x) {
            score++;
            this.passed = true;
            gameSpeed += 0.1; // Increase speed slightly
        }
        this.draw();
    }
}

// Cloud Class
class Cloud {
    constructor() {
        this.x = canvas.width + Math.random() * canvas.width;
        this.y = Math.random() * (canvas.height / 2);
        this.width = 128;
        this.height = 64;
        this.speed = gameSpeed * 0.5;
    }
    draw() {
        ctx.drawImage(cloudImage, this.x, this.y, this.width, this.height);
    }
    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.x = canvas.width + Math.random() * canvas.width;
            this.y = Math.random() * (canvas.height / 2);
        }
        this.draw();
    }
}

// Control Keys
const keys = {};

window.addEventListener('keydown', function(e) {
    keys[e.code] = true;
});

window.addEventListener('keyup', function(e) {
    keys[e.code] = false;
});

// Spawn Obstacles
function spawnObstacles() {
    if (gameFrame % 120 === 0) { // Every 2 seconds at 60fps
        obstacles.push(new Obstacle());
    }
}

// Spawn Clouds
function spawnClouds() {
    if (clouds.length < 5) {
        clouds.push(new Cloud());
    }
}

// Handle Game Over
function handleGameOver() {
    collisionSound.play();
    backgroundMusic.pause();
    gameOver = true;
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.textContent = score;
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('highscore', highscore);
        highscoreElement.textContent = `Highscore: ${highscore}`;
    }
}

// Update Game
function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Update and Draw Clouds
    clouds.forEach(cloud => cloud.update());

    // Draw Ground
    ctx.drawImage(ground, 0, canvas.height - ground.height-85, canvas.width, ground.height+100);

    // Update and Draw Player
    player.update();

    // Spawn and Update Obstacles
    spawnObstacles();
    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        // Collision Detection
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        ) {
            handleGameOver();
        }
        // Remove off-screen obstacles
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
    });

    // Update Score
    scoreElement.textContent = `Score: ${score}`;
    highscoreElement.textContent = `Highscore: ${highscore}`;

    gameFrame++;
    if (!gameOver) requestAnimationFrame(updateGame);
}

// Start Game
function startGame() {
    resetGame();
    startScreen.classList.add('hidden');
    backgroundMusic.play();
    spawnClouds();
    requestAnimationFrame(updateGame);
}

// Reset Game
function resetGame() {
    gameSpeed = 6;
    score = 0;
    gameFrame = 0;
    gameOver = false;
    obstacles = [];
    clouds = [];
    player.y = canvas.height - ground.height - player.height;
    player.dy = 0;
    backgroundMusic.currentTime = 0;
}

// Event Listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startGame();
});

// Adjust Canvas on Window Resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.y = canvas.height - ground.height - player.height;
});

