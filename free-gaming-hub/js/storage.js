/* ==========================================================================
   Storage & API Sync Manager Module - Free Gaming Hub
   Syncs local storage with Express REST API Backend
   ========================================================================== */

const StorageManager = {
  KEYS: {
    GAMER_NAME: 'fgh_gamer_name',
    SCORES: 'fgh_scores',
    STATS: 'fgh_stats',
    ACHIEVEMENTS: 'fgh_achievements',
    LEADERBOARD: 'fgh_leaderboard'
  },

  ALL_GAMES: [
    'snake', 'tictactoe', 'tetris', 'pingpong', 'shooter',
    'car-racing', 'flappy-bird', 'memory', '2048', 'zombie-shooter',
    'chess', 'basketball', 'penalty', 'pool', 'archery',
    'minesweeper', 'sudoku', 'solitaire', 'tower-defense', 'boxing',
    'bike-racing', 'stickman', 'zombie', 'asteroid', 'jigsaw'
  ],

  DEFAULT_LEADERBOARD: [
    { rank: 1, name: "Nodir", game: "Chess", score: 9500, date: "2026-08-13" },
    { rank: 2, name: "Alex", game: "Basketball", score: 8200, date: "2026-08-13" },
    { rank: 3, name: "John", game: "Zombie Survival", score: 7600, date: "2026-08-12" },
    { rank: 4, name: "CyberNinja", game: "Space Shooter", score: 14500, date: "2026-08-10" },
    { rank: 5, name: "NeonViper", game: "Tetris", score: 11200, date: "2026-08-11" },
    { rank: 6, name: "ShadowKing", game: "Snake", score: 890, date: "2026-08-12" }
  ],

  init() {
    if (!localStorage.getItem(this.KEYS.SCORES)) {
      const initialScores = {};
      this.ALL_GAMES.forEach(g => initialScores[g] = 0);
      localStorage.setItem(this.KEYS.SCORES, JSON.stringify(initialScores));
    }

    if (!localStorage.getItem(this.KEYS.STATS)) {
      const initialPlayed = {};
      this.ALL_GAMES.forEach(g => initialPlayed[g] = 0);

      const initialStats = {
        gamesPlayed: 0,
        totalScore: 0,
        wins: 0,
        losses: 0,
        favoriteGame: 'Snake',
        playedCounts: initialPlayed
      };
      localStorage.setItem(this.KEYS.STATS, JSON.stringify(initialStats));
    }

    if (!localStorage.getItem(this.KEYS.ACHIEVEMENTS)) {
      localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify([]));
    }

    if (!localStorage.getItem(this.KEYS.LEADERBOARD)) {
      localStorage.setItem(this.KEYS.LEADERBOARD, JSON.stringify(this.DEFAULT_LEADERBOARD));
    }
  },

  getGamerName() {
    return localStorage.getItem(this.KEYS.GAMER_NAME) || null;
  },

  setGamerName(name) {
    if (name && name.trim() !== '') {
      const gamerName = name.trim();
      localStorage.setItem(this.KEYS.GAMER_NAME, gamerName);
      if (typeof APIClient !== 'undefined') APIClient.login(gamerName);
      return true;
    }
    return false;
  },

  getScores() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.SCORES));
  },

  getBestScore(gameKey) {
    const scores = this.getScores();
    return scores[gameKey] || 0;
  },

  saveScore(gameKey, gameTitle, score, isWin = true) {
    this.init();
    const scores = this.getScores();
    const currentBest = scores[gameKey] || 0;

    let isNewHigh = false;
    if (score > currentBest) {
      scores[gameKey] = score;
      localStorage.setItem(this.KEYS.SCORES, JSON.stringify(scores));
      isNewHigh = true;
    }

    this.updateStats(gameKey, score, isWin);
    this.addLeaderboardEntry(gameTitle, score);

    const gamerName = this.getGamerName() || 'Player';
    if (typeof APIClient !== 'undefined') {
      APIClient.submitScore(gamerName, gameTitle, score, isWin);
    }

    return { isNewHigh, bestScore: scores[gameKey] || score };
  },

  getStats() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.STATS));
  },

  updateStats(gameKey, score, isWin) {
    const stats = this.getStats();
    stats.gamesPlayed += 1;
    stats.totalScore += Math.max(0, score);
    if (isWin) stats.wins += 1; else stats.losses += 1;

    stats.playedCounts[gameKey] = (stats.playedCounts[gameKey] || 0) + 1;

    let favorite = 'Snake';
    let maxCount = 0;
    for (const [gKey, count] of Object.entries(stats.playedCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favorite = gKey;
      }
    }
    stats.favoriteGame = favorite;
    localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats));
  },

  getUnlockedAchievements() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.ACHIEVEMENTS));
  },

  unlockAchievement(id) {
    this.init();
    const unlocked = this.getUnlockedAchievements();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(unlocked));

      const gamerName = this.getGamerName() || 'Player';
      if (typeof APIClient !== 'undefined') {
        APIClient.unlockAchievement(gamerName, id);
      }
    }
  },

  getLeaderboard() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.LEADERBOARD));
  },

  addLeaderboardEntry(gameTitle, score) {
    if (score <= 0) return;

    const gamerName = this.getGamerName() || 'Player';
    let leaderboard = this.getLeaderboard();

    const existingIndex = leaderboard.findIndex(e => e.name === gamerName && e.game === gameTitle);
    
    if (existingIndex !== -1) {
      if (score > leaderboard[existingIndex].score) {
        leaderboard[existingIndex].score = score;
        leaderboard[existingIndex].date = new Date().toISOString().split('T')[0];
      }
    } else {
      leaderboard.push({
        name: gamerName,
        game: gameTitle,
        score: score,
        date: new Date().toISOString().split('T')[0]
      });
    }

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.map((item, index) => ({ ...item, rank: index + 1 }));
    leaderboard = leaderboard.slice(0, 20);

    localStorage.setItem(this.KEYS.LEADERBOARD, JSON.stringify(leaderboard));
  }
};

StorageManager.init();
