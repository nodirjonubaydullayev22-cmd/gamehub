/* ==========================================================================
   Stickman Fight Engine - Free Gaming Hub
   Features: Stickman skeletal physics, Punch/Kick combos, Enemy waves
   ========================================================================== */

class StickmanGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 600;
    this.canvas.height = 400;

    this.player = { x: 150, y: 280, hp: 100, isPunching: false, isKicking: false };
    this.enemies = [];
    this.score = 0;
    this.bestScore = StorageManager.getBestScore('stickman');
    this.isRunning = false;

    this.bindEvents();
  }

  init() {
    this.player = { x: 150, y: 280, hp: 100, isPunching: false, isKicking: false };
    this.enemies = [];
    this.score = 0;
    this.spawnEnemy();
    this.updateHUD();
  }

  start() {
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  spawnEnemy() {
    this.enemies.push({ x: 620, y: 280, hp: 30, speed: 1.8 });
  }

  bindEvents() {
    this.keydownHandler = (e) => {
      if (!this.isRunning) return;
      if (e.key === 'a' || e.key === 'A') this.attack('punch');
      if (e.key === 's' || e.key === 'S') this.attack('kick');
    };
    window.addEventListener('keydown', this.keydownHandler);
  }

  attack(type) {
    if (type === 'punch') this.player.isPunching = true;
    if (type === 'kick') this.player.isKicking = true;
    SoundManager.play('hit');

    this.enemies.forEach((enemy, idx) => {
      if (Math.abs(enemy.x - this.player.x) < 80) {
        enemy.hp -= 20;
        this.score += 50;
        if (this.score > this.bestScore) this.bestScore = this.score;
        this.updateHUD();

        if (enemy.hp <= 0) {
          this.enemies.splice(idx, 1);
          setTimeout(() => this.spawnEnemy(), 800);
        }
      }
    });

    setTimeout(() => {
      this.player.isPunching = false;
      this.player.isKicking = false;
    }, 250);
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    this.enemies.forEach(enemy => {
      if (enemy.x > this.player.x + 40) {
        enemy.x -= enemy.speed;
      } else {
        // Enemy Hits Player
        this.player.hp -= 0.5;
        this.updateHUD();
        if (this.player.hp <= 0) this.gameOver();
      }
    });
  }

  draw() {
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Floor
    this.ctx.strokeStyle = '#a855f7';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 340);
    this.ctx.lineTo(600, 340);
    this.ctx.stroke();

    // Draw Player Stickman
    this.drawStickFigure(this.player.x, this.player.y, '#00f0ff', this.player.isPunching, this.player.isKicking);

    // Draw Enemies
    this.enemies.forEach(enemy => {
      this.drawStickFigure(enemy.x, enemy.y, '#ff007f', false, false);
    });
  }

  drawStickFigure(x, y, color, isPunch, isKick) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 4;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = color;

    // Head
    this.ctx.beginPath();
    this.ctx.arc(x, y - 40, 12, 0, Math.PI * 2);
    this.ctx.stroke();

    // Spine
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - 28);
    this.ctx.lineTo(x, y + 20);
    this.ctx.stroke();

    // Arms
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - 15);
    this.ctx.lineTo(isPunch ? x + 35 : x - 15, y - 15);
    this.ctx.stroke();

    // Legs
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 20);
    this.ctx.lineTo(x - 15, y + 60);
    this.ctx.moveTo(x, y + 20);
    this.ctx.lineTo(isKick ? x + 35 : x + 15, isKick ? y + 20 : y + 60);
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Player HP: ${Math.max(0, Math.floor(this.player.hp))} | Score: ${this.score}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('stickman', 'Stickman Fight', this.score);
    if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.keydownHandler);
  }
}
