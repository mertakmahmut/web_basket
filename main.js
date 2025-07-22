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
let paused = false;
let soundOn = true;
let pipeSpeed = PIPE_SPEED;

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

let overlayAlpha = 1;
let overlayTargetAlpha = 1;
let overlayFading = false;
let overlayFadeCallback = null;

function drawOverlay(alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

function animateOverlay(toAlpha, callback) {
  overlayTargetAlpha = toAlpha;
  overlayFading = true;
  overlayFadeCallback = callback || null;
  requestAnimationFrame(overlayFadeStep);
}

function overlayFadeStep() {
  if (!overlayFading) return;
  const speed = 0.08;
  if (Math.abs(overlayAlpha - overlayTargetAlpha) < speed) {
    overlayAlpha = overlayTargetAlpha;
    overlayFading = false;
    if (overlayFadeCallback) overlayFadeCallback();
    return;
  }
  overlayAlpha += (overlayTargetAlpha - overlayAlpha) * speed * 2;
  if (currentScreen === 'start') drawStartScreen();
  else if (currentScreen === 'gameover') drawGameOverScreen();
  requestAnimationFrame(overlayFadeStep);
}

let currentScreen = 'start'; // 'start', 'game', 'gameover'

let scoreAnim = 1;
let scoreAnimTarget = 1;
let scoreAnimFrame = 0;
let showNewBadge = false;

function drawScore() {
  ctx.save();
  ctx.font = `bold ${36 * scoreAnim}px Arial`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  ctx.strokeText(score.toString(), 20, 20);
  ctx.fillText(score.toString(), 20, 20);
  ctx.restore();
}

function animateScore() {
  scoreAnim = 1.4;
  scoreAnimTarget = 1;
  scoreAnimFrame = 10;
}

function updateScoreAnim() {
  if (scoreAnimFrame > 0) {
    scoreAnim += (scoreAnimTarget - scoreAnim) * 0.3;
    scoreAnimFrame--;
  } else {
    scoreAnim = 1;
  }
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
  // Draw 'New!' badge if needed
  if (showNewBadge) {
    ctx.save();
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ff595e';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let badgeX = canvas.width / 2 + 110;
    let badgeY = 80;
    ctx.strokeText('New!', badgeX, badgeY);
    ctx.fillText('New!', badgeX, badgeY);
    ctx.restore();
  }
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

function drawPipes() {
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    // Pipe shadow (subtle, offset down and right)
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#222';
    ctx.fillRect(p.x + 4, 4, PIPE_WIDTH, p.gapY);
    ctx.fillRect(p.x + 4, p.gapY + PIPE_GAP + 4, PIPE_WIDTH, canvas.height - (p.gapY + PIPE_GAP));
    ctx.restore();
    // Pipe body with gradient
    let pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
    pipeGrad.addColorStop(0, '#388e3c');
    pipeGrad.addColorStop(0.5, '#4caf50');
    pipeGrad.addColorStop(1, '#388e3c');
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
    ctx.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, canvas.height - (p.gapY + PIPE_GAP));
    // Pipe outline
    ctx.save();
    ctx.strokeStyle = '#26734d';
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.gapY);
    ctx.strokeRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, canvas.height - (p.gapY + PIPE_GAP));
    ctx.restore();
  }
}

function checkCollision() {
  // Margin to make hitbox less sensitive at pipe corners
  const pipeMargin = 6;
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    // Top pipe rectangle
    if (circleRectCollide(BIRD_X, birdY, BIRD_RADIUS, p.x + pipeMargin, 0, PIPE_WIDTH - 2 * pipeMargin, p.gapY + pipeMargin)) {
      endGame();
    }
    // Bottom pipe rectangle
    if (circleRectCollide(BIRD_X, birdY, BIRD_RADIUS, p.x + pipeMargin, p.gapY + PIPE_GAP - pipeMargin, PIPE_WIDTH - 2 * pipeMargin, canvas.height - (p.gapY + PIPE_GAP))) {
      endGame();
    }
  }
}

// Circle-rectangle collision helper
function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
  // Find the closest point to the circle within the rectangle
  let closestX = Math.max(rx, Math.min(cx, rx + rw));
  let closestY = Math.max(ry, Math.min(cy, ry + rh));
  // Calculate the distance between the circle's center and this closest point
  let dx = cx - closestX;
  let dy = cy - closestY;
  // If the distance is less than the circle's radius, there's a collision
  return (dx * dx + dy * dy) < (cr * cr);
}

function updateScore() {
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    if (!p.passed && p.x + PIPE_WIDTH < BIRD_X) {
      score++;
      p.passed = true;
      swishSound.currentTime = 0;
      swishSound.play();
      animateScore();
    }
  }
}

