/* about.js — about page only: timeline, key person helper, teacher filter, class leaders tool, news filter + search, newsletter signup */
const items = document.querySelectorAll('#timeline li');
items.forEach((li) => {
  const btn = li.querySelector('button');
  const text = li.querySelector('p');
  btn.addEventListener('click', () => {
    const wasOpen = btn.getAttribute('aria-expanded') === 'true';
    items.forEach((other) => {
      other.querySelector('button').setAttribute('aria-expanded', 'false');
      other.querySelector('p').hidden = true;
    });
    if (!wasOpen) { btn.setAttribute('aria-expanded', 'true'); text.hidden = false; }
  });
});

const keyText = {
  toddlers: 'Each child has a key person who greets them, changes and feeds them, and shares daily news with parents.',
  kg: 'A class teacher and a nursery nurse lead each room. The key person model continues, with more group time and independence.',
  lower: 'One class teacher and a teaching assistant stay with the class all year and know every child well.',
  upper: 'A class teacher leads most lessons, with specialists for music, languages and PE. Each child has regular one-to-one check-ins.'
};
const keySelect = document.getElementById('key-year');
const keyOut = document.getElementById('key-out');
keySelect.addEventListener('change', () => {
  keyOut.textContent = keyText[keySelect.value] || 'Pick an age group to see who your child\'s main adult will be.';
});

/* ---------- News: category filter + search ---------- */
const chipButtons = document.querySelectorAll('#news-chips button');
const articles = document.querySelectorAll('#news-grid article');
const searchBox = document.getElementById('news-search');
const emptyMsg = document.getElementById('news-empty');
let activeCat = 'all';

function applyNewsFilter() {
  const q = searchBox.value.trim().toLowerCase();
  let shown = 0;
  articles.forEach((a) => {
    const catOk = activeCat === 'all' || a.dataset.cat === activeCat;
    const textOk = a.textContent.toLowerCase().includes(q);
    a.hidden = !(catOk && textOk);
    if (!a.hidden) shown++;
  });
  emptyMsg.hidden = shown !== 0;
}
chipButtons.forEach((b) => b.addEventListener('click', () => {
  activeCat = b.dataset.cat;
  chipButtons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  applyNewsFilter();
}));
searchBox.addEventListener('input', applyNewsFilter);

/* ---------- Newsletter signup (sent with Formspree, see js/main.js) ---------- */
const nForm = document.getElementById('news-form');
const nEmail = document.getElementById('n-email');
const nStatus = document.getElementById('n-status');
nForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nEmail.value)) {
    showStatus(nStatus, 'Enter an email like name@example.com.', 'bad');
    nEmail.setAttribute('aria-invalid', 'true');
    return;
  }
  nEmail.setAttribute('aria-invalid', 'false');
  if (nForm.querySelector('[name="_gotcha"]').value) { showStatus(nStatus, 'Subscribed.', 'ok'); nForm.reset(); return; }

  const button = nForm.querySelector('button[type="submit"]');
  button.disabled = true;
  showStatus(nStatus, 'Sending...', '');
  const ok = await sendForm({
    form: 'Newsletter signup',
    _subject: 'Newsletter signup',
    email: nEmail.value.trim(),
    _replyto: nEmail.value.trim()
  });
  button.disabled = false;
  if (ok) {
    showStatus(nStatus, 'Subscribed. Thank you! Look out for the next newsletter.', 'ok');
    nForm.reset();
  } else {
    showStatus(nStatus, 'Sorry, we could not sign you up. Please try again.', 'bad');
  }
});

/* ===== people: teachers and class leaders (merged in from the old people page) ===== */
/* (the sticky sub-nav highlight is shared code in js/main.js) */

