import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Edit2, Trash2, ListChecks, Clock, Activity, ChevronDown, ChevronUp, AlertCircle, Send, Download, FileText } from "lucide-react";
import { SidebarLayout } from "@/components/layout";
import { Card, Button, Badge, Modal, Input, Label } from "@/components/ui";
import { useTests, useCreateTest, useUpdateTest, useDeleteTest } from "@/hooks/use-teacher";
import { useResults } from "@/hooks/use-shared";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function TeacherDashboard() {
  const [location] = useLocation();
  const isTestsPage = location === "/teacher/tests";
  const isReportsPage = location === "/teacher/reports";
  const isDashboard = location === "/teacher";

  const { data: tests, isLoading: testsLoading } = useTests();
  const { data: results, isLoading: resultsLoading } = useResults();
  const { toast } = useToast();
  
  const createMutation = useCreateTest();
  const updateMutation = useUpdateTest();
  const deleteMutation = useDeleteTest();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<number | null>(null);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [expandedTests, setExpandedTests] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState({ title: "", subject: "", duration: 30, targetGroups: [] as string[], correctPoints: 4, wrongPoints: -1, totalMarks: 100 });

  const toggleTest = (id: number) => {
    setExpandedTests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGroupToggle = (group: string) => {
    setForm(prev => {
      const groups = prev.targetGroups.includes(group)
        ? prev.targetGroups.filter(g => g !== group)
        : [...prev.targetGroups, group];
      return { ...prev, targetGroups: groups };
    });
  };

  const handlePublishToggle = (test: any) => {
    updateMutation.mutate({ id: test.id, isPublished: !test.isPublished }, {
      onSuccess: () => {
        toast({ 
          title: test.isPublished ? "Test Unpublished" : "Test Published", 
          description: test.isPublished ? "Students can no longer see this test." : "Students can now see and take this test." 
        });
      }
    });
  };

  const downloadResults = (testId: number, testTitle: string) => {
    if (!results) return;
    const testResults = results.filter(r => r.test.id === testId);
    if (testResults.length === 0) {
      toast({ title: "No Results", description: "There are no student results to download for this test.", variant: "destructive" });
      return;
    }

    const headers = ["Student", "Date", "Aquired Marks", "Total Marks", "Correct", "Wrong", "Unanswered", "Time Taken (min)"];
    const rows = testResults.map(r => {
      const currentTest = tests?.find(t => t.id === testId);
      return [
        r.student.username,
        format(new Date(r.result.createdAt), "yyyy-MM-dd HH:mm"),
        r.result.score,
        currentTest?.totalMarks ?? 100,
        Math.floor(r.result.score / (currentTest?.correctPoints ?? 4)),
        r.result.wrongQuestions || 0,
        r.result.unansweredQuestions || 0,
        Math.round(r.result.timeTaken / 60)
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${testTitle.replace(/\s+/g, '_')}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCreate = () => {
    setEditingTest(null);
    setForm({ title: "", subject: "", duration: 30, targetGroups: [], correctPoints: 4, wrongPoints: -1, totalMarks: 100 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (test: any) => {
    setEditingTest(test);
    setForm({ 
      title: test.title, 
      subject: test.subject, 
      duration: test.duration,
      targetGroups: test.targetGroups || [],
      correctPoints: test.correctPoints ?? 4,
      wrongPoints: test.wrongPoints ?? -1,
      totalMarks: test.totalMarks ?? 100
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setTestToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (testToDelete) {
      deleteMutation.mutate(testToDelete, {
        onSuccess: () => {
          setIsDeleteConfirmOpen(false);
          toast({ title: "Test Deleted", description: "The test has been removed successfully." });
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const testData = { 
      ...form, 
      duration: Number(form.duration),
      correctPoints: Number(form.correctPoints),
      wrongPoints: Number(form.wrongPoints),
      totalMarks: Number(form.totalMarks)
    };
    if (editingTest) {
      updateMutation.mutate({ id: editingTest.id, ...testData }, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast({ title: "Test Updated", description: "Changes saved successfully." });
        }
      });
    } else {
      createMutation.mutate(testData, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast({ title: "Test Created", description: "New test is now available." });
        }
      });
    }
  };

  const renderTests = () => {
    const displayTests = isDashboard 
      ? tests?.filter(t => !t.isPublished)
      : tests;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
          <FileText size={24} className="text-primary" /> {isDashboard ? "Recent & Unpublished Tests" : "My Tests"}
        </h2>
        {testsLoading ? (
          <p className="text-muted-foreground">Loading tests...</p>
        ) : displayTests?.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed border-2">No tests to show.</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayTests?.map(test => (
              <Card key={test.id} className="p-6 hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{test.title}</h3>
                    <p className="text-sm text-muted-foreground">{test.subject}</p>
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex gap-2">
                        {test.targetGroups?.map(g => (
                          <Badge key={g} variant="outline" className="text-[10px] capitalize">{g}</Badge>
                        ))}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">
                        Score: +{test.correctPoints ?? 4} / {test.wrongPoints ?? -1} | Total: {test.totalMarks ?? 100}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary"><Clock size={14} className="mr-1 inline" /> {test.duration} min</Badge>
                </div>
                <div className="flex gap-2 pt-4 border-t border-border/50 mt-4">
                  <Link href={`/teacher/tests/${test.id}/questions`} className="flex-1">
                    <Button variant="outline" className="w-full active-press"><ListChecks size={16} className="mr-2" /> Questions</Button>
                  </Link>
                  <Button 
                    variant={test.isPublished ? "secondary" : "default"} 
                    size="icon" 
                    onClick={() => handlePublishToggle(test)}
                    title={test.isPublished ? "Unpublish Test" : "Publish Test"}
                    className="active-press"
                  >
                    <Send size={18} className={test.isPublished ? "text-primary" : ""} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(test)} className="active-press"><Edit2 size={18} /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 active-press" onClick={() => handleDeleteClick(test.id)}><Trash2 size={18} /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderReports = () => {
    if (isDashboard) return null;
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
          <Activity size={24} className="text-primary" /> Test Reports
        </h2>
        {resultsLoading ? (
           <p className="text-muted-foreground">Loading reports...</p>
        ) : !results || results.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed border-2">No student reports yet.</Card>
        ) : (
          <div className="space-y-6">
            {(() => {
              const grouped = results.reduce((acc: any, item) => {
                const testId = item.test.id;
                if (!acc[testId]) acc[testId] = { test: item.test, reports: [] };
                acc[testId].reports.push(item);
                return acc;
              }, {});

              return Object.values(grouped).map((group: any) => {
                const isExpanded = expandedTests[group.test.id];
                return (
                  <div key={group.test.id} className="space-y-3">
                    <button 
                      onClick={() => toggleTest(group.test.id)}
                      className="w-full flex items-center gap-2 px-4 py-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors"
                    >
                      <Badge variant="outline">{group.test.subject}</Badge>
                      <h3 className="font-bold text-lg">{group.test.title}</h3>
                      <span className="text-xs text-muted-foreground ml-auto">{group.reports.length} submissions</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); downloadResults(group.test.id, group.test.title); }}
                        className="ml-2 hover:bg-primary/10 text-primary"
                      >
                        <Download size={16} className="mr-1" /> Export
                      </Button>
                      {isExpanded ? <ChevronUp size={20} className="ml-2" /> : <ChevronDown size={20} className="ml-2" />}
                    </button>
                    
                    <div className={`grid grid-cols-1 gap-2 overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      {group.reports.map((item: any) => (
                        <Card key={item.result.id} className="p-4 flex items-center justify-between bg-white hover:bg-zinc-50 transition-all hover:scale-[1.01] hover:shadow-sm">
                          <div>
                            <h4 className="font-semibold text-zinc-900">{item.student?.username}</h4>
                            <p className="text-xs text-muted-foreground">{format(new Date(item.result.createdAt), "MMM d, h:mm a")}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{item.result.score} <span className="text-sm text-muted-foreground font-normal">/ {item.test.totalMarks ?? 100}</span></div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <SidebarLayout role="teacher">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">
            {isTestsPage ? "Manage Tests" : isReportsPage ? "Student Reports" : "Teacher Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {isTestsPage ? "Create and manage your tests" : isReportsPage ? "View student performance" : "Manage tests and view student performance"}
          </p>
        </div>
        {(isDashboard || isTestsPage) && (
          <Button onClick={handleOpenCreate} className="hover-elevate">
            <Plus size={20} className="mr-2" /> Create Test
          </Button>
        )}
      </div>

      <div className={`grid grid-cols-1 ${isDashboard ? 'lg:grid-cols-2' : ''} gap-8`}>
        {(isDashboard || isTestsPage) && renderTests()}
        {(isDashboard || isReportsPage) && renderReports()}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTest ? "Edit Test" : "Create Test"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Test Title</Label>
            <Input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Midterm Math Quiz" />
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="e.g. Mathematics" />
          </div>
          <div className="space-y-2">
            <Label>Duration (Minutes)</Label>
            <Input required type="number" min="1" value={form.duration} onChange={e => setForm({...form, duration: e.target.value as any})} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Correct Points</Label>
              <Input required type="number" value={form.correctPoints} onChange={e => setForm({...form, correctPoints: e.target.value as any})} />
            </div>
            <div className="space-y-2">
              <Label>Wrong Points</Label>
              <Input required type="number" value={form.wrongPoints} onChange={e => setForm({...form, wrongPoints: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Total Marks</Label>
              <Input required type="number" value={form.totalMarks} onChange={e => setForm({...form, totalMarks: e.target.value as any})} />
            </div>
          </div>
          <div className="space-y-3">
            <Label>Target Groups</Label>
            <div className="flex flex-wrap gap-2">
              {["eamcet", "iit", "neet", "defence"].map(group => (
                <Button
                  key={group}
                  type="button"
                  variant={form.targetGroups.includes(group) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleGroupToggle(group)}
                  className="capitalize"
                >
                  {group}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Select one or more groups that should see this test. If none selected, all students see it.</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingTest ? "Save Changes" : "Create Test"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isDeleteConfirmOpen} 
        onClose={() => setIsDeleteConfirmOpen(false)} 
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20">
            <AlertCircle size={24} />
            <p className="font-medium">This action cannot be undone.</p>
          </div>
          <p className="text-muted-foreground">Are you sure you want to delete this test and all associated questions and results?</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} loading={deleteMutation.isPending}>
              Delete Test
            </Button>
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  );
}

function FileTextIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
}
