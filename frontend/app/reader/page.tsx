'use client';

import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white">Loading PDF viewer...</p>
    </div>
  ),
});

export default function ReaderPage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <PDFViewer />
    </main>
  );
}
