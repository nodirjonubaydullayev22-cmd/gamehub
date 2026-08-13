/* ==========================================================================
   Solitaire Game Engine - Free Gaming Hub
   Features: Classic Klondike rules, Stock & Tableau piles, Auto Move & Score
   ========================================================================== */

class SolitaireGame {
  constructor(container, scoreEl, bestScoreEl, onGameOver) {
    this.container = container;
    this.scoreEl = scoreEl;
    this.bestScoreEl = bestScoreEl;
    this.onGameOver = onGameOver;

    this.score = 0;
    this.bestScore = StorageManager.getBestScore('solitaire');

    this.stock = [];
    this.waste = [];
    this.foundations = [[], [], [], []];
    this.tableau = [[], [], [], [], [], [], []];

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="solitaire-wrapper">
        <div class="sol-board">
          <div class="sol-top-row">
            <div style="display: flex; gap: 0.5rem;">
              <div class="card-pile" id="sol-stock"></div>
              <div class="card-pile" id="sol-waste"></div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              ${[0,1,2,3].map(i => `<div class="card-pile" id="sol-found-${i}"></div>`).join('')}
            </div>
          </div>
          <div class="sol-tableau" id="sol-tableau-row">
            ${[0,1,2,3,4,5,6].map(i => `<div class="card-pile" id="sol-tab-${i}" style="height: 250px;"></div>`).join('')}
          </div>
        </div>
      </div>
    `;

    this.stockEl = this.container.querySelector('#sol-stock');
    this.wasteEl = this.container.querySelector('#sol-waste');
    this.foundEls = [0,1,2,3].map(i => this.container.querySelector(`#sol-found-${i}`));
    this.tabEls = [0,1,2,3,4,5,6].map(i => this.container.querySelector(`#sol-tab-${i}`));

    this.stockEl.onclick = () => this.drawStock();
    this.start();
  }

  createDeck() {
    const suits = [{ s: '♠', c: 'black' }, { s: '♥', c: 'red' }, { s: '♦', c: 'red' }, { s: '♣', c: 'black' }];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];

    suits.forEach(suit => {
      ranks.forEach((val, vIdx) => {
        deck.push({ val, value: vIdx + 1, suit: suit.s, color: suit.c, faceUp: false });
      });
    });

    return deck.sort(() => Math.random() - 0.5);
  }

  start() {
    this.score = 0;
    const deck = this.createDeck();

    this.foundations = [[], [], [], []];
    this.tableau = [[], [], [], [], [], [], []];
    this.waste = [];

    // Deal Tableau
    for (let col = 0; col < 7; col++) {
      for (let i = 0; i <= col; i++) {
        const card = deck.pop();
        if (i === col) card.faceUp = true;
        this.tableau[col].push(card);
      }
    }

    this.stock = deck;
    this.render();
    this.updateHUD();
  }

  drawStock() {
    if (this.stock.length > 0) {
      const card = this.stock.pop();
      card.faceUp = true;
      this.waste.push(card);
      SoundManager.play('click');
    } else if (this.waste.length > 0) {
      this.stock = this.waste.reverse().map(c => ({ ...c, faceUp: false }));
      this.waste = [];
      SoundManager.play('click');
    }
    this.render();
  }

  render() {
    // Render Stock & Waste
    this.stockEl.innerHTML = this.stock.length > 0 ? `<div class="playing-card back"></div>` : '';
    this.wasteEl.innerHTML = '';
    if (this.waste.length > 0) {
      const topWaste = this.waste[this.waste.length - 1];
      this.wasteEl.appendChild(this.createCardElement(topWaste, () => this.autoMoveCard(topWaste, 'waste')));
    }

    // Render Foundations
    this.foundations.forEach((found, i) => {
      this.foundEls[i].innerHTML = '';
      if (found.length > 0) {
        const top = found[found.length - 1];
        this.foundEls[i].appendChild(this.createCardElement(top));
      }
    });

    // Render Tableau
    this.tableau.forEach((tab, colIdx) => {
      this.tabEls[colIdx].innerHTML = '';
      tab.forEach((card, idx) => {
        const cardEl = this.createCardElement(card, () => this.autoMoveCard(card, 'tableau', colIdx));
        cardEl.style.top = `${idx * 22}px`;
        this.tabEls[colIdx].appendChild(cardEl);
      });
    });
  }

  createCardElement(card, clickCallback) {
    const el = document.createElement('div');
    if (!card.faceUp) {
      el.className = 'playing-card back';
    } else {
      el.className = `playing-card ${card.color}`;
      el.innerHTML = `<div>${card.val}${card.suit}</div><div>${card.val}${card.suit}</div>`;
      if (clickCallback) el.onclick = clickCallback;
    }
    return el;
  }

  autoMoveCard(card, source, colIdx = 0) {
    // Check auto move to foundation
    for (let f = 0; f < 4; f++) {
      const found = this.foundations[f];
      const top = found[found.length - 1];
      if ((!top && card.value === 1) || (top && top.suit === card.suit && top.value === card.value - 1)) {
        found.push(card);
        this.score += 100;
        SoundManager.play('score');
        if (this.score > this.bestScore) this.bestScore = this.score;

        if (source === 'waste') this.waste.pop();
        if (source === 'tableau') {
          this.tableau[colIdx].pop();
          if (this.tableau[colIdx].length > 0) {
            this.tableau[colIdx][this.tableau[colIdx].length - 1].faceUp = true;
          }
        }
        this.updateHUD();
        this.checkWin();
        this.render();
        return;
      }
    }
  }

  checkWin() {
    const totalFound = this.foundations.reduce((sum, f) => sum + f.length, 0);
    if (totalFound === 52) {
      this.score += 2000;
      SoundManager.play('win');
      const saveRes = StorageManager.saveScore('solitaire', 'Solitaire', this.score);
      this.bestScore = saveRes.bestScore;
      this.updateHUD();
      setTimeout(() => {
        if (this.onGameOver) this.onGameOver('Solitaire Solved! Royal Victory! 🃏', true, this.bestScore);
      }, 500);
    }
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score}`;
    if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
  }

  destroy() { this.container.innerHTML = ''; }
}
