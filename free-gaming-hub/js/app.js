/* ==========================================================================
   AAA Esports Main Launcher Controller - Free Gaming Hub
   Features: 3-2-1 Pre-Game Countdown, Fullscreen Mode, Volume Control Slider,
   Modal Launcher for 25 Playable Games, Live Search & Category Sorting
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initGamerProfile();
  initNavigation();
  initSoundAndVolumeControls();
  initGameLauncherModal();
  initSearchAndFilterSystem();
  updateGlobalStatsDisplay();
});

/* 1. Gamer Profile Tag */
function initGamerProfile() {
  const currentName = StorageManager.getGamerName();
  const playerBadgeEl = document.getElementById('player-profile-badge');

  if (!currentName) showWelcomeNameModal();
  else updateBadge(currentName);

  if (playerBadgeEl) {
    playerBadgeEl.addEventListener('click', () => showWelcomeNameModal(true));
  }
}

function updateBadge(name) {
  const playerBadgeEl = document.getElementById('player-profile-badge');
  if (playerBadgeEl) playerBadgeEl.innerHTML = `<span>WELCOME, ${name.toUpperCase()}</span> 🎮`;
}

function showWelcomeNameModal(isEdit = false) {
  const existingModal = document.getElementById('welcome-name-modal');
  if (existingModal) existingModal.remove();

  const currentName = StorageManager.getGamerName() || '';

  const modalHtml = `
    <div class="modal-backdrop" id="welcome-name-modal">
      <div class="welcome-modal-card">
        <div class="welcome-icon">🎮</div>
        <h2 class="welcome-title">${isEdit ? 'UPDATE GAMER TAG' : 'WELCOME, PLAYER!'}</h2>
        <p class="welcome-text">Enter your custom gamer tag to save high scores & climb the Leaderboard!</p>
        <input type="text" id="gamer-name-input" class="gamer-input" placeholder="e.g. CyberPro" value="${currentName}" maxlength="15" autocomplete="off" />
        <button id="save-gamer-name-btn" class="btn-primary" style="width: 100%; justify-content: center;">
          ${isEdit ? 'SAVE CHANGES' : 'START PLAYING'}
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const inputEl = document.getElementById('gamer-name-input');
  const saveBtn = document.getElementById('save-gamer-name-btn');
  inputEl.focus();

  const handleSave = () => {
    const nameVal = inputEl.value.trim();
    if (nameVal !== '') {
      StorageManager.setGamerName(nameVal);
      updateBadge(nameVal);
      document.getElementById('welcome-name-modal').remove();
    } else {
      inputEl.style.borderColor = 'var(--neon-pink)';
    }
  };

  saveBtn.addEventListener('click', handleSave);
  inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSave(); });
}

/* 2. Navigation */
function initNavigation() {
  const navToggleBtn = document.getElementById('mobile-nav-toggle');
  const navLinksList = document.getElementById('nav-links-list');
  if (navToggleBtn && navLinksList) {
    navToggleBtn.addEventListener('click', () => navLinksList.classList.toggle('active'));
  }
}

/* 3. Sound & Volume Controls */
function initSoundAndVolumeControls() {
  const soundBtn = document.getElementById('global-sound-btn');
  const volSlider = document.getElementById('global-volume-slider');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => SoundManager.toggleSound());
  }

  if (volSlider) {
    volSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      SoundManager.setVolume(vol);
    });
  }
}

/* 4. Game Launcher & 3-2-1 Countdown System */
let currentGameInstance = null;

function initGameLauncherModal() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.game-play-btn');
    if (btn) {
      const card = btn.closest('.game-card');
      const gameKey = card.dataset.game;
      const gameTitle = card.dataset.title;
      openGameModal(gameKey, gameTitle);
    }
  });
}

function openGameModal(gameKey, gameTitle) {
  const modal = document.getElementById('game-interactive-modal');
  const modalTitle = document.getElementById('game-modal-title-text');
  const viewArea = document.getElementById('game-view-area');

  if (!modal || !viewArea) return;

  modalTitle.textContent = gameTitle.toUpperCase();
  viewArea.innerHTML = '';

  if (currentGameInstance && typeof currentGameInstance.destroy === 'function') {
    currentGameInstance.destroy();
  }

  // Show Pre-Game 3-2-1 Countdown Animation
  startPreGameCountdown(container => {
    setupGameDOM(gameKey, gameTitle, viewArea);
  }, viewArea);

  modal.classList.add('active');

  const closeBtn = document.getElementById('close-game-modal-btn');
  closeBtn.onclick = () => {
    if (currentGameInstance && typeof currentGameInstance.destroy === 'function') {
      currentGameInstance.destroy();
    }
    modal.classList.remove('active');
    updateGlobalStatsDisplay();
  };
}

function startPreGameCountdown(onComplete, container) {
  container.innerHTML = `
    <div class="countdown-overlay">
      <div class="countdown-number" id="cd-num">3</div>
    </div>
  `;

  const numEl = document.getElementById('cd-num');
  let count = 3;

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      numEl.textContent = count;
      SoundManager.play('click');
    } else if (count === 0) {
      numEl.textContent = 'GO!';
      numEl.style.color = 'var(--neon-purple)';
      SoundManager.play('score');
    } else {
      clearInterval(interval);
      container.innerHTML = '';
      onComplete(container);
    }
  }, 700);
}

function setupGameDOM(gameKey, gameTitle, container) {
  const isCanvasGame = ['snake', 'tetris', 'pingpong', 'shooter', 'car-racing', 'flappy-bird', 'zombie-shooter', 'basketball', 'penalty', 'pool', 'archery', 'tower-defense', 'boxing', 'bike-racing', 'stickman', 'zombie', 'asteroid'].includes(gameKey);

  if (isCanvasGame) {
    container.innerHTML = `
      <div class="game-hud">
        <div class="hud-item"><span class="hud-label">Score / Status</span><span class="hud-value" id="modal-hud-score">0</span></div>
        <div class="hud-item"><span class="hud-label">Best Record</span><span class="hud-value" id="modal-hud-best">0</span></div>
        <button class="btn-secondary" id="modal-restart-btn">Restart 🔄</button>
      </div>
      <canvas id="modal-game-canvas"></canvas>
    `;

    const canvas = document.getElementById('modal-game-canvas');
    const scoreEl = document.getElementById('modal-hud-score');
    const bestEl = document.getElementById('modal-hud-best');
    const restartBtn = document.getElementById('modal-restart-btn');

    const gameOverCallback = (scoreVal, isNewHigh, bestVal) => {
      SoundManager.play('gameover');
      showGameOverOverlay(container, gameTitle, scoreVal, isNewHigh, () => currentGameInstance.start());
    };

    if (gameKey === 'snake') currentGameInstance = new SnakeGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'tetris') {
      container.querySelector('.game-hud').insertAdjacentHTML('afterend', '<div style="display:flex;gap:1rem;"><canvas id="modal-game-next"></canvas></div>');
      const nextCanvas = document.getElementById('modal-game-next');
      currentGameInstance = new TetrisGame(canvas, nextCanvas, scoreEl, null, bestEl, gameOverCallback);
    }
    else if (gameKey === 'pingpong') currentGameInstance = new PingPongGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'shooter') currentGameInstance = new SpaceShooterGame(canvas, scoreEl, null, bestEl, gameOverCallback);
    else if (gameKey === 'car-racing') currentGameInstance = new CarRacingGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'flappy-bird') currentGameInstance = new FlappyBirdGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'zombie-shooter') currentGameInstance = new ZombieShooterGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'basketball') currentGameInstance = new BasketballGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'penalty') currentGameInstance = new PenaltyGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'pool') currentGameInstance = new PoolGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'archery') currentGameInstance = new ArcheryGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'tower-defense') currentGameInstance = new TowerDefenseGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'boxing') currentGameInstance = new BoxingGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'bike-racing') currentGameInstance = new BikeRacingGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'stickman') currentGameInstance = new StickmanGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'zombie') currentGameInstance = new ZombieGame(canvas, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'asteroid') currentGameInstance = new AsteroidGame(canvas, scoreEl, bestEl, gameOverCallback);

    restartBtn.onclick = () => currentGameInstance.start();
    currentGameInstance.start();

  } else {
    // Board Games
    container.innerHTML = `
      <div class="game-hud">
        <div class="hud-item"><span class="hud-label">Score / Status</span><span class="hud-value" id="modal-hud-score">0</span></div>
        <div class="hud-item"><span class="hud-label">Best Record</span><span class="hud-value" id="modal-hud-best">0</span></div>
        <button class="btn-secondary" id="modal-restart-btn">Restart 🔄</button>
      </div>
      <div id="modal-board-container" style="width: 100%; display: flex; justify-content: center;"></div>
    `;

    const boardContainer = document.getElementById('modal-board-container');
    const scoreEl = document.getElementById('modal-hud-score');
    const bestEl = document.getElementById('modal-hud-best');
    const restartBtn = document.getElementById('modal-restart-btn');

    const gameOverCallback = (resVal, isNewHigh, bestVal) => {
      SoundManager.play('gameover');
      showGameOverOverlay(container, gameTitle, resVal, isNewHigh, () => currentGameInstance.start());
    };

    if (gameKey === 'tictactoe') currentGameInstance = new TicTacToeGame(boardContainer, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'memory') currentGameInstance = new MemoryGame(boardContainer, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === '2048') currentGameInstance = new Game2048(boardContainer, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'chess') currentGameInstance = new ChessGame(boardContainer, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'minesweeper') currentGameInstance = new MinesweeperGame(boardContainer, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'sudoku') currentGameInstance = new SudokuGame(boardContainer, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'solitaire') currentGameInstance = new SolitaireGame(boardContainer, scoreEl, bestEl, gameOverCallback);
    else if (gameKey === 'jigsaw') currentGameInstance = new JigsawGame(boardContainer, scoreEl, bestEl, gameOverCallback);

    restartBtn.onclick = () => currentGameInstance.start();
  }
}

function showGameOverOverlay(container, title, scoreResult, isNewHigh, restartCallback) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute; inset: 0; background: rgba(5, 5, 9, 0.92);
    backdrop-filter: blur(12px); display: flex; flex-direction: column;
    justify-content: center; align-items: center; z-index: 10; text-align: center; padding: 2rem;
  `;

  overlay.innerHTML = `
    <h2 style="font-family: var(--font-heading); font-size: 2.2rem; color: var(--neon-pink); margin-bottom: 0.5rem; text-shadow: 0 0 20px var(--neon-pink);">GAME OVER</h2>
    <p style="font-family: var(--font-subheading); font-size: 1.2rem; color: #fff; margin-bottom: 1.5rem;">${title}</p>
    
    <div style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 1.5rem 2.5rem; border-radius: 16px; margin-bottom: 2rem;">
      <p style="color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">FINAL RESULT</p>
      <p style="font-family: var(--font-heading); font-size: 2.2rem; color: var(--neon-blue); font-weight: 900;">${scoreResult}</p>
      ${isNewHigh ? '<p style="color: #ffd700; font-family: var(--font-subheading); font-weight: 700; margin-top: 0.5rem;">🎉 NEW PERSONAL RECORD! 🎉</p>' : ''}
    </div>

    <div style="display: flex; gap: 1rem;">
      <button id="go-replay-btn" class="btn-primary">PLAY AGAIN 🔄</button>
    </div>
  `;

  container.appendChild(overlay);
  document.getElementById('go-replay-btn').onclick = () => { overlay.remove(); restartCallback(); };
}

