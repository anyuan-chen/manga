'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface PDF {
  id: string;
  name: string;
  description: string | null;
  path: string | null;
  orderIndex: number;
  stats: {
    predictedJlptLevel: number | null;
    uniqueWordsCount: number | null;
    uniqueGrammarCount: number | null;
    panelCount: number | null;
    totalCharacters: number | null;
    avgJlptWords: number | null;
    avgJlptGrammar: number | null;
  };
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
    fetch(`/api/review/check`)
      .then(res => res.json())
      .then(data => {
        setReviewStatus(data);
      })
      .catch(err => {
        console.error('Error fetching review status:', err);
      });
  }, []);

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
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="py-12 px-4">
        <main className="max-w-4xl mx-auto">
        {/* Review Banner */}
        {reviewStatus?.hasMistakes && (
          <Link href="/review">
            <div className="mb-8 p-6 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300 rounded-lg hover:from-gray-50 hover:to-white transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-black mb-2">
                    Ready to review your mistakes?
                  </h2>
                  <p className="text-gray-600">
                    Practice and master <span className="font-bold text-black">{getReviewMessage()}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-black">
                      {reviewStatus.totalCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      {reviewStatus.totalCount === 1 ? 'mistake' : 'mistakes'}
                    </div>
                  </div>
                  <svg
                    className="w-6 h-6 text-black"
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
          <p className="text-center text-gray-500">Loading PDFs...</p>
        )}

        {error && (
          <p className="text-center text-red-600">{error}</p>
        )}

        {!loading && !error && pdfs.length === 0 && (
          <div className="text-center text-gray-500">
            <p className="mb-4">No PDFs found in the library.</p>
            <p className="text-sm">
              Add PDF files to <code className="bg-gray-100 px-2 py-1 rounded">public/data/chapters/</code>
            </p>
          </div>
        )}

        {!loading && pdfs.length > 0 && (
          <div className="flex flex-col gap-4">
            {pdfs.filter(pdf => pdf.path).map((pdf) => {
              const jlptLevel = pdf.stats?.predictedJlptLevel ? Math.round(pdf.stats.predictedJlptLevel) : null;
              const jlptLabel = jlptLevel ? `N${jlptLevel}` : 'N/A';

              return (
                <Link
                  key={pdf.id}
                  href={`/reader?file=${encodeURIComponent(pdf.path!)}&chapterId=${pdf.id}`}
                  className="block p-6 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-black"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-black truncate">
                        {pdf.name}
                      </h2>
                      {pdf.description && (
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {pdf.description}
                        </p>
                      )}
                    </div>

                    {/* JLPT Level Badge */}
                    {jlptLevel && (
                      <div className="flex-shrink-0 px-3 py-1 bg-black text-white text-sm font-semibold rounded">
                        {jlptLabel}
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  {(pdf.stats?.panelCount || pdf.stats?.uniqueWordsCount || pdf.stats?.uniqueGrammarCount) && (
                    <div className="flex gap-6 mt-4 text-sm text-gray-600">
                      {pdf.stats.panelCount && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-black">{pdf.stats.panelCount}</span>
                          <span>panels</span>
                        </div>
                      )}
                      {pdf.stats.uniqueWordsCount && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-black">{pdf.stats.uniqueWordsCount}</span>
                          <span>words</span>
                        </div>
                      )}
                      {pdf.stats.uniqueGrammarCount && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-black">{pdf.stats.uniqueGrammarCount}</span>
                          <span>grammar patterns</span>
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
