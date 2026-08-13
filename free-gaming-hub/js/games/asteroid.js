/* ==========================================================================
   Asteroid Attack Engine - Free Gaming Hub
   Features: Rotating vector spaceship, Splitting asteroids, Lives & High score
   ========================================================================== */

class AsteroidGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 620;
    this.canvas.height = 450;

    this.ship = { x: 310, y: 225, angle: 0, r: 15, vx: 0, vy: 0, lives: 3 };
    this.bullets = [];
    this.asteroids = [];

    this.score = 0;
    this.bestScore = StorageManager.getBestScore('asteroid');
    this.isRunning = false;
    this.keys = {};

    this.bindEvents();
  }

  init() {
    this.ship = { x: 310, y: 225, angle: 0, r: 15, vx: 0, vy: 0, lives: 3 };
    this.bullets = [];
    this.asteroids = [];
    this.score = 0;
    this.spawnAsteroids(5);
    this.updateHUD();
  }

  start() {
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
      this.asteroids.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: 30,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3
      });
    }
  }

  bindEvents() {
    this.keydownHandler = (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' && this.isRunning) {
        this.bullets.push({
          x: this.ship.x + Math.cos(this.ship.angle) * 20,
          y: this.ship.y + Math.sin(this.ship.angle) * 20,
          vx: Math.cos(this.ship.angle) * 10,
          vy: Math.sin(this.ship.angle) * 10
        });
        SoundManager.play('laser');
      }
    };
    this.keyupHandler = (e) => { this.keys[e.code] = false; };

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Rotation & Thrust
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.ship.angle -= 0.08;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) this.ship.angle += 0.08;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      this.ship.vx += Math.cos(this.ship.angle) * 0.2;
      this.ship.vy += Math.sin(this.ship.angle) * 0.2;
    }

    this.ship.x += this.ship.vx;
    this.ship.y += this.ship.vy;
    this.ship.vx *= 0.98; // Friction
    this.ship.vy *= 0.98;

    // Screen Wrap
    if (this.ship.x < 0) this.ship.x = 620;
    if (this.ship.x > 620) this.ship.x = 0;
    if (this.ship.y < 0) this.ship.y = 450;
    if (this.ship.y > 450) this.ship.y = 0;

    // Bullets
    this.bullets.forEach((b, bIdx) => {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < 0 || b.x > 620 || b.y < 0 || b.y > 450) this.bullets.splice(bIdx, 1);
    });

    // Asteroids
    this.asteroids.forEach((a, aIdx) => {
      a.x += a.vx;
      a.y += a.vy;

      if (a.x < 0) a.x = 620; if (a.x > 620) a.x = 0;
      if (a.y < 0) a.y = 450; if (a.y > 450) a.y = 0;

      // Bullet Hit Asteroid
      this.bullets.forEach((b, bIdx) => {
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.r) {
          SoundManager.play('hit');
          this.bullets.splice(bIdx, 1);
          this.score += 50;
          if (this.score > this.bestScore) this.bestScore = this.score;

          // Split Asteroid
          if (a.r > 15) {
            this.asteroids.push(
              { x: a.x, y: a.y, r: 15, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 },
              { x: a.x, y: a.y, r: 15, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 }
            );
          }
          this.asteroids.splice(aIdx, 1);
          this.updateHUD();

          if (this.asteroids.length === 0) this.spawnAsteroids(6);
        }
      });

      // Ship Collision
      if (Math.hypot(this.ship.x - a.x, this.ship.y - a.y) < this.ship.r + a.r) {
        this.ship.lives--;
        SoundManager.play('hit');
        this.ship.x = 310; this.ship.y = 225; this.ship.vx = 0; this.ship.vy = 0;
        this.updateHUD();
        if (this.ship.lives <= 0) this.gameOver();
      }
    });
  }

  draw() {
    this.ctx.fillStyle = '#05070f';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Ship
    this.ctx.strokeStyle = '#00f0ff';
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.beginPath();
    this.ctx.moveTo(
      this.ship.x + Math.cos(this.ship.angle) * 20,
      this.ship.y + Math.sin(this.ship.angle) * 20
    );
    this.ctx.lineTo(
      this.ship.x + Math.cos(this.ship.angle + 2.5) * 15,
      this.ship.y + Math.sin(this.ship.angle + 2.5) * 15
    );
    this.ctx.lineTo(
      this.ship.x + Math.cos(this.ship.angle - 2.5) * 15,
      this.ship.y + Math.sin(this.ship.angle - 2.5) * 15
    );
    this.ctx.closePath();
    this.ctx.stroke();

    // Bullets
    this.ctx.fillStyle = '#ff007f';
    this.bullets.forEach(b => {
      this.ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
    });

    // Asteroids
    this.ctx.strokeStyle = '#a855f7';
    this.ctx.shadowColor = '#a855f7';
    this.asteroids.forEach(a => {
      this.ctx.beginPath();
      this.ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      this.ctx.stroke();
    });

    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score} | Lives: ${'❤️'.repeat(Math.max(0, this.ship.lives))}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('asteroid', 'Asteroid Attack', this.score);
    if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
  }
}
