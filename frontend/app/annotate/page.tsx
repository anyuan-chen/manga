'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Link from 'next/link';

// Configure PDF.js worker (local file for reliability)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface Panel {
  id: string;
  chapterId: string;
  japaneseText: string;
  translation: string | null;
  orderIndex: number;
  pageNumber: number | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  autoDisqualify?: boolean;
  chapter: {
    id: string;
    title: string;
    filePath: string | null;
  };
}

interface LabeledPanel {
  id: string;
  orderIndex: number;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoundingBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export default function AnnotatePage() {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pageScale, setPageScale] = useState(1);
  const [saving, setSaving] = useState(false);
  const [labeledPanels, setLabeledPanels] = useState<LabeledPanel[]>([]);

  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const documentOptions = useMemo(() => ({
    cMapUrl: '/cmaps/',
    standardFontDataUrl: '/standard_fonts/',
    wasmUrl: '/wasm/',
  }), []);

  useEffect(() => {
    fetchUnlabeledPanels();
  }, []);

  async function fetchUnlabeledPanels() {
    try {
      const res = await fetch('/api/panels/unlabeled');
      const data = await res.json();
      setPanels(data.panels || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching panels:', error);
      setLoading(false);
    }
  }

  // Fetch labeled panels when current panel changes (to get panels for the same chapter)
  useEffect(() => {
    if (panels.length > 0 && panels[currentPanelIndex]) {
      fetchLabeledPanels(panels[currentPanelIndex].chapterId);
    }
  }, [panels, currentPanelIndex]);

  async function fetchLabeledPanels(chapterId: string) {
    try {
      const res = await fetch(`/api/panels/labeled?chapterId=${chapterId}`);
      const data = await res.json();
      setLabeledPanels(data.panels || []);
    } catch (error) {
      console.error('Error fetching labeled panels:', error);
    }
  }

  // Get labeled panels for the current page
  const currentPageLabeledPanels = useMemo(() => {
    return labeledPanels.filter(panel => panel.pageNumber === pageNumber - 1); // pageNumber is 1-indexed, panel.pageNumber is 0-indexed
  }, [labeledPanels, pageNumber]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function onPageLoadSuccess() {
    // Calculate scale after page loads
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

  const currentPanel = panels[currentPanelIndex];
  const pdfFile = currentPanel?.chapter.filePath
    ? `/data/chapters/${currentPanel.chapter.filePath}`
    : null;

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setBoundingBox({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !boundingBox || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setBoundingBox({
      ...boundingBox,
      endX: x,
      endY: y,
    });
  }

  function handleMouseUp() {
    setIsDrawing(false);
  }

  async function savePosition() {
    if (!boundingBox || !currentPanel) return;

    setSaving(true);

    // Convert canvas coordinates to PDF coordinates
    const x = Math.min(boundingBox.startX, boundingBox.endX) * pageScale;
    const y = Math.min(boundingBox.startY, boundingBox.endY) * pageScale;
    const width = Math.abs(boundingBox.endX - boundingBox.startX) * pageScale;
    const height = Math.abs(boundingBox.endY - boundingBox.startY) * pageScale;

    try {
      const res = await fetch('/api/panels/position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          panelId: currentPanel.id,
          pageNumber: pageNumber - 1, // 0-indexed
          x: Math.floor(x),
          y: Math.floor(y),
          width: Math.floor(width),
          height: Math.floor(height),
        }),
      });

      if (res.ok) {
        // Move to next panel
        setBoundingBox(null);
        if (currentPanelIndex < panels.length - 1) {
          setCurrentPanelIndex(currentPanelIndex + 1);
        } else {
          // Refresh the list
          await fetchUnlabeledPanels();
          setCurrentPanelIndex(0);
        }
      } else {
        console.error('Failed to save position');
      }
    } catch (error) {
      console.error('Error saving position:', error);
    } finally {
      setSaving(false);
    }
  }

  function skipPanel() {
    setBoundingBox(null);
    if (currentPanelIndex < panels.length - 1) {
      setCurrentPanelIndex(currentPanelIndex + 1);
    }
  }

  // Draw the bounding box on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding box if it exists
    if (boundingBox) {
      const x = Math.min(boundingBox.startX, boundingBox.endX);
      const y = Math.min(boundingBox.startY, boundingBox.endY);
      const width = Math.abs(boundingBox.endX - boundingBox.startX);
      const height = Math.abs(boundingBox.endY - boundingBox.startY);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(x, y, width, height);
    }
  }, [boundingBox]);

  // Update canvas size when page changes
  useEffect(() => {
    if (pageRef.current && canvasRef.current) {
      const pageElement = pageRef.current.querySelector('.react-pdf__Page');
      if (pageElement) {
        const canvas = pageElement.querySelector('canvas');
        if (canvas) {
          canvasRef.current.width = canvas.offsetWidth;
          canvasRef.current.height = canvas.offsetHeight;
        }
      }
    }
  }, [pageNumber, currentPanel]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black text-xl">Loading panels...</p>
      </div>
    );
  }

  if (!panels.length) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-black text-xl mb-4">No unlabeled panels found!</p>
        <Link
          href="/"
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Panel Annotation Tool</h1>
            <p className="text-gray-500">
              Panel {currentPanelIndex + 1} of {panels.length}
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200"
          >
            Home
          </Link>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Panel metadata */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-black mb-4">Panel Info</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Chapter</p>
                <p className="text-black font-medium">{currentPanel.chapter.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Index</p>
                <p className="text-black">{currentPanel.orderIndex}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Japanese Text</p>
                <p className="text-black break-words">{currentPanel.japaneseText}</p>
              </div>
              {currentPanel.translation && (
                <div>
                  <p className="text-sm text-gray-500">Translation</p>
                  <p className="text-black break-words">{currentPanel.translation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Center: PDF viewer */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="mb-4 text-center">
                <p className="text-black text-sm mb-2">
                  Draw a box around the panel on the page
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <button
                    onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                    disabled={pageNumber <= 1}
                    className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    ←
                  </button>
                  <span>
                    Page {pageNumber} of {numPages}
                  </span>
                  <button
                    onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
                    disabled={pageNumber >= numPages}
                    className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              </div>

              {pdfFile && (
                <div className="relative flex justify-center" ref={pageRef}>
                  <Document
                    file={pdfFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    options={documentOptions}
                  >
                    <div className="relative">
                      <Page
                        pageNumber={pageNumber}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onLoadSuccess={onPageLoadSuccess}
                      />
                      {/* Drawing canvas overlay */}
                      <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 cursor-crosshair"
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      />
                      {/* Labeled panels dots */}
                      {currentPageLabeledPanels.map((panel) => (
                        <button
                          key={panel.id}
                          className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white hover:bg-green-600 z-10 shadow-sm transition-transform hover:scale-110"
                          style={{
                            left: `${(panel.x + panel.width) / pageScale}px`,
                            top: `${(panel.y + panel.height) / pageScale}px`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Clicked panel:', panel.id);
                          }}
                          title={`Panel ${panel.orderIndex}`}
                        />
                      ))}
                    </div>
                  </Document>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={skipPanel}
                  className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300"
                >
                  Skip
                </button>
                <button
                  onClick={() => setBoundingBox(null)}
                  disabled={!boundingBox}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Box
                </button>
                <button
                  onClick={savePosition}
                  disabled={!boundingBox || saving}
                  className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save & Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
