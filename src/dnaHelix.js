// src/dnaHelix.js
// DNA renderer: two strands + ladder rungs + sphere nodes.

let rungShiftPhase = 0;

function drawDNAHelix(g, pulse, loudness, breatheEase, kickHit) {
  g.textureMode(NORMAL);

  const breathSigned = (breatheEase - 0.5) * 2.0; // -1..1
  const baseRadius =
    (CONFIG.dna.radius + CONFIG.dna.radiusBoost) *
    (1.0 + CONFIG.breathing.radiusBreathAmount * breathSigned);

  const lengthScale = 1.0 + CONFIG.breathing.lengthBreathAmount * breathSigned;
  const twistBreath = CONFIG.breathing.twistBreathDeg * breathSigned;

  const texScroll = millis() * 0.000022 * (0.55 + 0.85 * loudness);

  function v3(x, y, z) {
    return { x, y, z };
  }
  function sub(a, b) {
    return v3(a.x - b.x, a.y - b.y, a.z - b.z);
  }
  function add(a, b) {
    return v3(a.x + b.x, a.y + b.y, a.z + b.z);
  }
  function mul(a, s) {
    return v3(a.x * s, a.y * s, a.z * s);
  }
  function len(a) {
    return sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  }
  function norm(a) {
    const l = len(a);
    if (l < 1e-6) return v3(0, 1, 0);
    return v3(a.x / l, a.y / l, a.z / l);
  }
  function cross(a, b) {
    return v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  }

  function helixPos(tt, phaseDeg) {
    const twistWobble = sin(tt * 360) * (4.0 + 7.0 * breatheEase);
    const ang = tt * CONFIG.dna.turns * 360 + phaseDeg + twistBreath + twistWobble;

    const loudPunch = constrain(pow(loudness, 0.75), 0, 1);
    const radiusRipple = sin(tt * 360 * 2.0 + phaseDeg) * (14 + 70 * breatheEase + 55 * loudPunch);

    const travelSpeed = 0.35 + 0.9 * loudPunch;
    const travel =
      sin(tt * 360 * 4.0 - frameCount * travelSpeed + phaseDeg * 0.35) * (12 + 110 * loudPunch);

    let r = baseRadius + radiusRipple + travel;

    const h = TunnelField.sample(tt, ang);
    const kickDisplace = (h / CONFIG.tunnelField.basePowerScale) * 55.0;
    r += kickDisplace * (0.25 + 0.75 * constrain(kickHit, 0, 1));

    const x = cos(ang) * r;
    const y = sin(ang) * r;
    const z = map(tt, 0, 1, -CONFIG.dna.length / 2, CONFIG.dna.length / 2) * lengthScale;
    return v3(x, y, z);
  }

  function drawTexturedStrand(phaseDeg, vOffset) {
    if (!video) return;

    g.push();
    g.noStroke();
    g.texture(video);

    g.beginShape(TRIANGLE_STRIP);
    for (let i = 0; i < CONFIG.dna.nodes; i++) {
      const tt = i / (CONFIG.dna.nodes - 1);
      const p = helixPos(tt, phaseDeg);

      const tt2 = min(1, (i + 1) / (CONFIG.dna.nodes - 1));
      const p2 = helixPos(tt2, phaseDeg);
      const tangent = norm(sub(p2, p));

      const radial = norm(v3(p.x, p.y, 0));
      const side = norm(cross(tangent, radial));
      const halfW = CONFIG.dna.strandRibbonWidth * 0.5;

      const a = add(p, mul(side, halfW));
      const b = add(p, mul(side, -halfW));

      const u = (tt + texScroll) % 1.0;
      g.vertex(a.x, a.y, a.z, u, 0.0 + vOffset);
      g.vertex(b.x, b.y, b.z, u, 1.0 + vOffset);
    }
    g.endShape();

    g.pop();
  }

  // Strands
  drawTexturedStrand(0, 0.0);
  drawTexturedStrand(180, 0.15);

  // Ladder rungs
  const beat = constrain(pow(pulse, 1.35), 0, 1);
  const swell = constrain(0.35 + 0.65 * breatheEase, 0, 1);
  const loudPunch = constrain(pow(loudness, 0.85), 0, 1);

  const rungAlpha = (18 + loudPunch * 80 + beat * 14) * swell;
  const rungWeight = CONFIG.dna.ladderStrokeWeight + loudPunch * 3.4 + beat * 1.0;

  g.stroke(0, 0, 100, rungAlpha);
  g.strokeWeight(rungWeight);

  const rate = 0.0016 + loudPunch * 0.024;
  rungShiftPhase += rate;

  const step = (CONFIG.dna.ladderEvery / (CONFIG.dna.nodes - 1)) * 1.0;
  const maxShift = 0.035;
  const rawShift = (rungShiftPhase % 1.0) * maxShift;
  const quantShift = floor(rawShift / step) * step;

  function drawCurvedRung(a, b, bowAmt, wobbleAmt, segments) {
    segments = max(3, segments | 0);

    const mx = (a.x + b.x) * 0.5;
    const my = (a.y + b.y) * 0.5;

    const mLen = sqrt(mx * mx + my * my) + 1e-6;
    const nx = mx / mLen;
    const ny = my / mLen;

    g.beginShape();
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;

      let x = lerp(a.x, b.x, t);
      let y = lerp(a.y, b.y, t);
      const z = lerp(a.z, b.z, t);

      const bulge = sin(t * 180) * bowAmt;
      const buzz =
        (noise(mx * 0.002 + t * 4.0, my * 0.002 + frameCount * 0.015) - 0.5) *
        wobbleAmt *
        sin(t * 180);

      x += nx * (bulge + buzz);
      y += ny * (bulge + buzz);

      g.vertex(x, y, z);
    }
    g.endShape();
  }

  for (let i = 0; i < CONFIG.dna.nodes; i += CONFIG.dna.ladderEvery) {
    const tt = i / (CONFIG.dna.nodes - 1);

    const a = helixPos(tt, 0);
    const bT = constrain(tt + quantShift, 0, 1);
    const b = helixPos(bT, 180);

    const micro = (noise(i * 0.08, frameCount * 0.02) - 0.5) * 0.55 * (0.2 + 0.8 * loudPunch);
    const w = max(0.5, rungWeight + micro);
    g.strokeWeight(w);

    const bow = (6 + 30 * loudPunch) * (0.35 + 0.65 * breatheEase);
    const wobble = 1.2 + 7.5 * loudPunch;

    drawCurvedRung(a, b, bow, wobble, 8);
  }

  // Nodes
  const nodeSize = 15.0 + loudness * 3.0 + 2.0 * breatheEase;
  const nodeTex = nodeVideo || video;

  for (let i = 0; i < CONFIG.dna.nodes; i++) {
    const tt = i / (CONFIG.dna.nodes - 1);

    const pA = helixPos(tt, 0);
    g.push();
    g.translate(pA.x, pA.y, pA.z);
    g.noStroke();
    g.texture(nodeTex);
    g.sphere(nodeSize, CONFIG.dna.nodeDetailX, CONFIG.dna.nodeDetailY);
    g.pop();

    const pB = helixPos(tt, 180);
    g.push();
    g.translate(pB.x, pB.y, pB.z);
    g.noStroke();
    g.texture(nodeTex);
    g.sphere(nodeSize, CONFIG.dna.nodeDetailX, CONFIG.dna.nodeDetailY);
    g.pop();
  }
}