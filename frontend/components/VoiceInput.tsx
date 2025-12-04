'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onTranscript?: (transcript: string) => void;
  className?: string;
}

export default function VoiceInput({ onTranscript, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      console.error('Web Speech API is not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Get interim results
    recognition.lang = 'ja-JP'; // Japanese language
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + ' ';
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      // Update the displayed transcript
      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      // Call the callback with final transcript
      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);

      // Restart on certain errors
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // These are expected when there's no audio, don't stop
        return;
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);

      // Auto-restart if it stops unexpectedly
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error restarting recognition:', error);
        }
      }
    };

    recognitionRef.current = recognition;

    // Start listening automatically
    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-red-900/20 border border-red-500 rounded-lg ${className}`}>
        <p className="text-red-400 text-sm">
          Voice input is not supported in this browser. Please use Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleListening}
          className={`p-3 rounded-full transition-all ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? (
            <Mic className="w-5 h-5 text-white" />
          ) : (
            <MicOff className="w-5 h-5 text-gray-300" />
          )}
        </button>

        <div className="flex-1">
          <div className="text-xs text-gray-400 mb-1">
            {isListening ? '音声を認識中... (Listening...)' : '音声入力停止中 (Stopped)'}
          </div>
          <div className="text-sm text-white bg-gray-800 rounded px-3 py-2 min-h-[2.5rem]">
            {transcript || <span className="text-gray-500">日本語で話してください...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  }

  const SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }
}
