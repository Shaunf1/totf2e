/* ============================================================
   THRILL OF THE FIGHT 2 — Swiss Tournament Prototype
   app.js — Navigation, fake data, Swiss engine, Dev Controls
   ============================================================ */

// ── Fake Player Data ──────────────────────────────────────────
const SELF_ID = 0;
const PLAYERS = [
  { id:0, name:'FARDS_771608',   region:'NA', elo:1200, stance:'Orthodox',  move:'Roomscale', height:'1.77m', reach:'1.80m' },
  { id:1, name:'IRONJAW_42',     region:'NA', elo:1580, stance:'Southpaw',  move:'Roomscale', height:'1.85m', reach:'1.88m' },
  { id:2, name:'DUCKNWEAVE',     region:'NA', elo:1490, stance:'Orthodox',  move:'Teleport',  height:'1.72m', reach:'1.74m' },
  { id:3, name:'SLAPMACHINE',    region:'NA', elo:1440, stance:'Orthodox',  move:'Roomscale', height:'1.80m', reach:'1.82m' },
  { id:4, name:'COMBOKID_99',    region:'NA', elo:1380, stance:'Southpaw',  move:'Roomscale', height:'1.75m', reach:'1.77m' },
  { id:5, name:'GLASSCANON',     region:'NA', elo:1320, stance:'Orthodox',  move:'Roomscale', height:'1.90m', reach:'1.93m' },
  { id:6, name:'BODYSNATCHER',   region:'NA', elo:1260, stance:'Orthodox',  move:'Teleport',  height:'1.78m', reach:'1.81m' },
  { id:7, name:'ROOKIE_TIGER',   region:'NA', elo:1150, stance:'Southpaw',  move:'Roomscale', height:'1.70m', reach:'1.72m' },
];

// sort by ELO descending → seed order
const seeded = [...PLAYERS].sort((a,b) => b.elo - a.elo);
seeded.forEach((p,i) => p.seed = i + 1);

// Map id → seeded player for quick lookup
const pById = {};
PLAYERS.forEach(p => { pById[p.id] = p; });

// ── Fake Events Data ──────────────────────────────────────────
function futureTime(minFromNow) {
  const d = new Date(); d.setMinutes(d.getMinutes() + minFromNow);
  return d;
}

const EVENTS = [
  { id:'e1', title:'Swiss Mini Cup — NA #1', region:'NA', startTime: futureTime(25), capacity:8, registered:8, est:'~25 min', status:'reg_open' },
  { id:'e2', title:'Swiss Mini Cup — NA #2', region:'NA', startTime: futureTime(90), capacity:8, registered:3, est:'~25 min', status:'scheduled' },
  { id:'e3', title:'Swiss Mini Cup — EU #1', region:'EU', startTime: futureTime(55), capacity:8, registered:6, est:'~25 min', status:'reg_open' },
  { id:'e4', title:'Swiss Mini Cup — Asia #1', region:'Asia', startTime: futureTime(120), capacity:8, registered:1, est:'~25 min', status:'scheduled' },
];

