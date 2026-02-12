// src/shaders.js
// GLSL shader sources for p5 WEBGL (kept as strings to avoid build tooling).

const VHS_VERT = `
#ifdef GL_ES
precision mediump float;
precision mediump int;
#endif

attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vUv;

void main() {
  vUv = aTexCoord;
  gl_Position = vec4(aPosition, 1.0);
}
`;

const VHS_FRAG = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime;

uniform float uIntensity;
uniform float uJitter;
uniform float uChroma;
uniform float uNoise;
uniform float uScanlines;
uniform float uTearing;
uniform float uVignette;
uniform float uInterlace;

uniform float uSaturation;

varying vec2 vUv;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv;

  float line = floor(uv.y * uRes.y);
  float field = mod(floor(uTime * 60.0), 2.0);
  float interlaceShift = (mod(line + field, 2.0) * 2.0 - 1.0) * (1.0 / uRes.x) * 1.65;
  uv.x += interlaceShift * 0.70 * uInterlace * uIntensity;

  float tBlock = floor(uTime * 30.0);
  float j = (hash12(vec2(line, tBlock)) - 0.5);
  float drift = sin(uTime * 1.7) * 0.0048 + sin(uTime * 0.37) * 0.0036;
  uv.x += (j * 0.042 + drift * 2.0) * uJitter * uIntensity;

  float bandCenter = fract(uTime * 0.145);
  float band = smoothstep(0.095, 0.0, abs(uv.y - bandCenter));
  float bandGate = step(0.74, hash12(vec2(tBlock, 9.1)));
  float tear = (hash12(vec2(line, uTime * 2.0)) - 0.5) * 0.17;
  uv.x += tear * band * bandGate * uTearing * uIntensity;

  uv = clamp(uv, vec2(0.001), vec2(0.999));

  float sepBase = (1.0 / uRes.x) * (8.0 + 14.0 * smoothNoise(vec2(uTime * 0.215, uv.y * 3.3)));
  float sep = sepBase * (0.6 + 0.85 * uv.y) * uChroma * uIntensity;

  vec3 col;
  col.r = texture2D(uTex, uv + vec2(sep, 0.0)).r;
  col.g = texture2D(uTex, uv).g;
  col.b = texture2D(uTex, uv - vec2(sep, 0.0)).b;

  float scan = sin(uv.y * uRes.y * 1.70);
  col -= (0.165 + 0.055 * sin(uTime * 8.0)) * scan * uScanlines * uIntensity;

  float n = hash12(uv * uRes + vec2(uTime * 120.0, uTime * 60.0)) - 0.5;
  float n2 = smoothNoise(uv * vec2(uRes.x * 0.28, uRes.y * 0.20) + uTime * 2.1) - 0.5;
  float grain = (n * 0.67 + n2 * 0.33);
  col += grain * 0.20 * uNoise * uIntensity;

  col = col * 1.10 + 0.035;

  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, max(0.0, uSaturation));

  vec2 p = uv * 2.0 - 1.0;
  float v = 1.0 - dot(p, p) * 0.315;
  v = clamp(v, 0.0, 1.0);
  col *= mix(1.0, v, 0.83 * uVignette * uIntensity);

  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

const DISSOLVE_VERT = VHS_VERT;

const DISSOLVE_FRAG = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uClean;
uniform sampler2D uFX;
uniform vec2 uRes;
uniform float uTime;

uniform float uMix;
uniform float uGrainScale;
uniform float uSoftness;

varying vec2 vUv;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv;

  vec3 cleanCol = texture2D(uClean, uv).rgb;
  vec3 fxCol = texture2D(uFX, uv).rgb;

  float n = smoothNoise((uv * uRes / 900.0) * uGrainScale + vec2(uTime * 0.35, -uTime * 0.12));
  n = clamp(n + (uv.y - 0.5) * 0.06, 0.0, 1.0);

  float edge = max(0.0001, uSoftness);
  float m = smoothstep(uMix - edge, uMix + edge, n);

  float lum = dot(cleanCol, vec3(0.299, 0.587, 0.114));
  float fg = smoothstep(0.10, 0.22, lum);
  m *= fg;

  vec3 col = mix(cleanCol, fxCol, m);
  gl_FragColor = vec4(col, 1.0);
}
`;