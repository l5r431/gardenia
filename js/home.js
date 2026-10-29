/* home.js — homepage only
   1. reveal-on-scroll   2. side dots   3. parallax layers
   4. words light up in the intro   5. pinned "day" story (swipeable strip if motion is reduced)
   6. stage selector, count-up numbers, voices carousel                          */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (n, a, b) => Math.min(Math.max(n, a), b);
const header = document.querySelector('.site-header');
// where a pinned panel sticks on screen (it sits just under the floating bar, so it is not the same as the bar's height)
const stickTop = (el) => parseFloat(getComputedStyle(el).top) || 0;

/* ---------- 1. Reveal on scroll: handled for every page by main.js ---------- */

/* ---------- 2. Side dots ---------- */
const sections = [...document.querySelectorAll('[data-section]')];
const dotsWrap = document.getElementById('dots');
sections.forEach((s) => {
  const a = document.createElement('a');
  a.href = '#' + s.id;
  a.setAttribute('aria-label', s.dataset.section);
  a.innerHTML = '<span>' + s.dataset.section + '</span>';
  dotsWrap.appendChild(a);
});
const dotLinks = [...dotsWrap.children];

/* ---------- 3. Parallax ---------- */
const parallaxEls = [...document.querySelectorAll('[data-speed]')];
function parallax(vh) {
  parallaxEls.forEach((el) => {
    const sec = el.closest('section');
    const r = sec.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return; // off screen, skip
    // the hero is tall and pinned, so its layers follow hero progress instead
    const speed = Number(el.dataset.speed);
    const shift = sec.id === 'welcome'
      ? heroProgress * vh * 1.2 * speed
      : (vh / 2 - (r.top + r.height / 2)) * speed;
    el.style.transform = 'translateY(' + shift.toFixed(1) + 'px)';
  });
}
const heroText = document.getElementById('hero-text');

/* ---------- 4. Intro words ---------- */
const introP = document.getElementById('intro-text');
const words = introP.textContent.trim().split(/\s+/);
introP.textContent = '';
const wordEls = words.map((w) => {
  const s = document.createElement('span');
  s.textContent = w + ' ';
  introP.appendChild(s);
  return s;
});
function updateIntro(vh) {
  const r = introP.getBoundingClientRect();
  const p = reduce ? 1 : clamp((vh * 0.85 - r.top) / (vh * 0.55), 0, 1);
  const lit = Math.round(p * wordEls.length);
  wordEls.forEach((s, i) => s.classList.toggle('on', i < lit));
}

/* ---------- 5. "A day at Larkhaven" ----------
   Normal motion: the section pins to the screen and scrolling slides the cards sideways.
   Reduced motion: it stays an ordinary strip you swipe, with Previous / Next buttons. */
const day = document.getElementById('day');
const daySticky = day.querySelector('.day-sticky');
const dayTrack = document.getElementById('day-track');
const dayBar = document.getElementById('day-bar');
const DAY_SPEED = 1.8;   // sideways pixels the cards travel per pixel you scroll (higher = shorter section)
const dayPinned = !reduce;

if (dayPinned) {
  day.classList.add('day--pinned');
  dayTrack.removeAttribute('tabindex');   // nothing to scroll by keyboard in the pinned version
}

function dayDistance() {
  // how far the track must slide so the last card ends up on screen
  return Math.max(dayTrack.scrollWidth - window.innerWidth + 40, 0);
}

function sizeDay() {
  // scroll length of the section = one screen (the pinned panel) + the sideways distance / speed
  if (dayPinned) day.style.height = Math.round(daySticky.offsetHeight + dayDistance() / DAY_SPEED) + 'px';
}

function updateDay() {
  let progress;
  if (dayPinned) {
    const box = day.getBoundingClientRect();
    const span = box.height - daySticky.offsetHeight;
    progress = span > 0 ? clamp((stickTop(daySticky) - box.top) / span, 0, 1) : 0;
    dayTrack.style.transform = 'translateX(' + (-progress * dayDistance()).toFixed(1) + 'px)';
  } else {
    // strip version: progress follows the strip's own sideways scrolling
    const furthest = dayTrack.scrollWidth - dayTrack.clientWidth;
    progress = furthest > 0 ? clamp(dayTrack.scrollLeft / furthest, 0, 1) : 1;
  }
  dayBar.style.transform = 'scaleX(' + Math.max(progress, 0.08).toFixed(3) + ')';
}

