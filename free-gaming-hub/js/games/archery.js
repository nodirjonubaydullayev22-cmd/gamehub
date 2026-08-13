/* ==========================================================================
   Archery Game Engine - Free Gaming Hub
   Features: Bow & Arrow pull tension, Wind drift vector, Moving target rings
   ========================================================================== */

class ArcheryGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 600;
    this.canvas.height = 420;

    this.score = 0;
    this.arrowsLeft = 10;
    this.bestScore = StorageManager.getBestScore('archery');

    this.target = { x: 500, y: 200, r: 40, dy: 2 };
    this.arrow = { x: 80, y: 210, vx: 0, vy: 0, isFlying: false };
    this.wind = (Math.random() - 0.5) * 4;

    this.isPulling = false;
    this.pullPower = 0;
    this.isRunning = false;

    this.bindEvents();
  }

  init() {
    this.score = 0;
    this.arrowsLeft = 10;
    this.resetArrow();
    this.updateHUD();
  }

  resetArrow() {
    this.arrow = { x: 80, y: 210, vx: 0, vy: 0, isFlying: false };
    this.wind = (Math.random() - 0.5) * 3;
    this.isPulling = false;
    this.pullPower = 0;
  }

  start() {
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  bindEvents() {
    this.mousedownHandler = () => {
      if (!this.isRunning || this.arrow.isFlying) return;
      this.isPulling = true;
    };

    this.mouseupHandler = () => {
      if (!this.isRunning || !this.isPulling) return;
      this.releaseArrow();
    };

    this.canvas.addEventListener('mousedown', this.mousedownHandler);
    this.canvas.addEventListener('mouseup', this.mouseupHandler);
    this.canvas.addEventListener('touchstart', this.mousedownHandler);
    this.canvas.addEventListener('touchend', this.mouseupHandler);
  }

  releaseArrow() {
    this.isPulling = false;
    this.arrow.isFlying = true;
    this.arrow.vx = 14 + this.pullPower * 0.2;
    this.arrow.vy = -this.pullPower * 0.1;
    SoundManager.play('laser');
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Oscillate Pull Power
    if (this.isPulling && this.pullPower < 50) {
      this.pullPower += 1.2;
    }

    // Move Target
    this.target.y += this.target.dy;
    if (this.target.y - this.target.r < 40 || this.target.y + this.target.r > 380) {
      this.target.dy *= -1;
    }

    // Arrow Flight
    if (this.arrow.isFlying) {
      this.arrow.x += this.arrow.vx;
      this.arrow.y += this.arrow.vy + this.wind * 0.2;
      this.arrow.vy += 0.18; // Gravity

      // Target Collision
      const dist = Math.hypot(this.arrow.x - this.target.x, this.arrow.y - this.target.y);
      if (dist < this.target.r) {
        SoundManager.play('score');
        let pts = 20;
        if (dist < 10) pts = 100; // Bullseye
        else if (dist < 25) pts = 50;

        this.score += pts;
        if (this.score > this.bestScore) this.bestScore = this.score;
        this.arrowsLeft--;
        this.updateHUD();

        if (this.arrowsLeft <= 0) {
          this.gameOver();
        } else {
          this.resetArrow();
        }
      }

      // Out of bounds
      if (this.arrow.x > this.canvas.width + 20 || this.arrow.y > this.canvas.height + 20) {
        SoundManager.play('hit');
        this.arrowsLeft--;
        this.updateHUD();
        if (this.arrowsLeft <= 0) {
          this.gameOver();
        } else {
          this.resetArrow();
        }
      }
    }
  }

  draw() {
    this.ctx.fillStyle = '#0a0d18';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Target Rings
    const tx = this.target.x;
    const ty = this.target.y;

    const ringColors = ['#ef4444', '#3b82f6', '#eab308', '#ffffff'];
    const ringRadii = [this.target.r, this.target.r * 0.7, this.target.r * 0.4, 10];

    ringColors.forEach((color, i) => {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(tx, ty, ringRadii[i], 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Bow
    this.ctx.strokeStyle = '#a855f7';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(60, 210, 35, -Math.PI / 2, Math.PI / 2);
    this.ctx.stroke();

    // Pull Power Bar
    if (this.isPulling) {
      this.ctx.fillStyle = '#00f0ff';
      this.ctx.fillRect(40, 360, this.pullPower * 3, 10);
    }

    // Arrow
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(this.arrow.x, this.arrow.y);
    this.ctx.lineTo(this.arrow.x + 30, this.arrow.y);
    this.ctx.stroke();
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score} | Arrows Left: ${this.arrowsLeft} | Wind: ${this.wind.toFixed(1)}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('archery', 'Archery', this.score);
    if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    this.canvas.removeEventListener('mousedown', this.mousedownHandler);
    this.canvas.removeEventListener('mouseup', this.mouseupHandler);
  }
}