// ── Leaderboard Data ──────────────────────────────────────────
const LEADERBOARD = {
  'NA': [
    { name:'IRONJAW_42',     elo:1580, cups:5, pts:420, region:'NA', stance:'Southpaw', move:'Roomscale', height:'1.85m', reach:'1.88m' },
    { name:'WESTCOAST_HOOK', elo:1520, cups:4, pts:390, region:'NA', stance:'Orthodox', move:'Roomscale', height:'1.82m', reach:'1.85m' },
    { name:'DUCKNWEAVE',     elo:1490, cups:4, pts:385, region:'NA', stance:'Orthodox', move:'Teleport',  height:'1.72m', reach:'1.74m' },
    { name:'SLAPMACHINE',    elo:1440, cups:3, pts:310, region:'NA', stance:'Orthodox', move:'Roomscale', height:'1.80m', reach:'1.82m' },
    { name:'SUNSET_BRAWL',   elo:1410, cups:2, pts:250, region:'NA', stance:'Southpaw', move:'Roomscale', height:'1.76m', reach:'1.78m' },
    { name:'COMBOKID_99',    elo:1380, cups:3, pts:275, region:'NA', stance:'Southpaw', move:'Roomscale', height:'1.75m', reach:'1.77m' },
    { name:'GLASSCANON',     elo:1320, cups:2, pts:210, region:'NA', stance:'Orthodox', move:'Roomscale', height:'1.90m', reach:'1.93m' },
    { name:'BODYSNATCHER',   elo:1260, cups:1, pts:160, region:'NA', stance:'Orthodox', move:'Teleport',  height:'1.78m', reach:'1.81m' },
    { name:'FARDS_771608',   elo:1200, cups:0, pts:0,   region:'NA', stance:'Orthodox', move:'Roomscale', height:'1.77m', reach:'1.80m' },
    { name:'ROOKIE_TIGER',   elo:1150, cups:0, pts:50,  region:'NA', stance:'Southpaw', move:'Roomscale', height:'1.70m', reach:'1.72m' },
  ],
  'EU': [
    { name:'EUROBRAWLER',   elo:1600, cups:6, pts:480, region:'EU', stance:'Orthodox', move:'Roomscale', height:'1.88m', reach:'1.91m' },
    { name:'QUEENSBERRY',   elo:1475, cups:3, pts:320, region:'EU', stance:'Orthodox', move:'Teleport',  height:'1.74m', reach:'1.76m' },
    { name:'KNOCKOUT_KARL', elo:1350, cups:2, pts:215, region:'EU', stance:'Southpaw', move:'Roomscale', height:'1.81m', reach:'1.83m' },
  ],
  'Asia': [
    { name:'TOKYO_FURY',   elo:1540, cups:4, pts:400, region:'Asia', stance:'Southpaw', move:'Roomscale', height:'1.73m', reach:'1.75m' },
    { name:'DRAGON_FIST',  elo:1430, cups:2, pts:260, region:'Asia', stance:'Orthodox', move:'Roomscale', height:'1.79m', reach:'1.82m' },
  ],
};

// ── Tournament State Machine ──────────────────────────────────
let tournState = 'reg_open';       // scheduled | reg_open | reg_closed | confirm | round1 | round2 | round3 | completed
let userState  = 'registered';     // not_registered | registered | confirmed | dropped
let currentEvent = EVENTS[0];
let currentRound = 1;

// Per-round match results for self (index 0=r1, 1=r2, 2=r3)
// values: 'pending' | 'win' | 'tko_win' | 'loss' | 'tko_loss'
let selfResults = ['pending','pending','pending'];

// Generated pairings & full results per round
let roundPairings = [null, null, null]; // arrays of {p1, p2, result, tko}
let matchHistory = {};                  // pid_pid → true (track played pairs)

// ── Navigation ────────────────────────────────────────────────
let currentScreen = 'tournaments';

function navTo(screen) {
  // update sidebar active
  document.querySelectorAll('.sidebar .nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.nav === screen || (screen === 'lobby' && n.dataset.nav === 'tournaments') || (screen === 'round' && n.dataset.nav === 'tournaments') || (screen === 'results' && n.dataset.nav === 'tournaments') || (screen === 'leaderboard-full' && n.dataset.nav === 'tournaments'));
  });
  // hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + screen);
  if (el) {
    el.classList.add('active');
    currentScreen = screen;
  }
  // render specific screens
  if (screen === 'tournaments') renderEventsHub();
  if (screen === 'lobby') renderLobby();
  if (screen === 'round') renderRound();
  if (screen === 'results') renderResults();
}

