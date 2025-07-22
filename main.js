// Flappy Bird-Inspired Game - main.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.5;
const FLAP = -8;
const BIRD_RADIUS = 20;
const BIRD_X = 80;

// Pipe constants
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 2;
const PIPE_INTERVAL = 120; // frames between pipes

// Game state
let birdY = canvas.height / 2;
let birdVelocity = 0;
let score = 0;
let gameRunning = false;
let gameOver = false;
let highScore = Number(localStorage.getItem('flappyHighScore')) || 0;

// Pipe state
let pipes = [];
let frameCount = 0;

// Button state
const BUTTON_WIDTH = 160;
const BUTTON_HEIGHT = 50;
const BUTTON_Y = 350;
const BUTTON_X = (canvas.width - BUTTON_WIDTH) / 2;

// Load basketball image
const basketballImg = new Image();
basketballImg.src = 'basketball.png';

// Load background music
const bgMusic = new Audio('bg-music.mp3');
bgMusic.loop = true;

// Load sound effects
const bounceSound = new Audio('bounce.mp3');
const hitSound = new Audio('hit.mp3');
const swishSound = new Audio('swish.mp3');

function drawBackground() {
  ctx.fillStyle = '#70c5ce';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBird() {
  // Draw basketball image only, no black circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(BIRD_X, birdY, BIRD_RADIUS, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(basketballImg, BIRD_X - BIRD_RADIUS, birdY - BIRD_RADIUS, BIRD_RADIUS * 2, BIRD_RADIUS * 2);
  ctx.restore();
}

function updateBird() {
  birdVelocity += GRAVITY;
  birdY += birdVelocity;
  if (birdY + BIRD_RADIUS > canvas.height) {
    birdY = canvas.height - BIRD_RADIUS;
    birdVelocity = 0;
    endGame();
  }
  if (birdY - BIRD_RADIUS < 0) {
    birdY = BIRD_RADIUS;
    birdVelocity = 0;
    endGame();
  }
}

function resetPipes() {
  pipes = [];
  frameCount = 0;
}

function addPipe() {
  // Random gap position
  const minGapY = 60;
  const maxGapY = canvas.height - PIPE_GAP - 60;
  const gapY = Math.floor(Math.random() * (maxGapY - minGapY + 1)) + minGapY;
  pipes.push({
    x: canvas.width,
    gapY: gapY
  });
}

function updatePipes() {
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].x -= PIPE_SPEED;
  }
  // Remove pipes that have gone off screen
  if (pipes.length && pipes[0].x + PIPE_WIDTH < 0) {
    pipes.shift();
  }
  // Add new pipe
  frameCount++;
  if (frameCount % PIPE_INTERVAL === 0) {
    addPipe();
  }
}

function drawPipes() {
  ctx.fillStyle = '#4caf50';
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    // Top pipe
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
    // Bottom pipe
    ctx.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, canvas.height - (p.gapY + PIPE_GAP));
  }
}

function checkCollision() {
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    // Bird within pipe x range
    if (BIRD_X + BIRD_RADIUS > p.x && BIRD_X - BIRD_RADIUS < p.x + PIPE_WIDTH) {
      // Bird hits top pipe
      if (birdY - BIRD_RADIUS < p.gapY || birdY + BIRD_RADIUS > p.gapY + PIPE_GAP) {
        endGame();
      }
    }
  }
}

function updateScore() {
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    if (!p.passed && p.x + PIPE_WIDTH < BIRD_X) {
      score++;
      p.passed = true;
      swishSound.currentTime = 0;
      swishSound.play();
    }
  }
}

function drawScore() {
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  ctx.strokeText(score.toString(), 20, 20);
  ctx.fillText(score.toString(), 20, 20);
}

function drawButton(text) {
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(BUTTON_X, BUTTON_Y, BUTTON_WIDTH, BUTTON_HEIGHT);
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, BUTTON_Y + BUTTON_HEIGHT / 2);
}

function drawHighScore() {
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  ctx.strokeText('High Score: ' + highScore, canvas.width / 2, 80);
  ctx.fillText('High Score: ' + highScore, canvas.width / 2, 80);
}

function gameLoop() {
  if (!gameRunning) return;
  drawBackground();
  updateBird();
  updatePipes();
  drawPipes();
  drawBird();
  checkCollision();
  updateScore();
  drawScore();
  if (gameRunning) requestAnimationFrame(gameLoop);
}

function flap() {
  if (!gameRunning) return;
  birdVelocity = FLAP;
  bounceSound.currentTime = 0;
  bounceSound.play();
}

function startGame() {
  birdY = canvas.height / 2;
  birdVelocity = 0;
  score = 0;
  gameRunning = true;
  gameOver = false;
  resetPipes();
  addPipe();
  bgMusic.currentTime = 0;
  bgMusic.play();
  gameLoop();
}

function endGame() {
  gameRunning = false;
  gameOver = true;
  bgMusic.pause();
  hitSound.currentTime = 0;
  hitSound.play();
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('flappyHighScore', highScore);
  }
  drawBackground();
  drawPipes();
  drawBird();
  drawScore();
  drawHighScore();
  drawButton('Restart');
}

function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  if (!gameRunning && gameOver) {
    // Check if restart button is clicked
    if (
      x >= BUTTON_X && x <= BUTTON_X + BUTTON_WIDTH &&
      y >= BUTTON_Y && y <= BUTTON_Y + BUTTON_HEIGHT
    ) {
      startGame();
    }
  } else if (!gameRunning && !gameOver) {
    // Check if start button is clicked
    if (
      x >= BUTTON_X && x <= BUTTON_X + BUTTON_WIDTH &&
      y >= BUTTON_Y && y <= BUTTON_Y + BUTTON_HEIGHT
    ) {
      startGame();
    }
  } else {
    flap();
  }
}

canvas.addEventListener('mousedown', handleCanvasClick);
canvas.addEventListener('touchstart', function(e) { e.preventDefault(); handleCanvasClick(e); });

// Initial draw: show start button
function drawStartScreen() {
  drawBackground();
  drawPipes();
  drawBird();
  drawScore();
  drawButton('Start Game');
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

drawStartScreen(); 