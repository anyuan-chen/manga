'use client';

import dynamic from 'next/dynamic';
import { useSearchParams, redirect } from 'next/navigation';
import { Suspense } from 'react';

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-black">Loading PDF viewer...</p>
    </div>
  ),
});

function ReaderContent() {
  const searchParams = useSearchParams();
  const file = searchParams.get('file');

  if (!file) {
    redirect('/');
  }

  const chapterId = searchParams.get('chapterId');
  
  return (
    <main className="min-h-screen bg-white">
      <PDFViewer initialFile={file} chapterId={chapterId} />
    </main>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black">Loading...</p>
      </div>
    }>
      <ReaderContent />
    </Suspense>
  );
}
