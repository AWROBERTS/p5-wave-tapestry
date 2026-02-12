// src/scene.js
// Clean scene render + audio analysis + breathing + tunnel update.

let hiEnergy = 0; // 0..1 driver for chroma modulation
let hiEnv = 0;

let breathe = 0;
let breathePhase = 0;
let loudSlow = 0;
let loudFast = 0;

function renderScene(g) {
  g.background(0, 0, 0, 18);

  if (!audioReady) {
    g.push();
    g.resetMatrix();
    g.noStroke();
    g.fill(0, 0, 0, 85);
    g.rect(-CONFIG.canvas.w / 2, -CONFIG.canvas.h / 2, CONFIG.canvas.w, CONFIG.canvas.h);

    g.fill(0, 0, 100, 95);
    g.textAlign(CENTER, CENTER);
    g.textSize(36);

    if (audioLoadError) {
      g.text(
        `Audio failed to load.\nAdd your file at: ${CONFIG.assets.audioMain}\nThen refresh.`,
        0,
        -20
      );
    } else {
      g.text("Loading audio…", 0, -20);
    }

    g.textSize(22);
    g.text("The sculpture will start after the audio is ready and you click.", 0, 70);
    g.pop();
    return;
  }

  if (!started) {
    g.push();
    g.resetMatrix();
    g.noStroke();
    g.fill(0, 0, 0, 70);
    g.rect(-CONFIG.canvas.w / 2, -CONFIG.canvas.h / 2, CONFIG.canvas.w, CONFIG.canvas.h);

    g.fill(0, 0, 100, 95);
    g.textAlign(CENTER, CENTER);
    g.textSize(34);
    g.text("Click to start", 0, -10);

    g.textSize(20);
    g.text("Audio is loaded. Waiting for your click to begin playback.", 0, 50);
    g.pop();
    return;
  }

  // --- Audio analysis ---
  fft.analyze();

  const bass = fft.getEnergy("bass");
  const mid = fft.getEnergy("mid");
  const highMid = fft.getEnergy("highMid");

  const [hiLo, hiHi] = CONFIG.audio.hiBandHz;
  const hiBand = fft.getEnergy(hiLo, hiHi);
  const hiNorm = constrain(hiBand / 255, 0, 1);

  hiEnv =
    hiNorm > hiEnv
      ? lerp(hiEnv, hiNorm, CONFIG.audio.hiAttack)
      : lerp(hiEnv, hiNorm, CONFIG.audio.hiRelease);

  hiEnergy = pow(constrain(hiEnv, 0, 1), CONFIG.audio.hiShapePow);

  const pulse = (bass * 0.6 + mid * 0.2 + highMid * 0.2) / 255;
  const loudness = constrain(amp.getLevel() * 3.0, 0, 1);
  const pulseSoft = pow(constrain(pulse, 0, 1), 1.15);

  // Kick driver hit (0..1)
  let kickLevel = 0;
  if (kickReady && kickAmp) kickLevel = constrain(kickAmp.getLevel() * 12.0, 0, 1);
  const kickHit = pow(kickLevel, 1.6);

  // --- Breathing (calmer) ---
  loudFast = lerp(loudFast, loudness, CONFIG.breathing.fastLerp);
  loudSlow = lerp(loudSlow, loudness, CONFIG.breathing.slowLerp);

  const breatheSpeed = CONFIG.breathing.speedBase + loudSlow * CONFIG.breathing.speedLoudBoost;
  breathePhase += breatheSpeed;

  const osc = 0.5 + 0.5 * sin(breathePhase * 57.2958);
  const targetBreathe = constrain(0.65 * osc + 0.55 * loudSlow, 0, 1);
  breathe = lerp(breathe, targetBreathe, CONFIG.breathing.targetLerp);
  const breatheEase = pow(breathe, CONFIG.breathing.easePow);

  // --- Traveling displacement field (kick shockwave history) ---
  TunnelField.update(kickHit, breatheEase, loudFast);

  g.push();

  // Camera orbit
  const orbitDeg = (millis() / 1000.0) * (360.0 / CONFIG.dna.cameraOrbitSeconds);
  const camDist = 1900;
  const camX = cos(orbitDeg) * camDist;
  const camZ = sin(orbitDeg) * camDist;
  const camY = sin(orbitDeg * 0.35) * 240;

  g.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);

  // Lighting
  g.ambientLight(0, 0, 45);
  g.directionalLight(0, 0, 95, -0.3, 0.6, -1.0);
  g.directionalLight(0, 0, 35, 0.8, -0.2, -0.6);

  drawDNAHelix(g, pulseSoft, loudness, breatheEase, kickHit);

  g.pop();
}

// Expose hiEnergy for post stack (VHS chroma modulation)
function getHiEnergy() {
  return hiEnergy;
}