function slideDay(direction) {
  const card = dayTrack.querySelector('.day-card');
  const gap = parseFloat(getComputedStyle(dayTrack).columnGap) || 0;
  dayTrack.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: reduce ? 'auto' : 'smooth' });
}

dayTrack.addEventListener('scroll', updateDay, { passive: true });
document.getElementById('day-prev').addEventListener('click', () => slideDay(-1));
document.getElementById('day-next').addEventListener('click', () => slideDay(1));
window.addEventListener('resize', () => { sizeDay(); updateDay(); });
sizeDay();
updateDay();

/* ---------- 5b. Hero: scroll-scrubbed frame sequence ----------
   frames/manifest.js (made by tools/extract_frames.py) says how many frames there are.
   Scroll progress through the pinned hero picks the frame, so scrolling back plays it backwards. */
const heroSection = document.getElementById('welcome');
const heroSticky = heroSection.querySelector('.hero-sticky');
const heroCanvas = document.getElementById('hero-canvas');
const heroCtx = heroCanvas.getContext('2d');
const heroCue = heroSection.querySelector('.scroll-cue');
const heroVeil = heroSection.querySelector('.hero-veil');
/* Two sets of frames: WIDE ones (frames/) for wide screens and TALL ones (frames-mobile/, made with
   `python tools/extract_frames.py my-phone-video.mp4 --mobile`) for phones held upright. Only the set that fits the
   screen is downloaded. If frames-mobile/ has no frames yet, phones use the wide set and see the whole picture
   along the bottom of the hero (see drawFrame). */
const heroSets = {
  wide: { name: 'wide', cfg: window.HERO_FRAMES, frames: [], started: false },
  tall: { name: 'tall', cfg: window.HERO_FRAMES_MOBILE, frames: [], started: false }
};
let activeSet = null;
// a hero panel narrower than this (width / height) counts as "tall"; raise it to give more screens the tall frames
const TALL_BELOW = 1.2;
const setHasFrames = (s) => !!(s.cfg && s.cfg.count);
function pickSet() {
  const tall = heroSticky.clientWidth / heroSticky.clientHeight < TALL_BELOW;
  if (tall && setHasFrames(heroSets.tall)) return heroSets.tall;
  if (setHasFrames(heroSets.wide)) return heroSets.wide;
  return setHasFrames(heroSets.tall) ? heroSets.tall : null;
}
let heroProgress = 0;
let frameTarget = 0, frameCurrent = 0, frameDrawn = -1, frameLooping = false;
if (reduce) heroSection.classList.add('hero--static');

