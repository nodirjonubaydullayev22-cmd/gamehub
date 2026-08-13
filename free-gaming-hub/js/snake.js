/* ==========================================================================
   Snake Game Engine - Ultra Realistic Neon Snake Edition
   Features: Snake Head with eyes & flickering tongue, tapering body scales,
   glowing 3D apples, particle burst FX, touch D-Pad
   ========================================================================== */

class SnakeGame {
  constructor(canvas, scoreEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.gridSize = 22;
    this.tileCount = 18;
    this.canvas.width = this.gridSize * this.tileCount;
    this.canvas.height = this.gridSize * this.tileCount;

    this.snake = [];
    this.food = { x: 5, y: 5 };
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.bestScore = StorageManager.getBestScore('snake');
    this.speed = 110;
    this.isRunning = false;
    this.particles = [];
    this.tongueTimer = 0;

    this.bindEvents();
  }

  init() {
    this.snake = [
      { x: 8, y: 9 },
      { x: 7, y: 9 },
      { x: 6, y: 9 },
      { x: 5, y: 9 }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.speed = 110;
    this.particles = [];
    this.updateHUD();
    this.spawnFood();
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

  bindEvents() {
    this.keydownHandler = (e) => {
      if (!this.isRunning) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
          break;
      }
    };
    window.addEventListener('keydown', this.keydownHandler);
  }

  setDirection(dir) {
    if (!this.isRunning) return;
    if (dir === 'up' && this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
    if (dir === 'down' && this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
    if (dir === 'left' && this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
    if (dir === 'right' && this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
  }

  spawnFood() {
    let valid = false;
    while (!valid) {
      this.food = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount)
      };
      valid = !this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
    }
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.tongueTimer++;
    this.update();
    this.draw();

    setTimeout(() => {
      requestAnimationFrame(() => this.gameLoop());
    }, this.speed);
  }

  update() {
    this.direction = { ...this.nextDirection };
    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y
    };

    // Wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver();
      return;
    }

    // Self collision
    if (this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      this.gameOver();
      return;
    }

    this.snake.unshift(head);

    // Eat food
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.createParticles(
        head.x * this.gridSize + this.gridSize / 2,
        head.y * this.gridSize + this.gridSize / 2
      );
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
      }
      this.updateHUD();
      this.spawnFood();

      if (this.speed > 50) this.speed -= 2;
    } else {
      this.snake.pop();
    }

    // Update particles
    this.particles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.04;
      if (p.alpha <= 0) this.particles.splice(index, 1);
    });
  }

  createParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        alpha: 1,
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#ff007f' : '#00f0ff'
      });
    }
  }

  draw() {
    // Cyber Grid Background
    this.ctx.fillStyle = '#080911';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.08)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= this.tileCount; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.gridSize, 0);
      this.ctx.lineTo(i * this.gridSize, this.canvas.height);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.gridSize);
      this.ctx.lineTo(this.canvas.width, i * this.gridSize);
      this.ctx.stroke();
    }

    // Draw Food (3D Glowing Apple with Leaf)
    const fx = this.food.x * this.gridSize + this.gridSize / 2;
    const fy = this.food.y * this.gridSize + this.gridSize / 2;
    const radius = this.gridSize / 2 - 2;

    // Outer glow aura
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#ff007f';
    const appleGrad = this.ctx.createRadialGradient(fx - 2, fy - 2, 1, fx, fy, radius);
    appleGrad.addColorStop(0, '#ff66b2');
    appleGrad.addColorStop(0.7, '#ff007f');
    appleGrad.addColorStop(1, '#99004d');

    this.ctx.fillStyle = appleGrad;
    this.ctx.beginPath();
    this.ctx.arc(fx, fy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Apple Leaf
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#10b981';
    this.ctx.beginPath();
    this.ctx.ellipse(fx + 2, fy - radius + 1, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw Realistic Snake Body & Head
    this.snake.forEach((seg, index) => {
      const isHead = index === 0;
      const isTail = index === this.snake.length - 1;
      const cx = seg.x * this.gridSize + this.gridSize / 2;
      const cy = seg.y * this.gridSize + this.gridSize / 2;

      // Scale factor tapering down to tail
      const progress = 1 - (index / this.snake.length) * 0.4;
      const segRadius = (this.gridSize / 2 - 1) * progress;

      if (isHead) {
        // Draw Snake Head
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#00f0ff';

        const headGrad = this.ctx.createRadialGradient(cx - 2, cy - 2, 2, cx, cy, segRadius + 2);
        headGrad.addColorStop(0, '#70f3ff');
        headGrad.addColorStop(0.7, '#00c3ff');
        headGrad.addColorStop(1, '#0077b6');

        this.ctx.fillStyle = headGrad;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, segRadius + 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Snake Eyes
        this.ctx.shadowBlur = 0;
        let eyeOffset1 = { x: 0, y: 0 };
        let eyeOffset2 = { x: 0, y: 0 };
        let tongueEnd = { x: 0, y: 0 };

        if (this.direction.x === 1) { // Right
          eyeOffset1 = { x: 3, y: -4 };
          eyeOffset2 = { x: 3, y: 4 };
          tongueEnd = { x: segRadius + 8, y: 0 };
        } else if (this.direction.x === -1) { // Left
          eyeOffset1 = { x: -3, y: -4 };
          eyeOffset2 = { x: -3, y: 4 };
          tongueEnd = { x: -(segRadius + 8), y: 0 };
        } else if (this.direction.y === -1) { // Up
          eyeOffset1 = { x: -4, y: -3 };
          eyeOffset2 = { x: 4, y: -3 };
          tongueEnd = { x: 0, y: -(segRadius + 8) };
        } else if (this.direction.y === 1) { // Down
          eyeOffset1 = { x: -4, y: 3 };
          eyeOffset2 = { x: 4, y: 3 };
          tongueEnd = { x: 0, y: segRadius + 8 };
        }

        // Outer Eyes
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(cx + eyeOffset1.x, cy + eyeOffset1.y, 3, 0, Math.PI * 2);
        this.ctx.arc(cx + eyeOffset2.x, cy + eyeOffset2.y, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupil Slits
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(cx + eyeOffset1.x, cy + eyeOffset1.y, 1.5, 0, Math.PI * 2);
        this.ctx.arc(cx + eyeOffset2.x, cy + eyeOffset2.y, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Flickering Snake Tongue
        if (this.tongueTimer % 6 < 3) {
          this.ctx.strokeStyle = '#ff0055';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(cx, cy);
          this.ctx.lineTo(cx + tongueEnd.x, cy + tongueEnd.y);
          this.ctx.stroke();
        }

      } else {
        // Body Segment (Curved Gradient & Scales)
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';

        const bodyGrad = this.ctx.createRadialGradient(cx - 1, cy - 1, 1, cx, cy, segRadius);
        bodyGrad.addColorStop(0, '#c084fc');
        bodyGrad.addColorStop(0.6, '#9333ea');
        bodyGrad.addColorStop(1, '#581c87');

        this.ctx.fillStyle = bodyGrad;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, segRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Scale Highlight Pattern
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, segRadius * 0.6, 0, Math.PI);
        this.ctx.stroke();
      }
    });

    // Draw Particle Burst FX
    this.particles.forEach(p => {
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = p.color;
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1.0;
    this.ctx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = this.score;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveResult = StorageManager.saveScore('snake', 'Snake', this.score);
    if (this.onGameOver) {
      this.onGameOver(this.score, saveResult.isNewHigh, saveResult.bestScore);
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('keydown', this.keydownHandler);
  }
}
