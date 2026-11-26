// Postacie: szkielet z kośćmi, płynne pozy (interpolacja) + kostiumy rysowane w niskiej rozdzielczości.
const D2R = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const EASE = {
  lin: t => t,
  io: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  back: t => { const c = 2.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
const PARAMS = ['x', 'lift', 'rot', 'torso', 'head', 'aF', 'eF', 'aB', 'eB', 'tF', 'kF', 'tB', 'kB', 'w', 'nock', 'mouth'];

const HEROES = {
  arthur: {
    name: 'King Arthur', weapons: ['sword', 'bow', 'lance'], weapon: 'sword',
    leg: 12, torso: 18, headR: 6.5,
    idle: { x: 0, lift: 0, rot: 0, torso: 4, head: 0, aF: 35, eF: 75, aB: -5, eB: 55, tF: 16, kF: 22, tB: -16, kB: 12, w: 150, nock: 0, mouth: 0 },
  },
  nigel: {
    name: 'Nigel Bumble', weapons: ['paint', 'broom', 'kick'], weapon: 'none',
    leg: 12, torso: 17, headR: 7,
    idle: { x: 0, lift: 0, rot: 0, torso: 8, head: -4, aF: 30, eF: 115, aB: 15, eB: 120, tF: 20, kF: 26, tB: -18, kB: 14, w: 120, nock: 0, mouth: 0 },
  },
};

class Fighter {
  constructor(key, bx, facing) {
    this.key = key; this.h = HEROES[key];
    this.bx = bx; this.f = facing;
    this.pose = { ...this.h.idle };
    this.from = { ...this.pose }; this.to = { ...this.pose };
    this.queue = []; this.seg = null; this.segT = 0;
    this.idleW = 1; this.idle = true; this.phase = Math.random() * 6;
    this.weapon = this.h.weapon; this.bootOn = true;
    this.flash = 0; this.stars = 0; this.stains = []; this.down = false;
    this.hp = 100; this.cape = 0; this.talk = 0; this.prevX = 0;
    this.J = null;
  }
  // kolejka klatek kluczowych: [{d, p, e, set, ev}]
  play(keys, keepIdle) {
    return new Promise(res => {
      this.idle = !!keepIdle;
      keys.forEach(k => this.queue.push(k));
      this.queue.push({ d: 0, done: res });
    });
  }
  toIdle(d = 300) {
    return this.play([{ d, p: { ...this.h.idle, x: 0 }, e: 'io', set: { weapon: this.h.weapon } }], true)
      .then(() => { this.idle = true; });
  }
  update(dt, t) {
    // segmenty animacji
    while (!this.seg && this.queue.length) {
      const k = this.queue.shift();
      if (k.done) { k.done(); continue; }
      if (k.set) Object.assign(this, k.set);
      if (k.ev) k.ev();
      this.from = { ...this.pose };
      this.to = { ...this.pose, ...(k.p || {}) };
      this.seg = k; this.segT = 0;
      if (!k.d) { this.pose = { ...this.to }; this.seg = null; }
    }
    if (this.seg) {
      this.segT += dt;
      const r = Math.min(1, this.segT / this.seg.d), e = EASE[this.seg.e || 'io'](r);
      PARAMS.forEach(p => { this.pose[p] = lerp(this.from[p], this.to[p], e); });
      if (r >= 1) { if (this.seg.end) this.seg.end(); this.seg = null; }
    }
    this.idleW = lerp(this.idleW, this.idle && !this.seg && !this.queue.length ? 1 : 0, Math.min(1, dt / 120));
    if (this.flash > 0) this.flash -= dt;
    if (this.stars > 0) this.stars -= dt;
    if (this.talk > 0) this.talk -= dt;
    // peleryna reaguje na ruch
    const vx = (this.pose.x - this.prevX) / Math.max(dt, 1) * 16;
    this.prevX = this.pose.x;
    this.cape = lerp(this.cape, Math.max(-1, Math.min(1, vx / 3)), 0.15);
    this.t = t;
  }
  // pozycja końcowa (z „bokserskim” bujaniem w bezczynności)
  finalPose() {
    const p = { ...this.pose }, w = this.idleW, t = this.t / 1000 + this.phase;
    if (w > 0.01) {
      const b = Math.abs(Math.sin(t * Math.PI * 1.6)); // podskoki
      const s = Math.sin(t * Math.PI * 0.8);          // bujanie
      p.lift += w * b * 2.6;
      p.kF += w * (1 - b) * 12; p.kB += w * (1 - b) * 10;
      p.tF += w * (1 - b) * 4;
      p.torso += w * s * 4; p.x += w * s * 1.5;
      p.aF += w * Math.sin(t * Math.PI * 1.6 + 1) * 6; p.aB += w * Math.sin(t * Math.PI * 1.6 + 2) * 6;
      p.head += w * s * -3;
    }
    if (this.talk > 0) p.mouth = 1 + Math.sin(this.t / 45);
    return p;
  }
  // szkielet w lokalnych współrzędnych (x do przodu, y w dół, podłoga = 0)
  joints() {
    const p = this.finalPose(), h = this.h, L = h.leg;
    const dirDown = a => [Math.sin(a * D2R), Math.cos(a * D2R)];
    const add = (o, a, l) => { const d = dirDown(a); return [o[0] + d[0] * l, o[1] + d[1] * l]; };
    const H = [p.x, -2 * L];
    const tu = [Math.sin(p.torso * D2R), -Math.cos(p.torso * D2R)];
    const T = [H[0] + tu[0] * h.torso, H[1] + tu[1] * h.torso];
    const S = [H[0] + tu[0] * (h.torso - 3), H[1] + tu[1] * (h.torso - 3)];
    const ha = p.torso + p.head;
    const HC = [T[0] + Math.sin(ha * D2R) * (h.headR + 1), T[1] - Math.cos(ha * D2R) * (h.headR + 1)];
    const EF = add(S, p.aF, 10), HF = add(EF, p.aF + p.eF, 10);
    const EB = add(S, p.aB, 10), HB = add(EB, p.aB + p.eB, 10);
    const KF = add(H, p.tF, L), FF = add(KF, p.tF - p.kF, L);
    const KB = add(H, p.tB, L), FB = add(KB, p.tB - p.kB, L);
    const J = { H, T, S, HC, EF, HF, EB, HB, KF, FF, KB, FB };
    // obrót całego ciała wokół bioder
    if (p.rot) {
      const c = Math.cos(p.rot * D2R), s = Math.sin(p.rot * D2R);
      for (const k in J) {
        if (k === 'H') continue;
        const dx = J[k][0] - H[0], dy = J[k][1] - H[1];
        J[k] = [H[0] + dx * c - dy * s, H[1] + dx * s + dy * c];
      }
    }
    // najniższy punkt dotyka ziemi
    let maxY = Math.max(J.FF[1], J.FB[1]);
    if (Math.abs(p.rot) > 20) maxY = Math.max(maxY, J.HC[1] + h.headR, J.H[1] + 3, J.HF[1], J.HB[1], J.T[1] + 4);
    const off = -maxY - p.lift;
    for (const k in J) J[k] = [J[k][0], J[k][1] + off];
    J.p = p; J.ang = { torso: p.torso + p.rot, head: ha + p.rot, fore: p.aF + p.eF + p.rot, w: p.w + p.rot,
      shinF: p.tF - p.kF + p.rot, shinB: p.tB - p.kB + p.rot };
    this.J = J;
    return J;
  }
  // punkt świata (dla efektów)
  world(name, gy) {
    const J = this.J || this.joints();
    return [this.bx + this.f * J[name][0], gy + J[name][1]];
  }
}

// ---------- rysowanie ----------
const Draw = (() => {
  let flashing = false;
  const C = c => flashing ? '#ffffff' : c;
  function cap(ctx, a, b, w, col) {
    ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  function circ(ctx, p, r, col) { ctx.fillStyle = C(col); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill(); }
  function rect(ctx, x, y, w, h, col) { ctx.fillStyle = C(col); ctx.fillRect(x, y, w, h); }
  function inFrame(ctx, p, ang, fn) { ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang * D2R); fn(); ctx.restore(); }
  function poly(ctx, pts, col) { ctx.fillStyle = C(col); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); }

  // ---------- bronie ----------
  function weapon(ctx, F, J) {
    const hand = J.HF, a = J.ang.w;
    const d = [Math.sin(a * D2R), Math.cos(a * D2R)];
    const at = l => [hand[0] + d[0] * l, hand[1] + d[1] * l];
    switch (F.weapon) {
      case 'sword':
        cap(ctx, at(-3), at(2), 2, '#6b3b1a');
        inFrame(ctx, hand, 90 - a, () => { rect(ctx, 1, -4, 2, 8, '#e8b923'); });
        cap(ctx, at(3), at(24), 2.4, '#dfe6ee');
        cap(ctx, at(4), at(22), 0.8, '#9aa7b5');
        circ(ctx, at(-4), 1.4, '#e8b923');
        break;
      case 'lance':
        cap(ctx, at(-12), at(38), 2.6, '#8a5a2b');
        poly(ctx, [at(38), [at(36)[0] + d[1] * 2.5, at(36)[1] - d[0] * 2.5], at(48), [at(36)[0] - d[1] * 2.5, at(36)[1] + d[0] * 2.5]], '#dfe6ee');
        inFrame(ctx, at(30), 90 - a, () => { poly(ctx, [[0, 0], [-8, 0], [-4, 5]], '#c8102e'); poly(ctx, [[0, 0], [-8, 0], [-6, 2]], '#ffffff'); });
        cap(ctx, at(2), at(8), 4, '#5a5f68');
        break;
      case 'bow': {
        const n = J.p.nock;
        inFrame(ctx, hand, 90 - a, () => {
          ctx.strokeStyle = C('#7a4a1e'); ctx.lineWidth = 1.8; ctx.beginPath();
          ctx.arc(-4, 0, 13, -1.15, 1.15); ctx.stroke();
          const tx = -4 + Math.cos(1.15) * 13, ty = Math.sin(1.15) * 13;
          ctx.strokeStyle = C('#f2efe6'); ctx.lineWidth = 0.7; ctx.beginPath();
          ctx.moveTo(tx, -ty); ctx.lineTo(-n * 10 + tx * (1 - n), 0); ctx.lineTo(tx, ty); ctx.stroke();
          if (n > 0.2) { // strzała
            cap(ctx, [-n * 10 + tx * (1 - n), 0], [12, 0], 1, '#c9a26a');
            poly(ctx, [[12, -1.6], [15, 0], [12, 1.6]], '#cfd6de');
          }
        });
        break;
      }
      case 'paint':
        circ(ctx, at(4), 4.5, '#2a6fdb');
        rect(ctx, at(0)[0] - 1.5, at(0)[1] - 1.5, 3, 3, '#e8d9a8');
        circ(ctx, [at(4)[0] + 1.5, at(4)[1] + 4], 1.2, '#2a6fdb');
        break;
      case 'broom':
        cap(ctx, at(-8), at(26), 1.8, '#a8753b');
        inFrame(ctx, at(26), 90 - a, () => {
          poly(ctx, [[0, -2.5], [0, 2.5], [10, 6], [10, -6]], '#e1b84b');
          rect(ctx, 1, -2.5, 1.5, 5, '#b33');
          for (let i = -5; i <= 5; i += 2) rect(ctx, 8, i, 2.5, 1, '#c8962e');
        });
        break;
    }
  }

  // ---------- King Arthur ----------
  function arthur(ctx, F, J) {
    const A = J.ang;
    // peleryna
    inFrame(ctx, J.T, A.torso, () => {
      const sw = -F.cape * 6 + Math.sin(F.t / 300) * 1.2;
      poly(ctx, [[-4, 1], [3, 1], [-2 + sw * 0.4, 18], [-12 + sw, 26], [-14 + sw * 1.2, 23]], '#8e1420');
      poly(ctx, [[-3, 1], [1, 1], [-4 + sw * 0.5, 17], [-11 + sw, 23]], '#b3202a');
    });
    // tylne kończyny
    cap(ctx, J.S, J.EB, 4, '#6d7480'); cap(ctx, J.EB, J.HB, 3.6, '#6d7480'); circ(ctx, J.HB, 2, '#e0a682');
    leg(ctx, J.H, J.KB, J.FB, A.shinB, '#6d7480', '#4a2c14', true);
    // tułów
    cap(ctx, J.H, J.T, 11, '#8a919c');
    inFrame(ctx, J.H, A.torso, () => {
      poly(ctx, [[-5, -16], [5, -16], [6, 4], [-6, 4]], '#1f3c8c');
      rect(ctx, -1, -14, 2, 15, '#e8b923'); rect(ctx, -4, -9, 8, 2, '#e8b923');
      rect(ctx, -6, -2, 12, 2.2, '#5a3416'); rect(ctx, -1, -2, 2, 2.2, '#e8b923');
    });
    leg(ctx, J.H, J.KF, J.FF, A.shinF, '#8a919c', '#5a3416', false);
    // głowa
    inFrame(ctx, J.HC, A.head, () => {
      circ(ctx, [0, 0], 6.5, '#e9b48f');
      poly(ctx, [[-1, 1], [6.8, 1], [6, 6], [2, 10], [-2, 7]], '#e8e4dc'); // broda
      rect(ctx, 1, 2.6, 5, 1.2, '#c9c3b8');
      rect(ctx, 2.6, -1.8, 1.6, 2, '#1a1a1a'); // oko
      rect(ctx, 5.8, -1, 1.8, 2.5, '#d8957a'); // nos
      rect(ctx, 1, -3.6, 4.4, 1, '#cfc8be'); // brew
      poly(ctx, [[-6.5, -0.5], [-5, -5], [1, -6.5], [-6, 3]], '#d9d3c9'); // włosy
      // korona
      rect(ctx, -6, -8.5, 12, 3, '#e8b923');
      poly(ctx, [[-6, -8], [-6, -12], [-3.5, -9], [-1, -13], [1.5, -9], [4, -12.5], [6, -8]], '#e8b923');
      rect(ctx, -0.8, -7.8, 1.6, 1.6, '#c8102e'); rect(ctx, -5, -7.8, 1.4, 1.4, '#2a6fdb'); rect(ctx, 3.6, -7.8, 1.4, 1.4, '#2a6fdb');
      if (J.p.mouth > 0.3) rect(ctx, 4, 3.2, 2.6, 1.4 + J.p.mouth, '#5a2020');
    });
    stains(ctx, F, J);
    // przednia ręka + broń
    if (F.weapon === 'lance' || F.weapon === 'bow') weapon(ctx, F, J);
    cap(ctx, J.S, J.EF, 4.2, '#8a919c'); cap(ctx, J.EF, J.HF, 3.8, '#8a919c');
    circ(ctx, J.HF, 2.2, '#5a3416');
    if (F.weapon === 'sword') weapon(ctx, F, J);
  }

  // ---------- Nigel Bumble (oryginalny niezdara) ----------
  function nigel(ctx, F, J) {
    const A = J.ang;
    cap(ctx, J.S, J.EB, 3.8, '#d9d2c2'); cap(ctx, J.EB, J.HB, 3.4, '#d9d2c2'); circ(ctx, J.HB, 2.2, '#f0c09a');
    leg(ctx, J.H, J.KB, J.FB, A.shinB, '#6b4f2a', '#d4a017', true, 'nigel', true);
    // tułów: koszula + kamizelka w romby
    cap(ctx, J.H, J.T, 12, '#f2efe6');
    inFrame(ctx, J.H, A.torso, () => {
      poly(ctx, [[-6, -14], [6, -14], [6.5, 3], [-6.5, 3]], '#2f7d3a');
      for (let y = -11; y < 2; y += 5) for (let x = -4; x < 6; x += 5) poly(ctx, [[x, y - 2], [x + 1.6, y], [x, y + 2], [x - 1.6, y]], '#f2c14e');
      poly(ctx, [[-2.5, -16], [2.5, -16], [0, -11]], '#f2efe6');
      rect(ctx, -6.5, 1.5, 13, 3.5, '#6b4f2a'); // spodnie (pas)
    });
    leg(ctx, J.H, J.KF, J.FF, A.shinF, '#7a5c33', '#d4a017', false, 'nigel', F.bootOn);
    // głowa
    inFrame(ctx, J.HC, A.head, () => {
      circ(ctx, [0, 0], 7, '#f3c6a0');
      circ(ctx, [-6.5, 1], 2, '#f3c6a0'); // ucho
      // rude kępki włosów
      poly(ctx, [[-8, -3], [-5, -6], [-3, -2], [-6, 2]], '#d9601a'); rect(ctx, -9, -1, 2, 2, '#d9601a');
      // melonik
      rect(ctx, -8.5, -7, 17, 2.4, '#141414');
      poly(ctx, [[-5.5, -7], [-5, -12], [-2, -14.5], [2, -14.5], [5, -12], [5.5, -7]], '#1e1e1e');
      rect(ctx, -5.5, -8.8, 11, 1.6, '#7a1f2b');
      // twarz
      rect(ctx, 1.6, -3.6, 2.6, 2.6, '#ffffff'); rect(ctx, 3, -2.8, 1.3, 1.6, '#111');
      rect(ctx, 4.6, -3.6, 2.4, 2.4, '#ffffff'); rect(ctx, 5.8, -2.8, 1.2, 1.6, '#111');
      rect(ctx, 1.2, -5.2, 3.2, 0.9, '#9a4a12'); rect(ctx, 4.6, -5.4, 2.6, 0.9, '#9a4a12');
      circ(ctx, [7.3, 0.6], 2.3, '#e8907a'); // nos
      circ(ctx, [1.5, 2.6], 1.6, '#f0a4a0'); // rumieniec
      if (J.p.mouth > 0.3) { rect(ctx, 3, 3.4, 4, 1.5 + J.p.mouth * 1.5, '#5a2020'); }
      else { rect(ctx, 2.8, 4, 4.2, 1, '#7a2a2a'); rect(ctx, 6.6, 3.2, 1, 1, '#7a2a2a'); }
    });
    // muszka
    inFrame(ctx, J.T, A.torso, () => { poly(ctx, [[-3, -1], [0, 0.5], [-3, 2]], '#c8102e'); poly(ctx, [[3, -1], [0, 0.5], [3, 2]], '#c8102e'); rect(ctx, -0.8, -0.3, 1.6, 1.6, '#8e0b20'); });
    stains(ctx, F, J);
    if (F.weapon === 'broom') weapon(ctx, F, J);
    cap(ctx, J.S, J.EF, 4, '#f2efe6'); cap(ctx, J.EF, J.HF, 3.6, '#f2efe6');
    circ(ctx, J.HF, 2.4, '#f3c6a0');
    if (F.weapon === 'paint') weapon(ctx, F, J);
  }

  function leg(ctx, H, K, Fo, shinA, col, boot, back, who, bootOn = true) {
    const shade = back ? 0.82 : 1;
    const c = shadeCol(col, shade);
    cap(ctx, H, K, 4.8, c);
    if (who === 'nigel') {
      // za krótkie spodnie i skarpetki w paski
      const m = [lerp(K[0], Fo[0], 0.45), lerp(K[1], Fo[1], 0.45)];
      cap(ctx, K, m, 4.4, c);
      cap(ctx, m, Fo, 3, shadeCol('#c8102e', shade));
      const m2 = [lerp(K[0], Fo[0], 0.7), lerp(K[1], Fo[1], 0.7)];
      cap(ctx, m2, [lerp(K[0], Fo[0], 0.8), lerp(K[1], Fo[1], 0.8)], 3.1, '#ffffff');
      if (bootOn) inFrame(ctx, Fo, -shinA, () => { rect(ctx, -2.8, -5, 5.6, 6, shadeCol(boot, shade)); rect(ctx, -2.8, -1, 8, 3, shadeCol(boot, shade)); rect(ctx, -2.8, 1.4, 8, 0.8, '#5a4a10'); });
      else inFrame(ctx, Fo, -shinA, () => { rect(ctx, -2, -1, 6, 2.4, shadeCol('#c8102e', shade)); });
    } else {
      cap(ctx, K, Fo, 4.2, c);
      inFrame(ctx, Fo, -shinA, () => { rect(ctx, -2.6, -5, 5.2, 6, shadeCol(boot, shade)); rect(ctx, -2.6, -1.2, 7.6, 2.8, shadeCol(boot, shade)); });
    }
  }
  function shadeCol(hex, k) {
    if (k === 1) return hex;
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
    return `rgb(${r},${g},${b})`;
  }
  function stains(ctx, F, J) {
    F.stains.forEach(s => {
      const base = s.part === 'head' ? J.HC : J.H, ang = s.part === 'head' ? J.ang.head : J.ang.torso;
      inFrame(ctx, base, ang, () => {
        circ(ctx, [s.x, s.y], s.r, s.c);
        s.drips.forEach(d => rect(ctx, s.x + d[0], s.y, 1.2, d[1], s.c));
      });
    });
  }

  function fighter(ctx, F, gy) {
    const J = F.joints();
    ctx.save();
    ctx.translate(F.bx, gy); ctx.scale(F.f, 1);
    // cień
    if (!flashing) { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(J.H[0], 1, F.down ? 22 : 11, 2, 0, 0, 7); ctx.fill(); }
    flashing = F.flash > 0 && Math.floor(F.flash / 50) % 2 === 0;
    (F.key === 'arthur' ? arthur : nigel)(ctx, F, J);
    flashing = false;
    ctx.restore();
  }

  function stars(ctx, F, gy, t) {
    if (F.stars <= 0) return;
    const [hx, hy] = F.world('HC', gy);
    for (let i = 0; i < 4; i++) {
      const a = t / 180 + i * Math.PI / 2;
      const x = hx + Math.cos(a) * 9, y = hy - 9 + Math.sin(a) * 3;
      ctx.fillStyle = i % 2 ? '#ffe14a' : '#ffffff';
      ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3);
    }
  }

  return { fighter, stars, cap, circ, rect, poly, inFrame };
})();
