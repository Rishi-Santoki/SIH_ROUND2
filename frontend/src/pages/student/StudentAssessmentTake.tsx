import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

// This runs outside the DashboardShell for focus
export function StudentAssessmentTake() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 mins
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Note: Backend response should NEVER contain the correct answer. 
  // We mock a strict structure here.
  const questions = [
    {
      id: 'q1',
      text: "Which SQL window function assigns a unique sequential integer to rows within a partition of a result set?",
      options: [
        { id: 1, text: "RANK()" },
        { id: 2, text: "DENSE_RANK()" },
        { id: 3, text: "ROW_NUMBER()" },
        { id: 4, text: "NTILE()" }
      ]
    },
    {
      id: 'q2',
      text: "In a CTE (Common Table Expression), what keyword is used to make it recursive?",
      options: [
        { id: 1, text: "RECURSIVE" },
        { id: 2, text: "REPEAT" },
        { id: 3, text: "LOOP" },
        { id: 4, text: "ITERATE" }
      ]
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1);
      setSelectedAnswer(null);
    } else {
      // Submit flow
      alert("Assessment Submitted! Evaluating on backend...");
      navigate('/student/assessments');
    }
  };

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
            <span>{Math.round(((currentQuestion) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="w-full h-2 bg-slate/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-ink transition-all duration-300"
              style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-hairline rounded-sm p-8 shadow-sm flex-1">
          <h2 className="text-xl font-medium text-ink leading-relaxed mb-8">
            {questions[currentQuestion].text}
          </h2>
          
          <div className="space-y-3">
            {questions[currentQuestion].options.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelectedAnswer(opt.id)}
                className={cn(
                  "w-full text-left p-4 rounded-sm border transition-all",
                  selectedAnswer === opt.id 
                    ? "border-ink bg-ink/5 ring-1 ring-ink" 
                    : "border-hairline hover:border-slate/40 hover:bg-slate/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-5 w-5 rounded-full border flex items-center justify-center shrink-0",
                    selectedAnswer === opt.id ? "border-ink border-[6px]" : "border-slate/30"
                  )} />
                  <span className={cn("text-base", selectedAnswer === opt.id ? "text-ink font-medium" : "text-slate")}>
                    {opt.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate text-xs font-medium">
            <AlertTriangle className="h-4 w-4" /> 
            Proctoring active. Do not switch tabs.
          </div>
          <button
            disabled={selectedAnswer === null}
            onClick={handleNext}
            className="bg-ink text-paper px-8 py-3 rounded-sm font-medium hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {currentQuestion === questions.length - 1 ? 'Submit Assessment' : 'Next Question'}
          </button>
        </div>
      </main>
    </div>
  );
}
