/* ==========================================================================
   Tower Defense Engine - Free Gaming Hub
   Features: Path grid map, Enemy waves, 4 Turret types, Coin economy & Upgrades
   ========================================================================== */

class TowerDefenseGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 620;
    this.canvas.height = 420;

    this.score = 0;
    this.coins = 250;
    this.baseHP = 20;
    this.wave = 1;
    this.bestScore = StorageManager.getBestScore('tower-defense');

    this.path = [
      { x: 0, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 300 },
      { x: 420, y: 300 }, { x: 420, y: 180 }, { x: 620, y: 180 }
    ];

    this.towers = [];
    this.enemies = [];
    this.bullets = [];
    this.selectedTowerType = 'basic';
    this.isRunning = false;

    this.bindEvents();
  }

  init() {
    this.score = 0;
    this.coins = 250;
    this.baseHP = 20;
    this.wave = 1;
    this.towers = [];
    this.enemies = [];
    this.bullets = [];
    this.spawnWave();
    this.updateHUD();
  }

  start() {
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  spawnWave() {
    for (let i = 0; i < 5 + this.wave * 3; i++) {
      this.enemies.push({
        x: -i * 35,
        y: 100,
        pathIndex: 0,
        hp: 20 + this.wave * 10,
        maxHP: 20 + this.wave * 10,
        speed: 1.2 + Math.random() * 0.4,
        reward: 15
      });
    }
  }

  bindEvents() {
    this.clickHandler = (e) => {
      if (!this.isRunning) return;
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const cost = 100;
      if (this.coins >= cost) {
        this.towers.push({ x: clickX, y: clickY, r: 15, range: 100, lastShot: 0, rate: 400 });
        this.coins -= cost;
        SoundManager.play('click');
        this.updateHUD();
      }
    };

    this.canvas.addEventListener('click', this.clickHandler);
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    const now = performance.now();

    // Tower Shooting
    this.towers.forEach(t => {
      if (now - t.lastShot >= t.rate) {
        const target = this.enemies.find(e => e.x > 0 && Math.hypot(e.x - t.x, e.y - t.y) < t.range);
        if (target) {
          this.bullets.push({ x: t.x, y: t.y, tx: target.x, ty: target.y, target, damage: 12, speed: 8 });
          t.lastShot = now;
          SoundManager.play('laser');
        }
      }
    });

    // Bullet Trajectory
    this.bullets.forEach((b, idx) => {
      const angle = Math.atan2(b.ty - b.y, b.tx - b.x);
      b.x += Math.cos(angle) * b.speed;
      b.y += Math.sin(angle) * b.speed;

      if (Math.hypot(b.tx - b.x, b.ty - b.y) < 10) {
        if (b.target && this.enemies.includes(b.target)) {
          b.target.hp -= b.damage;
          if (b.target.hp <= 0) {
            this.coins += b.target.reward;
            this.score += 50;
            if (this.score > this.bestScore) this.bestScore = this.score;
            this.enemies.splice(this.enemies.indexOf(b.target), 1);
            SoundManager.play('score');
            this.updateHUD();
          }
        }
        this.bullets.splice(idx, 1);
      }
    });

    // Enemy Path Following
    this.enemies.forEach((e, idx) => {
      const targetPoint = this.path[e.pathIndex + 1];
      if (!targetPoint) {
        this.baseHP--;
        this.enemies.splice(idx, 1);
        SoundManager.play('hit');
        this.updateHUD();
        if (this.baseHP <= 0) this.gameOver();
        return;
      }

      const angle = Math.atan2(targetPoint.y - e.y, targetPoint.x - e.x);
      e.x += Math.cos(angle) * e.speed;
      e.y += Math.sin(angle) * e.speed;

      if (Math.hypot(targetPoint.x - e.x, targetPoint.y - e.y) < 5) {
        e.pathIndex++;
      }
    });

    // Next Wave
    if (this.enemies.length === 0) {
      this.wave++;
      this.spawnWave();
      this.updateHUD();
    }
  }

  draw() {
    this.ctx.fillStyle = '#061009';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Path Line
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 30;
    this.ctx.beginPath();
    this.ctx.moveTo(this.path[0].x, this.path[0].y);
    for (let i = 1; i < this.path.length; i++) {
      this.ctx.lineTo(this.path[i].x, this.path[i].y);
    }
    this.ctx.stroke();

    // Towers
    this.towers.forEach(t => {
      this.ctx.fillStyle = '#00f0ff';
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Bullets
    this.ctx.fillStyle = '#ff007f';
    this.bullets.forEach(b => {
      this.ctx.fillRect(b.x - 2, b.y - 2, 5, 5);
    });

    // Enemies
    this.enemies.forEach(e => {
      if (e.x > 0) {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score} | Wave: ${this.wave} | Coins: $${this.coins} | Base HP: ${this.baseHP}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('tower-defense', 'Tower Defense', this.score);
    if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    this.canvas.removeEventListener('click', this.clickHandler);
  }
}
