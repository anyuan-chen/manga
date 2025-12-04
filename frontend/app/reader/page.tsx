'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white">Loading PDF viewer...</p>
    </div>
  ),
});

function ReaderContent() {
  const searchParams = useSearchParams();
  const file = searchParams.get('file');

  return (
    <main className="min-h-screen bg-gray-900">
      <PDFViewer initialFile={file || undefined} />
    </main>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    }>
      <ReaderContent />
    </Suspense>
  );
}
