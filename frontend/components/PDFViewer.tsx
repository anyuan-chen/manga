'use client';

import { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker - using local file matching react-pdf's bundled version
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerProps {
  initialFile?: string;
}

export default function PDFViewer({ initialFile }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfFile, setPdfFile] = useState<string | null>(initialFile || null);

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
