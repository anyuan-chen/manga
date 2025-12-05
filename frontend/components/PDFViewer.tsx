'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Mic, MicOff } from 'lucide-react';

// Configure PDF.js worker - using local file matching react-pdf's bundled version
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Japanese voice commands
const NEXT_COMMANDS = ['次', 'つぎ', 'ツギ', '次へ', 'つぎへ'];
const BACK_COMMANDS = ['戻る', 'もどる', 'モドル', '前', 'まえ', 'マエ', '前へ', 'まえへ'];

interface PDFViewerProps {
  initialFile?: string;
}

export default function PDFViewer({ initialFile }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfFile, setPdfFile] = useState<string | null>(initialFile || null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [lastCommand, setLastCommand] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const numPagesRef = useRef(numPages);
  const intentionalStopRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    numPagesRef.current = numPages;
  }, [numPages]);

  const documentOptions = useMemo(() => ({
    cMapUrl: '/cmaps/',
    standardFontDataUrl: '/standard_fonts/',
    wasmUrl: '/wasm/',
  }), []);

  useEffect(() => {
    if (initialFile) {
      setPdfFile(initialFile);
    }
  }, [initialFile]);

  // Voice command handler
  const handleVoiceCommand = useCallback((transcript: string) => {
    const normalizedTranscript = transcript.trim().toLowerCase();
    
    // Check for next commands
    if (NEXT_COMMANDS.some(cmd => normalizedTranscript.includes(cmd.toLowerCase()))) {
      setPageNumber((prev) => Math.min(prev + 1, numPagesRef.current));
      setLastCommand(`次へ → Page ${Math.min(pageNumber + 1, numPagesRef.current)}`);
      return;
    }
    
    // Check for back commands
    if (BACK_COMMANDS.some(cmd => normalizedTranscript.includes(cmd.toLowerCase()))) {
      setPageNumber((prev) => Math.max(prev - 1, 1));
      setLastCommand(`戻る → Page ${Math.max(pageNumber - 1, 1)}`);
      return;
    }
  }, [pageNumber]);

  // Initialize voice recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // Only get final results for commands
    recognition.lang = 'ja-JP';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          console.log('Voice command:', transcript);
          handleVoiceCommand(transcript);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore expected errors when stopping/restarting
      if (event.error === 'aborted' || event.error === 'no-speech' || event.error === 'audio-capture') {
        return;
      }
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Only auto-restart if we didn't intentionally stop
      if (recognitionRef.current && !intentionalStopRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          // Ignore errors when trying to restart
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [handleVoiceCommand]);

  const toggleVoiceControl = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      intentionalStopRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
      setLastCommand('');
    } else {
      intentionalStopRef.current = false;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function goToPrevPage() {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }

  function goToNextPage() {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {!pdfFile ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">PDF Manga Reader</h1>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setPdfFile(URL.createObjectURL(file));
              }
            }}
            className="block w-full text-sm text-gray-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-black file:text-white
              hover:file:bg-gray-800
              cursor-pointer"
          />
        </div>
      ) : (
        <>
          <div className="relative mb-4">
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              className="flex justify-center"
              options={documentOptions}
            >
              <div className="relative">
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-2xl"
                />
                {/* SVG overlay container for future panel masking */}
                <svg
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 10 }}
                >
                  {/* Future: Add SVG filters and masks here to reveal specific panels */}
                </svg>
              </div>
            </Document>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4 bg-gray-100 px-6 py-3 rounded-lg">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="text-black font-medium">
                Page {pageNumber} of {numPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>

              {voiceSupported && (
                <button
                  onClick={toggleVoiceControl}
                  className={`p-2 rounded-full transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  title={isListening ? '音声認識停止 (Stop voice control)' : '音声認識開始 (Start voice control)'}
                >
                  {isListening ? (
                    <Mic className="w-5 h-5 text-white" />
                  ) : (
                    <MicOff className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              )}
            </div>

            {/* Voice control feedback */}
            {isListening && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span>🎤 Say 「次」 or 「前」 / 「戻る」</span>
                {lastCommand && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                    {lastCommand}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setPdfFile(null);
              setPageNumber(1);
              setNumPages(0);
            }}
            className="mt-4 px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 transition-colors"
          >
            Load Different PDF
          </button>
        </>
      )}
    </div>
  );
}
