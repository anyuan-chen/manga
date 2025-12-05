'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface GeneratedQuestion {
  type: 'word' | 'grammar' | 'reading_comprehension';
  conceptId?: string;
  conceptType?: 'word' | 'grammar';
  question: string;
  options: string[];
  correctAnswer: number;
}

interface PanelQuestionModalProps {
  panelId: string;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

export default function PanelQuestionModal({ panelId, isOpen, onClose, position }: PanelQuestionModalProps) {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // Calculate popover position
  useEffect(() => {
    if (isOpen) {
      const modalWidth = 400;
      const modalMaxHeight = 600;
      const offset = 20;

      let left = position.x + offset;
      let top = position.y + offset;

      // Adjust if too far right
      if (left + modalWidth > window.innerWidth) {
        left = position.x - modalWidth - offset;
      }

      // Adjust if too far down
      if (top + modalMaxHeight > window.innerHeight) {
        top = Math.max(20, window.innerHeight - modalMaxHeight - 20);
      }

      // Ensure minimum distance from edges
      left = Math.max(20, Math.min(left, window.innerWidth - modalWidth - 20));
      top = Math.max(20, top);

      setPopoverStyle({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        transformOrigin: `${position.x - left}px ${position.y - top}px`,
      });
    }
  }, [isOpen, position]);

  // Fetch questions when modal opens
  useEffect(() => {
    if (isOpen && panelId) {
      fetchQuestions();
    }
  }, [isOpen, panelId]);

  // Reset state when moving to next question
  useEffect(() => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/panels/${panelId}/questions`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch questions');
      }

      if (!data.shouldAsk) {
        setError(data.skipReason || 'No questions available for this panel');
        setQuestions([]);
      } else {
        setQuestions(data.questions || []);
        setCurrentQuestionIndex(0);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (answerIndex: number) => {
    if (showFeedback || selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    const currentQuestion = questions[currentQuestionIndex];
    const correct = answerIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Post answer to API
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    try {
      await fetch('/api/panels/questions/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionType: currentQuestion.type,
          conceptId: currentQuestion.conceptId,
          conceptType: currentQuestion.conceptType,
          selectedAnswer: answerIndex,
          correctAnswer: currentQuestion.correctAnswer,
          timeSpent,
        }),
      });
    } catch (err) {
      console.error('Error posting answer:', err);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions completed
      handleClose();
    }
  };

  const handleClose = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-30"
        onClick={handleClose}
      />

      {/* Popover */}
      <div
        className="z-50 bg-white rounded-lg shadow-2xl w-[400px] max-h-[600px] overflow-y-auto animate-in fade-in zoom-in duration-200"
        style={popoverStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-sm font-semibold text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading questions...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {!loading && !error && currentQuestion && (
            <div>
              {/* Question Type Badge */}
              <div className="mb-3">
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {currentQuestion.type === 'word' && 'Vocabulary'}
                  {currentQuestion.type === 'grammar' && 'Grammar'}
                  {currentQuestion.type === 'reading_comprehension' && 'Reading Comprehension'}
                </span>
              </div>

              {/* Question Text */}
              <p className="text-base font-medium text-gray-900 mb-4">
                {currentQuestion.question}
              </p>

              {/* Answer Options */}
              <div className="space-y-2 mb-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectAnswer = index === currentQuestion.correctAnswer;

                  let buttonClass = 'w-full text-left p-3 rounded-md border-2 transition-all text-sm ';

                  if (!showFeedback) {
                    buttonClass += isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white';
                  } else {
                    if (isCorrectAnswer) {
                      buttonClass += 'border-green-500 bg-green-50';
                    } else if (isSelected && !isCorrectAnswer) {
                      buttonClass += 'border-red-500 bg-red-50';
                    } else {
                      buttonClass += 'border-gray-200 bg-gray-50';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showFeedback}
                      className={buttonClass}
                    >
                      <div className="flex items-center">
                        <span className="font-medium mr-2 text-gray-600 text-xs">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="text-gray-900">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {showFeedback && (
                <div className={`p-3 rounded-md mb-3 text-sm ${isCorrect ? 'bg-green-100 border border-green-500' : 'bg-red-100 border border-red-500'}`}>
                  <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  {!isCorrect && (
                    <p className="text-xs text-gray-700 mt-1">
                      Correct: {String.fromCharCode(65 + currentQuestion.correctAnswer)}. {currentQuestion.options[currentQuestion.correctAnswer]}
                    </p>
                  )}
                </div>
              )}

              {/* Next Button */}
              {showFeedback && (
                <button
                  onClick={handleNext}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
