'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReviewItem {
  type: 'word' | 'grammar';
  topicInfo: {
    japanese?: string;
    reading?: string;
    meaning?: string;
    partOfSpeech?: string;
    name?: string;
    pattern?: string;
    explanation?: string;
    jlptLevel?: number;
    options: string[];
    correctAnswer: number;
  };
  attemptId: string;
  createdAt: string;
}

export default function ReviewPage() {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  // TODO: Replace with actual user ID from auth system
  const userId = 'test-user-id';

  useEffect(() => {
    fetch(`/api/review?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setReviewItems(data.reviewItems || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching review items:', err);
        setError('Failed to load review questions');
        setLoading(false);
      });
  }, []);

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === reviewItems[currentIndex].topicInfo.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }

    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < reviewItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-gray-400">Loading review questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (reviewItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            Review Practice
          </h1>
          <div className="text-center text-gray-400">
            <p className="mb-4">No mistakes to review yet!</p>
            <p className="text-sm mb-6">
              Complete some chapters to build your review queue.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go to Library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = reviewItems[currentIndex];
  const isComplete = currentIndex === reviewItems.length - 1 && showResult;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Library
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Review Practice
        </h1>

        {!isComplete ? (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Question {currentIndex + 1} of {reviewItems.length}</span>
                <span>Score: {score}/{reviewItems.length}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / reviewItems.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Topic Info */}
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              {currentItem.type === 'word' ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                      Word
                    </span>
                    {currentItem.topicInfo.jlptLevel && (
                      <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                        JLPT N{currentItem.topicInfo.jlptLevel}
                      </span>
                    )}
                  </div>
                  <div className="text-3xl text-white mb-2">
                    {currentItem.topicInfo.japanese}
                  </div>
                  <div className="text-lg text-gray-300 mb-1">
                    {currentItem.topicInfo.reading}
                  </div>
                  <div className="text-gray-400">
                    {currentItem.topicInfo.meaning}
                    {currentItem.topicInfo.partOfSpeech && (
                      <span className="ml-2 text-sm">({currentItem.topicInfo.partOfSpeech})</span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                      Grammar
                    </span>
                    {currentItem.topicInfo.jlptLevel && (
                      <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                        JLPT N{currentItem.topicInfo.jlptLevel}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl text-white mb-2">
                    {currentItem.topicInfo.name}
                  </div>
                  <div className="text-lg text-gray-300 mb-2">
                    {currentItem.topicInfo.pattern}
                  </div>
                  <div className="text-sm text-gray-400">
                    {currentItem.topicInfo.explanation}
                  </div>
                </div>
              )}
            </div>

            {/* Question */}
            <div className="mb-6">
              <h2 className="text-xl text-white mb-4">
                Choose the correct answer:
              </h2>
              <div className="space-y-3">
                {currentItem.topicInfo.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === currentItem.topicInfo.correctAnswer;
                  const showCorrectness = showResult;

                  let buttonClass = 'w-full text-left p-4 rounded-lg border transition-colors ';
                  if (showCorrectness) {
                    if (isCorrect) {
                      buttonClass += 'bg-green-600 border-green-500 text-white';
                    } else if (isSelected) {
                      buttonClass += 'bg-red-600 border-red-500 text-white';
                    } else {
                      buttonClass += 'bg-gray-700 border-gray-600 text-gray-300';
                    }
                  } else {
                    if (isSelected) {
                      buttonClass += 'bg-blue-600 border-blue-500 text-white';
                    } else {
                      buttonClass += 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={buttonClass}
                      disabled={showResult}
                    >
                      <div className="flex items-center">
                        <span className="font-bold mr-3">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              {!showResult ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedAnswer === null}
                  className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                    selectedAnswer === null
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {currentIndex < reviewItems.length - 1 ? 'Next Question' : 'See Results'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Review Complete!
            </h2>
            <div className="text-6xl font-bold text-blue-400 mb-6">
              {score}/{reviewItems.length}
            </div>
            <p className="text-xl text-gray-300 mb-8">
              {score === reviewItems.length
                ? 'Perfect score! Great job!'
                : score >= reviewItems.length * 0.7
                ? 'Good work! Keep practicing!'
                : 'Keep studying! You\'ll get there!'}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleRestart}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Practice Again
              </button>
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Back to Library
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
