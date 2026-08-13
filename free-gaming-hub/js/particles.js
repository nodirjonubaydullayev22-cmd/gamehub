/* ==========================================================================
   Particle & Screen Shake Engine - Free Gaming Hub
   ========================================================================== */

const ParticleManager = {
  triggerScreenShake(element, duration = 300, intensity = 8) {
    if (!element) return;
    const startTime = performance.now();

    function shake(now) {
      const elapsed = now - startTime;
      if (elapsed < duration) {
        const dx = (Math.random() - 0.5) * intensity;
        const dy = (Math.random() - 0.5) * intensity;
        element.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(shake);
      } else {
        element.style.transform = 'none';
      }
    }

    requestAnimationFrame(shake);
  },

  createSparks(ctx, x, y, color = '#00f0ff', count = 15) {
    const sparks = [];
    for (let i = 0; i < count; i++) {
      sparks.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 4 + 2,
        alpha: 1,
        color
      });
    }
    return sparks;
  }
};
