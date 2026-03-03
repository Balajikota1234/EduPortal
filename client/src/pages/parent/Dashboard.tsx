import { SidebarLayout } from "@/components/layout";
import { Card } from "@/components/ui";
import { useResults, useMarkResultRead } from "@/hooks/use-shared";
import { format } from "date-fns";
import { Activity, Bell } from "lucide-react";
import { useEffect } from "react";

export default function ParentDashboard() {
  const { data: results, isLoading } = useResults();
  const markRead = useMarkResultRead();

  // Mark all unread results as read when viewed
  useEffect(() => {
    if (results) {
      results.forEach(item => {
        if (!item.result.isRead) {
          markRead.mutate(item.result.id);
        }
      });
    }
  }, [results, markRead]);

  return (
    <SidebarLayout role="parent">
      <div className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-display font-bold text-foreground">Parent Portal</h1>
        <p className="text-muted-foreground mt-1 text-base sm:text-lg">Track your child's academic progress</p>
      </div>

      <h2 className="text-xl sm:text-2xl font-display font-semibold flex items-center gap-2 mb-6">
        <Activity size={24} className="text-primary" /> Academic Reports
      </h2>

      {isLoading ? (
        <p className="text-muted-foreground">Loading reports...</p>
      ) : results?.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground border-dashed border-2">No test reports available yet.</Card>
      ) : (
        <div className="space-y-4">
          {results?.map(item => {
            const percentage = Math.round((item.result.score / item.result.totalQuestions) * 100);
            return (
              <Card key={item.result.id} className={`p-4 sm:p-6 relative overflow-hidden transition-all duration-300 ${!item.result.isRead ? 'ring-2 ring-primary/20' : ''}`}>
                {!item.result.isRead && (
                  <div className="absolute top-4 right-4 flex items-center text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded-full">
                    <Bell size={12} className="mr-1" /> NEW
                  </div>
                )}
                <div className="flex flex-col sm:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-zinc-900">{item.test.title}</h3>
                    <p className="text-sm font-medium text-primary mb-2">{item.test.subject}</p>
                    <p className="text-sm text-muted-foreground">Completed: {format(new Date(item.result.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
                    <p className="text-sm text-muted-foreground">Student: {item.student.username}</p>
                  </div>
                  
                  <div className="flex gap-8 items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Aquired Marks</p>
                      <p className="text-2xl font-display font-bold text-zinc-900">{item.result.score} <span className="text-sm text-zinc-400 font-medium">/ {item.test.totalMarks || 100}</span></p>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </SidebarLayout>
  );
}
