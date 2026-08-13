/* ==========================================================================
   Zombie Shooter Engine - Free Gaming Hub
   Features: 360-degree arena shooter, crosshair aiming, blood particles & hordes
   ========================================================================== */

class ZombieShooterGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 620;
    this.canvas.height = 450;

    this.player = { x: 310, y: 225, r: 14, speed: 4, hp: 100 };
    this.bullets = [];
    this.zombies = [];
    this.particles = [];

    this.score = 0;
    this.bestScore = StorageManager.getBestScore('zombie-shooter');
    this.isRunning = false;
    this.keys = {};

    this.bindEvents();
  }

  init() {
    this.player = { x: 310, y: 225, r: 14, speed: 4, hp: 100 };
    this.bullets = [];
    this.zombies = [];
    this.particles = [];
    this.score = 0;
    this.spawnHorde(8);
    this.updateHUD();
  }

  start() {
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  spawnHorde(count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 380;
      this.zombies.push({
        x: this.player.x + Math.cos(angle) * dist,
        y: this.player.y + Math.sin(angle) * dist,
        r: 12,
        speed: 1.5 + Math.random() * 0.5,
        hp: 25
      });
    }
  }

  bindEvents() {
    this.keydownHandler = (e) => { this.keys[e.code] = true; };
    this.keyupHandler = (e) => { this.keys[e.code] = false; };

    this.clickHandler = (e) => {
      if (!this.isRunning) return;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const angle = Math.atan2(mouseY - this.player.y, mouseX - this.player.x);
      this.bullets.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * 14,
        vy: Math.sin(angle) * 14
      });
      SoundManager.play('laser');
    };

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    this.canvas.addEventListener('click', this.clickHandler);
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Player WASD Move
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.player.x = Math.max(20, this.player.x - this.player.speed);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) this.player.x = Math.min(600, this.player.x + this.player.speed);
    if (this.keys['KeyW'] || this.keys['ArrowUp']) this.player.y = Math.max(20, this.player.y - this.player.speed);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) this.player.y = Math.min(430, this.player.y + this.player.speed);

    // Bullets
    this.bullets.forEach((b, bIdx) => {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < 0 || b.x > 620 || b.y < 0 || b.y > 450) this.bullets.splice(bIdx, 1);
    });

    // Zombies
    this.zombies.forEach((z, zIdx) => {
      const angle = Math.atan2(this.player.y - z.y, this.player.x - z.x);
      z.x += Math.cos(angle) * z.speed;
      z.y += Math.sin(angle) * z.speed;

      // Zombie Touch Damage
      if (Math.hypot(this.player.x - z.x, this.player.y - z.y) < this.player.r + z.r) {
        this.player.hp -= 0.6;
        this.updateHUD();
        if (this.player.hp <= 0) this.gameOver();
      }

      // Bullet Collision
      this.bullets.forEach((b, bIdx) => {
        if (Math.hypot(b.x - z.x, b.y - z.y) < z.r + 4) {
          z.hp -= 15;
          this.bullets.splice(bIdx, 1);
          SoundManager.play('hit');

          if (z.hp <= 0) {
            this.zombies.splice(zIdx, 1);
            this.score += 80;
            if (this.score > this.bestScore) this.bestScore = this.score;
            this.updateHUD();

            if (this.zombies.length === 0) this.spawnHorde(10);
          }
        }
      });
    });
  }

  draw() {
    this.ctx.fillStyle = '#060a0f';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Bullets
    this.ctx.fillStyle = '#00f0ff';
    this.bullets.forEach(b => {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Zombies (Red Eye Core)
    this.zombies.forEach(z => {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#ef4444';
      this.ctx.beginPath();
      this.ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Player (Cyan)
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score} | Health: ${Math.max(0, Math.floor(this.player.hp))}%`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('zombie-shooter', 'Zombie Shooter', this.score);
    if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    this.canvas.removeEventListener('click', this.clickHandler);
  }
}
