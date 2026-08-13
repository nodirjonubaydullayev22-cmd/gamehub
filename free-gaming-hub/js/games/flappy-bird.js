/* ==========================================================================
   Flappy Bird Engine - Free Gaming Hub
   Features: Gravity jump impulse, Metallic pipe gap spawner, Score counter
   ========================================================================== */

class FlappyBirdGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 600;
    this.canvas.height = 450;

    this.bird = { x: 120, y: 220, r: 14, vy: 0, gravity: 0.45, jump: -8 };
    this.pipes = [];
    this.score = 0;
    this.bestScore = StorageManager.getBestScore('flappy-bird');
    this.isRunning = false;

    this.bindEvents();
  }

  init() {
    this.bird = { x: 120, y: 220, r: 14, vy: 0, gravity: 0.45, jump: -8 };
    this.pipes = [];
    this.score = 0;
    this.spawnPipe();
    this.updateHUD();
  }

  start() {
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  spawnPipe() {
    const gap = 120;
    const topHeight = Math.floor(Math.random() * (this.canvas.height - gap - 100)) + 40;
    this.pipes.push({
      x: this.canvas.width,
      top: topHeight,
      bottom: this.canvas.height - topHeight - gap,
      width: 55,
      passed: false
    });
  }

  bindEvents() {
    this.clickHandler = () => {
      if (!this.isRunning) return;
      this.bird.vy = this.bird.jump;
      SoundManager.play('laser');
    };

    this.canvas.addEventListener('click', this.clickHandler);
    this.canvas.addEventListener('touchstart', this.clickHandler);
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Bird Gravity
    this.bird.vy += this.bird.gravity;
    this.bird.y += this.bird.vy;

    // Floor/Ceiling Hit
    if (this.bird.y - this.bird.r < 0 || this.bird.y + this.bird.r > this.canvas.height) {
      SoundManager.play('hit');
      this.gameOver();
      return;
    }

    // Pipe Movement & Collision
    if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.canvas.width - 220) {
      this.spawnPipe();
    }

    this.pipes.forEach((pipe, idx) => {
      pipe.x -= 3;

      // Pipe Collision Check
      if (
        this.bird.x + this.bird.r > pipe.x &&
        this.bird.x - this.bird.r < pipe.x + pipe.width
      ) {
        if (this.bird.y - this.bird.r < pipe.top || this.bird.y + this.bird.r > this.canvas.height - pipe.bottom) {
          SoundManager.play('hit');
          this.gameOver();
        }
      }

      // Score Point
      if (!pipe.passed && pipe.x < this.bird.x) {
        pipe.passed = true;
        this.score += 1;
        SoundManager.play('score');
        if (this.score > this.bestScore) this.bestScore = this.score;
        this.updateHUD();
      }

      if (pipe.x < -pipe.width) this.pipes.splice(idx, 1);
    });
  }

  draw() {
    // Sky Background
    this.ctx.fillStyle = '#0b1329';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Pipes (Neon Green)
    this.pipes.forEach(pipe => {
      this.ctx.fillStyle = '#10b981';
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = '#10b981';

      // Top Pipe
      this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
      // Bottom Pipe
      this.ctx.fillRect(pipe.x, this.canvas.height - pipe.bottom, pipe.width, pipe.bottom);
    });

    // Bird (Neon Yellow/Pink)
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#f59e0b';
    this.ctx.beginPath();
    this.ctx.arc(this.bird.x, this.bird.y, this.bird.r, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('flappy-bird', 'Flappy Bird', this.score);
    if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    this.canvas.removeEventListener('click', this.clickHandler);
  }
}
