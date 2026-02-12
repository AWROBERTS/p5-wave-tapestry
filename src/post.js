// src/post.js
// Post stack: VHS pass + dissolve pass + present + fullscreen quad helper.

function applyVhsPass(inputG, outG, shader) {
  outG.push();
  outG.clear();
  outG.shader(shader);

  shader.setUniform("uTex", inputG);
  shader.setUniform("uRes", [CONFIG.canvas.w, CONFIG.canvas.h]);
  shader.setUniform("uTime", millis() / 1000.0);

  shader.setUniform("uIntensity", CONFIG.post.vhs.intensity);
  shader.setUniform("uJitter", CONFIG.post.vhs.jitter);

  const hi = constrain(getHiEnergy(), 0, 1);
  const chromaBase = CONFIG.post.vhs.chromaBase;
  const chromaBoost = CONFIG.post.vhs.chromaBoost;
  const hiShimmer = 0.75 + 0.25 * sin((millis() / 1000.0) * (10.0 + 28.0 * hi));
  const chromaDynamic = chromaBase + chromaBoost * pow(hi, 1.25) * hiShimmer;
  shader.setUniform("uChroma", chromaDynamic);

  shader.setUniform("uNoise", CONFIG.post.vhs.noise);
  shader.setUniform("uScanlines", CONFIG.post.vhs.scanlines);
  shader.setUniform("uTearing", CONFIG.post.vhs.tearing);
  shader.setUniform("uVignette", CONFIG.post.vhs.vignette);
  shader.setUniform("uInterlace", CONFIG.post.vhs.interlace);

  shader.setUniform("uSaturation", CONFIG.post.vhs.saturation);

  drawFullscreenQuad(outG);
  outG.pop();
}

function applyDissolvePass(cleanG, fxG, outG, shader) {
  outG.push();
  outG.clear();
  outG.shader(shader);

  shader.setUniform("uClean", cleanG);
  shader.setUniform("uFX", fxG);
  shader.setUniform("uRes", [CONFIG.canvas.w, CONFIG.canvas.h]);
  shader.setUniform("uTime", millis() / 1000.0);

  const uMix = 0.5 + 0.5 * sin((millis() / 1000.0) * CONFIG.post.dissolve.mixSpeed);
  shader.setUniform("uMix", uMix);

  shader.setUniform("uGrainScale", CONFIG.post.dissolve.grainScale);
  shader.setUniform("uSoftness", CONFIG.post.dissolve.softness);

  drawFullscreenQuad(outG);
  outG.pop();
}

function presentFinal(finalG) {
  background(0);
  push();
  resetMatrix();
  image(finalG, -CONFIG.canvas.w / 2, -CONFIG.canvas.h / 2);
  pop();
}

function drawFullscreenQuad(g) {
  g.noStroke();
  g.push();
  g.resetMatrix();
  g.ortho();
  g.beginShape();
  g.vertex(-1, -1, 0, 0, 0);
  g.vertex(1, -1, 0, 1, 0);
  g.vertex(1, 1, 0, 1, 1);
  g.vertex(-1, 1, 0, 0, 1);
  g.endShape(CLOSE);
  g.pop();
}