/* ==========================================================================
   Tic Tac Toe Engine - Ultra Neon Laser 3D Edition
   Features: Glowing 3D X/O Lasers, Move Placement Particle Burst,
   Winning Line Strike FX, Minimax AI & 2 Player Mode
   ========================================================================== */

class TicTacToeGame {
  constructor(container, scoreEl, bestScoreEl, onGameOver) {
    this.container = container;
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.isVsAI = true;
    this.gameActive = true;

    this.scores = { X: 0, O: 0, ties: 0 };
    this.bestScore = StorageManager.getBestScore('tictactoe');

    this.winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="ttt-wrapper">
        <div class="ttt-mode-selector">
          <button class="ttt-mode-btn ${this.isVsAI ? 'active' : ''}" id="ttt-ai-mode">VS COMPUTER 🤖</button>
          <button class="ttt-mode-btn ${!this.isVsAI ? 'active' : ''}" id="ttt-2p-mode">2 PLAYERS 👥</button>
        </div>

        <div class="ttt-board" id="ttt-board-grid">
          ${Array(9).fill(0).map((_, i) => `<div class="ttt-cell" data-index="${i}"></div>`).join('')}
        </div>
      </div>
    `;

    this.cells = this.container.querySelectorAll('.ttt-cell');
    this.aiBtn = this.container.querySelector('#ttt-ai-mode');
    this.p2Btn = this.container.querySelector('#ttt-2p-mode');

    this.bindEvents();
    this.updateHUD();
  }

  bindEvents() {
    this.cells.forEach(cell => {
      cell.addEventListener('click', (e) => this.handleCellClick(e));
    });

    this.aiBtn.addEventListener('click', () => {
      this.isVsAI = true;
      this.aiBtn.classList.add('active');
      this.p2Btn.classList.remove('active');
      this.restart();
    });

    this.p2Btn.addEventListener('click', () => {
      this.isVsAI = false;
      this.p2Btn.classList.add('active');
      this.aiBtn.classList.remove('active');
      this.restart();
    });
  }

  start() {
    this.restart();
  }

  restart() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameActive = true;
    this.cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'ttt-cell';
    });
  }

  handleCellClick(e) {
    const index = parseInt(e.target.dataset.index);

    if (this.board[index] !== null || !this.gameActive) return;

    this.makeMove(index, this.currentPlayer);

    if (this.gameActive && this.isVsAI && this.currentPlayer === 'O') {
      setTimeout(() => this.makeAIMove(), 350);
    }
  }

  makeMove(index, player) {
    this.board[index] = player;
    const cell = this.cells[index];

    cell.innerHTML = player === 'X' 
      ? `<span class="symbol-x">✕</span>` 
      : `<span class="symbol-o">◯</span>`;

    cell.classList.add(player === 'X' ? 'x-symbol' : 'o-symbol', 'placed');

    const winCombo = this.checkWin(this.board, player);
    if (winCombo) {
      this.gameActive = false;
      this.highlightWinningCombo(winCombo);
      this.scores[player] += 1;
      
      const totalWins = this.scores.X;
      const saveRes = StorageManager.saveScore('tictactoe', 'Tic Tac Toe', totalWins);
      this.bestScore = saveRes.bestScore;
      this.updateHUD();

      setTimeout(() => {
        if (this.onGameOver) this.onGameOver(player === 'X' ? 'Player X Wins! 🎉' : 'Player O Wins! 🤖', true, this.bestScore);
      }, 600);
      return;
    }

    if (this.checkDraw(this.board)) {
      this.gameActive = false;
      this.scores.ties += 1;
      this.updateHUD();
      setTimeout(() => {
        if (this.onGameOver) this.onGameOver('It\'s a Draw! 🤝', false, this.bestScore);
      }, 500);
      return;
    }

    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
  }

  makeAIMove() {
    if (!this.gameActive) return;
    const bestMoveIndex = this.getBestMinimaxMove();
    if (bestMoveIndex !== null && bestMoveIndex !== undefined) {
      this.makeMove(bestMoveIndex, 'O');
    }
  }

  getBestMinimaxMove() {
    let bestScore = -Infinity;
    let move = null;

    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = 'O';
        let score = this.minimax(this.board, 0, false);
        this.board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  minimax(board, depth, isMaximizing) {
    if (this.checkWin(board, 'O')) return 10 - depth;
    if (this.checkWin(board, 'X')) return depth - 10;
    if (this.checkDraw(board)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          let score = this.minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          let score = this.minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }

  checkWin(board, player) {
    return this.winningCombinations.find(combo => {
      return combo.every(index => board[index] === player);
    });
  }

  checkDraw(board) {
    return board.every(cell => cell !== null);
  }

  highlightWinningCombo(combo) {
    combo.forEach(index => {
      this.cells[index].classList.add('win-cell');
    });
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `X: ${this.scores.X} | O: ${this.scores.O}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
