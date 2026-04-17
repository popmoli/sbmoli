/* ============================================================
   corner-gif.js — Animated pixel-art camera widget
   Draws a 64×64 camera aperture cycling through frames,
   mimicking an old animated GIF with a retro palette.
   ============================================================ */

export function initCornerGif() {
  const canvas = document.getElementById('cg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 64, H = 64;

  // Retro palette
  const C = {
    black:   '#000000',
    darkBg:  '#0a0a14',
    navy:    '#0d0d88',
    blue:    '#4444ee',
    cyan:    '#00e5ff',
    pink:    '#ff2d78',
    yellow:  '#ffe600',
    white:   '#f0f0f0',
    grey:    '#333355',
    midgrey: '#555577',
  };

  // Aperture blade angles for each frame (6 frames, cycling open→closed→open)
  // Value = how open the aperture is: 1.0 = fully open, 0.1 = nearly closed
  const FRAMES = [1.0, 0.75, 0.5, 0.25, 0.1, 0.25, 0.5, 0.75];
  const FPS = 8; // frames per second
  let frame = 0;
  let flashCounter = 0; // counts up to trigger a flash

  function drawPixel(x, y, color) {
    // 2×2 pixel blocks for chunky pixel-art look on 64×64 canvas
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
  }

  function drawBackground() {
    ctx.fillStyle = C.darkBg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid lines
    ctx.strokeStyle = C.grey;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 8) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function drawAperture(openness) {
    const cx = W / 2, cy = H / 2;
    const outerR = 26;
    const innerR = openness * 18; // iris radius

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = C.grey;
    ctx.fill();

    // Aperture blades (6 blades)
    const blades = 6;
    for (let i = 0; i < blades; i++) {
      const angle = (i / blades) * Math.PI * 2 + (frame * 0.08);
      const bladeOpenness = 1 - openness;
      const bladeR = outerR * 0.85;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Each blade is a dark wedge that intrudes into the aperture
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const bladeAngle = (Math.PI / blades) * (0.7 + bladeOpenness * 0.6);
      ctx.arc(0, 0, bladeR, -bladeAngle, bladeAngle);
      ctx.closePath();
      ctx.fillStyle = C.black;
      ctx.fill();

      // Blade highlight edge
      ctx.beginPath();
      ctx.arc(0, 0, bladeR, -bladeAngle, -bladeAngle + 0.15);
      ctx.strokeStyle = C.midgrey;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    // Inner iris circle (the "open" hole)
    if (innerR > 1) {
      // Glow ring
      const gradient = ctx.createRadialGradient(cx, cy, innerR * 0.5, cx, cy, innerR);
      gradient.addColorStop(0, C.cyan + '44');
      gradient.addColorStop(1, C.cyan + '00');
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Crisp inner edge
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Outer ring highlight
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = C.midgrey;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawFlash(intensity) {
    if (intensity <= 0) return;
    ctx.fillStyle = `rgba(255, 230, 0, ${intensity * 0.6})`;
    ctx.fillRect(0, 0, W, H);

    // Flash corner sparks
    const sparks = [
      [4, 4], [W - 4, 4], [4, H - 4], [W - 4, H - 4]
    ];
    sparks.forEach(([x, y]) => {
      ctx.fillStyle = `rgba(255, 45, 120, ${intensity})`;
      ctx.fillRect(x - 2, y - 2, 4, 4);
    });
  }

  function drawHUD(openness) {
    // Top-left: aperture value
    ctx.fillStyle = C.cyan;
    ctx.font = 'bold 7px monospace';
    ctx.fillText(`f/${(1 / openness * 1.4).toFixed(1)}`, 3, 10);

    // Bottom-right: frame counter
    ctx.fillStyle = C.yellow;
    ctx.fillText(String(Math.floor(frame / 2) % 36 + 1).padStart(2, '0'), W - 14, H - 3);

    // REC dot (blinking)
    if (Math.floor(Date.now() / 600) % 2 === 0) {
      ctx.fillStyle = C.pink;
      ctx.beginPath();
      ctx.arc(W - 6, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottom status bar
    ctx.fillStyle = C.darkBg;
    ctx.fillRect(0, H - 10, W, 10);
    ctx.fillStyle = C.grey;
    ctx.fillRect(0, H - 10, W, 1);

    const progress = (frame % FRAMES.length) / FRAMES.length;
    ctx.fillStyle = C.navy;
    ctx.fillRect(1, H - 9, Math.floor((W - 2) * progress), 8);
    ctx.fillStyle = C.blue;
    ctx.fillRect(1, H - 9, Math.floor((W - 2) * progress * 0.5), 3);
  }

  let lastTime = 0;
  let flashIntensity = 0;

  function tick(ts) {
    if (ts - lastTime < 1000 / FPS) {
      requestAnimationFrame(tick);
      return;
    }
    lastTime = ts;

    // Trigger a flash when aperture is fully open every ~3 cycles
    flashCounter++;
    if (flashCounter % (FRAMES.length * 3) === FRAMES.length - 1) {
      flashIntensity = 1.0;
    }
    flashIntensity = Math.max(0, flashIntensity - 0.25);

    const openness = FRAMES[frame % FRAMES.length];

    drawBackground();
    drawAperture(openness);
    drawFlash(flashIntensity);
    drawHUD(openness);

    frame++;
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // Update the blinking label with aperture info
  const label = document.querySelector('.cg-label');
  if (label) {
    setInterval(() => {
      const labels = ['LOADING...', 'CAPTURING', 'f/1.4', '⬛ REC', '///GIF///'];
      label.textContent = labels[Math.floor(Date.now() / 800) % labels.length];
    }, 200);
  }
}
