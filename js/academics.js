/* academics.js — pathway tabs, animated result bars, subject search (academics page only) */

// 1. Pathway tabs
const paths = {
  tod:   { title: 'Toddlers: ages 2 to 3', text: 'A gentle, play-based start with songs, stories, messy play and a key person for every child.', list: ['6 children for every adult', 'Songs, rhymes and sensory play', 'Outdoor time every day', 'Rest time and healthy snacks'] },
  prek:  { title: 'Pre-K: ages 3 to 4', text: 'Children begin to notice sounds, count objects and take turns, mostly through play.', list: ['Listening games and rhymes', 'Counting with real things', 'Painting, clay and block play', 'Weekly woodland sessions'] },
  rec:   { title: 'Reception: ages 4 to 5', text: 'The bridge to primary school. Daily phonics, number and early writing, still full of play.', list: ['Daily phonics', 'Number bonds and shape games', 'Writing names and short sentences', 'Class jobs and garden days'] },
  ks1:   { title: 'Years 1 to 2: ages 5 to 7', text: 'Children become confident readers and writers and begin to explore science and the wider world.', list: ['Daily reading with an adult', 'Handwriting and spelling', 'Maths with practical equipment', 'First Spanish songs and swimming lessons'] },
  ks2:   { title: 'Years 3 to 6: ages 7 to 11', text: 'More independence and bigger projects, preparing for secondary school with confidence.', list: ['Research projects and presentations', 'French and Spanish', 'Instrument lessons and choir', 'Year 6 residential and leavers\' play'] }
};
const chips = document.querySelectorAll('#path-chips button');
function showPath(key) {
  const p = paths[key];
  document.getElementById('path-title').textContent = p.title;
  document.getElementById('path-text').textContent = p.text;
  const ul = document.getElementById('path-list');
  ul.innerHTML = '';
  p.list.forEach((item) => { const li = document.createElement('li'); li.textContent = item; ul.appendChild(li); });
  chips.forEach((c) => c.setAttribute('aria-selected', String(c.dataset.path === key)));
}
chips.forEach((c) => c.addEventListener('click', () => showPath(c.dataset.path)));
showPath('tod');

// 2. Bars grow when scrolled into view
const bars = document.querySelectorAll('.bar i');
function fill(el) { el.style.width = el.dataset.value + '%'; }
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { fill(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  bars.forEach((b) => io.observe(b));
} else { bars.forEach(fill); }

// 3. Subject search
const search = document.getElementById('subject-search');
const subjects = document.querySelectorAll('#subject-list li');
const empty = document.getElementById('subject-empty');
search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  let shown = 0;
  subjects.forEach((li) => {
    const match = li.textContent.toLowerCase().includes(q);
    li.hidden = !match;
    if (match) shown++;
  });
  empty.hidden = shown !== 0;
});
