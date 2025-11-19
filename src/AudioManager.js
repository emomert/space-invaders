export class AudioManager {
    constructor() {
        this.ctx = null;
        this.musicNodes = [];
        this.musicGain = null;
        this.masterGain = null;
        this.isMusicPlaying = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        this.initialized = true;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    startMusic() {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMusicPlaying) return;

        this.resume();

        // Create a dark, throbbing sci-fi bassline/drone
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.15;
        this.musicGain.connect(this.masterGain);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 100;
        filter.Q.value = 1;
        filter.connect(this.musicGain);

        // Bass Oscillator (Sawtooth for grit)
        const bassOsc = this.ctx.createOscillator();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.value = 40; // Deep bass
        bassOsc.start();
        bassOsc.connect(filter);
        this.musicNodes.push(bassOsc);

        // LFO for filter sweep (Slow breathing effect)
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2; // Slow pulse
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 300; // Sweep range
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        this.musicNodes.push(lfo);

        // High tension arp (Plucky square wave)
        const arpOsc = this.ctx.createOscillator();
        arpOsc.type = 'square';
        arpOsc.frequency.value = 0; // Controlled by sequencer
        const arpGain = this.ctx.createGain();
        arpGain.gain.value = 0.05;
        arpOsc.connect(arpGain);
        arpGain.connect(this.masterGain); // Bypass lowpass filter for clarity
        arpOsc.start();
        this.musicNodes.push(arpOsc);

        // Simple sequencer for the arp
        let noteIndex = 0;
        const notes = [110, 130.81, 146.83, 164.81]; // A2, C3, D3, E3
        const sequenceInterval = setInterval(() => {
            if (!this.isMusicPlaying) {
                clearInterval(sequenceInterval);
                return;
            }
            const freq = notes[noteIndex % notes.length];
            arpOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            arpOsc.frequency.setValueAtTime(freq * 2, this.ctx.currentTime + 0.1); // Octave jump

            // Envelope
            arpGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
            arpGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

            noteIndex++;
        }, 250); // 16th notes approx

        this.isMusicPlaying = true;
    }

    stopMusic() {
        if (!this.isMusicPlaying) return;
        this.musicNodes.forEach(node => {
            try {
                node.stop();
                node.disconnect();
            } catch (e) { }
        });
        this.musicNodes = [];
        if (this.musicGain) {
            this.musicGain.disconnect();
        }
        this.isMusicPlaying = false;
    }

    playGunSound() {
        if (!this.initialized) this.init();
        if (!this.ctx) return;
        this.resume();

        const t = this.ctx.currentTime;

        // Laser/Plasma Zap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.2);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.2);

        // Impact noise
        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        noise.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);
    }
}
