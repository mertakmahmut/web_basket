// Flappy Bird-Inspired Game - main.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.5;
const FLAP = -8;
const BIRD_RADIUS = 20;
const BIRD_X = Math.floor(canvas.width * 0.25); // 1/4th of the screen horizontally

// Pipe constants
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 2;
const PIPE_INTERVAL = 120; // frames between pipes
const PIPE_DISTANCE = 220; // Minimum horizontal distance between pipes

// Game state
let birdY = canvas.height / 2; // Vertically centered
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

const SHARE_BUTTON_WIDTH = 120;
const SHARE_BUTTON_HEIGHT = 40;
const SHARE_BUTTON_Y = BUTTON_Y + BUTTON_HEIGHT + 30;
const SHARE_BUTTON_X = (canvas.width - SHARE_BUTTON_WIDTH) / 2;

// Load basketball image
const basketballImg = new Image();
basketballImg.src = 'basketball.png';

// Load background music
const bgMusic = new Audio('bg-music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;

// Load sound effects
const bounceSound = new Audio('bounce.mp3');
const hitSound = new Audio('hit.mp3');
const swishSound = new Audio('swish.mp3');

let overlayAlpha = 1;
let overlayTargetAlpha = 1;
let overlayFading = false;
let overlayFadeCallback = null;

let dimAlpha = 0;
let dimDirection = 0;

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

function triggerDimEffect() {
  dimAlpha = 0;
  dimDirection = 1;
  requestAnimationFrame(dimStep);
}

function dimStep() {
  if (dimDirection === 0) return;
  if (dimDirection === 1) {
    dimAlpha += 0.08;
    if (dimAlpha >= 0.7) {
      dimAlpha = 0.7;
      dimDirection = -1;
    }
  } else if (dimDirection === -1) {
    dimAlpha -= 0.08;
    if (dimAlpha <= 0) {
      dimAlpha = 0;
      dimDirection = 0;
      return;
    }
  }
  drawGameOverScreen(true); // Pass true to indicate dim effect
  requestAnimationFrame(dimStep);
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

function drawButton(text, x = BUTTON_X, y = BUTTON_Y, w = BUTTON_WIDTH, h = BUTTON_HEIGHT) {
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(x, y, w, h);
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
}

function drawPipes() {
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    // Pipe shadow (subtle, offset down and right)
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#222';
    ctx.fillRect(p.x + 4, 4, PIPE_WIDTH, p.gapY);
    ctx.fillRect(p.x + 4, p.gapY + p.gap + 4, PIPE_WIDTH, canvas.height - (p.gapY + p.gap));
    ctx.restore();
    // Pipe body with gradient
    let pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
    pipeGrad.addColorStop(0, '#388e3c');
    pipeGrad.addColorStop(0.5, '#4caf50');
    pipeGrad.addColorStop(1, '#388e3c');
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
    ctx.fillRect(p.x, p.gapY + p.gap, PIPE_WIDTH, canvas.height - (p.gapY + p.gap));
    // Pipe outline
    ctx.save();
    ctx.strokeStyle = '#26734d';
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.gapY);
    ctx.strokeRect(p.x, p.gapY + p.gap, PIPE_WIDTH, canvas.height - (p.gapY + p.gap));
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
    if (circleRectCollide(BIRD_X, birdY, BIRD_RADIUS, p.x + pipeMargin, p.gapY + p.gap - pipeMargin, PIPE_WIDTH - 2 * pipeMargin, canvas.height - (p.gapY + p.gap))) {
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

// Cloud state
const CLOUDS = [
  { x: 50, y: 80, r: 28, speed: 0.3 },
  { x: 200, y: 50, r: 22, speed: 0.22 },
  { x: 320, y: 110, r: 18, speed: 0.18 },
  { x: 120, y: 140, r: 24, speed: 0.25 },
];

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

  // Clouds
  for (let cloud of CLOUDS) {
    drawCloud(cloud.x, cloud.y, cloud.r);
    // Animate cloud
    cloud.x += cloud.speed;
    if (cloud.x - cloud.r > canvas.width) {
      cloud.x = -cloud.r;
      cloud.y = 40 + Math.random() * 120;
      cloud.r = 16 + Math.random() * 18;
    }
  }

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
}

function drawCloud(x, y, r) {
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.8, y + r * 0.2, r * 0.7, 0, Math.PI * 2);
  ctx.arc(x - r * 0.7, y + r * 0.2, r * 0.6, 0, Math.PI * 2);
  ctx.arc(x + r * 0.3, y - r * 0.5, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;
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

let dynamicGap = PIPE_GAP;

function addPipe() {
  // Random gap position, use dynamicGap
  const minGapY = 60;
  const maxGapY = canvas.height - dynamicGap - 60;
  const gapY = Math.floor(Math.random() * (maxGapY - minGapY + 1)) + minGapY;
  pipes.push({
    x: canvas.width,
    gapY: gapY,
    gap: dynamicGap
  });
}

let gameStartTime = null;

function updatePipes() {
  // Increase speed based on elapsed time (seconds)
  let elapsed = 0;
  if (gameStartTime) {
    elapsed = (Date.now() - gameStartTime) / 1000;
  }
  pipeSpeed = Math.min(PIPE_SPEED + elapsed * 0.04, 7); // Max speed 7
  dynamicGap = PIPE_GAP + Math.min(elapsed * 0.5, 40); // Up to +40px wider
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].x -= pipeSpeed;
  }
  // Remove pipes that have gone off screen
  if (pipes.length && pipes[0].x + PIPE_WIDTH < 0) {
    pipes.shift();
  }
  // Add new pipe if needed (distance-based)
  if (pipes.length === 0 || (canvas.width - (pipes[pipes.length - 1].x)) >= PIPE_DISTANCE) {
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

// Play background music continuously unless muted or page hidden
function ensureMusicPlaying() {
  if (soundOn && !bgMusic.paused) return;
  if (soundOn) {
    bgMusic.play();
  }
}

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    bgMusic.pause();
  } else {
    ensureMusicPlaying();
  }
});

