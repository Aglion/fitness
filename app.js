'use strict';

/* ================= helpers ================= */
const KEY = 'fitapp.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DOW_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const COLORS = ['#c6f432', '#4cc9f0', '#ff8a3d', '#b388ff', '#ff5d8f', '#2ee6a6', '#ffd23f'];
const MUSCLES = ['Грудь', 'Спина', 'Ноги', 'Плечи', 'Руки', 'Пресс', 'Кардио'];

const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const dow = d => (d.getDay() + 6) % 7;
const todayKey = () => dkey(new Date());
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const dayDiff = k => Math.round((parseKey(k) - parseKey(todayKey())) / 864e5);
const fmtTime = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : null; };
const fmtNum = n => n == null ? '' : String(Math.round(n * 100) / 100);
const durTxt = ms => { const m = Math.max(1, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} ч ${m % 60} мин` : `${m} мин`; };
const shortDate = k => { const d = parseKey(k); return `${d.getDate()} ${MONTHS_GEN[d.getMonth()].slice(0, 3)}`; };
const setTxt = s => { const kg = num(s.kg); return kg ? `${fmtNum(kg)}×${s.reps || '—'}` : `${s.reps || '—'} повт`; };
const ytId = url => { const m = String(url || '').match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{11})/); return m && m[1]; };
const safeUrl = u => { u = String(u || '').trim(); if (!u) return ''; return /^https?:\/\//i.test(u) ? u : 'https://' + u; };

function toast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), ms);
}

/* ================= storage ================= */
function defaults() {
  const E = (name, muscle, notes = '') => ({ id: uid(), name, muscle, video: '', notes, file: false });
  const ex = {
    squat: E('Приседания со штангой', 'Ноги', 'Спина прямая, колени смотрят туда же, куда носки. Опускайся до параллели бедра с полом, вес на пятках.'),
    rdl: E('Румынская тяга', 'Ноги', 'Отводи таз назад, колени слегка согнуты, штанга скользит по бёдрам. Спина прямая всё время.'),
    legpress: E('Жим ногами', 'Ноги'),
    lunge: E('Выпады с гантелями', 'Ноги', 'Широкий шаг, корпус вертикально, заднее колено почти касается пола.'),
    bench: E('Жим штанги лёжа', 'Грудь', 'Лопатки сведены и прижаты, штанга опускается к низу груди, локти под углом ~45°.'),
    incline: E('Жим гантелей на наклонной', 'Грудь'),
    pullup: E('Подтягивания', 'Спина', 'Полная амплитуда, без раскачки. Тянись грудью к перекладине.'),
    row: E('Тяга штанги в наклоне', 'Спина', 'Наклон ~45°, спина прямая, тяни штангу к поясу, сводя лопатки.'),
    latpd: E('Тяга верхнего блока', 'Спина'),
    ohp: E('Жим гантелей сидя', 'Плечи'),
    lateral: E('Махи гантелями в стороны', 'Плечи', 'Локти чуть согнуты, поднимай до уровня плеч, без рывков.'),
    curl: E('Сгибания на бицепс', 'Руки'),
    triceps: E('Разгибания на блоке (трицепс)', 'Руки'),
    plank: E('Планка', 'Пресс', 'Тело в одну линию, пресс и ягодицы напряжены, не прогибайся в пояснице.'),
  };
  const I = (e, sets, reps, rest) => ({ id: uid(), exId: e.id, sets, reps: String(reps), rest });
  const wA = { id: uid(), name: 'Верх тела', color: COLORS[1], items: [I(ex.bench, 4, 8, 90), I(ex.row, 4, 10, 90), I(ex.ohp, 3, 10, 60), I(ex.latpd, 3, 12, 60), I(ex.curl, 3, 12, 60), I(ex.triceps, 3, 12, 60)] };
  const wB = { id: uid(), name: 'Ноги', color: COLORS[0], items: [I(ex.squat, 4, 8, 120), I(ex.rdl, 3, 10, 90), I(ex.legpress, 3, 12, 90), I(ex.lunge, 3, 10, 60), I(ex.plank, 3, '45 сек', 45)] };
  const wC = { id: uid(), name: 'Всё тело', color: COLORS[2], items: [I(ex.squat, 3, 10, 90), I(ex.bench, 3, 10, 90), I(ex.pullup, 3, 'макс', 90), I(ex.lateral, 3, 15, 45), I(ex.plank, 3, '60 сек', 45)] };
  return {
    v: 1,
    exercises: Object.values(ex),
    workouts: [wA, wB, wC],
    week: { 0: wA.id, 2: wB.id, 4: wC.id },
    overrides: {},
    logs: {},
    settings: { rest: 60, sound: true },
    savedAt: 0,
  };
}

function normalize(s) {
  if (!s || !Array.isArray(s.exercises) || !Array.isArray(s.workouts)) return null;
  s.v = 1;
  s.week = s.week || {};
  s.overrides = s.overrides || {};
  s.logs = s.logs || {};
  s.settings = Object.assign({ rest: 60, sound: true }, s.settings);
  return s;
}

function load() {
  try { const s = normalize(JSON.parse(localStorage.getItem(KEY))); if (s) return s; } catch (e) { /* first run */ }
  return defaults();
}

function persistLocal() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Не удалось сохранить данные'); }
}
// savedAt меняется только при действиях пользователя — по нему решаем, где данные свежее: на телефоне или в облаке Telegram
function save() {
  S.savedAt = Date.now();
  persistLocal();
  cloud.schedule();
}

/* ================= Telegram ================= */
const tg = () => (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData !== undefined) ? window.Telegram.WebApp : null;
const tgAtLeast = v => { const t = tg(); return !!(t && t.isVersionAtLeast && t.isVersionAtLeast(v)); };

function ask(msg) {
  const t = tg();
  if (tgAtLeast('6.2')) return new Promise(res => t.showConfirm(msg, ok => res(!!ok)));
  return Promise.resolve(confirm(msg));
}
function haptic(kind) {
  if (!tgAtLeast('6.1')) return;
  const h = tg().HapticFeedback;
  if (kind === 'success') h.notificationOccurred('success'); else h.impactOccurred(kind || 'light');
}

// Облако Telegram: значение ≤ 4096 символов, поэтому всё состояние режем на куски s0, s1, … и пишем их количество в n
const cloud = {
  ok: false, busy: false, dirty: false, timer: 0,
  api() { return tgAtLeast('6.9') ? tg().CloudStorage : null; },
  call(fn, ...args) {
    return new Promise((res, rej) => this.api()[fn](...args, (err, val) => (err ? rej(err) : res(val))));
  },
  async pull() {
    const n = parseInt(await this.call('getItem', 'n')) || 0;
    if (!n) return null;
    const keys = Array.from({ length: n }, (_, i) => 's' + i);
    const vals = await this.call('getItems', keys);
    return JSON.parse(keys.map(k => vals[k] || '').join(''));
  },
  async push() {
    const str = JSON.stringify(S), parts = [];
    for (let i = 0; i < str.length; i += 4000) parts.push(str.slice(i, i + 4000));
    const oldN = parseInt(await this.call('getItem', 'n')) || 0;
    for (let i = 0; i < parts.length; i++) await this.call('setItem', 's' + i, parts[i]);
    await this.call('setItem', 'n', String(parts.length));
    if (oldN > parts.length) {
      await this.call('removeItems', Array.from({ length: oldN - parts.length }, (_, i) => 's' + (parts.length + i)));
    }
  },
  async flush() {
    if (!this.ok) return;
    clearTimeout(this.timer);
    if (this.busy) { this.dirty = true; return; }
    this.busy = true;
    try { do { this.dirty = false; await this.push(); } while (this.dirty); } catch (e) { /* попробуем при следующем сохранении */ }
    this.busy = false;
  },
  schedule() {
    if (!this.ok) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 1500);
  },
  async init() {
    if (!this.api()) return;
    let remote = null;
    try { remote = normalize(await this.pull()); } catch (e) { /* облако пустое или битое — перезапишем */ }
    this.ok = true;
    if (remote && (remote.savedAt || 0) > (S.savedAt || 0)) {
      S = remote; persistLocal(); render();
      toast('Данные загружены из облака Telegram ☁️');
    } else if (!remote || (S.savedAt || 0) > (remote.savedAt || 0)) {
      this.flush();
    }
  },
};

const idb = {
  _db: null,
  open() {
    return this._db || (this._db = new Promise((res, rej) => {
      const r = indexedDB.open('fitapp', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('videos');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
  },
  async run(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('videos', mode);
      const req = fn(t.objectStore('videos'));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  },
  put(k, v) { return this.run('readwrite', s => s.put(v, k)); },
  get(k) { return this.run('readonly', s => s.get(k)); },
  del(k) { return this.run('readwrite', s => s.delete(k)); },
  clear() { return this.run('readwrite', s => s.clear()); },
};

let S = load();
persistLocal();

/* ================= model ================= */
const exById = id => S.exercises.find(e => e.id === id);
const woById = id => S.workouts.find(w => w.id === id);

function plannedId(k) {
  if (k in S.overrides) return S.overrides[k];
  return S.week[dow(parseKey(k))] || '';
}
const workoutFor = k => woById(plannedId(k)) || null;
const isDone = log => !!log && (log.finished || Object.values(log.ex || {}).some(e => e.sets.some(s => s.done)));

// всё, что сделано по упражнению: [{date, sets}] по возрастанию даты
function history(exId) {
  const out = [];
  Object.keys(S.logs).sort().forEach(k => {
    const sets = [];
    Object.values(S.logs[k].ex || {}).forEach(e => { if (e.exId === exId) e.sets.forEach(s => s.done && sets.push(s)); });
    if (sets.length) out.push({ date: k, sets });
  });
  return out;
}
function lastSets(exId, before) {
  const h = history(exId).filter(x => x.date < before);
  return h.length ? h[h.length - 1].sets : null;
}
function bestKg(exId) {
  let best = 0;
  history(exId).forEach(x => x.sets.forEach(s => { best = Math.max(best, num(s.kg) || 0); }));
  return best;
}

function initSets(it, k) {
  const prev = lastSets(it.exId, k);
  return Array.from({ length: Math.max(1, it.sets) }, (_, i) => {
    const p = prev && (prev[i] || prev[prev.length - 1]);
    return { kg: p ? p.kg : '', reps: p ? p.reps : '', done: false };
  });
}

function ensureLog(k, w) {
  let log = S.logs[k];
  if (!log || log.workoutId !== w.id) {
    log = { workoutId: w.id, ex: {}, finished: false };
    S.logs[k] = log;
  }
  w.items.forEach(it => { if (!log.ex[it.id]) log.ex[it.id] = { exId: it.exId, sets: initSets(it, k) }; });
  return log;
}

async function setDayWorkout(k, id) {
  const log = S.logs[k];
  if (log && log.workoutId !== id && isDone(log) &&
      !(await ask('В этот день уже отмечены подходы. Заменить тренировку? Отметки за этот день удалятся.'))) return false;
  const planned = S.week[dow(parseKey(k))] || '';
  if (id === planned) delete S.overrides[k]; else S.overrides[k] = id;
  if (log && log.workoutId !== id) delete S.logs[k];
  save();
  return true;
}

function muscles() {
  const set = new Set(S.exercises.map(e => e.muscle || 'Другое'));
  return [...MUSCLES.filter(m => set.has(m)), ...[...set].filter(m => !MUSCLES.includes(m)).sort()];
}

function woOptions(sel) {
  return `<option value="">😴 Отдых</option>` +
    S.workouts.map(w => `<option value="${w.id}" ${w.id === sel ? 'selected' : ''}>${esc(w.name)}</option>`).join('');
}

function exOptions() {
  return muscles().map(m => `<optgroup label="${esc(m)}">${
    S.exercises.filter(e => (e.muscle || 'Другое') === m)
      .map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join('')
  }</optgroup>`).join('');
}

/* ================= UI state ================= */
let tab = 'workout';
let viewDate = todayKey();
let calMonth = { y: new Date().getFullYear(), m: new Date().getMonth() };
let exQ = '', exM = '';
let sheetCtx = null;
let sheetURLs = [];
const inTelegram = /tgWebApp/.test(location.hash + location.search);

const TITLES = { workout: 'Тренировка', calendar: 'Календарь', programs: 'Программы', exercises: 'Упражнения', timer: 'Таймер' };
const VIEWS = { workout: vWorkout, calendar: vCalendar, programs: vPrograms, exercises: vExercises, timer: vTimer };

function render() {
  $('#title').textContent = TITLES[tab];
  $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('#view').innerHTML = VIEWS[tab]();
  drawTimer();
}

/* ================= views ================= */
function installHint() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  if (!ios || standalone || inTelegram || localStorage.getItem('fitapp.hint')) return '';
  return `<div class="card hintcard">📲<span>Добавь приложение на экран «Домой»: <b>Поделиться → На экран «Домой»</b>. Тогда оно будет открываться как обычное приложение.</span><button class="x" data-act="hideHint" aria-label="Скрыть">✕</button></div>`;
}

function vWorkout() {
  const k = viewDate, d = parseKey(k), w = workoutFor(k), diff = dayDiff(k);
  const rel = { 0: 'Сегодня', 1: 'Завтра', '-1': 'Вчера' }[diff] || (d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + ' г.' : '&nbsp;');
  let h = installHint();
  h += `<div class="daynav">
      <button class="icon-btn" data-act="day" data-n="-1" aria-label="Предыдущий день">‹</button>
      <div class="daylabel"><small>${rel}</small><b>${DOW_FULL[dow(d)]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}</b></div>
      <button class="icon-btn" data-act="day" data-n="1" aria-label="Следующий день">›</button>
    </div>
    <label class="pick" style="--c:${w ? w.color : 'var(--muted)'}"><i></i>
      <select data-field="dayWorkout" data-k="${k}">${woOptions(w ? w.id : '')}</select><span class="chev">▾</span>
    </label>`;
  if (diff !== 0) h += `<button class="link center" data-act="day" data-n="0">← Вернуться к сегодня</button>`;

  if (!w) {
    return h + `<div class="empty"><div class="emoji">🛌</div><h2>День отдыха</h2>
      <p>Восстановление — тоже часть прогресса.<br>Хочешь позаниматься — выбери тренировку выше.</p></div>`;
  }
  if (!w.items.length) {
    return h + `<div class="empty"><div class="emoji">📝</div><h2>Программа пустая</h2>
      <p>В «${esc(w.name)}» пока нет упражнений.</p>
      <button class="btn primary" data-act="editProg" data-id="${w.id}">Добавить упражнения</button></div>`;
  }

  const log = ensureLog(k, w);
  let done = 0, total = 0, ton = 0, cards = '';
  w.items.forEach(it => {
    const e = exById(it.exId), L = log.ex[it.id];
    if (!e || !L) return;
    const prev = lastSets(e.id, k);
    L.sets.forEach(s => {
      total++;
      if (s.done) { done++; ton += (num(s.kg) || 0) * (parseInt(s.reps) || 0); }
    });
    const complete = L.sets.every(s => s.done);
    cards += `<section class="card ex ${complete ? 'complete' : ''}">
      <div class="ex-head" data-act="exInfo" data-id="${e.id}">
        <div class="ex-title"><h3>${esc(e.name)}</h3>
          <div class="meta">${it.sets} × ${esc(it.reps)} · отдых ${fmtTime(it.rest)}</div></div>
        <span class="chip">${e.video || e.file ? '▶ Видео' : 'ℹ︎ Техника'}</span>
      </div>
      ${prev ? `<div class="prev">Прошлый раз: ${prev.map(setTxt).join(', ')}</div>` : ''}
      <div class="sets">
        <div class="set hdr"><span>#</span><span>кг</span><span>повт.</span><span></span></div>
        ${L.sets.map((s, i) => `<div class="set ${s.done ? 'done' : ''}">
          <span class="n">${i + 1}</span>
          <input inputmode="decimal" enterkeyhint="done" data-field="setVal" data-k="kg" data-item="${it.id}" data-i="${i}" value="${esc(s.kg)}" placeholder="—">
          <input inputmode="numeric" enterkeyhint="done" data-field="setVal" data-k="reps" data-item="${it.id}" data-i="${i}" value="${esc(s.reps)}" placeholder="${esc(it.reps)}">
          <button class="check" data-act="toggleSet" data-item="${it.id}" data-i="${i}" aria-label="Подход выполнен">✓</button>
        </div>`).join('')}
      </div>
      <div class="ex-foot">
        <button class="link" data-act="addSet" data-item="${it.id}">+ подход</button>
        ${L.sets.length > 1 ? `<button class="link muted" data-act="delSet" data-item="${it.id}">− подход</button>` : ''}
        <button class="link right" data-act="rest" data-sec="${it.rest}">⏱ ${fmtTime(it.rest)}</button>
      </div>
    </section>`;
  });

  const pct = total ? Math.round(done / total * 100) : 0;
  h += `<div class="card progress">
      <div class="pg-top"><b>${done} / ${total}</b> подходов<span>${ton ? fmtNum(ton) + ' кг поднято' : ''}</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </div>${cards}`;
  h += log.finished
    ? `<div class="finished"><span>✅ Тренировка завершена${log.start && log.end ? ' · ' + durTxt(log.end - log.start) : ''}</span>
         <button class="link" data-act="unfinish">Продолжить</button></div>`
    : `<button class="btn primary block big" data-act="finish">Завершить тренировку</button>`;
  return h;
}

function vCalendar() {
  const { y, m } = calMonth, first = new Date(y, m, 1), off = dow(first), n = new Date(y, m + 1, 0).getDate(), tk = todayKey();
  let cells = '', doneCnt = 0, planCnt = 0;
  for (let i = 0; i < off; i++) cells += '<span></span>';
  for (let d = 1; d <= n; d++) {
    const k = dkey(new Date(y, m, d)), w = workoutFor(k), did = isDone(S.logs[k]);
    if (did) doneCnt++;
    if (w) planCnt++;
    const cls = ['day', k === tk && 'today', did && 'did', w && 'has', k < tk && w && !did && 'missed'].filter(Boolean).join(' ');
    const c = did && S.logs[k] ? (woById(S.logs[k].workoutId) || {}).color || 'var(--accent)' : w ? w.color : 'transparent';
    cells += `<button class="${cls}" style="--c:${c}" data-act="calDay" data-k="${k}"><span>${d}</span>${did ? '<b>✓</b>' : w ? '<i></i>' : ''}</button>`;
  }
  const allDone = Object.values(S.logs).filter(isDone).length;
  return `<div class="calhead">
      <button class="icon-btn" data-act="month" data-n="-1" aria-label="Предыдущий месяц">‹</button>
      <b>${cap(MONTHS[m])} ${y}</b>
      <button class="icon-btn" data-act="month" data-n="1" aria-label="Следующий месяц">›</button>
    </div>
    <div class="cal">
      <div class="dows">${DOW.map(d => `<span>${d}</span>`).join('')}</div>
      <div class="grid">${cells}</div>
    </div>
    <div class="stats">
      <div class="card stat"><b>${doneCnt}</b><span>сделано</span></div>
      <div class="card stat"><b>${planCnt}</b><span>в плане</span></div>
      <div class="card stat"><b>${allDone}</b><span>всего</span></div>
    </div>
    <div class="card legend">${S.workouts.map(w => `<span><i style="background:${w.color}"></i>${esc(w.name)}</span>`).join('') || '<span class="muted">Нет программ</span>'}</div>
    <p class="hint">Нажми на день, чтобы открыть или поменять тренировку. Расписание по дням недели — во вкладке «Программы».</p>`;
}

function vPrograms() {
  return `<section class="card">
      <h3>Расписание на неделю</h3>
      <div style="margin-top:8px">${DOW_FULL.map((d, i) => `<label class="weekrow"><span>${d}</span>
        <select data-field="week" data-i="${i}">${woOptions(S.week[i] || '')}</select></label>`).join('')}</div>
    </section>
    <h4>Мои программы</h4>
    ${S.workouts.map(w => {
      const days = DOW.filter((_, i) => S.week[i] === w.id).join(', ');
      const names = w.items.map(it => (exById(it.exId) || {}).name).filter(Boolean);
      return `<button class="card prog" style="--c:${w.color}" data-act="editProg" data-id="${w.id}">
        <div><h3>${esc(w.name)}</h3>
          <div class="meta">${w.items.length} упр. · ${days || 'не в расписании'}</div>
          <div class="meta small">${esc(names.slice(0, 3).join(', '))}${names.length > 3 ? '…' : ''}</div></div>
        <span class="chev">›</span></button>`;
    }).join('')}
    <button class="btn primary block" data-act="editProg" data-id="">+ Новая программа</button>`;
}

function vExercises() {
  return `<input type="search" placeholder="🔎 Поиск упражнения" data-input="exq" value="${esc(exQ)}">
    <div class="chips scroll">${['', ...muscles()].map(m =>
      `<button class="chip ${m === exM ? 'on' : ''}" data-act="exM" data-m="${esc(m)}">${esc(m || 'Все')}</button>`).join('')}</div>
    <div id="exlist">${exList()}</div>
    <button class="btn primary block" data-act="editEx" data-id="">+ Новое упражнение</button>`;
}

function exList() {
  const q = exQ.trim().toLowerCase();
  const list = S.exercises.filter(e => (!exM || (e.muscle || 'Другое') === exM) && (!q || e.name.toLowerCase().includes(q)));
  if (!list.length) return '<p class="hint">Ничего не найдено</p>';
  return muscles().filter(m => list.some(e => (e.muscle || 'Другое') === m)).map(m =>
    `<h4 class="group">${esc(m)}</h4><div class="card list">${list.filter(e => (e.muscle || 'Другое') === m).map(e => {
      const hasVideo = e.video || e.file, best = bestKg(e.id);
      return `<button class="row-item" data-act="exInfo" data-id="${e.id}">
        <span class="thumb ${hasVideo ? 'has' : ''}">${hasVideo ? '▶' : '•'}</span>
        <span class="ri-txt"><b>${esc(e.name)}</b><small>${hasVideo ? 'есть видео' : 'без видео'}${best ? ` · рекорд ${fmtNum(best)} кг` : ''}</small></span>
        <span class="chev">›</span></button>`;
    }).join('')}</div>`).join('');
}

const RING = 565.49;
function vTimer() {
  return `<div class="timer-big">
      <svg viewBox="0 0 200 200"><circle class="track" cx="100" cy="100" r="90"/><circle class="prog" data-t="ring" cx="100" cy="100" r="90"/></svg>
      <div class="t-center"><div class="t-time" data-t="time">1:00</div><div class="t-label" data-t="label">Готов</div></div>
    </div>
    <div class="t-ctrl">
      <button class="icon-btn" data-act="tAdj" data-n="-15">−15</button>
      <button class="btn primary" data-act="tToggle" data-t="toggle">Старт</button>
      <button class="icon-btn" data-act="tAdj" data-n="15">+15</button>
    </div>
    <div class="presets">${[30, 45, 60, 90, 120, 180].map(s =>
      `<button class="chip ${s === S.settings.rest ? 'on' : ''}" data-act="tPreset" data-sec="${s}">${s < 60 ? s + ' сек' : fmtTime(s)}</button>`).join('')}</div>
    <div class="custom">
      <input type="number" inputmode="numeric" min="5" step="5" placeholder="Своё время, сек" id="customSec">
      <button class="btn" data-act="tCustom">Старт</button>
    </div>
    <p class="hint">Время по умолчанию — ${fmtTime(S.settings.rest)} (меняется в ⚙︎ настройках).<br>
    Таймер запускается сам, когда ты отмечаешь подход ✓. Звук не слышно, если на iPhone включён беззвучный режим.</p>`;
}

/* ================= timer ================= */
const T = { running: false, paused: false, end: 0, left: 0, total: 0, doneAt: 0, lastTick: 0 };
let AC = null, WL = null;

function unlockAudio() {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { /* no audio */ }
}
function tone(freq, at, len, vol = 0.35) {
  if (!AC || !S.settings.sound) return;
  const t = AC.currentTime + at, o = AC.createOscillator(), g = AC.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(AC.destination);
  o.start(t); o.stop(t + len + 0.02);
}
async function wake(on) {
  try {
    if (on && !WL && 'wakeLock' in navigator) {
      WL = await navigator.wakeLock.request('screen');
      WL.addEventListener('release', () => { WL = null; });
    } else if (!on && WL) { await WL.release(); WL = null; }
  } catch (e) { /* not supported */ }
}

const tLeft = () => !T.running ? (T.doneAt && Date.now() - T.doneAt < 3000 ? 0 : S.settings.rest)
  : T.paused ? T.left : Math.max(0, (T.end - Date.now()) / 1000);

function startTimer(sec) {
  sec = Math.max(1, Math.round(sec));
  unlockAudio();
  Object.assign(T, { running: true, paused: false, total: sec, end: Date.now() + sec * 1000, doneAt: 0, lastTick: 0 });
  document.body.classList.remove('flash');
  wake(true);
  drawTimer();
}
function stopTimer() {
  T.running = false; T.doneAt = 0;
  wake(false);
  drawTimer();
}
function finishTimer() {
  const late = Date.now() - T.end > 5000;
  T.running = false; T.doneAt = Date.now();
  if (!late) { tone(880, 0, 0.25); tone(880, 0.35, 0.25); tone(1320, 0.7, 0.5); }
  if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
  haptic('success');
  document.body.classList.add('flash');
  setTimeout(() => document.body.classList.remove('flash'), 3000);
  toast('Отдых окончен — следующий подход 💪');
  wake(false);
  drawTimer();
}
function tick() {
  if (T.running && !T.paused) {
    const left = (T.end - Date.now()) / 1000;
    if (left <= 0) return finishTimer();
    const s = Math.ceil(left);
    if (s <= 3 && s !== T.lastTick) { T.lastTick = s; tone(660, 0, 0.12, 0.25); }
  }
  if (T.running || T.doneAt) drawTimer();
  if (T.doneAt && Date.now() - T.doneAt > 3000) { T.doneAt = 0; drawTimer(); }
}
function drawTimer() {
  const left = tLeft(), total = T.running ? T.total : S.settings.rest, frac = total ? Math.min(1, left / total) : 0;
  const flashing = !T.running && T.doneAt;
  $$('[data-t=time]').forEach(el => { el.textContent = fmtTime(left); });
  $$('[data-t=ring]').forEach(el => { el.style.strokeDashoffset = String(RING * (1 - frac)); });
  $$('[data-t=bar]').forEach(el => { el.style.transform = `scaleX(${frac})`; });
  $$('[data-t=toggle]').forEach(el => { el.textContent = !T.running ? 'Старт' : T.paused ? 'Дальше' : 'Пауза'; });
  $$('[data-t=label]').forEach(el => { el.textContent = flashing ? 'Время! 💪' : !T.running ? 'Готов' : T.paused ? 'Пауза' : 'Отдых'; });
  $('#timerbar').hidden = !((T.running || flashing) && tab !== 'timer');
}
setInterval(tick, 200);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); if (T.running) wake(true); } });

/* ================= sheets ================= */
let sheetTimer = 0;
function openSheet(html) {
  clearTimeout(sheetTimer);
  sheetURLs.forEach(u => URL.revokeObjectURL(u)); sheetURLs = [];
  const sh = $('#sheet');
  sh.innerHTML = `<div class="backdrop" data-act="closeSheet"></div><div class="panel"><div class="grab"></div><div id="sheetbody">${html}</div></div>`;
  sh.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => sh.classList.add('open')));
  document.body.classList.add('noscroll');
  if (tgAtLeast('6.1')) tg().BackButton.show();
}
function closeSheet() {
  const sh = $('#sheet');
  sheetCtx = null;
  if (tgAtLeast('6.1')) tg().BackButton.hide();
  if (sh.hidden) return;
  sh.classList.remove('open');
  document.body.classList.remove('noscroll');
  clearTimeout(sheetTimer);
  sheetTimer = setTimeout(() => {
    sh.hidden = true; sh.innerHTML = '';
    sheetURLs.forEach(u => URL.revokeObjectURL(u)); sheetURLs = [];
  }, 300);
}

function openDay(k) { sheetCtx = { type: 'day', k }; openSheet(''); drawDay(); }
function drawDay() {
  const k = sheetCtx.k, d = parseKey(k), w = workoutFor(k), log = S.logs[k], over = k in S.overrides;
  let body;
  if (isDone(log)) {
    const rows = Object.values(log.ex).map(x => {
      const e = exById(x.exId), sets = x.sets.filter(s => s.done);
      return e && sets.length ? `<li><span>${esc(e.name)}</span><small>${sets.map(setTxt).join(', ')}</small></li>` : '';
    }).join('');
    body = `<h4>Что сделано${log.finished ? ' ✅' : ''}</h4><ul class="plain">${rows}</ul>`;
  } else if (w) {
    body = `<ul class="plain">${w.items.map(it => {
      const e = exById(it.exId);
      return e ? `<li><span>${esc(e.name)}</span><small>${it.sets} × ${esc(it.reps)}</small></li>` : '';
    }).join('')}</ul>`;
  } else body = '<p class="muted">День отдыха 😴</p>';
  $('#sheetbody').innerHTML = `<h2>${DOW_FULL[dow(d)]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}</h2>
    <label class="pick" style="--c:${w ? w.color : 'var(--muted)'}"><i></i>
      <select data-field="dayWorkout" data-k="${k}">${woOptions(w ? w.id : '')}</select><span class="chev">▾</span></label>
    ${over ? `<button class="link" data-act="resetDay" data-k="${k}">↺ Вернуть как в расписании</button>` : ''}
    ${body}
    <div class="sheet-actions">
      <button class="btn ghost" data-act="closeSheet">Закрыть</button>
      ${w || isDone(log) ? `<button class="btn primary" data-act="goDay" data-k="${k}">Открыть тренировку</button>` : ''}
    </div>`;
}

async function openEx(id) {
  const e = exById(id);
  if (!e) return;
  sheetCtx = { type: 'exInfo', id };
  let media = '';
  if (e.file) {
    try {
      const blob = await idb.get(e.id);
      if (blob) {
        const url = URL.createObjectURL(blob); sheetURLs.push(url);
        media = `<video class="media" src="${url}" controls playsinline preload="metadata"></video>`;
      }
    } catch (err) { /* ignore */ }
  }
  if (!media) {
    const y = ytId(e.video);
    if (y) media = `<div class="media yt"><iframe src="https://www.youtube-nocookie.com/embed/${y}?playsinline=1&rel=0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
    else if (e.video) media = `<a class="media link" href="${esc(safeUrl(e.video))}" target="_blank" rel="noopener">▶ Открыть видео</a>`;
  }
  if (!media) media = `<div class="media none">Видео ещё не добавлено<br><button class="btn ghost" style="margin-top:12px" data-act="editEx" data-id="${e.id}">+ Добавить видео</button></div>`;
  const h = history(e.id);
  const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + ' техника выполнения')}`;
  openSheet(`<h2>${esc(e.name)}</h2><div class="meta">${esc(e.muscle || 'Другое')}</div>
    ${media}
    <a class="link" href="${yt}" target="_blank" rel="noopener">🔎 Найти технику на YouTube</a>
    ${e.notes ? `<div class="notes"><h4>Техника</h4><p>${esc(e.notes).replace(/\n/g, '<br>')}</p></div>` : ''}
    <h4>Прогресс — лучший вес</h4>
    ${chart(h)}
    ${h.length ? `<h4>История</h4><div class="hist">${h.slice(-8).reverse().map(x =>
      `<div><span>${shortDate(x.date)}</span><span>${x.sets.map(setTxt).join(', ')}</span></div>`).join('')}</div>` : ''}
    <div class="sheet-actions">
      <button class="btn ghost" data-act="editEx" data-id="${e.id}">✎ Изменить</button>
      <button class="btn" data-act="closeSheet">Закрыть</button>
    </div>`);
}

function chart(h) {
  const pts = h.slice(-12).map(x => ({ d: x.date, v: Math.max(0, ...x.sets.map(s => num(s.kg) || 0)) })).filter(p => p.v > 0);
  if (!pts.length) return '<p class="muted small">Пока нет записей. Отмечай подходы с весом — здесь появится график.</p>';
  if (pts.length === 1) return `<p class="muted small">Лучший вес: <b style="color:var(--text)">${fmtNum(pts[0].v)} кг</b> (${shortDate(pts[0].d)}). Нужна ещё одна тренировка для графика.</p>`;
  const W = 320, H = 130, P = 18;
  const vs = pts.map(p => p.v), min = Math.min(...vs), max = Math.max(...vs), span = max - min || 1;
  const x = i => P + i * (W - 2 * P) / (pts.length - 1);
  const yy = v => H - P - (v - min) / span * (H - 2 * P - 10);
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${yy(p.v).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">
    <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${yy(p.v)}" r="3.5" fill="var(--accent)"/>`).join('')}
    <text x="${x(0)}" y="${yy(pts[0].v) - 8}" text-anchor="start">${fmtNum(pts[0].v)}</text>
    <text x="${x(pts.length - 1)}" y="${yy(pts[pts.length - 1].v) - 8}" text-anchor="end">${fmtNum(pts[pts.length - 1].v)} кг</text>
    <text x="${P}" y="${H - 2}">${shortDate(pts[0].d)}</text>
    <text x="${W - P}" y="${H - 2}" text-anchor="end">${shortDate(pts[pts.length - 1].d)}</text>
  </svg>`;
}

function openExEdit(id) {
  const e = id ? exById(id) : { id: uid(), name: '', muscle: exM || '', video: '', notes: '', file: false };
  sheetCtx = { type: 'exEdit', isNew: !id, d: { ...e }, blob: null, removeFile: false };
  openSheet('');
  drawExEdit();
}
function drawExEdit() {
  const c = sheetCtx, d = c.d, hasFile = (d.file && !c.removeFile) || c.blob;
  $('#sheetbody').innerHTML = `<h2>${c.isNew ? 'Новое упражнение' : 'Упражнение'}</h2>
    <label class="fld"><span>Название</span><input data-input="exF" data-k="name" value="${esc(d.name)}" placeholder="Например: Жим лёжа"></label>
    <label class="fld"><span>Группа мышц</span><input data-input="exF" data-k="muscle" list="muscleList" value="${esc(d.muscle)}" placeholder="Грудь, Спина, Ноги…">
      <datalist id="muscleList">${[...new Set([...MUSCLES, ...muscles()])].map(m => `<option value="${esc(m)}">`).join('')}</datalist></label>
    <label class="fld"><span>Ссылка на видео (YouTube, Instagram, TikTok…)</span>
      <input data-input="exF" data-k="video" type="url" inputmode="url" value="${esc(d.video)}" placeholder="https://youtu.be/..."></label>
    <div class="fld"><span>…или видео с телефона</span>
      <div class="filebox">
        ${hasFile ? `<span class="tag">🎬 ${c.blob ? esc(c.blob.name || 'видео') : 'видео прикреплено'}</span><button class="link muted" data-act="exFileDel">Убрать</button>` : ''}
        <label class="btn ghost">📁 ${hasFile ? 'Заменить' : 'Выбрать видео'}<input type="file" accept="video/*" data-field="exFile" hidden></label>
      </div></div>
    <label class="fld"><span>Техника / заметки</span><textarea data-input="exF" data-k="notes" placeholder="На что обращать внимание">${esc(d.notes)}</textarea></label>
    <div class="sheet-actions">
      ${c.isNew ? '' : '<button class="btn ghost danger" data-act="exDelete">Удалить</button>'}
      <button class="btn primary" data-act="exSave">Сохранить</button>
    </div>`;
}

function openProg(id) {
  const w = id ? woById(id) : { id: uid(), name: '', color: COLORS[S.workouts.length % COLORS.length], items: [] };
  sheetCtx = { type: 'prog', isNew: !id, d: JSON.parse(JSON.stringify(w)) };
  openSheet('');
  drawProg();
}
function drawProg() {
  const c = sheetCtx, d = c.d;
  $('#sheetbody').innerHTML = `<h2>${c.isNew ? 'Новая программа' : 'Программа'}</h2>
    <label class="fld"><span>Название</span><input data-input="pName" value="${esc(d.name)}" placeholder="Например: Грудь и трицепс"></label>
    <div class="colors">${COLORS.map(col => `<button class="sw ${col === d.color ? 'on' : ''}" style="background:${col}" data-act="pColor" data-c="${col}" aria-label="Цвет"></button>`).join('')}</div>
    <div>${d.items.map((it, i) => {
      const e = exById(it.exId);
      return `<div class="pitem">
        <div class="pi-top"><b>${i + 1}. ${esc(e ? e.name : '—')}</b><span class="pi-btns">
          <button data-act="pMove" data-i="${i}" data-n="-1" aria-label="Выше">↑</button>
          <button data-act="pMove" data-i="${i}" data-n="1" aria-label="Ниже">↓</button>
          <button data-act="pDel" data-i="${i}" aria-label="Убрать">✕</button></span></div>
        <div class="pi-grid">
          <label>Подходы<input inputmode="numeric" data-input="pItem" data-i="${i}" data-k="sets" value="${it.sets}"></label>
          <label>Повторы<input data-input="pItem" data-i="${i}" data-k="reps" value="${esc(it.reps)}"></label>
          <label>Отдых, сек<input inputmode="numeric" data-input="pItem" data-i="${i}" data-k="rest" value="${it.rest}"></label>
        </div></div>`;
    }).join('') || '<p class="muted small">Добавь упражнения ниже 👇</p>'}</div>
    <label class="addsel"><select data-field="pAdd"><option value="">+ Добавить упражнение…</option>${exOptions()}</select></label>
    <div class="sheet-actions">
      ${c.isNew ? '' : '<button class="btn ghost danger" data-act="pRemove">Удалить</button>'}
      <button class="btn primary" data-act="pSave">Сохранить</button>
    </div>`;
}

function openSettings() {
  sheetCtx = { type: 'settings' };
  openSheet(`<h2>Настройки</h2>
    <label class="fld"><span>Отдых между подходами по умолчанию, сек</span>
      <input type="number" inputmode="numeric" min="5" step="5" data-field="setRest" value="${S.settings.rest}"></label>
    <label class="switch"><span>Звук таймера</span><input type="checkbox" data-field="setSound" ${S.settings.sound ? 'checked' : ''}></label>
    <h4>Резервная копия</h4>
    ${cloud.ok
      ? `<p class="muted small">☁️ Данные автоматически сохраняются в облако Telegram и доступны на любом твоём устройстве в этом боте. Видео, загруженные с телефона, в облако не попадают (ссылки на YouTube — попадают).</p>`
      : `<p class="muted small">Все данные хранятся только на этом телефоне. Иногда сохраняй копию в «Файлы» — так ничего не потеряется даже при смене телефона. Видео, загруженные с телефона, в копию не входят (ссылки на YouTube — входят).</p>`}
    <div class="sheet-actions">
      <button class="btn ghost" data-act="export">⬇︎ Сохранить копию</button>
      <label class="btn ghost">⬆︎ Загрузить копию<input type="file" accept="application/json,.json" data-field="import" hidden></label>
    </div>
    ${inTelegram ? '' : `<h4>Установка на iPhone</h4>
    <ol class="muted small" style="padding-left:20px;margin:0">
      <li>Открой ссылку на приложение в Safari</li>
      <li>Нажми «Поделиться» (квадрат со стрелкой вверх)</li>
      <li>Выбери «На экран „Домой“» → «Добавить»</li>
    </ol>`}
    <button class="btn ghost danger block" style="margin-top:24px" data-act="wipe">Сбросить все данные</button>`);
}

async function exportData() {
  const name = `fitness-backup-${todayKey()}.json`;
  const file = new File([JSON.stringify(S)], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  if (inTelegram) {
    // внутри Telegram файлы скачивать нельзя — кладём копию в буфер обмена
    try {
      await navigator.clipboard.writeText(JSON.stringify(S));
      toast('Копия скопирована — вставь её в «Заметки» или отправь себе в «Избранное»', 4000);
    } catch (e) { toast('Не получилось. Данные и так хранятся в облаке Telegram ☁️', 3500); }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ================= actions ================= */
const A = {
  tab(el) { tab = el.dataset.tab; closeSheet(); render(); scrollTo(0, 0); },
  settings: openSettings,
  closeSheet,
  hideHint() { localStorage.setItem('fitapp.hint', '1'); render(); },

  day(el) {
    const n = +el.dataset.n;
    viewDate = n === 0 ? todayKey() : addDays(viewDate, n);
    render(); scrollTo(0, 0);
  },
  toggleSet(el) {
    const log = S.logs[viewDate], L = log && log.ex[el.dataset.item];
    if (!L) return;
    const s = L.sets[+el.dataset.i], w = woById(log.workoutId), it = w && w.items.find(x => x.id === el.dataset.item);
    $$('input', el.closest('.set')).forEach(inp => { s[inp.dataset.k] = inp.value.trim().replace(',', '.'); });
    s.done = !s.done;
    haptic(s.done ? 'medium' : 'light');
    if (s.done) {
      if (!s.reps && it && parseInt(it.reps)) s.reps = String(parseInt(it.reps));
      log.start = log.start || Date.now();
      const allDone = Object.values(log.ex).every(x => x.sets.every(z => z.done));
      if (allDone) { stopTimer(); toast('Все подходы сделаны! Нажми «Завершить» 🎉'); }
      else startTimer(it ? it.rest : S.settings.rest);
    }
    save(); render();
  },
  addSet(el) {
    const L = S.logs[viewDate].ex[el.dataset.item], last = L.sets[L.sets.length - 1];
    L.sets.push({ kg: last ? last.kg : '', reps: last ? last.reps : '', done: false });
    save(); render();
  },
  delSet(el) {
    const L = S.logs[viewDate].ex[el.dataset.item];
    if (L.sets.length > 1) L.sets.pop();
    save(); render();
  },
  rest(el) { startTimer(+el.dataset.sec || S.settings.rest); },
  async finish() {
    const log = S.logs[viewDate];
    if (!log) return;
    if (!isDone(log) && !(await ask('Ни один подход не отмечен. Всё равно завершить?'))) return;
    log.finished = true; log.end = Date.now(); log.start = log.start || log.end;
    stopTimer(); save(); render();
    haptic('success');
    toast('Отличная работа! 💪', 2500);
  },
  unfinish() { const log = S.logs[viewDate]; log.finished = false; save(); render(); },

  month(el) {
    let { y, m } = calMonth; m += +el.dataset.n;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    calMonth = { y, m }; render();
  },
  calDay(el) { openDay(el.dataset.k); },
  async resetDay(el) {
    const k = el.dataset.k, planned = S.week[dow(parseKey(k))] || '';
    if (await setDayWorkout(k, planned)) { drawDay(); render(); }
  },
  goDay(el) { viewDate = el.dataset.k; tab = 'workout'; closeSheet(); render(); scrollTo(0, 0); },

  exM(el) { exM = el.dataset.m; render(); },
  exInfo(el) { openEx(el.dataset.id); },
  editEx(el) { openExEdit(el.dataset.id); },
  exFileDel() { sheetCtx.blob = null; sheetCtx.removeFile = true; drawExEdit(); },
  async exSave() {
    const c = sheetCtx, d = c.d;
    d.name = d.name.trim(); d.muscle = (d.muscle || '').trim(); d.video = (d.video || '').trim();
    if (!d.name) return toast('Введи название');
    try {
      if (c.blob) { await idb.put(d.id, c.blob); d.file = true; }
      else if (c.removeFile) { await idb.del(d.id); d.file = false; }
    } catch (e) { toast('Не удалось сохранить видео — мало места?'); }
    const i = S.exercises.findIndex(e => e.id === d.id);
    if (i >= 0) S.exercises[i] = d; else S.exercises.push(d);
    save(); render(); openEx(d.id);
  },
  async exDelete() {
    const id = sheetCtx.d.id;
    if (!(await ask('Удалить упражнение? Оно уберётся и из всех программ.'))) return;
    S.exercises = S.exercises.filter(e => e.id !== id);
    S.workouts.forEach(w => { w.items = w.items.filter(it => it.exId !== id); });
    try { await idb.del(id); } catch (e) { /* ignore */ }
    save(); closeSheet(); render();
  },

  editProg(el) { openProg(el.dataset.id); },
  pColor(el) { sheetCtx.d.color = el.dataset.c; drawProg(); },
  pMove(el) {
    const items = sheetCtx.d.items, i = +el.dataset.i, j = i + +el.dataset.n;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]]; drawProg();
  },
  pDel(el) { sheetCtx.d.items.splice(+el.dataset.i, 1); drawProg(); },
  pSave() {
    const d = sheetCtx.d;
    d.name = d.name.trim() || 'Тренировка';
    d.items.forEach(it => {
      it.sets = Math.min(20, Math.max(1, parseInt(it.sets) || 1));
      it.rest = Math.max(0, parseInt(it.rest) || 0);
      it.reps = String(it.reps || '').trim() || '10';
    });
    const i = S.workouts.findIndex(w => w.id === d.id);
    if (i >= 0) S.workouts[i] = d; else S.workouts.push(d);
    save(); closeSheet(); render();
    toast('Программа сохранена');
  },
  async pRemove() {
    const id = sheetCtx.d.id;
    if (!(await ask('Удалить программу? История тренировок сохранится.'))) return;
    S.workouts = S.workouts.filter(w => w.id !== id);
    Object.keys(S.week).forEach(k => { if (S.week[k] === id) delete S.week[k]; });
    Object.keys(S.overrides).forEach(k => { if (S.overrides[k] === id) delete S.overrides[k]; });
    save(); closeSheet(); render();
  },

  tToggle() {
    if (!T.running) startTimer(S.settings.rest);
    else if (T.paused) { T.paused = false; T.end = Date.now() + T.left * 1000; drawTimer(); }
    else { T.paused = true; T.left = Math.max(0, (T.end - Date.now()) / 1000); drawTimer(); }
  },
  tAdj(el) {
    const n = +el.dataset.n;
    if (!T.running) return startTimer(Math.max(5, S.settings.rest + n));
    if (T.paused) T.left = Math.max(1, T.left + n); else T.end = Math.max(Date.now() + 1000, T.end + n * 1000);
    T.total = Math.max(1, T.total + n);
    drawTimer();
  },
  tStop: stopTimer,
  tPreset(el) { startTimer(+el.dataset.sec); },
  tCustom() {
    const v = parseInt($('#customSec').value);
    if (!v || v < 1) return toast('Введи время в секундах');
    startTimer(v);
  },

  export: exportData,
  async wipe() {
    if (!(await ask('Удалить ВСЕ данные: программы, упражнения, историю? Это нельзя отменить.'))) return;
    if (!(await ask('Точно? Лучше сначала сохранить копию.'))) return;
    try { await idb.clear(); } catch (e) { /* ignore */ }
    S = defaults(); save(); closeSheet(); viewDate = todayKey(); render();
    toast('Данные сброшены');
  },
};

// поля, которые сохраняются по событию change
const F = {
  setVal(el) {
    const L = S.logs[viewDate] && S.logs[viewDate].ex[el.dataset.item];
    if (!L) return;
    L.sets[+el.dataset.i][el.dataset.k] = el.value.trim().replace(',', '.');
    save();
  },
  async dayWorkout(el) {
    if (!(await setDayWorkout(el.dataset.k, el.value))) { el.value = plannedId(el.dataset.k); return; }
    if (sheetCtx && sheetCtx.type === 'day') drawDay();
    render();
  },
  week(el) {
    if (el.value) S.week[el.dataset.i] = el.value; else delete S.week[el.dataset.i];
    save(); render();
  },
  pAdd(el) {
    if (!el.value) return;
    sheetCtx.d.items.push({ id: uid(), exId: el.value, sets: 3, reps: '10', rest: S.settings.rest });
    drawProg();
    const panel = $('#sheet .panel'); panel.scrollTop = panel.scrollHeight;
  },
  exFile(el) {
    const f = el.files && el.files[0];
    if (!f) return;
    if (f.size > 300 * 1024 * 1024) return toast('Видео слишком большое (больше 300 МБ)');
    sheetCtx.blob = f; sheetCtx.removeFile = false; drawExEdit();
  },
  setRest(el) { S.settings.rest = Math.max(5, parseInt(el.value) || 60); save(); render(); },
  setSound(el) { S.settings.sound = el.checked; save(); if (el.checked) { unlockAudio(); tone(880, 0, 0.2); } },
  import(el) {
    const f = el.files && el.files[0];
    if (!f) return;
    f.text().then(async txt => {
      const data = normalize(JSON.parse(txt));
      if (!data) throw new Error('bad');
      if (!(await ask('Заменить текущие данные данными из копии?'))) return;
      S = data; save(); closeSheet(); render();
      toast('Копия загружена ✅');
    }).catch(() => toast('Это не файл копии фитнес-трекера'));
  },
};

// поля, которые обновляются на каждое нажатие клавиши
const I = {
  exq(el) { exQ = el.value; $('#exlist').innerHTML = exList(); },
  exF(el) { sheetCtx.d[el.dataset.k] = el.value; },
  pName(el) { sheetCtx.d.name = el.value; },
  pItem(el) { sheetCtx.d.items[+el.dataset.i][el.dataset.k] = el.value; },
};

document.addEventListener('click', e => {
  // в Telegram внешние ссылки (YouTube и т.п.) надо открывать через сам Telegram
  const a = e.target.closest('a[target=_blank]');
  if (a && tgAtLeast('6.1')) { e.preventDefault(); tg().openLink(a.href); return; }
  const el = e.target.closest('[data-act]');
  if (!el || !A[el.dataset.act]) return;
  unlockAudio();
  A[el.dataset.act](el, e);
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-field]');
  if (el && F[el.dataset.field]) F[el.dataset.field](el);
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-input]');
  if (el && I[el.dataset.input]) I[el.dataset.input](el);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('.set input')) e.target.blur();
});

/* ================= init ================= */
// переход на новый день, если приложение висело открытым с вечера
let lastToday = todayKey();
setInterval(() => {
  const t = todayKey();
  if (t !== lastToday) { if (viewDate === lastToday) viewDate = t; lastToday = t; if (!sheetCtx && !document.activeElement.matches('input')) render(); }
}, 60000);

if (inTelegram) {
  const s = document.createElement('script');
  s.src = 'https://telegram.org/js/telegram-web-app.js';
  s.onload = () => {
    const t = tg();
    if (!t) return;
    document.body.classList.add('tg');
    t.ready(); t.expand();
    try {
      t.setHeaderColor('#0e1013'); t.setBackgroundColor('#0e1013');
      if (tgAtLeast('7.10')) t.setBottomBarColor('#121419');
      if (tgAtLeast('7.7')) t.disableVerticalSwipes();
      if (tgAtLeast('6.1')) t.BackButton.onClick(closeSheet);
    } catch (e) { /* старый клиент Telegram */ }
    cloud.init();
  };
  document.head.appendChild(s);
  // Telegram закрывают свайпом — успеваем отправить последние изменения в облако
  document.addEventListener('visibilitychange', () => { if (document.hidden) cloud.flush(); });
}

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

render();
