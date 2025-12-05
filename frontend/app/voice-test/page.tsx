'use client';

import { useState } from 'react';
import Link from 'next/link';
import VoiceInput from '@/components/VoiceInput';

export default function VoiceTestPage() {
  const [transcripts, setTranscripts] = useState<string[]>([]);

  const handleTranscript = (transcript: string) => {
    console.log('Transcript received:', transcript);
    setTranscripts(prev => [...prev, transcript]);
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-gray-500 hover:text-black transition-colors"
          >
            ← Back to Library
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-black mb-4 text-center">
          Voice Input Test
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Test Japanese voice transcription
        </p>

        <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
          <VoiceInput onTranscript={handleTranscript} />

          {transcripts.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black">
                  Transcript History ({transcripts.length})
                </h2>
                <button
                  onClick={() => setTranscripts([])}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-600 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transcripts.map((transcript, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-gray-600 bg-white rounded px-4 py-3 border border-gray-200"
                  >
                    <div className="text-xs text-gray-400 mb-1">
                      #{transcripts.length - idx}
                    </div>
                    {transcript}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-black mb-3">
            How to use:
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• The microphone starts automatically when the page loads</li>
            <li>• Speak in Japanese to see real-time transcription</li>
            <li>• Final transcripts appear in the history below</li>
            <li>• Works best in Chrome or Edge browsers</li>
            <li>• Click the microphone button to pause/resume</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
