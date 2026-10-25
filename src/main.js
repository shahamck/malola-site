import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { SCENTS, FRAMES, waLink } from './data.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BASE = import.meta.env.BASE_URL;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── content ─────────────────────────────────────────────────────────── */
const bottleMarkup = (i) => {
  const s = SCENTS[i - 1];
  return `<div class="bottle" aria-hidden="true">
    <div class="layer shadow"></div>
    <img class="layer glass" src="${BASE}img/bottle-glass.webp" alt="" />
    <div class="layer juice"></div>
    <img class="layer light" src="${BASE}img/bottle-light.webp" alt="" />
    <img class="layer cap" src="${BASE}img/bottle-cap.webp" alt="" />
    <div class="layer labels"><div class="label label-n"><small>50 ml · eau de parfum</small><strong>${s.label.join('<br />')}</strong></div></div>
  </div>`;
};

$('#cards').innerHTML = SCENTS.map((s, k) => `
  <article class="card" data-i="${k + 1}">
    <span class="n">${s.n}<i class="colon" aria-hidden="true"><b></b><b></b></i></span>
    ${bottleMarkup(k + 1)}
    <h3>${s.name}</h3>
    <p>${s.line} Signature: ${s.note.toLowerCase()}.</p>
    <a class="btn" href="${waLink(s.name)}" target="_blank" rel="noopener">Order on WhatsApp</a>
  </article>`).join('');

$('#track').insertAdjacentHTML('beforeend', FRAMES.map((f, k) => `
  <a class="frame" href="https://www.instagram.com/p/${f.post}/" target="_blank" rel="noopener">
    <div class="frame-img"><img src="${BASE}img/frames/${f.img}.webp" alt="" loading="lazy" /></div>
    <p><b>POV — ${String(k + 1).padStart(2, '0')}</b>${f.text}</p>
  </a>`).join(''));

// scene "Order" links on the stage jump straight to WhatsApp for that scent
$$('.scene .link').forEach((a) => { a.href = waLink(a.dataset.scent); a.target = '_blank'; a.rel = 'noopener'; });

// split the manifesto into words so they can light up one by one
const mf = $('#manifesto');
mf.innerHTML = mf.innerHTML.replace(/(<em>.*?<\/em>|[^\s<]+)/g, '<span class="w">$1</span>');

/* ── smooth scroll ───────────────────────────────────────────────────── */
let lenis;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  if (import.meta.env.DEV) window.lenis = lenis; // lets screenshot scripts jump around
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const target = a.getAttribute('href') === '#top' ? 0 : $(a.getAttribute('href'));
  if (target === null) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(target, { duration: 1.6 });
  else if (target === 0) scrollTo(0, 0);
  else target.scrollIntoView();
}));

/* ── the story timeline ──────────────────────────────────────────────── */
// One scrubbed timeline drives the sticky stage. Time units are arbitrary; the scroll length maps onto them.
// transforms go on every layer; opacity is split because the highlight layer has its own strength per scene
const layers = $$('#bottle .layer:not(.light)');
const allLayers = $$('#bottle .layer');
const light = $('#bottle .light');
const LIGHT = [0.55, 0.8, 1];
const bottle = $('#bottle');
const scene = (i, sel) => $$(`.scene[data-i="${i}"] ${sel}`);
const big = (i) => $(`.big-n[data-i="${i}"]`);
const label = (i) => $(`.label-n[data-i="${i}"]`);
const JUICE = ['rgba(236,170,100,.28)', 'rgba(255,205,175,.22)', 'rgba(120,52,26,.5)'];
const SCENE_AT = [3.3, 5.2, 7.1]; // when each scent lands

const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: '.story', start: 'top top', end: 'bottom bottom', scrub: 0.8 } });