function frameUrl(set, i) { return set.cfg.path + String(i + 1).padStart(set.cfg.digits, '0') + '.' + set.cfg.ext; }
function readyFrame(i) { const img = activeSet && activeSet.frames[i]; return img && img.complete && img.naturalWidth ? img : null; }
function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  heroCanvas.width = Math.round(heroSticky.clientWidth * dpr);
  heroCanvas.height = Math.round(heroSticky.clientHeight * dpr);
  frameDrawn = -1;
  renderFrame();
}
const edge = document.createElement('canvas');   // 48 x 1 helper: the colours along the top edge of the picture
edge.width = 48;
edge.height = 1;
const edgeCtx = edge.getContext('2d');
edgeCtx.imageSmoothingEnabled = true;
edgeCtx.imageSmoothingQuality = 'high';
function drawFrame(i) {
  // use the nearest frame that has finished loading (earlier ones first)
  if (!activeSet) return false;
  let img = null;
  for (let k = i; k >= 0 && !img; k--) img = readyFrame(k);
  for (let k = i + 1; k < activeSet.frames.length && !img; k++) img = readyFrame(k);
  if (!img) return false;
  const cw = heroCanvas.width, ch = heroCanvas.height;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  if (activeSet.name === 'tall' || cw / ch >= TALL_BELOW) {
    // the picture suits the screen: fill the whole panel ("cover" fit, the edges may be trimmed a little)
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    heroCtx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  } else {
    // wide frames on a tall screen (a phone, when there are no tall frames yet): a wide picture would lose most of its sides, so show ALL of it
    // along the bottom, and stretch its top edge upwards (softened into a few colours) to fill the space above
    const dh = cw * ih / iw;
    const top = ch - dh;
    edgeCtx.drawImage(img, 0, 0, iw, Math.max(2, Math.round(ih * 0.01)), 0, 0, edge.width, 1);
    heroCtx.imageSmoothingEnabled = true;
    heroCtx.imageSmoothingQuality = 'high';
    heroCtx.drawImage(edge, 0, 0, cw, top + 1);
    heroCtx.drawImage(img, 0, top, cw, dh);
  }
  return true;
}
function renderFrame() {
  const i = Math.round(frameCurrent);
  if (i !== frameDrawn && drawFrame(i)) frameDrawn = i;
}
function frameLoop() {
  // ease toward the target frame so fast scrolling still looks smooth
  const diff = frameTarget - frameCurrent;
  if (Math.abs(diff) < 0.05) { frameCurrent = frameTarget; renderFrame(); frameLooping = false; return; }
  frameCurrent += diff * 0.22;
  renderFrame();
  requestAnimationFrame(frameLoop);
}
function setFrameProgress(p) {
  if (!activeSet || !activeSet.frames.length || reduce) return;
  frameTarget = p * (activeSet.cfg.count - 1);
  if (!frameLooping) { frameLooping = true; requestAnimationFrame(frameLoop); }
}
function loadSet(set) {
  if (set.started) return;
  set.started = true;
  const first = new Image();
  first.onload = () => {
    set.frames[0] = first;
    heroSection.classList.add('has-frames');
    if (set === activeSet) { frameDrawn = -1; renderFrame(); }
    let next = 1;
    const pump = () => { // load the rest a few at a time
      if (next >= set.cfg.count) return;
      const i = next++;
      const img = new Image();
      img.onload = () => { if (set === activeSet && Math.abs(i - frameCurrent) < 3) { frameDrawn = -1; renderFrame(); } pump(); };
      img.onerror = pump;
      set.frames[i] = img;
      img.src = frameUrl(set, i);
    };
    for (let n = 0; n < 6; n++) pump();
  };
  first.src = frameUrl(set, 0);
}
function useSet(set) {
  activeSet = set;
  // the sets can have different numbers of frames, so work out where we are in the new one
  frameTarget = frameCurrent = reduce ? Math.floor(set.cfg.count * 0.35) : heroProgress * (set.cfg.count - 1);
  loadSet(set);
  sizeCanvas();
}
const firstSet = pickSet(); // no frames at all: the SVG scene stays as the hero
if (firstSet) useSet(firstSet);
window.addEventListener('resize', () => {
  const wanted = pickSet();
  if (wanted && wanted !== activeSet) useSet(wanted);   // turned the phone, or resized the window
  else if (activeSet) sizeCanvas();
});

/* ---------- one scroll handler, throttled with requestAnimationFrame ---------- */
let ticking = false;
function update() {
  const vh = window.innerHeight;
  const y = window.scrollY;
  const hr = heroSection.getBoundingClientRect();
  const heroSpan = hr.height - heroSticky.offsetHeight;
  heroProgress = heroSpan > 0 ? clamp((stickTop(heroSticky) - hr.top) / heroSpan, 0, 1) : 0;
  setFrameProgress(heroProgress);

  let current = 0;
  sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= vh * 0.4) current = i; });
  dotLinks.forEach((d, i) => d.classList.toggle('active', i === current));

  if (!reduce) {
    parallax(vh);
    // headline stays while the video starts, then fades as the story plays on
    const fade = clamp((heroProgress - 0.25) / 0.2, 0, 1);
    heroText.style.opacity = String(1 - fade);
    heroText.style.transform = 'translateY(' + (-fade * 40).toFixed(1) + 'px)';
    heroText.style.pointerEvents = fade > 0.9 ? 'none' : '';
    heroVeil.style.opacity = String(1 - fade); // the wash behind the text fades too, so the video is vivid
    heroCue.style.opacity = String(1 - clamp(heroProgress / 0.06, 0, 1));
  }
  updateIntro(vh);
  updateDay();
  ticking = false;
}
function requestUpdate() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
window.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener('resize', requestUpdate);
update();

