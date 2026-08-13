/* ==========================================================================
   Bike Racing Engine - Free Gaming Hub
   Features: Motorcycle traffic dodge, Lane steering, Nitro boost & Coins
   ========================================================================== */

class BikeRacingGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 600;
    this.canvas.height = 450;

    this.player = { x: 280, y: 350, width: 36, height: 60, speed: 6 };
    this.obstacles = [];
    this.coins = [];

    this.score = 0;
    this.speed = 6;
    this.bestScore = StorageManager.getBestScore('bike-racing');
    this.isRunning = false;
    this.keys = {};

    this.bindEvents();
  }

  init() {
    this.player.x = 280;
    this.score = 0;
    this.speed = 6;
    this.obstacles = [];
    this.coins = [];
    this.updateHUD();
  }

  start() {
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  bindEvents() {
    this.keydownHandler = (e) => { this.keys[e.code] = true; };
    this.keyupHandler = (e) => { this.keys[e.code] = false; };
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
  }

  spawnObstacle() {
    if (Math.random() < 0.03) {
      const lanes = [160, 260, 360, 440];
      this.obstacles.push({
        x: lanes[Math.floor(Math.random() * lanes.length)],
        y: -70,
        width: 40,
        height: 70,
        color: '#ef4444'
      });
    }
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Steering
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.x = Math.max(120, this.player.x - 7);
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.x = Math.min(450, this.player.x + 7);
    }

    this.score += 1;
    if (this.score > this.bestScore) this.bestScore = this.score;

    this.spawnObstacle();

    // Move Obstacles
    this.obstacles.forEach((obs, idx) => {
      obs.y += this.speed;

      // Check Collision
      if (
        this.player.x < obs.x + obs.width &&
        this.player.x + this.player.width > obs.x &&
        this.player.y < obs.y + obs.height &&
        this.player.y + this.player.height > obs.y
      ) {
        SoundManager.play('hit');
        this.gameOver();
      }

      if (obs.y > this.canvas.height) this.obstacles.splice(idx, 1);
    });

    this.updateHUD();
  }

  draw() {
    // Road Background
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Highway Borders & Grass
    this.ctx.fillStyle = '#10b981';
    this.ctx.fillRect(0, 0, 120, this.canvas.height);
    this.ctx.fillRect(480, 0, 120, this.canvas.height);

    // Lane Markers
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([20, 20]);
    [240, 360].forEach(lx => {
      this.ctx.beginPath();
      this.ctx.moveTo(lx, 0);
      this.ctx.lineTo(lx, this.canvas.height);
      this.ctx.stroke();
    });
    this.ctx.setLineDash([]);

    // Player Bike (Neon Blue)
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    // Traffic Cars
    this.obstacles.forEach(obs => {
      this.ctx.fillStyle = obs.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = obs.color;
      this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Distance: ${this.score}m | Speed: ${this.speed * 10}km/h`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('bike-racing', 'Bike Racing', this.score);
    if (this.score >= 500) StorageManager.unlockAchievement('speed_demon');
    if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
  }
}
