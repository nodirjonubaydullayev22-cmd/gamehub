/* ==========================================================================
   Minesweeper Game Engine - Free Gaming Hub
   Features: Hidden mines, recursive 0-sweep, Flag toggle, difficulty selection
   ========================================================================== */

class MinesweeperGame {
  constructor(container, scoreEl, bestScoreEl, onGameOver) {
    this.container = container;
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.rows = 8;
    this.cols = 8;
    this.minesCount = 10;

    this.grid = [];
    this.score = 0;
    this.flagMode = false;
    this.gameActive = true;
    this.bestScore = StorageManager.getBestScore('minesweeper');

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="minesweeper-wrapper">
        <div class="hud-item" style="flex-direction: row; gap: 1rem;">
          <button class="ttt-mode-btn ${!this.flagMode ? 'active' : ''}" id="ms-reveal-btn">🔍 REVEAL</button>
          <button class="ttt-mode-btn ${this.flagMode ? 'active' : ''}" id="ms-flag-btn">🚩 FLAG</button>
        </div>
        <div class="ms-grid" id="ms-board-grid"></div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#ms-board-grid');
    this.revealBtn = this.container.querySelector('#ms-reveal-btn');
    this.flagBtn = this.container.querySelector('#ms-flag-btn');

    this.revealBtn.onclick = () => {
      this.flagMode = false;
      this.revealBtn.classList.add('active');
      this.flagBtn.classList.remove('active');
    };

    this.flagBtn.onclick = () => {
      this.flagMode = true;
      this.flagBtn.classList.add('active');
      this.revealBtn.classList.remove('active');
    };

    this.start();
  }

  start() {
    this.score = 0;
    this.gameActive = true;
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null).map(() => ({
      isMine: false, revealed: false, flagged: false, count: 0
    })));

    // Plant Mines
    let planted = 0;
    while (planted < this.minesCount) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if (!this.grid[r][c].isMine) {
        this.grid[r][c].isMine = true;
        planted++;
      }
    }

    // Calculate Neighbor Mine Counts
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc].isMine) {
              count++;
            }
          }
        }
        this.grid[r][c].count = count;
      }
    }

    this.renderBoard();
    this.updateHUD();
  }

  renderBoard() {
    this.gridEl.style.gridTemplateColumns = `repeat(${this.cols}, 38px)`;
    this.gridEl.innerHTML = '';

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cellData = this.grid[r][c];
        const cell = document.createElement('div');
        cell.className = `ms-cell ${cellData.revealed ? 'revealed' : ''} ${cellData.isMine && cellData.revealed ? 'mine' : ''}`;

        if (cellData.flagged) {
          cell.textContent = '🚩';
        } else if (cellData.revealed) {
          if (cellData.isMine) {
            cell.textContent = '💣';
          } else if (cellData.count > 0) {
            cell.textContent = cellData.count;
            const colors = ['', '#00f0ff', '#10b981', '#ef4444', '#a855f7', '#ff007f'];
            cell.style.color = colors[cellData.count] || '#fff';
          }
        }

        cell.onclick = () => this.handleCellClick(r, c);
        cell.oncontextmenu = (e) => {
          e.preventDefault();
          this.toggleFlag(r, c);
        };

        this.gridEl.appendChild(cell);
      }
    }
  }

  handleCellClick(r, c) {
    if (!this.gameActive) return;

    if (this.flagMode) {
      this.toggleFlag(r, c);
      return;
    }

    const cell = this.grid[r][c];
    if (cell.flagged || cell.revealed) return;

    if (cell.isMine) {
      cell.revealed = true;
      this.gameActive = false;
      SoundManager.play('hit');
      this.revealAllMines();
      this.renderBoard();
      setTimeout(() => {
        if (this.onGameOver) this.onGameOver('BOOM! Mine Exploded! 💥', false, this.bestScore);
      }, 500);
      return;
    }

    this.revealCell(r, c);
    SoundManager.play('click');
    this.checkWin();
    this.renderBoard();
  }

  toggleFlag(r, c) {
    const cell = this.grid[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    SoundManager.play('click');
    this.renderBoard();
  }

  revealCell(r, c) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
    const cell = this.grid[r][c];
    if (cell.revealed || cell.flagged || cell.isMine) return;

    cell.revealed = true;
    this.score += 20;
    if (this.score > this.bestScore) this.bestScore = this.score;
    this.updateHUD();

    if (cell.count === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          this.revealCell(r + dr, c + dc);
        }
      }
    }
  }

  revealAllMines() {
    this.grid.forEach(row => row.forEach(cell => {
      if (cell.isMine) cell.revealed = true;
    }));
  }

  checkWin() {
    let unrevealedSafeCells = 0;
    this.grid.forEach(row => row.forEach(cell => {
      if (!cell.isMine && !cell.revealed) unrevealedSafeCells++;
    }));

    if (unrevealedSafeCells === 0) {
      this.gameActive = false;
      this.score += 500;
      SoundManager.play('win');
      const saveRes = StorageManager.saveScore('minesweeper', 'Minesweeper', this.score);
      this.bestScore = saveRes.bestScore;
      this.updateHUD();
      setTimeout(() => {
        if (this.onGameOver) this.onGameOver('Grid Swept Clean! Victory! 🚩', true, this.bestScore);
      }, 500);
    }
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score} | Mines: ${this.minesCount}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  destroy() { this.container.innerHTML = ''; }
}