// ── Tab Switching ─────────────────────────────────────────────
function switchTab(group, tab) {
  if (group === 'events') {
    ['upcoming','myevents','leaderboard','howit'].forEach(t => {
      const el = document.getElementById('tab-' + t);
      if (el) el.classList.toggle('hidden', t !== tab);
    });
    document.querySelectorAll('#screen-tournaments .tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    if (tab === 'leaderboard') renderLeaderboard();
    if (tab === 'myevents') renderMyEvents();
  }
}

// ── Render: Events Hub ────────────────────────────────────────
function renderEventsHub() {
  renderEventList();
  renderMyEvents();
}

function renderEventList() {
  const c = document.getElementById('eventList');
  c.innerHTML = EVENTS.map(ev => {
    const st = ev.id === currentEvent.id ? tournState : ev.status;
    const statusLabel = { scheduled:'Scheduled', reg_open:'Open', reg_closed:'Closed', confirm:'Confirming', round1:'Live', round2:'Live', round3:'Live', completed:'Completed' }[st] || st;
    const statusClass = st === 'reg_open' ? 'open' : st === 'scheduled' ? 'scheduled' : ['round1','round2','round3','confirm'].includes(st) ? 'live' : 'completed';
    return `
      <div class="event-card" onclick="openEvent('${ev.id}')">
        <div class="ec-left">
          <div class="ec-title">${ev.title}</div>
          <div class="ec-meta">
            <span>${formatTime(ev.startTime)}</span>
            <span>${ev.region}</span>
            <span>Swiss • 3 fights guaranteed</span>
            <span>Est. ${ev.est}</span>
          </div>
        </div>
        <div class="ec-right">
          <span class="ec-status ${statusClass}">${statusLabel}</span>
          <div class="ec-cap">${ev.registered}/${ev.capacity} registered</div>
        </div>
      </div>`;
  }).join('');
}

function renderMyEvents() {
  const c = document.getElementById('myEventList');
  const notice = document.getElementById('noMyEvents');
  if (userState === 'not_registered') {
    c.innerHTML = '';
    notice.style.display = 'block';
    return;
  }
  notice.style.display = 'none';
  // show just the current event
  const ev = currentEvent;
  const st = tournState;
  const statusLabel = { scheduled:'Scheduled', reg_open:'Registered', reg_closed:'Registered', confirm:'Confirm Now!', round1:'Live — Round 1', round2:'Live — Round 2', round3:'Live — Round 3', completed:'Completed' }[st] || st;
  const statusClass = ['round1','round2','round3','confirm'].includes(st) ? 'live' : st === 'completed' ? 'completed' : 'open';
  c.innerHTML = `
    <div class="event-card" onclick="openEvent('${ev.id}')">
      <div class="ec-left">
        <div class="ec-title">${ev.title}</div>
        <div class="ec-meta">
          <span>${formatTime(ev.startTime)}</span>
          <span>Your status: <strong>${userState.toUpperCase().replace('_',' ')}</strong></span>
        </div>
      </div>
      <div class="ec-right">
        <span class="ec-status ${statusClass}">${statusLabel}</span>
      </div>
    </div>`;
}

function openEvent(eid) {
  currentEvent = EVENTS.find(e => e.id === eid) || EVENTS[0];
  if (tournState === 'completed') { navTo('results'); return; }
  if (['round1','round2','round3'].includes(tournState)) { navTo('round'); return; }
  navTo('lobby');
}

// ── Render: Lobby ─────────────────────────────────────────────
function renderLobby() {
  document.getElementById('lobbyTitle').textContent = currentEvent.title;
  document.getElementById('lobbyMeta').textContent = `Swiss • 3 fights guaranteed • ${currentEvent.capacity} players • ${currentEvent.region}`;
  document.getElementById('lobbyCount').textContent = currentEvent.registered;

  // countdown
  const cpanel = document.getElementById('lobbyCountdownPanel');
  const cdown = document.getElementById('lobbyCountdown');
  if (['scheduled','reg_open','reg_closed','confirm'].includes(tournState)) {
    cpanel.classList.remove('hidden');
    const diff = currentEvent.startTime - new Date();
    const m = Math.max(0, Math.floor(diff / 60000));
    const s = Math.max(0, Math.floor((diff % 60000) / 1000));
    cdown.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  } else {
    cpanel.classList.add('hidden');
  }

  // confirm panel
  const cp = document.getElementById('confirmPanel');
  cp.classList.toggle('hidden', !(tournState === 'confirm' && userState === 'registered'));

  // action buttons
  const acts = document.getElementById('lobbyActions');
  if (tournState === 'reg_open' && userState === 'not_registered') {
    acts.innerHTML = '<span class="btn btn-primary" onclick="registerSelf()">Register</span>';
  } else if (['reg_open','reg_closed'].includes(tournState) && ['registered','confirmed'].includes(userState)) {
    acts.innerHTML = '<span class="btn btn-danger btn-sm" onclick="dropSelf()">Withdraw</span>';
  } else if (['round1','round2','round3'].includes(tournState)) {
    acts.innerHTML = '<span class="btn btn-primary" onclick="navTo(\'round\')">View Rounds</span>';
  } else if (tournState === 'completed') {
    acts.innerHTML = '<span class="btn btn-primary" onclick="navTo(\'results\')">View Results</span>';
  } else {
    acts.innerHTML = '';
  }

  // fighter list
  const tbody = document.getElementById('lobbyFighters');
  tbody.innerHTML = seeded.map(p => {
    const isSelf = p.id === SELF_ID;
    return `<tr class="${isSelf ? 'self' : ''}">
      <td><span class="seed-badge">${p.seed}</span></td>
      <td>${p.name}</td>
      <td>${p.elo}</td>
      <td>${p.region}</td>
      <td>${p.stance}</td>
      <td>${p.move}</td>
      <td>${p.height}</td>
      <td>${p.reach}</td>
    </tr>`;
  }).join('');
}

function registerSelf() { userState = 'registered'; document.getElementById('devUserState').value = 'registered'; renderLobby(); updateDevDisplay(); }
function dropSelf() { userState = 'dropped'; document.getElementById('devUserState').value = 'dropped'; renderLobby(); updateDevDisplay(); }
function confirmAttendance() { userState = 'confirmed'; document.getElementById('devUserState').value = 'confirmed'; renderLobby(); updateDevDisplay(); }

// ── Swiss Pairing Engine ──────────────────────────────────────
function generateAllRounds() {
  matchHistory = {};
  roundPairings = [null, null, null];
  // initialize records
  seeded.forEach(p => { p.wins = 0; p.losses = 0; p.tkos = 0; p.results = []; });

  // Round 1: pure ELO seeding  1v8, 2v7, 3v6, 4v5
  roundPairings[0] = [
    makePair(seeded[0], seeded[7], 0),
    makePair(seeded[1], seeded[6], 0),
    makePair(seeded[2], seeded[5], 0),
    makePair(seeded[3], seeded[4], 0),
  ];

  // apply round 1 results
  applyRoundResults(0);

  // Round 2: pair by record, avoid rematches
  roundPairings[1] = swissPair(1);
  applyRoundResults(1);

  // Round 3
  roundPairings[2] = swissPair(2);
  applyRoundResults(2);
}

function makePair(p1, p2, roundIdx) {
  const key = pairKey(p1.id, p2.id);
  matchHistory[key] = true;
  // Determine result
  const result = determineResult(p1, p2, roundIdx);
  return { p1: p1.id, p2: p2.id, ...result };
}

function pairKey(a, b) { return [Math.min(a,b), Math.max(a,b)].join('_'); }

// Simple seeded pseudo-random for deterministic sim results
function seededRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
}

