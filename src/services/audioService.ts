// src/services/audioService.ts
// Voice synthesis (Web Speech API), Audio Overview podcast player, and Voice recognition

export interface PodcastTurn {
  speaker: 'Alex' | 'Morgan';
  text: string;
}

class AudioService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.synth) {
      this.loadVoices();
    }
    return this.voices;
  }

  public speak(text: string, options?: { rate?: number; pitch?: number; voiceName?: string; onEnd?: () => void }) {
    if (!this.synth || !text) return;

    this.synth.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1.05;
    utterance.pitch = options?.pitch || 1.0;

    if (options?.voiceName) {
      const match = this.voices.find(v => v.name === options.voiceName);
      if (match) utterance.voice = match;
    } else {
      // Find a clean English voice if possible
      const enVoice = this.voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      options?.onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      options?.onEnd?.();
    };

    this.currentUtterance = utterance;
    this.isSpeaking = true;
    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  public generatePodcastScript(topic: string, sourceText?: string): PodcastTurn[] {
    const cleanTopic = topic || 'The core concepts from our study material';
    return [
      {
        speaker: 'Alex',
        text: `Welcome to today's deep dive audio overview! Morgan, we've got an extraordinary topic to unpack today: ${cleanTopic}.`
      },
      {
        speaker: 'Morgan',
        text: `Thanks Alex! I've been reviewing the notes and whiteboard annotations. What immediately struck me is how elegantly the foundational axioms set up the entire framework.`
      },
      {
        speaker: 'Alex',
        text: `Exactly. If you look at the visual progression on the board, notice how it starts from a simple right-angle or base premise, and then systematically scales up into universal proofs.`
      },
      {
        speaker: 'Morgan',
        text: `And the practical takeaway for learners is huge: don't memorize the formula blindly. Understand the geometric and relational meaning behind each variable.`
      },
      {
        speaker: 'Alex',
        text: `Couldn't agree more. Let's keep exploring and annotating as we move deeper into the material!`
      }
    ];
  }
}

export const audioService = new AudioService();

// Voice recognition for Voice-to-board
export function startVoiceRecognition(onResult: (text: string) => void, onEnd?: () => void): (() => void) | null {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Voice input is not supported in this browser. Please try Chrome or Edge.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    const transcript = event.results[0]?.[0]?.transcript;
    if (transcript) onResult(transcript);
  };

  recognition.onend = () => {
    onEnd?.();
  };

  recognition.onerror = () => {
    onEnd?.();
  };

  recognition.start();

  return () => {
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  };
}
