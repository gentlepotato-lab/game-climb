// 배경 음악. 이 게임을 위해 직접 지은 곡을 Web Audio로 그 자리에서 연주한다.
// 음원 파일이나 남의 샘플을 쓰지 않으므로 저작권이 걸릴 데가 없다.
//
// 곡은 둘이다.
//   select  잔잔한 오후. 96BPM. 통통 튀는 오르골 아르페지오와 부드러운 베이스
//   game    오르막. 112BPM. 통통 튀는 선율과 베이스, 작은 북
// 한 마디는 16칸(16분음표)이고, 곡마다 4마디를 되풀이한다.
//
// 효과음도 같은 방식으로 그 자리에서 만든다. 소리 끄기를 함께 따른다.

export type Track = 'select' | 'game';
export type Sfx = 'tick' | 'go' | 'seed' | 'hit' | 'guard' | 'tink' | 'blast' | 'ready' | 'over' | 'pick' | 'chirp' | 'spray';

const MUTE_KEY = 'climb_bgm_muted';
const LOOKAHEAD = 0.15;
const TICK_MS = 30;
const MASTER = 0.5;

// 음 이름을 주파수로. A4 = 440Hz
const NOTE: Record<string, number> = {};
['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach((name, i) => {
  for (let octave = 1; octave <= 7; octave += 1) {
    NOTE[`${name}${octave}`] = 440 * Math.pow(2, (i - 9 + (octave - 4) * 12) / 12);
  }
});
const hz = (name: string) => NOTE[name];

type Song = {
  bpm: number;
  bars: number;
  play: (bar: number, step: number, t: number, len: number) => void;
};