function determineResult(p1, p2, roundIdx) {
  // If self is involved, use dev-set results
  if (p1.id === SELF_ID || p2.id === SELF_ID) {
    const selfP = p1.id === SELF_ID ? p1 : p2;
    const otherP = p1.id === SELF_ID ? p2 : p1;
    const r = selfResults[roundIdx];
    if (r === 'win')      return { winner: selfP.id, loser: otherP.id, tko: false };
    if (r === 'tko_win')  return { winner: selfP.id, loser: otherP.id, tko: true };
    if (r === 'loss')     return { winner: otherP.id, loser: selfP.id, tko: false };
    if (r === 'tko_loss') return { winner: otherP.id, loser: selfP.id, tko: true };
    // pending → deterministic 50/50 based on IDs
    const seed = (selfP.id + 1) * 1000 + (otherP.id + 1) * 100 + roundIdx * 10 + 7;
    return seededRand(seed) > 0.5
      ? { winner: p1.id, loser: p2.id, tko: false }
      : { winner: p2.id, loser: p1.id, tko: false };
  }
  // Sim for non-self: deterministic, higher ELO slightly favored
  const baseSeed = (p1.id + 1) * 1000 + (p2.id + 1) * 100 + roundIdx * 10 + 3;
  const chance = p1.elo / (p1.elo + p2.elo) + 0.05;
  const tko = seededRand(baseSeed + 1) < 0.25;
  if (seededRand(baseSeed) < chance) return { winner: p1.id, loser: p2.id, tko };
  return { winner: p2.id, loser: p1.id, tko };
}

