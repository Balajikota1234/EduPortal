import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Clock, CheckSquare, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Card, LoadingScreen, Modal } from "@/components/ui";
import { useStudentTestDetails, useSubmitTest } from "@/hooks/use-student";
import { useToast } from "@/hooks/use-toast";

export default function TakeTest() {
  const [, params] = useRoute("/student/tests/:id");
  const testId = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading } = useStudentTestDetails(testId);
  const submitMutation = useSubmitTest();

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [showNavigator, setShowNavigator] = useState(false);

  useEffect(() => {
    if (data?.test && timeLeft === null) {
      setTimeLeft(data.test.duration * 60);
    }
  }, [data, timeLeft]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !submitMutation.isPending) {
      handleSubmit(true);
    }
  }, [timeLeft]);

  if (isLoading || !data) return <LoadingScreen />;

  const { test, questions } = data;
  const q = questions[activeQuestion];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  const handleSelect = (questionId: number, optionIndex: number) => {
    setAnswers(prev => {
      const current = prev[questionId.toString()];
      if (current === optionIndex) {
        const next = { ...prev };
        delete next[questionId.toString()];
        return next;
      }
      return { ...prev, [questionId.toString()]: optionIndex };
    });
  };

  const handleSubmit = (auto = false) => {
    if (submitMutation.isPending) return;
    if (unansweredCount > 0 && !auto) {
      setIsConfirmOpen(true);
      return;
    }
    performSubmit();
  };

  const performSubmit = () => {
    const timeTaken = (test.duration * 60) - (timeLeft || 0);
    submitMutation.mutate({ id: test.id, answers, timeTaken }, {
      onSuccess: () => {
        toast({ title: "Test Submitted", description: "Your answers have been recorded successfully." });
        setLocation("/student");
      }
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isWarning = timeLeft !== null && timeLeft < 300;

  const getQuestionStatus = (idx: number) => {
    const qId = questions[idx]?.id.toString();
    return answers[qId] !== undefined ? "answered" : "unanswered";
  };

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/60 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-display font-bold truncate">{test.title}</h1>
            <p className="text-xs text-muted-foreground">
              {activeQuestion + 1}/{questions.length} · {answeredCount} answered
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl ${isWarning ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground"}`}>
              <Clock size={16} />
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </div>
            {/* Navigator toggle on mobile */}
            <button
              onClick={() => setShowNavigator(v => !v)}
              className="sm:hidden px-3 py-1.5 rounded-xl bg-secondary text-xs font-semibold text-muted-foreground hover:bg-secondary/80"
            >
              Grid
            </button>
            <Button
              onClick={() => handleSubmit(false)}
              loading={submitMutation.isPending}
              size="sm"
              className="hidden sm:inline-flex"
            >
              <CheckSquare size={16} className="mr-1.5" /> Submit
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-1 bg-primary transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Mobile Question Navigator (collapsible) ── */}
      {showNavigator && (
        <div className="sm:hidden bg-card border-b border-border/50 px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Questions — tap to jump
          </p>
          <div className="flex flex-wrap gap-2">
            {questions.map((qu, idx) => {
              const status = getQuestionStatus(idx);
              const isActive = idx === activeQuestion;
              return (
                <button
                  key={qu.id}
                  onClick={() => { setActiveQuestion(idx); setShowNavigator(false); }}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : status === "answered"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200 inline-block" /> Answered</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-secondary border border-border inline-block" /> Unanswered</span>
          </div>
        </div>
      )}

      {/* ── Main Layout: Question + Desktop Navigator ── */}
      <div className="max-w-5xl mx-auto px-4 mt-6 sm:flex sm:gap-6">

        {/* Desktop Navigator Sidebar */}
        <aside className="hidden sm:block w-52 shrink-0">
          <div className="sticky top-24 bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Navigator</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {questions.map((qu, idx) => {
                const status = getQuestionStatus(idx);
                const isActive = idx === activeQuestion;
                return (
                  <button
                    key={qu.id}
                    onClick={() => setActiveQuestion(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow"
                        : status === "answered"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-secondary text-muted-foreground border border-border"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1 text-xs text-muted-foreground border-t border-border/50 pt-3">
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" />Answered</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-secondary border inline-block" />Remaining</span>
                <span className="font-bold">{unansweredCount}</span>
              </div>
            </div>
            <Button onClick={() => handleSubmit(false)} loading={submitMutation.isPending} className="w-full mt-4" size="sm">
              <CheckSquare size={15} className="mr-1.5" /> Submit Test
            </Button>
          </div>
        </aside>

        {/* Question Card */}
        <div className="flex-1 min-w-0">
          <Card className="p-5 sm:p-8">
            <div className="flex gap-4 mb-6">
              <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {activeQuestion + 1}
              </span>
              <h3 className="text-lg sm:text-xl font-medium leading-relaxed">{q.question}</h3>
            </div>

            {/* Options — single column on mobile, 2 col on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:pl-12">
              {[q.opt1, q.opt2, q.opt3, q.opt4].map((opt, i) => {
                const optNum = i + 1;
                const isSelected = answers[q.id.toString()] === optNum;
                return (
                  <label
                    key={i}
                    onClick={() => handleSelect(q.id, optNum)}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all active-press select-none ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-zinc-200 hover:border-primary/50 hover:bg-zinc-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center shrink-0 ${isSelected ? "border-primary" : "border-zinc-300"}`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                    <span className={`font-medium text-sm leading-snug ${isSelected ? "text-primary" : "text-zinc-600"}`}>{opt}</span>
                  </label>
                );
              })}
            </div>
          </Card>

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between mt-4 gap-3">
            <Button
              variant="outline"
              onClick={() => setActiveQuestion(v => Math.max(0, v - 1))}
              disabled={activeQuestion === 0}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft size={18} className="mr-1" /> Previous
            </Button>

            {activeQuestion < questions.length - 1 ? (
              <Button
                onClick={() => setActiveQuestion(v => Math.min(questions.length - 1, v + 1))}
                className="flex-1 sm:flex-none"
              >
                Next <ChevronRight size={18} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={() => handleSubmit(false)}
                loading={submitMutation.isPending}
                className="flex-1 sm:flex-none"
              >
                <CheckSquare size={16} className="mr-1.5" /> Submit Test
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky Submit bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/50 p-3 z-30">
        <Button onClick={() => handleSubmit(false)} loading={submitMutation.isPending} className="w-full" size="lg">
          <CheckSquare size={18} className="mr-2" /> Submit Test ({answeredCount}/{questions.length} answered)
        </Button>
      </div>

      {/* Confirm submit modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Unanswered Questions"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
            <AlertCircle size={24} />
            <p className="font-medium">You have {unansweredCount} question{unansweredCount !== 1 ? "s" : ""} unanswered.</p>
          </div>
          <p className="text-muted-foreground">Are you sure you want to submit your test now?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Go Back</Button>
            <Button
              onClick={() => { setIsConfirmOpen(false); performSubmit(); }}
              loading={submitMutation.isPending}
            >
              Yes, Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
