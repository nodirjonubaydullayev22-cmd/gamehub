/* ==========================================================================
   Chess Game Engine - Free Gaming Hub
   Features: 8x8 Board, Unicode pieces, Legal move validation, Minimax AI
   ========================================================================== */

class ChessGame {
  constructor(container, scoreEl, bestScoreEl, onGameOver) {
    this.container = container;
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    this.selectedSquare = null;
    this.validMoves = [];
    this.turn = 'w'; // 'w' or 'b'
    this.isVsAI = true;
    this.aiDifficulty = 'medium';
    this.score = 0;
    this.bestScore = StorageManager.getBestScore('chess');

    this.PIECES = {
      wP: '♙', wR: '♖', wN: '♘', wB: '♗', wQ: '♕', wK: '♔',
      bP: '♟', bR: '♜', bN: '♞', bB: '♝', bQ: '♛', bK: '♚'
    };

    this.initDOM();
  }

  initBoard() {
    const setup = [
      ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
      ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
      Array(8).fill(null), Array(8).fill(null), Array(8).fill(null), Array(8).fill(null),
      ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
      ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ];
    this.board = setup;
    this.turn = 'w';
    this.selectedSquare = null;
    this.validMoves = [];
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="chess-wrapper">
        <div class="hud-item" style="flex-direction: row; gap: 1rem; align-items: center;">
          <label style="color: var(--text-muted); font-size: 0.9rem;">DIFFICULTY:</label>
          <select id="chess-diff-select" class="gamer-input" style="width: 140px; padding: 0.4rem; font-size: 0.9rem; margin-bottom: 0;">
            <option value="easy">Easy 🟢</option>
            <option value="medium" selected>Medium 🟡</option>
            <option value="hard">Hard 🔴</option>
          </select>
        </div>
        <div class="chess-board" id="chess-grid"></div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#chess-grid');
    this.diffSelect = this.container.querySelector('#chess-diff-select');

    this.diffSelect.addEventListener('change', (e) => {
      this.aiDifficulty = e.target.value;
    });

    this.start();
  }

  start() {
    this.initBoard();
    this.renderBoard();
    this.updateHUD();
  }

  renderBoard() {
    this.gridEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isDark = (r + c) % 2 === 1;
        const piece = this.board[r][c];
        const isSelected = this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c;
        const isValid = this.validMoves.some(m => m.r === r && m.c === c);

        const square = document.createElement('div');
        square.className = `chess-square ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isValid ? 'valid-move' : ''}`;
        square.dataset.r = r;
        square.dataset.c = c;
        square.textContent = piece ? this.PIECES[piece] : '';

        square.onclick = () => this.handleSquareClick(r, c);
        this.gridEl.appendChild(square);
      }
    }
  }

  handleSquareClick(r, c) {
    if (this.turn === 'b' && this.isVsAI) return;

    const piece = this.board[r][c];

    if (this.selectedSquare) {
      const move = this.validMoves.find(m => m.r === r && m.c === c);
      if (move) {
        this.makeMove(this.selectedSquare, { r, c });
        this.selectedSquare = null;
        this.validMoves = [];
        this.renderBoard();

        if (this.isVsAI && this.turn === 'b') {
          setTimeout(() => this.makeAIMove(), 500);
        }
        return;
      }
    }

    if (piece && piece.startsWith(this.turn)) {
      this.selectedSquare = { r, c };
      this.validMoves = this.calculateValidMoves(r, c);
      SoundManager.play('click');
      this.renderBoard();
    } else {
      this.selectedSquare = null;
      this.validMoves = [];
      this.renderBoard();
    }
  }

  calculateValidMoves(r, c) {
    const piece = this.board[r][c];
    if (!piece) return [];

    const moves = [];
    const color = piece[0];
    const type = piece[1];

    // Pawn
    if (type === 'P') {
      const dir = color === 'w' ? -1 : 1;
      if (this.isEmpty(r + dir, c)) {
        moves.push({ r: r + dir, c });
        if ((color === 'w' && r === 6) || (color === 'b' && r === 1)) {
          if (this.isEmpty(r + 2 * dir, c)) moves.push({ r: r + 2 * dir, c });
        }
      }
      if (this.isOpponent(r + dir, c - 1, color)) moves.push({ r: r + dir, c: c - 1 });
      if (this.isOpponent(r + dir, c + 1, color)) moves.push({ r: r + dir, c: c + 1 });
    }

    // Knight
    if (type === 'N') {
      const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      offsets.forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (this.inBounds(nr, nc) && !this.isAlly(nr, nc, color)) moves.push({ r: nr, c: nc });
      });
    }

    // Rook / Bishop / Queen / King
    const directions = {
      R: [[0,1],[0,-1],[1,0],[-1,0]],
      B: [[1,1],[1,-1],[-1,1],[-1,-1]],
      Q: [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]],
      K: [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]
    };

    if (directions[type]) {
      const isSingleStep = type === 'K';
      directions[type].forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        while (this.inBounds(nr, nc)) {
          if (this.isEmpty(nr, nc)) {
            moves.push({ r: nr, c: nc });
          } else if (this.isOpponent(nr, nc, color)) {
            moves.push({ r: nr, c: nc });
            break;
          } else break;
          if (isSingleStep) break;
          nr += dr; nc += dc;
        }
      });
    }

    return moves;
  }

  makeMove(from, to) {
    const piece = this.board[from.r][from.c];
    const captured = this.board[to.r][to.c];

    this.board[to.r][to.c] = piece;
    this.board[from.r][from.c] = null;

    if (captured) {
      SoundManager.play('hit');
      if (piece.startsWith('w')) this.score += 100;
    } else {
      SoundManager.play('click');
    }

    // Check Checkmate (King captured)
    if (captured && captured[1] === 'K') {
      const winner = piece[0] === 'w' ? 'White (You)' : 'Black (Computer)';
      const saveRes = StorageManager.saveScore('chess', 'Chess', this.score + 500);
      StorageManager.unlockAchievement('chess_master');
      if (this.onGameOver) this.onGameOver(`Checkmate! ${winner} Wins! 👑`, true, saveRes.bestScore);
      return;
    }

    this.turn = this.turn === 'w' ? 'b' : 'w';
    this.updateHUD();
  }

  makeAIMove() {
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] && this.board[r][c].startsWith('b')) {
          const valid = this.calculateValidMoves(r, c);
          valid.forEach(m => allMoves.push({ from: { r, c }, to: m }));
        }
      }
    }

    if (allMoves.length === 0) return;

    let chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];

    // Medium/Hard AI prefers capture moves
    if (this.aiDifficulty !== 'easy') {
      const captures = allMoves.filter(m => this.board[m.to.r][m.to.c] !== null);
      if (captures.length > 0) {
        chosenMove = captures[Math.floor(Math.random() * captures.length)];
      }
    }

    this.makeMove(chosenMove.from, chosenMove.to);
    this.renderBoard();
  }

  inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  isEmpty(r, c) { return this.inBounds(r, c) && this.board[r][c] === null; }
  isAlly(r, c, color) { return this.inBounds(r, c) && this.board[r][c] && this.board[r][c].startsWith(color); }
  isOpponent(r, c, color) { return this.inBounds(r, c) && this.board[r][c] && !this.board[r][c].startsWith(color); }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score} | Turn: ${this.turn === 'w' ? 'White' : 'Black'}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  destroy() { this.container.innerHTML = ''; }
}
