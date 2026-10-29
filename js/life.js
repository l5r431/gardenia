/* life.js — activity filter + boarding day slider (life page only) */

// 1. Activity filter
const buttons = document.querySelectorAll('#act-chips button');
const cards = document.querySelectorAll('#act-grid li');
const count = document.getElementById('act-count');
function filter(cat) {
  let shown = 0;
  cards.forEach((c) => {
    const show = cat === 'all' || c.dataset.cat === cat;
    c.hidden = !show;
    if (show) shown++;
  });
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
  count.textContent = 'Showing ' + shown + ' of ' + cards.length + ' activities';
}
buttons.forEach((b) => b.addEventListener('click', () => filter(b.dataset.cat)));
filter('all');

// 2. Wraparound day slider: each hour maps to a description
const day = {
  7: 'Breakfast club opens at 7:30 with toast, cereal and quiet games.',
  8: 'Children arrive and settle with their key person or class teacher.',
  9: 'Phonics, stories and the first lesson of the day.',
  10: 'Fruit snack, then outdoor play whatever the weather.',
  11: 'Maths, making and project time.',
  12: 'Lunch together, then a run around the playground.',
  13: 'Afternoon lessons: art, languages or science. The youngest children rest quietly.',
  14: 'Forest school, music or PE.',
  15: 'Home time for most children, with a story and a tidy up.',
  16: 'After-school club: crafts, games and outdoor play.',
  17: 'Tea and a quiet corner for reading.',
  18: 'Club closes at 18:00. Collection from the hall.'
};
const range = document.getElementById('day-range');
const timeLabel = document.getElementById('day-time');
const dayText = document.getElementById('day-text');
function updateDay() {
  const h = Number(range.value);
  timeLabel.textContent = h + ':00';
  dayText.textContent = day[h];
}
range.addEventListener('input', updateDay);
updateDay();

// 3. Sample lunch menu by day
const menu = {
  mon: { main: 'Chicken and vegetable pie with new potatoes', veg: 'Lentil and carrot shepherd\'s pie', pud: 'Apple crumble and custard' },
  tue: { main: 'Fish fingers, peas and sweet potato wedges', veg: 'Cheese and tomato pasta bake', pud: 'Fresh fruit salad' },
  wed: { main: 'Beef meatballs with rice and garden greens', veg: 'Chickpea and spinach curry', pud: 'Yoghurt with berries' },
  thu: { main: 'Roast turkey with vegetables', veg: 'Vegetable and bean casserole', pud: 'Sponge with strawberry sauce' },
  fri: { main: 'Fish pie with broccoli', veg: 'Margherita pizza with salad', pud: 'Flapjack and orange segments' }
};
const menuBtns = document.querySelectorAll('#menu-chips button');
const menuCard = document.getElementById('menu-card');
function showMenu(key) {
  const m = menu[key];
  menuCard.innerHTML = '';
  [['Main', m.main], ['Vegetarian', m.veg], ['Pudding', m.pud]].forEach(([label, text]) => {
    const h = document.createElement('h3'); h.textContent = label;
    const p = document.createElement('p'); p.textContent = text;
    menuCard.append(h, p);
  });
  menuBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.day === key)));
}
menuBtns.forEach((b) => b.addEventListener('click', () => showMenu(b.dataset.day)));
showMenu('mon');

// 4. Photo gallery: tap a photo to open it bigger, then swipe, tap the arrows or use the arrow keys
(function () {
  const items = [...document.querySelectorAll('.gallery-item')];
  const box = document.getElementById('lightbox');
  if (!items.length || !box || typeof box.showModal !== 'function') return;
  const photo = document.getElementById('lb-img');
  const caption = document.getElementById('lb-cap');
  const counter = document.getElementById('lb-count');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;

  // a button can carry data-full="img/big-photo.jpg" to open a larger picture than its thumbnail
  const bigSrc = (i) => items[i].dataset.full || items[i].querySelector('img').src;

  function show(i) {
    index = (i + items.length) % items.length;
    const thumb = items[index].querySelector('img');
    photo.src = bigSrc(index);
    photo.alt = thumb.alt;
    caption.textContent = items[index].dataset.caption || thumb.alt;
    counter.textContent = (index + 1) + ' of ' + items.length;
    if (!reduce && photo.animate) photo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    // start loading the neighbours so the next photo appears at once
    [index - 1, index + 1].forEach((n) => { new Image().src = bigSrc((n + items.length) % items.length); });
  }

  items.forEach((b, i) => b.addEventListener('click', () => { show(i); box.showModal(); }));
  document.getElementById('lb-prev').addEventListener('click', () => show(index - 1));
  document.getElementById('lb-next').addEventListener('click', () => show(index + 1));
  document.getElementById('lb-close').addEventListener('click', () => box.close());

  // tapping the dark area around the photo closes it
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });

  // arrow keys (Escape is handled by the browser)
  document.addEventListener('keydown', (e) => {
    if (!box.open) return;
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // swipe left or right on a phone
  let startX = 0;
  let startY = 0;
  box.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? index + 1 : index - 1);
  }, { passive: true });

  // when it closes, put the keyboard focus back on the photo that was last open
  box.addEventListener('close', () => items[index].focus({ preventScroll: true }));
})();
