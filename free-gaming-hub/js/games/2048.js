/* ==========================================================================
   2048 Tile Game Engine - Free Gaming Hub
   Features: 4x4 Sliding tile grid, Tile merging physics, Score doubling
   ========================================================================== */

class Game2048 {
  constructor(container, scoreEl, bestScoreEl, onGameOver) {
    this.container = container;
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.grid = Array(4).fill(null).map(() => Array(4).fill(0));
    this.score = 0;
    this.bestScore = StorageManager.getBestScore('2048');
    this.gameActive = true;

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="2048-wrapper" style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
        <div class="ms-grid" id="grid-2048" style="grid-template-columns: repeat(4, 70px); grid-template-rows: repeat(4, 70px); gap: 10px; padding: 12px;"></div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#grid-2048');
    this.bindEvents();
    this.start();
  }

  start() {
    this.score = 0;
    this.gameActive = true;
    this.grid = Array(4).fill(null).map(() => Array(4).fill(0));
    this.addRandomTile();
    this.addRandomTile();
    this.renderBoard();
    this.updateHUD();
  }

  addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[r][c] = Math.random() > 0.1 ? 2 : 4;
    }
  }

  bindEvents() {
    this.keydownHandler = (e) => {
      if (!this.gameActive) return;
      let moved = false;
      if (e.key === 'ArrowLeft' || e.key === 'a') moved = this.moveLeft();
      if (e.key === 'ArrowRight' || e.key === 'd') moved = this.moveRight();
      if (e.key === 'ArrowUp' || e.key === 'w') moved = this.moveUp();
      if (e.key === 'ArrowDown' || e.key === 's') moved = this.moveDown();

      if (moved) {
        SoundManager.play('click');
        this.addRandomTile();
        this.renderBoard();
        this.checkGameOver();
      }
    };
    window.addEventListener('keydown', this.keydownHandler);
  }

  slideRow(row) {
    let arr = row.filter(val => val !== 0);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        this.score += arr[i];
        if (this.score > this.bestScore) this.bestScore = this.score;
        arr.splice(i + 1, 1);
        SoundManager.play('score');
      }
    }
    while (arr.length < 4) arr.push(0);
    return arr;
  }

  moveLeft() {
    let moved = false;
    for (let r = 0; r < 4; r++) {
      const newRow = this.slideRow(this.grid[r]);
      if (newRow.join(',') !== this.grid[r].join(',')) moved = true;
      this.grid[r] = newRow;
    }
    return moved;
  }

  moveRight() {
    let moved = false;
    for (let r = 0; r < 4; r++) {
      const newRow = this.slideRow(this.grid[r].reverse()).reverse();
      if (newRow.join(',') !== this.grid[r].join(',')) moved = true;
      this.grid[r] = newRow;
    }
    return moved;
  }

  moveUp() {
    let moved = false;
    for (let c = 0; c < 4; c++) {
      const col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
      const newCol = this.slideRow(col);
      for (let r = 0; r < 4; r++) {
        if (this.grid[r][c] !== newCol[r]) moved = true;
        this.grid[r][c] = newCol[r];
      }
    }
    return moved;
  }

  moveDown() {
    let moved = false;
    for (let c = 0; c < 4; c++) {
      const col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]].reverse();
      const newCol = this.slideRow(col).reverse();
      for (let r = 0; r < 4; r++) {
        if (this.grid[r][c] !== newCol[r]) moved = true;
        this.grid[r][c] = newCol[r];
      }
    }
    return moved;
  }

  renderBoard() {
    this.gridEl.innerHTML = '';
    const colors = {
      2: '#00f0ff', 4: '#3b82f6', 8: '#f97316', 16: '#eab308',
      32: '#10b981', 64: '#a855f7', 128: '#ef4444', 256: '#ff007f', 512: '#ffd700'
    };

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = this.grid[r][c];
        const cell = document.createElement('div');
        cell.className = 'ms-cell revealed';
        cell.style.width = '70px';
        cell.style.height = '70px';
        cell.style.fontSize = '1.3rem';
        cell.style.fontWeight = '900';

        if (val > 0) {
          cell.textContent = val;
          cell.style.color = colors[val] || '#fff';
          cell.style.borderColor = colors[val] || '#fff';
        }

        this.gridEl.appendChild(cell);
      }
    }
    this.updateHUD();
  }

  checkGameOver() {
    let canMove = false;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 0) canMove = true;
        if (r < 3 && this.grid[r][c] === this.grid[r + 1][c]) canMove = true;
        if (c < 3 && this.grid[r][c] === this.grid[r][c + 1]) canMove = true;
      }
    }

    if (!canMove) {
      this.gameActive = false;
      const saveRes = StorageManager.saveScore('2048', '2048', this.score);
      if (this.onGameOver) this.onGameOver(this.score, saveRes.isNewHigh, saveRes.bestScore);
    }
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  destroy() {
    this.gameActive = false;
    window.removeEventListener('keydown', this.keydownHandler);
  }
}