function applyRoundResults(roundIdx) {
  const pairs = roundPairings[roundIdx];
  if (!pairs) return;
  pairs.forEach(m => {
    const w = pById[m.winner], l = pById[m.loser];
    w.wins++; l.losses++;
    if (m.tko) w.tkos++;
    w.results[roundIdx] = 'W' + (m.tko ? '(TKO)' : '');
    l.results[roundIdx] = 'L' + (m.tko ? '(TKO)' : '');
  });
}

function swissPair(roundIdx) {
  // group by record (wins)
  const groups = {};
  seeded.forEach(p => {
    const k = p.wins; 
    if (!groups[k]) groups[k] = [];
    groups[k].push(p);
  });
  const sortedKeys = Object.keys(groups).map(Number).sort((a,b) => b - a);
  const pool = [];
  sortedKeys.forEach(k => {
    // within group sort by ELO desc (tiebreak)
    groups[k].sort((a,b) => b.elo - a.elo);
    groups[k].forEach(p => pool.push(p));
  });

  const paired = new Set();
  const result = [];

  for (let i = 0; i < pool.length; i++) {
    if (paired.has(pool[i].id)) continue;
    for (let j = i + 1; j < pool.length; j++) {
      if (paired.has(pool[j].id)) continue;
      const key = pairKey(pool[i].id, pool[j].id);
      if (matchHistory[key]) continue; // avoid rematch
      // pair them
      paired.add(pool[i].id);
      paired.add(pool[j].id);
      result.push(makePair(pool[i], pool[j], roundIdx));
      break;
    }
  }
  // fallback: if anyone unpaired, force pair (rematch allowed if no other option)
  const unpaired = pool.filter(p => !paired.has(p.id));
  for (let i = 0; i < unpaired.length - 1; i += 2) {
    result.push(makePair(unpaired[i], unpaired[i+1], roundIdx));
  }

  return result;
}

