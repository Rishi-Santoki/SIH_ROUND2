import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface Question {
  question_id: string;
  assessment_id: string;
  question: string;
  question_type: string;
  options: any; // array or object of options
  marks: number;
  difficulty?: string;
}

export function StudentAssessmentTake() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 mins default
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  // Initialize assessment: start attempt and fetch questions
  useEffect(() => {
    let isMounted = true;
    async function initAssessment() {
      if (!assessmentId) return;
      try {
        setIsLoading(true);
        // 1. Start attempt (or get existing in-progress attempt)
        await apiClient.post(`/student/assessments/${assessmentId}/start`);
        
        // 2. Fetch real questions (no correct answers in payload)
        const qList = await apiClient.get<Question[]>(`/student/assessments/${assessmentId}/questions`);
        if (isMounted) {
          if (qList && qList.length > 0) {
            setQuestions(qList);
          } else {
            // Fallback questions if none configured in db
            setQuestions([
              {
                question_id: 'q_default_1',
                assessment_id: assessmentId,
                question: 'Which of the following is an immutable sequence data type in Python?',
                question_type: 'mcq',
                options: ['List', 'Dictionary', 'Tuple', 'Set'],
                marks: 10
              },
              {
                question_id: 'q_default_2',
                assessment_id: assessmentId,
                question: 'What is the time complexity of looking up a key in a standard hash table on average?',
                question_type: 'mcq',
                options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
                marks: 10
              }
            ]);
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setLoadError(err.message || 'Failed to start assessment. Please try again.');
          setIsLoading(false);
        }
      }
    }

    initAssessment();
    return () => { isMounted = false; };
  }, [assessmentId]);

  // Timer countdown
  useEffect(() => {
    if (isLoading || submissionResult) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAnswers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading, submissionResult]);

  const submitMutation = useApiMutation({
    mutationFn: async (payload: { answers: { question_id: string; submitted_answer: string }[] }) => {
      return await apiClient.post(`/student/assessments/${assessmentId}/submit`, payload);
    },
    invalidateQueries: [
      ['student', 'assessments'],
      ['student', 'assessments', 'results'],
      ['student', 'skills'],
      ['student', 'readiness']
    ],
    onSuccess: (data) => {
      setSubmissionResult(data);
    }
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (qId: string, optionValue: string) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionValue }));
  };

  const handleSubmitAnswers = () => {
    const formattedAnswers = questions.map(q => ({
      question_id: q.question_id,
      submitted_answer: selectedAnswers[q.question_id] || ''
    }));
    submitMutation.mutate({ answers: formattedAnswers });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1);
    } else {
      handleSubmitAnswers();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="bg-white border border-hairline p-8 rounded-sm text-center max-w-sm w-full shadow-sm">
          <div className="h-8 w-8 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="font-serif font-bold text-ink">Starting Secure Assessment</h3>
          <p className="text-xs text-slate mt-2">Loading verified questions from ProofLedger ledger...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="bg-white border border-alert-rust/20 p-8 rounded-sm text-center max-w-md w-full shadow-sm">
          <AlertCircle className="h-10 w-10 text-alert-rust mx-auto mb-4" />
          <h3 className="font-serif font-bold text-ink text-lg">Unable to Load Assessment</h3>
          <p className="text-sm text-slate mt-2 mb-6">{loadError}</p>
          <button
            onClick={() => navigate('/student/assessments')}
            className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            Return to Assessments
          </button>
        </div>
      </div>
    );
  }

  // Submission Complete Screen
  if (submissionResult) {
    const score = submissionResult.score ?? 0;
    const percentage = Math.round(submissionResult.percentage ?? 0);
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="bg-white border border-hairline p-8 rounded-sm text-center max-w-md w-full shadow-lg">
          <div className="h-14 w-14 rounded-full bg-growth-teal/10 flex items-center justify-center mx-auto mb-4 text-growth-teal">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-ink mb-2">Assessment Submitted!</h2>
          <p className="text-sm text-slate mb-6">
            {submissionResult.message || 'Your submission has been evaluated and recorded onto your proof ledger.'}
          </p>
          
          <div className="bg-paper p-4 rounded-sm border border-hairline mb-6 flex justify-around">
            <div>
              <span className="block text-xs font-bold text-slate uppercase tracking-wider">Score</span>
              <span className="text-2xl font-serif font-bold text-ink">{score}</span>
            </div>
            <div className="border-r border-hairline" />
            <div>
              <span className="block text-xs font-bold text-slate uppercase tracking-wider">Percentage</span>
              <span className="text-2xl font-serif font-bold text-growth-teal">{percentage}%</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/student/assessments')}
            className="w-full bg-ink text-paper py-3 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            View Results & Proof Ledger
          </button>
        </div>
      </div>
    );
  }

  const activeQ = questions[currentQuestion];
  const currentAnswer = selectedAnswers[activeQ?.question_id] || '';

  // Parse options if stored as array or strings
  const optionsList: string[] = Array.isArray(activeQ.options) 
    ? activeQ.options.map(opt => typeof opt === 'string' ? opt : (opt.text || JSON.stringify(opt)))
    : (typeof activeQ.options === 'object' && activeQ.options !== null ? Object.values(activeQ.options) : ['Option A', 'Option B', 'Option C', 'Option D']);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Focused Header */}
      <header className="h-16 bg-white border-b border-hairline px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 font-serif font-bold text-ink">
           <ShieldCheck className="h-6 w-6" />
           <span className="hidden sm:inline">ProofLedger Secure Assessment</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 font-bold px-3 py-1 rounded-sm border",
            timeLeft < 300 ? "bg-alert-rust/10 text-alert-rust border-alert-rust/20" : "bg-slate/10 text-ink border-slate/20"
          )}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to exit? Your progress will be lost.")) {
                navigate('/student/assessments');
              }
            }}
            className="text-sm font-medium text-slate hover:text-alert-rust transition-colors"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12 flex flex-col">
        
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-slate uppercase tracking-wider mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="w-full h-2 bg-slate/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-ink transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-hairline rounded-sm p-8 shadow-sm flex-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate uppercase tracking-wider">
              Question {currentQuestion + 1} ({activeQ.marks} Marks)
            </span>
          </div>

          <h2 className="text-xl font-medium text-ink leading-relaxed mb-8">
            {activeQ.question}
          </h2>
          
          <div className="space-y-3">
            {optionsList.map((optText, optIdx) => {
              const isSelected = currentAnswer === optText;
              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(activeQ.question_id, optText)}
                  className={cn(
                    "w-full text-left p-4 rounded-sm border transition-all",
                    isSelected 
                      ? "border-ink bg-ink/5 ring-1 ring-ink" 
                      : "border-hairline hover:border-slate/40 hover:bg-slate/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-5 w-5 rounded-full border flex items-center justify-center shrink-0",
                      isSelected ? "border-ink border-[6px]" : "border-slate/30"
                    )} />
                    <span className={cn("text-base", isSelected ? "text-ink font-medium" : "text-slate")}>
                      {optText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate text-xs font-medium">
            <AlertTriangle className="h-4 w-4" /> 
            Proctoring active. Responses recorded directly.
          </div>
          
          <div className="flex items-center gap-4">
            {currentQuestion > 0 && (
              <button
                type="button"
                onClick={() => setCurrentQuestion(c => c - 1)}
                className="px-4 py-2.5 text-sm text-slate hover:text-ink font-medium"
              >
                Previous
              </button>
            )}
            <button
              disabled={!currentAnswer || submitMutation.isPending}
              onClick={handleNext}
              className="bg-ink text-paper px-8 py-3 rounded-sm font-medium hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {submitMutation.isPending ? 'Submitting...' : (
                currentQuestion === questions.length - 1 ? 'Submit Assessment' : 'Next Question'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
