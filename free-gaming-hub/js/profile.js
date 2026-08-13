/* ==========================================================================
   Profile & Achievements Controller - Free Gaming Hub
   Renders user profile stats, win/loss metrics, and unlocked achievement badges
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderProfileStats();
  renderAchievements();
});

function renderProfileStats() {
  const stats = StorageManager.getStats();
  const name = StorageManager.getGamerName() || 'Guest Player';

  const nameEl = document.getElementById('profile-gamer-name');
  const playedEl = document.getElementById('prof-games-played');
  const totalScoreEl = document.getElementById('prof-total-score');
  const winsEl = document.getElementById('prof-wins');
  const favGameEl = document.getElementById('prof-fav-game');

  if (nameEl) nameEl.textContent = name.toUpperCase();
  if (playedEl) playedEl.textContent = stats.gamesPlayed;
  if (totalScoreEl) totalScoreEl.textContent = stats.totalScore;
  if (winsEl) winsEl.textContent = `${stats.wins}W / ${stats.losses}L`;
  if (favGameEl) favGameEl.textContent = stats.favoriteGame;
}

function renderAchievements() {
  const unlocked = StorageManager.getUnlockedAchievements();
  const gridEl = document.getElementById('achievements-grid');
  if (!gridEl) return;

  gridEl.innerHTML = StorageManager.ACHIEVEMENTS_LIST.map(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    return `
      <div class="stat-card" style="text-align: left; opacity: ${isUnlocked ? '1' : '0.4'}; border-color: ${isUnlocked ? 'var(--neon-purple)' : 'var(--border-color)'}; box-shadow: ${isUnlocked ? '0 0 15px var(--neon-purple-glow)' : 'none'};">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${ach.icon}</div>
        <h4 style="font-family: var(--font-heading); color: ${isUnlocked ? 'var(--neon-blue)' : 'var(--text-muted)'}; margin-bottom: 0.25rem;">${ach.title} ${isUnlocked ? '✅' : '🔒'}</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">${ach.desc}</p>
      </div>
    `;
  }).join('');
}
