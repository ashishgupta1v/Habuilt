/**
 * Habuilt Confetti & Celebration Physics Engine
 * High-performance 60fps canvas particle physics for milestone celebrations.
 * Zero-dependency, zero DOM overhead when inactive, respects prefers-reduced-motion.
 */

let canvas = null;
let ctx = null;
let animationFrameId = null;
let particles = [];

const DEFAULT_GOLD_PALETTE = ['#C8A456', '#D4AF37', '#E5C77A', '#F59E0B', '#FBBF24', '#FFFFFF'];
const VICTORY_PALETTE = ['#C8A456', '#10B981', '#34D399', '#6366F1', '#818CF8', '#F59E0B'];
const PARTNER_PALETTE = ['#EC4899', '#F472B6', '#C8A456', '#A855F7', '#C084FC', '#FFFFFF'];

function ensureCanvas() {
  if (typeof document === 'undefined') return null;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'habuilt-celebration-canvas';
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    canvas.style.opacity = '1';
    canvas.style.transition = 'opacity 0.4s ease';
    document.body.appendChild(canvas);

    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }
  return ctx;
}

function resizeCanvas() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }
}

class Particle {
  constructor({
    x,
    y,
    vx,
    vy,
    color,
    size = 7,
    shape = 'rect',
    drag = 0.96,
    gravity = 0.35,
    wobbleSpeed = 0.08,
  }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.shape = shape; // 'rect', 'circle', 'star'
    this.drag = drag;
    this.gravity = gravity;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = wobbleSpeed;
    this.tilt = Math.random() * 10;
    this.tiltAngle = Math.random() * Math.PI * 2;
    this.tiltSpeed = 0.07 + Math.random() * 0.05;
    this.opacity = 1;
    this.life = 0;
    this.maxLife = 120 + Math.random() * 80;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.drag;
    this.vy = this.vy * this.drag + this.gravity;
    this.wobble += this.wobbleSpeed;
    this.tiltAngle += this.tiltSpeed;
    this.tilt = Math.sin(this.tiltAngle) * 12;
    this.life++;

    if (this.life > this.maxLife - 30) {
      this.opacity = Math.max(0, (this.maxLife - this.life) / 30);
    }
  }

  draw(c) {
    if (this.opacity <= 0) return;
    c.save();
    c.translate(this.x, this.y);
    c.globalAlpha = this.opacity;
    c.fillStyle = this.color;
    c.strokeStyle = this.color;

    if (this.shape === 'circle') {
      c.beginPath();
      c.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      c.fill();
    } else if (this.shape === 'star') {
      drawStar(c, 0, 0, 5, this.size * 1.1, this.size * 0.55);
    } else {
      // 3D spinning ribbon/rectangle
      const x1 = Math.cos(this.wobble) * this.size;
      const y1 = this.tilt;
      c.beginPath();
      c.moveTo(-x1, -y1);
      c.lineTo(x1, -y1);
      c.lineTo(x1, y1);
      c.lineTo(-x1, y1);
      c.closePath();
      c.fill();
    }
    c.restore();
  }
}

function drawStar(c, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  c.beginPath();
  c.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    c.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    c.lineTo(x, y);
    rot += step;
  }
  c.lineTo(cx, cy - outerRadius);
  c.closePath();
  c.fill();
}

function renderFrame() {
  if (!ctx || !canvas) return;
  const width = window.innerWidth;
  const height = window.innerHeight;

  ctx.clearRect(0, 0, width, height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw(ctx);

    // Remove dead particles
    if (p.life >= p.maxLife || p.y > height + 50 || p.opacity <= 0) {
      particles.splice(i, 1);
    }
  }

  if (particles.length > 0) {
    animationFrameId = requestAnimationFrame(renderFrame);
  } else {
    // Teardown canvas when idle
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
      canvas = null;
      ctx = null;
    }
  }
}

function addBurst({
  x = window.innerWidth / 2,
  y = window.innerHeight / 2,
  count = 60,
  colors = DEFAULT_GOLD_PALETTE,
  angle = -Math.PI / 2,
  spread = Math.PI / 3,
  velocity = 14,
  gravity = 0.38,
}) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  ensureCanvas();

  for (let i = 0; i < count; i++) {
    const pAngle = angle + (Math.random() - 0.5) * spread;
    const speed = velocity * (0.6 + Math.random() * 0.8);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shapes = ['rect', 'rect', 'circle', 'star'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = shape === 'star' ? 8 + Math.random() * 6 : 6 + Math.random() * 6;

    particles.push(
      new Particle({
        x,
        y,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        color,
        size,
        shape,
        gravity,
        drag: 0.94 + Math.random() * 0.03,
      })
    );
  }

  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(renderFrame);
  }
}

export function useConfetti() {
  /**
   * Dual Cannon Blast (Sweeping inward from bottom corners)
   */
  const fireDualCannons = (colors = DEFAULT_GOLD_PALETTE) => {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Left cannon
    addBurst({
      x: w * 0.05,
      y: h * 0.95,
      count: 55,
      colors,
      angle: -Math.PI / 3.8, // 47 degrees upwards-right
      spread: Math.PI / 3.5,
      velocity: 18,
    });

    // Right cannon
    addBurst({
      x: w * 0.95,
      y: h * 0.95,
      count: 55,
      colors,
      angle: (-Math.PI * 2.8) / 3.8, // upwards-left
      spread: Math.PI / 3.5,
      velocity: 18,
    });
  };

  /**
   * Milestone Trigger (Floor 4p, Half 8p, Full 15p)
   */
  const fireTierMilestone = (tierName = 'full') => {
    if (tierName === 'floor') {
      addBurst({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.75,
        count: 40,
        colors: DEFAULT_GOLD_PALETTE,
        velocity: 12,
      });
    } else if (tierName === 'half') {
      fireDualCannons(DEFAULT_GOLD_PALETTE);
    } else {
      // Full Tier (15p) - Grand celebration
      fireDualCannons(VICTORY_PALETTE);
      setTimeout(() => {
        addBurst({
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.4,
          count: 70,
          colors: DEFAULT_GOLD_PALETTE,
          spread: Math.PI * 2,
          velocity: 11,
          gravity: 0.25,
        });
      }, 250);
    }
  };

  /**
   * Partner Activity Done Celebration
   */
  const firePartnerCelebration = () => {
    fireDualCannons(PARTNER_PALETTE);
  };

  /**
   * Focus Session Complete Celebration
   */
  const fireFocusComplete = () => {
    addBurst({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.5,
      count: 65,
      colors: VICTORY_PALETTE,
      spread: Math.PI * 2,
      velocity: 13,
    });
  };

  /**
   * Micro-Burst on Specific Element Click
   */
  const fireMicroBurst = (clientX, clientY) => {
    addBurst({
      x: clientX || window.innerWidth / 2,
      y: clientY || window.innerHeight / 2,
      count: 22,
      colors: DEFAULT_GOLD_PALETTE,
      spread: Math.PI * 2,
      velocity: 7,
      gravity: 0.3,
    });
  };

  return {
    fireDualCannons,
    fireTierMilestone,
    firePartnerCelebration,
    fireFocusComplete,
    fireMicroBurst,
  };
}