// ── Render: Round Screen ──────────────────────────────────────
function renderRound() {
  generateAllRounds();

  const rNum = currentRound;
  document.getElementById('roundTitle').textContent = `Round ${rNum} of 3`;

  // round tab buttons
  const tabs = document.getElementById('roundTabs');
  tabs.innerHTML = [1,2,3].map(r => {
    const active = r === rNum ? 'active' : '';
    const roundState = tournState.replace('round','');
    const enabled = r <= parseInt(roundState) || tournState === 'completed';
    return `<button class="tab-btn ${active}" ${enabled ? '' : 'disabled style="opacity:.4;cursor:default;"'} onclick="${enabled ? `setRound(${r})` : ''}">R${r}</button>`;
  }).join('');

  // pairings
  const grid = document.getElementById('pairingsGrid');
  const pairs = roundPairings[rNum - 1];
  if (!pairs) { grid.innerHTML = '<p class="text-muted">Pairings not yet generated.</p>'; return; }

  grid.innerHTML = pairs.map((m, i) => {
    const p1 = pById[m.p1], p2 = pById[m.p2];
    const isMine = m.p1 === SELF_ID || m.p2 === SELF_ID;
    const p1rec = recordStr(p1, rNum - 1);
    const p2rec = recordStr(p2, rNum - 1);
    const resultLine = getResultLine(m);
    return `
      <div class="pairing-card ${isMine ? 'your-match' : ''}">
        <div class="match-label">Match ${i+1} ${isMine ? '— YOUR MATCH' : ''}</div>
        <div class="vs-row">
          <span>[${p1.seed}] ${p1.name}</span>
          <span class="vs">VS</span>
          <span>[${p2.seed}] ${p2.name}</span>
        </div>
        <div class="record">${p1rec} | ${p2rec}</div>
        <div style="font-size:.72rem;margin-top:2px;font-weight:700;color:${resultLine.includes('TKO') ? 'var(--accent-red)' : 'var(--text-mid)'}">${resultLine}</div>
        ${isMine && isCurrentRound(rNum) ? '<div class="match-actions"><span class="btn btn-primary btn-sm" onclick="alert(\'Joining match... (prototype)\')">Join Match</span></div>' : ''}
      </div>`;
  }).join('');
}

function recordStr(p, upToRound) {
  let w = 0, l = 0;
  for (let r = 0; r < upToRound; r++) {
    if (p.results[r] && p.results[r].startsWith('W')) w++;
    if (p.results[r] && p.results[r].startsWith('L')) l++;
  }
  return `${w}–${l}`;
}

function getResultLine(m) {
  const winner = pById[m.winner];
  return `Winner: ${winner.name}${m.tko ? ' (TKO)' : ''}`;
}

function isCurrentRound(rNum) {
  return tournState === 'round' + rNum;
}

function setRound(r) {
  currentRound = r;
  renderRound();
}

// ── Scoring ───────────────────────────────────────────────────
const PLACEMENT_PTS = [100, 75, 55, 40, 25, 25, 25, 25];

function computeStandings() {
  generateAllRounds();
  // sort: wins desc, then tkos desc, then ELO desc
  const ranked = [...seeded].sort((a,b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.tkos !== a.tkos) return b.tkos - a.tkos;
    return b.elo - a.elo;
  });

  return ranked.map((p, i) => {
    const base = PLACEMENT_PTS[i];
    const undefeated = p.wins === 3 ? 10 : 0;
    const tkoBonus = p.tkos * 10;
    const total = base + undefeated + tkoBonus;
    return { ...p, place: i + 1, base, undefeated, tkoBonus, total };
  });
}

// ── Render: Results Screen ────────────────────────────────────
function renderResults() {
  const standings = computeStandings();
  const tbody = document.getElementById('standingsBody');

  tbody.innerHTML = standings.map(p => {
    const placeClass = p.place <= 3 ? `place-${p.place}` : 'place-other';
    const isSelf = p.id === SELF_ID;
    return `<tr class="${isSelf ? 'highlight' : ''}" style="cursor:pointer" onclick="showBreakdown(${p.id})">
      <td><span class="place-badge ${placeClass}">${p.place}</span></td>
      <td>${p.name}</td>
      <td>${p.wins}–${p.losses}</td>
      <td>${p.tkos}</td>
      <td>${p.base}</td>
      <td>+${p.undefeated + p.tkoBonus}</td>
      <td><strong>${p.total}</strong></td>
    </tr>`;
  }).join('');

  // auto-show self breakdown
  const selfStanding = standings.find(p => p.id === SELF_ID);
  if (selfStanding) showBreakdownData(selfStanding);
}

function showBreakdown(pid) {
  const standings = computeStandings();
  const p = standings.find(s => s.id === pid);
  if (p) showBreakdownData(p);
}

