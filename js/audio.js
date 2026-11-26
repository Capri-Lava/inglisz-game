// Syntezator: muzyczka chiptune + śmieszne efekty. Wszystko generowane w WebAudio.
const Sound = (() => {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let muted = false, musicTimer = null, step = 0, nextTime = 0, musicOn = false;
  try { muted = localStorage.getItem('inglisz-muted') === '1'; } catch (e) {}

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.22; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(master);
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('inglisz-muted', m ? '1' : '0'); } catch (e) {}
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.02);
  }

  function osc(type, f0, f1, t, dur, vol, dest, curve) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) {
      if (curve === 'lin') o.frequency.linearRampToValueAtTime(f1, t + dur);
      else o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
    return o;
  }

  let noiseBuf = null;
  function noise(t, dur, vol, fType, fFreq, fEnd, dest) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = fType || 'lowpass';
    f.frequency.setValueAtTime(fFreq || 2000, t);
    if (fEnd) f.frequency.exponentialRampToValueAtTime(fEnd, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxGain);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  // ---- efekty ----
  const fx = {
    tick() { const t = ctx.currentTime; osc('square', 1800, 1800, t, 0.03, 0.08); },
    pop() { const t = ctx.currentTime; osc('sine', 500, 1100, t, 0.08, 0.3); },
    good() { const t = ctx.currentTime; osc('square', 988, 988, t, 0.08, 0.15); osc('square', 1319, 1319, t + 0.07, 0.18, 0.15); },
    bad() { // smutna trąbka „wa-wa-waaa”
      const t = ctx.currentTime;
      [[392, 0], [370, 0.22], [349, 0.44]].forEach(([f, d]) => osc('sawtooth', f, f * 0.97, t + d, 0.2, 0.12));
      const o = osc('sawtooth', 330, 300, t + 0.66, 0.6, 0.12);
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = 7; lg.gain.value = 12; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.66); l.stop(t + 1.3);
    },
    whoosh() { noise(ctx.currentTime, 0.25, 0.5, 'bandpass', 600, 3000); },
    swish() { noise(ctx.currentTime, 0.18, 0.4, 'bandpass', 3000, 800); },
    shing() { const t = ctx.currentTime; osc('triangle', 2600, 3200, t, 0.35, 0.12); osc('sine', 5200, 5000, t, 0.4, 0.05); noise(t, 0.12, 0.3, 'highpass', 4000); },
    twang() { const t = ctx.currentTime; osc('triangle', 220, 160, t, 0.3, 0.3); osc('sawtooth', 440, 300, t, 0.1, 0.08); },
    fwip() { noise(ctx.currentTime, 0.22, 0.35, 'bandpass', 2500, 5000); },
    bonk() { const t = ctx.currentTime; osc('square', 300, 60, t, 0.18, 0.35); osc('sine', 900, 200, t, 0.08, 0.3); noise(t, 0.06, 0.4, 'lowpass', 3000); },
    thwack() { const t = ctx.currentTime; noise(t, 0.15, 0.7, 'lowpass', 5000, 300); osc('sine', 160, 50, t, 0.2, 0.5); },
    clang() { const t = ctx.currentTime; [523, 1244, 1863, 2790].forEach((f, i) => osc('square', f, f * 0.99, t, 0.5 - i * 0.08, 0.06)); noise(t, 0.05, 0.4, 'highpass', 3000); },
    splat() { const t = ctx.currentTime; noise(t, 0.3, 0.8, 'lowpass', 1500, 150); osc('sine', 200, 40, t, 0.25, 0.4); },
    slide() { const t = ctx.currentTime; osc('sine', 500, 1600, t, 0.45, 0.2, null, 'lin'); },
    slideDown() { const t = ctx.currentTime; osc('sine', 1500, 200, t, 0.9, 0.22, null, 'lin'); },
    boing() {
      const t = ctx.currentTime; const o = osc('sine', 180, 420, t, 0.4, 0.35);
      const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 18; lg.gain.value = 60;
      l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + 0.45);
    },
    thud() { const t = ctx.currentTime; osc('sine', 120, 35, t, 0.35, 0.7); noise(t, 0.2, 0.5, 'lowpass', 800, 100); },
    tweet() { const t = ctx.currentTime; for (let i = 0; i < 3; i++) osc('sine', 2400, 3200, t + i * 0.12, 0.08, 0.06); },
    fanfare() {
      const t = ctx.currentTime;
      [[523, 0, .12], [659, .12, .12], [784, .24, .12], [1047, .36, .5], [784, .9, .12], [1047, 1.02, .7]].forEach(([f, d, l]) => {
        osc('square', f, f, t + d, l, 0.12); osc('triangle', f / 2, f / 2, t + d, l, 0.15);
      });
    },
    sad() {
      const t = ctx.currentTime;
      [[392, 0], [349, .3], [311, .6], [262, .9]].forEach(([f, d]) => osc('triangle', f, f, t + d, .35, .2));
    },
    bell() { const t = ctx.currentTime; [0, 0.25].forEach(d => { osc('sine', 1568, 1568, t + d, 0.6, 0.2); osc('sine', 2093, 2093, t + d, 0.4, 0.08); }); },
  };

  function play(name) { if (!ctx || muted) return; try { fx[name] && fx[name](); } catch (e) {} }

  // ---- muzyka: wesoły marsz (oryginalna melodia), G-dur, 8 taktów ----
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  // nuty jako MIDI, 0 = pauza; ósemki
  const MEL = [
    67,0,71,72, 74,74,74,0,  76,74,72,71, 69,0,67,0,
    69,0,71,72, 74,0,79,0,   78,76,74,72, 71,0,0,0,
    74,0,76,78, 79,79,79,0,  78,76,74,72, 71,0,74,0,
    72,71,69,67,69,0,71,0,   67,0,62,0,   67,0,0,0];
  const BASS = [43,50,43,50, 43,50,43,50, 48,55,48,55, 50,57,50,57,
                45,52,45,52, 43,50,43,50, 48,55,50,57, 43,50,43,50,
                43,50,43,50, 47,54,47,54, 48,55,48,55, 43,50,43,50,
                48,55,50,57, 50,57,50,57, 43,50,38,45, 43,50,43,43];
  const STEP = 60 / 138 / 2;
  function schedule() {
    while (nextTime < ctx.currentTime + 0.25) {
      const i = step % 64, t = nextTime;
      if (MEL[i]) { osc('square', N(MEL[i]), N(MEL[i]), t, STEP * 0.9, 0.18, musicGain); }
      osc('triangle', N(BASS[i]), N(BASS[i]), t, STEP * 0.95, 0.5, musicGain);
      if (i % 4 === 0) osc('sine', 150, 40, t, 0.12, 0.6, musicGain);
      if (i % 4 === 2) noise(t, 0.08, 0.25, 'highpass', 2500, null, musicGain);
      if (i % 2 === 1) noise(t, 0.03, 0.08, 'highpass', 7000, null, musicGain);
      nextTime += STEP; step++;
    }
  }
  function startMusic() {
    if (!ctx || musicOn) return;
    musicOn = true; step = 0; nextTime = ctx.currentTime + 0.05;
    musicTimer = setInterval(schedule, 60); schedule();
  }
  function stopMusic() { musicOn = false; clearInterval(musicTimer); }

  return { init, play, startMusic, stopMusic, setMuted, isMuted: () => muted };
})();
