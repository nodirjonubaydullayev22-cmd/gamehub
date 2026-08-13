/* ==========================================================================
   Sudoku Game Engine - Free Gaming Hub
   Features: 9x9 Board generator, Error validation, Keypad input, Hints & Timer
   ========================================================================== */

class SudokuGame {
  constructor(container, scoreEl, bestScoreEl, onGameOver) {
    this.container = container;
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.grid = Array(9).fill(null).map(() => Array(9).fill(0));
    this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
    this.fixed = Array(9).fill(null).map(() => Array(9).fill(false));

    this.selectedCell = null;
    this.score = 0;
    this.bestScore = StorageManager.getBestScore('sudoku');
    this.gameActive = true;

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="sudoku-wrapper">
        <div class="sudoku-grid" id="sudoku-board-grid"></div>
        <div class="sudoku-keypad">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="sdk-key" data-num="${n}">${n}</button>`).join('')}
          <button class="sdk-key" id="sdk-clear-btn" style="background: rgba(239, 68, 68, 0.2); border-color: #ef4444;">✖</button>
        </div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#sudoku-board-grid');
    this.keypadKeys = this.container.querySelectorAll('.sdk-key');

    this.keypadKeys.forEach(key => {
      key.addEventListener('click', (e) => {
        const num = parseInt(e.target.dataset.num);
        if (num) this.enterNumber(num);
        else if (e.target.id === 'sdk-clear-btn') this.enterNumber(0);
      });
    });

    this.start();
  }

  generateValidSudoku() {
    // Basic valid template generator
    const base = [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9]
    ];
    this.solution = base;

    // Create puzzle by hiding cells
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (Math.random() > 0.45) {
          this.grid[r][c] = base[r][c];
          this.fixed[r][c] = true;
        } else {
          this.grid[r][c] = 0;
          this.fixed[r][c] = false;
        }
      }
    }
  }

  start() {
    this.score = 0;
    this.gameActive = true;
    this.selectedCell = null;
    this.generateValidSudoku();
    this.renderBoard();
    this.updateHUD();
  }

  renderBoard() {
    this.gridEl.innerHTML = '';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = this.grid[r][c];
        const isFixed = this.fixed[r][c];
        const isSelected = this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c;
        const isError = val !== 0 && val !== this.solution[r][c];

        const cell = document.createElement('div');
        cell.className = `sudoku-cell ${isFixed ? 'fixed' : ''} ${isSelected ? 'selected' : ''} ${isError ? 'error' : ''}`;
        cell.textContent = val !== 0 ? val : '';

        cell.onclick = () => {
          this.selectedCell = { r, c };
          SoundManager.play('click');
          this.renderBoard();
        };

        this.gridEl.appendChild(cell);
      }
    }
  }

  enterNumber(num) {
    if (!this.selectedCell || !this.gameActive) return;
    const { r, c } = this.selectedCell;
    if (this.fixed[r][c]) return;

    this.grid[r][c] = num;
    SoundManager.play('click');

    if (num !== 0 && num === this.solution[r][c]) {
      this.score += 50;
      if (this.score > this.bestScore) this.bestScore = this.score;
      this.updateHUD();
    }

    this.checkWin();
    this.renderBoard();
  }

  checkWin() {
    let complete = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.grid[r][c] !== this.solution[r][c]) complete = false;
      }
    }

    if (complete) {
      this.gameActive = false;
      this.score += 1000;
      SoundManager.play('win');
      const saveRes = StorageManager.saveScore('sudoku', 'Sudoku', this.score);
      this.bestScore = saveRes.bestScore;
      this.updateHUD();
      setTimeout(() => {
        if (this.onGameOver) this.onGameOver('Sudoku Completed! Mastermind Victory! 🧩', true, this.bestScore);
      }, 500);
    }
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  destroy() { this.container.innerHTML = ''; }
}
