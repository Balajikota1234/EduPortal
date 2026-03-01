import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { PlayCircle, Clock, FileText, CheckCircle2, ChevronLeft, Eye, Check, X } from "lucide-react";
import { SidebarLayout } from "@/components/layout";
import { Card, Button, Badge, Modal, LoadingScreen } from "@/components/ui";
import { useStudentTests } from "@/hooks/use-student";
import { useResults } from "@/hooks/use-shared";
import { format } from "date-fns";
import { buildUrl, api } from "@shared/routes";

export default function StudentDashboard() {
  const [location] = useLocation();
  const isTestsPage = location === "/student/tests";
  const isResultsPage = location === "/student/results";
  const isDashboard = location === "/student";

  const { data: tests, isLoading: testsLoading } = useStudentTests();
  const { data: results, isLoading: resultsLoading } = useResults();

  const [reviewResultId, setReviewTestId] = useState<number | null>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    if (reviewResultId) {
      setLoadingReview(true);
      fetch(buildUrl(api.student.tests.review.path, { resultId: reviewResultId }), { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          setReviewData(data);
          setLoadingReview(false);
        })
        .catch(() => setLoadingReview(false));
    } else {
      setReviewData(null);
    }
  }, [reviewResultId]);

  // Filter tests that the student hasn't taken yet
  const takenTestIds = new Set(results?.map(r => r.test?.id).filter(Boolean) || []);
  const availableTests = tests?.filter(t => !takenTestIds.has(t.id) && t.isPublished) || [];

  const renderTests = () => (
    <section>
      <h2 className="text-2xl font-display font-semibold flex items-center gap-2 mb-6">
        <FileText size={24} className="text-primary" /> Available Tests
      </h2>
      {testsLoading ? (
        <p className="text-muted-foreground">Loading tests...</p>
      ) : availableTests.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed border-2">No new tests available.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTests.map(test => (
            <Card key={test.id} className="p-6 flex flex-col justify-between">
              <div>
                <Badge className="mb-3">{test.subject}</Badge>
                <h3 className="text-xl font-bold mb-2">{test.title}</h3>
                <div className="flex items-center text-muted-foreground text-sm mb-6">
                  <Clock size={16} className="mr-1" /> {test.duration} Minutes
                </div>
              </div>
              <Link href={`/student/tests/${test.id}`}>
                <Button className="w-full"><PlayCircle size={18} className="mr-2" /> Start Test</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </section>
  );

  const renderResults = () => {
    const displayResults = isDashboard ? results?.slice(0, 2) : results;

    return (
      <section>
        <h2 className="text-2xl font-display font-semibold flex items-center gap-2 mb-6">
          <CheckCircle2 size={24} className="text-emerald-500" /> {isDashboard ? "Recent Results" : "Completed Tests"}
        </h2>
        {resultsLoading ? (
           <p className="text-muted-foreground">Loading results...</p>
        ) : !displayResults || displayResults.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed border-2">
            {isDashboard ? "No recent results." : "You haven't completed any tests yet."}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayResults.map(item => {
              const maxPossible = item.result.totalQuestions * (item.test?.correctPoints || 4);
              const percentage = Math.round((item.result.score / maxPossible) * 100);
              const isGood = percentage >= 70;
              
              const totalScore = item.result.score;
              const answered = item.result.answeredQuestions || 0;
              const wrong = item.result.wrongQuestions || 0;
              const unanswered = item.result.unansweredQuestions || 0;
              const correctCount = answered - wrong;
              
              return (
                <Card key={item.result.id} className="p-6 flex flex-col gap-4 hover-elevate transition-all border-l-4 border-l-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{item.test?.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{item.test?.subject}</p>
                      <p className="text-xs text-muted-foreground flex items-center"><Clock size={12} className="mr-1" /> {Math.round(item.result.timeTaken / 60)} min taken</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(item.result.createdAt), "MMM d, yyyy h:mm a")}</p>
                    </div>
                    <div className="text-right">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 mb-1 ${isGood ? 'border-emerald-500 text-emerald-600' : 'border-amber-500 text-amber-600'}`}>
                        <span className="text-xl font-bold">{totalScore}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Out of {item.test?.totalMarks || 100}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-border/50">
                    <div className="bg-emerald-50 p-2 rounded-lg text-center">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">Correct</p>
                      <p className="text-lg font-bold text-emerald-700">{correctCount}</p>
                    </div>
                    <div className="bg-destructive/10 p-2 rounded-lg text-center">
                      <p className="text-[10px] text-destructive font-bold uppercase">Wrong</p>
                      <p className="text-lg font-bold text-destructive">{wrong}</p>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg text-center">
                      <p className="text-[10px] text-amber-600 font-bold uppercase">Unanswered</p>
                      <p className="text-lg font-bold text-amber-700">{unanswered}</p>
                    </div>
                    <div className="bg-secondary/50 p-2 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Answered</p>
                      <p className="text-lg font-bold text-foreground">{answered}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setReviewTestId(item.result.id)}>
                    <Eye size={16} className="mr-2" /> Review Questions
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        <Modal 
          isOpen={!!reviewResultId} 
          onClose={() => setReviewTestId(null)} 
          title={`Review Results`}
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {loadingReview ? <p>Loading review...</p> : reviewData?.questions?.map((q: any, idx: number) => {
              const studentAnswers = reviewData.result.answers ? JSON.parse(reviewData.result.answers) : {};
              const studentChoice = studentAnswers[q.id.toString()];
              const isCorrect = studentChoice === q.correctOpt;
              
              return (
                <div key={q.id} className={`p-4 rounded-xl border-2 space-y-3 ${isCorrect ? 'border-emerald-100 bg-emerald-50/30' : studentChoice ? 'border-destructive/10 bg-destructive/5' : 'border-zinc-100 bg-zinc-50/30'}`}>
                  <div className="flex gap-3">
                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-emerald-500 text-white' : studentChoice ? 'bg-destructive text-white' : 'bg-zinc-300 text-zinc-600'}`}>{idx + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{q.question}</p>
                      {studentChoice ? (
                        isCorrect ? (
                          <p className="text-xs text-emerald-600 font-bold flex items-center mt-1"><Check size={12} className="mr-1"/> Correct</p>
                        ) : (
                          <p className="text-xs text-destructive font-bold flex items-center mt-1"><X size={12} className="mr-1"/> Wrong (You chose option {studentChoice})</p>
                        )
                      ) : (
                        <p className="text-xs text-amber-600 font-bold mt-1">Unanswered</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                    {[q.opt1, q.opt2, q.opt3, q.opt4].map((opt, i) => {
                      const optNum = i + 1;
                      const isStudentChoice = studentChoice === optNum;
                      const isCorrectChoice = q.correctOpt === optNum;
                      
                      let bgClass = "bg-white border-zinc-200";
                      if (isCorrectChoice) bgClass = "bg-emerald-500/10 border-emerald-500 text-emerald-700";
                      else if (isStudentChoice) bgClass = "bg-destructive/10 border-destructive text-destructive";

                      return (
                        <div key={i} className={`text-sm p-2 rounded-lg border flex items-center justify-between ${bgClass}`}>
                          <span>{opt}</span>
                          {isCorrectChoice && <Check size={14} className="text-emerald-600" />}
                          {isStudentChoice && !isCorrectChoice && <X size={14} className="text-destructive" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      </section>
    );
  };

  return (
    <SidebarLayout role="student">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold text-foreground">
          {isTestsPage ? "Available Tests" : isResultsPage ? "My Results" : "Student Portal"}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {isTestsPage ? "Choose a test to start" : isResultsPage ? "Review your performance" : "Take tests and review your performance"}
        </p>
      </div>

      <div className="space-y-12">
        {(isDashboard || isTestsPage) && renderTests()}
        {(isDashboard || isResultsPage) && renderResults()}
      </div>
    </SidebarLayout>
  );
}
