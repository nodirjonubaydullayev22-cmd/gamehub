/* ==========================================================================
   Car Racing Engine - Free Gaming Hub
   Features: 3-Lane Asphalt track, Sports Car Steering, Nitro Boost & Collision
   ========================================================================== */

class CarRacingGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 600;
    this.canvas.height = 450;

    this.player = { x: 275, y: 340, width: 44, height: 75, speed: 7 };
    this.traffic = [];

    this.score = 0;
    this.nitro = 100;
    this.bestScore = StorageManager.getBestScore('car-racing');
    this.isRunning = false;
    this.keys = {};

    this.bindEvents();
  }

  init() {
    this.player.x = 275;
    this.score = 0;
    this.nitro = 100;
    this.traffic = [];
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

  spawnTraffic() {
    if (Math.random() < 0.035) {
      const lanes = [150, 275, 390];
      this.traffic.push({
        x: lanes[Math.floor(Math.random() * lanes.length)],
        y: -90,
        width: 44,
        height: 75,
        color: Math.random() > 0.5 ? '#ff007f' : '#a855f7'
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
    // Steering & Nitro
    let speedMult = 1;
    if (this.keys['Space'] && this.nitro > 0) {
      speedMult = 1.6;
      this.nitro -= 0.5;
      AchievementManager.unlock('speed_runner');
    }

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.player.x = Math.max(120, this.player.x - 7 * speedMult);
    if (this.keys['ArrowRight'] || this.keys['KeyD']) this.player.x = Math.min(430, this.player.x + 7 * speedMult);

    this.score += Math.floor(1 * speedMult);
    if (this.score > this.bestScore) this.bestScore = this.score;

    this.spawnTraffic();

    // Move Traffic Cars
    this.traffic.forEach((car, idx) => {
      car.y += this.player.speed * speedMult;

      // Check Collision
      if (
        this.player.x < car.x + car.width &&
        this.player.x + this.player.width > car.x &&
        this.player.y < car.y + car.height &&
        this.player.y + this.player.height > car.y
      ) {
        SoundManager.play('hit');
        ParticleManager.triggerScreenShake(this.canvas, 400, 12);
        this.gameOver();
      }

      if (car.y > this.canvas.height) this.traffic.splice(idx, 1);
    });

    this.updateHUD();
  }

  draw() {
    // Road Asphalt
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grass Shoulder Borders
    this.ctx.fillStyle = '#065f46';
    this.ctx.fillRect(0, 0, 110, this.canvas.height);
    this.ctx.fillRect(490, 0, 110, this.canvas.height);

    // Dotted Lane Lines
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([25, 25]);
    [230, 360].forEach(lx => {
      this.ctx.beginPath();
      this.ctx.moveTo(lx, 0);
      this.ctx.lineTo(lx, this.canvas.height);
      this.ctx.stroke();
    });
    this.ctx.setLineDash([]);

    // Player Sports Car (Cyan)
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.shadowBlur = 18;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    // Traffic Cars
    this.traffic.forEach(car => {
      this.ctx.fillStyle = car.color;
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = car.color;
      this.ctx.fillRect(car.x, car.y, car.width, car.height);
    });
    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Distance: ${this.score}m | Nitro: ${Math.floor(this.nitro)}%`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('car-racing', 'Car Racing', this.score);
    if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
  }
}
