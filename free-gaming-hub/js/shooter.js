/* ==========================================================================
   Space Shooter Engine - Ultra Realistic Fighter Rocket Edition
   Features: Detailed Fighter Ship, Cockpit Canopy, Ion Thruster Flames,
   Alien Dreadnoughts, Multi-Stage Particle Explosions & Parallax Nebula
   ========================================================================== */

class SpaceShooterGame {
  constructor(canvas, scoreEl, livesEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.livesEl = livesEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.canvas.width = 650;
    this.canvas.height = 550;

    this.player = {
      x: this.canvas.width / 2 - 25,
      y: this.canvas.height - 80,
      width: 50,
      height: 55,
      speed: 7,
      lives: 3,
      shieldTime: 0
    };

    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.stars = [];
    this.thrusterParticles = [];

    this.score = 0;
    this.bestScore = StorageManager.getBestScore('shooter');
    this.isRunning = false;
    this.lastShot = 0;
    this.shotDelay = 150; // ms
    this.keys = {};

    this.initStars();
    this.bindEvents();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        speed: Math.random() * 3 + 0.8,
        size: Math.random() * 2.5 + 0.8,
        color: Math.random() > 0.3 ? '#ffffff' : (Math.random() > 0.5 ? '#00f0ff' : '#a855f7')
      });
    }
  }

  init() {
    this.player.x = this.canvas.width / 2 - 25;
    this.player.y = this.canvas.height - 80;
    this.player.lives = 3;
    this.player.shieldTime = 0;

    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.thrusterParticles = [];

    this.score = 0;
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

  bindEvents() {
    this.keydownHandler = (e) => {
      this.keys[e.code] = true;
    };
    this.keyupHandler = (e) => {
      this.keys[e.code] = false;
    };

    this.touchmoveHandler = (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left - this.player.width / 2;
        const touchY = e.touches[0].clientY - rect.top - this.player.height / 2;
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, touchX));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, touchY));
        this.shoot();
      }
    };

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    this.canvas.addEventListener('touchmove', this.touchmoveHandler);
  }

  shoot() {
    const now = performance.now();
    if (now - this.lastShot >= this.shotDelay) {
      // Dual Wing Laser Cannons
      this.bullets.push(
        { x: this.player.x + 6, y: this.player.y + 12, width: 4, height: 18, speed: 12 },
        { x: this.player.x + this.player.width - 10, y: this.player.y + 12, width: 4, height: 18, speed: 12 }
      );
      this.lastShot = now;
    }
  }

  spawnEnemy() {
    if (Math.random() < 0.04) {
      const types = [
        { type: 'scout', color: '#ff007f', hp: 1, speed: 3.5, width: 36, height: 36, points: 50 },
        { type: 'saucer', color: '#00f0ff', hp: 2, speed: 2.2, width: 46, height: 36, points: 100 },
        { type: 'dreadnought', color: '#a855f7', hp: 4, speed: 1.2, width: 64, height: 56, points: 250 }
      ];

      const r = Math.random();
      const template = r > 0.82 ? types[2] : (r > 0.5 ? types[1] : types[0]);

      this.enemies.push({
        ...template,
        x: Math.random() * (this.canvas.width - template.width),
        y: -template.height,
        angle: 0
      });
    }
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();

    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Player controls
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.x = Math.max(0, this.player.x - this.player.speed);
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
    }
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      this.player.y = Math.max(0, this.player.y - this.player.speed);
    }
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      this.player.y = Math.min(this.canvas.height - this.player.height, this.player.y + this.player.speed);
    }
    if (this.keys['Space']) {
      this.shoot();
    }

    if (this.player.shieldTime > 0) this.player.shieldTime--;

    // Ion Thruster Flame Particles
    this.thrusterParticles.push({
      x: this.player.x + this.player.width / 2 + (Math.random() - 0.5) * 12,
      y: this.player.y + this.player.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: Math.random() * 4 + 3,
      size: Math.random() * 4 + 2,
      alpha: 1,
      color: Math.random() > 0.5 ? '#00f0ff' : '#a855f7'
    });

    this.thrusterParticles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.08;
      if (p.alpha <= 0) this.thrusterParticles.splice(index, 1);
    });

    // Scroll Starfield
    this.stars.forEach(star => {
      star.y += star.speed;
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }
    });

    // Bullets
    this.bullets.forEach((b, index) => {
      b.y -= b.speed;
      if (b.y < -b.height) this.bullets.splice(index, 1);
    });

    // Spawn & Move Enemies
    this.spawnEnemy();
    this.enemies.forEach((enemy, eIndex) => {
      enemy.y += enemy.speed;
      enemy.angle += 0.05;

      if (enemy.y > this.canvas.height) {
        this.enemies.splice(eIndex, 1);
      }

      // Check Bullet Collision
      this.bullets.forEach((bullet, bIndex) => {
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          enemy.hp--;
          this.bullets.splice(bIndex, 1);
          this.createExplosion(bullet.x, bullet.y, enemy.color, 5);

          if (enemy.hp <= 0) {
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 25);
            this.score += enemy.points;
            if (this.score > this.bestScore) this.bestScore = this.score;
            this.updateHUD();
            this.enemies.splice(eIndex, 1);
          }
        }
      });

      // Check Player Collision
      if (
        this.player.shieldTime <= 0 &&
        this.player.x < enemy.x + enemy.width &&
        this.player.x + this.player.width > enemy.x &&
        this.player.y < enemy.y + enemy.height &&
        this.player.y + this.player.height > enemy.y
      ) {
        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff007f', 30);
        this.enemies.splice(eIndex, 1);
        this.player.lives--;
        this.player.shieldTime = 60; // temporary shield invulnerability
        this.updateHUD();

        if (this.player.lives <= 0) {
          this.gameOver();
        }
      }
    });

    // Particles
    this.particles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) this.particles.splice(index, 1);
    });
  }

  createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        alpha: 1,
        size: Math.random() * 5 + 2,
        color: color
      });
    }
  }

  draw() {
    // Deep Space Background Gradient
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bgGrad.addColorStop(0, '#04050a');
    bgGrad.addColorStop(0.5, '#0a0b18');
    bgGrad.addColorStop(1, '#05060c');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Stars
    this.stars.forEach(s => {
      this.ctx.shadowBlur = s.size > 2 ? 8 : 0;
      this.ctx.shadowColor = s.color;
      this.ctx.fillStyle = s.color;
      this.ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    this.ctx.shadowBlur = 0;

    // Thruster Flames
    this.thrusterParticles.forEach(p => {
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.color;
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1.0;

    // Laser Bullets
    this.bullets.forEach(b => {
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#00f0ff';
      const laserGrad = this.ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
      laserGrad.addColorStop(0, '#ffffff');
      laserGrad.addColorStop(0.5, '#00f0ff');
      laserGrad.addColorStop(1, '#0077ff');

      this.ctx.fillStyle = laserGrad;
      this.ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Draw Realistic Fighter Spaceship
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#00f0ff';

    // Wings
    const wingGrad = this.ctx.createLinearGradient(px, py, px + pw, py + ph);
    wingGrad.addColorStop(0, '#1e293b');
    wingGrad.addColorStop(0.5, '#3b82f6');
    wingGrad.addColorStop(1, '#1e1b4b');

    this.ctx.fillStyle = wingGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(px + pw / 2, py); // Nose tip
    this.ctx.lineTo(px + pw, py + ph * 0.75); // Right wing tip
    this.ctx.lineTo(px + pw * 0.8, py + ph);
    this.ctx.lineTo(px + pw * 0.2, py + ph);
    this.ctx.lineTo(px, py + ph * 0.75); // Left wing tip
    this.ctx.closePath();
    this.ctx.fill();

    // Metallic Fuselage Core
    const coreGrad = this.ctx.createLinearGradient(px + pw * 0.3, py, px + pw * 0.7, py + ph);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, '#a855f7');
    coreGrad.addColorStop(1, '#4c1d95');

    this.ctx.fillStyle = coreGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(px + pw / 2, py + 2);
    this.ctx.lineTo(px + pw * 0.65, py + ph * 0.85);
    this.ctx.lineTo(px + pw * 0.35, py + ph * 0.85);
    this.ctx.closePath();
    this.ctx.fill();

    // Glowing Cyan Cockpit Canopy Glass
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.beginPath();
    this.ctx.ellipse(px + pw / 2, py + ph * 0.35, 6, 12, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Wingtip Plasma Guns
    this.ctx.fillStyle = '#ff007f';
    this.ctx.fillRect(px + 4, py + ph * 0.6, 4, 12);
    this.ctx.fillRect(px + pw - 8, py + ph * 0.6, 4, 12);

    // Invulnerability Shield Aura
    if (this.player.shieldTime > 0) {
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 3;
      this.ctx.shadowBlur = 25;
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.beginPath();
      this.ctx.arc(px + pw / 2, py + ph / 2, pw * 0.7, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Draw Realistic Alien Enemies
    this.enemies.forEach(e => {
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = e.color;

      if (e.type === 'scout') {
        // Red Scout Interceptor
        this.ctx.fillStyle = '#ff0055';
        this.ctx.beginPath();
        this.ctx.moveTo(e.x + e.width / 2, e.y + e.height);
        this.ctx.lineTo(e.x + e.width, e.y);
        this.ctx.lineTo(e.x + e.width * 0.5, e.y + 8);
        this.ctx.lineTo(e.x, e.y);
        this.ctx.closePath();
        this.ctx.fill();

        // Eye Core
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(e.x + e.width / 2, e.y + e.height * 0.5, 4, 0, Math.PI * 2);
        this.ctx.fill();

      } else if (e.type === 'saucer') {
        // Cyan Alien Saucer
        this.ctx.fillStyle = '#00f0ff';
        this.ctx.beginPath();
        this.ctx.ellipse(e.x + e.width / 2, e.y + e.height / 2, e.width / 2, e.height / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Dome
        this.ctx.fillStyle = '#a855f7';
        this.ctx.beginPath();
        this.ctx.arc(e.x + e.width / 2, e.y + e.height / 3, 10, 0, Math.PI * 2);
        this.ctx.fill();

      } else if (e.type === 'dreadnought') {
        // Purple Armored Dreadnought
        this.ctx.fillStyle = '#7e22ce';
        this.ctx.fillRect(e.x, e.y, e.width, e.height * 0.7);

        this.ctx.fillStyle = '#c084fc';
        this.ctx.fillRect(e.x + 8, e.y + e.height * 0.7, e.width - 16, e.height * 0.3);

        // Armor Plates
        this.ctx.fillStyle = '#ff007f';
        this.ctx.beginPath();
        this.ctx.arc(e.x + e.width / 2, e.y + e.height / 2, 8, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Particle Explosions
    this.particles.forEach(p => {
      this.ctx.shadowBlur = 10;
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
    if (this.livesEl) this.livesEl.textContent = '❤️'.repeat(Math.max(0, this.player.lives));
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('shooter', 'Space Shooter', this.score);
    if (this.onGameOver) {
      this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    this.canvas.removeEventListener('touchmove', this.touchmoveHandler);
  }
}
