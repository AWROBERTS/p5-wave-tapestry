// src/config.js
// Central place for “tweak knobs” and asset paths.
// No build step: this is just a global CONFIG object.

const CONFIG = {
  canvas: {
    w: 3840,
    h: 2160,
    pixelDensity: 1,
  },

  assets: {
    // Users drop their own files here
    audioMain: "assets/audio/main.wav",
    audioKick: "assets/audio/kick.wav",
    videoStrands: "assets/video/strands.mp4",
    videoNodes: "assets/video/nodes.mp4",
  },

  audio: {
    fftSmoothing: 0.75,
    fftBins: 1024,
    ampSmoothing: 0.9,

    hiBandHz: [6000, 16000],
    hiAttack: 0.35,
    hiRelease: 0.06,
    hiShapePow: 1.15,
  },

  dna: {
    nodes: 220,
    turns: 7.0,
    length: 2200,
    radius: 260,
    ladderEvery: 2,

    radiusBoost: 200,
    strandRibbonWidth: 54,

    ladderStrokeWeight: 3.2,

    nodeDetailX: 6,
    nodeDetailY: 6,

    cameraOrbitSeconds: 180.0,
  },

  breathing: {
    fastLerp: 0.07,
    slowLerp: 0.012,

    speedBase: 0.008,
    speedLoudBoost: 0.014,

    targetLerp: 0.028,
    easePow: 1.25,

    radiusBreathAmount: 0.28,
    lengthBreathAmount: 0.06,
    twistBreathDeg: 14.0,
  },

  tunnelField: {
    pointsPerRing: 96,
    ringCount: 84,

    basePowerScale: 900,
    noiseDetailScale: 220,
    flutterScale: 55,
  },

  post: {
    vhs: {
      intensity: 0.5,
      jitter: 0.42,

      chromaBase: 0.34,
      chromaBoost: 0.34,

      noise: 0.32,
      scanlines: 0.32,
      tearing: 0.16,
      vignette: 0.31,
      interlace: 0.26,

      saturation: 1.22,
    },

    dissolve: {
      mixSpeed: 0.35,
      grainScale: 1.25,
      softness: 0.12,
    },
  },
};