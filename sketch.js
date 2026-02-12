// p5 wave tapestry
// This file owns lifecycle + resources.

// ===============================
// Render targets + shaders
// ===============================
let sceneG; // offscreen render target (clean full scene)
let postG; // offscreen postprocess target (VHS result)
let mixG; // offscreen mixer target (dissolve between clean and VHS)
let vhsShader;
let dissolveShader;

// Main (audible) track
let audio; // p5.SoundFile (loaded in preload)
let fft;
let amp;

// Separate bass/kick driver (silent, used for helix shockwaves)
let kick; // p5.SoundFile
let kickAmp; // p5.Amplitude

// Video texture(s)
let video; // strand video
let nodeVideo; // node spheres video (optional separate clip)

// State
let started = false;

let audioReady = false;
let audioLoadError = false;

let kickReady = false;
let kickLoadError = false;

function preload() {
  audio = loadSound(
    CONFIG.assets.audioMain,
    () => {
      audioReady = true;
      audioLoadError = false;
    },
    () => {
      audioReady = false;
      audioLoadError = true;
    }
  );

  kick = loadSound(
    CONFIG.assets.audioKick,
    () => {
      kickReady = true;
      kickLoadError = false;
    },
    () => {
      kickReady = false;
      kickLoadError = true;
    }
  );
}

function setup() {
  createCanvas(CONFIG.canvas.w, CONFIG.canvas.h, WEBGL);
  pixelDensity(CONFIG.canvas.pixelDensity);

  angleMode(DEGREES);
  colorMode(HSB, 360, 100, 100, 100);

  sceneG = createGraphics(CONFIG.canvas.w, CONFIG.canvas.h, WEBGL);
  postG = createGraphics(CONFIG.canvas.w, CONFIG.canvas.h, WEBGL);
  mixG = createGraphics(CONFIG.canvas.w, CONFIG.canvas.h, WEBGL);

  sceneG.pixelDensity(CONFIG.canvas.pixelDensity);
  postG.pixelDensity(CONFIG.canvas.pixelDensity);
  mixG.pixelDensity(CONFIG.canvas.pixelDensity);

  sceneG.angleMode(DEGREES);
  sceneG.colorMode(HSB, 360, 100, 100, 100);

  sceneG.noStroke();
  postG.noStroke();
  mixG.noStroke();

  vhsShader = postG.createShader(VHS_VERT, VHS_FRAG);
  dissolveShader = mixG.createShader(DISSOLVE_VERT, DISSOLVE_FRAG);

  video = createVideo(CONFIG.assets.videoStrands);
  video.hide();
  video.volume(0);

  nodeVideo = createVideo(CONFIG.assets.videoNodes);
  nodeVideo.hide();
  nodeVideo.volume(0);

  fft = new p5.FFT(CONFIG.audio.fftSmoothing, CONFIG.audio.fftBins);
  amp = new p5.Amplitude(CONFIG.audio.ampSmoothing);
  kickAmp = new p5.Amplitude(CONFIG.audio.ampSmoothing);

  if (audio) {
    audio.setVolume(1.0);
    fft.setInput(audio);
    amp.setInput(audio);
  }

  if (kick) {
    kick.disconnect();
    kickAmp.setInput(kick);
  }

  TunnelField.init();
  noCursor();
}

function mousePressed() {
  if (!audioReady) return;
  if (started) return;

  if (typeof userStartAudio === "function") userStartAudio();

  if (video && typeof video.loop === "function") video.loop();
  if (nodeVideo && typeof nodeVideo.loop === "function") nodeVideo.loop();
  if (audio && typeof audio.loop === "function") audio.loop();
  if (kickReady && kick && typeof kick.loop === "function") kick.loop();

  started = true;
}

function draw() {
  renderScene(sceneG);

  applyVhsPass(sceneG, postG, vhsShader);
  applyDissolvePass(sceneG, postG, mixG, dissolveShader);

  presentFinal(mixG);
}