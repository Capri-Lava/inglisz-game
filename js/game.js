// Inglisz Game — główna pętla, pytania, choreografia walki.
(() => {
  const W = 180, H = 260, GY = 236;
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), cv = $('#cv'), ctx = cv.getContext('2d');
  const layer = document.createElement('canvas'); layer.width = W; layer.height = H;
  const lctx = layer.getContext('2d');
  const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
  cv.width = W; cv.height = H;
  ctx.imageSmoothingEnabled = false;

  // ---------- tło: Londyn o zmierzchu + Camelot ----------
  function drawBG() {
    const g = bg.getContext('2d');
    const bands = ['#1d2b53', '#2e2f63', '#53306b', '#7e2553', '#b8405a', '#e8664a', '#ff9a52', '#ffc46b'];
    const top = 0, bot = 190, bh = (bot - top) / bands.length;
    bands.forEach((c, i) => {
      g.fillStyle = c; g.fillRect(0, top + i * bh, W, bh + 1);
      if (i < bands.length - 1) { // dithering między pasami
        g.fillStyle = bands[i + 1];
        const y0 = Math.round(top + (i + 1) * bh) - 3;
        for (let y = y0; y < y0 + 3; y++) for (let x = (y % 2); x < W; x += (y - y0 === 2 ? 1.5 : 2) * 1 + (y - y0 === 0 ? 2 : 0)) g.fillRect(Math.floor(x), y, 1, 1);
      }
    });
    // gwiazdy
    g.fillStyle = '#fff1c7';
    [[12, 8], [40, 20], [70, 6], [101, 15], [133, 9], [160, 22], [22, 34], [150, 40], [88, 30]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
    // słońce
    g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(98, 182, 16, Math.PI, 0); g.fill();
    g.fillStyle = '#fff4c2'; g.beginPath(); g.arc(98, 182, 11, Math.PI, 0); g.fill();
    // chmury
    g.fillStyle = '#d9607a';
    [[18, 70, 22], [120, 56, 28], [70, 96, 18]].forEach(([x, y, w]) => { g.fillRect(x, y, w, 3); g.fillRect(x + 4, y - 2, w - 9, 2); });
    // panorama: Parlament i Big Ben (lewo), Camelot (prawo)
    const sil = '#3a2245';
    g.fillStyle = sil;
    g.fillRect(0, 160, 80, 30);
    for (let x = 0; x < 80; x += 6) { g.fillRect(x, 156, 2, 4); g.fillRect(x + 1, 153, 1, 3); }
    g.fillRect(24, 96, 12, 94);                 // wieża
    g.fillRect(22, 110, 16, 18);
    g.beginPath(); g.moveTo(22, 96); g.lineTo(30, 70); g.lineTo(38, 96); g.fill();
    g.fillRect(29, 64, 2, 7);
    g.fillStyle = '#f6e7b0'; g.beginPath(); g.arc(30, 119, 6, 0, 7); g.fill(); // tarcza zegara
    g.fillStyle = sil; g.fillRect(29, 114, 1, 6); g.fillRect(29, 119, 4, 1);
    g.fillStyle = '#f6d36b'; for (let y = 134; y < 186; y += 8) { g.fillRect(26, y, 2, 3); g.fillRect(32, y, 2, 3); }
    for (let x = 44; x < 80; x += 7) { g.fillRect(x, 166, 2, 3); }
    // Camelot
    g.fillStyle = sil;
    g.fillRect(120, 150, 60, 40);
    g.fillRect(126, 126, 12, 64); g.fillRect(160, 120, 14, 70); g.fillRect(142, 138, 14, 52);
    [[126, 12], [160, 14], [142, 14]].forEach(([x, w]) => { for (let i = 0; i < w; i += 4) g.fillRect(x + i, (x === 160 ? 116 : x === 126 ? 122 : 134), 2, 4); });
    g.beginPath(); g.moveTo(158, 120); g.lineTo(167, 100); g.lineTo(176, 120); g.fill();
    g.fillRect(166, 92, 1, 9);
    g.fillStyle = '#c8102e'; g.fillRect(167, 92, 6, 3);
    g.fillStyle = '#f6d36b'; [[131, 140], [165, 132], [148, 150], [131, 160], [166, 155]].forEach(([x, y]) => g.fillRect(x, y, 2, 3));
    // żywopłot
    g.fillStyle = '#1f4a2a'; g.fillRect(0, 188, W, 10);
    g.fillStyle = '#27603a'; for (let x = 0; x < W; x += 5) g.fillRect(x, 186 + (x * 7 % 3), 4, 4);
    // trawa
    g.fillStyle = '#3f8f3a'; g.fillRect(0, 198, W, 22);
    g.fillStyle = '#4fa646'; for (let x = 0; x < W; x += 3) g.fillRect(x, 198 + (x * 13 % 7), 1, 2);
    // brukowana ścieżka
    g.fillStyle = '#6d6a73'; g.fillRect(0, 218, W, H - 218);
    for (let y = 218, r = 0; y < H; y += 6, r++) for (let x = (r % 2) * 5 - 5; x < W; x += 10) {
      g.fillStyle = (x + y) % 3 ? '#85828b' : '#7a7780'; g.fillRect(x + 1, y + 1, 8, 4);
      g.fillStyle = '#9d9aa3'; g.fillRect(x + 1, y + 1, 8, 1);
    }
    g.fillStyle = '#4a4750'; g.fillRect(0, 218, W, 1);
  }
  drawBG();

  // ---------- stan ----------
  let P = null, C = null; // gracz, komputer
  let mode = 'select', tempo = 1;
  try { tempo = +localStorage.getItem('inglisz-tempo') || 1; } catch (e) {}
  const projectiles = [], particles = [];
  let shake = 0;
  let selA = new Fighter('arthur', 52, 1), selN = new Fighter('nigel', 128, -1);

  // ---------- pętla ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(50, now - last); last = now;
    const fs = mode === 'select' ? [selA, selN] : [P, C];
    fs.forEach(f => f.update(dt, now));
    // pociski
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]; p.t += dt;
      if (p.t >= p.dur) { projectiles.splice(i, 1); p.onArrive && p.onArrive(); }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i]; q.life -= dt;
      q.vy += 0.012 * dt; q.x += q.vx * dt / 16; q.y += q.vy * dt / 16;
      if (q.y > GY + 2 && q.bounce) { q.y = GY + 2; q.vy *= -0.3; q.vx *= 0.6; }
      if (q.life <= 0) particles.splice(i, 1);
    }
    if (shake > 0) shake -= dt;
    render(fs, now);
    requestAnimationFrame(loop);
  }

  function render(fs, now) {
    ctx.drawImage(bg, 0, 0);
    lctx.clearRect(0, 0, W, H);
    fs.forEach(f => Draw.fighter(lctx, f, GY));
    projectiles.forEach(p => drawProjectile(lctx, p));
    // twarde piksele: progowanie alfy
    const img = lctx.getImageData(0, 0, W, H), d = img.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0;
    lctx.putImageData(img, 0, 0);
    const sx = shake > 0 ? Math.round((Math.random() - .5) * 4) : 0, sy = shake > 0 ? Math.round((Math.random() - .5) * 3) : 0;
    ctx.drawImage(layer, sx, sy);
    particles.forEach(q => { ctx.fillStyle = q.c; ctx.fillRect(Math.round(q.x + sx), Math.round(q.y + sy), q.s, q.s); });
    fs.forEach(f => Draw.stars(ctx, f, GY, now));
  }

  function drawProjectile(g, p) {
    const r = Math.min(1, p.t / p.dur);
    const x = lerp(p.x0, p.x1, r), y = lerp(p.y0, p.y1, r) - Math.sin(r * Math.PI) * p.arc;
    const dir = p.x1 > p.x0 ? 1 : -1;
    g.save(); g.translate(x, y); g.scale(dir, 1);
    if (p.type === 'arrow') {
      Draw.cap(g, [-10, 0], [6, 0], 1.2, '#c9a26a');
      Draw.poly(g, [[6, -2], [10, 0], [6, 2]], '#cfd6de');
      Draw.poly(g, [[-10, 0], [-13, -2.5], [-8, 0], [-13, 2.5]], '#e33');
    } else if (p.type === 'paint') {
      g.rotate(r * 9);
      Draw.circ(g, [0, 0], 4.5, '#2a6fdb'); Draw.rect(g, -1.5, -6, 3, 3, '#e8d9a8');
      Draw.rect(g, 3, 2, 2, 2, '#4f93ff');
    } else if (p.type === 'boot') {
      g.rotate(r * 14 * (p.spin || 1));
      Draw.rect(g, -3, -6, 6, 7, '#d4a017'); Draw.rect(g, -3, -1, 9, 3.2, '#d4a017'); Draw.rect(g, -3, 1.6, 9, 0.8, '#5a4a10');
    }
    g.restore();
  }
  function shoot(type, from, to, dur, arc, spin) {
    return new Promise(res => projectiles.push({ type, x0: from[0], y0: from[1], x1: to[0], y1: to[1], t: 0, dur, arc, spin, onArrive: res }));
  }
  function burst(x, y, colors, n, spread = 2.4, bounce = true, size = 1) {
    for (let i = 0; i < n; i++) particles.push({ x, y, vx: (Math.random() - .5) * spread * 2, vy: -Math.random() * spread - .5, c: colors[i % colors.length], life: 500 + Math.random() * 500, s: size + (Math.random() < .3 ? 1 : 0), bounce });
  }

  // ---------- efekty komiksowe (HTML) ----------
  const fxLayer = $('#fx');
  function boom(text, x, y, cls = '') {
    const el = document.createElement('div');
    el.className = 'boom ' + cls; el.textContent = text;
    el.style.left = (x / W * 100) + '%'; el.style.top = (y / H * 100) + '%';
    el.style.setProperty('--r', ((Math.random() - .5) * 24) + 'deg');
    fxLayer.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  // ---------- reakcje ----------
  function react(B, kind, dmg, weapon) {
    const [hx, hy] = B.world('T', GY);
    if (kind === 'miss') {
      boom(Math.random() < .5 ? 'MISS!' : 'WHOOSH!', hx, hy - 30, 'miss');
      return;
    }
    B.hp = Math.max(0, B.hp - dmg); updateHUD();
    B.flash = 260; shake = 220;
    const words = { sword: ['CLANG!', 'SHING!'], lance: ['THUD!', 'POKE!'], bow: ['THWIP!', 'ZING!'], paint: ['SPLAT!', 'SPLOSH!'], broom: ['THWACK!', 'WHACK!'], kick: ['BONK!', 'BOINK!'] }[weapon];
    boom(B.hp <= 0 ? 'K.O.!' : words[Math.random() * 2 | 0], hx + (B.f > 0 ? 8 : -8), hy - 26, B.hp <= 0 ? 'ko' : '');
    Sound.play({ sword: 'clang', lance: 'thwack', bow: 'thwack', paint: 'splat', broom: 'thwack', kick: 'bonk' }[weapon]);
    if (weapon === 'paint') {
      burst(hx, hy - 6, ['#2a6fdb', '#4f93ff', '#1b4fa8'], 22, 2.6);
      B.stains.push({ part: Math.random() < .5 ? 'head' : 'torso', x: (Math.random() - .3) * 6, y: Math.random() < .5 ? -4 : -10, r: 2.5 + Math.random() * 2, c: ['#2a6fdb', '#3f8bff'][Math.random() * 2 | 0], drips: [[-1, 4 + Math.random() * 4], [1.5, 2 + Math.random() * 3]] });
      if (B.stains.length > 7) B.stains.shift();
    } else burst(hx, hy - 6, ['#ffe14a', '#ffffff', '#ff9a3a'], 12, 2, false);
    if (B.hp <= 0) return knockout(B);
    B.stars = dmg > 14 ? 1100 : 500;
    return B.play([
      { d: 90, p: { x: -10, torso: -28, head: -25, aF: 150, eF: 20, aB: 170, eB: 10, tF: 30, kF: 10, tB: -10, kB: 5, lift: 2 }, e: 'out' },
      { d: 260, p: { x: -6, torso: -10, head: -6, lift: 0 }, e: 'io' },
    ]).then(() => B.toIdle(300));
  }
  function dodge(B) {
    Sound.play('swish');
    return B.play([
      { d: 120, p: { x: -14, torso: -32, head: -14, tF: 35, kF: 70, tB: -30, kB: 55, aF: 60, eF: 90, aB: 40, eB: 90 }, e: 'out' },
      { d: 380, p: {} },
    ]).then(() => B.toIdle(260));
  }
  function knockout(B) {
    B.stars = 999999;
    Sound.play('slideDown');
    return B.play([
      { d: 140, p: { x: -16, torso: -35, head: -30, aF: 170, eF: 10, aB: 190, eB: 10, lift: 8, rot: -25, tF: 40, kF: 20, tB: -20, kB: 10 }, e: 'out' },
      { d: 480, p: { x: -24, rot: -90, torso: -8, head: -18, aF: 165, eF: 15, aB: 205, eB: 5, tF: 22, kF: 8, tB: -6, kB: 14, lift: 0 }, e: 'in',
        end: () => { Sound.play('thud'); shake = 350; const [x] = B.world('H', GY); burst(x, GY, ['#b9b4a8', '#d8d2c4'], 16, 1.6); } },
      { d: 130, p: { lift: 5, rot: -86 }, e: 'out' },
      { d: 170, p: { lift: 0, rot: -90 }, e: 'in', end: () => { Sound.play('thud'); B.down = true; } },
      { d: 300, p: { aF: 140, head: -10 } },
      { d: 260, p: { aF: 175, tF: 40 } }, // ostatnie drgnięcie nogą
      { d: 300, p: { tF: 22 } },
    ]);
  }
  function celebrate(A) {
    const up = A.key === 'arthur'
      ? { lift: 10, aF: 175, eF: 0, w: 180, aB: 150, eB: 20, torso: -4 }
      : { lift: 9, aF: 160, eF: 30, aB: 200, eB: 40, tF: 70, kF: 80, torso: -6, head: 10 };
    const keys = [];
    for (let i = 0; i < 4; i++) keys.push({ d: 200, p: up, e: 'out' }, { d: 190, p: { lift: 0, tF: 16, kF: 22 }, e: 'in' });
    return A.play(keys).then(() => A.play([{ d: 300, p: { ...up, lift: 0, tF: 16, kF: 20 } }], true));
  }

  // ---------- ataki ----------
  // A atakuje B. hit=true trafia, false — B robi unik.
  function attack(A, B, weapon, hit, dmg) {
    const D = Math.abs(B.bx - A.bx);
    const stride = (x, a) => ({ x, tF: a ? 35 : -25, kF: a ? 15 : 35, tB: a ? -30 : 30, kB: a ? 30 : 10, lift: a ? 3 : 1 });
    let resolve; const done = new Promise(r => resolve = r);
    let reaction = Promise.resolve();
    const impact = () => { reaction = hit ? react(B, 'hit', dmg, weapon) : react(B, 'miss'); };
    const pre = () => { if (!hit) dodge(B); };
    const back = () => A.toIdle(380);
    let keys;
    switch (weapon) {
      case 'sword':
        keys = [
          { d: 170, p: stride(D * 0.35, 1), e: 'in', ev: () => Sound.play('whoosh') },
          { d: 160, p: stride(D - 31, 0), e: 'lin' },
          { d: 170, p: { x: D - 29, aF: 200, eF: 20, w: 205, torso: -12, aB: -40, eB: 40, tF: 30, kF: 20, tB: -20, kB: 15, lift: 0 }, e: 'out', ev: pre },
          { d: 110, p: { aF: 80, eF: 5, w: 92, torso: 22, head: 6 }, e: 'in', ev: () => Sound.play('shing'), end: impact },
          { d: 280, p: {} },
        ]; break;
      case 'bow':
        keys = [
          { d: 220, set: { weapon: 'bow' }, p: { aF: 85, eF: 0, w: 90, aB: 70, eB: 30, torso: -4, tF: 30, kF: 10, tB: -25, kB: 10 } },
          { d: 320, p: { aB: -40, eB: 140, nock: 1, torso: -8 }, ev: () => Sound.play('twang') },
          { d: 50, p: { nock: 0 }, ev: () => {
              Sound.play('fwip'); pre();
              const from = A.world('HF', GY), to = B.world('T', GY);
              const tgt = hit ? [to[0], to[1] + 4] : [to[0] + A.f * 60, to[1] - 14];
              shoot('arrow', from, tgt, hit ? 230 : 380, 2).then(() => { if (hit) impact(); else impact(); });
            } },
          { d: 420, p: { aB: 20, eB: 40 } },
        ]; break;
      case 'lance':
        keys = [
          { d: 230, set: { weapon: 'lance' }, p: { x: -6, torso: -6, aF: 60, eF: 15, w: 86, tF: 10, kF: 40, tB: -20, kB: 40 }, ev: pre },
          { d: 260, p: { x: D - 50, torso: 22, aF: 66, eF: 10, w: 88, tF: 45, kF: 10, tB: -40, kB: 5, lift: 5 }, e: 'out', ev: () => Sound.play('whoosh'), end: impact },
          { d: 300, p: { lift: 0 } },
        ]; break;
      case 'paint':
        keys = [
          { d: 280, set: { weapon: 'paint' }, p: { aF: -70, eF: 20, w: -60, torso: -12, tF: 30, kF: 20, tB: -25, kB: 20, aB: 40, eB: 40 }, ev: pre },
          { d: 150, p: { aF: 150, eF: 10, w: 160, torso: 18 }, e: 'out', end: () => {
              Sound.play('whoosh');
              const from = A.world('HF', GY), to = B.world('HC', GY);
              A.weapon = 'none';
              const tgt = hit ? to : [to[0] + A.f * 70, to[1] - 20];
              shoot('paint', from, tgt, hit ? 420 : 560, 30).then(impact);
            } },
          { d: 500, p: { aF: 40, eF: 60 } },
        ]; break;
      case 'broom':
        keys = [
          { d: 170, set: { weapon: 'broom' }, p: stride(D * 0.35, 1), e: 'in' },
          { d: 160, p: stride(D - 36, 0), e: 'lin' },
          { d: 190, p: { x: D - 35, aF: 195, eF: 15, w: 205, aB: 170, eB: 20, torso: -14, tF: 25, kF: 15, tB: -20, kB: 15, lift: 0 }, e: 'out', ev: pre },
          { d: 110, p: { aF: 80, eF: 0, w: 98, aB: 75, torso: 26 }, e: 'in', ev: () => Sound.play('whoosh'), end: impact },
          { d: 300, p: { w: 110 } },
        ]; break;
      case 'kick':
        keys = [
          { d: 170, p: stride(D * 0.2, 1), e: 'in' },
          { d: 160, p: stride(D * 0.3, 0), e: 'lin' },
          { d: 200, p: { tF: -25, kF: 70, torso: 12, aF: 70, eF: 40, aB: -50, eB: 30, tB: -5, kB: 10 }, ev: pre },
          { d: 110, p: { tF: 100, kF: 0, torso: -28, aF: -40, eF: 30, aB: 120, eB: 20, tB: -8, kB: 0 }, e: 'out', end: () => {
              Sound.play('slide');
              const from = A.world('FF', GY), to = B.world('HC', GY);
              A.bootOn = false;
              const tgt = hit ? to : [to[0] + A.f * 70, to[1] - 24];
              shoot('boot', from, tgt, hit ? 260 : 420, 6, 1).then(() => {
                impact();
                const home = [A.bx + A.f * 8, GY - 30];
                const startP = hit ? to : tgt;
                Sound.play('boing');
                shoot('boot', startP, home, 620, 40, -1).then(() => { A.bootOn = true; Sound.play('pop'); });
              });
            } },
          { d: 240, p: { tF: 25, kF: 40, torso: 6, aF: 120, aB: 140, lift: 6 }, e: 'out' },
          { d: 140, p: { lift: 0 }, e: 'in' },
          { d: 140, p: { lift: 5, aF: 60, aB: 170 }, e: 'out' },
          { d: 140, p: { lift: 0 }, e: 'in' },
        ]; break;
    }
    A.play(keys).then(() => back()).then(() => reaction).then(() => wait(120)).then(resolve);
    return done;
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const pick = a => a[Math.random() * a.length | 0];
  const rnd = (a, b) => a + Math.round(Math.random() * (b - a));

  // ---------- pytania ----------
  const toks = s => s.split(/[,;]/).map(x => x.trim().toLowerCase()).filter(Boolean);
  const overlap = (a, b) => { const A = toks(a.pl); return toks(b.pl).some(t => A.includes(t)); };
  function lev(a, b) {
    const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  const byEn = {}; WORDS.forEach(w => byEn[w.en] = w);
  const conf = {};
  CONFUSABLE.forEach(g => g.forEach(a => { conf[a] = (conf[a] || []).concat(g.filter(b => b !== a && byEn[b])); }));
  let recent = [], qn = 0, missed = [], right = 0, asked = 0;

  function nextWord() {
    const pool = [];
    WORDS.forEach(w => { if (!recent.includes(w.en)) for (let i = 0; i < (w.star ? 4 : 1); i++) pool.push(w); });
    const w = pick(pool);
    recent.push(w.en); if (recent.length > 25) recent.shift();
    return w;
  }
  function distractors(w) {
    const ok = d => d.en !== w.en && !overlap(w, d);
    const tricky = [];
    (conf[w.en] || []).forEach(e => ok(byEn[e]) && tricky.push(byEn[e]));
    WORDS.forEach(d => {
      if (!ok(d) || tricky.includes(d)) return;
      const L = lev(d.en.toLowerCase(), w.en.toLowerCase());
      if (L <= Math.max(2, w.en.length / 3) || (d.en.slice(0, 3) === w.en.slice(0, 3) && d.en.length > 3)) tricky.push(d);
    });
    const sameCat = WORDS.filter(d => ok(d) && d.cat === w.cat && !tricky.includes(d));
    const other = WORDS.filter(d => ok(d) && d.cat !== w.cat);
    const res = [];
    const add = list => { const c = list.filter(d => !res.includes(d) && !res.some(r => overlap(r, d))); if (c.length) res.push(pick(c)); };
    // 1 mylący + 1 łatwy, czasem 2 mylące (rośnie z czasem)
    add(tricky.length ? tricky : sameCat);
    if (Math.random() < Math.min(0.6, 0.15 + qn * 0.04)) add(sameCat.length ? sameCat : other); else add(other);
    while (res.length < 2) add(WORDS.filter(ok));
    return res;
  }

  // ---------- UI ----------
  const sayEl = $('#say'), ansEl = $('#answers'), hudP = $('#hpP'), hudC = $('#hpC');
  function updateHUD() {
    if (!P) return;
    hudP.style.width = P.hp + '%'; hudC.style.width = C.hp + '%';
    hudP.classList.toggle('low', P.hp <= 30); hudC.classList.toggle('low', C.hp <= 30);
  }
  const clockHand = $('#hand'), clockArc = $('#arc');
  let timerRAF = null;
  function runClock(ms) {
    return new Promise(res => {
      const t0 = performance.now(); let lastTick = -1;
      const step = now => {
        const r = Math.min(1, (now - t0) / ms);
        clockHand.setAttribute('transform', `rotate(${r * 360} 20 20)`);
        clockArc.style.strokeDashoffset = (r * 100).toFixed(2);
        const tk = Math.floor(r * 4); if (tk !== lastTick) { lastTick = tk; if (tk > 0 && tk < 4) Sound.play('tick'); }
        if (r >= 1) { timerRAF = null; return res('timeout'); }
        timerRAF = requestAnimationFrame(step);
      };
      timerRAF = requestAnimationFrame(step);
      runClock.cancel = () => { cancelAnimationFrame(timerRAF); timerRAF = null; };
    });
  }
  function resetClock() { clockHand.setAttribute('transform', 'rotate(0 20 20)'); clockArc.style.strokeDashoffset = 0; }

  function ask(word, dir) {
    return new Promise(resolve => {
      const q = dir === 0 ? word.pl : word.en;
      const correct = dir === 0 ? word.en : word.pl;
      const opts = [word, ...distractors(word)].sort(() => Math.random() - .5);
      sayEl.innerHTML = `<span class="lang">${dir === 0 ? 'PL' : 'EN'}</span>${q}`;
      sayEl.className = 'say show';
      C.talk = 650; Sound.play('pop');
      ansEl.innerHTML = '';
      let done = false;
      const finish = (chosen, btn) => {
        if (done) return; done = true;
        runClock.cancel && runClock.cancel();
        const good = chosen === word;
        [...ansEl.children].forEach(b => { b.disabled = true; if (b.dataset.en === word.en) b.classList.add('right'); });
        if (btn && !good) btn.classList.add('wrong');
        if (!btn) ansEl.classList.add('late');
        Sound.play(good ? 'good' : 'bad');
        setTimeout(() => { sayEl.className = 'say'; ansEl.innerHTML = ''; ansEl.classList.remove('late'); resolve(good); }, good ? 450 : 1100);
      };
      setTimeout(() => {
        opts.forEach((o, i) => {
          const b = document.createElement('button');
          b.className = 'ans'; b.dataset.en = o.en;
          b.textContent = dir === 0 ? o.en : o.pl;
          b.style.animationDelay = (i * 50) + 'ms';
          b.addEventListener('pointerdown', e => { e.preventDefault(); finish(o, b); });
          ansEl.appendChild(b);
        });
        const ms = Math.max(tempo * 1000 * Math.pow(0.95, qn), tempo * 500);
        runClock(ms).then(() => finish(null, null));
      }, 650);
    });
  }

  // ---------- przebieg walki ----------
  async function fight() {
    mode = 'fight'; qn = 0; missed = []; right = 0; asked = 0; recent = [];
    updateHUD(); resetClock();
    $('#hud').classList.add('on');
    Sound.play('bell');
    boom('FIGHT!', 90, 110, 'big');
    await wait(1100);
    while (P.hp > 0 && C.hp > 0) {
      const attackTurn = qn % 2 === 0;
      const dir = (qn + Math.floor(qn / 4)) % 2; // 0: PL→EN, 1: EN→PL
      $('#turn').textContent = attackTurn ? 'Atak' : 'Obrona';
      $('#turn').className = attackTurn ? 'atk' : 'def';
      const w = nextWord();
      const good = await ask(w, dir);
      asked++; if (good) right++; else if (!missed.includes(w)) missed.push(w);
      const big = rnd(15, 20), small = rnd(10, 14);
      if (attackTurn && good) await attack(P, C, pick(P.h.weapons), true, big);
      else if (attackTurn) { await attack(P, C, pick(P.h.weapons), false, 0); if (C.hp > 0) await attack(C, P, pick(C.h.weapons), true, small); }
      else if (good) { await attack(C, P, pick(C.h.weapons), false, 0); await attack(P, C, pick(P.h.weapons), true, small); }
      else await attack(C, P, pick(C.h.weapons), true, big);
      qn++;
      await wait(150);
    }
    const win = C.hp <= 0;
    const W_ = win ? P : C;
    await wait(900);
    Sound.play(win ? 'fanfare' : 'sad');
    celebrate(W_);
    await wait(900);
    showEnd(win);
  }

  function showEnd(win) {
    $('#hud').classList.remove('on');
    $('#endTitle').textContent = win ? 'Victory!' : 'Defeat';
    $('#endScore').textContent = `${right} / ${asked}`;
    const list = $('#missed');
    list.innerHTML = missed.slice(0, 6).map(w => `<li><b>${w.en}</b> <span>${w.pl}</span></li>`).join('');
    $('#missedBox').style.display = missed.length ? '' : 'none';
    $('#end').classList.add('show');
  }

  // ---------- ekran wyboru ----------
  function toSelect() {
    mode = 'select';
    projectiles.length = 0; particles.length = 0;
    selA = new Fighter('arthur', 52, 1); selN = new Fighter('nigel', 128, -1);
    $('#end').classList.remove('show'); $('#select').classList.add('show');
    $('#hud').classList.remove('on');
  }
  function choose(key) {
    Sound.init(); Sound.startMusic(); Sound.play('good');
    const other = key === 'arthur' ? 'nigel' : 'arthur';
    P = new Fighter(key, 52, 1); C = new Fighter(other, 128, -1);
    $('#nameP').textContent = P.h.name; $('#nameC').textContent = C.h.name;
    $('#select').classList.remove('show');
    fight();
  }
  document.querySelectorAll('[data-hero]').forEach(b => b.addEventListener('click', () => choose(b.dataset.hero)));
  document.querySelectorAll('[data-tempo]').forEach(b => {
    b.classList.toggle('on', +b.dataset.tempo === tempo);
    b.addEventListener('click', () => {
      tempo = +b.dataset.tempo; try { localStorage.setItem('inglisz-tempo', tempo); } catch (e) {}
      document.querySelectorAll('[data-tempo]').forEach(x => x.classList.toggle('on', x === b));
      Sound.init(); Sound.play('tick');
    });
  });
  $('#again').addEventListener('click', () => { Sound.play('pop'); toSelect(); });
  const muteBtn = $('#mute');
  const setMuteUI = () => muteBtn.classList.toggle('off', Sound.isMuted());
  muteBtn.addEventListener('click', () => { Sound.init(); Sound.setMuted(!Sound.isMuted()); setMuteUI(); if (!Sound.isMuted()) Sound.startMusic(); });
  setMuteUI();

  // dopasowanie rozmiaru budki do ekranu
  function fit() {
    const chrome = 214; // dach, szyld, HUD, cokół, ramy
    const maxH = window.innerHeight - chrome;
    const w = Math.max(220, Math.min(window.innerWidth - 36, maxH * W / H, 430));
    document.documentElement.style.setProperty('--sw', w + 'px');
  }
  window.addEventListener('resize', fit); fit();

  // tryb testowy (?demo) do zrzutów ekranu
  window.__game = { choose, attack, get P() { return P; }, get C() { return C; } };
  requestAnimationFrame(loop);
})();