/* ---------- 6a. Stage selector ---------- */
const stages = {
  toddlers: { age: 'Ages 2 to 3', title: 'Ducklings: Toddlers', text: 'A warm, calm start. Short sessions, lots of cuddles and songs, with a key person who knows each child.', points: ['6 children for every adult', 'Sand, water and sensory play', 'Daily outdoor time', 'Photo updates for parents'] },
  prek:     { age: 'Ages 3 to 4', title: 'Otters: Pre-K', text: 'Play gets purposeful. Children start to listen for sounds, count real things and make friends.', points: ['Rhymes, stories and early sounds', 'Counting with shells and blocks', 'Weekly forest visit', 'Music every day'] },
  reception:{ age: 'Ages 4 to 5', title: 'Kingfishers: Reception', text: 'The bridge to primary. Phonics, number and writing grow through play and practice.', points: ['Daily phonics', 'Number games and measuring', 'Garden and farm jobs', 'A first show on stage'] },
  lower:    { age: 'Ages 5 to 7', title: 'Years 1 and 2', text: 'Children become readers and writers, and begin to think like scientists and storytellers.', points: ['Daily reading and writing', 'Spanish songs and games', 'Swimming lessons', 'Class pets and garden plots'] },
  upper:    { age: 'Ages 7 to 11', title: 'Years 3 to 6', text: 'More independence, bigger projects and real responsibility, ending with a Year 6 residential trip.', points: ['Longer projects and research', 'French and Spanish', 'Pupil council and reading buddies', 'Year 6 residential week'] }
};
const stageTabs = document.querySelectorAll('.stage-tabs button');
function showStage(key) {
  const s = stages[key];
  document.getElementById('stage-age').textContent = s.age;
  document.getElementById('stage-title').textContent = s.title;
  document.getElementById('stage-text').textContent = s.text;
  const ul = document.getElementById('stage-points');
  ul.innerHTML = '';
  s.points.forEach((p) => { const li = document.createElement('li'); li.textContent = p; ul.appendChild(li); });
  stageTabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.stage === key)));
}
stageTabs.forEach((t) => t.addEventListener('click', () => showStage(t.dataset.stage)));
showStage('toddlers');

/* ---------- 6b. Count-up numbers ---------- */
function countUp(el) {
  const target = Number(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const start = performance.now();
  const duration = 1400;
  function frame(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * p) + suffix;
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
const nums = document.querySelectorAll('.num');
if (reduce || !('IntersectionObserver' in window)) {
  nums.forEach((n) => { n.textContent = n.dataset.target + (n.dataset.suffix || ''); });
} else {
  const numObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); numObs.unobserve(e.target); } });
  }, { threshold: 0.5 });
  nums.forEach((n) => numObs.observe(n));
}

/* ---------- 6c. Voices carousel ---------- */
const voices = [
  { text: 'My daughter came home in week one talking about worms and fractions in the same breath.', who: 'Parent of a Reception child' },
  { text: 'My teacher says it is okay to get it wrong. Then we try again and it is fun.', who: 'Year 3 pupil' },
  { text: 'The key person messaged a photo of him laughing in the mud kitchen. I cried happy tears.', who: 'Parent of a Toddler' },
  { text: 'I am a reading buddy. A little one told me I do the best dragon voice.', who: 'Year 6 pupil' }
];
let vi = 0;
function showVoice() {
  document.getElementById('voice-text').textContent = voices[vi].text;
  document.getElementById('voice-who').textContent = voices[vi].who;
}
document.getElementById('voice-next').addEventListener('click', () => { vi = (vi + 1) % voices.length; showVoice(); });
document.getElementById('voice-prev').addEventListener('click', () => { vi = (vi - 1 + voices.length) % voices.length; showVoice(); });
showVoice();
