/* ==========================================================================
   Tetris Game Engine - Ultra 3D Neon Glass Edition
   Features: Beveled 3D Glass Tetrominos, Ghost Piece Landing Preview,
   Row Clear Particle Blast & Dynamic Shimmering Grid
   ========================================================================== */

class TetrisGame {
  constructor(canvas, nextCanvas, scoreEl, levelEl, bestScoreEl, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nextCanvas = nextCanvas;
    this.nextCtx = nextCanvas ? nextCanvas.getContext('2d') : null;

    this.scoreEl = scoreEl;
    this.levelEl = levelEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.COLS = 10;
    this.ROWS = 20;
    this.BLOCK_SIZE = 26;

    this.canvas.width = this.COLS * this.BLOCK_SIZE;
    this.canvas.height = this.ROWS * this.BLOCK_SIZE;

    if (this.nextCanvas) {
      this.nextCanvas.width = 4 * this.BLOCK_SIZE;
      this.nextCanvas.height = 4 * this.BLOCK_SIZE;
    }

    this.grid = this.createMatrix(this.ROWS, this.COLS);
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.bestScore = StorageManager.getBestScore('tetris');

    this.dropCounter = 0;
    this.dropInterval = 750;
    this.lastTime = 0;
    this.isRunning = false;
    this.particles = [];

    this.SHAPES = {
      I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      J: [[2, 0, 0], [2, 2, 2], [0, 0, 0]],
      L: [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
      O: [[4, 4], [4, 4]],
      S: [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
      T: [[0, 6, 0], [6, 6, 6], [0, 0, 0]],
      Z: [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
    };

    this.COLOR_THEMES = [
      null,
      { main: '#00f0ff', light: '#a5f3fc', dark: '#0284c7' }, // I - Cyan
      { main: '#3b82f6', light: '#93c5fd', dark: '#1d4ed8' }, // J - Blue
      { main: '#f97316', light: '#fdba74', dark: '#c2410c' }, // L - Orange
      { main: '#eab308', light: '#fef08a', dark: '#a16207' }, // O - Yellow
      { main: '#10b981', light: '#6ee7b7', dark: '#047857' }, // S - Green
      { main: '#a855f7', light: '#d8b4fe', dark: '#6b21a8' }, // T - Purple
      { main: '#ef4444', light: '#fca5a5', dark: '#b91c1c' }  // Z - Red
    ];

    this.player = {
      pos: { x: 0, y: 0 },
      matrix: null,
      score: 0
    };

    this.nextPiece = null;
    this.bindEvents();
  }

  createMatrix(r, c) {
    const matrix = [];
    while (r--) {
      matrix.push(new Array(c).fill(0));
    }
    return matrix;
  }

  init() {
    this.grid = this.createMatrix(this.ROWS, this.COLS);
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = 750;
    this.particles = [];
    this.nextPiece = this.getRandomPiece();
    this.resetPlayer();
    this.updateHUD();
  }

  start() {
    this.init();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  pause() {
    this.isRunning = !this.isRunning;
  }

  stop() {
    this.isRunning = false;
  }

  getRandomPiece() {
    const keys = Object.keys(this.SHAPES);
    const shapeKey = keys[Math.floor(Math.random() * keys.length)];
    return this.SHAPES[shapeKey];
  }

  resetPlayer() {
    this.player.matrix = this.nextPiece || this.getRandomPiece();
    this.nextPiece = this.getRandomPiece();
    this.player.pos.y = 0;
    this.player.pos.x = Math.floor((this.COLS - this.player.matrix[0].length) / 2);

    if (this.collide(this.grid, this.player)) {
      this.gameOver();
    }
    this.drawNextPiece();
  }

  bindEvents() {
    this.keydownHandler = (e) => {
      if (!this.isRunning) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.movePlayer(-1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.movePlayer(1);
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.dropPlayer();
          break;
        case 'ArrowUp':
        case 'KeyW':
          this.rotatePlayer();
          break;
        case 'Space':
          this.hardDropPlayer();
          break;
      }
    };
    window.addEventListener('keydown', this.keydownHandler);
  }

  controlInput(action) {
    if (!this.isRunning) return;
    if (action === 'left') this.movePlayer(-1);
    if (action === 'right') this.movePlayer(1);
    if (action === 'down') this.dropPlayer();
    if (action === 'rotate') this.rotatePlayer();
    if (action === 'drop') this.hardDropPlayer();
  }

  movePlayer(dir) {
    this.player.pos.x += dir;
    if (this.collide(this.grid, this.player)) {
      this.player.pos.x -= dir;
    }
  }

  rotatePlayer() {
    const pos = this.player.pos.x;
    let offset = 1;
    this.rotateMatrix(this.player.matrix);
    while (this.collide(this.grid, this.player)) {
      this.player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > this.player.matrix[0].length) {
        this.rotateMatrix(this.player.matrix, -1);
        this.player.pos.x = pos;
        return;
      }
    }
  }

  rotateMatrix(matrix, dir = 1) {
    for (let y = 0; y < matrix.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
  }

  dropPlayer() {
    this.player.pos.y++;
    if (this.collide(this.grid, this.player)) {
      this.player.pos.y--;
      this.merge(this.grid, this.player);
      this.clearLines();
      this.resetPlayer();
    }
    this.dropCounter = 0;
  }

  hardDropPlayer() {
    while (!this.collide(this.grid, this.player)) {
      this.player.pos.y++;
    }
    this.player.pos.y--;
    this.merge(this.grid, this.player);
    this.clearLines();
    this.resetPlayer();
    this.dropCounter = 0;
  }

  getGhostPos() {
    const ghost = {
      pos: { x: this.player.pos.x, y: this.player.pos.y },
      matrix: this.player.matrix
    };
    while (!this.collide(this.grid, ghost)) {
      ghost.pos.y++;
    }
    ghost.pos.y--;
    return ghost.pos;
  }

  collide(grid, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
      for (let x = 0; x < m[y].length; ++x) {
        if (m[y][x] !== 0 && (grid[y + o.y] && grid[y + o.y][x + o.x]) !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  merge(grid, player) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          grid[y + player.pos.y][x + player.pos.x] = value;
        }
      });
    });
  }

  clearLines() {
    let rowCount = 0;
    outer: for (let y = this.grid.length - 1; y >= 0; --y) {
      for (let x = 0; x < this.grid[y].length; ++x) {
        if (this.grid[y][x] === 0) {
          continue outer;
        }
      }

      // Explosion Particles on Row Clear
      for (let px = 0; px < this.COLS; px++) {
        const val = this.grid[y][px];
        const colorObj = this.COLOR_THEMES[val] || { main: '#a855f7' };
        for (let k = 0; k < 6; k++) {
          this.particles.push({
            x: px * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
            y: y * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            alpha: 1,
            size: Math.random() * 4 + 2,
            color: colorObj.main
          });
        }
      }

      const row = this.grid.splice(y, 1)[0].fill(0);
      this.grid.unshift(row);
      ++y;
      rowCount++;
    }

    if (rowCount > 0) {
      const lineScores = [0, 120, 350, 600, 1000];
      this.score += lineScores[rowCount] * this.level;
      this.lines += rowCount;

      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(90, 750 - (this.level - 1) * 65);

      if (this.score > this.bestScore) this.bestScore = this.score;
      this.updateHUD();
    }
  }

  gameLoop(time = 0) {
    if (!this.isRunning) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    this.dropCounter += deltaTime;
    if (this.dropCounter > this.dropInterval) {
      this.dropPlayer();
    }

    // Update particles
    this.particles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.04;
      if (p.alpha <= 0) this.particles.splice(index, 1);
    });

