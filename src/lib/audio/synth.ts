/**
 * Zero-dependency Web Audio API sound generator for GitStory Wrapped.
 * Generates ambient synthwave chords, transitional sound effects, and celebratory chimes.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmInterval: ReturnType<typeof setInterval> | null = null;
  private celebrateTimers: ReturnType<typeof setTimeout>[] = [];

  private async ensureCtx(): Promise<AudioContext | null> {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(muted ? 0 : 0.07, this.ctx.currentTime, 0.05);
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  async playBeep(frequency = 440, type: OscillatorType = "sine", duration = 0.15) {
    if (this.isMuted) return;
    const ctx = await this.ensureCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio errors when autoplay is blocked
    }
  }

  playCelebrate() {
    if (this.isMuted) return;
    this.clearCelebrateTimers();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const timer = setTimeout(() => {
        void this.playBeep(freq, "triangle", 0.3);
      }, idx * 70);
      this.celebrateTimers.push(timer);
    });
  }

  playSlideTransition() {
    if (this.isMuted) return;
    void this.playBeep(330, "sine", 0.1);
  }

  private clearCelebrateTimers() {
    for (const timer of this.celebrateTimers) {
      clearTimeout(timer);
    }
    this.celebrateTimers = [];
  }

  async startBgm() {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    const ctx = await this.ensureCtx();
    if (!ctx || !this.isBgmPlaying) return;

    try {
      const gainNode = ctx.createGain();
      gainNode.gain.value = this.isMuted ? 0 : 0.07;
      gainNode.connect(ctx.destination);
      this.bgmGain = gainNode;

      const chords = [
        [220, 261.63, 329.63], // Am
        [174.61, 220, 261.63], // F
        [261.63, 329.63, 392], // C
        [196, 246.94, 293.66], // G
      ];

      let chordIndex = 0;

      const playChord = () => {
        if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;
        const activeCtx = this.ctx;
        const masterGain = this.bgmGain;

        const currentNotes = chords[chordIndex % chords.length];
        chordIndex++;

        const bassOsc = activeCtx.createOscillator();
        const bassGain = activeCtx.createGain();
        bassOsc.type = "sawtooth";
        bassOsc.frequency.setValueAtTime(currentNotes[0] / 2, activeCtx.currentTime);

        const filter = activeCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(350, activeCtx.currentTime);

        bassGain.gain.setValueAtTime(0.04, activeCtx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, activeCtx.currentTime + 1.2);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(masterGain);

        bassOsc.start();
        bassOsc.stop(activeCtx.currentTime + 1.2);

        currentNotes.forEach((freq) => {
          const padOsc = activeCtx.createOscillator();
          const padGain = activeCtx.createGain();

          padOsc.type = "sine";
          padOsc.frequency.setValueAtTime(freq, activeCtx.currentTime);

          padGain.gain.setValueAtTime(0.02, activeCtx.currentTime);
          padGain.gain.linearRampToValueAtTime(0.04, activeCtx.currentTime + 0.3);
          padGain.gain.exponentialRampToValueAtTime(0.001, activeCtx.currentTime + 1.3);

          padOsc.connect(padGain);
          padGain.connect(masterGain);

          padOsc.start();
          padOsc.stop(activeCtx.currentTime + 1.3);
        });
      };

      playChord();
      this.bgmInterval = setInterval(playChord, 1400);
    } catch {
      this.stopBgm();
    }
  }

  stopBgm() {
    this.isBgmPlaying = false;
    this.clearCelebrateTimers();
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmGain) {
      try {
        this.bgmGain.gain.value = 0;
        this.bgmGain.disconnect();
      } catch {
        // Ignore already-disconnected gain
      }
      this.bgmGain = null;
    }
  }
}

export const soundEngine = new SoundEngine();
