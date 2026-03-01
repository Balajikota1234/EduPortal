import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Clock, CheckSquare, AlertCircle } from "lucide-react";
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

  const handleSelect = (questionId: number, optionIndex: number) => {
    setAnswers(prev => {
      const current = prev[questionId.toString()];
      if (current === optionIndex) {
        // Unchoose if clicking the same option
        const newAnswers = { ...prev };
        delete newAnswers[questionId.toString()];
        return newAnswers;
      }
      return { ...prev, [questionId.toString()]: optionIndex };
    });
  };

  const handleSubmit = (auto = false) => {
    if (submitMutation.isPending) return;
    
    const unansweredCount = questions.length - Object.keys(answers).length;
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
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">{test.title}</h1>
            <p className="text-sm text-muted-foreground">{test.subject}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 text-lg font-bold px-4 py-2 rounded-xl ${timeLeft && timeLeft < 300 ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-foreground'}`}>
              <Clock size={20} />
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </div>
            <Button onClick={() => handleSubmit(false)} loading={submitMutation.isPending} size="lg" className="hover-elevate">
              <CheckSquare className="mr-2" size={20} /> Submit Test
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-10 space-y-8">
        {questions.map((q, idx) => (
          <Card key={q.id} className="p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="flex gap-4 mb-6">
              <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{idx + 1}</span>
              <h3 className="text-xl font-medium leading-relaxed">{q.question}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
              {[q.opt1, q.opt2, q.opt3, q.opt4].map((opt, i) => {
                const optNum = i + 1;
                const isSelected = answers[q.id.toString()] === optNum;
                return (
                  <label 
                    key={i} 
                    onClick={() => handleSelect(q.id, optNum)}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all active-press ${isSelected ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:border-primary/50 hover:bg-zinc-100/50'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-zinc-300'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-primary' : 'text-zinc-600'}`}>{opt}</span>
                  </label>
                )
              })}
            </div>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        title="Unanswered Questions"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
            <AlertCircle size={24} />
            <p className="font-medium">You have {questions.length - Object.keys(answers).length} questions left unanswered.</p>
          </div>
          <p className="text-muted-foreground">Are you sure you want to submit your test now?</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Go Back</Button>
            <Button onClick={() => { setIsConfirmOpen(false); performSubmit(); }} loading={submitMutation.isPending}>
              Yes, Submit Anyway
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
