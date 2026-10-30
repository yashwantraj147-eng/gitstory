/**
 * Zero-dependency Web Audio API sound generator for GitStory Wrapped.
 * Generates ambient synthwave chords, transitional sound effects, and celebratory chimes.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmInterval: NodeJS.Timeout | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgmGain) {
      this.bgmGain.gain.value = muted ? 0 : 0.08;
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  playBeep(frequency = 440, type: OscillatorType = "sine", duration = 0.15) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignore audio errors
    }
  }

  playCelebrate() {
    if (this.isMuted) return;
    this.initCtx();
    // Play celebratory chord arpeggio: C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, "triangle", 0.3);
      }, idx * 70);
    });
  }

  playSlideTransition() {
    if (this.isMuted) return;
    this.initCtx();
    this.playBeep(330, "sine", 0.1);
  }

  startBgm() {
    if (this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.isBgmPlaying = true;
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.isMuted ? 0 : 0.07;
      this.bgmGain.connect(this.ctx.destination);

      // Synthwave chord progression: Am -> F -> C -> G
      const chords = [
        [220, 261.63, 329.63], // A minor
        [174.61, 220, 261.63], // F major
        [261.63, 329.63, 392], // C major
        [196, 246.94, 293.66], // G major
      ];

      let chordIndex = 0;

      const playChord = () => {
        if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

        const currentNotes = chords[chordIndex % chords.length];
        chordIndex++;

        // Low bass pulse
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = "sawtooth";
        bassOsc.frequency.setValueAtTime(currentNotes[0] / 2, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(350, this.ctx.currentTime);

        bassGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.bgmGain);

        bassOsc.start();
        bassOsc.stop(this.ctx.currentTime + 1.2);

        // Soft pad notes
        currentNotes.forEach((freq) => {
          if (!this.ctx || !this.bgmGain) return;
          const padOsc = this.ctx.createOscillator();
          const padGain = this.ctx.createGain();

          padOsc.type = "sine";
          padOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          padGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
          padGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.3);
          padGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.3);

          padOsc.connect(padGain);
          padGain.connect(this.bgmGain);

          padOsc.start();
          padOsc.stop(this.ctx.currentTime + 1.3);
        });
      };

      playChord();
      this.bgmInterval = setInterval(playChord, 1400);
    } catch {
      // Ignore background audio failure
    }
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmGain) {
      this.bgmGain.gain.value = 0;
      this.bgmGain = null;
    }
  }
}

export const soundEngine = new SoundEngine();

