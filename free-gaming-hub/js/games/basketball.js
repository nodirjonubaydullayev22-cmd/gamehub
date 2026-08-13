/* ==========================================================================
   Arcade Basketball Engine - Free Gaming Hub
   Features: Trajectory arc physics, power meter, hoop net collision & combos
   ========================================================================== */

class BasketballGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 600;
    this.canvas.height = 420;

    this.ball = { x: 100, y: 320, r: 16, vx: 0, vy: 0, isShot: false };
    this.hoop = { x: 480, y: 150, r: 24 };

    this.score = 0;
    this.combo = 0;
    this.timeLeft = 60; // seconds
    this.bestScore = StorageManager.getBestScore('basketball');

    this.isAiming = false;
    this.aimPower = 0;
    this.powerDir = 1;
    this.isRunning = false;

    this.bindEvents();
  }

  init() {
    this.score = 0;
    this.combo = 0;
    this.timeLeft = 60;
    this.resetBall();
    this.updateHUD();
  }

  start() {
    this.init();
    this.isRunning = true;
    this.timerInterval = setInterval(() => {
      if (this.isRunning) {
        this.timeLeft--;
        this.updateHUD();
        if (this.timeLeft <= 0) this.gameOver();
      }
    }, 1000);
    this.gameLoop();
  }

  resetBall() {
    this.ball = { x: 100, y: 320, r: 16, vx: 0, vy: 0, isShot: false };
    this.isAiming = false;
  }

  bindEvents() {
    this.mousedownHandler = (e) => {
      if (!this.isRunning || this.ball.isShot) return;
      this.isAiming = true;
    };

    this.mouseupHandler = (e) => {
      if (!this.isRunning || !this.isAiming) return;
      this.shootBall(e);
    };

    this.canvas.addEventListener('mousedown', this.mousedownHandler);
    this.canvas.addEventListener('mouseup', this.mouseupHandler);
    this.canvas.addEventListener('touchstart', this.mousedownHandler);
    this.canvas.addEventListener('touchend', this.mouseupHandler);
  }

  shootBall(e) {
    this.isAiming = false;
    this.ball.isShot = true;

    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || 400;
    const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY) || 200;

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const dx = mouseX - this.ball.x;
    const dy = mouseY - this.ball.y;

    const angle = Math.atan2(dy, dx);
    const speed = Math.min(18, Math.max(10, Math.sqrt(dx * dx + dy * dy) / 15));

    this.ball.vx = Math.cos(angle) * speed * 1.5;
    this.ball.vy = Math.sin(angle) * speed * 1.5;
    SoundManager.play('laser');
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    if (this.ball.isShot) {
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      this.ball.vy += 0.45; // Gravity

      // Check Net Score
      const dist = Math.hypot(this.ball.x - this.hoop.x, this.ball.y - this.hoop.y);
      if (dist < this.hoop.r && this.ball.vy > 0) {
        this.combo++;
        const points = 2 * this.combo;
        this.score += points;
        SoundManager.play('score');
        if (this.score > this.bestScore) this.bestScore = this.score;
        this.updateHUD();
        this.resetBall();
      }

      // Out of Bounds
      if (this.ball.y > this.canvas.height + 20 || this.ball.x > this.canvas.width + 20) {
        this.combo = 0;
        SoundManager.play('hit');
        this.resetBall();
      }
    }
  }

  draw() {
    // Court Background
    this.ctx.fillStyle = '#0a0c16';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Basketball Hoop Backboard
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(490, 80, 10, 100);

    // Rim & Net
    this.ctx.strokeStyle = '#f97316';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(this.hoop.x, this.hoop.y, this.hoop.r, 0, Math.PI);
    this.ctx.stroke();

    // Trajectory Aim Line
    if (this.isAiming) {
      this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.ball.x, this.ball.y);
      this.ctx.lineTo(this.hoop.x, this.hoop.y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Basketball
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = '#f97316';
    const ballGrad = this.ctx.createRadialGradient(this.ball.x - 3, this.ball.y - 3, 2, this.ball.x, this.ball.y, this.ball.r);
    ballGrad.addColorStop(0, '#fdba74');
    ballGrad.addColorStop(0.6, '#f97316');
    ballGrad.addColorStop(1, '#c2410c');

    this.ctx.fillStyle = ballGrad;
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score} | Combo: x${this.combo} | Time: ${this.timeLeft}s`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    const saveRes = StorageManager.saveScore('basketball', 'Basketball', this.score);
    if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.canvas.removeEventListener('mousedown', this.mousedownHandler);
    this.canvas.removeEventListener('mouseup', this.mouseupHandler);
  }
}
