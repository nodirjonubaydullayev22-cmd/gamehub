/* ==========================================================================
   8 Ball Pool Engine - Free Gaming Hub
   Features: Billiard table physics, Cue stick aim line, Ball elastic collisions, Pockets
   ========================================================================== */

class PoolGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 640;
    this.canvas.height = 360;

    this.score = 0;
    this.bestScore = StorageManager.getBestScore('pool');

    this.pockets = [
      { x: 30, y: 30 }, { x: 320, y: 25 }, { x: 610, y: 30 },
      { x: 30, y: 330 }, { x: 320, y: 335 }, { x: 610, y: 330 }
    ];

    this.balls = [];
    this.cueBall = null;
    this.aimAngle = 0;
    this.cuePower = 0;
    this.isAiming = false;
    this.isRunning = false;

    this.bindEvents();
  }

  init() {
    this.score = 0;
    this.initBalls();
    this.updateHUD();
  }

  initBalls() {
    this.balls = [];
    // Cue Ball
    this.cueBall = { x: 180, y: 180, r: 10, vx: 0, vy: 0, color: '#ffffff', isCue: true };
    this.balls.push(this.cueBall);

    // Object Balls Triangle Rack
    const colors = ['#00f0ff', '#ff007f', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#111827'];
    let startX = 420;
    let startY = 180;
    let colorIdx = 0;

    for (let col = 0; col < 3; col++) {
      for (let row = 0; row <= col; row++) {
        const bx = startX + col * 18;
        const by = startY + (row - col / 2) * 20;
        this.balls.push({
          x: bx, y: by, r: 10, vx: 0, vy: 0,
          color: colors[colorIdx % colors.length]
        });
        colorIdx++;
      }
    }
  }

  start() {
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  bindEvents() {
    this.mousemoveHandler = (e) => {
      if (!this.isRunning) return;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      this.aimAngle = Math.atan2(mouseY - this.cueBall.y, mouseX - this.cueBall.x);
    };

    this.clickHandler = () => {
      if (!this.isRunning || this.isMoving()) return;
      // Strike Cue Ball
      const speed = 12;
      this.cueBall.vx = Math.cos(this.aimAngle) * speed;
      this.cueBall.vy = Math.sin(this.aimAngle) * speed;
      SoundManager.play('hit');
    };

    this.canvas.addEventListener('mousemove', this.mousemoveHandler);
    this.canvas.addEventListener('click', this.clickHandler);
    this.canvas.addEventListener('touchstart', this.clickHandler);
  }

  isMoving() {
    return this.balls.some(b => Math.abs(b.vx) > 0.05 || Math.abs(b.vy) > 0.05);
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Ball Movement & Friction
    this.balls.forEach((b, i) => {
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= 0.985; // Friction
      b.vy *= 0.985;

      // Table Cushions Collision
      if (b.x - b.r < 30 || b.x + b.r > 610) b.vx *= -1;
      if (b.y - b.r < 30 || b.y + b.r > 330) b.vy *= -1;

      // Pocket Detection
      this.pockets.forEach(p => {
        if (Math.hypot(b.x - p.x, b.y - p.y) < 18) {
          if (b.isCue) {
            // Reset Cue Ball Scratch
            b.x = 180; b.y = 180; b.vx = 0; b.vy = 0;
            SoundManager.play('hit');
          } else {
            // Pocketed Object Ball
            this.score += 150;
            SoundManager.play('score');
            this.balls.splice(i, 1);
            if (this.score > this.bestScore) this.bestScore = this.score;
            this.updateHUD();

            if (this.balls.length <= 1) {
              this.gameOver();
            }
          }
        }
      });
    });

    // Elastic Ball-to-Ball Collisions
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const b1 = this.balls[i];
        const b2 = this.balls[j];
        const dist = Math.hypot(b2.x - b1.x, b2.y - b1.y);

        if (dist < b1.r + b2.r) {
          const angle = Math.atan2(b2.y - b1.y, b2.x - b1.x);
          const speed1 = Math.hypot(b1.vx, b1.vy);
          const speed2 = Math.hypot(b2.vx, b2.vy);

          b1.vx = -Math.cos(angle) * speed1 * 0.9;
          b1.vy = -Math.sin(angle) * speed1 * 0.9;
          b2.vx = Math.cos(angle) * (speed1 + speed2) * 0.9;
          b2.vy = Math.sin(angle) * (speed1 + speed2) * 0.9;
        }
      }
    }
  }

  draw() {
    // Table Felt (Green Gradient)
    this.ctx.fillStyle = '#062612';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Wood Border Cushion
    this.ctx.strokeStyle = '#3f1d0b';
    this.ctx.lineWidth = 20;
    this.ctx.strokeRect(10, 10, 620, 340);

    // Inner Rail Line
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(28, 28, 584, 304);

    // Pockets
    this.ctx.fillStyle = '#000000';
    this.pockets.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Cue Stick Aim Line
    if (!this.isMoving() && this.cueBall) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([6, 6]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.cueBall.x, this.cueBall.y);
      this.ctx.lineTo(this.cueBall.x + Math.cos(this.aimAngle) * 150, this.cueBall.y + Math.sin(this.aimAngle) * 150);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Balls
    this.balls.forEach(b => {
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = b.color;
      this.ctx.fillStyle = b.color;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score} | Balls Left: ${this.balls.length - 1}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('pool', '8 Ball Pool', this.score);
    if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    this.canvas.removeEventListener('mousemove', this.mousemoveHandler);
    this.canvas.removeEventListener('click', this.clickHandler);
  }
}