    this.draw();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  draw() {
    this.ctx.fillStyle = '#090a12';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Matrix Grid lines
    this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.06)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.COLS; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
      this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.ROWS; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.BLOCK_SIZE);
      this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
      this.ctx.stroke();
    }

    // Ghost Landing Preview
    const ghostPos = this.getGhostPos();
    this.drawMatrix(this.player.matrix, ghostPos, true);

    // Grid Matrix
    this.drawMatrix(this.grid, { x: 0, y: 0 });

    // Active Piece
    this.drawMatrix(this.player.matrix, this.player.pos);

    // Particles
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

  drawMatrix(matrix, offset, isGhost = false) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const bx = (x + offset.x) * this.BLOCK_SIZE;
          const by = (y + offset.y) * this.BLOCK_SIZE;
          const bs = this.BLOCK_SIZE;

          const theme = this.COLOR_THEMES[value];

          if (isGhost) {
            this.ctx.strokeStyle = theme.main;
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(bx + 2, by + 2, bs - 4, bs - 4);
          } else {
            // 3D Glass Block Gradient & Bevel
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = theme.main;

            const blockGrad = this.ctx.createLinearGradient(bx, by, bx + bs, by + bs);
            blockGrad.addColorStop(0, theme.light);
            blockGrad.addColorStop(0.5, theme.main);
            blockGrad.addColorStop(1, theme.dark);

            this.ctx.fillStyle = blockGrad;
            this.ctx.fillRect(bx + 1, by + 1, bs - 2, bs - 2);

            // Bevel Highlight Lines
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fillRect(bx + 1, by + 1, bs - 2, 2);
            this.ctx.fillRect(bx + 1, by + 1, 2, bs - 2);
          }
        }
      });
    });
    this.ctx.shadowBlur = 0;
  }

  drawNextPiece() {
    if (!this.nextCtx) return;
    this.nextCtx.fillStyle = '#090a12';
    this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

    const m = this.nextPiece;
    const offsetX = Math.floor((4 - m[0].length) / 2);
    const offsetY = Math.floor((4 - m.length) / 2);

    m.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const bx = (x + offsetX) * this.BLOCK_SIZE;
          const by = (y + offsetY) * this.BLOCK_SIZE;
          const bs = this.BLOCK_SIZE;
          const theme = this.COLOR_THEMES[value];

          const blockGrad = this.nextCtx.createLinearGradient(bx, by, bx + bs, by + bs);
          blockGrad.addColorStop(0, theme.light);
          blockGrad.addColorStop(0.5, theme.main);
          blockGrad.addColorStop(1, theme.dark);

          this.nextCtx.shadowBlur = 10;
          this.nextCtx.shadowColor = theme.main;
          this.nextCtx.fillStyle = blockGrad;
          this.nextCtx.fillRect(bx + 1, by + 1, bs - 2, bs - 2);
        }
      });
    });
    this.nextCtx.shadowBlur = 0;
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = this.score;
    if (this.levelEl) this.levelEl.textContent = this.level;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  gameOver() {
    this.isRunning = false;
    const saveRes = StorageManager.saveScore('tetris', 'Tetris', this.score);
    if (this.onGameOver) {
      this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('keydown', this.keydownHandler);
  }
}