// hero → manifesto
tl.to(['.hero-l', '.hero-r', '.scroll-cue'], { y: -40, opacity: 0, duration: 0.6, stagger: 0.05 }, 0.9)
  .to('.big-hero', { scale: 1.18, opacity: 0, duration: 1 }, 0.9)
  .to(allLayers, { scale: 0.9, filter: 'blur(16px)', duration: 0.8 }, 1.0)
  .to([...layers, light], { opacity: 0, duration: 0.8 }, 1.0)
  .to('.glow-0', { opacity: 0.5, duration: 0.8 }, 1.0)
  .to(mf, { opacity: 1, duration: 0.4 }, 1.5)
  .to('#manifesto .w', { opacity: 1, duration: 0.2, stagger: 0.045, ease: 'none' }, 1.6)
  .to(mf, { opacity: 0, y: -30, filter: 'blur(6px)', duration: 0.5 }, 2.85)
  .set('.label-0', { opacity: 0 }, 3.0)
  .set(label(1), { opacity: 1 }, 3.0);

SCENTS.forEach((_, k) => {
  const i = k + 1, at = SCENE_AT[k];
  // scene in
  tl.fromTo(big(i), { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, at)
    .fromTo(scene(i, '.ann'), { opacity: 0, x: (n) => (n ? -24 : 24) }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.1 }, at + 0.25)
    .fromTo(scene(i, '.copy-l, .copy-r'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, at + 0.3)
    .to(bottle, { '--juice': JUICE[k], duration: 0.6 }, at - 0.2);
  // scene out (all but the last, which leaves with the finale)
  if (i < 3) {
    tl.to([big(i), ...scene(i, '.ann'), ...scene(i, '.copy-l, .copy-r')], { opacity: 0, y: -24, duration: 0.45, stagger: 0.03 }, SCENE_AT[k + 1] - 0.55)
      .to(label(i), { opacity: 0, duration: 0.3 }, SCENE_AT[k + 1] - 0.3)
      .to(label(i + 1), { opacity: 1, duration: 0.3 }, SCENE_AT[k + 1] - 0.1)
      .to(allLayers, { scale: 0.94, y: 12, duration: 0.4, ease: 'power2.in' }, SCENE_AT[k + 1] - 0.5)
      .to(allLayers, { scale: 1, y: 0, duration: 0.6, ease: 'power3.out' }, SCENE_AT[k + 1] - 0.1)
      .to(light, { opacity: LIGHT[k + 1], duration: 0.8 }, SCENE_AT[k + 1] - 0.5);
  }
});

// bottle returns for scene one
tl.fromTo(allLayers, { scale: 0.9, y: 40, filter: 'blur(16px)' }, { scale: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out', immediateRender: false }, SCENE_AT[0] - 0.1)
  .fromTo(layers, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power3.out', immediateRender: false }, SCENE_AT[0] - 0.1)
  .fromTo(light, { opacity: 0 }, { opacity: LIGHT[0], duration: 0.9, ease: 'power3.out', immediateRender: false }, SCENE_AT[0] - 0.1)
  .to('.vf', { opacity: 1, duration: 0.6 }, SCENE_AT[0] + 0.2)
  .to('.glow-0', { opacity: 0, duration: 0.6 }, SCENE_AT[0] - 0.2)
  .to('.glow-1', { opacity: 1, duration: 0.8 }, SCENE_AT[0] - 0.2)
  // light → vermilion
  .to('.bg-orange', { opacity: 1, duration: 0.9 }, SCENE_AT[1] - 0.6)
  .to('.glow-1', { opacity: 0, duration: 0.7 }, SCENE_AT[1] - 0.5)
  .to('.glow-2', { opacity: 1, duration: 0.8 }, SCENE_AT[1] - 0.3)
  // vermilion → dark
  .to('.bg-ink', { opacity: 1, duration: 0.9 }, SCENE_AT[2] - 0.6)
  .to('.glow-2', { opacity: 0, duration: 0.7 }, SCENE_AT[2] - 0.5)
  .to('.glow-3', { opacity: 1, duration: 0.8 }, SCENE_AT[2] - 0.3)
  .to('.shadow', { opacity: 0, duration: 0.5 }, SCENE_AT[2] - 0.5)
  // finale: everything leaves, one line stays
  .to([big(3), ...scene(3, '.ann'), ...scene(3, '.copy-l, .copy-r'), '.vf'], { opacity: 0, y: -24, duration: 0.5, stagger: 0.03 }, 8.7)
  .to(allLayers, { opacity: 0, scale: 1.08, filter: 'blur(14px)', duration: 0.8 }, 8.8)
  .to('.glow-3', { opacity: 0.45, scale: 1.3, duration: 1 }, 8.8)
  .fromTo('#witnessed', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 9.3)
  .to('#witnessed', { opacity: 0, y: -30, duration: 0.5 }, 10.1)
  .to('.glow-3', { opacity: 0, duration: 0.5 }, 10.1)
  .to({}, { duration: 0.1 }, 10.6);

// which scene the stage is in, for the nav colour and the viewfinder counter
const stage = $('#stage');
const vfN = $('.vf-n');
const stageTheme = (t) => (t < SCENE_AT[1] - 0.3 ? 'light' : t < SCENE_AT[2] - 0.3 ? 'orange' : 'dark');
const stageScene = (t) => (t < SCENE_AT[1] - 0.3 ? 1 : t < SCENE_AT[2] - 0.3 ? 2 : 3);

/* ── nav theme: follow whatever sits under the nav ───────────────────── */
const root = document.documentElement;
const themed = $$('[data-theme]').filter((el) => el !== stage);
function updateChrome() {
  const t = tl.time();
  stage.dataset.theme = stageTheme(t);
  vfN.textContent = `0${stageScene(t)}`;
  const story = $('.story').getBoundingClientRect();
  let theme;
  if (story.top <= 1 && story.bottom > 40) theme = stage.dataset.theme;
  else theme = themed.find((el) => { const r = el.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; })?.dataset.theme ?? 'light';
  root.dataset.nav = theme;
  root.dataset.logo = story.top < -innerHeight * 0.4 ? '1' : '0';
}
gsap.ticker.add(updateChrome);

/* ── the house ───────────────────────────────────────────────────────── */
gsap.from('.room-lines span', { opacity: 0, y: 40, duration: 1, stagger: 0.18, ease: 'power3.out', scrollTrigger: { trigger: '.room-lines', start: 'top 80%' } });
gsap.from(['.room-note', '.room-body'], { opacity: 0, y: 30, duration: 1, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '.room-note', start: 'top 88%' } });
gsap.fromTo('.room-img img', { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.room-img', start: 'top bottom', end: 'bottom top', scrub: true } });
gsap.from('.room-img', { clipPath: 'inset(18% 12% 18% 12%)', ease: 'none', scrollTrigger: { trigger: '.room-img', start: 'top 95%', end: 'top 35%', scrub: true } });

/* ── rack focus ──────────────────────────────────────────────────────── */
const focusTl = gsap.timeline({ scrollTrigger: { trigger: '.focus', start: 'top 75%', end: 'center 50%', scrub: true } });
focusTl.fromTo('.focus-card img', { filter: 'blur(18px)', scale: 1.12 }, { filter: 'blur(0px)', scale: 1, ease: 'power1.out' }, 0)
  .from('.focus-card .vf-c', { scale: 2.4, opacity: 0, ease: 'power2.out' }, 0)
  .from('.focus-a', { xPercent: -30, opacity: 0 }, 0.1)
  .from('.focus-b', { xPercent: 30, opacity: 0 }, 0.25);

/* ── frames reel ─────────────────────────────────────────────────────── */
const track = $('#track');
gsap.to(track, {
  x: () => -(track.scrollWidth - innerWidth),
  ease: 'none',
  scrollTrigger: { trigger: '.frames', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
});

/* ── choose + footer ─────────────────────────────────────────────────── */
gsap.from('.choose header > *', { opacity: 0, y: 40, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.choose', start: 'top 70%' } });
gsap.from('.foot-mark', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
