'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Mic, MicOff } from 'lucide-react';
import PanelQuestionModal from './PanelQuestionModal';

// Configure PDF.js worker - using local file matching react-pdf's bundled version
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Japanese voice commands
const NEXT_COMMANDS = ['次', 'つぎ', 'ツギ', '次へ', 'つぎへ'];
const BACK_COMMANDS = ['戻る', 'もどる', 'モドル', '前', 'まえ', 'マエ', '前へ', 'まえへ'];

interface PDFViewerProps {
  initialFile: string;
  chapterId: string | null;
}

interface Panel {
  id: string;
  orderIndex: number;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function PDFViewer({ initialFile, chapterId }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  // Voice Control State (Upstream)
  const [pdfFile, setPdfFile] = useState<string | null>(initialFile || null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [lastCommand, setLastCommand] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const numPagesRef = useRef(numPages);
  const intentionalStopRef = useRef(false);

  // Panel State (Stashed)
  const [panels, setPanels] = useState<Panel[]>([]);
  const [pageScale, setPageScale] = useState(1);
  const pageRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Keep ref in sync with state
  useEffect(() => {
    numPagesRef.current = numPages;
  }, [numPages]);

  // Fetch Panels
  useEffect(() => {
    if (chapterId) {
      fetch(`/api/panels/labeled?chapterId=${chapterId}`)
        .then(res => res.json())
        .then(data => {
          if (data.panels) {
            setPanels(data.panels);
          }
        })
        .catch(err => console.error('Error fetching panels:', err));
    }
  }, [chapterId]);

  const currentPagePanels = useMemo(() => {
    return panels.filter(p => p.pageNumber === pageNumber - 1);
  }, [panels, pageNumber]);

  function onPageLoadSuccess() {
    if (pageRef.current) {
      const pageElement = pageRef.current.querySelector('.react-pdf__Page');
      if (pageElement) {
        const canvas = pageElement.querySelector('canvas');
        if (canvas) {
          setPageScale(canvas.width / canvas.offsetWidth);
        }
      }
    }
  }

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
      <div className="relative mb-4">
        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex justify-center"
          options={documentOptions}
        >
          <div className="relative" ref={pageRef}>
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-2xl"
              onLoadSuccess={onPageLoadSuccess}
            />
            {currentPagePanels.map((panel) => (
              <div
                key={panel.id}
                className="absolute w-3 h-3 bg-blue-500 rounded-full border border-white cursor-pointer hover:bg-blue-600 z-20 shadow-sm transition-transform hover:scale-125"
                style={{
                  left: `${(panel.x + panel.width) / pageScale}px`,
                  top: `${(panel.y + panel.height) / pageScale}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  setModalPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                  });
                  setSelectedPanelId(panel.id);
                  setIsModalOpen(true);
                }}
                title={`Panel ${panel.orderIndex}`}
              />
            ))}
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

      {/* Question Modal */}
      {selectedPanelId && (
        <PanelQuestionModal
          panelId={selectedPanelId}
          isOpen={isModalOpen}
          position={modalPosition}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPanelId(null);
          }}
        />
      )}
    </div>
  );
}
