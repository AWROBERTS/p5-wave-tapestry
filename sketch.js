let mySound;
let fft;
let img;
let bgVid; // Variable for the background video

// Variables for the wave grid
let cols, rows;
// Scale decreased to 5 for even higher detail
let scl = 20;
// Dimensions: Width increased to 2300 for wider coverage
let w = 2300;
let h = 2500;
// Note: 'flying' variable removed as movement is now driven by array shifting
let terrain = [];

function preload() {
  img = loadImage('seablue.png');
}

function setup() {
  // Use 1920, 1080 for HD. Use 3840, 2160 for 4K.
  createCanvas(3840, 2160, WEBGL);

  // Hide the mouse cursor so it doesn't ruin the recording
  noCursor();

  // --- VIDEO SETUP ---
  // Load the video file
  bgVid = createVideo(['whalebackmix.mp4']);
  bgVid.elt.muted = true; // Mute video so it doesn't clash with music and allows autoplay
  bgVid.loop();

  // Set playback speed to 2x (Normal speed is 1.0)
  bgVid.speed(1.5);

  bgVid.hide(); // Hide the DOM element so we just draw it to canvas

  mySound = createAudio('miditapestry.mp3');
  // Attempt auto-play
  mySound.loop();

  fft = new p5.FFT(0.8, 1024);
  fft.setInput(mySound);

  cols = w / scl;
  rows = h / scl;

  for (let x = 0; x < cols; x++) {
    terrain[x] = [];
    for (let y = 0; y < rows; y++) {
      terrain[x][y] = 0;
    }
  }

  // Ensure texture repeats so we can scroll it infinitely
  textureWrap(REPEAT);
}

function draw() {
  // Access the FFT array
  let spectrum = fft.analyze();

  // --- UPDATE TERRAIN (SCROLLING FFT) ---
  // For every column (frequency band), shift the history and add new data
  for (let x = 0; x < cols; x++) {
    // Remove the oldest value (closest to viewer, at the end of the array)
    terrain[x].pop();

    // Calculate new value for the horizon (farthest from viewer, start of array)
    let specIndex = floor(map(x, 0, cols, 0, spectrum.length));
    let audioVal = spectrum[specIndex] || 0;

    // Map amplitude to height.
    // Increased max value to 1000 for more pronounced mountains
    let newHeight = map(audioVal, 0, 255, 0, 1000);

    // Add the new value to the beginning
    terrain[x].unshift(newHeight);
  }

  // --- BACKGROUND LAYER ---
  background(0);

  // Draw the background video plane
  push();
  let gl = this._renderer.GL;
  gl.disable(gl.DEPTH_TEST); // Disable depth test so background is always behind
  translate(0, 0, -1000); // Push far back

  // Texture mapping works the same for Video objects!
  texture(bgVid);

  noStroke();
  plane(windowWidth * 2.5, windowHeight * 2.5); // Large plane to cover screen
  gl.enable(gl.DEPTH_TEST);
  pop();

  // --- LIGHTING ---
  ambientLight(150, 150, 150);
  pointLight(255, 255, 255, 0, -200, 200);

  // --- FOREGROUND WAVES ---

  // Flight Variables
  let time = frameCount * 0.005;
  let textureOffset = frameCount * 0.008;
  let sweepX = sin(time) * 400;
  let bankZ = cos(time) * 0.05;
  let altitude = map(sin(time * 2), -1, 1, -20, 20);

  // Apply Camera Transformations
  translate(0, altitude, -600);
  rotateX(PI / 6);
  // Rotated 90 degrees (HALF_PI) clockwise
  rotateZ(bankZ + HALF_PI);

  // Shifted terrain:
  // -w / 2 : Centers the grid
  // -sweepX : Applies the panning animation
  // + 200 : Moves the whole grid 200 pixels RIGHT
  // Use fixed Y offset (-600) to keep horizon steady while terrain extends down
  translate((-w / 2) - sweepX + 200, -600);

  // --- 1. DRAW TEXTURED TERRAIN ---
  push(); // Isolate state for solid mesh

  // CHANGED: Use the video variable (bgVid) instead of the image (img)
  texture(bgVid);

  textureMode(NORMAL);
  noStroke();

  // Calculate the dimensions of the background plane we are matching
  let bgW = windowWidth * 2.5;
  let bgH = windowHeight * 2.5;

  // Determine the starting world coordinates for the mesh
  // These match the translate() calls above: translate((-w / 2) - sweepX + 200, -600)
  // relative to the center (0,0) of the world
  let startX = (-w / 2) - sweepX + 200;
  let startY = -600;

  for (let x = 0; x < cols - 1; x++) {
    beginShape(TRIANGLE_STRIP);

    // Because of the 90 degree rotation:
    // Mesh X (horizontal on mesh) -> Screen Y (vertical on screen) -> Maps to V
    // We calculate V based on X, so it's constant for this entire strip
    let worldX = startX + x * scl;
    let worldXNext = startX + (x + 1) * scl;

    let v = map(worldX, -bgH / 2, bgH / 2, 0, 1);
    let vNext = map(worldXNext, -bgH / 2, bgH / 2, 0, 1);

    for (let y = 0; y < rows; y++) {

      // Calculate the "World" position of the vertices
      // This is where the vertex will be drawn relative to the center origin
      let worldY = startY + y * scl;

      // Because of the 90 degree rotation:
      // Mesh Y (vertical on mesh) -> Screen X (horizontal on screen) -> Maps to U
      // Note: We use -worldY because rotating +Y by 90deg CW points to -X (Left)
      let u = map(-worldY, -bgW / 2, bgW / 2, 0, 1);

      // Apply the swapped UVs
      vertex(x * scl, y * scl, terrain[x][y], u, v);
      vertex((x + 1) * scl, y * scl, terrain[x+1][y], u, vNext);
    }
    endShape();
  }
  pop();
}

function mousePressed() {
  userStartAudio();
  // Ensure video starts playing on user interaction too
  if (bgVid) bgVid.loop();

  if (mySound.elt.paused) {
    mySound.loop();
  } else {
    mySound.pause();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}