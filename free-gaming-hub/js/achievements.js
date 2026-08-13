/* ==========================================================================
   Achievement System & Toast Engine - Free Gaming Hub
   Features: 20+ Trophy achievements with glowing toast notifications
   ========================================================================== */

const AchievementManager = {
  ACHIEVEMENTS: [
    { id: 'first_game', icon: '🏆', title: 'First Game', desc: 'Play your very first match' },
    { id: 'first_win', icon: '🥇', title: 'First Victory', desc: 'Win your first game match' },
    { id: 'pts_1000', icon: '🔥', title: '1000 Points', desc: 'Score over 1,000 points in any game' },
    { id: 'pts_5000', icon: '💥', title: '5000 Points', desc: 'Score over 5,000 points in any game' },
    { id: 'games_10', icon: '🎮', title: '10 Games Played', desc: 'Play 10 matches total across the hub' },
    { id: 'games_50', icon: '🌟', title: '50 Games Played', desc: 'Play 50 matches total across the hub' },
    { id: 'high_scorer', icon: '👑', title: 'High Scorer', desc: 'Achieve a personal record best score' },
    { id: 'perfect_game', icon: '⚡', title: 'Perfect Game', desc: 'Win a game without taking damage' },
    { id: 'speed_runner', icon: '🏎️', title: 'Speed Runner', desc: 'Reach top speed in Car Racing' },
    { id: 'chess_master', icon: '♟️', title: 'Chess Master', desc: 'Defeat the Computer AI in Chess' },
    { id: 'zombie_hunter', icon: '💀', title: 'Zombie Hunter', desc: 'Survive to Wave 5 in Zombie Survival' },
    { id: 'space_ace', icon: '🚀', title: 'Space Ace', desc: 'Destroy an Alien Dreadnought in Space Shooter' },
    { id: 'pool_master', icon: '🎱', title: 'Pool Master', desc: 'Pocket 3 balls in a single turn' },
    { id: 'racing_king', icon: '🏍️', title: 'Racing King', desc: 'Score over 1000m in Bike Racing' }
  ],

  init() {
    this.ensureToastContainer();
  },

  ensureToastContainer() {
    if (!document.getElementById('achievement-toast-container')) {
      const container = document.createElement('div');
      container.id = 'achievement-toast-container';
      document.body.appendChild(container);
    }
  },

  unlock(id) {
    this.ensureToastContainer();
    const unlocked = StorageManager.getUnlockedAchievements();

    if (!unlocked.includes(id)) {
      unlocked.push(id);
      StorageManager.unlockAchievement(id);

      const ach = this.ACHIEVEMENTS.find(a => a.id === id);
      if (ach) {
        this.showToast(ach);
      }
    }
  },

  showToast(ach) {
    const container = document.getElementById('achievement-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="toast-icon">${ach.icon}</div>
      <div>
        <div class="toast-title">🏆 ACHIEVEMENT UNLOCKED</div>
        <div class="toast-desc"><strong>${ach.title}</strong> - ${ach.desc}</div>
      </div>
    `;

    container.appendChild(toast);
    SoundManager.play('win');

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }
};

document.addEventListener('DOMContentLoaded', () => AchievementManager.init());