/* ---------- Teachers: filter by group and search ---------- */
const chips = document.querySelectorAll('#staff-chips button');
const staffCards = document.querySelectorAll('#staff-grid .person');
const staffSearch = document.getElementById('staff-search');
const staffEmpty = document.getElementById('staff-empty');
let activeGroup = 'all';
function filterStaff() {
  const q = staffSearch.value.trim().toLowerCase();
  let shown = 0;
  staffCards.forEach((c) => {
    const groupOk = activeGroup === 'all' || c.dataset.group === activeGroup;
    const textOk = c.textContent.toLowerCase().includes(q);
    c.hidden = !(groupOk && textOk);
    if (!c.hidden) shown++;
  });
  staffEmpty.hidden = shown !== 0;
}
chips.forEach((b) => b.addEventListener('click', () => {
  activeGroup = b.dataset.group;
  chips.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  filterStaff();
}));
staffSearch.addEventListener('input', filterStaff);

/* ---------- Class leaders and monitors ---------- */
const jobs = ['Register runner', 'Door holder', 'Book monitor', 'Plant monitor', 'Eco monitor', 'Line leader'];
const classes = {
  otters:      { teacher: 'Class teacher: Mr Leo Fischer', titles: ['Helper of the week', "Helper's buddy"], leader: 'Ruby', deputy: 'Kai', monitors: ['Ada', 'Ben', 'Cleo', 'Dev', 'Elif', 'Finn'] },
  kingfishers: { teacher: 'Class teacher: Ms Chloe Tran', titles: ['Helper of the week', "Helper's buddy"], leader: 'Isla', deputy: 'Mateo', monitors: ['Nia', 'Oscar', 'Priya', 'Quinn', 'Rosa', 'Sami'] },
  year1:       { teacher: 'Class teacher: Mrs Olivia Grant', titles: ['Class leader', 'Deputy leader'], leader: 'Hana', deputy: 'Jonas', monitors: ['Tara', 'Uri', 'Vera', 'Wes', 'Yara', 'Zane'] },
  year2:       { teacher: 'Class teacher: Mr Samuel Adeyemi', titles: ['Class leader', 'Deputy leader'], leader: 'Leila', deputy: 'Noel', monitors: ['Abe', 'Bea', 'Cal', 'Dina', 'Eli', 'Faye'] },
  year3:       { teacher: 'Class teacher: Ms Nina Petrov', titles: ['Class leader', 'Deputy leader'], leader: 'Marcus', deputy: 'Tess', monitors: ['Gus', 'Hope', 'Ivan', 'Jade', 'Kit', 'Lola'] },
  year4:       { teacher: 'Class teacher: Mr Jack Morrison', titles: ['Class leader', 'Deputy leader'], leader: 'Pia', deputy: 'Reza', monitors: ['Moe', 'Nell', 'Otis', 'Pax', 'Remy', 'Suki'] },
  year5:       { teacher: 'Class teacher: Mrs Fatima Khan', titles: ['Class leader', 'Deputy leader'], leader: 'Zara', deputy: 'Elio', monitors: ['Tomas', 'Uma', 'Vik', 'Wren', 'Xavi', 'Yusuf'] },
  year6:       { teacher: 'Class teacher: Mr Ethan Cole', titles: ['Class leader', 'Deputy leader'], leader: 'Bella', deputy: 'Idris', monitors: ['Cora', 'Dario', 'Esme', 'Felix', 'Gia', 'Hugo'] }
};
const classSelect = document.getElementById('class-select');
const monitorList = document.getElementById('monitor-list');
function showClass(key) {
  const c = classes[key];
  document.getElementById('class-teacher').textContent = c.teacher;
  document.getElementById('cl-leader').textContent = c.leader;
  document.getElementById('cl-leader-title').textContent = c.titles[0];
  document.getElementById('cl-leader-initial').textContent = c.leader[0];
  document.getElementById('cl-deputy').textContent = c.deputy;
  document.getElementById('cl-deputy-title').textContent = c.titles[1];
  document.getElementById('cl-deputy-initial').textContent = c.deputy[0];
  monitorList.innerHTML = '';
  jobs.forEach((job, i) => {
    const li = document.createElement('li');
    const b = document.createElement('b'); b.textContent = c.monitors[i];
    const span = document.createElement('span'); span.textContent = job;
    li.append(b, span);
    monitorList.appendChild(li);
  });
  // little pop animation each time the class changes
  document.querySelectorAll('.badge-card, .monitor-list li').forEach((el) => {
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  });
}
classSelect.addEventListener('change', () => showClass(classSelect.value));
showClass(classSelect.value);
