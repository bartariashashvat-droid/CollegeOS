/**
 * CollegeOS - Web Audio Synthesizer
 * Zero-dependency procedural audio engine for study ambient sounds and notification chimes.
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.ambientNode = null;
    this.ambientGain = null;
    this.currentAmbient = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play crisp notification chime for completed pomodoro / completed assignment
  playChime(type = 'success') {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (type === 'success') {
        // High harmonic bright two-tone chime (E5 -> B5)
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.12); // B5

        osc2.frequency.setValueAtTime(1318.5, now); // E6 harmonic
        osc2.frequency.exponentialRampToValueAtTime(1975.5, now + 0.12);
      } else if (type === 'bell') {
        // Deep zen meditation bell for Pomodoro session end
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(1046.5, now); // C6
      } else {
        // Subtle pop
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      }

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'bell' ? 1.5 : 0.45));

      osc1.connect(gain);
      if (type !== 'pop') osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      if (type !== 'pop') osc2.start(now);

      const stopTime = now + (type === 'bell' ? 1.6 : 0.5);
      osc1.stop(stopTime);
      if (type !== 'pop') osc2.stop(stopTime);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Procedural Noise Buffer Generator
  createNoiseBuffer(type = 'white', seconds = 5) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'brown') {
        // Brown noise (deep rumble, waterfall sound)
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else if (type === 'pink') {
        // Pink noise (natural rain spectrum)
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      } else {
        // Pure White noise
        output[i] = white * 0.2;
      }
    }
    return buffer;
  }

  // Play Ambient Audio in Loop
  startAmbient(type = 'rain', volume = 0.3) {
    this.stopAmbient();
    this.init();
    if (!this.ctx) return;

    try {
      const buffer = this.createNoiseBuffer(type === 'brown' ? 'brown' : 'pink', 5);
      if (!buffer) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Filter to simulate sound atmosphere
      const filter = this.ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      } else if (type === 'brown') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      } else if (type === 'cafe') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.Q.setValueAtTime(0.7, this.ctx.currentTime);
      }

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.5, this.ctx.currentTime + 1.2);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      source.start();

      this.ambientNode = source;
      this.ambientGain = gain;
      this.currentAmbient = type;
    } catch (e) {
      console.warn('Could not start ambient audio:', e);
    }
  }

  stopAmbient() {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          if (this.ambientNode) {
            try { this.ambientNode.stop(); } catch (_) {}
            this.ambientNode.disconnect();
            this.ambientNode = null;
          }
        }, 600);
      } catch (_) {
        if (this.ambientNode) {
          try { this.ambientNode.stop(); } catch (err) {}
          this.ambientNode = null;
        }
      }
    }
    this.currentAmbient = null;
  }

  setAmbientVolume(vol) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(vol * 0.5, this.ctx.currentTime + 0.1);
    }
  }
}

window.soundSynth = new SoundSynthesizer();
