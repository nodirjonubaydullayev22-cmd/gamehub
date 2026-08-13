/* ==========================================================================
   Jigsaw Puzzle Engine - Free Gaming Hub
   Features: Scrambled image tiles, 9/16/25 piece difficulty, drag & swap logic
   ========================================================================== */

class JigsawGame {
  constructor(container, scoreEl, bestScoreEl, onGameOver) {
    this.container = container;
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.gridSize = 3; // 3x3 = 9 pieces
    this.tiles = [];
    this.selectedTile = null;

    this.score = 0;
    this.moves = 0;
    this.bestScore = StorageManager.getBestScore('jigsaw');
    this.gameActive = true;

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="jigsaw-wrapper">
        <div class="hud-item" style="flex-direction: row; gap: 1rem;">
          <button class="ttt-mode-btn active" id="jig-3x3">3x3 (9 Pcs)</button>
          <button class="ttt-mode-btn" id="jig-4x4">4x4 (16 Pcs)</button>
        </div>
        <div class="jigsaw-board" id="jigsaw-grid"></div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#jigsaw-grid');
    this.btn3 = this.container.querySelector('#jig-3x3');
    this.btn4 = this.container.querySelector('#jig-4x4');

    this.btn3.onclick = () => { this.gridSize = 3; this.btn3.classList.add('active'); this.btn4.classList.remove('active'); this.start(); };
    this.btn4.onclick = () => { this.gridSize = 4; this.btn4.classList.add('active'); this.btn3.classList.remove('active'); this.start(); };

    this.start();
  }

  start() {
    this.score = 0;
    this.moves = 0;
    this.gameActive = true;
    this.selectedTile = null;

    const total = this.gridSize * this.gridSize;
    const correctOrder = Array.from({ length: total }, (_, i) => i);
    let scrambled = [...correctOrder].sort(() => Math.random() - 0.5);

    this.tiles = scrambled.map((val, currentIdx) => ({
      correctIdx: val,
      currentIdx: currentIdx
    }));

    this.renderBoard();
    this.updateHUD();
  }

  renderBoard() {
    this.gridEl.style.gridTemplateColumns = `repeat(${this.gridSize}, ${320 / this.gridSize}px)`;
    this.gridEl.style.gridTemplateRows = `repeat(${this.gridSize}, ${320 / this.gridSize}px)`;
    this.gridEl.innerHTML = '';

    const tileSize = 320 / this.gridSize;

    this.tiles.forEach((tile, idx) => {
      const el = document.createElement('div');
      el.className = 'jigsaw-tile';
      el.style.width = `${tileSize}px`;
      el.style.height = `${tileSize}px`;

      // Neon Gradient Cyber Patterns for Tiles
      const correctRow = Math.floor(tile.correctIdx / this.gridSize);
      const correctCol = tile.correctIdx % this.gridSize;
      const hue = (tile.correctIdx * 40) % 360;

      el.style.background = `hsl(${hue}, 80%, 40%)`;
      el.innerHTML = `<div style="color: #fff; font-family: var(--font-heading); font-weight: 800; font-size: 1.2rem; display: flex; justify-content: center; align-items: center; height: 100%;">${tile.correctIdx + 1}</div>`;

      if (this.selectedTile === idx) {
        el.style.outline = '3px solid var(--neon-blue)';
      }

      el.onclick = () => this.handleTileClick(idx);
      this.gridEl.appendChild(el);
    });
  }

  handleTileClick(idx) {
    if (!this.gameActive) return;

    if (this.selectedTile === null) {
      this.selectedTile = idx;
      SoundManager.play('click');
      this.renderBoard();
    } else {
      // Swap tiles
      const temp = this.tiles[this.selectedTile].correctIdx;
      this.tiles[this.selectedTile].correctIdx = this.tiles[idx].correctIdx;
      this.tiles[idx].correctIdx = temp;

      this.selectedTile = null;
      this.moves++;
      SoundManager.play('hit');
      this.checkWin();
      this.renderBoard();
    }
  }

  checkWin() {
    const isSolved = this.tiles.every((tile, idx) => tile.correctIdx === idx);

    if (isSolved) {
      this.gameActive = false;
      this.score = Math.max(100, 1000 - this.moves * 20);
      SoundManager.play('win');

      const saveRes = StorageManager.saveScore('jigsaw', 'Jigsaw Puzzle', this.score);
      this.bestScore = saveRes.bestScore;
      this.updateHUD();
      setTimeout(() => {
        if (this.onGameOver) this.onGameOver(`Puzzle Solved in ${this.moves} Moves! 🧩`, true, this.bestScore);
      }, 500);
    }
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Moves: ${this.moves} | Score: ${this.score}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  destroy() { this.container.innerHTML = ''; }
}