/* 5. Live Search & Category Filtering */
function initSearchAndFilterSystem() {
  const searchInput = document.getElementById('game-search-input');
  const filterBtns = document.querySelectorAll('.cat-filter-btn');

  let currentQuery = '';
  let currentCategory = 'all';

  const filterCards = () => {
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
      const title = card.dataset.title.toLowerCase();
      const cat = card.dataset.category ? card.dataset.category.toLowerCase() : '';
      const desc = card.querySelector('.game-card-desc').textContent.toLowerCase();

      const matchesSearch = title.includes(currentQuery) || desc.includes(currentQuery);
      const matchesCat = currentCategory === 'all' || cat === currentCategory;

      card.style.display = matchesSearch && matchesCat ? 'flex' : 'none';
    });
  };

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentQuery = e.target.value.toLowerCase().trim();
      filterCards();
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.category.toLowerCase();
      filterCards();
    });
  });
}

/* 6. Global Stats Display */
function updateGlobalStatsDisplay() {
  const stats = StorageManager.getStats();
  const scores = StorageManager.getScores();

  const gamesPlayedVal = document.getElementById('stat-games-played');
  const totalScoreVal = document.getElementById('stat-total-score');
  const favGameVal = document.getElementById('stat-fav-game');

  if (gamesPlayedVal) gamesPlayedVal.textContent = stats.gamesPlayed;
  if (totalScoreVal) totalScoreVal.textContent = stats.totalScore;
  if (favGameVal) favGameVal.textContent = stats.favoriteGame;

  for (const [gameKey, score] of Object.entries(scores)) {
    const scoreValEl = document.getElementById(`best-score-${gameKey}`);
    if (scoreValEl) scoreValEl.textContent = score;
  }
}
