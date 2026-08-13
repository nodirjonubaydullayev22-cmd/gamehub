/* ==========================================================================
   Penalty Shootout Game Engine - Free Gaming Hub
   Features: 3D Goal perspective, Goalkeeper AI, Power meter, 5 penalty rounds
   ========================================================================== */

class PenaltyGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 600;
    this.canvas.height = 420;

    this.rounds = 5;
    this.currentRound = 1;
    this.score = 0;
    this.bestScore = StorageManager.getBestScore('penalty');

    this.keeper = { x: 270, y: 150, width: 60, height: 70, targetX: 270 };
    this.ball = { x: 300, y: 350, r: 14, targetX: 300, targetY: 150, isShot: false };
    this.aim = { x: 300, y: 150, dx: 3 };

    this.isRunning = false;
    this.bindEvents();
  }

  init() {
    this.rounds = 5;
    this.currentRound = 1;
    this.score = 0;
    this.resetShot();
    this.updateHUD();
  }

  start() {
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  resetShot() {
    this.ball = { x: 300, y: 350, r: 14, targetX: 300, targetY: 150, isShot: false };
    this.keeper.x = 270;
    this.aim.x = 300;
  }

  bindEvents() {
    this.clickHandler = () => {
      if (!this.isRunning || this.ball.isShot) return;
      this.shoot();
    };

    this.canvas.addEventListener('click', this.clickHandler);
    this.canvas.addEventListener('touchstart', this.clickHandler);
  }

  shoot() {
    this.ball.isShot = true;
    this.ball.targetX = this.aim.x;

    // Keeper AI picks random dive direction
    const diveOptions = [160, 270, 380];
    this.keeper.targetX = diveOptions[Math.floor(Math.random() * diveOptions.length)];

    SoundManager.play('laser');

    setTimeout(() => {
      // Check Goal vs Save
      const keeperHitBoxMin = this.keeper.targetX - 25;
      const keeperHitBoxMax = this.keeper.targetX + this.keeper.width + 25;

      if (this.ball.targetX >= keeperHitBoxMin && this.ball.targetX <= keeperHitBoxMax) {
        // Saved by Keeper
        SoundManager.play('hit');
      } else {
        // GOAL!
        this.score += 100;
        SoundManager.play('win');
        if (this.score > this.bestScore) this.bestScore = this.score;
      }

      this.currentRound++;
      this.updateHUD();

      if (this.currentRound > this.rounds) {
        this.gameOver();
      } else {
        setTimeout(() => this.resetShot(), 1000);
      }
    }, 600);
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    if (!this.ball.isShot) {
      // Move Aim Reticle
      this.aim.x += this.aim.dx;
      if (this.aim.x < 150 || this.aim.x > 450) this.aim.dx *= -1;
    } else {
      // Move Ball toward Target
      this.ball.x += (this.ball.targetX - this.ball.x) * 0.15;
      this.ball.y += (this.ball.targetY - this.ball.y) * 0.15;

      // Move Keeper toward target dive
      this.keeper.x += (this.keeper.targetX - this.keeper.x) * 0.15;
    }
  }

  draw() {
    // Stadium / Grass Pitch
    this.ctx.fillStyle = '#06130b';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Goal Post Frame
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 6;
    this.ctx.strokeRect(120, 90, 360, 160);

    // Net Pattern
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;
    for (let x = 120; x <= 480; x += 15) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 90);
      this.ctx.lineTo(x, 250);
      this.ctx.stroke();
    }

    // Goalkeeper Sprite (Neon Cyan/Green)
    this.ctx.fillStyle = '#10b981';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#10b981';
    this.ctx.fillRect(this.keeper.x, this.keeper.y, this.keeper.width, this.keeper.height);

    // Aim Reticle
    if (!this.ball.isShot) {
      this.ctx.strokeStyle = '#ff007f';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(this.aim.x, this.aim.y, 18, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Football
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = '#ffffff';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score} | Penalty: ${Math.min(this.currentRound, 5)} / 5`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('penalty', 'Penalty Shootout', this.score);
    if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
  }

  destroy() {
    this.isRunning = false;
    this.canvas.removeEventListener('click', this.clickHandler);
  }
}
