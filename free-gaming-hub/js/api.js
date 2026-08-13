/* ==========================================================================
   Frontend REST API Client - Free Gaming Hub
   Handles communication with Node.js Express REST API Server
   ========================================================================== */

const APIClient = {
  baseURL: window.location.origin.includes('localhost') ? 'http://localhost:3000/api' : '/api',

  async login(name) {
    try {
      const res = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      return await res.json();
    } catch (err) {
      console.warn('API Client offline, fallback to LocalStorage');
      return null;
    }
  },

  async submitScore(name, game, score, isWin = true) {
    try {
      const res = await fetch(`${this.baseURL}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, game, score, isWin })
      });
      return await res.json();
    } catch (err) {
      console.warn('API Client offline, fallback to LocalStorage');
      return null;
    }
  },

  async getLeaderboard() {
    try {
      const res = await fetch(`${this.baseURL}/leaderboard`);
      const data = await res.json();
      return data.leaderboard;
    } catch (err) {
      console.warn('API Client offline, fallback to LocalStorage');
      return null;
    }
  },

  async unlockAchievement(name, achievementId) {
    try {
      const res = await fetch(`${this.baseURL}/achievements/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, achievementId })
      });
      return await res.json();
    } catch (err) {
      console.warn('API Client offline, fallback to LocalStorage');
      return null;
    }
  }
};
