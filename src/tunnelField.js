// src/tunnelField.js
// Kick-driven traveling displacement history buffer.

const TunnelField = (() => {
  let heights = null;

  function init() {
    heights = [];
    for (let a = 0; a < CONFIG.tunnelField.pointsPerRing; a++) {
      heights[a] = [];
      for (let r = 0; r < CONFIG.tunnelField.ringCount; r++) heights[a][r] = 0;
    }
  }

  function update(kickHit, breatheEase, loudFast) {
    if (!heights) init();

    const A = CONFIG.tunnelField.pointsPerRing;
    const R = CONFIG.tunnelField.ringCount;

    for (let a = 0; a < A; a++) {
      const basePower = pow(constrain(kickHit, 0, 1), 1.2) * CONFIG.tunnelField.basePowerScale;
      const noiseDetail =
        noise(a * 0.12, frameCount * 0.02) *
        CONFIG.tunnelField.noiseDetailScale *
        (0.15 + 0.85 * breatheEase);
      const flutter =
        (noise(a * 0.35, frameCount * 0.04) - 0.5) *
        CONFIG.tunnelField.flutterScale *
        (0.15 + loudFast);

      heights[a][0] = basePower + noiseDetail + flutter;
    }

    for (let r = R - 1; r > 0; r--) {
      for (let a = 0; a < A; a++) heights[a][r] = heights[a][r - 1];
    }
  }

  function sample(tt, angDeg) {
    const A = CONFIG.tunnelField.pointsPerRing;
    const R = CONFIG.tunnelField.ringCount;

    const rFloat = (1.0 - tt) * (R - 1);
    const r0 = constrain(floor(rFloat), 0, R - 1);

    const ang = ((angDeg % 360) + 360) % 360;
    const aFloat = (ang / 360) * A;
    const a0 = constrain(floor(aFloat) % A, 0, A - 1);

    return (heights && heights[a0] && heights[a0][r0]) || 0;
  }

  return { init, update, sample };
})();