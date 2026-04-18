/**
 * ai.js — Browser-based Voice Assistant (Web Speech API)
 * Reverted to standard browser APIs for maximum reliability.
 */

class VoiceAssistant {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Initialize Web Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false; // Stop after one phrase
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  /**
   * Start Voice Recognition
   */
  async startRecording(onTranscript, onError) {
    if (!this.recognition) {
      onError(new Error('Speech Recognition not supported in this browser. Please use Chrome or Edge.'));
      return;
    }

    try {
      this.recognition.onstart = () => {
        this.isRecording = true;
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        onError(event);
      };

      this.recognition.onend = () => {
        this.isRecording = false;
      };

      this.recognition.start();
    } catch (err) {
      onError(err);
    }
  }

  stopRecording() {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.isRecording = false;
  }

  /**
   * Browser Text-to-Speech
   */
  async speak(text) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      
      // Select a premium sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
      if (preferredVoice) utt.voice = preferredVoice;

      utt.pitch = 1.0;
      utt.rate = 1.0;
      utt.lang = 'en-US';

      utt.onend = () => resolve();
      utt.onerror = () => resolve();

      window.speechSynthesis.speak(utt);
    });
  }
}

// Singleton instance
window.voiceAssistant = new VoiceAssistant();
