'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PDF {
  name: string;
  path: string;
}

interface ReviewStatus {
  hasMistakes: boolean;
  totalCount?: number;
  examples?: {
    words: Array<{ japanese: string; reading?: string; meaning: string }>;
    grammar: Array<{ name: string; pattern: string }>;
  };
}

export default function Home() {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);

  // TODO: Replace with actual user ID from auth system
  const userId = 'test-user-id';

  useEffect(() => {
    // Fetch PDFs
    fetch('/api/pdfs')
      .then(res => res.json())
      .then(data => {
        setPdfs(data.pdfs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching PDFs:', err);
        setError('Failed to load PDFs');
        setLoading(false);
      });

    // Fetch review status
    fetch(`/api/review/check?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setReviewStatus(data);
      })
      .catch(err => {
        console.error('Error fetching review status:', err);
      });
  }, [userId]);

  // Generate enticing review message
  const getReviewMessage = () => {
    if (!reviewStatus?.hasMistakes || !reviewStatus.examples) return '';

    const { words, grammar } = reviewStatus.examples;
    const parts: string[] = [];

    if (words.length > 0) {
      const wordText = words[0].japanese;
      parts.push(wordText);
    }

    if (grammar.length > 0) {
      const grammarText = grammar[0].pattern;
      parts.push(grammarText);
    }

    return parts.join(' and ');
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Manga Library
        </h1>

        {/* Review Banner */}
        {reviewStatus?.hasMistakes && (
          <Link href="/review">
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-900 to-blue-900 border border-purple-500 rounded-lg hover:from-purple-800 hover:to-blue-800 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Ready to review your mistakes?
                  </h2>
                  <p className="text-purple-200">
                    Practice and master <span className="font-bold text-white">{getReviewMessage()}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {reviewStatus.totalCount}
                    </div>
                    <div className="text-sm text-purple-200">
                      {reviewStatus.totalCount === 1 ? 'mistake' : 'mistakes'}
                    </div>
                  </div>
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        )}

        {loading && (
          <p className="text-center text-gray-400">Loading PDFs...</p>
        )}

        {error && (
          <p className="text-center text-red-400">{error}</p>
        )}

        {!loading && !error && pdfs.length === 0 && (
          <div className="text-center text-gray-400">
            <p className="mb-4">No PDFs found in the library.</p>
            <p className="text-sm">
              Add PDF files to <code className="bg-gray-800 px-2 py-1 rounded">public/data/chapters/</code>
            </p>
          </div>
        )}

        {!loading && pdfs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pdfs.map((pdf) => (
              <Link
                key={pdf.path}
                href={`/reader?file=${encodeURIComponent(pdf.path)}`}
                className="block p-6 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 hover:border-blue-500"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-8 h-8 text-red-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-white truncate">
                      {pdf.name.replace('.pdf', '')}
                    </h2>
                    <p className="text-sm text-gray-400">PDF Document</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
