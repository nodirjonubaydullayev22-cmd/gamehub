/* ==========================================================================
   Arcade Boxing Engine - Free Gaming Hub
   Features: Punch (A), Block (S), Dodge (D), AI boxer actions, KO system
   ========================================================================== */

class BoxingGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 600;
    this.canvas.height = 400;

    this.player = { x: 180, y: 220, hp: 100, state: 'idle' };
    this.ai = { x: 420, y: 220, hp: 100, state: 'idle' };

    this.score = 0;
    this.bestScore = StorageManager.getBestScore('boxing');
    this.isRunning = false;
    this.keys = {};

    this.bindEvents();
  }

  init() {
    this.player = { x: 180, y: 220, hp: 100, state: 'idle' };
    this.ai = { x: 420, y: 220, hp: 100, state: 'idle' };
    this.score = 0;
    this.updateHUD();
  }

  start() {
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  bindEvents() {
    this.keydownHandler = (e) => {
      if (!this.isRunning) return;
      if (e.key === 'a' || e.key === 'A') this.performAction('punch');
      if (e.key === 's' || e.key === 'S') this.performAction('block');
      if (e.key === 'd' || e.key === 'D') this.performAction('dodge');
    };
    window.addEventListener('keydown', this.keydownHandler);
  }

  performAction(action) {
    if (this.player.state !== 'idle') return;

    this.player.state = action;

    if (action === 'punch') {
      SoundManager.play('hit');
      if (this.ai.state !== 'block' && this.ai.state !== 'dodge') {
        this.ai.hp -= 15;
        this.score += 100;
        if (this.score > this.bestScore) this.bestScore = this.score;
        this.updateHUD();
        if (this.ai.hp <= 0) this.gameOver(true);
      }
    }

    setTimeout(() => {
      this.player.state = 'idle';
    }, 300);

    // AI Counter Attack
    if (Math.random() > 0.4) {
      setTimeout(() => this.aiAttack(), 200);
    }
  }

  aiAttack() {
    if (this.ai.state !== 'idle') return;

    this.ai.state = 'punch';
    if (this.player.state !== 'block' && this.player.state !== 'dodge') {
      this.player.hp -= 12;
      SoundManager.play('hit');
      this.updateHUD();
      if (this.player.hp <= 0) this.gameOver(false);
    }

    setTimeout(() => {
      this.ai.state = 'idle';
    }, 300);
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  draw() {
    // Ring Background
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Ropes
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 4;
    [100, 140, 180].forEach(y => {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(600, y);
      this.ctx.stroke();
    });

    // Player Boxer (Cyan)
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#00f0ff';
    const px = this.player.state === 'punch' ? this.player.x + 30 : (this.player.state === 'dodge' ? this.player.x - 30 : this.player.x);
    this.ctx.fillRect(px, this.player.y, 50, 110);

    // AI Boxer (Purple)
    this.ctx.fillStyle = '#a855f7';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#a855f7';
    const ax = this.ai.state === 'punch' ? this.ai.x - 30 : this.ai.x;
    this.ctx.fillRect(ax, this.ai.y, 50, 110);

    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Player HP: ${Math.max(0, this.player.hp)} | AI HP: ${Math.max(0, this.ai.hp)} | Score: ${this.score}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver(playerWon) {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('boxing', 'Boxing', this.score, playerWon);
    if (this.onGameOver) this.onGameOver(playerWon ? 'KNOCKOUT VICTORY! 🥊' : 'KNOCKED OUT! 😵', playerWon, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.keydownHandler);
  }
}
