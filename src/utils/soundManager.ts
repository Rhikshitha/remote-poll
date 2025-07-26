class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Check if user has sound preference saved
    const savedPref = localStorage.getItem('soundEnabled');
    if (savedPref !== null) {
      this.enabled = savedPref === 'true';
    }
  }

  private initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error('Web Audio API not supported:', e);
      }
    }
  }

  private playTone(frequency: number, duration: number, volume: number = 0.1) {
    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const now = this.audioContext.currentTime;
      
      oscillator.frequency.value = frequency;
      gainNode.gain.value = volume;
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  play(soundName: string) {
    if (!this.enabled) return;
    
    switch (soundName) {
      case 'pop':
        this.playTone(800, 0.1, 0.3);
        break;
      case 'success':
        this.playTone(600, 0.1, 0.2);
        setTimeout(() => this.playTone(800, 0.1, 0.2), 100);
        setTimeout(() => this.playTone(1000, 0.2, 0.3), 200);
        break;
      case 'click':
        this.playTone(1000, 0.05, 0.1);
        break;
      case 'whoosh':
        this.playTone(400, 0.2, 0.2);
        break;
      default:
        this.playTone(440, 0.1, 0.1);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('soundEnabled', this.enabled.toString());
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

const soundManager = new SoundManager();
export default soundManager;