class Bgm {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private track: Track | null = null;
  private wanted: Track | null = null;
  private timer = 0;
  private nextTime = 0;
  private step = 0;
  private songs: Partial<Record<Track, Song>> = {};
  // 먼지에 맞은 때. 그 뒤 1.4초 동안 음악이 늘어지며 낮고 먹먹해졌다가 돌아온다.
  private stumbleAt = -10;
  private detune = 0;
  private muffle: BiquadFilterNode | null = null;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch (_error) {
      this.muted = false;
    }
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend();
      else if (!this.muted) this.ctx.resume();
    });
  }

  // 브라우저는 사용자가 한 번 건드린 뒤에야 소리를 내게 해 준다. 그 첫 손길에서 부른다.
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER;
      this.master.connect(this.ctx.destination);
      this.muffle = this.ctx.createBiquadFilter();
      this.muffle.type = 'lowpass';
      this.muffle.frequency.value = 18000;
      this.muffle.connect(this.master);
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      this.noise = buffer;
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.8;
      this.sfxBus.connect(this.master);
    }
    if (this.ctx.state === 'suspended' && !this.muted) this.ctx.resume();
    if (this.wanted && this.track !== this.wanted) this.start(this.wanted);
  }

  play(track: Track) {
    this.wanted = track;
    if (this.ctx) this.start(track);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch (_error) {
      // 저장이 막혀도 이번에는 그대로 따른다.
    }
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : MASTER, now, 0.08);
    if (!muted) this.ctx.resume();
  }

  private start(track: Track) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    if (this.track === track) return;
    // 앞 곡은 1초에 걸쳐 잦아들고, 새 곡이 그 위에서 피어난다.
    if (this.bus) {
      const old = this.bus;
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
      window.setTimeout(() => old.disconnect(), 2000);
    }
    const bus = ctx.createGain();
    // 처음 곡은 기다리지 않고 바로 소리를 낸다. 곡을 바꿀 때만 서서히 피어난다.
    if (this.bus) {
      bus.gain.value = 0;
      bus.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
    } else {
      bus.gain.value = 1;
    }
    bus.connect(this.muffle ?? master);
    this.bus = bus;
    this.track = track;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.02;
    window.clearInterval(this.timer);
    this.timer = window.setInterval(() => this.schedule(), TICK_MS);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.track) return;
    const song = (this.songs[this.track] ??= this.track === 'select' ? this.selectSong() : this.gameSong());
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      // 맞은 뒤에는 박자가 늘어지고 음이 살짝 내려간다. 1.4초에 걸쳐 돌아온다.
      const lag = Math.max(0, 1 - (this.nextTime - this.stumbleAt) / 1.4);
      const len = (60 / song.bpm / 4) * (1 + 0.4 * lag);
      this.detune = -80 * lag;
      const bar = Math.floor(this.step / 16) % song.bars;
      song.play(bar, this.step % 16, this.nextTime, len);
      this.nextTime += len;
      this.step += 1;
    }
  }

  // ── 악기 ─────────────────────────────────

  private voice(type: OscillatorType, freq: number, t: number, attack: number, decay: number, gain: number, cutoff = 0) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = this.detune;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    let node: AudioNode = osc;
    if (cutoff > 0) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;
      osc.connect(filter);
      node = filter;
    }
    node.connect(amp);
    amp.connect(this.bus!);
    osc.start(t);
    osc.stop(t + attack + decay + 0.05);
  }

  // 오르골 같은 종소리. 바탕음에 두 배음을 옅게 섞는다.
  private bell(freq: number, t: number, gain: number) {
    this.voice('sine', freq, t, 0.005, 1.4, gain);
    this.voice('sine', freq * 2, t, 0.005, 0.5, gain * 0.25);
    this.voice('triangle', freq * 3, t, 0.003, 0.18, gain * 0.08);
  }

  private pad(freqs: number[], t: number, dur: number, gain: number) {
    freqs.forEach((f) => {
      this.voice('triangle', f, t, Math.min(0.3, dur * 0.35), dur * 0.9, gain, 900);
      this.voice('triangle', f * 1.004, t, Math.min(0.3, dur * 0.35), dur * 0.9, gain * 0.6, 900);
    });
  }

  private pluck(freq: number, t: number, gain: number) {
    this.voice('square', freq, t, 0.004, 0.22, gain, 2400);
    this.voice('triangle', freq * 2, t, 0.003, 0.12, gain * 0.3);
  }

  private bass(freq: number, t: number, dur: number, gain: number) {
    this.voice('sine', freq, t, 0.01, dur, gain);
    this.voice('triangle', freq, t, 0.01, dur * 0.5, gain * 0.25, 600);
  }

  private hat(t: number, gain: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.bus!);
    src.start(t);
    src.stop(t + 0.06);
  }

  private kick(t: number, gain: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(amp);
    amp.connect(this.bus!);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // ── 효과음 ─────────────────────────────────

  private tone(type: OscillatorType, freq: number, t: number, attack: number, decay: number, gain: number, to = 0, cutoff = 0) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to > 0) osc.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    let node: AudioNode = osc;
    if (cutoff > 0) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;
      osc.connect(filter);
      node = filter;
    }
    node.connect(amp);
    amp.connect(this.sfxBus!);
    osc.start(t);
    osc.stop(t + attack + decay + 0.05);
  }

  private whoosh(t: number, dur: number, gain: number, type: BiquadFilterType, from: number, to: number, q = 1) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + dur);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + dur * 0.25);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.sfxBus!);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // 분무기 물소리. 가는 물줄기가 쉭 뿜어졌다가 잦아든다.
  private hiss(t: number, dur: number, gain: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.6;
    band.frequency.setValueAtTime(6200, t);
    band.frequency.exponentialRampToValueAtTime(4200, t + dur);
    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 2200;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + 0.012);
    amp.gain.linearRampToValueAtTime(gain * 0.6, t + 0.07);
    amp.gain.linearRampToValueAtTime(gain * 0.45, t + dur * 0.6);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(band);
    band.connect(high);
    high.connect(amp);
    amp.connect(this.sfxBus!);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // 모란앵무의 짧은 울음. 높은 음이 쓱 올라갔다 떨어지고, 살짝 떨려 까칠하다.
  private call(t: number, f: number, dur: number, gain: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f * 0.85, t);
    osc.frequency.linearRampToValueAtTime(f * 1.25, t + dur * 0.35);
    osc.frequency.exponentialRampToValueAtTime(f * 0.8, t + dur);
    const wobble = ctx.createOscillator();
    wobble.frequency.value = 75;
    const depth = ctx.createGain();
    depth.gain.value = f * 0.06;
    wobble.connect(depth);
    depth.connect(osc.frequency);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(this.sfxBus!);
    osc.start(t);
    wobble.start(t);
    osc.stop(t + dur + 0.02);
    wobble.stop(t + dur + 0.02);
  }

  // 먼지에 맞았을 때 부른다. 음악이 잠깐 늘어지고 먹먹해진다.
  stumble() {
    const ctx = this.ctx;
    if (!ctx || !this.muffle) return;
    this.stumbleAt = ctx.currentTime;
    const f = this.muffle.frequency;
    f.cancelScheduledValues(ctx.currentTime);
    f.setValueAtTime(650, ctx.currentTime);
    f.exponentialRampToValueAtTime(18000, ctx.currentTime + 1.4);
  }

  // n은 카운트의 숫자다(3, 2, 1). 숫자가 줄수록 한 음씩 오른다.
  sfx(name: Sfx, n = 0) {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || this.muted || ctx.state !== 'running') return;
    const t = ctx.currentTime + 0.01;
    switch (name) {
      case 'tick': {
        const f = [hz('E5'), hz('D5'), hz('C5')][Math.max(0, Math.min(2, n - 1))];
        this.tone('triangle', f, t, 0.002, 0.09, 0.22, 0, 3000);
        this.tone('sine', f * 2, t, 0.002, 0.05, 0.06);
        break;
      }
      case 'go':
        this.tone('sine', hz('G5'), t, 0.005, 0.22, 0.2);
        this.tone('sine', hz('C6'), t + 0.09, 0.005, 0.35, 0.2);
        this.tone('triangle', hz('C7'), t + 0.09, 0.003, 0.2, 0.04);
        break;
      case 'seed':
        // 콕 쪼아 먹는 소리. 두 음이 짧게 튀어 오른다.
        this.tone('sine', 880, t, 0.003, 0.08, 0.2, 1320);
        this.tone('sine', 1320, t + 0.07, 0.003, 0.1, 0.16, 1760);
        break;
      case 'hit':
        this.whoosh(t, 0.18, 0.28, 'lowpass', 1100, 260);
        this.tone('sine', 240, t, 0.004, 0.2, 0.2, 110);
        break;
      case 'guard':
        [hz('E5'), hz('A5'), hz('D6')].forEach((f, i) => this.tone('sine', f, t + i * 0.05, 0.004, 0.4, 0.11));
        this.tone('triangle', hz('D7'), t + 0.1, 0.004, 0.45, 0.03);
        break;
      case 'tink':
        this.tone('sine', 2093, t, 0.001, 0.12, 0.11, 2350);
        this.tone('triangle', 3136, t, 0.001, 0.05, 0.04);
        break;
      case 'blast':
        // 휙 하는 바람과 파닥이는 날갯짓
        this.whoosh(t, 0.45, 0.32, 'bandpass', 380, 2400, 0.8);
        for (let k = 0; k < 4; k += 1) this.whoosh(t + 0.04 + k * 0.07, 0.05, 0.12, 'highpass', 1600, 2200);
        break;
      case 'ready':
        this.tone('sine', hz('G6'), t, 0.003, 0.18, 0.08);
        this.tone('sine', hz('C7'), t + 0.06, 0.003, 0.24, 0.07);
        break;
      case 'over':
        [hz('E5'), hz('C5'), hz('A4')].forEach((f, i) => this.tone('triangle', f, t + i * 0.18, 0.006, 0.36, 0.14, 0, 2500));
        break;
      case 'chirp': {
        // 삐빅. 둘째 음이 조금 높고 짧다. 부를 때마다 높이가 조금씩 다르다.
        const f = 2900 + Math.random() * 600;
        this.call(t + 0.06, f, 0.09, 0.13);
        this.call(t + 0.17, f * 1.15, 0.055, 0.11);
        break;
      }
      case 'spray':
        // 치익. 방아쇠가 딸깍하고 물이 뿜어진다.
        this.tone('square', 1800, t, 0.001, 0.015, 0.03, 0, 4000);
        this.hiss(t + 0.01, 0.36, 0.22);
        break;
      case 'pick':
        this.tone('sine', hz('B5'), t, 0.002, 0.07, 0.12);
        break;
    }
  }

  // ── 곡 ─────────────────────────────────

  // 잔잔한 오후. 오르골이 8분음표로 통통 화음을 짚고, 부드러운 베이스와 살랑이는 하이햇이 받친다.
  // 맑은 차임이 마디마다 짧은 선율을 얹는다.
  private selectSong(): Song {
    const chords = [
      ['F3', 'A3', 'C4', 'E4'],
      ['G3', 'B3', 'D4', 'E4'],
      ['E3', 'G3', 'B3', 'D4'],
      ['A3', 'C4', 'E4', 'G4']
    ];
    const roots = ['F2', 'G2', 'E2', 'A2'];
    const arp = [0, 1, 2, 3, 2, 1, 2, 3];
    const tune = [
      ['C6', '', 'A5', '', 'G5', '', 'A5', ''],
      ['B5', '', 'D6', '', 'G5', '', '', ''],
      ['G5', '', 'E5', '', 'B5', '', 'G5', ''],
      ['A5', '', 'C6', '', 'E6', '', 'C6', '']
    ];
    return {
      bpm: 96,
      bars: 4,
      play: (bar, step, t, len) => {
        const chord = chords[bar];
        if (step === 0) this.pad(chord.map(hz), t, len * 16, 0.028);
        if (step % 2 === 0) this.bell(hz(chord[arp[step / 2]]) * 2, t, step % 4 === 0 ? 0.05 : 0.035);
        if (step === 0 || step === 8) this.bass(hz(roots[bar]), t, len * 5, 0.11);
        if (step === 6 || step === 14) this.bass(hz(roots[bar]) * 1.5, t, len * 1.5, 0.06);
        if (step % 4 === 2) this.hat(t, 0.03);
        else if (step % 2 === 1) this.hat(t, 0.012);
        if (step % 2 === 0) {
          const note = tune[bar][step / 2];
          if (note) this.bell(hz(note), t, 0.04);
        }
      }
    };
  }

  // 오르막. 베이스가 통통 받치고, 뜯는 소리가 4마디 선율을 조금씩 바꿔 부른다.
  private gameSong(): Song {
    const chords = [
      ['C3', 'E3', 'G3'],
      ['A2', 'C3', 'E3'],
      ['F2', 'A2', 'C3'],
      ['G2', 'B2', 'D3']
    ];
    const roots = ['C2', 'A1', 'F1', 'G1'];
    // 16칸 선율. 빈칸은 쉰다.
    const phrases = [
      ['E5', '', 'G5', '', 'A5', 'G5', 'E5', '', 'D5', '', 'E5', '', 'G5', '', '', ''],
      ['C5', '', 'E5', '', 'A5', '', 'G5', 'E5', 'C5', '', 'D5', '', 'E5', '', '', ''],
      ['A4', '', 'C5', '', 'F5', 'E5', 'C5', '', 'A4', '', 'C5', '', 'D5', '', 'E5', ''],
      ['D5', '', 'G5', '', 'B4', '', 'D5', '', 'G5', '', 'A5', 'G5', 'D5', '', '', '']
    ];
    let round = 0;
    return {
      bpm: 112,
      bars: 4,
      play: (bar, step, t, len) => {
        if (bar === 0 && step === 0) round += 1;
        const chord = chords[bar].map(hz);
        if (step === 0 || step === 8) this.kick(t, 0.22);
        if (step % 4 === 2) this.hat(t, 0.05);
        else if (step % 2 === 1) this.hat(t, 0.02);
        if (step === 0 || step === 6 || step === 8 || step === 14) this.bass(hz(roots[bar]) * (step === 6 ? 2 : 1), t, len * 2.2, 0.16);
        if (step === 4 || step === 12) chord.forEach((f) => this.pluck(f * 2, t, 0.02));
        // 짝수 바퀴에는 선율을 한 옥타브 낮추고 몇 음을 쉬어 귀가 덜 지친다.
        const note = phrases[bar][step];
        if (note) {
          const rest = round % 2 === 0 && step % 4 === 2;
          if (!rest) this.pluck(hz(note) * (round % 2 === 0 ? 0.5 : 1), t, 0.05);
        }
      }
    };
  }
}

export const bgm = new Bgm();
