/* ==========================================================================
   Ping Pong Game Engine - Ultra Cyberpunk Photon Arcade Edition
   Features: Glowing Metallic Paddles, Photon Ball Speed Aura, Particle Impact FX
   ========================================================================== */

class PingPongGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 650;
    this.canvas.height = 420;

    this.paddleWidth = 14;
    this.paddleHeight = 85;

    this.player = {
      x: 20,
      y: this.canvas.height / 2 - this.paddleHeight / 2,
      score: 0,
      dy: 0
    };

    this.ai = {
      x: this.canvas.width - 34,
      y: this.canvas.height / 2 - this.paddleHeight / 2,
      score: 0,
      speed: 4.8
    };

    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: 9,
      speed: 7,
      dx: 6,
      dy: 3,
      trail: []
    };

    this.particles = [];
    this.bestScore = StorageManager.getBestScore('pingpong');
    this.isRunning = false;
    this.keys = {};

    this.bindEvents();
  }

  init() {
    this.player.score = 0;
    this.ai.score = 0;
    this.particles = [];
    this.resetBall();
    this.updateHUD();
  }

  start() {
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  pause() {
    this.isRunning = !this.isRunning;
  }

  stop() {
    this.isRunning = false;
  }

  resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.speed = 7;
    this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 6;
    this.ball.dy = (Math.random() * 2 - 1) * 4;
    this.ball.trail = [];
  }

  bindEvents() {
    this.keydownHandler = (e) => {
      this.keys[e.key] = true;
    };
    this.keyupHandler = (e) => {
      this.keys[e.key] = false;
    };

    this.mousemoveHandler = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseY = e.clientY - rect.top - this.paddleHeight / 2;
      this.player.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, mouseY));
    };

    this.touchmoveHandler = (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        const touchY = e.touches[0].clientY - rect.top - this.paddleHeight / 2;
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, touchY));
      }
    };

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    this.canvas.addEventListener('mousemove', this.mousemoveHandler);
    this.canvas.addEventListener('touchmove', this.touchmoveHandler);
  }

  movePlayer(direction) {
    const speed = 9;
    if (direction === 'up') {
      this.player.y = Math.max(0, this.player.y - speed);
    } else if (direction === 'down') {
      this.player.y = Math.min(this.canvas.height - this.paddleHeight, this.player.y + speed);
    }
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();

    requestAnimationFrame(() => this.gameLoop());
  }

  createImpactFX(x, y, color) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        alpha: 1,
        color
      });
    }
  }

  update() {
    // Keyboard controls
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
      this.player.y = Math.max(0, this.player.y - 8);
    }
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
      this.player.y = Math.min(this.canvas.height - this.paddleHeight, this.player.y + 8);
    }

    // AI movement
    const aiTarget = this.ball.y - this.paddleHeight / 2;
    if (this.ai.y < aiTarget) {
      this.ai.y += Math.min(this.ai.speed, aiTarget - this.ai.y);
    } else if (this.ai.y > aiTarget) {
      this.ai.y -= Math.min(this.ai.speed, this.ai.y - aiTarget);
    }
    this.ai.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.ai.y));

    // Ball trail
    this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
    if (this.ball.trail.length > 10) this.ball.trail.shift();

    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Wall bounce
    if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.canvas.height) {
      this.ball.dy *= -1;
      this.createImpactFX(this.ball.x, this.ball.y, '#00f0ff');
    }

    // Player Paddle Collision
    if (
      this.ball.x - this.ball.radius <= this.player.x + this.paddleWidth &&
      this.ball.y >= this.player.y &&
      this.ball.y <= this.player.y + this.paddleHeight
    ) {
      this.ball.dx = Math.abs(this.ball.dx) + 0.35;
      const collidePoint = (this.ball.y - (this.player.y + this.paddleHeight / 2)) / (this.paddleHeight / 2);
      this.ball.dy = collidePoint * 7;
      this.createImpactFX(this.ball.x, this.ball.y, '#a855f7');
    }

    // AI Paddle Collision
    if (
      this.ball.x + this.ball.radius >= this.ai.x &&
      this.ball.y >= this.ai.y &&
      this.ball.y <= this.ai.y + this.paddleHeight
    ) {
      this.ball.dx = -Math.abs(this.ball.dx) - 0.35;
      const collidePoint = (this.ball.y - (this.ai.y + this.paddleHeight / 2)) / (this.paddleHeight / 2);
      this.ball.dy = collidePoint * 7;
      this.createImpactFX(this.ball.x, this.ball.y, '#ff007f');
    }

    // Update particles
    this.particles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.05;
      if (p.alpha <= 0) this.particles.splice(index, 1);
    });

    // Scoring
    if (this.ball.x < 0) {
      this.ai.score++;
      this.updateHUD();
      if (this.ai.score >= 10) {
        this.gameOver(false);
      } else {
        this.resetBall();
      }
    } else if (this.ball.x > this.canvas.width) {
      this.player.score++;
      if (this.player.score > this.bestScore) this.bestScore = this.player.score;
      this.updateHUD();
      if (this.player.score >= 10) {
        this.gameOver(true);
      } else {
        this.resetBall();
      }
    }
  }

  draw() {
    this.ctx.fillStyle = '#080911';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dotted center line
    this.ctx.setLineDash([8, 8]);
    this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Ball Trail
    this.ball.trail.forEach((p, index) => {
      this.ctx.fillStyle = `rgba(0, 240, 255, ${index / 12})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, this.ball.radius * (index / 10), 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Photon Ball
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#00f0ff';
    const ballGrad = this.ctx.createRadialGradient(this.ball.x - 2, this.ball.y - 2, 1, this.ball.x, this.ball.y, this.ball.radius);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.6, '#00f0ff');
    ballGrad.addColorStop(1, '#0077ff');

    this.ctx.fillStyle = ballGrad;
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Player Paddle (Neon Purple Glass Gradient)
    this.ctx.shadowBlur = 18;
    this.ctx.shadowColor = '#a855f7';
    const pGrad = this.ctx.createLinearGradient(this.player.x, this.player.y, this.player.x + this.paddleWidth, this.player.y + this.paddleHeight);
    pGrad.addColorStop(0, '#e9d5ff');
    pGrad.addColorStop(0.5, '#a855f7');
    pGrad.addColorStop(1, '#6b21a8');

    this.ctx.fillStyle = pGrad;
    this.ctx.fillRect(this.player.x, this.player.y, this.paddleWidth, this.paddleHeight);

    // AI Paddle (Neon Pink Glass Gradient)
    this.ctx.shadowBlur = 18;
    this.ctx.shadowColor = '#ff007f';
    const aiGrad = this.ctx.createLinearGradient(this.ai.x, this.ai.y, this.ai.x + this.paddleWidth, this.ai.y + this.paddleHeight);
    aiGrad.addColorStop(0, '#fbcfe8');
    aiGrad.addColorStop(0.5, '#ff007f');
    aiGrad.addColorStop(1, '#9f1239');

    this.ctx.fillStyle = aiGrad;
    this.ctx.fillRect(this.ai.x, this.ai.y, this.paddleWidth, this.paddleHeight);

    // Impact Particles
    this.particles.forEach(p => {
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = p.color;
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.globalAlpha = 1.0;
    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `${this.player.score} - ${this.ai.score}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver(playerWon) {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('pingpong', 'Ping Pong', this.player.score);
    if (this.onGameOver) {
      this.onGameOver(
        playerWon ? `You Won! Victory Score: ${this.player.score} 🎉` : `Computer Won! Final Score: ${this.player.score} 🤖`,
        saveRes.isNewHigh,
        saveRes.bestScore
      );
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    this.canvas.removeEventListener('mousemove', this.mousemoveHandler);
    this.canvas.removeEventListener('touchmove', this.touchmoveHandler);
  }
}
