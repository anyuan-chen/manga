'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  initialFile?: string;
}

export default function PDFViewer({ initialFile }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfFile, setPdfFile] = useState<string | null>(initialFile || null);

  useEffect(() => {
    if (initialFile) {
      setPdfFile(initialFile);
    }
  }, [initialFile]);

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
          <h1 className="text-2xl font-bold text-white mb-4">PDF Manga Reader</h1>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setPdfFile(URL.createObjectURL(file));
              }
            }}
            className="block w-full text-sm text-gray-300
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700
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

          <div className="flex items-center gap-4 bg-gray-800 px-6 py-3 rounded-lg">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <span className="text-white font-medium">
              Page {pageNumber} of {numPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>

          <button
            onClick={() => {
              setPdfFile(null);
              setPageNumber(1);
              setNumPages(0);
            }}
            className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Load Different PDF
          </button>
        </>
      )}
    </div>
  );
}
