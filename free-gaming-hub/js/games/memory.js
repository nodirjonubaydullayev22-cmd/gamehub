/* ==========================================================================
   Memory Game Engine - Free Gaming Hub
   Features: 4x4 Cyber card grid, card flipping animations, matching pairs
   ========================================================================== */

class MemoryGame {
  constructor(container, scoreEl, bestScoreEl, onGameOver) {
    this.container = container;
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.score = 0;
    this.bestScore = StorageManager.getBestScore('memory');
    this.gameActive = true;

    this.icons = ['🎮', '🚀', '🐍', '🧱', '🏓', '♟️', '🏀', '⚽'];

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="memory-wrapper" style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
        <div class="ms-grid" id="memory-grid" style="grid-template-columns: repeat(4, 75px); gap: 10px; padding: 12px;"></div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#memory-grid');
    this.start();
  }

  start() {
    this.score = 0;
    this.moves = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.gameActive = true;

    const deck = [...this.icons, ...this.icons].sort(() => Math.random() - 0.5);
    this.cards = deck.map((icon, idx) => ({ id: idx, icon, flipped: false, matched: false }));

    this.renderBoard();
    this.updateHUD();
  }

  renderBoard() {
    this.gridEl.innerHTML = '';
    this.cards.forEach((card, idx) => {
      const cell = document.createElement('div');
      cell.className = `ms-cell ${card.flipped || card.matched ? 'revealed' : ''}`;
      cell.style.width = '75px';
      cell.style.height = '75px';
      cell.style.fontSize = '2.2rem';

      cell.textContent = card.flipped || card.matched ? card.icon : '❓';

      cell.onclick = () => this.handleCardClick(idx);
      this.gridEl.appendChild(cell);
    });
  }

  handleCardClick(idx) {
    if (!this.gameActive || this.flippedCards.length >= 2) return;
    const card = this.cards[idx];
    if (card.flipped || card.matched) return;

    card.flipped = true;
    this.flippedCards.push(card);
    SoundManager.play('click');
    this.renderBoard();

    if (this.flippedCards.length === 2) {
      this.moves++;
      const [c1, c2] = this.flippedCards;

      if (c1.icon === c2.icon) {
        c1.matched = true;
        c2.matched = true;
        this.matchedPairs++;
        this.score += 150;
        SoundManager.play('score');
        if (this.score > this.bestScore) this.bestScore = this.score;
        this.flippedCards = [];
        this.updateHUD();

        if (this.matchedPairs === 8) {
          this.gameActive = false;
          SoundManager.play('win');
          const saveRes = StorageManager.saveScore('memory', 'Memory Game', this.score);
          this.bestScore = saveRes.bestScore;
          this.updateHUD();
          setTimeout(() => {
            if (this.onGameOver) this.onGameOver(`All Pairs Matched in ${this.moves} Moves! 🧠`, true, this.bestScore);
          }, 500);
        }
      } else {
        setTimeout(() => {
          c1.flipped = false;
          c2.flipped = false;
          this.flippedCards = [];
          this.renderBoard();
        }, 800);
      }
    }
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Moves: ${this.moves} | Pairs: ${this.matchedPairs} / 8 | Score: ${this.score}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  destroy() { this.container.innerHTML = ''; }
}