// Update sound toggle logic to pause/play music
function setAllSoundMuted(muted) {
  bgMusic.muted = muted;
  bounceSound.muted = muted;
  hitSound.muted = muted;
  swishSound.muted = muted;
  if (muted) {
    bgMusic.pause();
  } else {
    ensureMusicPlaying();
  }
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
    gameStartTime = Date.now();
    ensureMusicPlaying();
    currentScreen = 'game';
    gameLoop();
  });
}

function endGame() {
  gameRunning = false;
  gameOver = true;
  currentScreen = 'gameover';
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
  triggerDimEffect();
}

function drawGameOverScreen(dimEffect) {
  drawBackground();
  drawPipes();
  drawBird();
  // Overlay
  drawOverlay(0.5 * overlayAlpha);
  // Dim effect overlay
  if (dimEffect && dimAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = dimAlpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }
  // UI last
  ctx.save();
  ctx.globalAlpha = overlayAlpha;
  drawTitleText();
  drawScore();
  drawHighScore();
  // Basketball button for Restart
  const ballSize = 72;
  const ballX = canvas.width / 2 - ballSize / 2;
  const ballY = BUTTON_Y;
  drawBallButton('Restart', ballX, ballY, ballSize);
  drawButton('Share', SHARE_BUTTON_X, SHARE_BUTTON_Y, SHARE_BUTTON_WIDTH, SHARE_BUTTON_HEIGHT);
  drawSoundToggle();
  ctx.restore();
  ensureMusicPlaying();
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
  drawTitleText();
  drawScore();
  // Basketball button for Start
  const ballSize = 72;
  const ballX = canvas.width / 2 - ballSize / 2;
  const ballY = BUTTON_Y;
  drawBallButton('Start', ballX, ballY, ballSize);
  drawSoundToggle();
  // Instructions
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Hint: Tap or click to flap!', canvas.width / 2, ballY + ballSize + 24);
  ctx.restore();
  ensureMusicPlaying();
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
  const ballSize = 72;
  const ballX = canvas.width / 2 - ballSize / 2;
  const ballY = BUTTON_Y;
  // Check if basketball button is clicked (start or restart)
  if (!gameRunning && gameOver) {
    // Restart
    if (
      x >= ballX && x <= ballX + ballSize &&
      y >= ballY && y <= ballY + ballSize
    ) {
      startGame();
      return;
    }
    // Check if share button is clicked
    if (
      x >= SHARE_BUTTON_X && x <= SHARE_BUTTON_X + SHARE_BUTTON_WIDTH &&
      y >= SHARE_BUTTON_Y && y <= SHARE_BUTTON_Y + SHARE_BUTTON_HEIGHT
    ) {
      shareScore();
      return;
    }
  } else if (!gameRunning && !gameOver) {
    // Start
    if (
      x >= ballX && x <= ballX + ballSize &&
      y >= ballY && y <= ballY + ballSize
    ) {
      startGame();
      return;
    }
  } else if (gameRunning && !paused) {
    flap();
  }
}

function shareScore() {
  const shareText = `I scored ${highScore} in Flappy Basketball! 🏀 Can you beat me?`;
  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText);
  }
  // Twitter share
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  window.open(twitterUrl, '_blank');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'p' || e.key === 'P') {
    togglePause();
  }
});

// On initial load, set bgMusic.currentTime = 0
bgMusic.currentTime = 0;
overlayAlpha = 1;
if (basketballImg.complete) {
  drawStartScreen();
} else {
  basketballImg.onload = () => drawStartScreen();
}

// Ensure canvas event listeners are registered
canvas.addEventListener('mousedown', handleCanvasClick);
canvas.addEventListener('touchstart', function(e) { e.preventDefault(); handleCanvasClick(e); }); 

function drawBallButton(text, x, y, size) {
  // Draw basketball image as button
  ctx.save();
  ctx.globalAlpha = 0.97;
  ctx.drawImage(basketballImg, x, y, size, size);
  ctx.restore();
  // Draw text centered on the ball
  ctx.save();
  ctx.font = `bold ${Math.floor(size * 0.32)}px Arial`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#222';
  ctx.shadowBlur = 4;
  ctx.fillText(text, x + size / 2, y + size / 2 + 2);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawTitleText() {
  // Draw title text only (no ball)
  const titleY = BUTTON_Y - 90;
  ctx.save();
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = '#ff9800';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#222';
  ctx.shadowBlur = 6;
  ctx.fillText('Flappy Basketball', canvas.width / 2, titleY);
  ctx.shadowBlur = 0;
  ctx.restore();
} 