function drawBackground() {
  // Sky
  ctx.fillStyle = '#8ecae6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sun (top right)
  ctx.beginPath();
  ctx.arc(canvas.width - 70, 70, 50, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd166';
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Wavy Sea (bottom) with reflection/gradient
  ctx.save();
  ctx.beginPath();
  let seaTop = canvas.height - 100;
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(0, seaTop);
  for (let x = 0; x <= canvas.width; x += 10) {
    let wave = Math.sin((x + performance.now() / 200) / 30) * 8;
    ctx.lineTo(x, seaTop + wave);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  // Sea gradient
  let seaGradient = ctx.createLinearGradient(0, seaTop, 0, canvas.height);
  seaGradient.addColorStop(0, '#219ebc');
  seaGradient.addColorStop(0.7, '#219ebc');
  seaGradient.addColorStop(1, '#aaf0ff');
  ctx.fillStyle = seaGradient;
  ctx.fill();
  // Reflection
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += 10) {
    let wave = Math.sin((x + performance.now() / 200) / 30) * 8;
    ctx.lineTo(x, seaTop + wave + 12);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.restore();

  // Bosphorus Bridge Columns (left and right)
  ctx.save();
  ctx.strokeStyle = '#adb5bd';
  ctx.lineWidth = 12;
  // Left column
  ctx.beginPath();
  ctx.moveTo(18, seaTop);
  ctx.lineTo(18, seaTop - 80);
  ctx.stroke();
  // Right column
  ctx.beginPath();
  ctx.moveTo(canvas.width - 18, seaTop);
  ctx.lineTo(canvas.width - 18, seaTop - 80);
  ctx.stroke();
  ctx.restore();
}

function drawBird() {
  // Draw basketball image only, no black circle, no shadow, smooth edges
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
  // Smoothly increase speed as score increases
  pipeSpeed = PIPE_SPEED + score * 0.15;
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].x -= pipeSpeed;
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

function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  if (paused) {
    bgMusic.pause();
    drawPauseOverlay();
  } else {
    bgMusic.play();
    gameLoop();
  }
}

function drawPauseOverlay() {
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

function drawSoundToggle() {
  const iconX = canvas.width - 50;
  const iconY = 20;
  ctx.save();
  ctx.beginPath();
  ctx.arc(iconX + 15, iconY + 15, 15, 0, Math.PI * 2);
  ctx.fillStyle = soundOn ? '#4caf50' : '#888';
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.stroke();
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(soundOn ? '🔊' : '🔇', iconX + 15, iconY + 15);
  ctx.restore();
}

function setAllSoundMuted(muted) {
  bgMusic.muted = muted;
  bounceSound.muted = muted;
  hitSound.muted = muted;
  swishSound.muted = muted;
}

function gameLoop() {
  if (!gameRunning || paused) return;
  currentScreen = 'game';
  drawBackground();
  updateBird();
  updatePipes();
  drawPipes();
  drawBird();
  checkCollision();
  updateScore();
  updateScoreAnim();
  // Draw UI last
  drawScore();
  drawSoundToggle();
  if (gameRunning) requestAnimationFrame(gameLoop);
}

function flap() {
  if (!gameRunning) return;
  birdVelocity = FLAP;
  bounceSound.currentTime = 0;
  bounceSound.play();
}

function startGame() {
  overlayAlpha = 1;
  animateOverlay(0, function() {
    birdY = canvas.height / 2;
    birdVelocity = 0;
    score = 0;
    gameRunning = true;
    gameOver = false;
    pipeSpeed = PIPE_SPEED;
    resetPipes();
    addPipe();
    bgMusic.currentTime = 0;
    bgMusic.play();
    currentScreen = 'game';
    gameLoop();
  });
}

function endGame() {
  gameRunning = false;
  gameOver = true;
  currentScreen = 'gameover';
  bgMusic.pause();
  hitSound.currentTime = 0;
  hitSound.play();
  showNewBadge = false;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('flappyHighScore', highScore);
    showNewBadge = true;
  }
  overlayAlpha = 0;
  animateOverlay(1);
  drawGameOverScreen();
}

function drawGameOverScreen() {
  drawBackground();
  drawPipes();
  drawBird();
  // Overlay
  drawOverlay(0.5 * overlayAlpha);
  // UI last
  ctx.save();
  ctx.globalAlpha = overlayAlpha;
  drawScore();
  drawHighScore();
  drawButton('Restart');
  drawSoundToggle();
  ctx.restore();
}

function drawStartScreen() {
  drawBackground();
  drawPipes();
  drawBird();
  // Overlay
  drawOverlay(0.5 * overlayAlpha);
  // UI last
  ctx.save();
  ctx.globalAlpha = overlayAlpha;
  drawScore();
  drawButton('Start Game');
  drawSoundToggle();
  ctx.restore();
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  // Sound toggle button (top right)
  if (x >= canvas.width - 50 && x <= canvas.width - 20 && y >= 20 && y <= 50) {
    soundOn = !soundOn;
    setAllSoundMuted(!soundOn);
    drawSoundToggle();
    return;
  }
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
  } else if (gameRunning && !paused) {
    flap();
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'p' || e.key === 'P') {
    togglePause();
  }
});

// Initial draw: show start button
// On initial load:
overlayAlpha = 1;
drawStartScreen();

// Ensure canvas event listeners are registered
canvas.addEventListener('mousedown', handleCanvasClick);
canvas.addEventListener('touchstart', function(e) { e.preventDefault(); handleCanvasClick(e); }); 