function showBreakdownData(p) {
  document.getElementById('breakdownName').textContent = p.name;
  document.getElementById('breakdownGrid').innerHTML = `
    <div class="pb-item"><div class="pb-val">${p.place}</div><div class="pb-label">Place</div></div>
    <div class="pb-item"><div class="pb-val">${p.base}</div><div class="pb-label">Base Pts</div></div>
    <div class="pb-item"><div class="pb-val">${p.wins === 3 ? '+10' : '0'}</div><div class="pb-label">Undefeated</div></div>
    <div class="pb-item"><div class="pb-val">+${p.tkoBonus}</div><div class="pb-label">TKO Bonus (${p.tkos}×10)</div></div>
    <div class="pb-item"><div class="pb-val" style="font-size:1.4rem;">${p.total}</div><div class="pb-label">Total</div></div>
  `;
}

// ── Render: Leaderboard ───────────────────────────────────────
function renderLeaderboard() {
  const region = document.getElementById('regionSelect').value;
  const data = (LEADERBOARD[region] || []).sort((a,b) => b.pts - a.pts);
  const el = document.getElementById('leaderboardList');
  el.innerHTML = data.map((p, i) => `
    <div class="lb-row" onclick="openDrawer(${JSON.stringify(p).replace(/"/g, '&quot;')})">
      <div class="lb-rank">${i + 1}</div>
      <div class="lb-name">${p.name}</div>
      <div class="lb-pts">${p.pts} pts</div>
    </div>
  `).join('');
}

// ── Player Drawer ─────────────────────────────────────────────
function openDrawer(p) {
  document.getElementById('drawerName').textContent = p.name;
  document.getElementById('drawerDetails').innerHTML = `
    <div class="drawer-row"><span class="dr-label">Region</span><span class="dr-val">${p.region}</span></div>
    <div class="drawer-row"><span class="dr-label">Ranked ELO</span><span class="dr-val">${p.elo}</span></div>
    <div class="drawer-row"><span class="dr-label">Stance</span><span class="dr-val">${p.stance}</span></div>
    <div class="drawer-row"><span class="dr-label">Movement</span><span class="dr-val">${p.move}</span></div>
    <div class="drawer-row"><span class="dr-label">Height</span><span class="dr-val">${p.height}</span></div>
    <div class="drawer-row"><span class="dr-label">Reach</span><span class="dr-val">${p.reach}</span></div>
    <div class="drawer-row"><span class="dr-label">Cups Played</span><span class="dr-val">${p.cups}</span></div>
    <div class="drawer-row"><span class="dr-label">Leaderboard Pts</span><span class="dr-val">${p.pts}</span></div>
  `;
  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawerOverlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
}

// ── Utilities ─────────────────────────────────────────────────
function formatTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Dev Controls ──────────────────────────────────────────────
function toggleDev() {
  document.getElementById('devPanel').classList.toggle('collapsed');
}

function devSetTournState(val) {
  tournState = val;
  // map to round
  if (val === 'round1') currentRound = 1;
  if (val === 'round2') currentRound = 2;
  if (val === 'round3') currentRound = 3;
  updateDevDisplay();
}

function devSetUserState(val) {
  userState = val;
  updateDevDisplay();
}

function devApplyAndRefresh() {
  // read round results
  selfResults[0] = document.getElementById('devR1').value;
  selfResults[1] = document.getElementById('devR2').value;
  selfResults[2] = document.getElementById('devR3').value;

  tournState = document.getElementById('devTournState').value;
  userState  = document.getElementById('devUserState').value;

  if (tournState === 'round1') currentRound = 1;
  if (tournState === 'round2') currentRound = 2;
  if (tournState === 'round3') currentRound = 3;

  // Re-navigate to current screen
  if (currentScreen === 'tournaments') renderEventsHub();
  else if (currentScreen === 'lobby') renderLobby();
  else if (currentScreen === 'round') renderRound();
  else if (currentScreen === 'results') renderResults();
  else navTo(currentScreen);

  updateDevDisplay();
}

function updateDevDisplay() {
  document.getElementById('devStateDisplay').textContent = `${tournState} / ${userState}`;
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  navTo('tournaments');
  updateDevDisplay();
  // start dev panel expanded
  // toggleDev(); // uncomment to start collapsed
});
