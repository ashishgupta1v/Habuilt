import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

function register() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clearMotionProps() {
  return 'transform,opacity,visibility';
}

export function bindLandingMotion(root) {
  if (!root || prefersReducedMotion()) return null;
  register();
  return gsap.context(() => {
    const phone = root.querySelector('[data-calm-phone]');
    const hero = root.querySelector('.calm-landing__hero');
    if (phone && hero) {
      gsap.fromTo(phone, { y: 16 }, {
        y: -42,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.65,
        },
      });
    }
    const reveals = root.querySelectorAll('[data-calm-reveal]');
    if (reveals.length) {
      gsap.from(reveals, {
        y: 18,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: clearMotionProps(),
      });
    }
    const sections = root.querySelectorAll('[data-calm-section]');
    if (sections.length) {
      ScrollTrigger.batch(sections, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
          gsap.fromTo(batch, { y: 20, autoAlpha: 0 }, {
            y: 0,
            autoAlpha: 1,
            duration: 0.55,
            stagger: 0.07,
            ease: 'power2.out',
            overwrite: 'auto',
            clearProps: clearMotionProps(),
          });
        },
      });
    }
  }, root);
}

export function animateToday(root) {
  if (!root || prefersReducedMotion()) return;
  const hero = root.querySelector('[data-calm-hero-count]');
  const tiles = root.querySelectorAll('[data-calm-tile]');
  const empty = root.querySelector('[data-calm-empty]');
  if (hero) {
    gsap.from(hero, {
      y: 16,
      autoAlpha: 0,
      duration: 0.5,
      ease: 'power3.out',
      clearProps: clearMotionProps(),
    });
  }
  if (tiles.length) {
    gsap.from(tiles, {
      y: 12,
      autoAlpha: 0,
      duration: 0.42,
      stagger: 0.06,
      delay: 0.05,
      ease: 'power2.out',
      clearProps: clearMotionProps(),
    });
  }
  if (empty) {
    gsap.from(empty, {
      y: 10,
      autoAlpha: 0,
      duration: 0.4,
      ease: 'power2.out',
      clearProps: clearMotionProps(),
    });
  }
}

export function animateShell(root) {
  if (!root || prefersReducedMotion()) return;
  const panels = [...root.querySelectorAll('[data-calm-panel]')].filter((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
  if (!panels.length) return;
  gsap.fromTo(panels, { y: 12, autoAlpha: 0 }, {
    y: 0,
    autoAlpha: 1,
    duration: 0.32,
    stagger: 0.03,
    ease: 'power2.out',
    overwrite: 'auto',
    clearProps: clearMotionProps(),
  });
}

export function pulseCount(element) {
  if (!element || prefersReducedMotion()) return;
  gsap.fromTo(element, { scale: 0.92, y: 8 }, {
    scale: 1,
    y: 0,
    duration: 0.38,
    ease: 'power3.out',
    overwrite: 'auto',
    clearProps: 'transform',
  });
}
